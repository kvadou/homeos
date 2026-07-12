import SwiftUI
import PhotosUI
import CryptoKit
import UIKit

// Camera / receipt capture. Presented as a sheet from the Library toolbar.
// Two entry points share one flow: a "receipt" defaults to the camera (a scan),
// a "photo" defaults to the library. The camera is offered only where it exists
// (the simulator has none), so the PhotosPicker path is always available.

enum CaptureKind {
    case receipt, photo

    var fileType: String { self == .receipt ? "receipt" : "photo" }
    var title: String { self == .receipt ? "Scan Receipt" : "Add Photo" }
    var heroSymbol: String { self == .receipt ? "doc.text.viewfinder" : "photo.on.rectangle.angled" }
    var prefersCamera: Bool { self == .receipt }
}

struct CaptureView: View {
    @Environment(SupabaseService.self) private var supabase
    @Environment(\.dismiss) private var dismiss

    let kind: CaptureKind
    let homeID: String
    let onSaved: () async -> Void

    private enum Phase { case choosing, uploading, done, duplicate, failed }

    @State private var phase: Phase = .choosing
    @State private var message: String?
    @State private var photoItem: PhotosPickerItem?
    @State private var showCamera = false
    @State private var showLibrary = false
    @State private var savedTick = 0   // .success haptic trigger

