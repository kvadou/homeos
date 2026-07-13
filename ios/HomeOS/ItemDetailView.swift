import SwiftUI
import CoreImage.CIFilterBuiltins
import UIKit

struct ItemDetailView: View {
    @Environment(SupabaseService.self) private var supabase
    @Environment(\.dismiss) private var dismiss

    // Held in State so an edit updates the detail in place. `onChange` refreshes
    // the Library list behind us after an edit or delete.
    @State private var item: Item
    let onChange: () async -> Void

    @State private var confirmingDelete = false
    @State private var deleting = false
    @State private var editing = false
    @State private var showingQR = false

    init(item: Item, onChange: @escaping () async -> Void) {
        _item = State(initialValue: item)
        self.onChange = onChange
    }

    var body: some View {
        ZStack {
            Color.homeCanvas.ignoresSafeArea()
            List {
                if let summary = item.summary, !summary.isEmpty {
                    Section {
                        Text(summary)
                            .font(.body)
                            .foregroundStyle(Color.homeInk)
                    }
                    .listRowBackground(Color.homeSurface)
                }

                Section("Details") {
                    row("Category", item.category.capitalized)
                    if let m = item.manufacturer, !m.isEmpty { row("Manufacturer", m) }
                    if let m = item.model, !m.isEmpty { row("Model", m) }
                    if let s = item.serial, !s.isEmpty { row("Serial", s) }
                    if let d = item.installedOn, !d.isEmpty { row("Installed", d) }
                    if let l = item.lifespanYears { row("Lifespan", "\(l) yrs") }
                    if let s = item.status, !s.isEmpty { row("Status", s.capitalized) }
                }
                .listRowBackground(Color.homeSurface)

                Section("QR Label") {
                    Button { showingQR = true } label: { Label("Create or Print Label", systemImage: "qrcode") }
                    Text("Scan the label with HomeOS to open this item instantly.").font(.footnote).foregroundStyle(.secondary)
                }
                .listRowBackground(Color.homeSurface)

                Section {
                    Button(role: .destructive) {
                        confirmingDelete = true
                    } label: {
                        Label("Delete Item", systemImage: "trash")
                    }
                    .disabled(deleting)
                }
                .listRowBackground(Color.homeSurface)
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
        }
        .navigationTitle(item.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Edit") { editing = true }
                    .tint(Color.homeNavy)
            }
        }
        .sheet(isPresented: $editing) {
            EditItemView(item: item) { updated in
                item = updated
                Task { await onChange() }
            }
        }
        .sheet(isPresented: $showingQR) { QRLabelView(item: item) }
        .confirmationDialog("Delete \(item.name)?",
                            isPresented: $confirmingDelete,
                            titleVisibility: .visible) {
            Button("Delete", role: .destructive) { Task { await performDelete() } }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This can't be undone.")
        }
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .foregroundStyle(Color.homeInk)
                .multilineTextAlignment(.trailing)
        }
        .font(.callout)
    }

    private func performDelete() async {
        deleting = true
        do {
            try await supabase.deleteItem(id: item.id)
            await onChange()
            dismiss()
        } catch {
            deleting = false
        }
    }
}

private struct QRLabelView: View {
    @Environment(\.dismiss) private var dismiss
    let item: Item
    @State private var sharing = false
    private var labelImage: UIImage { QRLabelRenderer.render(item: item) }

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Image(uiImage: labelImage).resizable().scaledToFit().frame(maxWidth: 340).accessibilityLabel("QR label for \(item.name)")
                Text("Place this label where the code stays flat, dry, and easy to reach.").font(.subheadline).foregroundStyle(.secondary).multilineTextAlignment(.center)
                Button { sharing = true } label: { Label("Share or Print Label", systemImage: "square.and.arrow.up").frame(maxWidth: .infinity) }
                    .buttonStyle(.borderedProminent).controlSize(.large).tint(Color.homeNavy)
            }.padding(24)
            .navigationTitle("QR Label").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
            .sheet(isPresented: $sharing) { ActivityView(items: [labelImage]) }
        }
        .presentationDetents([.medium, .large])
    }
}

private enum QRLabelRenderer {
    static func render(item: Item) -> UIImage {
        let size = CGSize(width: 900, height: 600)
        let format = UIGraphicsImageRendererFormat(); format.scale = 1
        return UIGraphicsImageRenderer(size: size, format: format).image { context in
            UIColor.white.setFill(); context.fill(CGRect(origin: .zero, size: size))
            context.cgContext.interpolationQuality = .none
            let qr = qrImage(for: Config.apiBaseURL.appendingPathComponent("library/item/\(item.id)").absoluteString)
            qr.draw(in: CGRect(x: 45, y: 75, width: 450, height: 450))
            let paragraph = NSMutableParagraphStyle(); paragraph.lineBreakMode = .byTruncatingTail
            (item.name as NSString).draw(in: CGRect(x: 535, y: 115, width: 320, height: 100), withAttributes: [.font: UIFont.systemFont(ofSize: 40, weight: .bold), .foregroundColor: UIColor(red: 10/255, green: 46/255, blue: 77/255, alpha: 1), .paragraphStyle: paragraph])
            let detail = [item.manufacturer, item.model].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
            (detail as NSString).draw(in: CGRect(x: 535, y: 235, width: 320, height: 100), withAttributes: [.font: UIFont.systemFont(ofSize: 25), .foregroundColor: UIColor.darkGray, .paragraphStyle: paragraph])
            ("SCAN WITH HOMEOS · \(item.id.prefix(8).uppercased())" as NSString).draw(at: CGPoint(x: 535, y: 410), withAttributes: [.font: UIFont.systemFont(ofSize: 17, weight: .semibold), .foregroundColor: UIColor.darkGray])
        }
    }

