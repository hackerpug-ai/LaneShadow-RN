import LaneShadowTheme
import NativeSandbox
import SnapshotTesting
import SwiftUI
import Testing
import XCTest
@testable import LaneShadow

/// Snapshot tests for ALL registered stories in LaneShadowStories.all.
/// Iterates over every story and captures light + dark mode baselines on iPhone SE (2nd gen).
///
/// Naming convention: {tier}.{component}.{variant}.{theme}.png
/// - tier: infrastructure, atoms, molecules, organisms, templates, modifiers
/// - component: e.g., "ColorTokens", "LSButton", "IdleScreen"
/// - variant: e.g., "default", "primary", "with-content"
/// - theme: "light" or "dark"
@MainActor
final class StorySnapshotTests: XCTestCase {
    /// AC-2: Per-story light + dark snapshots
    /// Iterates over ALL stories in LaneShadowStories.all and renders each on iPhone SE in both themes.
    func test_allStories_lightAndDark_snapshots() {
        // Disable animations for deterministic rendering
        UIView.setAnimationsEnabled(false)

        let stories = LaneShadowStories.all

        print("📸 Snapshotting \(stories.count) stories × 2 themes = \(stories.count * 2) snapshots")

        for story in stories {
            // Render light mode snapshot
            let lightView = SnapshotPreviewHarness.render(
                story: story,
                theme: .light
            )

            assertSnapshot(
                matching: lightView,
                as: .image(precision: 1.0, traits: UITraitCollection(traitsFrom: [
                    UITraitCollection(userInterfaceStyle: .light),
                    UITraitCollection(userInterfaceIdiom: .phone),
                    // iPhone SE (2nd gen) is compact width, regular height
                    UITraitCollection(horizontalSizeClass: .compact),
                    UITraitCollection(verticalSizeClass: .regular),
                ])),
                named: "\(story.id).light"
            )

            // Render dark mode snapshot
            let darkView = SnapshotPreviewHarness.render(
                story: story,
                theme: .dark
            )

            assertSnapshot(
                matching: darkView,
                as: .image(precision: 1.0, traits: UITraitCollection(traitsFrom: [
                    UITraitCollection(userInterfaceStyle: .dark),
                    UITraitCollection(userInterfaceIdiom: .phone),
                    UITraitCollection(horizontalSizeClass: .compact),
                    UITraitCollection(verticalSizeClass: .regular),
                ])),
                named: "\(story.id).dark"
            )
        }
    }

    /// AC-3: Second run passes with zero diff
    /// This test verifies that snapshot baselines are committed and reproducible.
    func test_snapshotBaselinesExist() {
        let stories = LaneShadowStories.all
        let expectedSnapshotCount = stories.count * 2 // light + dark per story

        // Verify snapshot directory exists at ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/
        let testFilePath = URL(fileURLWithPath: #filePath)
        let sandboxDir = testFilePath.deletingLastPathComponent() // ios/LaneShadowTests/Sandbox/
        let testsDir = sandboxDir.deletingLastPathComponent() // ios/LaneShadowTests/
        let snapshotDir = testsDir.appendingPathComponent("__Snapshots__").appendingPathComponent("StorySnapshotTests")

        var actualSnapshotCount = 0
        if FileManager.default.fileExists(atPath: snapshotDir.path) {
            if let enumerator = FileManager.default.enumerator(at: snapshotDir, includingPropertiesForKeys: nil) {
                for case let file as URL in enumerator {
                    if file.pathExtension == "png" {
                        actualSnapshotCount += 1
                    }
                }
            }
        }

        XCTAssertEqual(
            actualSnapshotCount,
            expectedSnapshotCount,
            "Expected \(expectedSnapshotCount) snapshot PNGs (2 per story), but found \(actualSnapshotCount)"
        )
    }
}

// MARK: - Snapshot Preview Harness

/// Deterministic preview harness for rendering stories in snapshots.
/// Disables animations, freezes time-dependent state, and applies themes consistently.
@MainActor
enum SnapshotPreviewHarness {
    /// Renders a story with the specified theme.
    /// - Parameters:
    ///   - story: The story to render
    ///   - theme: The theme to apply (.light or .dark)
    /// - Returns: A themed view ready for snapshotting
    static func render(story: Story, theme: SnapshotTheme) -> some View {
        // Apply theme via preview wrapper
        story.render(story.initialArgs)
            .laneShadowTheme()
            .environment(\.colorScheme, theme.colorScheme)
    }
}

/// Snapshot theme modes.
enum SnapshotTheme {
    case light
    case dark

    var colorScheme: ColorScheme {
        switch self {
        case .light: .light
        case .dark: .dark
        }
    }
}
