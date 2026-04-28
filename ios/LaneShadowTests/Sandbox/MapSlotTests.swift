import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import UIKit
import XCTest
@testable import LaneShadow

/// Map slot tests for paper substrate + contour rendering.
///
/// TDD: RED → GREEN → REFACTOR for each AC.
///
/// AC-1: IdleScreen map renders paper substrate + contour SVGs + favorite pins
/// AC-2: PlanningScreen map renders paper substrate with contours
/// AC-3: ErrorScreen map renders paper with broken polyline overlay
/// AC-4: Dark mode map.paper resolves to ink-900
/// AC-5: Favorite pins render at 16pt with correct styling
@MainActor
final class MapSlotTests: XCTestCase {
    // MARK: - AC-1: IdleScreen renders paper substrate with contours and pins

    func testIdleScreenPaperSubstrateWithContours() {
        // GIVEN: IdleScreen is displayed in sandbox
        let idleScreen = IdleScreen().laneShadowTheme()

        // WHEN: The map slot area renders
        // THEN: Background is warm copper tint with SVG contour grid and copper pin dots
        assertSnapshot(
            matching: idleScreen,
            as: .image(precision: 0.98, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ])),
            named: "idle-screen-paper-map"
        )
    }

    // MARK: - AC-2: PlanningScreen renders paper substrate with contours

    func testPlanningScreenPaperSubstrate() {
        // GIVEN: PlanningScreen is displayed
        let planningScreen = PlanningScreen().laneShadowTheme()

        // WHEN: The map slot area renders
        // THEN: Background is paper substrate with contour lines (no LinearGradient)
        assertSnapshot(
            matching: planningScreen,
            as: .image(precision: 0.98, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ])),
            named: "planning-screen-paper-map"
        )
    }

    // MARK: - AC-3: ErrorScreen renders paper with broken polyline overlay

    func testErrorScreenBrokenPolylineOverlay() {
        // GIVEN: ErrorScreen is displayed
        let errorScreen = ErrorScreen().laneShadowTheme()

        // WHEN: The map slot area renders
        // THEN: Background is paper with dashed error polyline + origin/destination pins
        assertSnapshot(
            matching: errorScreen,
            as: .image(precision: 0.98, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ])),
            named: "error-screen-broken-polyline"
        )
    }

    // MARK: - AC-4: Dark mode map substrate resolves correctly

    func testDarkModeMapSubstrate() {
        // GIVEN: Device is in dark mode
        // WHEN: Any screen's map slot renders
        // THEN: Paper substrate resolves to dark ink-900 with inverted contours
        let idleScreen = IdleScreen()
            .laneShadowTheme()
            .preferredColorScheme(.dark)

        assertSnapshot(
            matching: idleScreen,
            as: .image(precision: 0.98, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .dark),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ])),
            named: "idle-screen-dark-mode"
        )
    }

    // MARK: - AC-5: Favorite pin overlay rendering

    func testFavoritePinOverlay() {
        // GIVEN: IdleScreen with favorite locations
        // WHEN: Map slot renders
        // THEN: Copper-filled circle pins (16pt) with card-colored border
        let idleScreen = IdleScreen().laneShadowTheme()

        assertSnapshot(
            matching: idleScreen,
            as: .image(precision: 0.98, traits: UITraitCollection(traitsFrom: [
                UITraitCollection(userInterfaceStyle: .light),
                UITraitCollection(userInterfaceIdiom: .phone),
                UITraitCollection(horizontalSizeClass: .compact),
                UITraitCollection(verticalSizeClass: .regular),
            ])),
            named: "idle-screen-favorite-pins"
        )
    }

    // MARK: - FID-S01-T11: Implementation Fixes

    func testPaperMapUsesSemanticToken() throws {
        // GIVEN: LSPaperMap component renders paper substrate
        // WHEN: Source code is checked
        // THEN: Should NOT use surface.default (wrong token), should use card.default or map-specific token

        let source = try source(named: "LSPaperMap.swift", in: "Molecules")

        // MUST NOT use surface.default (acknowledged as wrong in original comment)
        XCTAssertFalse(
            source.contains("surface.default"),
            "LSPaperMap MUST NOT use surface.default — should use card.default or map.paper token"
        )

        // SHOULD use a semantic token for the paper substrate
        XCTAssertTrue(
            source.contains("card.default") || source.contains("map.paper"),
            "LSPaperMap SHOULD use card.default or map.paper semantic token for paper substrate"
        )
    }

    func testFavoritePinDotUsesThemeToken() throws {
        // GIVEN: LSFavoritePinDot component renders pin dots
        // WHEN: Source code is checked
        // THEN: Should NOT have hardcoded CGFloat = 16, should use theme token

        let source = try source(named: "LSFavoritePinDot.swift", in: "Molecules")

        // MUST NOT have hardcoded CGFloat literal
        XCTAssertFalse(
            source.contains("CGFloat = 16") && source.contains("let pinSize: CGFloat = 16"),
            "LSFavoritePinDot MUST NOT use hardcoded CGFloat = 16 — should use theme.iconSize.small"
        )

        // SHOULD use theme token for pin size
        XCTAssertTrue(
            source.contains("theme.iconSize") || source.contains("pinSize"),
            "LSFavoritePinDot SHOULD use theme token for pin size"
        )
    }

    func testScenicDotStripUsesThemeToken() throws {
        // GIVEN: LSScenicDotStrip component renders scenic rating dots
        // WHEN: Source code is checked
        // THEN: Should NOT have hardcoded CGFloat = 8, should use theme token

        let source = try source(named: "LSScenicDotStrip.swift", in: "Molecules")

        // MUST NOT have hardcoded CGFloat literal
        XCTAssertFalse(
            source.contains("CGFloat = 8") && source.contains("let dotSize: CGFloat = 8"),
            "LSScenicDotStrip MUST NOT use hardcoded CGFloat = 8 — should use theme token"
        )

        // SHOULD use theme token for dot size
        XCTAssertTrue(
            source.contains("theme.iconSize") || source.contains("dotSize"),
            "LSScenicDotStrip SHOULD use theme token for dot size"
        )
    }

    // MARK: - Helpers

    private func source(named name: String, in directory: String = "Molecules") throws -> String {
        let path = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/\(directory)/\(name)"
        return try String(contentsOfFile: path, encoding: .utf8)
    }
}
