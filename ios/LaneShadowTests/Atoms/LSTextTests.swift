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
        // AC-4: Verify TypographyVariant.body.md.style(in:) returns TypographyStyle
        // with correct fontSize and lineHeight matching theme.type.body.md token
        let variant = TypographyVariant.body.md
        let style = variant.style(in: .shared)
        let expected = Theme.shared.type.body.md

        // Verify the style properties match the theme token exactly
        XCTAssertEqual(style.fontSize, expected.fontSize, "TypographyStyle fontSize should match theme.type.body.md token")
        XCTAssertEqual(style.lineHeight, expected.lineHeight, accuracy: 0.001, "TypographyStyle lineHeight should match theme.type.body.md token")

        // Note: SwiftUI's .font() modifier automatically applies Dynamic Type scaling
        // when TypographyStyle.font is used — this is framework behavior
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
