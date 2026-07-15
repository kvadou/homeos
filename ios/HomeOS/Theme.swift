import SwiftUI
import UIKit

// Brand colors live in the asset catalog (light + dark variants) so no hex
// appears in view code and Dark Mode keeps working.
extension Color {
    static let homeCanvas = Color("HomeCanvas")   // warm cream background
    static let homeSurface = Color("HomeSurface")  // card / row surface
    static let homeInk = Color("HomeInk")          // primary text
    static let homeNavy = Color("HomeNavy")        // brand accent
}

enum Theme {
    /// Serif, Dynamic-Type-aware navigation titles on the cream chrome.
    static func applyNavigationBarAppearance() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(named: "HomeCanvas")
        appearance.shadowColor = .clear
        let ink = UIColor(named: "HomeInk") ?? .label
        if let large = serifFont(.largeTitle) {
            appearance.largeTitleTextAttributes = [.font: large, .foregroundColor: ink]
        }
        if let inline = serifFont(.headline) {
            appearance.titleTextAttributes = [.font: inline, .foregroundColor: ink]
        }
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
    }

    // New York (system serif) sized from the preferred text style, so it still
    // respects the user's Dynamic Type setting at launch.
    private static func serifFont(_ style: UIFont.TextStyle) -> UIFont? {
        let base = UIFontDescriptor.preferredFontDescriptor(withTextStyle: style)
        guard let serif = base.withDesign(.serif) else { return nil }
        return UIFont(descriptor: serif, size: 0)
    }
}

extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
    var isBlank: Bool { trimmed.isEmpty }
}

// SF Symbol per item category — falls back to a generic glyph.
func categoryIcon(_ category: String) -> String {
    switch category.lowercased() {
    case "system": return "gearshape.2.fill"
    case "appliance": return "washer.fill"
    case "fixture": return "lightbulb.fill"
    case "structure", "paint", "exterior": return "house.fill"
    case "equipment", "yard", "measurement": return "wrench.and.screwdriver.fill"
    case "safety": return "checkmark.shield.fill"
    default: return "shippingbox.fill"
    }
}

func libraryCategory(_ category: String) -> String {
    switch category.lowercased() {
    case "appliance": return "appliance"
    case "system": return "system"
    case "fixture": return "fixture"
    case "structure", "paint", "exterior": return "structure"
    case "equipment", "yard", "measurement": return "equipment"
    case "safety": return "safety"
    default: return "equipment"
    }
}

func categoryLabel(_ category: String) -> String {
    switch libraryCategory(category) {
    case "appliance": return "Appliances"
    case "system": return "Systems"
    case "fixture": return "Fixtures"
    case "structure": return "Structure"
    case "equipment": return "Equipment"
    case "safety": return "Safety & Security"
    default: return category.capitalized
    }
}

func likelyOutOfScopeItem(_ name: String) -> Bool {
    let value = name.lowercased()
    return ["hot sauce", "pepper sauce", "ketchup", "mustard", "mayonnaise", "salsa",
            "food", "beverage", "drink", "snack", "candy", "medicine", "vitamin",
            "shampoo", "soap", "toothpaste", "cosmetic", "shirt", "shoe"]
        .contains { value.contains($0) }
}

// MARK: - Shared small views

struct LabeledField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    var secure = false

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
                .frame(width: 22)
            Group {
                if secure {
                    SecureField(placeholder, text: $text)
                } else {
                    TextField(placeholder, text: $text)
                }
            }
            .font(.body)
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 16)
        .background(Color.homeSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(Color.homeInk.opacity(0.08))
        )
    }
}

struct StatTile: View {
    let value: Int
    let label: String
    let icon: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(Color.homeNavy)
            Text("\(value)")
                .font(.largeTitle).fontDesign(.serif).fontWeight(.medium)
                .foregroundStyle(Color.homeInk)
                .contentTransition(.numericText())
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(Color.homeSurface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}
