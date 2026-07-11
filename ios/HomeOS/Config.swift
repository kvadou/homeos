import Foundation

// ponytail: the anon key is a public client key — RLS enforces access, so it's
// fine to ship in the binary (same key the web app exposes to the browser).
enum Config {
    static let supabaseURL = URL(string: "https://gpncqcnklcmqiakvdibg.supabase.co")!
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwbmNxY25rbGNtcWlha3ZkaWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MDAxNjgsImV4cCI6MjA5OTM3NjE2OH0.rae02njHHfWkrdEbornftT4WR2K0J4GeRK3-gkNO_yc"
}
