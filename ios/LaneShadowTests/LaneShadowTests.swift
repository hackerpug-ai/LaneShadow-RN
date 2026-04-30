import SwiftUI
import XCTest
@testable import LaneShadow

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

    @MainActor
    func test_auth_provider_buttons_expose_expected_accessibility_contract() {
        let providers: [(LSAuthProvider, String)] = [
            (.apple, "auth.signIn.apple"),
            (.google, "auth.signIn.google"),
        ]

        for (provider, identifier) in providers {
            let host = UIHostingController(rootView: LSAuthProviderButton(provider: provider) {})
            host.loadViewIfNeeded()
            host.view.frame = CGRect(x: 0, y: 0, width: 390, height: 80)
            host.view.layoutIfNeeded()

            let button = findButton(in: host.view)
            XCTAssertNotNil(button, "Expected button for provider \(provider)")
            XCTAssertEqual(button?.accessibilityIdentifier, identifier)
            XCTAssertEqual(button?.accessibilityLabel, provider.accessibilityLabel)
        }
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

    private func findButton(in view: UIView) -> UIButton? {
        if let button = view as? UIButton {
            return button
        }
        for subview in view.subviews {
            if let match = findButton(in: subview) {
                return match
            }
        }
        return nil
    }
}
