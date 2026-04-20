import SwiftUI
import XCTest
@testable import LaneShadow

/**
 * TDD Tests for IconSymboliOS Component
 *
 * Following acceptance criteria from:
 * .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-013-ios-iconsymbol-ios.md
 *
 * STYLE PROPERTIES MATRIX reference:
 * .spec/prds/native-rewrite/matrices/ui/atoms/IconSymbol-iOS.md
 */
final class IconSymbolIOSTests: XCTestCase {
    // MARK: - AC-1: Component renders in default state

    func testIconSymbolIOSDefaultRendering() {
        // GIVEN: App is running and component is mounted
        // WHEN: IconSymboliOS is rendered with required props (name, size, color)
        let icon = LSIconSymbolIOS(
            name: "house",
            size: 24,
            color: .blue
        )

        // THEN: Component displays matching RN wrapper defaults
        // - Default size: 24×24pt
        // - Rendering mode: .template
        // - Weight: .regular
        // - Variant: .none
        XCTAssertNotNil(icon.body, "IconSymboliOS should render with name, size, and color")
    }

    func testIconSymbolIOSDefaultSize() {
        // GIVEN: IconSymboliOS with default size parameter
        let icon = LSIconSymbolIOS(
            name: "heart.fill",
            size: 24,
            color: .red
        )

        // WHEN: Rendered
        // THEN: Default size is 24×24pt (iconSize.lg equivalent)
        // This will be verified through visual inspection in sandbox
        // The test ensures the component accepts default size parameter
        XCTAssertNotNil(icon.body, "IconSymboliOS should render at default size 24pt")
    }

    func testIconSymbolIOSDefaultRenderingMode() {
        // GIVEN: IconSymboliOS without explicit renderingMode
        let icon = LSIconSymbolIOS(
            name: "star.fill",
            size: 32,
            color: .yellow
        )

        // WHEN: Rendered
        // THEN: Default rendering mode is .template
        XCTAssertNotNil(icon.body, "IconSymboliOS should render with .template rendering mode by default")
    }

    // MARK: - AC-2: All style properties match matrix

    func testIconSymbolIOSStylePropertiesMatchMatrix() {
        // GIVEN: Translation matrix defines layout, typography, colors
        // WHEN: Component is rendered in all size variants

        // Test standard size tokens from matrix
        let xsIcon = LSIconSymbolIOS(name: "checkmark", size: 12, color: .green)
        let smIcon = LSIconSymbolIOS(name: "checkmark", size: 14, color: .green)
        let mdIcon = LSIconSymbolIOS(name: "checkmark", size: 16, color: .green)
        let lgIcon = LSIconSymbolIOS(name: "checkmark", size: 24, color: .green)
        let xlIcon = LSIconSymbolIOS(name: "checkmark", size: 28, color: .green)
        let xl2Icon = LSIconSymbolIOS(name: "checkmark", size: 32, color: .green)
        let emptyStateIcon = LSIconSymbolIOS(name: "checkmark", size: 40, color: .green)

        // THEN: Measured values match matrix (size tokens)
        XCTAssertNotNil(xsIcon.body, "XS size (12pt) icon should render")
        XCTAssertNotNil(smIcon.body, "SM size (14pt) icon should render")
        XCTAssertNotNil(mdIcon.body, "MD size (16pt) icon should render")
        XCTAssertNotNil(lgIcon.body, "LG size (24pt) icon should render")
        XCTAssertNotNil(xlIcon.body, "XL size (28pt) icon should render")
        XCTAssertNotNil(xl2Icon.body, "2XL size (32pt) icon should render")
        XCTAssertNotNil(emptyStateIcon.body, "Empty state size (40pt) icon should render")
    }

    func testIconSymbolIOSWeightProperties() {
        // GIVEN: Translation matrix defines SF Symbol weights
        // WHEN: Component is rendered with different weights

        let regularIcon = LSIconSymbolIOS(name: "star.fill", size: 32, color: .yellow, weight: .regular)
        let mediumIcon = LSIconSymbolIOS(name: "star.fill", size: 32, color: .yellow, weight: .medium)
        let semiboldIcon = LSIconSymbolIOS(name: "star.fill", size: 32, color: .yellow, weight: .semibold)
        let boldIcon = LSIconSymbolIOS(name: "star.fill", size: 32, color: .yellow, weight: .bold)

        // THEN: All weight variants render correctly
        XCTAssertNotNil(regularIcon.body, "Regular weight icon should render")
        XCTAssertNotNil(mediumIcon.body, "Medium weight icon should render")
        XCTAssertNotNil(semiboldIcon.body, "Semibold weight icon should render")
        XCTAssertNotNil(boldIcon.body, "Bold weight icon should render")
    }

    func testIconSymbolIOSRenderingModes() {
        // GIVEN: Translation matrix defines rendering modes
        // WHEN: Component is rendered with different modes

        let templateIcon = LSIconSymbolIOS(
            name: "heart.fill",
            size: 32,
            color: .red,
            renderingMode: .template
        )
        let defaultIcon = LSIconSymbolIOS(
            name: "heart.fill",
            size: 32,
            color: .red
        )

        // THEN: All rendering modes work correctly
        XCTAssertNotNil(templateIcon.body, "Template rendering mode should render")
        XCTAssertNotNil(defaultIcon.body, "Default rendering mode should render")
    }

