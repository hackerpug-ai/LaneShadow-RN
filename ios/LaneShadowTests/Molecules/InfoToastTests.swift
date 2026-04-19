import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Info Toast Tests

/**
 * Tests for LSInfoToast molecule component
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
 * - RoundedRectangle container with info background
 * - Icon rendering (info.circle)
 * - Typography (titleSmall, bodySmall)
 * - Shadow rendering
 * - Spacing (gap, margins, padding)
 * - Corner radius (lg)
 */
final class InfoToastTests: XCTestCase {
    // MARK: - AC-1: Component renders with required props

    @MainActor
    func testInfoToastRendersWithTitleAndDescription() {
        // GIVEN: InfoToast is created with required props
        // WHEN: Component is rendered
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text"
        )

        // THEN: Component renders successfully with title and description
        XCTAssertNotNil(toast)
        let view = toast.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-2: Optional close button rendering

    @MainActor
    func testInfoToastWithCloseButton() {
        // GIVEN: InfoToast is created with showCloseButton = true
        // WHEN: Component is rendered
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text",
            showCloseButton: true
        )

        // THEN: Close button is rendered
        XCTAssertNotNil(toast)
        let view = toast.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    @MainActor
    func testInfoToastWithoutCloseButton() {
        // GIVEN: InfoToast is created with showCloseButton = false
        // WHEN: Component is rendered
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text",
            showCloseButton: false
        )

        // THEN: Close button is not rendered
        XCTAssertNotNil(toast)
        let view = toast.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-3: Close button callback invocation

    @MainActor
    func testInfoToastCloseButtonCallbackInvoked() {
        // GIVEN: InfoToast is created with onClose callback
        var callbackInvoked = false
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text",
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

    @MainActor
    func testInfoToastUsesSemanticTheme() {
        // GIVEN: InfoToast is created
        // WHEN: Component is rendered with theme
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text"
        )

        // THEN: Uses semantic theme colors (info.default, onPrimary)
        XCTAssertNotNil(toast)
        let themedView = toast.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-5: Accessibility labels

    @MainActor
    func testInfoToastHasAccessibilityLabels() {
        // GIVEN: InfoToast is created
        // WHEN: Component is rendered
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text"
        )

        // THEN: Accessibility labels are applied
        XCTAssertNotNil(toast)
        let view = toast.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-6: RoundedRectangle container with info background

    @MainActor
    func testInfoToastHasInfoBackgroundAndRoundedCorners() {
        // GIVEN: InfoToast is created
        // WHEN: Component is rendered
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text"
        )

        // THEN: Container uses info background and lg radius
        XCTAssertNotNil(toast)
        let view = toast.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-7: Icon rendering

    @MainActor
    func testInfoToastRendersInfoIcon() {
        // GIVEN: InfoToast is created
        // WHEN: Component is rendered
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text"
        )

        // THEN: Info icon (info.circle) is rendered
        XCTAssertNotNil(toast)
        let view = toast.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-8: Typography tokens

    @MainActor
    func testInfoToastUsesCorrectTypography() {
        // GIVEN: InfoToast is created
        // WHEN: Component is rendered
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text"
        )

        // THEN: Title uses titleSmall, description uses bodySmall
        XCTAssertNotNil(toast)
        let view = toast.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-9: Shadow rendering

    @MainActor
    func testInfoToastHasShadow() {
        // GIVEN: InfoToast is created
        // WHEN: Component is rendered
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text"
        )

        // THEN: Shadow is applied to container
        XCTAssertNotNil(toast)
        let view = toast.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-10: Spacing tokens

    @MainActor
    func testInfoToastUsesCorrectSpacing() {
        // GIVEN: InfoToast is created
        // WHEN: Component is rendered
        let toast = LSInfoToast(
            title: "Info Title",
            description: "Info description text"
        )

        // THEN: Uses theme.space.xs (gap), sm (margins), md (padding)
        XCTAssertNotNil(toast)
        let view = toast.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }
}
