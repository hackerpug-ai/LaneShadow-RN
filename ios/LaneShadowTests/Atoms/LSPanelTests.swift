import LaneShadowTheme
import XCTest
@testable import LaneShadow

final class LSPanelTests: XCTestCase {
    func test_lspanel_resolves_panel_tokens() {
        let theme = Theme.shared

        XCTAssertEqual(LSPanel<LSText>.surfaceFill(in: theme), theme.colors.surface.default)
        XCTAssertEqual(LSPanel<LSText>.cornerRadius(in: theme), theme.radius.md)
        XCTAssertEqual(LSPanel<LSText>.elevation(in: theme).radius, theme.elevation.level0.radius)
        XCTAssertEqual(LSPanel<LSText>.elevation(in: theme).opacity, theme.elevation.level0.opacity)
        XCTAssertEqual(LSPanel<LSText>.resolvedPadding(.spacing3, in: theme), theme.space.md)
        XCTAssertNotNil(LSPanel { LSText("Inner", variant: .body.md) })
    }
}
