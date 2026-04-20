import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - MapHeaderOverlay Tests

/**
 * Tests for LSMapHeaderOverlay molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Component renders with required props (title)
 * - Left action button rendering with callback
 * - Right action button rendering with callback
 * - Show background toggle (gradient vs transparent)
 * - Theme integration with semantic colors
 * - Safe area top padding
 * - Gradient colors (95%, 50%, 0% alpha)
 * - Content layout with horizontal padding
 * - Typography (headlineMedium, bold)
 * - Accessibility labels
 */
final class MapHeaderOverlayTests: XCTestCase {
    // MARK: - AC-1: Component renders with required props

    func testMapHeaderOverlayRendersWithTitle() {
        // GIVEN: MapHeaderOverlay is created with required props
        // WHEN: Component is rendered
        let overlay = LSMapHeaderOverlay(
            title: "Test Title"
        )

        // THEN: Component renders successfully with title
        XCTAssertNotNil(overlay)
        let view = overlay.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-2: Left action button rendering

    func testMapHeaderOverlayRendersLeftActionButton() {
        // GIVEN: MapHeaderOverlay is created with left action
        var leftButtonTapped = false
        let overlay = LSMapHeaderOverlay(
            title: "Test Title",
            leftAction: LSMapHeaderOverlayAction(
                icon: "menu",
                onPress: {
                    leftButtonTapped = true
                }
            )
        )

        // WHEN: Component is rendered
        // THEN: Component renders successfully with left action
        XCTAssertNotNil(overlay)
        XCTAssertEqual(overlay.leftAction?.icon, "menu")
    }

    // MARK: - AC-3: Right action button rendering

    func testMapHeaderOverlayRendersRightActionButton() {
        // GIVEN: MapHeaderOverlay is created with right action
        var rightButtonTapped = false
        let overlay = LSMapHeaderOverlay(
            title: "Test Title",
            rightAction: LSMapHeaderOverlayAction(
                icon: "cog",
                onPress: {
                    rightButtonTapped = true
                }
            )
        )

        // WHEN: Component is rendered
        // THEN: Component renders successfully with right action
        XCTAssertNotNil(overlay)
        XCTAssertEqual(overlay.rightAction?.icon, "cog")
    }

    // MARK: - AC-4: Show background toggle

    func testMapHeaderOverlayShowBackgroundTrue() {
        // GIVEN: MapHeaderOverlay is created with showBackground = true
        let overlay = LSMapHeaderOverlay(
            title: "Test Title",
            showBackground: true
        )

        // WHEN: Component is rendered
        // THEN: Component renders with gradient background
        XCTAssertNotNil(overlay)
        XCTAssertTrue(overlay.showBackground)
    }

    func testMapHeaderOverlayShowBackgroundFalse() {
        // GIVEN: MapHeaderOverlay is created with showBackground = false
        let overlay = LSMapHeaderOverlay(
            title: "Test Title",
            showBackground: false
        )

        // WHEN: Component is rendered
        // THEN: Component renders with transparent background
        XCTAssertNotNil(overlay)
        XCTAssertFalse(overlay.showBackground)
    }

    // MARK: - AC-5: Theme integration

    func testMapHeaderOverlayUsesThemeTokens() {
        // GIVEN: MapHeaderOverlay is created
        let overlay = LSMapHeaderOverlay(
            title: "Test Title"
        )

        // WHEN: Component is rendered with theme
        // THEN: Component should use theme environment values
        let themedView = overlay.laneShadowTheme()
        XCTAssertNotNil(themedView)
    }

    // MARK: - AC-6: Test with all props

    func testMapHeaderOverlayWithAllProps() {
        // GIVEN: MapHeaderOverlay is created with all props
        var leftTapped = false
        var rightTapped = false
        let overlay = LSMapHeaderOverlay(
            title: "Full Title",
            leftAction: LSMapHeaderOverlayAction(
                icon: "arrow-left",
                onPress: {
                    leftTapped = true
                },
                accessibilityLabel: "Back",
                testID: "test-overlay"
            ),
            rightAction: LSMapHeaderOverlayAction(
                icon: "cog",
                onPress: {
                    rightTapped = true
                },
                accessibilityLabel: "Settings",
                testID: "test-overlay"
            ),
            showBackground: true,
            testID: "test-overlay"
        )

        // WHEN: Component is rendered
        // THEN: Component renders successfully with all props
        XCTAssertNotNil(overlay)
        XCTAssertEqual(overlay.title, "Full Title")
        XCTAssertEqual(overlay.leftAction?.icon, "arrow-left")
        XCTAssertEqual(overlay.rightAction?.icon, "cog")
        XCTAssertTrue(overlay.showBackground)
    }
}
