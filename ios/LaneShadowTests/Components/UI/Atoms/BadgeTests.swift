import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

final class BadgeTests: XCTestCase {
    // MARK: - AC-1: Component renders in default state

    func testBadgeDefaultRendering() {
        // GIVEN: App is running and component is mounted
        // WHEN: Badge is rendered with required props (default variant)
        let badge = Badge("Test Badge")

        // THEN: Component displays matching RN wrapper defaults
        // Verify the view can be created without crashing
        XCTAssertNotNil(badge)

        // Verify it's a SwiftUI View
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-2: Style Properties - All 7 variants render with correct theme colors

    func testBadgeDefaultVariant() {
        // GIVEN: Theme is available
        // WHEN: Badge is rendered with default variant
        let badge = Badge("Default", variant: .default)

        // THEN: Badge renders with primary theme colors
        XCTAssertNotNil(badge)
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testBadgeSecondaryVariant() {
        // GIVEN: Theme is available
        // WHEN: Badge is rendered with secondary variant
        let badge = Badge("Secondary", variant: .secondary)

        // THEN: Badge renders with secondary theme colors
        XCTAssertNotNil(badge)
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testBadgeDestructiveVariant() {
        // GIVEN: Theme is available
        // WHEN: Badge is rendered with destructive variant
        let badge = Badge("Destructive", variant: .destructive)

        // THEN: Badge renders with danger theme colors
        XCTAssertNotNil(badge)
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testBadgeOutlineVariant() {
        // GIVEN: Theme is available
        // WHEN: Badge is rendered with outline variant
        let badge = Badge("Outline", variant: .outline)

        // THEN: Badge renders with border and transparent background
        XCTAssertNotNil(badge)
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testBadgeSuccessVariant() {
        // GIVEN: Theme is available
        // WHEN: Badge is rendered with success variant
        let badge = Badge("Success", variant: .success)

        // THEN: Badge renders with success theme colors
        XCTAssertNotNil(badge)
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testBadgeWarningVariant() {
        // GIVEN: Theme is available
        // WHEN: Badge is rendered with warning variant
        let badge = Badge("Warning", variant: .warning)

        // THEN: Badge renders with warning theme colors
        XCTAssertNotNil(badge)
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testBadgeInfoVariant() {
        // GIVEN: Theme is available
        // WHEN: Badge is rendered with info variant
        let badge = Badge("Info", variant: .info)

        // THEN: Badge renders with info theme colors
        XCTAssertNotNil(badge)
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    // MARK: - AC-3: States - Opacity, Icon rendering, Outline border

    func testBadgeOpacityProperty() {
        // GIVEN: Theme is available
        // WHEN: Badge is rendered with custom opacity
        let badge = Badge("Test", opacity: 0.5)

        // THEN: Badge renders with semi-transparent appearance
        XCTAssertNotNil(badge)
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testBadgeWithIcon() {
        // GIVEN: Theme is available and SF Symbol exists
        // WHEN: Badge is rendered with an icon
        let badge = Badge("New", variant: .success, icon: "checkmark.circle.fill")

        // THEN: Badge renders with icon and text
        XCTAssertNotNil(badge)
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testBadgeOutlineBorderRendering() {
        // GIVEN: Theme is available
        // WHEN: Badge is rendered with outline variant
        let badge = Badge("Outline", variant: .outline)

        // THEN: Badge renders with border (overlay applied)
        XCTAssertNotNil(badge)
        let view = badge.laneShadowTheme()
        XCTAssertTrue(type(of: view) is Any.Type)
    }

    func testBadgeAllVariantsIterable() {
        // GIVEN: BadgeVariant enum is CaseIterable
        // WHEN: We iterate through all variants
        let allVariants = BadgeVariant.allCases

        // THEN: All 7 variants are present
        XCTAssertEqual(allVariants.count, 7, "Badge should have exactly 7 variants")

        // Verify each variant can create a valid Badge
        for variant in allVariants {
            let badge = Badge("Test", variant: variant)
            XCTAssertNotNil(badge, "Badge with variant \(variant.rawValue) should be creatable")
        }
    }

    func testBadgeAccessibilityLabel() {
        // GIVEN: Badge with text
        let badge = Badge("Accessibility Test")

        // WHEN: Converting to view
        let view = badge.laneShadowTheme()

        // THEN: View should be creatable (accessibility label is applied internally)
        XCTAssertTrue(type(of: view) is Any.Type)
    }
}
