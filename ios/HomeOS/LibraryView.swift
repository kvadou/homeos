import SwiftUI

struct LibraryView: View {
    @Environment(SupabaseService.self) private var supabase

    @State private var items: [Item] = []
    @State private var homeID: String?
    @State private var loading = true
    @State private var loadError: String?
    @State private var showAdd = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.homeCanvas.ignoresSafeArea()
                content
            }
            .navigationTitle("Library")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showAdd = true } label: { Image(systemName: "plus") }
                        .tint(Color.homeNavy)
                        .disabled(homeID == nil)
                }
            }
            .navigationDestination(for: Item.self) { item in
                ItemDetailView(item: item) { await reload() }
            }
            .sheet(isPresented: $showAdd) {
                if let homeID {
                    AddItemView(homeID: homeID) { await reload() }
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
            ContentUnavailableView("Couldn't load items", systemImage: "exclamationmark.triangle",
                                   description: Text(loadError))
        } else if items.isEmpty {
            ContentUnavailableView("No items yet", systemImage: "square.grid.2x2",
                                   description: Text("Add your first system or appliance."))
        } else {
            List {
                ForEach(items) { item in
                    NavigationLink(value: item) { ItemRow(item: item) }
                        .listRowBackground(Color.homeSurface)
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
        }
    }

    private func reload() async {
        loading = items.isEmpty
        loadError = nil
        do {
            let loadedHome = try await supabase.firstHome()
            homeID = loadedHome?.id
            if let id = loadedHome?.id {
                items = try await supabase.items(homeID: id)
            } else {
                items = []
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
