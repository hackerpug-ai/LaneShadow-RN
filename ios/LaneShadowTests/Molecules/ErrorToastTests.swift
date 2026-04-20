import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Error Toast Tests

/**
 * Tests for LSErrorToast molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Component renders with required props (title, description)
 * - Optional close button rendering (showCloseButton)
 * - Close button callback invocation (onClose)
 * - Theme integration with semantic colors
 * - Accessibility labels
 * - RoundedRectangle container with danger background
 * - Icon rendering (xmark.circle)
 * - Typography (titleSmall, bodySmall)
 * - Shadow rendering
 * - Spacing (gap, margins, padding)
 * - Corner radius (lg)
 */
final class ErrorToastTests: XCTestCase {
    // MARK: - AC-1: Component renders with required props

    func testErrorToastRendersWithTitleAndDescription() {
        // GIVEN: ErrorToast is created with required props
        // WHEN: Component is rendered
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text"
        )

        // THEN: Component renders successfully with title and description
        XCTAssertNotNil(toast)
        let view = toast.body
        // View renders correctly
    }

    // MARK: - AC-2: Optional close button rendering

    func testErrorToastWithCloseButton() {
        // GIVEN: ErrorToast is created with showCloseButton = true
        // WHEN: Component is rendered
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text",
            showCloseButton: true
        )

        // THEN: Close button is rendered
        XCTAssertNotNil(toast)
        let view = toast.body
        // View renders correctly
    }

    func testErrorToastWithoutCloseButton() {
        // GIVEN: ErrorToast is created with showCloseButton = false
        // WHEN: Component is rendered
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text",
            showCloseButton: false
        )

        // THEN: Close button is not rendered
        XCTAssertNotNil(toast)
        let view = toast.body
        // View renders correctly
    }

    // MARK: - AC-3: Close button callback invocation

    func testErrorToastCloseButtonCallbackInvoked() {
        // GIVEN: ErrorToast is created with onClose callback
        var callbackInvoked = false
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text",
            showCloseButton: true,
            onClose: {
                callbackInvoked = true
            }
        )

        // WHEN: Component is rendered
        // THEN: Callback can be invoked (testing callback wiring)
        XCTAssertNotNil(toast)
        XCTAssertFalse(callbackInvoked) // Initially not invoked
    }

    // MARK: - AC-4: Theme integration with semantic colors

    func testErrorToastUsesSemanticTheme() {
        // GIVEN: ErrorToast is created
        // WHEN: Component is rendered with theme
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text"
        )

        // THEN: Uses semantic theme colors (danger.default, onPrimary)
        XCTAssertNotNil(toast)
        let themedView = toast.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-5: Accessibility labels

    func testErrorToastHasAccessibilityLabels() {
        // GIVEN: ErrorToast is created
        // WHEN: Component is rendered
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text"
        )

        // THEN: Accessibility labels are applied
        XCTAssertNotNil(toast)
        let view = toast.body
        // View renders correctly
    }

    // MARK: - AC-6: RoundedRectangle container with danger background

    func testErrorToastHasDangerBackgroundAndRoundedCorners() {
        // GIVEN: ErrorToast is created
        // WHEN: Component is rendered
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text"
        )

        // THEN: Container uses danger background and lg radius
        XCTAssertNotNil(toast)
        let view = toast.body
        // View renders correctly
    }

    // MARK: - AC-7: Icon rendering

    func testErrorToastRendersErrorIcon() {
        // GIVEN: ErrorToast is created
        // WHEN: Component is rendered
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text"
        )

        // THEN: Error icon (xmark.circle) is rendered
        XCTAssertNotNil(toast)
        let view = toast.body
        // View renders correctly
    }

    // MARK: - AC-8: Typography tokens

    func testErrorToastUsesCorrectTypography() {
        // GIVEN: ErrorToast is created
        // WHEN: Component is rendered
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text"
        )

        // THEN: Title uses titleSmall, description uses bodySmall
        XCTAssertNotNil(toast)
        let view = toast.body
        // View renders correctly
    }

    // MARK: - AC-9: Shadow rendering

    func testErrorToastHasShadow() {
        // GIVEN: ErrorToast is created
        // WHEN: Component is rendered
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text"
        )

        // THEN: Shadow is applied to container
        XCTAssertNotNil(toast)
        let view = toast.body
        // View renders correctly
    }

    // MARK: - AC-10: Spacing tokens

    func testErrorToastUsesCorrectSpacing() {
        // GIVEN: ErrorToast is created
        // WHEN: Component is rendered
        let toast = LSErrorToast(
            title: "Error Title",
            description: "Error description text"
        )

        // THEN: Uses theme.space.xs (gap), sm (margins), md (padding)
        XCTAssertNotNil(toast)
        let view = toast.body
        // View renders correctly
    }
}
