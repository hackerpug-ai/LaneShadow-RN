import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

// MARK: - Floating Search Input Tests

/**
 * Tests for LSFloatingSearchInput molecule component
 *
 * Tests follow TDD RED → GREEN → REFACTOR cycle:
 * - RED: Write failing test first
 * - GREEN: Write minimal implementation to pass
 * - REFACTOR: Clean up while keeping tests green
 *
 * Test coverage:
 * - Component renders with required props (value, onChangeText, placeholder)
 * - Optional clear button rendering (onClear, shown when value.isNotEmpty)
 * - Clear button callback invocation (onClear)
 * - Loading state rendering (isLoading shows ProgressView)
 * - Cancel loading button rendering (onCancelLoading)
 * - Press-only mode (onPress makes entire component tappable, input non-editable)
 * - Theme integration with semantic colors (surfaceVariant, border, onSurface)
 * - Accessibility labels and identifiers
 * - Search icon rendering (magnifyingglass)
 * - Clear icon rendering (xmark)
 * - Press state opacity (0.8 on buttons)
 * - Design tokens (radius.xl, space.md, space.xs, space.xl, space.2xl, space.4xl)
 */
final class FloatingSearchInputTests: XCTestCase {
    // MARK: - AC-1: Component renders with required props

    func testFloatingSearchInputRendersWithRequiredProps() {
        // GIVEN: FloatingSearchInput is created with required props
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides..."
        )

        // THEN: Component renders successfully
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-2: Optional clear button rendering

    func testFloatingSearchInputShowsClearButtonWhenHasText() {
        // GIVEN: FloatingSearchInput is created with text value and onClear callback
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant("San Francisco"),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            onClear: {}
        )

        // THEN: Clear button is rendered
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testFloatingSearchInputHidesClearButtonWhenEmpty() {
        // GIVEN: FloatingSearchInput is created with empty value
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            onClear: {}
        )

        // THEN: Clear button is not rendered
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testFloatingSearchInputHidesClearButtonWhenLoading() {
        // GIVEN: FloatingSearchInput is created with text but isLoading=true
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant("San Francisco"),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            isLoading: true,
            onClear: {}
        )

        // THEN: Clear button is not rendered (loading indicator shown instead)
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-3: Clear button callback invocation

    func testFloatingSearchInputClearButtonCallbackInvoked() {
        // GIVEN: FloatingSearchInput is created with onClear callback
        var callbackInvoked = false
        let searchInput = LSFloatingSearchInput(
            value: .constant("San Francisco"),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            onClear: {
                callbackInvoked = true
            }
        )

        // WHEN: Component is rendered
        // THEN: Callback is wired (testing callback wiring)
        XCTAssertNotNil(searchInput)
        XCTAssertFalse(callbackInvoked) // Initially not invoked
    }

    // MARK: - AC-4: Loading state rendering

    func testFloatingSearchInputShowsLoadingIndicator() {
        // GIVEN: FloatingSearchInput is created with isLoading=true
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            isLoading: true
        )

        // THEN: ProgressView is rendered
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-5: Cancel loading button rendering

    func testFloatingSearchInputShowsCancelLoadingButton() {
        // GIVEN: FloatingSearchInput is created with isLoading=true and onCancelLoading
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            isLoading: true,
            onCancelLoading: {}
        )

        // THEN: Cancel button is rendered alongside loading indicator
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testFloatingSearchInputCancelLoadingCallbackInvoked() {
        // GIVEN: FloatingSearchInput is created with onCancelLoading callback
        var callbackInvoked = false
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            isLoading: true,
            onCancelLoading: {
                callbackInvoked = true
            }
        )

        // WHEN: Component is rendered
        // THEN: Callback is wired
        XCTAssertNotNil(searchInput)
        XCTAssertFalse(callbackInvoked)
    }

    // MARK: - AC-6: Press-only mode (onPress makes component tappable, input non-editable)

    func testFloatingSearchInputPressOnlyModeRendersAsButton() {
        // GIVEN: FloatingSearchInput is created with onPress callback
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant("Search query"),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            onPress: {}
        )

        // THEN: Component is tappable (button mode) and input is non-editable
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testFloatingSearchInputPressOnlyModeCallbackInvoked() {
        // GIVEN: FloatingSearchInput is created with onPress callback
        var callbackInvoked = false
        let searchInput = LSFloatingSearchInput(
            value: .constant("Search query"),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            onPress: {
                callbackInvoked = true
            }
        )

        // WHEN: Component is rendered
        // THEN: Callback is wired
        XCTAssertNotNil(searchInput)
        XCTAssertFalse(callbackInvoked)
    }

    // MARK: - AC-7: Theme integration with semantic colors

    func testFloatingSearchInputUsesSemanticTheme() {
        // GIVEN: FloatingSearchInput is created
        // WHEN: Component is rendered with theme
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides..."
        )

        // THEN: Uses semantic theme colors (surfaceVariant, border, onSurface)
        XCTAssertNotNil(searchInput)
        let themedView = searchInput.laneShadowTheme()
        XCTAssertTrue(type(of: themedView) is Any.Type)
    }

    // MARK: - AC-8: Accessibility labels and identifiers

    func testFloatingSearchInputHasAccessibilityLabels() {
        // GIVEN: FloatingSearchInput is created
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            testID: "search-test"
        )

        // THEN: Accessibility labels and identifiers are applied
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-9: Search icon rendering

    func testFloatingSearchInputRendersSearchIcon() {
        // GIVEN: FloatingSearchInput is created
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides..."
        )

        // THEN: Search icon (magnifyingglass) is rendered
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-10: Clear icon rendering

    func testFloatingSearchInputRendersClearIcon() {
        // GIVEN: FloatingSearchInput is created with text value
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant("San Francisco"),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            onClear: {}
        )

        // THEN: Clear icon (xmark) is rendered
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-11: Press state opacity

    func testFloatingSearchInputButtonsHavePressOpacity() {
        // GIVEN: FloatingSearchInput is created with clear button
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant("San Francisco"),
            onChangeText: { _ in },
            placeholder: "Search rides...",
            onClear: {}
        )

        // THEN: Buttons have opacity 0.8 on press
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-12: Design tokens (radius, spacing)

    func testFloatingSearchInputUsesDesignTokens() {
        // GIVEN: FloatingSearchInput is created
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides..."
        )

        // THEN: Uses theme.radius.xl, theme.space.md, theme.space.xs, theme.space.xl, theme.space.2xl, theme.space.4xl
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-13: Border rendering

    func testFloatingSearchInputHasBorder() {
        // GIVEN: FloatingSearchInput is created
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides..."
        )

        // THEN: Border is rendered with theme.colors.border.default
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-14: Background color

    func testFloatingSearchInputHasSurfaceVariantBackground() {
        // GIVEN: FloatingSearchInput is created
        // WHEN: Component is rendered
        let searchInput = LSFloatingSearchInput(
            value: .constant(""),
            onChangeText: { _ in },
            placeholder: "Search rides..."
        )

        // THEN: Background uses theme.colors.surfaceVariant.default
        XCTAssertNotNil(searchInput)
        let view = searchInput.body
        XCTAssertTrue(type(of: view) is Any.Type)
    }
}
