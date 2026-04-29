import XCTest

final class RootViewTests: XCTestCase {
    private var repoRoot: URL {
        URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
    }

    func testRootViewReplacesContentViewAsAppEntry() throws {
        let appFile = repoRoot.appendingPathComponent("ios/LaneShadow/App.swift")
        let rootViewFile = repoRoot.appendingPathComponent("ios/LaneShadow/RootView.swift")
        let contentViewFile = repoRoot.appendingPathComponent("ios/LaneShadow/ContentView.swift")
        let appSource = try String(contentsOf: appFile, encoding: .utf8)

        XCTAssertTrue(FileManager.default.fileExists(atPath: rootViewFile.path))
        XCTAssertTrue(appSource.contains("RootView("))
        XCTAssertFalse(FileManager.default.fileExists(atPath: contentViewFile.path))
    }

    func testAppStateObservableModelCreated() throws {
        let appStateFile = repoRoot.appendingPathComponent("ios/LaneShadow/Models/AppState.swift")
        XCTAssertTrue(FileManager.default.fileExists(atPath: appStateFile.path))

        let source = try String(contentsOf: appStateFile, encoding: .utf8)
        XCTAssertTrue(source.contains("@Observable"))
        XCTAssertTrue(source.contains("var isAuthenticated: Bool"))
    }

    func testAuthGateSwitchImplemented() throws {
        let rootViewFile = repoRoot.appendingPathComponent("ios/LaneShadow/RootView.swift")
        let source = try String(contentsOf: rootViewFile, encoding: .utf8)

        XCTAssertTrue(source.contains("AppState"))
        XCTAssertTrue(source.contains("isAuthenticated"))
        XCTAssertTrue(source.contains("AuthFlow"))
        XCTAssertTrue(source.contains("AppFlow"))
    }

    func testAuthFlowNavigationStackCreated() {
        let signIn = repoRoot.appendingPathComponent("ios/LaneShadow/Views/AuthFlow/SignInView.swift")
        let signUp = repoRoot.appendingPathComponent("ios/LaneShadow/Views/AuthFlow/SignUpView.swift")
        XCTAssertTrue(FileManager.default.fileExists(atPath: signIn.path))
        XCTAssertTrue(FileManager.default.fileExists(atPath: signUp.path))
    }

    func testAppFlowNavigationStackCreated() {
        let appHome = repoRoot.appendingPathComponent("ios/LaneShadow/Views/AppFlow/AppHomeView.swift")
        XCTAssertTrue(FileManager.default.fileExists(atPath: appHome.path))
    }

    func testAppEnvironmentDIContainerImplemented() throws {
        let envFile = repoRoot.appendingPathComponent("ios/LaneShadow/Environment/AppEnvironment.swift")
        XCTAssertTrue(FileManager.default.fileExists(atPath: envFile.path))
        let source = try String(contentsOf: envFile, encoding: .utf8)
        XCTAssertTrue(source.contains("ClerkAuth"))
        XCTAssertTrue(source.contains("LaneShadowConvexClient"))
    }

    func testDeepLinkHandlingImplemented() throws {
        let rootViewFile = repoRoot.appendingPathComponent("ios/LaneShadow/RootView.swift")
        let source = try String(contentsOf: rootViewFile, encoding: .utf8)
        XCTAssertTrue(source.contains("onOpenURL"))
        XCTAssertTrue(source.contains("handleDeepLink"))
    }
}
