import SwiftUI
import PhotosUI
import CryptoKit
import UIKit
import Vision
import VisionKit

// Camera / receipt capture. Presented as a sheet from the Library toolbar.
// Two entry points share one flow: a "receipt" defaults to the camera (a scan),
// a "photo" defaults to the library. The camera is offered only where it exists
// (the simulator has none), so the PhotosPicker path is always available.

enum CaptureKind {
    case receipt, photo

    var fileType: String { self == .receipt ? "receipt" : "photo" }
    var title: String { self == .receipt ? "Scan Receipt" : "Identify Item" }
    var heroSymbol: String { self == .receipt ? "doc.text.viewfinder" : "viewfinder" }
    var prefersCamera: Bool { self == .receipt }
}

struct CaptureView: View {
    @Environment(SupabaseService.self) private var supabase
    @Environment(\.dismiss) private var dismiss

    let kind: CaptureKind
    let homeID: String
    var onOpenItem: ((String) -> Void)? = nil
    let onSaved: () async -> Void

    private enum Phase {
        case choosing, uploading, resolving, analyzing(String?), done, delayed, duplicate, failed
        case identified(String), review(ScanSuggestion), noMatch
    }

    @State private var phase: Phase = .choosing
    @State private var message: String?
    @State private var photoItem: PhotosPickerItem?
    @State private var showCamera = false
    @State private var showLiveScanner = false
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
            .fullScreenCover(isPresented: $showLiveScanner) {
                LiveItemScanner { image, evidence in
                    showLiveScanner = false
                    if let itemID = evidence?.homeOSItemID {
                        dismiss()
                        onOpenItem?(itemID)
                    } else if let image { Task { await handle(image, liveEvidence: evidence) } }
                }
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
                     : "Photograph an item, data plate, QR code, or barcode and we'll identify what we can.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                VStack(spacing: 12) {
                    if cameraAvailable {
                        Button { openCamera() } label: {
                            Label(kind == .photo ? "Scan Live" : "Take Photo", systemImage: "camera.fill").frame(maxWidth: .infinity)
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
                Text("Saving photo…").font(.subheadline).foregroundStyle(.secondary)
            }

        case .resolving:
            VStack(spacing: 14) {
                ProgressView().tint(Color.homeNavy)
                Text("Saving your choice…").font(.subheadline).foregroundStyle(.secondary)
            }

        case .analyzing(let code):
            VStack(spacing: 14) {
                ProgressView().tint(Color.homeNavy)
                Text("Identifying item…").font(.headline).foregroundStyle(Color.homeInk)
                Text(code.map { "Code detected: \($0)\nChecking the photo and label details. This usually takes 10–30 seconds." }
                     ?? "Checking the photo, label text, and product details. This usually takes 10–30 seconds.")
                    .font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
            }

        case .done:
            result(icon: "checkmark.circle.fill", tint: .green,
                   title: "Saved to your Library",
                   subtitle: kind == .receipt ? "HomeOS is reading the receipt now." : "The photo is saved with your home records.")

        case .delayed:
            result(icon: "clock", tint: Color.homeNavy,
                   title: "Still identifying this item",
                   subtitle: "The photo and code are saved safely. HomeOS will finish processing them in your Library.")

        case .identified(let name):
            result(icon: "checkmark.circle.fill", tint: .green,
                   title: "Matched to \(name)",
                   subtitle: "The photo and detected code are now attached to this item.")

        case .review(let suggestion):
            reviewResult(suggestion)

        case .noMatch:
            result(icon: "questionmark.circle", tint: Color.homeNavy,
                   title: "We couldn’t identify the item yet",
                   subtitle: "The photo is saved. Try the manufacturer label or data plate, with the model number filling the frame.")

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

    private func reviewResult(_ suggestion: ScanSuggestion) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "sparkles").font(.largeTitle).foregroundStyle(Color.homeNavy)
            Text("Item identified").font(.headline).foregroundStyle(Color.homeInk)
            Text(suggestion.summary).font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
            Button("Add this item") { Task { await resolve(suggestion, accept: true) } }
                .buttonStyle(.borderedProminent).controlSize(.large).tint(Color.homeNavy)
            Button("Not this item") { Task { await resolve(suggestion, accept: false) } }
                .buttonStyle(.bordered).controlSize(.large).tint(Color.homeNavy)
        }
    }

    // MARK: - Flow

    private func presentInitialSource() {
        if kind.prefersCamera && cameraAvailable {
            showCamera = true
        } else if kind == .photo && DataScannerViewController.isSupported && DataScannerViewController.isAvailable {
            showLiveScanner = true
        } else {
            showLibrary = true
        }
    }

    private func openCamera() {
        if kind == .photo && DataScannerViewController.isSupported && DataScannerViewController.isAvailable {
            showLiveScanner = true
        } else {
            showCamera = true
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
    private func handle(_ image: UIImage, liveEvidence: LiveScanEvidence? = nil) async {
        phase = .uploading
        message = nil
        guard let jpeg = Self.downscaledJPEG(image) else {
            phase = .failed
            message = "Couldn't process that image."
            return
        }
        let hash = Self.sha256Hex(jpeg)
        let name = Self.captureName(kind: kind)
        let code = liveEvidence?.code ?? Self.detectBarcode(in: image)
        var metadata: [String: String] = [:]
        if let code {
            metadata["scan_code"] = code.value
            metadata["scan_format"] = code.format
        }
        if let text = liveEvidence?.text, !text.isEmpty {
            metadata["scan_text"] = String(text.prefix(4000))
        }
        do {
            let path = try await supabase.uploadReceipt(data: jpeg, homeID: homeID)
            do {
                let fileId = try await supabase.insertFile(
                    homeID: homeID, name: name, type: kind.fileType,
                    storagePath: path, contentHash: hash,
                    extractionStatus: "pending", metadata: metadata
                )
                try await supabase.ingestRemote(fileId: fileId)
                savedTick += 1
                if kind == .photo {
                    phase = .analyzing(code.map { String($0.value.prefix(80)) })
                    await waitForScanOutcome(fileId: fileId)
                } else {
                    phase = .done
                }
            } catch is IngestError {
                try? await supabase.removeFile(path: path)          // drop the orphaned duplicate
                phase = .duplicate
            }
        } catch {
            phase = .failed
            message = error.localizedDescription
        }
    }

    @MainActor
    private func waitForScanOutcome(fileId: String) async {
        for _ in 0..<18 {
            try? await Task.sleep(for: .seconds(2))
            do {
                switch try await supabase.scanOutcome(fileId: fileId) {
                case .processing: continue
                case .matched(let itemName): phase = .identified(itemName)
                case .needsReview(let suggestion): phase = .review(suggestion)
                case .noMatch: phase = .noMatch
                case .failed:
                    phase = .failed
                    message = "HomeOS saved the photo but couldn’t analyze it. Try scanning the label again."
                }
                return
            } catch {
                // A transient poll failure should not discard the successfully saved photo.
                continue
            }
        }
        phase = .delayed
    }

    @MainActor
    private func resolve(_ suggestion: ScanSuggestion, accept: Bool) async {
        phase = .resolving
        do {
            try await supabase.resolveScanSuggestion(id: suggestion.id, accept: accept)
            savedTick += 1
            if accept {
                let cleaned = suggestion.summary
                    .replacingOccurrences(of: "Add \"", with: "")
                    .replacingOccurrences(of: "\" to your Library?", with: "")
                phase = .identified(cleaned)
            } else {
                phase = .noMatch
            }
        } catch {
            phase = .failed
            message = "Couldn’t save that choice. Please try again."
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

    /// Vision reads QR/UPC/EAN/Data Matrix and similar codes from the still image.
    static func detectBarcode(in image: UIImage) -> (value: String, format: String)? {
        guard let cgImage = image.cgImage else { return nil }
        let request = VNDetectBarcodesRequest()
        try? VNImageRequestHandler(cgImage: cgImage, orientation: .up).perform([request])
        guard let hit = request.results?.first, let value = hit.payloadStringValue else { return nil }
        return (value, hit.symbology.rawValue)
    }

    /// "Receipt · Jul 12, 2026" — no em dash (house rule); the middle dot matches
    /// the app's existing separator style.
    static func captureName(kind: CaptureKind) -> String {
        let df = DateFormatter()
        df.locale = Locale(identifier: "en_US_POSIX")
        df.dateFormat = "MMM d, yyyy"
        let day = df.string(from: Date())
        return "\(kind == .receipt ? "Receipt" : "Item scan") · \(day)"
    }
}

struct LiveScanEvidence {
    let code: (value: String, format: String)?
    let text: String
    var homeOSItemID: String? { code.flatMap { HomeOSCode.itemID(from: $0.value) } }
}

private enum HomeOSCode {
    static func itemID(from value: String) -> String? {
        guard let url = URL(string: value) else { return nil }
        let parts = url.pathComponents.filter { $0 != "/" }
        guard parts.count == 3, parts[0] == "library", parts[1] == "item", UUID(uuidString: parts[2]) != nil else { return nil }
        return parts[2]
    }
}

/// Full-screen live text/code scanner. The user confirms the frame before HomeOS analyzes it.
private struct LiveItemScanner: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var model = LiveItemScannerModel()
    let onCapture: (UIImage?, LiveScanEvidence?) -> Void

    var body: some View {
        ZStack {
            LiveScannerController(model: model).ignoresSafeArea()
            VStack {
                HStack {
                    Button { onCapture(nil, nil); dismiss() } label: {
                        Image(systemName: "xmark").font(.headline).padding(12).background(.ultraThinMaterial, in: Circle())
                    }
                    Spacer()
                    Text(model.status).font(.caption.weight(.semibold)).padding(.horizontal, 12).padding(.vertical, 8).background(.ultraThinMaterial, in: Capsule())
                }.padding()
                Spacer()
                VStack(spacing: 12) {
                    if let preview = model.preview {
                        Text(preview).font(.caption).lineLimit(2).multilineTextAlignment(.center).padding(.horizontal, 14).padding(.vertical, 9).background(.ultraThinMaterial, in: Capsule())
                    }
                    Button {
                        Task {
                            let image = model.evidence.homeOSItemID == nil ? try? await model.scanner.capturePhoto() : nil
                            model.scanner.stopScanning()
                            onCapture(image, model.evidence)
                        }
                    } label: {
                        if model.evidence.homeOSItemID != nil {
                            Label("Open saved item", systemImage: "house.fill").font(.headline).padding(.horizontal, 20).frame(minHeight: 52).background(.white, in: Capsule()).foregroundStyle(Color.homeNavy)
                        } else {
                            ZStack { Circle().fill(.white).frame(width: 72, height: 72); Circle().stroke(.black.opacity(0.25), lineWidth: 3).frame(width: 62, height: 62) }
                        }
                    }
                    .accessibilityLabel(model.evidence.homeOSItemID != nil ? "Open saved item" : "Capture item")
                    Text(model.evidence.homeOSItemID != nil ? "HomeOS label found" : model.latestCodeFound ? "Code found. Capture to identify this device." : "Hold the label steady, then capture").font(.caption).foregroundStyle(.white).shadow(radius: 2)
                }.padding(.bottom, 28)
            }
        }
        .task { model.start() }
        .onDisappear { model.scanner.stopScanning() }
    }
}

@MainActor private final class LiveItemScannerModel: NSObject, ObservableObject, DataScannerViewControllerDelegate {
    @Published var preview: String?
    @Published var status = "Looking for label or code"
    private var latestText = ""
    private var latestCode: (value: String, format: String)?

    lazy var scanner: DataScannerViewController = {
        let controller = DataScannerViewController(
            recognizedDataTypes: [.text(languages: ["en-US"]), .barcode()],
            qualityLevel: .accurate,
            recognizesMultipleItems: true,
            isHighFrameRateTrackingEnabled: true,
            isPinchToZoomEnabled: true,
            // HomeOS provides its own single status pill; Apple's guidance occupies
            // the same top-center space and the two labels overlap on a phone.
            isGuidanceEnabled: false,
            isHighlightingEnabled: true
        )
        controller.delegate = self
        return controller
    }()

    var evidence: LiveScanEvidence { LiveScanEvidence(code: latestCode, text: latestText) }
    var latestCodeFound: Bool { latestCode != nil }
    func start() { try? scanner.startScanning() }
    func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) { update(allItems) }
    func dataScanner(_ dataScanner: DataScannerViewController, didUpdate updatedItems: [RecognizedItem], allItems: [RecognizedItem]) { update(allItems) }

    private func update(_ items: [RecognizedItem]) {
        var texts: [String] = []
        var code: (String, String)?
        for item in items {
            switch item {
            case .text(let text): texts.append(text.transcript)
            case .barcode(let barcode):
                if let value = barcode.payloadStringValue { code = (value, barcode.observation.symbology.rawValue) }
            @unknown default: break
            }
        }
        latestText = texts.joined(separator: " ")
        latestCode = code
        preview = code?.0 ?? texts.prefix(3).joined(separator: " · ")
        status = code != nil ? "Code detected" : texts.isEmpty ? "Looking for label or code" : "Label text detected"
    }
}

private struct LiveScannerController: UIViewControllerRepresentable {
    let model: LiveItemScannerModel
    func makeUIViewController(context: Context) -> DataScannerViewController { model.scanner }
    func updateUIViewController(_ uiViewController: DataScannerViewController, context: Context) {}
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
