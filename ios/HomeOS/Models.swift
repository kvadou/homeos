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

// ponytail: defined for the thin model layer per spec; v1 only needs the open
// count on the Home tab (fetched as a head-count), so it isn't decoded yet.
struct CareTask: Identifiable, Decodable, Hashable {
    let id: String
    let title: String
    let status: String
    let dueOn: String?

    enum CodingKeys: String, CodingKey {
        case id, title, status
        case dueOn = "due_on"
    }
}
