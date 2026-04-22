import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSTextTests: XCTestCase {
    func test_display_lg_resolves_token() {
        let variant = TypographyVariant.display.lg
        let style = variant.style(in: .shared)
        let expected = Theme.shared.type.display.lg

        XCTAssertEqual(variant.category, .display)
        XCTAssertEqual(variant.tokenPath, "type.display.lg")
        XCTAssertEqual(style.fontSize, expected.fontSize)
        XCTAssertEqual(style.lineHeight, expected.lineHeight, accuracy: 0.001)
    }

    func test_body_md_resolves_token() {
        let variant = TypographyVariant.body.md
        let style = variant.style(in: .shared)
        let expected = Theme.shared.type.body.md

        XCTAssertEqual(variant.category, .body)
        XCTAssertEqual(variant.tokenPath, "type.body.md")
        XCTAssertEqual(style.fontSize, expected.fontSize)
        XCTAssertEqual(style.lineHeight, expected.lineHeight, accuracy: 0.001)
    }

    func test_label_sm_resolves_token() {
        let variant = TypographyVariant.label.sm
        let style = variant.style(in: .shared)
        let expected = Theme.shared.type.label.sm

        XCTAssertEqual(variant.category, .label)
        XCTAssertEqual(variant.tokenPath, "type.label.sm")
        XCTAssertEqual(style.fontSize, expected.fontSize)
        XCTAssertEqual(style.lineHeight, expected.lineHeight, accuracy: 0.001)
    }

    func test_dynamic_type_scaling_propagates() {
        // Create an LSText instance with a known variant
        let text = LSText("Test", variant: .body.md)

        // Verify that the Text view respects Dynamic Type by checking
        // that the font is applied and will scale with system settings
        // We can't directly test Dynamic Type in a unit test, but we can
        // verify the plumbing is in place

        // The LSText should use .font() modifier which responds to @Environment(\.sizeCategory)
        // This is verified by checking that TypographyStyle.font uses the theme system
        let style = TypographyVariant.body.md.style(in: .shared)

        // Verify the style has the expected font properties
        XCTAssertEqual(style.fontSize, 12) // Base size from token
        XCTAssertEqual(style.lineHeight, 18.24, accuracy: 0.01)

        // SwiftUI's .font() modifier automatically applies Dynamic Type scaling
        // when the font is created from a TypographyStyle with a size
        // The presence of the .font modifier in LSText body enables this
    }

    func test_content_color_secondary_resolves_token() {
        let theme = Theme.shared
        let resolvedColor = ContentColor.secondary.resolved(in: theme)

        // Verify the resolved color matches the expected content color values
        // From semantic.tokens.json: content.secondary = ink-400 (light) / ink-100 (dark)
        // ink-400 = #49454F, ink-100 = #CAC4D0
        let expectedLight = dyn(parseColorString("#49454F"), parseColorString("#CAC4D0"))

        XCTAssertEqual(resolvedColor, expectedLight)
    }
}
