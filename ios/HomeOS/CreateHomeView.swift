import SwiftUI

// Shown when someone is signed in but has no home yet (the iOS-first-signup dead
// end). A friendly one-screen create form — the full guided onboarding stays web.
// Mirrors lib/actions/onboarding.ts: insert a homes row with created_by; the DB
// trigger adds the owner membership. Systems/goals/features are web-only.
struct CreateHomeView: View {
    @Environment(SupabaseService.self) private var supabase
    let onCreated: () -> Void

    @State private var name = ""
    @State private var street = ""
    @State private var city = ""
    @State private var state = ""
    @State private var zip = ""
    @State private var saving = false
    @State private var error: String?

    var body: some View {
        ZStack {
            Color.homeCanvas.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    header
                    fields
                    if let error { banner(error) }
                    submit
                    signOut
                }
                .padding(24)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: "house.lodge.fill")
                .font(.largeTitle)
                .foregroundStyle(Color.homeNavy)
            Text("Set up your home")
                .font(.largeTitle).fontDesign(.serif).fontWeight(.medium)
                .foregroundStyle(Color.homeInk)
            Text("Just an address to start. You can add the rest anytime in Settings.")
                .font(.title3).fontDesign(.serif)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.top, 48)
        .padding(.bottom, 6)
    }

    private var fields: some View {
        VStack(spacing: 14) {
            // Street first + .streetAddressLine1 so iOS QuickType offers the
            // user's contact-card address above the keyboard.
            LabeledField(icon: "mappin.and.ellipse", placeholder: "Street address", text: $street)
                .textContentType(.streetAddressLine1)
            HStack(spacing: 14) {
                LabeledField(icon: "building.2", placeholder: "City", text: $city)
                    .textContentType(.addressCity)
                LabeledField(icon: "flag", placeholder: "State", text: $state)
                    .textContentType(.addressState)
                    .frame(maxWidth: 110)
            }
            LabeledField(icon: "number", placeholder: "ZIP", text: $zip)
                .textContentType(.postalCode)
                .keyboardType(.numbersAndPunctuation)
            LabeledField(icon: "house", placeholder: "Home name (optional)", text: $name)
                .textInputAutocapitalization(.words)
        }
    }

    private var submit: some View {
        Button {
            Task { await create() }
        } label: {
            HStack(spacing: 8) {
                if saving { ProgressView().tint(.white) }
                Text("Create home").fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .controlSize(.large)
        .tint(Color.homeNavy)
        .disabled(saving || (name.isBlank && street.isBlank))
    }

    private var signOut: some View {
        Button {
            Task { try? await supabase.signOut() }
        } label: {
            Text("Sign out")
                .font(.subheadline)
                .foregroundStyle(Color.homeNavy)
        }
        .frame(maxWidth: .infinity, minHeight: 44)   // HIG: 44pt tap target
        .padding(.top, 4)
    }

    private func banner(_ text: String) -> some View {
        Text(text)
            .font(.footnote)
            .foregroundStyle(.red)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(Color.red.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private func create() async {
        guard let uid = supabase.currentUser?.id else { return }
        saving = true
        error = nil
        do {
            _ = try await supabase.createHome(NewHome(
                created_by: uid.uuidString,
                name: derivedName(),
                street: street.isBlank ? nil : street.trimmed,
                city: city.isBlank ? nil : city.trimmed,
                state: state.isBlank ? nil : state.trimmed,
                zip: zip.isBlank ? nil : zip.trimmed
            ))
            onCreated()
        } catch {
            self.error = error.localizedDescription
            saving = false
        }
    }

    // Blank name falls back to the street with its leading house number stripped
    // ("7263 Little Ave NE" -> "Little Ave NE"). Web parity: lib/onboarding.ts homeShortName.
    private func derivedName() -> String {
        if !name.isBlank { return name.trimmed }
        let s = street.trimmed
        let stripped = s.replacingOccurrences(of: #"^\d+\s+"#, with: "", options: .regularExpression)
        return stripped.isEmpty ? s : stripped
    }
}
