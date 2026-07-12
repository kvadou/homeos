import SwiftUI
import UIKit

// The Care tab: what the home needs now, what's coming, and everything already
// handled. Mirrors the web /care surface — same buckets, same calm date tone,
// same "your home thanks you" voice — over the SupabaseService care queries.
struct CareView: View {
    @Environment(SupabaseService.self) private var supabase

    @State private var tasks: [CareTask] = []       // active: open + snoozed
    @State private var doneTasks: [CareTask] = []
    @State private var events: [CareEvent] = []
    @State private var homeID: String?
    @State private var loading = true
    @State private var loadError: String?
    @State private var completeTick = 0
    @State private var snoozeTick = 0

    var body: some View {
        NavigationStack {
            ZStack {
                Color.homeCanvas.ignoresSafeArea()
                content
            }
            .navigationTitle("Care")
            .task { await reload() }
            .refreshable { await reload() }
            .sensoryFeedback(.success, trigger: completeTick)
            .sensoryFeedback(.impact(weight: .light), trigger: snoozeTick)
        }
    }

    // MARK: - Content states

    @ViewBuilder private var content: some View {
        if loading {
            ProgressView().tint(Color.homeNavy)
        } else if let loadError {
            ContentUnavailableView("Couldn't load Care", systemImage: "exclamationmark.triangle",
                                   description: Text(loadError))
        } else if tasks.isEmpty && doneTasks.isEmpty && events.isEmpty {
            ContentUnavailableView("All caught up", systemImage: "checkmark.seal",
                                   description: Text("Nothing needs your attention right now."))
        } else {
            careList
        }
    }

