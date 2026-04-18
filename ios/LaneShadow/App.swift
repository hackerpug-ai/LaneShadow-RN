// native-sandbox: configured
import LaneShadowTheme
import SwiftUI
import NativeSandbox

@main
struct LaneShadowApp: App {
    @State private var convexStore = ConvexStore()

    init() {
        #if DEBUG
        SandboxLaunch.configure(.init(
            argFlags: ["-LaneShadowSandbox"],
            envKeys: ["LANESHADOW_LAUNCH_SANDBOX"]
        ))
        #endif
    }

    var body: some Scene {
        WindowGroup {
            #if DEBUG
            if SandboxLaunch.shouldLaunch {
                LaneShadowSandboxEntry()
            } else {
                ContentView(convexStore: convexStore)
                    .laneShadowTheme()
            }
            #else
            ContentView(convexStore: convexStore)
                .laneShadowTheme()
            #endif
        }
    }
}
