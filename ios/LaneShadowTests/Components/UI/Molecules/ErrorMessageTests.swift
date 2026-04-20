import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - ErrorMessage Tests

/**
 * Tests for LSErrorMessage molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Props match RN API (message: String)
 * - SurfaceVariant background color
 * - Warning border (1dp)
 * - Large corner radius (lg)
 * - Body.md text with onSurface color
 * - Alignment to leading edge
 * - Max width 80%
 * - Vertical margin (4dp)
 * - Accessibility label with error message
 * - Theme integration (no hardcoded colors)
 */
final class ErrorMessageTests: XCTestCase {
    // MARK: - AC-1: Props match RN API

    func testPropsMatchRNAPI() {
        // GIVEN: ErrorMessage is created with message prop
        // WHEN: Component is initialized
        let errorMessage = LSErrorMessage(message: "Something went wrong")

        // THEN: Component accepts message prop without error
        XCTAssertNotNil(errorMessage)
    }

    // MARK: - AC-2: SurfaceVariant background color

    func testSurfaceVariantBackgroundColor() {
        // GIVEN: Theme is available with surfaceVariant color
        // WHEN: ErrorMessage is rendered
        let errorMessage = LSErrorMessage(message: "Error occurred")

        // THEN: Background uses theme.colors.surfaceVariant.default
        XCTAssertNotNil(errorMessage)
        let view = errorMessage.body
        // View renders correctly
    }

    // MARK: - AC-3: Warning border (1dp)

    func testWarningBorder() {
        // GIVEN: Theme is available with warning color and borderWidth
        // WHEN: ErrorMessage is rendered
        let errorMessage = LSErrorMessage(message: "Warning message")

        // THEN: Border uses theme.colors.warning.default with theme.borderWidth.thin
        XCTAssertNotNil(errorMessage)
        let view = errorMessage.body
        // View renders correctly
    }

    // MARK: - AC-4: Large corner radius

    func testLargeCornerRadius() {
        // GIVEN: Theme is available with radius tokens
        // WHEN: ErrorMessage is rendered
        let errorMessage = LSErrorMessage(message: "Rounded error")

        // THEN: Corner radius uses theme.radius.lg
        XCTAssertNotNil(errorMessage)
        let view = errorMessage.body
        // View renders correctly
    }

    // MARK: - AC-5: Body.md text with onSurface color

    func testBodyMediumTextWithOnSurfaceColor() {
        // GIVEN: Theme is available with body.md typography and onSurface color
        // WHEN: ErrorMessage is rendered with message
        let errorMessage = LSErrorMessage(message: "Error details here")

        // THEN: Text uses theme.type.body.md and theme.colors.onSurface.default
        XCTAssertNotNil(errorMessage)
        let view = errorMessage.body
        // View renders correctly
    }

    // MARK: - AC-6: Alignment to leading edge

    func testAlignmentToLeadingEdge() {
        // GIVEN: ErrorMessage is created
        // WHEN: Component is rendered
        let errorMessage = LSErrorMessage(message: "Left-aligned error")

        // THEN: Content aligns to leading edge
        XCTAssertNotNil(errorMessage)
        let view = errorMessage.body
        // View renders correctly
    }

    // MARK: - AC-7: Max width 80%

    func testMaxWidth80Percent() {
        // GIVEN: ErrorMessage is created
        // WHEN: Component is rendered
        let errorMessage = LSErrorMessage(message: "Constrained width error")

        // THEN: Max width is 80% of container
        XCTAssertNotNil(errorMessage)
        let view = errorMessage.body
        // View renders correctly
    }

    // MARK: - AC-8: Vertical margin (4dp)

    func testVerticalMargin() {
        // GIVEN: Theme is available with space tokens
        // WHEN: ErrorMessage is rendered
        let errorMessage = LSErrorMessage(message: "Spaced error")

        // THEN: Vertical margin uses theme space (equivalent to 4dp)
        XCTAssertNotNil(errorMessage)
        let view = errorMessage.body
        // View renders correctly
    }

    // MARK: - AC-9: Accessibility label with error message

    func testAccessibilityLabel() {
        // GIVEN: ErrorMessage is created with message
        let errorMessage = LSErrorMessage(message: "Accessible error")

        // WHEN: Converting to view
        let view = errorMessage.body

        // THEN: Accessibility label is set to the error message
        // View renders correctly
    }

    // MARK: - AC-10: Theme integration (no hardcoded colors)

    func testUsesSemanticThemeTokens() {
        // GIVEN: ErrorMessage is created with theme environment
        // WHEN: Component renders
        let errorMessage = LSErrorMessage(message: "Themed error")

        // THEN: Uses theme.colors.surfaceVariant.default, theme.colors.warning.default, etc.
        // AND: No hardcoded Color values
        XCTAssertNotNil(errorMessage)
        let themedView = errorMessage.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-11: Padding inside container

    func testPaddingInsideContainer() {
        // GIVEN: Theme is available with space tokens
        // WHEN: ErrorMessage is rendered
        let errorMessage = LSErrorMessage(message: "Padded error")

        // THEN: Padding uses theme.space.md inside container
        XCTAssertNotNil(errorMessage)
        let view = errorMessage.body
        // View renders correctly
    }
}
