import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

@MainActor
final class LSBestBadgeTests: XCTestCase {
    func test_best_badge_resolves_signal_tokens_and_filled_star() {
        let theme = Theme.shared
        let badge = LSBestBadge()
        let style = LSBestBadge.resolvedStyle(in: theme)

        XCTAssertNotNil(badge)
        XCTAssertEqual(LSBestBadge.labelText, "BEST FOR TODAY")
        XCTAssertEqual(style.backgroundToken, "color.signal.default")
        XCTAssertEqual(style.foregroundToken, "color.content.onSignal")
        XCTAssertEqual(style.backgroundColor, theme.colors.primary.default)
        XCTAssertEqual(style.leadingIcon, .starFill)
        XCTAssertEqual(style.iconSize, .xs)
        XCTAssertEqual(style.pillHeight(in: theme), PillSize.sm.height(in: theme))
    }
}