    private static func qrImage(for value: String) -> UIImage {
        let filter = CIFilter.qrCodeGenerator(); filter.message = Data(value.utf8); filter.correctionLevel = "H"
        let context = CIContext(); guard let output = filter.outputImage, let cg = context.createCGImage(output, from: output.extent) else { return UIImage() }
        return UIImage(cgImage: cg).resizableImage(withCapInsets: .zero, resizingMode: .stretch)
    }
}

private struct ActivityView: UIViewControllerRepresentable {
    let items: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController { UIActivityViewController(activityItems: items, applicationActivities: nil) }
    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}

// Prefilled edit form — a superset of AddItemView (adds serial + lifespan). Saves
// via updateItem, then hands the updated Item back so the detail refreshes.
private struct EditItemView: View {
    @Environment(SupabaseService.self) private var supabase
    @Environment(\.dismiss) private var dismiss

    let item: Item
    let onSaved: (Item) -> Void

    @State private var name: String
    @State private var category: String
    @State private var manufacturer: String
    @State private var model: String
    @State private var serial: String
    @State private var installedOn: Date
    @State private var hasInstallDate: Bool
    @State private var lifespan: String
    @State private var saving = false
    @State private var error: String?

    init(item: Item, onSaved: @escaping (Item) -> Void) {
        self.item = item
        self.onSaved = onSaved
        _name = State(initialValue: item.name)
        _category = State(initialValue: item.category)
        _manufacturer = State(initialValue: item.manufacturer ?? "")
        _model = State(initialValue: item.model ?? "")
        _serial = State(initialValue: item.serial ?? "")
        let parsed = HomeView.parseDay(item.installedOn)
        _installedOn = State(initialValue: parsed ?? Date())
        _hasInstallDate = State(initialValue: parsed != nil)
        _lifespan = State(initialValue: item.lifespanYears.map(String.init) ?? "")
    }

    // Include the item's current category so an unusual value (e.g. "structure")
    // still shows selected rather than blank.
    private var categoryOptions: [String] {
        var opts = ["system", "appliance", "fixture", "structure", "other"]
        if !opts.contains(item.category) { opts.insert(item.category, at: 0) }
        return opts
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Item") {
                    TextField("Name", text: $name)
                    Picker("Category", selection: $category) {
                        ForEach(categoryOptions, id: \.self) { Text($0.capitalized).tag($0) }
                    }
                }
                Section("Details") {
                    TextField("Manufacturer", text: $manufacturer)
                    TextField("Model", text: $model)
                    TextField("Serial", text: $serial)
                    Toggle("Set installed date", isOn: $hasInstallDate.animation())
                    if hasInstallDate {
                        DatePicker("Installed", selection: $installedOn, displayedComponents: .date)
                    }
                    HStack {
                        Text("Lifespan (yrs)")
                        Spacer()
                        TextField("—", text: $lifespan)
                            .keyboardType(.numberPad)
                            .multilineTextAlignment(.trailing)
                            .frame(maxWidth: 80)
                    }
                }
                if let error {
                    Section {
                        Text(error).font(.footnote).foregroundStyle(.red)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.homeCanvas)
            .navigationTitle("Edit Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }
                        .fontWeight(.semibold)
                        .disabled(name.isBlank || saving)
                }
            }
        }
    }

    private func save() async {
        saving = true
        error = nil
        let installedString = hasInstallDate ? AddItemView.dateString(installedOn) : nil
        let lifespanYears = SettingsView.parseInt(lifespan)
        let patch = ItemUpdate(
            name: name.trimmed,
            category: category,
            manufacturer: manufacturer.isBlank ? nil : manufacturer.trimmed,
            model: model.isBlank ? nil : model.trimmed,
            serial: serial.isBlank ? nil : serial.trimmed,
            installed_on: installedString,
            lifespan_years: lifespanYears
        )
        do {
            try await supabase.updateItem(id: item.id, patch)
            onSaved(Item(
                id: item.id,
                name: name.trimmed,
                category: category,
                status: item.status,
                manufacturer: patch.manufacturer,
                model: patch.model,
                serial: patch.serial,
                installedOn: installedString,
                lifespanYears: lifespanYears,
                summary: item.summary
            ))
            dismiss()
        } catch {
            self.error = error.localizedDescription
            saving = false
        }
    }
}
