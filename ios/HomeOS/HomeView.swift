import SwiftUI

struct HomeView: View {
    @Environment(SupabaseService.self) private var supabase

    @State private var greetingName = ""
    @State private var home: Home?
    @State private var systems = 0
    @State private var openTasks = 0
    @State private var itemsTotal = 0

    var body: some View {
        NavigationStack {
            ZStack {
                Color.homeCanvas.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 26) {
                        greeting
                        stats
                    }
                    .padding(20)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { try? await supabase.signOut() }
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                    }
                    .tint(Color.homeNavy)
                }
            }
            .task { await load() }
        }
    }

    private var greeting: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(timeGreeting + (greetingName.isEmpty ? "" : ", \(greetingName)"))
                .font(.largeTitle).fontDesign(.serif).fontWeight(.medium)
                .foregroundStyle(Color.homeInk)
            if let home {
                Label(home.name, systemImage: "house.fill")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.top, 16)
    }

    private var stats: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("At a glance")
                .font(.headline)
                .foregroundStyle(Color.homeInk)
            HStack(spacing: 14) {
                StatTile(value: systems, label: "Systems", icon: "gearshape.2.fill")
                StatTile(value: openTasks, label: "Open Tasks", icon: "checklist")
                StatTile(value: itemsTotal, label: "Items", icon: "square.grid.2x2.fill")
            }
        }
    }

    private var timeGreeting: String {
        switch Calendar.current.component(.hour, from: Date()) {
        case 5..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    private func load() async {
        async let profileTask = try? await supabase.profile()
        async let homeTask = try? await supabase.firstHome()
        let profile = await profileTask ?? nil
        let loadedHome = await homeTask ?? nil

        greetingName = displayName(profile)
        home = loadedHome

        guard let id = loadedHome?.id else { return }
        async let s = try? await supabase.count("items", homeID: id, filters: [("category", "system")])
        async let o = try? await supabase.count("care_tasks", homeID: id, filters: [("status", "open")])
        async let t = try? await supabase.count("items", homeID: id)
        let sVal = (await s) ?? 0
        let oVal = (await o) ?? 0
        let tVal = (await t) ?? 0
        withAnimation(.spring) {
            systems = sVal
            openTasks = oVal
            itemsTotal = tVal
        }
    }

    private func displayName(_ profile: Profile?) -> String {
        if let name = profile?.name, !name.isBlank { return name }
        if let email = profile?.email { return String(email.prefix(while: { $0 != "@" })) }
        return ""
    }
}
