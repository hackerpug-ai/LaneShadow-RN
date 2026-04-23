import LaneShadowTheme
import XCTest
@testable import LaneShadow

@MainActor
final class LSTextAreaTests: XCTestCase {
    func test_autogrow_height_expands_with_lines() {
        let theme = Theme.shared
        let singleLineHeight = LSTextArea.resolvedHeight(text: "One line", theme: theme, autoGrow: true)
        let threeLineHeight = LSTextArea.resolvedHeight(
            text: "Line one\nLine two\nLine three",
            theme: theme,
            autoGrow: true
        )

        XCTAssertGreaterThanOrEqual(singleLineHeight, theme.control.minHeight)
        XCTAssertGreaterThan(threeLineHeight, singleLineHeight)
        XCTAssertGreaterThanOrEqual(threeLineHeight, (theme.type.body.lg.lineHeight * 3) + (theme.space.md * 2))
    }
}
