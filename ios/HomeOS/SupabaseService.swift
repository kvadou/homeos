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
}
