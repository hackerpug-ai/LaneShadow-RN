import XCTest

enum AppLauncher {
    @MainActor
    static func launchApp(
        _ app: XCUIApplication,
        sandbox: Bool = false,
        resetAuth: Bool = false,
        bypassAuth: Bool = false
    ) {
        app.launchEnvironment["LANESHADOW_LAUNCH_SANDBOX"] = sandbox ? "1" : "0"
        forwardRuntimeEnvironment(to: app)
        var arguments = ["-UITesting"]
        if resetAuth {
            arguments.append("-LaneShadowUITestResetAuth")
        }
        if bypassAuth {
            arguments.append("-LaneShadowUITestBypassAuth")
        }
        app.launchArguments = arguments
        app.launch()
    }

    @MainActor
    private static func forwardRuntimeEnvironment(to app: XCUIApplication) {
        let environment = ProcessInfo.processInfo.environment
        for key in [
            "CLERK_PUBLISHABLE_KEY",
            "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY",
            "CONVEX_URL",
            "EXPO_PUBLIC_CONVEX_URL",
        ] {
            guard let value = environment[key], !value.isEmpty else {
                continue
            }
            app.launchEnvironment[key] = value
        }
    }
}
