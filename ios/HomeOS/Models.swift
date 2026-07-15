import Foundation

// Plain Codable mirrors of the Postgres tables. Only the columns the app reads
// are modeled; jsonb/blob columns are left out so decoding stays trivial.

struct Home: Identifiable, Decodable, Hashable {
    let id: String
    let name: String
    let city: String?
    let state: String?
}

struct Item: Identifiable, Decodable, Hashable {
    let id: String
    let name: String
    let category: String
    let status: String?
    let manufacturer: String?
    let model: String?
    let serial: String?
    let installedOn: String?      // date column arrives as "yyyy-MM-dd"
    let lifespanYears: Int?
    let summary: String?

    enum CodingKeys: String, CodingKey {
        case id, name, category, status, manufacturer, model, serial, summary
        case installedOn = "installed_on"
        case lifespanYears = "lifespan_years"
    }
}

// Insert payload — snake_case property names map straight onto the columns,
// so no encoder key strategy is needed.
struct NewItem: Encodable {
    let home_id: String
    let name: String
    let category: String
    let manufacturer: String?
    let model: String?
    let installed_on: String?
}

struct Profile: Decodable {
    let name: String?
    let email: String
}

struct CareTask: Identifiable, Decodable, Hashable {
    let id: String
    let title: String
    let detail: String?
    let priority: String?
    let season: String?
    let dueOn: String?          // date column arrives as "yyyy-MM-dd"
    let recurrence: String?     // vocabulary: "yearly" / "every 3 months" / "twice yearly"
    let status: String
    let itemId: String?
    let completedAt: String?

    enum CodingKeys: String, CodingKey {
        case id, title, detail, priority, season, recurrence, status
        case dueOn = "due_on"
        case itemId = "item_id"
        case completedAt = "completed_at"
    }
}

struct CareEvent: Identifiable, Decodable, Hashable {
    let id: String
    let title: String
    let note: String?
    let cost: Double?           // numeric column
    let occurredOn: String?
    let itemId: String?

    enum CodingKeys: String, CodingKey {
        case id, title, note, cost
        case occurredOn = "occurred_on"
        case itemId = "item_id"
    }
}

struct Project: Identifiable, Decodable, Hashable {
    let id: String
    let name: String
    let kind: String            // active / idea / recommended / completed
    let status: String?
    let progress: Int?
    let summary: String?
    let budget: Double?
    let spent: Double?
    let cost: Double?
    let valueAdded: Double?
    let completedYear: Int?

    enum CodingKeys: String, CodingKey {
        case id, name, kind, status, progress, summary, budget, spent, cost
        case valueAdded = "value_added"
        case completedYear = "completed_year"
    }
}

struct Insight: Identifiable, Decodable, Hashable {
    let id: String
    let category: String?
    let headline: String
    let detail: String?
    let stat: String?
    let action: String?
    let status: String
}

struct Room: Identifiable, Decodable, Hashable {
    let id: String
    let name: String
    let slug: String
}

struct HomeFile: Identifiable, Decodable, Hashable {
    let id: String
    let name: String
    let type: String            // document/photo/video/receipt/manual/warranty
    let itemId: String?
    let createdAt: String
    let extractionStatus: String?
    let storagePath: String

    enum CodingKeys: String, CodingKey {
        case id, name, type
        case itemId = "item_id"
        case createdAt = "created_at"
        case extractionStatus = "extraction_status"
        case storagePath = "storage_path"
    }
}

// Insert payloads — snake_case property names map straight onto the columns.
struct NewCareEvent: Encodable {
    let home_id: String
    let title: String
    let note: String?
    let cost: Double?
    let occurred_on: String
    let item_id: String?
}

struct NewCareTask: Encodable {
    let home_id: String
    let item_id: String?
    let title: String
    let detail: String?
    let priority: String?
    let season: String?
    let due_on: String?
    let recurrence: String?
    let template_slug: String?
    let source: String
}

struct NewProject: Encodable {
    let home_id: String
    let name: String
    let kind: String
    let status: String?
    let progress: Int?
    let summary: String?
    let budget: Double?
    let spent: Double?
}

struct ProjectUpdate: Encodable {
    let name: String
    let kind: String
    let status: String?
    let progress: Int?
    let summary: String?
    let budget: Double?
    let spent: Double?
}

// Insert payload for a captured receipt/photo — mirrors recordUpload's files row
// (lib/actions/library.ts). Both receipts and photos route through extraction.
struct NewFile: Encodable {
    let home_id: String
    let item_id: String?
    let type: String
    let name: String
    let storage_path: String
    let content_hash: String
    let extraction_status: String
    let meta: [String: String]
}

