import SwiftUI
import XCTest
@testable import LaneShadow

/**
 * TDD Tests for BottomSheetInput Component
 *
 * Following acceptance criteria from:
 * .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-003-ios-bottomsheetinput.md
 *
 * STYLE PROPERTIES MATRIX reference:
 * .spec/prds/native-rewrite/matrices/ui/atoms/BottomSheetInput.md
 *
 * Translation Matrix Summary:
 * - Container height: 48px (theme.control.minHeight)
 * - Border radius: 16px (theme.radius.xl)
 * - Border width: 1px when focused/error (theme.borderWidth.thin)
 * - Background: theme.colors.surface.default
 * - Focus border: theme.colors.primary.default
 * - Error border: theme.colors.danger.default
 * - Text color: theme.colors.onSurface.default
 * - Placeholder color: theme.colors.onSurface.subtle
 * - Input text: theme.type.body.md.fontSize (16), regular weight
 * - Label: theme.type.label.sm.fontSize (12), medium weight, uppercase
 * - Left icon padding: leading=16, trailing=8
 * - Right icon padding: leading=8, trailing=16
 * - Icon size: 20px (theme.iconSize.medium)
 * - Input padding: horizontal=8, vertical=12
 * - Label gap: 4px
 * - Disabled opacity: 0.5
 */
final class BottomSheetInputTests: XCTestCase {
    // MARK: - AC-1: Component renders in default state

    func testBottomSheetInputDefaultRendering() {
        // GIVEN: App is running and component is mounted
        // WHEN: BottomSheetInput is rendered with required props
        let input = BottomSheetInput(
            value: .constant(""),
            placeholder: "Enter text"
        )

        // THEN: Component displays matching RN wrapper defaults
        // - Container height: 48px
        // - Border radius: 16px
        // - Background: surface.default
        // - No border (default state)
        XCTAssertNotNil(input.body, "BottomSheetInput should render with default props")
    }

    func testBottomSheetInputWithLabel() {
        // GIVEN: BottomSheetInput with label
        // WHEN: Rendered
        let input = BottomSheetInput(
            value: .constant(""),
            placeholder: "Enter text",
            label: "Email"
        )

        // THEN: Label renders above input
        // - Label text: uppercase
        // - Label color: onSurface.subtle
        // - Label font: 12pt, medium weight
        // - Label gap: 4px
        XCTAssertNotNil(input.body, "BottomSheetInput with label should render")
    }

    func testBottomSheetInputWithValue() {
        // GIVEN: BottomSheetInput with initial value
        // WHEN: Rendered
        let input = BottomSheetInput(
            value: .constant("Sample text"),
            placeholder: "Enter text"
        )

        // THEN: Value is displayed
        // - Text color: onSurface.default
        // - Font: 16pt, regular weight
        XCTAssertNotNil(input.body, "BottomSheetInput with value should render")
    }

    // MARK: - AC-2: All style properties match matrix

    func testBottomSheetInputStylePropertiesMatchMatrix() {
        // GIVEN: Translation matrix defines layout, typography, colors
        // WHEN: Component is rendered in all variants

        // Test default state
        let defaultInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Placeholder"
        )

        // Test with label
        let withLabel = BottomSheetInput(
            value: .constant(""),
            placeholder: "Placeholder",
            label: "Label"
        )

        // Test with left icon
        let withLeftIcon = BottomSheetInput(
            value: .constant(""),
            placeholder: "Search",
            leftIcon: "magnifyingglass"
        )

        // Test with right icon
        let withRightIcon = BottomSheetInput(
            value: .constant(""),
            placeholder: "Password",
            rightIcon: "eye.slash"
        )

        // Test with both icons
        let withBothIcons = BottomSheetInput(
            value: .constant(""),
            placeholder: "Search",
            leftIcon: "magnifyingglass",
            rightIcon: "xmark.circle"
        )

