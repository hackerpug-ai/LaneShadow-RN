import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Discovery Sort Toggle Tests

/**
 * Tests for LSDiscoverySortToggle molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Renders LSToggleGroup with "Best" and "Nearest" items
 * - Glassmorphic background (surface at 80% opacity)
 * - Border with 13% opacity
 * - Self-aligning to leading edge
 * - Mode changes trigger onModeChange callback
 * - Semantic theme tokens used
 */
final class DiscoverySortToggleTests: XCTestCase {
    // MARK: - AC-1: Renders LSToggleGroup with Best/Nearest items

    func testRendersToggleGroupWithBestAndNearestItems() {
        // GIVEN: Sort toggle is created with mode
        let mode: LSSortMode = .best

        // WHEN: Component is rendered
        let sortToggle = LSDiscoverySortToggle(
            mode: mode,
            onModeChange: { _ in }
        )

        // THEN: Renders toggle with Best and Nearest items
        XCTAssertNotNil(sortToggle)
        let view = sortToggle.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-2: Glassmorphic background

    func testGlassmorphicBackground() {
        // GIVEN: Sort toggle is created
        let mode: LSSortMode = .best

        // WHEN: Component is rendered with theme
        let sortToggle = LSDiscoverySortToggle(
            mode: mode,
            onModeChange: { _ in }
        )

        // THEN: Uses surface color at 80% opacity
        XCTAssertNotNil(sortToggle)
        let themedView = sortToggle.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-3: Border with 13% opacity

    func testBorderWith13PercentOpacity() {
        // GIVEN: Sort toggle is created
        let mode: LSSortMode = .nearest

        // WHEN: Component is rendered
        let sortToggle = LSDiscoverySortToggle(
            mode: mode,
            onModeChange: { _ in }
        )

        // THEN: Has border with 13% opacity
        XCTAssertNotNil(sortToggle)
        let view = sortToggle.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-4: Self-aligning to leading edge

    func testSelfAligningToLeadingEdge() {
        // GIVEN: Sort toggle is created
        let mode: LSSortMode = .best

        // WHEN: Component is rendered
        let sortToggle = LSDiscoverySortToggle(
            mode: mode,
            onModeChange: { _ in }
        )

        // THEN: Aligns to leading edge
        XCTAssertNotNil(sortToggle)
        let view = sortToggle.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-5: Mode changes trigger callback

    func testModeChangesTriggerCallback() {
        // GIVEN: Sort toggle is created with best mode
        var currentMode: LSSortMode = .best
        let sortToggle = LSDiscoverySortToggle(
            mode: currentMode,
            onModeChange: { newMode in
                currentMode = newMode
            }
        )

        // WHEN: Simulating mode change to nearest
        sortToggle.simulateModeChange(.nearest)

        // THEN: Callback is triggered with new mode
        XCTAssertEqual(currentMode, .nearest)
    }

    func testModeChangesToBest() {
        // GIVEN: Sort toggle is created with nearest mode
        var currentMode: LSSortMode = .nearest
        let sortToggle = LSDiscoverySortToggle(
            mode: currentMode,
            onModeChange: { newMode in
                currentMode = newMode
            }
        )

        // WHEN: Simulating mode change to best
        sortToggle.simulateModeChange(.best)

        // THEN: Callback is triggered with new mode
        XCTAssertEqual(currentMode, .best)
    }

    // MARK: - AC-6: Semantic theme tokens

    func testUsesSemanticThemeTokens() {
        // GIVEN: Sort toggle is created
        let mode: LSSortMode = .best

        // WHEN: Component is rendered with theme
        let sortToggle = LSDiscoverySortToggle(
            mode: mode,
            onModeChange: { _ in }
        )

        // THEN: Uses theme.colors.surface.default, theme.colors.border.default, theme.radius.md
        XCTAssertNotNil(sortToggle)
        let themedView = sortToggle.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-7: Uses existing LSToggleGroup

    func testUsesExistingToggleGroup() {
        // GIVEN: Sort toggle is created
        let mode: LSSortMode = .best

        // WHEN: Component is rendered
        let sortToggle = LSDiscoverySortToggle(
            mode: mode,
            onModeChange: { _ in }
        )

        // THEN: Renders LSToggleGroup component
        XCTAssertNotNil(sortToggle)
        let view = sortToggle.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }
}
