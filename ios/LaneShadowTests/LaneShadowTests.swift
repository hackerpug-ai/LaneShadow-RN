import SwiftUI
import UIKit
import ViewInspector
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
    func test_auth_provider_buttons_expose_expected_accessibility_contract() throws {
        let providers: [(LSAuthProvider, String, String)] = [
            (.apple, "auth.signIn.apple", "Continue with Apple"),
            (.google, "auth.signIn.google", "Continue with Google"),
        ]

        for (provider, identifier, label) in providers {
            let button = LSAuthProviderButton(provider: provider) {}
            let hostedView = button.laneShadowTheme().frame(width: 280)
            _ = host(hostedView)
            let inspectedButton = try hostedView.inspect().find(ViewType.Button.self)

            XCTAssertEqual(try inspectedButton.accessibilityIdentifier(), identifier)
            XCTAssertEqual(try inspectedButton.accessibilityLabel().string(), label)
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

    @MainActor
    private func host(_ rootView: some View) -> HostedHarness {
        let controller = UIHostingController(rootView: AnyView(rootView))
        controller.loadViewIfNeeded()
        controller.view.frame = CGRect(x: 0, y: 0, width: 320, height: 80)
        let window = UIWindow(frame: controller.view.frame)
        window.rootViewController = controller
        window.makeKeyAndVisible()
        controller.view.setNeedsLayout()
        controller.view.layoutIfNeeded()
        window.layoutIfNeeded()
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.01))
        return HostedHarness(window: window, controller: controller)
    }
}

private struct HostedHarness {
    let window: UIWindow
    let controller: UIHostingController<AnyView>
}

extension LSAuthProviderButton: Inspectable {}
