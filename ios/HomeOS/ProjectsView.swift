import SwiftUI

// ponytail: read-only v1. The web owns project mutations (create/edit/complete)
// for now, so this tab only reads via SupabaseService.projects(homeID:). Add a
// create sheet + detail here when native write parity is scheduled.
struct ProjectsView: View {
    @Environment(SupabaseService.self) private var supabase

    @State private var projects: [Project] = []
    @State private var segment: ProjectSegment = .active
    @State private var loading = true
    @State private var loadError: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color.homeCanvas.ignoresSafeArea()
                VStack(spacing: 0) {
                    Picker("Segment", selection: $segment) {
                        ForEach(ProjectSegment.allCases) { seg in
                            Text(seg.title).tag(seg)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .sensoryFeedback(.selection, trigger: segment)

                    content
                }
            }
            .navigationTitle("Projects")
            .task { await reload() }
            .refreshable { await reload() }
        }
    }

    // Projects arrive across all kinds ordered by updated_at; filter to the
    // active segment. Done mirrors the web archive (newest completion first).
    private var visible: [Project] {
        let rows = projects.filter { $0.kind == segment.kind }
        return segment == .done
            ? rows.sorted { ($0.completedYear ?? 0) > ($1.completedYear ?? 0) }
            : rows
    }

    @ViewBuilder private var content: some View {
        if loading {
            ProgressView().tint(Color.homeNavy)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let loadError {
            ContentUnavailableView("Couldn't load projects", systemImage: "exclamationmark.triangle",
                                   description: Text(loadError))
        } else if visible.isEmpty {
            ContentUnavailableView(segment.emptyTitle, systemImage: segment.emptyIcon,
                                   description: Text(segment.emptyMessage))
        } else {
            List {
                ForEach(visible) { project in
                    row(for: project)
                        .listRowBackground(Color.homeSurface)
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
        }
    }

    @ViewBuilder private func row(for p: Project) -> some View {
        switch segment {
        case .active: activeRow(p)
        case .ideas: ideaRow(p)
        case .forYou: recommendedRow(p)
        case .done: doneRow(p)
        }
    }

    private func activeRow(_ p: Project) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(p.name)
                .font(.headline)
                .foregroundStyle(Color.homeInk)
            if let status = p.status, !status.isBlank {
                Text(status)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            if let progress = p.progress {
                ProgressView(value: Double(min(max(progress, 0), 100)) / 100)
                    .tint(Color.homeNavy)
            }
            if let budget = p.budget {
                let spent = p.spent ?? 0
                Text("\(money(spent)) of \(money(budget))")
                    .font(.footnote)
                    .foregroundStyle(spent > budget ? Color.orange : .secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func ideaRow(_ p: Project) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(p.name)
                .font(.headline)
                .foregroundStyle(Color.homeInk)
            if let summary = p.summary, !summary.isBlank {
                Text(summary)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func recommendedRow(_ p: Project) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(p.name)
                    .font(.headline)
                    .foregroundStyle(Color.homeInk)
                Spacer(minLength: 8)
                Text("Suggested")
                    .font(.caption2).fontWeight(.medium)
                    .foregroundStyle(Color.homeNavy)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.homeNavy.opacity(0.10), in: Capsule())
            }
            if let summary = p.summary, !summary.isBlank {
                Text(summary)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func doneRow(_ p: Project) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .firstTextBaseline) {
                Text(p.name)
                    .font(.headline)
                    .foregroundStyle(Color.homeInk)
                Spacer(minLength: 8)
                if let year = p.completedYear {
                    Text(String(year))
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            let costLine = doneCostLine(p)
            if !costLine.isEmpty {
                Text(costLine)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    // "Cost $42K · Added ~$31K" — compact currency, mirrors web compact().
    private func doneCostLine(_ p: Project) -> String {
        var parts: [String] = []
        if let cost = p.cost { parts.append("Cost \(compact(cost))") }
        if let added = p.valueAdded { parts.append("Added ~\(compact(added))") }
        return parts.joined(separator: " · ")
    }

    // Full currency for live budgets: "$12,400". Locale-aware, no cents.
    private func money(_ n: Double) -> String {
        n.formatted(.currency(code: "USD").precision(.fractionLength(0)))
    }

    // Compact for archive rollups: "$42K" / "$450". Matches lib/projects-data.ts compact().
    private func compact(_ n: Double) -> String {
        n >= 1000 ? "$\(Int((n / 1000).rounded()))K" : "$\(Int(n.rounded()))"
    }

    private func reload() async {
        loading = projects.isEmpty
        loadError = nil
        do {
            let home = try await supabase.firstHome()
            if let id = home?.id {
                projects = try await supabase.projects(homeID: id)
            } else {
                projects = []
            }
        } catch {
            loadError = error.localizedDescription
        }
        loading = false
    }
}

// Segment ↔ projects.kind. Titles are the tab labels; kind is the DB filter.
private enum ProjectSegment: CaseIterable, Identifiable, Hashable {
    case active, ideas, forYou, done

    var id: Self { self }

    var title: String {
        switch self {
        case .active: return "Active"
        case .ideas:  return "Ideas"
        case .forYou: return "For You"
        case .done:   return "Done"
        }
    }

    var kind: String {
        switch self {
        case .active: return "active"
        case .ideas:  return "idea"
        case .forYou: return "recommended"
        case .done:   return "completed"
        }
    }

    var emptyTitle: String {
        switch self {
        case .active: return "No active projects"
        case .ideas:  return "No ideas yet"
        case .forYou: return "Nothing suggested"
        case .done:   return "No completed projects"
        }
    }

    var emptyMessage: String {
        switch self {
        case .active: return "Projects you're working on will show up here."
        case .ideas:  return "Someday-maybe projects and rough plans live here."
        case .forYou: return "Recommendations tailored to your home will appear here."
        case .done:   return "Finished projects and the value they added show up here."
        }
    }

    var emptyIcon: String {
        switch self {
        case .active: return "hammer"
        case .ideas:  return "lightbulb"
        case .forYou: return "sparkles"
        case .done:   return "checkmark.seal"
        }
    }
}