    private var cameraAvailable: Bool { UIImagePickerController.isSourceTypeAvailable(.camera) }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.homeCanvas.ignoresSafeArea()
                content.padding(.horizontal, 32)
            }
            .navigationTitle(kind.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
            .fullScreenCover(isPresented: $showCamera) {
                CameraPicker { picked in
                    showCamera = false
                    if let picked { Task { await handle(picked) } }
                }
                .ignoresSafeArea()
            }
            .photosPicker(isPresented: $showLibrary, selection: $photoItem, matching: .images)
            .onChange(of: photoItem) { _, item in
                guard let item else { return }
                Task { await loadFromLibrary(item) }
            }
            .task { presentInitialSource() }
            .sensoryFeedback(.success, trigger: savedTick)
        }
        .presentationDetents([.medium, .large])
    }

    @ViewBuilder private var content: some View {
        switch phase {
        case .choosing:
            VStack(spacing: 22) {
                Image(systemName: kind.heroSymbol)
                    .font(.largeTitle)
                    .foregroundStyle(Color.homeNavy)
                Text(kind == .receipt
                     ? "Snap a receipt and we'll file it, then pull out the vendor, cost, and warranty automatically."
                     : "Add a photo to your home's records.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                VStack(spacing: 12) {
                    if cameraAvailable {
                        Button { showCamera = true } label: {
                            Label("Take Photo", systemImage: "camera.fill").frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .controlSize(.large)
                        .tint(Color.homeNavy)
                    }
                    Button { showLibrary = true } label: {
                        Label("Choose from Library", systemImage: "photo.on.rectangle").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                    .tint(Color.homeNavy)
                }
            }

        case .uploading:
            VStack(spacing: 14) {
                ProgressView().tint(Color.homeNavy)
                Text("Saving…").font(.subheadline).foregroundStyle(.secondary)
            }

        case .done:
            result(icon: "checkmark.circle.fill", tint: .green,
                   title: "Saved to your Library",
                   subtitle: kind == .receipt ? "Processing…" : "Added to your documents.")

        case .duplicate:
            result(icon: "checkmark.seal.fill", tint: Color.homeNavy,
                   title: "Already in your Library",
                   subtitle: "This exact file is already saved, nothing to add.")

        case .failed:
            result(icon: "exclamationmark.triangle.fill", tint: .orange,
                   title: "Couldn't save that", subtitle: message ?? "Please try again.")
        }
    }

    private func result(icon: String, tint: Color, title: String, subtitle: String) -> some View {
        VStack(spacing: 14) {
            Image(systemName: icon).font(.largeTitle).foregroundStyle(tint)
            Text(title).font(.headline).foregroundStyle(Color.homeInk)
            Text(subtitle).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
            Button("Done") { Task { await onSaved(); dismiss() } }
                .buttonStyle(.borderedProminent).controlSize(.large).tint(Color.homeNavy)
                .padding(.top, 6)
        }
    }

    // MARK: - Flow

    private func presentInitialSource() {
        if kind.prefersCamera && cameraAvailable {
            showCamera = true
        } else {
            showLibrary = true
        }
    }

    private func loadFromLibrary(_ item: PhotosPickerItem) async {
        guard let data = try? await item.loadTransferable(type: Data.self),
              let image = UIImage(data: data) else {
            phase = .failed
            message = "Couldn't read that image."
            return
        }
        await handle(image)
    }

    @MainActor
    private func handle(_ image: UIImage) async {
        phase = .uploading
        message = nil
        guard let jpeg = Self.downscaledJPEG(image) else {
            phase = .failed
            message = "Couldn't process that image."
            return
        }
        let hash = Self.sha256Hex(jpeg)
        let name = Self.captureName(kind: kind)
        do {
            let path = try await supabase.uploadReceipt(data: jpeg, homeID: homeID)
            do {
                // Web parity (lib/actions/library.ts): only receipts route through
                // extraction; photos are 'none' and skip ingest (photo vision deferred).
                let fileId = try await supabase.insertFile(
                    homeID: homeID, name: name, type: kind.fileType,
                    storagePath: path, contentHash: hash,
                    extractionStatus: kind == .receipt ? "pending" : "none"
                )
                if kind == .receipt {
                    try? await supabase.ingestRemote(fileId: fileId)   // fire-and-forget
                }
                savedTick += 1
                phase = .done
            } catch is IngestError {
                try? await supabase.removeFile(path: path)          // drop the orphaned duplicate
                phase = .duplicate
            }
        } catch {
            phase = .failed
            message = error.localizedDescription
        }
    }

    // MARK: - Image helpers

    /// Longest side capped at 2000px, JPEG 0.8 — keeps receipts legible but small
    /// enough to upload and to fit a vision call. `scale = 1` treats the target
    /// as pixels, so the output is exactly `maxSide` on its longest edge.
    static func downscaledJPEG(_ image: UIImage, maxSide: CGFloat = 2000, quality: CGFloat = 0.8) -> Data? {
        let size = image.size
        let longest = max(size.width, size.height)
        guard longest > 0 else { return nil }
        let ratio = longest > maxSide ? maxSide / longest : 1
        let target = CGSize(width: (size.width * ratio).rounded(), height: (size.height * ratio).rounded())
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        let rendered = UIGraphicsImageRenderer(size: target, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
        return rendered.jpegData(compressionQuality: quality)
    }

    /// SHA-256 hex of the JPEG bytes — must match the web's hashFile() so identical
    /// captures dedupe against uploads (lib/actions/library.ts content_hash).
    static func sha256Hex(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }

    /// "Receipt · Jul 12, 2026" — no em dash (house rule); the middle dot matches
    /// the app's existing separator style.
    static func captureName(kind: CaptureKind) -> String {
        let df = DateFormatter()
        df.locale = Locale(identifier: "en_US_POSIX")
        df.dateFormat = "MMM d, yyyy"
        let day = df.string(from: Date())
        return "\(kind == .receipt ? "Receipt" : "Photo") · \(day)"
    }
}

/// Minimal UIImagePickerController wrapper for camera capture. PhotosPicker owns
/// the library path, so this is only mounted where a camera exists.
private struct CameraPicker: UIViewControllerRepresentable {
    let onPicked: (UIImage?) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ controller: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onPicked: onPicked) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onPicked: (UIImage?) -> Void
        init(onPicked: @escaping (UIImage?) -> Void) { self.onPicked = onPicked }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            onPicked(info[.originalImage] as? UIImage)
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            onPicked(nil)
        }
    }
}
