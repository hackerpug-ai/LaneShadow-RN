import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSCardTests: XCTestCase {
    func test_lscard_resolves_card_tokens() {
        let theme = Theme.shared

        XCTAssertEqual(LSCard<LSText>.surfaceFill(in: theme), theme.colors.card.default)
        XCTAssertEqual(LSCard<LSText>.cornerRadius(in: theme), theme.radius.lg)
        XCTAssertEqual(LSCard<LSText>.elevation(in: theme).shadowColor, theme.elevation.level2.shadowColor)
        XCTAssertEqual(LSCard<LSText>.elevation(in: theme).radius, theme.elevation.level2.radius)
        XCTAssertEqual(LSCard<LSText>.elevation(in: theme).offsetX, theme.elevation.level2.offsetX)
        XCTAssertEqual(LSCard<LSText>.elevation(in: theme).offsetY, theme.elevation.level2.offsetY)
        XCTAssertEqual(LSCard<LSText>.elevation(in: theme).opacity, theme.elevation.level2.opacity)
        XCTAssertEqual(LSCard<LSText>.resolvedPadding(.spacing4, in: theme), theme.space.lg)
        XCTAssertNotNil(LSCard { LSText("Hello", variant: .body.md) })
    }

    func test_padding_override_resolves_spacing_5() {
        let theme = Theme.shared

        XCTAssertEqual(LSCard<LSText>.resolvedPadding(.spacing5, in: theme), theme.space.xl)
        XCTAssertEqual(LSCard<LSText>.surfaceFill(in: theme), theme.colors.card.default)
        XCTAssertEqual(LSCard<LSText>.cornerRadius(in: theme), theme.radius.lg)
        XCTAssertEqual(LSCard<LSText>.elevation(in: theme).radius, theme.elevation.level2.radius)
        XCTAssertNotNil(LSCard(padding: .spacing5) { LSText("Roomy", variant: .body.md) })
    }
}
