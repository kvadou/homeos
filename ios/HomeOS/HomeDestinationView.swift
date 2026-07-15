import SwiftUI

enum HomeDestination: Hashable {
    case systems, tasks, items
    case task(CareTask)
    case insight(Insight)
    case event(CareEvent)
}

struct HomeDestinationView: View {
    let destination: HomeDestination
    let items: [Item]
    let tasks: [CareTask]
    let events: [CareEvent]
    let onChange: () async -> Void

    var body: some View {
        switch destination {
        case .systems:
            itemList(title: "Systems", rows: items.filter { $0.category.lowercased() == "system" })
        case .items:
            itemList(title: "Home Inventory", rows: items)
        case .tasks:
            taskList
        case .task(let task):
            CareTaskDetailView(task: task, onChange: onChange)
        case .insight(let insight):
            InsightDetailView(insight: insight)
        case .event(let event):
            CareEventDetailView(event: event, linkedItem: items.first { $0.id == event.itemId }, onChange: onChange)
        }
    }

    private func itemList(title: String, rows: [Item]) -> some View {
        List(rows) { item in
            NavigationLink { ItemDetailView(item: item, onChange: onChange) } label: {
                Label {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.name).foregroundStyle(Color.homeInk)
                        Text([item.manufacturer, item.model].compactMap { $0 }.filter { !$0.isBlank }.joined(separator: " · "))
                            .font(.caption).foregroundStyle(.secondary)
                    }
                } icon: { Image(systemName: categoryIcon(item.category)).foregroundStyle(Color.homeNavy) }
            }
        }
        .overlay { if rows.isEmpty { ContentUnavailableView("Nothing recorded yet", systemImage: "square.grid.2x2", description: Text("Add or scan a home item to build this view.")) } }
        .scrollContentBackground(.hidden).background(Color.homeCanvas).navigationTitle(title)
    }

    private var taskList: some View {
        List(tasks) { task in
            NavigationLink { CareTaskDetailView(task: task, onChange: onChange) } label: {
                VStack(alignment: .leading, spacing: 3) {
                    Text(task.title).foregroundStyle(Color.homeInk)
                    Text(HomeView.duePhrase(task.dueOn).isEmpty ? "Flexible timing" : HomeView.duePhrase(task.dueOn))
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .overlay { if tasks.isEmpty { ContentUnavailableView("No open tasks", systemImage: "checkmark.seal", description: Text("Your current care list is clear.")) } }
        .scrollContentBackground(.hidden).background(Color.homeCanvas).navigationTitle("Open Tasks")
    }
}

private struct InsightDetailView: View {
    let insight: Insight
    var body: some View {
        List {
            Section {
                if let stat = insight.stat, !stat.isBlank { Text(stat).font(.largeTitle).fontDesign(.serif).foregroundStyle(Color.homeNavy) }
                Text(insight.headline).font(.title2).fontDesign(.serif).foregroundStyle(Color.homeInk)
                if let detail = insight.detail, !detail.isBlank { Text(detail).foregroundStyle(Color.homeInk) }
            }
            if let action = insight.action, !action.isBlank { Section("Suggested next step") { Label(action, systemImage: "arrow.forward.circle.fill") } }
            Section("Why you’re seeing this") { Text("This insight was generated from information saved for your home. GatherRoot leaves the card empty when it does not have enough evidence.").font(.subheadline).foregroundStyle(.secondary) }
        }
        .scrollContentBackground(.hidden).background(Color.homeCanvas).navigationTitle("Worth Knowing").navigationBarTitleDisplayMode(.inline)
    }
}

private struct CareEventDetailView: View {
    let event: CareEvent
    let linkedItem: Item?
    let onChange: () async -> Void
    var body: some View {
        List {
            Section("Service record") {
                LabeledContent("Date", value: event.occurredOn ?? "Not recorded")
                if let cost = event.cost { LabeledContent("Cost", value: cost.formatted(.currency(code: "USD"))) }
                if let note = event.note, !note.isBlank { Text(note) }
            }
            if let linkedItem { Section("Related item") { NavigationLink(linkedItem.name) { ItemDetailView(item: linkedItem, onChange: onChange) } } }
        }
        .scrollContentBackground(.hidden).background(Color.homeCanvas).navigationTitle(event.title).navigationBarTitleDisplayMode(.inline)
    }
}
