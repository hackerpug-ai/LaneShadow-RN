import LaneShadowTheme
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

@MainActor
final class LSSpinnerTests: XCTestCase {
    func test_spinner_is_uiactivityindicator_tinted_signal_default() {
        let theme = Theme.shared
        let spinner = LSSpinner()
        let indicator = LSSpinner.makeIndicator(tint: LSSpinner.resolvedTint(in: theme))

        XCTAssertNotNil(spinner)
        XCTAssertEqual(LSSpinner.resolvedTint(in: theme), theme.colors.primary.default)
        XCTAssertEqual(indicator.style, .medium)
        XCTAssertTrue(indicator.isAnimating)
        XCTAssertEqual(indicator.color, UIColor(theme.colors.primary.default))
    }
}
