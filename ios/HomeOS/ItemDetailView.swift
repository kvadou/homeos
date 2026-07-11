import SwiftUI

struct ItemDetailView: View {
    @Environment(SupabaseService.self) private var supabase
    @Environment(\.dismiss) private var dismiss

    let item: Item
    let onDelete: () async -> Void

    @State private var confirmingDelete = false
    @State private var deleting = false

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
            await onDelete()
            dismiss()
        } catch {
            deleting = false
        }
    }
}
