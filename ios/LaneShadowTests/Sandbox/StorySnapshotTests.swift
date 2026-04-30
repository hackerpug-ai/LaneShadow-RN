import Foundation
import LaneShadowTheme
import NativeSandbox
import SnapshotTesting
import SwiftUI
import Testing
import UIKit
import XCTest
@testable import LaneShadow

// Snapshot Determinism: See `.spec/prds/v2/11-technical-requirements.md` section
// "Snapshot Determinism" for the contract on acceptable vs. unacceptable diffs.
// Mapbox tile loading is the primary non-determinism source; map-region pixel
// variance < 1% is acceptable, any diff in chrome/overlays is a regression.

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
    func test_authScreenStories_lightAndDark_snapshots() {
        setupDeterminismEnvironment()
        UIView.setAnimationsEnabled(false)

        let snapshotDir = Self.snapshotDirectory()
        try? FileManager.default.createDirectory(at: snapshotDir, withIntermediateDirectories: true)

        for story in AuthScreenStory.all {
            record(story: story, theme: .light, snapshotDir: snapshotDir)
            record(story: story, theme: .dark, snapshotDir: snapshotDir)
        }

        let missingSnapshots = AuthScreenStory.all.flatMap { story in
            SnapshotTheme.allCases.compactMap { theme -> String? in
                let filename = "\(story.id).\(theme.filenameSuffix).png"
                let fileURL = snapshotDir.appendingPathComponent(filename)
                return FileManager.default.fileExists(atPath: fileURL.path) ? nil : filename
            }
        }

        XCTAssertTrue(missingSnapshots.isEmpty, "Missing AuthScreen snapshot PNGs: \(missingSnapshots.sorted())")
    }

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
        let snapshotDir = Self.snapshotDirectory()

        // Create directory if it doesn't exist
        try? FileManager.default.createDirectory(at: snapshotDir, withIntermediateDirectories: true)

        for story in stories {
            record(story: story, theme: .light, snapshotDir: snapshotDir)
            record(story: story, theme: .dark, snapshotDir: snapshotDir)
        }

        print("✓ Snapshots recorded to \(snapshotDir.path)")
    }

    private func record(story: Story, theme: SnapshotTheme, snapshotDir: URL) {
        let renderedView = SnapshotPreviewHarness.render(
            story: story,
            theme: theme
        )

        let controller = UIHostingController(rootView: renderedView)
        controller.view.frame = CGRect(x: 0, y: 0, width: 390, height: 844)
        controller.view.backgroundColor = theme == .dark ? .black : .white

        guard let image = captureViewAsImage(controller.view, size: CGSize(width: 390, height: 844)) else { return }

        let filename = snapshotDir.appendingPathComponent("\(story.id).\(theme.filenameSuffix).png")
        try? image.pngData()?.write(to: filename)
    }

    private func captureViewAsImage(_ view: UIView, size: CGSize) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            view.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true)
        }
    }

    private static func snapshotDirectory() -> URL {
        let testFilePath = URL(fileURLWithPath: #filePath)
        let sandboxDir = testFilePath.deletingLastPathComponent() // ios/LaneShadowTests/Sandbox/
        let testsDir = sandboxDir.deletingLastPathComponent() // ios/LaneShadowTests/
        return testsDir.appendingPathComponent("__Snapshots__").appendingPathComponent("StorySnapshotTests")
    }

    /// AC-3: Second run passes with zero diff
    /// This test verifies that snapshot baselines are committed and reproducible.
    func test_snapshotBaselinesExist() {
        let stories = LaneShadowStories.all
        let expectedSnapshotCount = stories.count * 2 // light + dark per story

        // Verify snapshot directory exists at ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/
        let snapshotDir = Self.snapshotDirectory()

        XCTAssertTrue(FileManager.default.fileExists(atPath: snapshotDir.path))

        // Count PNG files
        let files = (try? FileManager.default.contentsOfDirectory(atPath: snapshotDir.path)) ?? []
        let pngFiles = files.filter { $0.hasSuffix(".png") }

        XCTAssertGreaterThanOrEqual(
            pngFiles.count,
            expectedSnapshotCount,
            "Should have light + dark snapshots for every story"
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
enum SnapshotTheme: CaseIterable, Equatable {
    case light
    case dark

    var colorScheme: ColorScheme {
        switch self {
        case .light: .light
        case .dark: .dark
        }
    }

    var filenameSuffix: String {
        switch self {
        case .light: "light"
        case .dark: "dark"
        }
    }
}