/// Minimal decode of an `insert ... .select("id")` response.
struct InsertedID: Decodable {
    let id: String
}

/// Raised when a file insert hits the (home_id, content_hash) unique index — the
/// exact bytes are already filed. The capture UI turns this into a calm notice.
enum IngestError: Error {
    case duplicate
}

struct ScanSuggestion: Decodable {
    let id: String
    let summary: String
}

struct ScanFileState: Decodable {
    let itemId: String?
    let extractionStatus: String?

    enum CodingKeys: String, CodingKey {
        case itemId = "item_id"
        case extractionStatus = "extraction_status"
    }
}

enum ScanOutcome {
    case processing
    case matched(itemName: String)
    case needsReview(ScanSuggestion)
    case noMatch
    case failed
}

// MARK: - Settings + onboarding (Phase D)

/// Full home row for the settings editor. `firstHome`'s lean `Home` only carries
/// what the dashboards need; this adds the editable address/spec columns.
struct HomeDetail: Decodable {
    let id: String
    let name: String
    let street: String?
    let city: String?
    let state: String?
    let zip: String?
    let yearBuilt: Int?
    let sqft: Int?
    let beds: Double?          // beds/baths are `numeric` columns
    let baths: Double?

    enum CodingKeys: String, CodingKey {
        case id, name, street, city, state, zip, sqft, beds, baths
        case yearBuilt = "year_built"
    }
}

/// A home_members row with its profile embedded (PostgREST `profiles(name, email)`).
struct Member: Identifiable, Decodable, Hashable {
    let userId: String
    let role: String
    let profile: MemberProfile?
    var id: String { userId }

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case role
        case profile = "profiles"
    }
}

struct MemberProfile: Decodable, Hashable {
    let name: String?
    let email: String
}

/// Insert payload for a brand-new home. The DB trigger `handle_new_home` adds the
/// creator as owner, so we never touch home_members from the client (RLS blocks it).
struct NewHome: Encodable {
    let created_by: String
    let name: String
    let street: String?
    let city: String?
    let state: String?
    let zip: String?
}

/// Home settings patch. Explicit `encode(to:)` so cleared fields persist as SQL
/// null (the synthesized encoder omits nil optionals, which would leave them stale).
struct HomeUpdate: Encodable {
    let name: String
    let street: String?
    let city: String?
    let state: String?
    let zip: String?
    let year_built: Int?
    let sqft: Int?
    let beds: Double?
    let baths: Double?

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(name, forKey: .name)
        try c.encode(street, forKey: .street)
        try c.encode(city, forKey: .city)
        try c.encode(state, forKey: .state)
        try c.encode(zip, forKey: .zip)
        try c.encode(year_built, forKey: .year_built)
        try c.encode(sqft, forKey: .sqft)
        try c.encode(beds, forKey: .beds)
        try c.encode(baths, forKey: .baths)
    }

    enum CodingKeys: String, CodingKey {
        case name, street, city, state, zip, year_built, sqft, beds, baths
    }
}

/// Item edit patch. Same null-forcing encode so cleared text fields don't stick.
struct ItemUpdate: Encodable {
    let name: String
    let category: String
    let manufacturer: String?
    let model: String?
    let serial: String?
    let installed_on: String?
    let lifespan_years: Int?

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(name, forKey: .name)
        try c.encode(category, forKey: .category)
        try c.encode(manufacturer, forKey: .manufacturer)
        try c.encode(model, forKey: .model)
        try c.encode(serial, forKey: .serial)
        try c.encode(installed_on, forKey: .installed_on)
        try c.encode(lifespan_years, forKey: .lifespan_years)
    }

    enum CodingKeys: String, CodingKey {
        case name, category, manufacturer, model, serial, installed_on, lifespan_years
    }
}

// MARK: - Address autocomplete

/// One hit from GET /api/address-search (OSM/Nominatim-backed). `state`/`zip` are
/// optional-tolerant — Nominatim omits them for some results. Hashable so the
/// suggestions list can key its ForEach on the whole value.
struct AddressSuggestion: Decodable, Hashable {
    let label: String       // "1600 Pennsylvania Ave NW, Washington, DC 20500"
    let street: String
    let city: String
    let state: String?
    let zip: String?
}

struct AddressSearchResponse: Decodable {
    let suggestions: [AddressSuggestion]
}
