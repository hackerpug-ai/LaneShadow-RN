import LaneShadowTheme
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

@MainActor
final class LSContextCapsuleTests: XCTestCase {
    func test_idleState_rendersHeadlineAndMetaRow() {
        let state = LSContextCapsule.CapsuleState.idle(
            headline: makeHeadline(
                fullText: "Where are we riding today, Justin?",
                emphasized: "today"
            ),
            metaItems: ["Friday", "68°F", "Clear"]
        )

        let appearance = LSContextCapsule.resolvedAppearance(
            for: state,
            isWarning: false,
            isSaved: false,
            in: Theme.shared
        )

        XCTAssertEqual(appearance.headlineText, "Where are we riding today, Justin?")
        XCTAssertEqual(appearance.emphasizedText, ["today"])
        XCTAssertEqual(appearance.headlineTypographyToken, "type.opinion.md")
        XCTAssertEqual(appearance.headlineColorToken, "color.content.primary")
        XCTAssertEqual(appearance.emphasisColorToken, "color.signal.default")
        XCTAssertEqual(appearance.metaItems, ["Friday", "68°F", "Clear"])
        XCTAssertEqual(appearance.metaTypographyToken, "type.label.sm")
        XCTAssertEqual(appearance.metaColorToken, "color.signal.default")
        XCTAssertEqual(appearance.containerBackgroundToken, "color.surface.glass")
        XCTAssertEqual(appearance.containerBorderToken, "color.border.default")
        XCTAssertEqual(appearance.cornerRadius, Theme.shared.radius.lg)
    }

    func test_planningState_rendersSpinnerAndHeadline() {
        let state = LSContextCapsule.CapsuleState.planning(headline: "Sketching a coastal loop…")
        let appearance = LSContextCapsule.resolvedAppearance(
            for: state,
            isWarning: false,
            isSaved: false,
            in: Theme.shared
        )
        let animatedBehavior = LSContextCapsule.planningPulseBehavior(
            reduceMotion: false,
            in: Theme.shared
        )
        let reducedMotionBehavior = LSContextCapsule.planningPulseBehavior(
            reduceMotion: true,
            in: Theme.shared
        )

        XCTAssertEqual(appearance.headlineText, "Sketching a coastal loop…")
        XCTAssertEqual(appearance.headlineTypographyToken, "type.opinion.md")
        XCTAssertEqual(appearance.emphasisColorToken, "color.signal.default")
        XCTAssertTrue(animatedBehavior.isAnimated)
        XCTAssertFalse(reducedMotionBehavior.isAnimated)
        XCTAssertEqual(animatedBehavior.colorToken, "color.signal.default")
        XCTAssertEqual(animatedBehavior.durationSeconds, 1.4, accuracy: 0.001)
    }

    func test_routeState_rendersInstrumentMetrics() {
        let state = LSContextCapsule.CapsuleState.route(
            name: makeHeadline(
                fullText: "Coastal cruise",
                emphasized: "Coastal cruise"
            ),
            metrics: ["47 mi", "2h 15m", "arr 4:32p"]
        )

        let appearance = LSContextCapsule.resolvedAppearance(
            for: state,
            isWarning: false,
            isSaved: false,
            in: Theme.shared
        )

        XCTAssertEqual(appearance.headlineText, "Coastal cruise")
        XCTAssertEqual(appearance.metaItems, ["47 mi", "2h 15m", "arr 4:32p"])
        XCTAssertEqual(appearance.headlineColorToken, "color.content.primary")
        XCTAssertEqual(appearance.emphasisColorToken, "color.content.primary")
        XCTAssertEqual(appearance.metaTypographyToken, "type.instrument.sm")
        XCTAssertEqual(appearance.metaColorToken, "color.content.tertiary")
    }

    func test_warningModifier_tintsMetaRowWarning() {
        let state = LSContextCapsule.CapsuleState.idle(
            headline: makeHeadline(
                fullText: "Not the prettiest day for it.",
                emphasized: "prettiest"
            ),
            metaItems: ["Friday", "52°F", "Rain · 0.4″"]
        )

        let appearance = LSContextCapsule.resolvedAppearance(
            for: state,
            isWarning: true,
            isSaved: false,
            in: Theme.shared
        )

        XCTAssertEqual(appearance.metaColorToken, "color.status.warning.default")
        XCTAssertEqual(appearance.emphasisColorToken, "color.signal.default")
    }

    func test_savedModifier_drawsCopperHairline() {
        let state = LSContextCapsule.CapsuleState.route(
            name: makeHeadline(
                fullText: "Mountain Pass Sunrise",
                emphasized: "Mountain Pass Sunrise"
            ),
            metrics: ["62 mi", "3h 02m", "arr 9:18a"]
        )

        let savedAppearance = LSContextCapsule.resolvedAppearance(
            for: state,
            isWarning: false,
            isSaved: true,
            in: Theme.shared
        )
        let defaultAppearance = LSContextCapsule.resolvedAppearance(
            for: state,
            isWarning: false,
            isSaved: false,
            in: Theme.shared
        )

        XCTAssertEqual(savedAppearance.savedOverlayColorToken, "color.signal.default")
        XCTAssertEqual(savedAppearance.savedOverlayLineWidth, Theme.shared.borderWidth.thin)
        XCTAssertNil(defaultAppearance.savedOverlayColorToken)
    }

    func test_darkTheme_reResolvesTokens() {
        let lightColors = LSContextCapsule.resolvedThemeColors(for: .light)
        let darkColors = LSContextCapsule.resolvedThemeColors(for: .dark)

        XCTAssertNotEqual(lightColors.surfaceGlass, darkColors.surfaceGlass)
        XCTAssertNotEqual(lightColors.contentPrimary, darkColors.contentPrimary)
        XCTAssertEqual(lightColors.signalDefault, darkColors.signalDefault)
    }

    func test_sandboxStories_allTenRegistered() {
        let ids = LSContextCapsuleStories.all.map(\.id)
        let expected: Set = [
            "molecules.context-capsule.idle-light",
            "molecules.context-capsule.idle-dark",
            "molecules.context-capsule.planning-light",
            "molecules.context-capsule.planning-dark",
            "molecules.context-capsule.route-light",
            "molecules.context-capsule.route-dark",
            "molecules.context-capsule.warning-light",
            "molecules.context-capsule.warning-dark",
            "molecules.context-capsule.saved-light",
            "molecules.context-capsule.saved-dark",
        ]

        XCTAssertEqual(LSContextCapsuleStories.all.count, 10)
        XCTAssertEqual(Set(ids), expected)
    }

    private func makeHeadline(fullText: String, emphasized: String) -> AttributedString {
        var headline = AttributedString(fullText)

        if let range = headline.range(of: emphasized) {
            headline[range].inlinePresentationIntent = .emphasized
        }

        return headline
    }
}
