import Foundation
import Supabase

// The whole model layer: one client + a handful of async queries. RLS scopes
// every read/write to the caller's homes, so the app never sends a user id.
@MainActor
@Observable
final class SupabaseService {
    let client: SupabaseClient
    var currentUser: User?
    var isBootstrapping = true

    init() {
        client = SupabaseClient(
            supabaseURL: Config.supabaseURL,
            supabaseKey: Config.supabaseAnonKey
        )
    }

    /// Restores a persisted session and then tracks auth changes for the app's
    /// lifetime. supabase-swift emits `.initialSession` on subscription, which
    /// is what flips `isBootstrapping` off (signed in or out).
    func observeAuth() async {
        for await change in client.auth.authStateChanges {
            currentUser = change.session?.user
            isBootstrapping = false
        }
    }

    // MARK: - Auth

    func signIn(email: String, password: String) async throws {
        try await client.auth.signIn(email: email, password: password)
    }

    /// Returns the session when the project auto-confirms; nil means the user
    /// must confirm via email before a session exists.
    func signUp(email: String, password: String, name: String) async throws -> Session? {
        try await client.auth.signUp(
            email: email,
            password: password,
            data: ["name": .string(name)]
        ).session
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    // MARK: - Data

    func firstHome() async throws -> Home? {
        let rows: [Home] = try await client.from("homes")
            .select("id, name, city, state")
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    func profile() async throws -> Profile? {
        guard let uid = currentUser?.id else { return nil }
        let row: Profile = try await client.from("profiles")
            .select("name, email")
            .eq("id", value: uid.uuidString)
            .single()
            .execute()
            .value
        return row
    }

    func items(homeID: String) async throws -> [Item] {
        let rows: [Item] = try await client.from("items")
            .select("id, name, category, status, manufacturer, model, serial, installed_on, lifespan_years, summary")
            .eq("home_id", value: homeID)
            .order("name")
            .execute()
            .value
        return rows
    }

    /// Head-count for the Home stat tiles. `filters` are extra equality clauses
    /// (e.g. category=system, status=open).
    func count(_ table: String, homeID: String, filters: [(String, String)] = []) async throws -> Int {
        var query = client.from(table)
            .select("*", head: true, count: .exact)
            .eq("home_id", value: homeID)
        for (column, value) in filters {
            query = query.eq(column, value: value)
        }
        return try await query.execute().count ?? 0
    }

    func addItem(_ item: NewItem) async throws {
        try await client.from("items").insert(item).execute()
    }

    func deleteItem(id: String) async throws {
        try await client.from("items").delete().eq("id", value: id).execute()
    }

    // MARK: - Care

    private static let careColumns =
        "id, title, detail, priority, season, due_on, recurrence, status, item_id, completed_at"

    /// Active tasks (open + snoozed), soonest due first, undated last.
    func careTasks(homeID: String) async throws -> [CareTask] {
        try await client.from("care_tasks")
            .select(Self.careColumns)
            .eq("home_id", value: homeID)
            .in("status", values: ["open", "snoozed"])
            .order("due_on", ascending: true, nullsFirst: false)
            .execute()
            .value
    }

    /// Recently completed tasks for the service-history feed.
    func doneCareTasks(homeID: String, limit: Int = 20) async throws -> [CareTask] {
        try await client.from("care_tasks")
            .select(Self.careColumns)
            .eq("home_id", value: homeID)
            .eq("status", value: "done")
            .order("completed_at", ascending: false, nullsFirst: false)
            .limit(limit)
            .execute()
            .value
    }

    func careEvents(homeID: String, limit: Int = 25) async throws -> [CareEvent] {
        try await client.from("care_events")
            .select("id, title, note, cost, occurred_on, item_id")
            .eq("home_id", value: homeID)
            .order("occurred_on", ascending: false)
            .limit(limit)
            .execute()
            .value
    }

    // ponytail: mirrors the web completeTask server action (lib/actions/care.ts) with
    // two deliberate deltas — the web omits the recurrence roll, and it revalidates
    // its Next cache. Unify both behind a shared /api/care/complete route later so a
    // single code path owns completion + rolling.
    func completeCareTask(_ task: CareTask, homeID: String) async throws {
        let now = ISO8601DateFormatter().string(from: Date())

        try await client.from("care_tasks")
            .update(TaskDone(completed_at: now, completed_by: currentUser?.id.uuidString))
            .eq("id", value: task.id)
            .execute()

        try await client.from("care_events").insert(NewCareEvent(
            home_id: homeID,
            title: "\(task.title) completed",   // matches the web event title for feed parity
            note: nil,
            cost: nil,
            occurred_on: Self.isoDay(Date()),
            item_id: task.itemId
        )).execute()

        // Roll the next occurrence for recurring tasks. Unknown vocabulary → skip.
        if let recurrence = task.recurrence,
           let interval = Self.recurrenceInterval(recurrence),
           let next = Calendar.current.date(byAdding: interval, to: Date()) {
            try await client.from("care_tasks").insert(NewCareTask(
                home_id: homeID,
                item_id: task.itemId,
                title: task.title,
                detail: task.detail,
                priority: task.priority,
                season: task.season,
                due_on: Self.isoDay(next),
                recurrence: recurrence,
                template_slug: nil,   // ponytail: not on the model; pipeline re-seeds template tasks by slug
                source: "user"
            )).execute()
        }
    }

    /// Snooze a task out of the active list and push its due date to `until`.
    func snoozeCareTask(id: String, until: Date) async throws {
        try await client.from("care_tasks")
            .update(TaskSnooze(due_on: Self.isoDay(until)))
            .eq("id", value: id)
            .execute()
    }

    // MARK: - Projects

    func projects(homeID: String) async throws -> [Project] {
        try await client.from("projects")
            .select("id, name, kind, status, progress, summary, budget, spent, cost, value_added, completed_year")
            .eq("home_id", value: homeID)
            .order("updated_at", ascending: false)
            .execute()
            .value
    }

    // MARK: - Insights

    func insights(homeID: String) async throws -> [Insight] {
        try await client.from("insights")
            .select("id, category, headline, detail, stat, action, status")
            .eq("home_id", value: homeID)
            .eq("status", value: "active")
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    func dismissInsight(id: String) async throws {
        try await client.from("insights")
            .update(["status": "dismissed"])
            .eq("id", value: id)
            .execute()
    }

    // MARK: - Rooms & Files

    func rooms(homeID: String) async throws -> [Room] {
        try await client.from("rooms")
            .select("id, name, slug")
            .eq("home_id", value: homeID)
            .order("name")
            .execute()
            .value
    }

    func files(homeID: String, itemID: String? = nil) async throws -> [HomeFile] {
        var query = client.from("files")
            .select("id, name, type, item_id, created_at, extraction_status")
            .eq("home_id", value: homeID)
        if let itemID {
            query = query.eq("item_id", value: itemID)
        }
        return try await query.order("created_at", ascending: false).execute().value
    }

    // MARK: - Web API auth

    /// Current session JWT for calling the Vercel API routes (Ask, ingest).
    func accessToken() async -> String? {
        try? await client.auth.session.accessToken
    }

    // MARK: - Helpers

    private struct TaskDone: Encodable {
        let status = "done"
        let completed_at: String
        let completed_by: String?
    }

    private struct TaskSnooze: Encodable {
        let status = "snoozed"
        let due_on: String
    }

    /// Postgres `date` wants a plain calendar day; POSIX locale keeps it stable.
    static func isoDay(_ date: Date) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    /// Maps the web's recurrence vocabulary (lib/care-data.ts) to a calendar
    /// interval. Order matters: "twice yearly" must match before "yearly".
    static func recurrenceInterval(_ recurrence: String) -> DateComponents? {
        let r = recurrence.lowercased()
        if r.contains("every 3 months") || r.contains("quarterly") { return DateComponents(month: 3) }
        if r.contains("twice yearly") || r.contains("semiannual")
            || r.contains("semi-annual") || r.contains("biannual") { return DateComponents(month: 6) }
        if r.contains("monthly") { return DateComponents(month: 1) }
        if r.contains("yearly") || r.contains("annual") { return DateComponents(year: 1) }
        return nil
    }
}
