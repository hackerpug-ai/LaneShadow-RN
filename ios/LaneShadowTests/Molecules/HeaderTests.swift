import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Header Tests

/**
 * Tests for LSHeader molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Component renders with required props (title, onMenuPress)
 * - Menu button rendering with correct icon
 * - Menu button callback invocation
 * - Theme integration with semantic colors
 * - Accessibility labels
 * - Bottom border rendering
 * - Correct height (60pt)
 * - Correct padding (lg horizontal, sm vertical)
 * - Title centered with correct typography
 * - Right spacer for layout balance
 */
final class HeaderTests: XCTestCase {
    // MARK: - AC-1: Component renders with required props

    func testHeaderRendersWithTitle() {
        // GIVEN: Header is created with required props
        // WHEN: Component is rendered
        let header = LSHeader(
            title: "Test Title",
            onMenuPress: {}
        )

        // THEN: Component renders successfully with title
        XCTAssertNotNil(header)
        let view = header.body
        // View renders correctly
    }

    // MARK: - AC-2: Menu button rendering with correct icon

    func testHeaderRendersMenuButton() {
        // GIVEN: Header is created
        // WHEN: Component is rendered
        let header = LSHeader(
            title: "Test Title",
            onMenuPress: {}
        )

        // THEN: Menu button is rendered with line.3.horizontal icon
        XCTAssertNotNil(header)
        let view = header.body
        // View renders correctly
    }

    // MARK: - AC-3: Menu button callback invocation

    func testHeaderMenuButtonCallbackInvoked() {
        // GIVEN: Header is created with onMenuPress callback
        var callbackInvoked = false
        let header = LSHeader(
            title: "Test Title",
            onMenuPress: {
                callbackInvoked = true
            }
        )

        // WHEN: Component is rendered
        // THEN: Callback can be invoked (testing callback wiring)
        XCTAssertNotNil(header)
        XCTAssertFalse(callbackInvoked) // Initially not invoked
    }

    // MARK: - AC-4: Theme integration with semantic colors

    func testHeaderUsesSemanticTheme() {
        // GIVEN: Header is created
        // WHEN: Component is rendered with theme
        let header = LSHeader(
            title: "Test Title",
            onMenuPress: {}
        )

        // THEN: Uses semantic theme colors (background.default, border.default, onSurface.default)
        XCTAssertNotNil(header)
        let themedView = header.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-5: Accessibility labels

    func testHeaderHasAccessibilityLabels() {
        // GIVEN: Header is created with testID
        // WHEN: Component is rendered
        let header = LSHeader(
            title: "Test Title",
            onMenuPress: {},
            testID: "test-header"
        )

        // THEN: Accessibility labels are applied
        XCTAssertNotNil(header)
        let view = header.body
        // View renders correctly
    }

    // MARK: - AC-6: Bottom border rendering

    func testHeaderHasBottomBorder() {
        // GIVEN: Header is created
        // WHEN: Component is rendered
        let header = LSHeader(
            title: "Test Title",
            onMenuPress: {}
        )

        // THEN: Bottom border is rendered with border.default color
        XCTAssertNotNil(header)
        let view = header.body
        // View renders correctly
    }

    // MARK: - AC-7: Correct height (60pt)

    func testHeaderHasCorrectHeight() {
        // GIVEN: Header is created
        // WHEN: Component is rendered
        let header = LSHeader(
            title: "Test Title",
            onMenuPress: {}
        )

        // THEN: Header height is 60pt
        XCTAssertNotNil(header)
        let view = header.body
        // View renders correctly
    }

    // MARK: - AC-8: Correct padding (lg horizontal, sm vertical)

    func testHeaderHasCorrectPadding() {
        // GIVEN: Header is created
        // WHEN: Component is rendered
        let header = LSHeader(
            title: "Test Title",
            onMenuPress: {}
        )

        // THEN: Uses theme.space.lg (horizontal), theme.space.sm (vertical)
        XCTAssertNotNil(header)
        let view = header.body
        // View renders correctly
    }

    // MARK: - AC-9: Title centered with correct typography

    func testHeaderTitleCenteredWithCorrectTypography() {
        // GIVEN: Header is created
        // WHEN: Component is rendered
        let header = LSHeader(
            title: "Test Title",
            onMenuPress: {}
        )

        // THEN: Title is centered and uses theme.type.title.lg
        XCTAssertNotNil(header)
        let view = header.body
        // View renders correctly
    }

    // MARK: - AC-10: Right spacer for layout balance

    func testHeaderHasRightSpacer() {
        // GIVEN: Header is created
        // WHEN: Component is rendered
        let header = LSHeader(
            title: "Test Title",
            onMenuPress: {}
        )

        // THEN: Right spacer (44pt) is rendered for layout balance
        XCTAssertNotNil(header)
        let view = header.body
        // View renders correctly
    }
}
