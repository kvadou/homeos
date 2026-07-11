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

    var body: some View {
        Group {
            if supabase.isBootstrapping {
                LoadingView()
            } else if supabase.currentUser == nil {
                AuthView()
            } else {
                MainTabView()
            }
        }
    }
}

struct MainTabView: View {
    @State private var selection = 0

    var body: some View {
        TabView(selection: $selection) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(0)
            LibraryView()
                .tabItem { Label("Library", systemImage: "square.grid.2x2.fill") }
                .tag(1)
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
