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

    enum CodingKeys: String, CodingKey {
        case id, name, type
        case itemId = "item_id"
        case createdAt = "created_at"
        case extractionStatus = "extraction_status"
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

// Insert payload for a captured receipt/photo — mirrors recordUpload's files row
// (lib/actions/library.ts). extraction_status: 'pending' for receipts (ingest fires),
// 'none' for photos (vision deferred).
struct NewFile: Encodable {
    let home_id: String
    let item_id: String?
    let type: String
    let name: String
    let storage_path: String
    let content_hash: String
    let extraction_status: String
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
