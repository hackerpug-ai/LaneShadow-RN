import LaneShadowTheme
import SwiftUI
import XCTest
@testable import LaneShadow

@MainActor
final class LSPhaseDotTests: XCTestCase {
    func test_pending_renders_hollow_token_border() {
        let theme = Theme.shared
        let phaseDot = LSPhaseDot(state: .pending)

        XCTAssertNotNil(phaseDot)
        XCTAssertEqual(LSPhaseDot.fillColor(for: .pending, in: theme), Color.clear)
        XCTAssertEqual(LSPhaseDot.strokeColor(for: .pending, in: theme), LSPhaseDot.borderStrongColor(in: theme))
        XCTAssertEqual(LSPhaseDot.strokeWidth(for: .pending, in: theme), theme.borderWidth.thin)
        XCTAssertEqual(LSPhaseDot.phaseDotSizeToken(in: theme), theme.type.label.md.fontSize)
        XCTAssertEqual(LSPhaseDot.diameter(in: theme), LSPhaseDot.phaseDotSizeToken(in: theme))
    }

    func test_active_renders_filled_signal_with_pulse() {
        let theme = Theme.shared
        let phaseDot = LSPhaseDot(state: .active)
        let recipe = LSPhaseDot.animationRecipe(in: theme)

        XCTAssertNotNil(phaseDot)
        XCTAssertEqual(LSPhaseDot.fillColor(for: .active, in: theme), LSPhaseDot.signalDefaultColor(in: theme))
        XCTAssertTrue(LSPhaseDot.showsPulseRing(for: .active))
        XCTAssertEqual(recipe.name, "motion.recipe.phaseDotPulse")
        XCTAssertEqual(recipe.duration, theme.motion.duration["slow"])
        XCTAssertEqual(recipe.easing, theme.motion.easing["standard"])
        XCTAssertEqual(recipe.scaleRange.lowerBound, 0)
        XCTAssertEqual(recipe.scaleRange.upperBound, 1.5)
        XCTAssertEqual(recipe.startOpacity, 0.4)
        XCTAssertEqual(recipe.endOpacity, 0)
        XCTAssertTrue(recipe.repeats)
        XCTAssertFalse(recipe.autoreverses)
    }

    func test_done_renders_filled_success_no_animation() {
        let theme = Theme.shared
        let phaseDot = LSPhaseDot(state: .done)

        XCTAssertNotNil(phaseDot)
        XCTAssertEqual(LSPhaseDot.fillColor(for: .done, in: theme), LSPhaseDot.statusSuccessColor(in: theme))
        XCTAssertFalse(LSPhaseDot.showsPulseRing(for: .done))
        XCTAssertNil(LSPhaseDot.animation(for: .done, in: theme))
    }
}
