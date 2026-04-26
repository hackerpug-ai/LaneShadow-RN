import Combine
import Foundation
import LaneShadowTheme
@preconcurrency import NativeSandbox
import XCTest
@testable import LaneShadow

/// Tests for LaneShadowSandboxThemeController bridge between NativeSandbox.ThemeMode
/// and LaneShadow's theming system.
@MainActor
final class ThemeControllerTests: XCTestCase {
    // MARK: - AC-1: Theme controller bridge

    func test_theme_controller_conforms_to_native_sandbox_protocol() {
        // GIVEN: The theme controller type
        // WHEN: We check protocol conformance
        // THEN: LaneShadowSandboxThemeController should conform to ThemeController
        let controller = LaneShadowSandboxThemeController()
        XCTAssertTrue(
            controller is ThemeController,
            "LaneShadowSandboxThemeController must conform to NativeSandbox.ThemeController"
        )
    }

    func test_theme_controller_is_observable_object() {
        // GIVEN: The theme controller type
        // WHEN: We check ObservableObject conformance
        // THEN: LaneShadowSandboxThemeController should conform to ObservableObject
        let controller = LaneShadowSandboxThemeController()
        XCTAssertTrue(
            controller is ObservableObject,
            "LaneShadowSandboxThemeController must conform to ObservableObject"
        )
    }

    func test_theme_mode_light_maps_correctly() {
        // GIVEN: A theme controller
        let controller = LaneShadowSandboxThemeController()

        // WHEN: We set themeMode to .alwaysLight
        controller.themeMode = NativeSandbox.ThemeMode.alwaysLight

        // THEN: hostThemeMode should map to .light
        XCTAssertEqual(
            controller.hostThemeMode,
            LaneShadowThemeMode.light,
            "ThemeMode.alwaysLight should map to LaneShadowThemeMode.light"
        )
    }

    func test_theme_mode_dark_maps_correctly() {
        // GIVEN: A theme controller
        let controller = LaneShadowSandboxThemeController()

        // WHEN: We set themeMode to .alwaysDark
        controller.themeMode = NativeSandbox.ThemeMode.alwaysDark

        // THEN: hostThemeMode should map to .dark
        XCTAssertEqual(
            controller.hostThemeMode,
            LaneShadowThemeMode.dark,
            "ThemeMode.alwaysDark should map to LaneShadowThemeMode.dark"
        )
    }

    func test_theme_mode_auto_maps_correctly() {
        // GIVEN: A theme controller
        let controller = LaneShadowSandboxThemeController()

        // WHEN: We set themeMode to .auto
        controller.themeMode = NativeSandbox.ThemeMode.auto

        // THEN: hostThemeMode should map to .auto
        XCTAssertEqual(
            controller.hostThemeMode,
            LaneShadowThemeMode.auto,
            "ThemeMode.auto should map to LaneShadowThemeMode.auto"
        )
    }

    // MARK: - AC-2: Live theme toggle re-renders stories

    func test_theme_mode_change_publishes_within_one_runloop_tick() async throws {
        // GIVEN: A theme controller with initial mode
        let controller = LaneShadowSandboxThemeController()
        controller.themeMode = NativeSandbox.ThemeMode.auto

        var receivedModes: [NativeSandbox.ThemeMode] = []
        let expectation = expectation(description: "Theme mode publishes")
        expectation.expectedFulfillmentCount = 3

        // WHEN: We subscribe to themeMode changes
        let cancellable = controller.$themeMode
            .sink { mode in
                receivedModes.append(mode)
                expectation.fulfill()
            }

        // THEN: Changes should publish immediately
        try await Task.sleep(nanoseconds: 10_000_000) // 0.01s
        controller.themeMode = NativeSandbox.ThemeMode.alwaysLight
        controller.themeMode = NativeSandbox.ThemeMode.alwaysDark

        try await fulfillment(of: [expectation], timeout: 1.0)

        XCTAssertEqual(
            receivedModes,
            [NativeSandbox.ThemeMode.auto, NativeSandbox.ThemeMode.alwaysLight, NativeSandbox.ThemeMode.alwaysDark],
            "All mode changes should publish"
        )
        cancellable.cancel()
    }

    // MARK: - AC-5: Theme scoped to sandbox

    func test_controller_not_referenced_outside_sandbox() throws {
        // GIVEN: The iOS project structure
        // WHEN: We search for LaneShadowSandboxThemeController references
        // THEN: It should only appear under Sandbox/ and tests/

        let projectRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent() // Tests
            .deletingLastPathComponent() // LaneShadowTests
            .deletingLastPathComponent() // ios
            .deletingLastPathComponent() // LaneShadow

        let iosDir = projectRoot.appendingPathComponent("ios")

        // Find all .swift files
        let swiftFiles = try FileManager.default
            .enumerator(at: iosDir, includingPropertiesForKeys: nil)?
            .compactMap { $0 as? URL }
            .filter { $0.pathExtension == "swift" }
            ?? []

        var violations: [String] = []

        for file in swiftFiles {
            let content = try String(contentsOf: file)
            if content.contains("LaneShadowSandboxThemeController") {
                let relativePath = file.path.replacingOccurrences(of: iosDir.path + "/", with: "")
                // Allow references in Sandbox/ and LaneShadowTests/Sandbox/
                if !relativePath.hasPrefix("LaneShadow/Sandbox/"),
                   !relativePath.hasPrefix("LaneShadowTests/Sandbox/")
                {
                    violations.append(relativePath)
                }
            }
        }

        XCTAssertTrue(
            violations.isEmpty,
            "LaneShadowSandboxThemeController should only be referenced under Sandbox/ or tests/. Found in: \(violations.joined(separator: ", "))"
        )
    }
}