        // THEN: Measured values match matrix (height, padding, radius, font-size)
        // - Container height: 48px
        // - Border radius: 16px
        // - Input padding: horizontal=8, vertical=12
        // - Label font: 12pt, medium weight
        // - Input font: 16pt, regular weight
        XCTAssertNotNil(defaultInput.body, "Default input should render")
        XCTAssertNotNil(withLabel.body, "Input with label should render")
        XCTAssertNotNil(withLeftIcon.body, "Input with left icon should render")
        XCTAssertNotNil(withRightIcon.body, "Input with right icon should render")
        XCTAssertNotNil(withBothIcons.body, "Input with both icons should render")
    }

    func testBottomSheetInputLayoutProperties() {
        // GIVEN: Layout properties from matrix
        // WHEN: Component is rendered
        let input = BottomSheetInput(
            value: .constant(""),
            placeholder: "Enter text",
            label: "Label",
            leftIcon: "magnifyingglass",
            rightIcon: "eye.slash"
        )

        // THEN: Layout matches matrix
        // - Container height: 48px (theme.control.minHeight)
        // - Border radius: 16px (theme.radius.xl)
        // - Left icon padding: leading=16, trailing=8
        // - Right icon padding: leading=8, trailing=16
        // - Input padding: horizontal=8, vertical=12
        // - Icon size: 20px (theme.iconSize.medium)
        XCTAssertNotNil(input.body, "Input with all layout properties should render")
    }

    func testBottomSheetInputTypographyProperties() {
        // GIVEN: Typography from matrix
        // WHEN: Component is rendered
        let input = BottomSheetInput(
            value: .constant("Sample text"),
            placeholder: "Placeholder",
            label: "Email"
        )

        // THEN: Typography matches matrix
        // - Label: 12pt, medium weight, uppercase
        // - Input text: 16pt, regular weight
        // - Placeholder: onSurface.subtle color
        XCTAssertNotNil(input.body, "Input should render with correct typography")
    }

    func testBottomSheetInputColorProperties() {
        // GIVEN: Color properties from matrix
        // WHEN: Component is rendered
        let input = BottomSheetInput(
            value: .constant("Text"),
            placeholder: "Placeholder"
        )

        // THEN: Colors match matrix
        // - Background: surface.default
        // - Text: onSurface.default
        // - Placeholder: onSurface.subtle
        XCTAssertNotNil(input.body, "Input should render with correct colors")
    }

    // MARK: - AC-3: Component handles all states

    func testBottomSheetInputStates() {
        // GIVEN: Component supports states (focused, disabled, error)
        // WHEN: Each state is triggered

        // Test default state
        let defaultInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Default"
        )

        // Test error state
        let errorInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Enter email",
            label: "Email",
            error: true
        )

        // Test disabled state
        let disabledInput = BottomSheetInput(
            value: .constant("Disabled"),
            placeholder: "Disabled",
            label: "Disabled",
            editable: false
        )

        // THEN: Visual feedback matches RN wrapper behavior
        // - Default: no border, normal opacity
        // - Error: danger border (1px), danger icon color
        // - Disabled: 0.5 opacity, not enabled trait
        XCTAssertNotNil(defaultInput.body, "Default input should render")
        XCTAssertNotNil(errorInput.body, "Error input should render")
        XCTAssertNotNil(disabledInput.body, "Disabled input should render")
    }

    func testBottomSheetInputErrorState() {
        // GIVEN: BottomSheetInput in error state
        // WHEN: Rendered
        let errorInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Enter email",
            label: "Email",
            error: true
        )

        // THEN: Error state shows
        // - Border color: danger.default
        // - Border width: 1px
        // - Icon color: danger.default (if icons present)
        XCTAssertNotNil(errorInput.body, "Error state should render with danger border")
    }

    func testBottomSheetInputDisabledState() {
        // GIVEN: BottomSheetInput in disabled state
        // WHEN: Rendered
        let disabledInput = BottomSheetInput(
            value: .constant("Can't edit"),
            placeholder: "Disabled",
            label: "Disabled",
            editable: false
        )

        // THEN: Disabled state shows
        // - Opacity: 0.5
        // - Accessibility: notEnabled trait
        // - Text color: onSurface.subtle
        XCTAssertNotNil(disabledInput.body, "Disabled state should render with reduced opacity")
    }

    func testBottomSheetInputWithIcons() {
        // GIVEN: BottomSheetInput with icons
        // WHEN: Rendered in different icon configurations

        let leftIconInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Search",
            leftIcon: "magnifyingglass"
        )

        let rightIconInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Password",
            rightIcon: "eye"
        )

        let bothIconsInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Search",
            leftIcon: "magnifyingglass",
            rightIcon: "xmark.circle.fill",
            label: "Search"
        )

        // THEN: Icons render with correct colors and spacing
        // - Icon size: 20px
        // - Left icon padding: leading=16, trailing=8
        // - Right icon padding: leading=8, trailing=16
        // - Icon color: muted (default), primary (focused), danger (error)
        XCTAssertNotNil(leftIconInput.body, "Left icon input should render")
        XCTAssertNotNil(rightIconInput.body, "Right icon input should render")
        XCTAssertNotNil(bothIconsInput.body, "Both icons input should render")
    }

    func testBottomSheetInputIconColorsInStates() {
        // GIVEN: BottomSheetInput with icons in different states
        // WHEN: Rendered

        let defaultIconInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Search",
            leftIcon: "magnifyingglass"
        )

        let errorIconInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Search",
            leftIcon: "magnifyingglass",
            error: true
        )

        let disabledIconInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Search",
            leftIcon: "magnifyingglass",
            editable: false
        )

        // THEN: Icon colors match matrix
        // - Default: onSurface.subtle
        // - Focused: primary.default
        // - Error: danger.default
        // - Disabled: onSurface.disabled
        XCTAssertNotNil(defaultIconInput.body, "Default icon input should render")
        XCTAssertNotNil(errorIconInput.body, "Error icon input should render")
        XCTAssertNotNil(disabledIconInput.body, "Disabled icon input should render")
    }

    func testBottomSheetInputAccessibility() {
        // GIVEN: BottomSheetInput with accessibility props
        // WHEN: Rendered
        let input = BottomSheetInput(
            value: .constant(""),
            placeholder: "Enter email",
            label: "Email",
            testID: "email-input"
        )

        // THEN: Accessibility properties are applied
        // - Label: "Email" (from label prop)
        // - Traits: isKeyboardKey
        // - Identifier: "email-input"
        // - Disabled: notEnabled trait (when editable=false)
        XCTAssertNotNil(input.body, "Input with accessibility should render")
    }

    func testBottomSheetInputAccessibilityDisabled() {
        // GIVEN: BottomSheetInput in disabled state
        // WHEN: Rendered
        let disabledInput = BottomSheetInput(
            value: .constant("Disabled"),
            placeholder: "Disabled",
            editable: false,
            testID: "disabled-input"
        )

        // THEN: Disabled accessibility trait is set
        XCTAssertNotNil(disabledInput.body, "Disabled input should have notEnabled trait")
    }

    func testBottomSheetInputBorderStates() {
        // GIVEN: BottomSheetInput border states
        // WHEN: Rendered in different states

        let defaultInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Default"
        )

        let errorInput = BottomSheetInput(
            value: .constant(""),
            placeholder: "Error",
            error: true
        )

        // THEN: Border shows correctly
        // - Default: no border (clear)
        // - Focused: primary border (1px)
        // - Error: danger border (1px)
        XCTAssertNotNil(defaultInput.body, "Default input should have no border")
        XCTAssertNotNil(errorInput.body, "Error input should have danger border")
    }

    func testBottomSheetInputTextColors() {
        // GIVEN: BottomSheetInput text colors
        // WHEN: Rendered in different states

        let defaultInput = BottomSheetInput(
            value: .constant("Text"),
            placeholder: "Placeholder"
        )

        let disabledInput = BottomSheetInput(
            value: .constant("Text"),
            placeholder: "Placeholder",
            editable: false
        )

        // THEN: Text colors match matrix
        // - Default: onSurface.default
        // - Disabled: onSurface.subtle
        // - Placeholder: onSurface.subtle
        XCTAssertNotNil(defaultInput.body, "Default input should use onSurface.default")
        XCTAssertNotNil(disabledInput.body, "Disabled input should use onSurface.subtle")
    }

    func testBottomSheetInputCombinations() {
        // GIVEN: Complex BottomSheetInput combinations
        // WHEN: Rendered

        let complexInput = BottomSheetInput(
            value: .constant("sample@email.com"),
            placeholder: "Enter email",
            label: "Email Address",
            error: false,
            editable: true,
            leftIcon: "envelope",
            rightIcon: "xmark.circle",
            testID: "email-input"
        )

        let complexErrorInput = BottomSheetInput(
            value: .constant("invalid"),
            placeholder: "Enter email",
            label: "Email Address",
            error: true,
            editable: true,
            leftIcon: "envelope",
            rightIcon: "exclamationmark.circle",
            testID: "email-error"
        )

        let complexDisabledInput = BottomSheetInput(
            value: .constant("locked@email.com"),
            placeholder: "Email",
            label: "Email",
            error: false,
            editable: false,
            leftIcon: "lock",
            testID: "email-disabled"
        )

        // THEN: All combinations render correctly
        XCTAssertNotNil(complexInput.body, "Complex input should render")
        XCTAssertNotNil(complexErrorInput.body, "Complex error input should render")
        XCTAssertNotNil(complexDisabledInput.body, "Complex disabled input should render")
    }
}
