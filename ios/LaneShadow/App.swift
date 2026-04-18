import SwiftUI

@main
struct LaneShadowApp: App {
    @State private var convexStore = ConvexStore()

    var body: some Scene {
        WindowGroup {
            ContentView(convexStore: convexStore)
        }
    }
}