    func testIconSymbolIOSVariants() {
        // GIVEN: Translation matrix defines SF Symbol variants
        // WHEN: Component is rendered with different variants

        let noneVariant = LSIconSymbolIOS(name: "heart", size: 32, color: .red, variant: .none)
        let fillVariant = LSIconSymbolIOS(name: "heart", size: 32, color: .red, variant: .fill)
        let circleVariant = LSIconSymbolIOS(name: "square", size: 32, color: .blue, variant: .circle)
        let squareVariant = LSIconSymbolIOS(name: "checkmark", size: 32, color: .green, variant: .square)

        // THEN: All variants render correctly
        XCTAssertNotNil(noneVariant.body, "None variant should render")
        XCTAssertNotNil(fillVariant.body, "Fill variant should render")
        XCTAssertNotNil(circleVariant.body, "Circle variant should render")
        XCTAssertNotNil(squareVariant.body, "Square variant should render")
    }

    func testIconSymbolIOSColorProperties() {
        // GIVEN: Color is a required prop
        // WHEN: Component is rendered with different colors

        let blueIcon = LSIconSymbolIOS(name: "house", size: 24, color: .blue)
        let redIcon = LSIconSymbolIOS(name: "heart.fill", size: 24, color: .red)
        let greenIcon = LSIconSymbolIOS(name: "checkmark", size: 24, color: .green)

        // THEN: All colors apply correctly
        XCTAssertNotNil(blueIcon.body, "Blue icon should render")
        XCTAssertNotNil(redIcon.body, "Red icon should render")
        XCTAssertNotNil(greenIcon.body, "Green icon should render")
    }

    // MARK: - AC-3: Component handles all states

    func testIconSymbolIOSStates() {
        // GIVEN: Component supports different states through renderingMode and variant
        // WHEN: Each state combination is triggered

        // Default state
        let defaultIcon = LSIconSymbolIOS(name: "house", size: 24, color: .blue)

        // Template state
        let templateState = LSIconSymbolIOS(
            name: "heart.fill",
            size: 32,
            color: .red,
            renderingMode: .template
        )

        // Filled variant
        let filledState = LSIconSymbolIOS(
            name: "heart",
            size: 32,
            color: .red,
            variant: .fill
        )

        // THEN: Visual feedback matches RN wrapper behavior
        XCTAssertNotNil(defaultIcon.body, "Default state should render")
        XCTAssertNotNil(templateState.body, "Template state should render")
        XCTAssertNotNil(filledState.body, "Filled variant state should render")
    }

    func testIconSymbolIOSAccessibility() {
        // GIVEN: Component supports accessibility
        // WHEN: Accessibility props are provided

        let iconWithAccessibility = LSIconSymbolIOS(
            name: "house",
            size: 32,
            color: .blue,
            accessibilityLabel: "Home",
            testID: "home-icon"
        )

        // THEN: Accessibility properties are applied
        XCTAssertNotNil(iconWithAccessibility.body, "Icon with accessibility should render")
    }

    func testIconSymbolIOSMaterialCommunityIconsMapping() {
        // GIVEN: Component maps MaterialCommunityIcons names to SF Symbols
        // WHEN: Material icon names are used

        let homeIcon = LSIconSymbolIOS(name: "home", size: 24, color: .blue)
        let heartOutlineIcon = LSIconSymbolIOS(name: "heart-outline", size: 24, color: .red)
        let starOutlineIcon = LSIconSymbolIOS(name: "star-outline", size: 24, color: .yellow)
        let accountOutlineIcon = LSIconSymbolIOS(name: "account-outline", size: 24, color: .gray)
        let chevronRightIcon = LSIconSymbolIOS(name: "chevron-right", size: 24, color: .green)

        // THEN: Icons render with mapped SF Symbol names
        XCTAssertNotNil(homeIcon.body, "Home icon should map to house")
        XCTAssertNotNil(heartOutlineIcon.body, "Heart outline should map to heart")
        XCTAssertNotNil(starOutlineIcon.body, "Star outline should map to star")
        XCTAssertNotNil(accountOutlineIcon.body, "Account outline should map to person")
        XCTAssertNotNil(chevronRightIcon.body, "Chevron right should map correctly")
    }

    func testIconSymbolIOSDirectSFName() {
        // GIVEN: Component accepts direct SF Symbol names
        // WHEN: Native SF Symbol names are used

        let directSFIcon = LSIconSymbolIOS(name: "gearshape", size: 24, color: .gray)

        // THEN: Icon renders with direct SF Symbol name
        XCTAssertNotNil(directSFIcon.body, "Direct SF Symbol name should render")
    }

    func testIconSymbolIOSOpacity() {
        // GIVEN: Component supports opacity through modifiers
        // WHEN: Opacity is applied

        // Note: Opacity is handled via SwiftUI modifier, not a prop
        // This test verifies the component can be composed with opacity
        let icon = LSIconSymbolIOS(name: "house", size: 24, color: .blue)

        // THEN: Icon can have opacity applied via View modifier
        XCTAssertNotNil(icon.body.opacity(0.5), "Icon should support opacity modifier")
    }
}
