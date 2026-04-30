import XCTest

final class LaneShadowTests: XCTestCase {
    func test_sandbox_sources_exist() {
        XCTAssertNotNil(try? sandboxSource(named: "LaneShadowStories.swift"))
        XCTAssertNotNil(try? sandboxSource(named: "LaneShadowSandboxEntry.swift"))
        XCTAssertNotNil(try? sandboxStoriesSource(named: "AtomsStories.swift"))
    }

    func test_sandboxPresentation_parsingHooksExistInAppSource() {
        let appSource = try? appSource(named: "App.swift")

        XCTAssertNotNil(appSource)
        XCTAssertTrue(appSource?.contains("struct LaneShadowSandboxPresentation: Equatable") == true)
        XCTAssertTrue(appSource?.contains("arguments.contains(\"-LaneShadowSandbox\")") == true)
        XCTAssertTrue(appSource?.contains("requestedStoryId(from: arguments)") == true)
        XCTAssertTrue(appSource?.contains("SandboxLaunch.handleURL(url)") == true)
        XCTAssertTrue(appSource?.contains(".first(where: { $0.name == \"id\" })") == true)
        XCTAssertTrue(appSource?.contains("environment[\"LANESHADOW_LAUNCH_SANDBOX\"] == \"1\"") == true)
    }

    func test_auth_provider_button_matches_provider_contract_source() throws {
        let source = try designSystemSource(named: "LSAuthProviderButton.swift")

        XCTAssertTrue(source.contains("Continue with Apple"))
        XCTAssertTrue(source.contains("Continue with Google"))
        XCTAssertTrue(source.contains("accessibilityLabel"))
        XCTAssertTrue(source.contains("apple"))
        XCTAssertTrue(source.contains("google"))
    }

    func test_auth_primitive_snapshot_baselines_exist() {
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
        let snapshotDir = root
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadowTests")
            .appendingPathComponent("__Snapshots__")
            .appendingPathComponent("StorySnapshotTests")

        let expected = [
            "molecules.auth-provider-button.apple.light.png",
            "molecules.auth-provider-button.apple.dark.png",
            "molecules.auth-provider-button.google.light.png",
            "molecules.auth-provider-button.google.dark.png",
        ]

        for file in expected {
            XCTAssertTrue(
                FileManager.default.fileExists(atPath: snapshotDir.appendingPathComponent(file).path),
                "Missing snapshot baseline: \(file)"
            )
        }
    }

    private func sandboxSource(named fileName: String) throws -> String {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let fileURL = repoRoot
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Sandbox")
            .appendingPathComponent(fileName)

        return try String(contentsOf: fileURL, encoding: .utf8)
    }

    private func sandboxStoriesSource(named fileName: String) throws -> String {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let fileURL = repoRoot
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("Sandbox")
            .appendingPathComponent("Stories")
            .appendingPathComponent(fileName)

        return try String(contentsOf: fileURL, encoding: .utf8)
    }

    private func appSource(named fileName: String) throws -> String {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let fileURL = repoRoot
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent(fileName)

        return try String(contentsOf: fileURL, encoding: .utf8)
    }

    private func designSystemSource(named fileName: String) throws -> String {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()

        let fileURL = repoRoot
            .appendingPathComponent("ios")
            .appendingPathComponent("LaneShadow")
            .appendingPathComponent("DesignSystem")
            .appendingPathComponent("Molecules")
            .appendingPathComponent(fileName)

        return try String(contentsOf: fileURL, encoding: .utf8)
    }
}
