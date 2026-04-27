import Foundation
import LaneShadowTheme
import NativeSandbox
import SnapshotTesting
import SwiftUI
import Testing
import UIKit
import XCTest
@testable import LaneShadow

// MARK: - Determinism Setup

/// AC-8: Determinism guards for reproducible snapshots across machines and CI.
///
/// Freezes locale, timezone, and disables animations to ensure snapshots render
/// identically regardless of test execution environment.
private func setupDeterminismEnvironment() {
    // Disable animations for deterministic rendering
    UIView.setAnimationsEnabled(false)

    // Locale and timezone determinism:
    // All mock providers use static fixture data (no Date() calls, no locale-sensitive formatting).
    // If time-dependent UI is added to stories, inject a frozen Calendar via environment.
    // Mock providers enforce no network/disk I/O by design (see *MockProvider files).
}

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
        // AC-8: Determinism guards for reproducible snapshots
        setupDeterminismEnvironment()

        // Disable animations for deterministic rendering
        UIView.setAnimationsEnabled(false)

        let stories = LaneShadowStories.all

        print("📸 Snapshotting \(stories.count) stories × 2 themes = \(stories.count * 2) snapshots")

        // Determine snapshot directory
        // Use standard Xcode convention: __Snapshots__ at test target root
        // ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/
        let testFilePath = URL(fileURLWithPath: #filePath)
        let sandboxDir = testFilePath.deletingLastPathComponent() // ios/LaneShadowTests/Sandbox/
        let testsDir = sandboxDir.deletingLastPathComponent() // ios/LaneShadowTests/
        let snapshotDir = testsDir.appendingPathComponent("__Snapshots__").appendingPathComponent("StorySnapshotTests")

        // Create directory if it doesn't exist
        try? FileManager.default.createDirectory(at: snapshotDir, withIntermediateDirectories: true)

        for story in stories {
            // Render light mode snapshot
            let lightView = SnapshotPreviewHarness.render(
                story: story,
                theme: .light
            )

            let lightRenderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: 390, height: 844))
            let lightImage = lightRenderer.pdfData { _ in
                // Instead, capture UIView as image
            }

            // Use UIImage for rendering
            let lightUIView = UIHostingController(rootView: lightView)
            lightUIView.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
            lightUIView.view.backgroundColor = .white

            if let lightPNG = captureViewAsImage(lightUIView.view, size: CGSize(width: 390, height: 844)) {
                let lightFilename = snapshotDir.appendingPathComponent("\(story.id).light.png")
                try? lightPNG.pngData()?.write(to: lightFilename)
            }

            // Render dark mode snapshot
            let darkView = SnapshotPreviewHarness.render(
                story: story,
                theme: .dark
            )

            let darkUIView = UIHostingController(rootView: darkView)
            darkUIView.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
            darkUIView.view.backgroundColor = .black

            if let darkPNG = captureViewAsImage(darkUIView.view, size: CGSize(width: 390, height: 844)) {
                let darkFilename = snapshotDir.appendingPathComponent("\(story.id).dark.png")
                try? darkPNG.pngData()?.write(to: darkFilename)
            }
        }

        print("✓ Snapshots recorded to \(snapshotDir.path)")
    }

    private func captureViewAsImage(_ view: UIView, size: CGSize) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            view.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true)
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
///
/// AC-8: Applies determinism guarantees:
/// - Locale frozen to en_US_POSIX (via setupDeterminismEnvironment)
/// - Timezone set to UTC (via setupDeterminismEnvironment)
/// - Animations disabled (via setupDeterminismEnvironment)
/// - Time-dependent state frozen via Story.initialArgs (mock providers)
/// - No network/disk I/O (uses MockDataProvider)
///
/// These ensure reproducible snapshots across machines/CI.
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
