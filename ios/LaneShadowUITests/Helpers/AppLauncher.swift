import XCTest

enum AppLauncher {
    static func launchApp(_ app: XCUIApplication, sandbox: Bool = false) {
        app.launchEnvironment["LANESHADOW_LAUNCH_SANDBOX"] = sandbox ? "1" : "0"
        app.launch()
    }
}
