import SwiftUI
import UIKit

// Settings sheet: edit your name + the home profile, see who's on the home, sign
// out. Mirrors the web /settings page (lib/actions/settings.ts) minus invites —
// those need existing accounts and ship as a web-phase feature.
struct SettingsView: View {
    @Environment(SupabaseService.self) private var supabase
    @Environment(\.dismiss) private var dismiss

    // Profile
    @State private var name = ""
    @State private var email = ""

    // Home
    @State private var homeID = ""
    @State private var homeName = ""
    @State private var street = ""
    @State private var city = ""
    @State private var state = ""
    @State private var zip = ""
    @State private var yearBuilt = ""
    @State private var sqft = ""
    @State private var beds = ""
    @State private var baths = ""

    @State private var members: [Member] = []
    @State private var loading = true
    @State private var saving = false
    @State private var error: String?
    @State private var saveTick = 0

    var body: some View {
        NavigationStack {
            ZStack {
                Color.homeCanvas.ignoresSafeArea()
                content
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }
                        .fontWeight(.semibold)
                        .disabled(loading || saving || homeName.isBlank)
                }
            }
            .sensoryFeedback(.success, trigger: saveTick)
            .task { await load() }
        }
    }

    @ViewBuilder private var content: some View {
        if loading {
            ProgressView().tint(Color.homeNavy)
        } else {
            Form {
                Section("Profile") {
                    TextField("Name", text: $name)
                        .textContentType(.name)
                    LabeledContent("Email", value: email)
                        .foregroundStyle(.secondary)
                }
                .listRowBackground(Color.homeSurface)

                Section("Home") {
                    TextField("Home name", text: $homeName)
                    TextField("Street", text: $street)
                        .textContentType(.streetAddressLine1)
                    TextField("City", text: $city)
                        .textContentType(.addressCity)
                    TextField("State", text: $state)
                        .textContentType(.addressState)
                    TextField("ZIP", text: $zip)
                        .textContentType(.postalCode)
                        .keyboardType(.numbersAndPunctuation)
                }
                .listRowBackground(Color.homeSurface)

                Section("Property") {
                    numberField("Year built", text: $yearBuilt, keyboard: .numberPad)
                    numberField("Square feet", text: $sqft, keyboard: .numberPad)
                    numberField("Bedrooms", text: $beds, keyboard: .decimalPad)
                    numberField("Bathrooms", text: $baths, keyboard: .decimalPad)
                }
                .listRowBackground(Color.homeSurface)

                Section {
                    ForEach(members) { member in
                        memberRow(member)
                    }
                } header: {
                    Text("Members")
                } footer: {
                    Text("Invite family from the web app at gethomeos.vercel.app.")
                }
                .listRowBackground(Color.homeSurface)

                if let error {
                    Section {
                        Text(error).font(.footnote).foregroundStyle(.red)
                    }
                    .listRowBackground(Color.homeSurface)
                }

                Section {
                    Button(role: .destructive) {
                        dismiss()
                        Task { try? await supabase.signOut() }
                    } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
                .listRowBackground(Color.homeSurface)
            }
            .scrollContentBackground(.hidden)
        }
    }

    private func memberRow(_ member: Member) -> some View {
        let displayName = (member.profile?.name).flatMap { $0.isBlank ? nil : $0 } ?? "Member"
        return HStack(spacing: 12) {
            Image(systemName: "person.crop.circle.fill")
                .font(.title2)
                .foregroundStyle(Color.homeNavy)
            VStack(alignment: .leading, spacing: 2) {
                Text(displayName)
                    .font(.body).foregroundStyle(Color.homeInk)
                if let email = member.profile?.email, !email.isBlank {
                    Text(email).font(.subheadline).foregroundStyle(.secondary)
                }
            }
            Spacer(minLength: 8)
            Text(member.role.capitalized)
                .font(.caption).fontWeight(.medium)
                .foregroundStyle(Color.homeNavy)
                .padding(.horizontal, 8).padding(.vertical, 4)
                .background(Color.homeNavy.opacity(0.12), in: Capsule())
        }
        .padding(.vertical, 2)
    }

    private func numberField(_ label: String, text: Binding<String>, keyboard: UIKeyboardType) -> some View {
        HStack {
            Text(label).foregroundStyle(Color.homeInk)
            Spacer()
            TextField("—", text: text)
                .keyboardType(keyboard)
                .multilineTextAlignment(.trailing)
                .frame(maxWidth: 120)
        }
    }

    // MARK: - Data

    private func load() async {
        async let profileTask = try? await supabase.profile()
        async let homeTask = try? await supabase.firstHome()
        let profile = await profileTask ?? nil
        let home = await homeTask ?? nil

        name = profile?.name ?? ""
        email = profile?.email ?? ""

        if let id = home?.id {
            homeID = id
            let detail = try? await supabase.homeDetail(id: id)
            let mem = (try? await supabase.members(homeID: id)) ?? []
            if let detail {
                homeName = detail.name
                street = detail.street ?? ""
                city = detail.city ?? ""
                state = detail.state ?? ""
                zip = detail.zip ?? ""
                yearBuilt = detail.yearBuilt.map(String.init) ?? ""
                sqft = detail.sqft.map(String.init) ?? ""
                beds = Self.numString(detail.beds)
                baths = Self.numString(detail.baths)
            }
            members = mem
        }
        loading = false
    }

    private func save() async {
        saving = true
        error = nil
        do {
            let trimmedName = name.trimmed
            if !trimmedName.isEmpty { try await supabase.updateProfileName(trimmedName) }
            try await supabase.updateHome(id: homeID, HomeUpdate(
                name: homeName.trimmed,
                street: street.isBlank ? nil : street.trimmed,
                city: city.isBlank ? nil : city.trimmed,
                state: state.isBlank ? nil : state.trimmed,
                zip: zip.isBlank ? nil : zip.trimmed,
                year_built: Self.parseInt(yearBuilt),
                sqft: Self.parseInt(sqft),
                beds: Self.parseNum(beds),
                baths: Self.parseNum(baths)
            ))
            saveTick += 1
            dismiss()
        } catch {
            self.error = error.localizedDescription
            saving = false
        }
    }

    // MARK: - Number helpers (mirror lib/actions/onboarding.ts toInt/toNum)

    static func parseInt(_ s: String) -> Int? {
        let digits = s.filter(\.isNumber)
        return digits.isEmpty ? nil : Int(digits)
    }

    static func parseNum(_ s: String) -> Double? {
        let cleaned = s.filter { $0.isNumber || $0 == "." }
        return cleaned.isEmpty ? nil : Double(cleaned)
    }

    /// Whole numbers render without a trailing ".0"; halves keep their decimal.
    static func numString(_ v: Double?) -> String {
        guard let v else { return "" }
        return v == v.rounded() ? String(Int(v)) : String(v)
    }
}
