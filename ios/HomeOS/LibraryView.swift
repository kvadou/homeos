import SwiftUI

struct LibraryView: View {
    @Environment(SupabaseService.self) private var supabase

    @State private var items: [Item] = []
    @State private var files: [HomeFile] = []
    @State private var homeID: String?
    @State private var loading = true
    @State private var loadError: String?
    @State private var query = ""
    @State private var sheet: LibrarySheet?

    private enum LibrarySheet: Identifiable {
        case addItem, scanReceipt, addPhoto
        var id: Int { hashValue }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.homeCanvas.ignoresSafeArea()
                content
            }
            .navigationTitle("Library")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button { sheet = .addItem } label: { Label("Add item", systemImage: "plus.square") }
                        Button { sheet = .scanReceipt } label: { Label("Scan receipt", systemImage: "doc.text.viewfinder") }
                        Button { sheet = .addPhoto } label: { Label("Add photo", systemImage: "photo") }
                    } label: {
                        Image(systemName: "plus")
                    }
                    .tint(Color.homeNavy)
                    .disabled(homeID == nil)
                }
            }
            .navigationDestination(for: Item.self) { item in
                ItemDetailView(item: item) { await reload() }
            }
            .sheet(item: $sheet) { which in
                if let homeID {
                    switch which {
                    case .addItem: AddItemView(homeID: homeID) { await reload() }
                    case .scanReceipt: CaptureView(kind: .receipt, homeID: homeID) { await reload() }
                    case .addPhoto: CaptureView(kind: .photo, homeID: homeID) { await reload() }
                    }
                }
            }
            .task { await reload() }
            .refreshable { await reload() }
        }
    }

    @ViewBuilder private var content: some View {
        if loading {
            ProgressView().tint(Color.homeNavy)
        } else if let loadError {
            ContentUnavailableView("Couldn't load library", systemImage: "exclamationmark.triangle",
                                   description: Text(loadError))
        } else if items.isEmpty && files.isEmpty {
            ContentUnavailableView("Nothing here yet", systemImage: "square.grid.2x2",
                                   description: Text("Add an item, or scan a receipt to get started."))
        } else {
            List {
                if !filteredItems.isEmpty {
                    Section("Items") {
                        ForEach(filteredItems) { item in
                            NavigationLink(value: item) { ItemRow(item: item) }
                                .listRowBackground(Color.homeSurface)
                        }
                    }
                }
                // Documents stay out of the way while searching — search targets items.
                if !files.isEmpty && query.isBlank {
                    Section("Documents") {
                        ForEach(files) { file in
                            FileRow(file: file).listRowBackground(Color.homeSurface)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .searchable(text: $query, prompt: "Search items")
        }
    }

    private var filteredItems: [Item] {
        let q = query.trimmed.lowercased()
        guard !q.isEmpty else { return items }
        return items.filter { item in
            item.name.lowercased().contains(q)
                || item.category.lowercased().contains(q)
                || (item.manufacturer?.lowercased().contains(q) ?? false)
        }
    }

    private func reload() async {
        loading = items.isEmpty && files.isEmpty
        loadError = nil
        do {
            let loadedHome = try await supabase.firstHome()
            homeID = loadedHome?.id
            if let id = loadedHome?.id {
                async let loadedItems = supabase.items(homeID: id)
                async let loadedFiles = supabase.files(homeID: id)
                items = try await loadedItems
                files = try await loadedFiles
            } else {
                items = []
                files = []
            }
        } catch {
            loadError = error.localizedDescription
        }
        loading = false
    }
}

struct ItemRow: View {
    let item: Item

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: categoryIcon(item.category))
                .font(.title3)
                .foregroundStyle(Color.homeNavy)
                .frame(width: 36, height: 36)
                .background(Color.homeNavy.opacity(0.10),
                           in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            VStack(alignment: .leading, spacing: 3) {
                Text(item.name)
                    .font(.headline)
                    .foregroundStyle(Color.homeInk)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private var subtitle: String {
        [item.category.capitalized, item.manufacturer]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: "  ·  ")
    }
}

struct FileRow: View {
    let file: HomeFile

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: fileIcon(file.type))
                .font(.title3)
                .foregroundStyle(Color.homeNavy)
                .frame(width: 36, height: 36)
                .background(Color.homeNavy.opacity(0.10),
                           in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            VStack(alignment: .leading, spacing: 3) {
                Text(file.name)
                    .font(.headline)
                    .foregroundStyle(Color.homeInk)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 8)
            if let chip = statusChip {
                Text(chip.label)
                    .font(.caption).fontWeight(.medium)
                    .foregroundStyle(chip.tint)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(chip.tint.opacity(0.12), in: Capsule())
            }
        }
        .padding(.vertical, 4)
    }

    private var subtitle: String {
        [file.type.capitalized, Self.dayString(file.createdAt)]
            .filter { !$0.isEmpty }
            .joined(separator: "  ·  ")
    }

    /// Extraction state as a trailing chip. Only pending/failed surface; a
    /// finished ('done') or non-extractable ('none') file shows nothing.
    private var statusChip: (label: String, tint: Color)? {
        switch file.extractionStatus {
        case "pending": return ("Processing…", Color.homeNavy)
        case "failed": return ("Failed", .orange)
        default: return nil
        }
    }

    /// created_at arrives as an ISO timestamp; the calendar-day prefix dodges any
    /// timezone drift, then reformats to a short local date.
    static func dayString(_ iso: String) -> String {
        let day = String(iso.prefix(10))   // yyyy-MM-dd
        let parse = DateFormatter()
        parse.locale = Locale(identifier: "en_US_POSIX")
        parse.dateFormat = "yyyy-MM-dd"
        guard let date = parse.date(from: day) else { return day }
        let out = DateFormatter()
        out.dateStyle = .medium
        return out.string(from: date)
    }
}

// SF Symbol per file type — falls back to a generic document glyph.
private func fileIcon(_ type: String) -> String {
    switch type.lowercased() {
    case "receipt": return "receipt.fill"
    case "photo": return "photo.fill"
    case "video": return "video.fill"
    case "manual": return "book.fill"
    case "warranty": return "checkmark.shield.fill"
    default: return "doc.fill"
    }
}
