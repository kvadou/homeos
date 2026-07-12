import SwiftUI

@main
struct HomeOSApp: App {
    @State private var supabase = SupabaseService()

    init() {
        Theme.applyNavigationBarAppearance()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(supabase)
                .tint(Color.homeNavy)
                .task { await supabase.observeAuth() }
        }
    }
}

struct RootView: View {
    @Environment(SupabaseService.self) private var supabase

    private enum HomeGate { case checking, needsHome, ready }
    @State private var gate: HomeGate = .checking

    var body: some View {
        Group {
            if supabase.isBootstrapping {
                LoadingView()
            } else if supabase.currentUser == nil {
                AuthView()
            } else {
                switch gate {
                case .checking: LoadingView()   // resolving firstHome — no flash
                case .needsHome: CreateHomeView { gate = .ready }
                case .ready: MainTabView()
                }
            }
        }
        // Re-resolve whenever the signed-in identity changes (sign in/out/switch).
        .task(id: supabase.currentUser?.id) { await resolveHome() }
    }

    private func resolveHome() async {
        guard supabase.currentUser != nil else { gate = .checking; return }
        gate = .checking
        let home = (try? await supabase.firstHome()) ?? nil
        gate = home == nil ? .needsHome : .ready
    }
}

struct MainTabView: View {
    @State private var selection = 0

    var body: some View {
        TabView(selection: $selection) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(0)
            CareView()
                .tabItem { Label("Care", systemImage: "heart.text.square.fill") }
                .tag(1)
            ProjectsView()
                .tabItem { Label("Projects", systemImage: "hammer.fill") }
                .tag(2)
            LibraryView()
                .tabItem { Label("Library", systemImage: "square.grid.2x2.fill") }
                .tag(3)
            AskView()
                .tabItem { Label("Ask", systemImage: "sparkles") }
                .tag(4)
        }
    }
}

struct LoadingView: View {
    var body: some View {
        ZStack {
            Color.homeCanvas.ignoresSafeArea()
            ProgressView().tint(Color.homeNavy)
        }
    }
}