    private var careList: some View {
        List {
            if activeEmpty {
                Section {
                    HStack(spacing: 10) {
                        Image(systemName: "checkmark.seal.fill").foregroundStyle(.green)
                        Text("You're all caught up. Nothing needs attention right now.")
                            .font(.subheadline).foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 2)
                    .listRowBackground(Color.homeSurface)
                }
            }

            if !overdue.isEmpty {
                Section {
                    ForEach(overdue) { taskRow($0) }
                } header: {
                    Label("Overdue", systemImage: "exclamationmark.triangle.fill")
                        .foregroundStyle(.red)
                }
            }

            plainSection("Due soon", dueSoon)
            plainSection("Upcoming", upcoming)
            plainSection("Seasonal & flexible", seasonal)

            if !doneTasks.isEmpty {
                Section {
                    DisclosureGroup {
                        ForEach(doneTasks) { task in
                            CompletedRow(task: task)
                                .listRowBackground(Color.homeSurface)
                        }
                    } label: {
                        Label("Recently completed", systemImage: "checkmark.circle")
                            .font(.subheadline).foregroundStyle(Color.homeInk)
                    }
                    .tint(Color.homeNavy)
                    .listRowBackground(Color.homeSurface)
                }
            }

            if !events.isEmpty {
                Section("Service history") {
                    ForEach(Array(events.prefix(10))) { event in
                        ServiceEventRow(event: event)
                            .listRowBackground(Color.homeSurface)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
    }

    @ViewBuilder private func plainSection(_ title: String, _ items: [CareTask]) -> some View {
        if !items.isEmpty {
            Section(title) {
                ForEach(items) { taskRow($0) }
            }
        }
    }

    @ViewBuilder private func taskRow(_ task: CareTask) -> some View {
        let due = dueLabel(task)
        CareTaskRow(task: task, dueText: due?.text, dueUrgent: due?.urgent ?? false)
            .listRowBackground(Color.homeSurface)
            .swipeActions(edge: .leading, allowsFullSwipe: true) {
                Button { complete(task) } label: { Label("Complete", systemImage: "checkmark") }
                    .tint(.green)
            }
            .swipeActions(edge: .trailing) {
                Button { snooze(task) } label: { Label("Snooze", systemImage: "clock") }
                    .tint(.orange)
            }
    }

    // MARK: - Buckets (careTasks arrives pre-sorted soonest-due first, undated last)

    private var today: Date { Calendar.current.startOfDay(for: Date()) }
    private var soonEnd: Date { Calendar.current.date(byAdding: .day, value: 30, to: today) ?? today }

    private var overdue: [CareTask] {
        tasks.filter { guard let d = Self.parseDay($0.dueOn) else { return false }; return d < today }
    }
    private var dueSoon: [CareTask] {
        tasks.filter {
            guard let d = Self.parseDay($0.dueOn) else { return false }
            return d >= today && d <= soonEnd
        }
    }
    private var upcoming: [CareTask] {
        tasks.filter { guard let d = Self.parseDay($0.dueOn) else { return false }; return d > soonEnd }
    }
    private var seasonal: [CareTask] {
        tasks.filter { Self.parseDay($0.dueOn) == nil }
    }
    private var activeEmpty: Bool {
        overdue.isEmpty && dueSoon.isEmpty && upcoming.isEmpty && seasonal.isEmpty
    }

    /// Natural, low-precision due text + whether it should read as urgent (red).
    private func dueLabel(_ task: CareTask) -> (text: String, urgent: Bool)? {
        guard let d = Self.parseDay(task.dueOn) else { return nil }
        let days = Calendar.current.dateComponents([.day], from: today, to: d).day ?? 0
        switch days {
        case ..<0:
            let n = -days
            return (n == 1 ? "1 day overdue" : "\(n) days overdue", true)
        case 0: return ("Due today", true)
        case 1: return ("Due tomorrow", false)
        case 2...6: return ("Due in \(days) days", false)
        default: return ("Due \(Self.dueDateText(d))", false)
        }
    }

    // MARK: - Actions

    private func complete(_ task: CareTask) {
        guard let homeID else { return }
        completeTick += 1
        tasks.removeAll { $0.id == task.id }   // optimistic; reload reconciles
        Task {
            try? await supabase.completeCareTask(task, homeID: homeID)
            await reload()
        }
    }

    private func snooze(_ task: CareTask) {
        snoozeTick += 1
        let until = Calendar.current.date(byAdding: .day, value: 7, to: Date()) ?? Date()
        Task {
            try? await supabase.snoozeCareTask(id: task.id, until: until)
            await reload()
        }
    }

    // MARK: - Load

    private func reload() async {
        loading = tasks.isEmpty && doneTasks.isEmpty && events.isEmpty
        loadError = nil
        do {
            guard let home = try await supabase.firstHome() else {
                homeID = nil; tasks = []; doneTasks = []; events = []; loading = false; return
            }
            homeID = home.id
            tasks = try await supabase.careTasks(homeID: home.id)
            doneTasks = try await supabase.doneCareTasks(homeID: home.id)
            events = try await supabase.careEvents(homeID: home.id)
        } catch {
            loadError = error.localizedDescription
        }
        loading = false
    }

    // MARK: - Date helpers

    /// Postgres `date` day, parsed to a stable calendar day for comparison.
    private static let dayParser: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
    static func parseDay(_ s: String?) -> Date? {
        guard let s, let d = dayParser.date(from: s) else { return nil }
        return Calendar.current.startOfDay(for: d)
    }

    /// "Aug 12" this year, "Aug 2026" otherwise — the calm date tone Care uses.
    private static func dueDateText(_ d: Date) -> String {
        let cal = Calendar.current
        let f = DateFormatter()
        f.locale = .autoupdatingCurrent
        f.setLocalizedDateFormatFromTemplate(
            cal.component(.year, from: d) == cal.component(.year, from: Date()) ? "MMMd" : "MMMyyyy"
        )
        return f.string(from: d)
    }

    /// "Mar 2026" from either a plain day or an ISO timestamp — parses the leading
    /// yyyy-MM so timezone/fractional-second variance never matters for display.
    private static let ymParser: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM"
        return f
    }()
    private static let monthYearFmt: DateFormatter = {
        let f = DateFormatter()
        f.locale = .autoupdatingCurrent
        f.setLocalizedDateFormatFromTemplate("MMMyyyy")
        return f
    }()
    static func monthYear(_ s: String?) -> String? {
        guard let s, s.count >= 7, let d = ymParser.date(from: String(s.prefix(7))) else { return nil }
        return monthYearFmt.string(from: d)
    }
}

// MARK: - Rows

private struct CareTaskRow: View {
    let task: CareTask
    let dueText: String?
    let dueUrgent: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Circle()
                .fill(priorityColor)
                .frame(width: 10, height: 10)
                .padding(.top, 6)
                .accessibilityLabel("\(priorityLabel) priority")
            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .font(.headline)
                    .foregroundStyle(Color.homeInk)
                if let detail = task.detail, !detail.isBlank {
                    Text(detail)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                HStack(spacing: 8) {
                    if let dueText {
                        Label(dueText, systemImage: "calendar")
                            .font(.caption)
                            .foregroundStyle(dueUrgent ? Color.red : Color.secondary)
                    }
                    if let season = task.season, !season.isBlank {
                        SeasonChip(season: season)
                    }
                }
                .padding(.top, 1)
            }
        }
        .padding(.vertical, 4)
    }

    // Traffic-light ramp over the web's priority vocabulary — system tints only.
    private var priorityColor: Color {
        switch (task.priority ?? "").lowercased() {
        case "highest": return .red
        case "high": return .orange
        case "medium": return .yellow
        case "low": return .green
        default: return Color(.tertiaryLabel)
        }
    }
    private var priorityLabel: String { task.priority?.capitalized ?? "Normal" }
}

private struct SeasonChip: View {
    let season: String

    var body: some View {
        Label(season.capitalized, systemImage: icon)
            .font(.caption2)
            .foregroundStyle(.secondary)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Color(.tertiarySystemFill), in: Capsule())
    }

    private var icon: String {
        switch season.lowercased() {
        case "spring": return "leaf.fill"
        case "summer": return "sun.max.fill"
        case "fall", "autumn": return "wind"
        case "winter": return "snowflake"
        default: return "calendar"
        }
    }
}

private struct CompletedRow: View {
    let task: CareTask

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.green)
            VStack(alignment: .leading, spacing: 2) {
                Text(task.title)
                    .font(.subheadline)
                    .foregroundStyle(Color.homeInk)
                if let when = CareView.monthYear(task.completedAt) {
                    Text(when)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 2)
    }
}

private struct ServiceEventRow: View {
    let event: CareEvent

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Wrench when it cost money, doc otherwise — matches web care-activity.
            Image(systemName: event.cost != nil ? "wrench.and.screwdriver.fill" : "doc.text.fill")
                .foregroundStyle(Color.homeNavy)
                .frame(width: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(event.title)
                    .font(.subheadline)
                    .foregroundStyle(Color.homeInk)
                if let when = CareView.monthYear(event.occurredOn) {
                    Text(when)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer(minLength: 8)
            if let cost = event.cost {
                Text(cost.formatted(.currency(code: "USD")))
                    .font(.subheadline)
                    .monospacedDigit()
                    .foregroundStyle(Color.homeInk)
            }
        }
        .padding(.vertical, 2)
    }
}
