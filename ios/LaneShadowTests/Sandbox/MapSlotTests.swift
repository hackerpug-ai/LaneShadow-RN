import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
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
@Suite("Map Slot Tests")
struct MapSlotTests {
    @MainActor
    @Test("AC-1: IdleScreen renders paper substrate with contours and pins", .snapshot())
    func idleScreenPaperSubstrateWithContours() {
        // GIVEN: IdleScreen is displayed in sandbox
        let idleScreen = IdleScreen()

        // WHEN: The map slot area renders
        // THEN: Background is warm copper tint with SVG contour grid and copper pin dots
        assertSnapshot(
            matching: idleScreen.laneShadowTheme(),
            as: .image(precision: 0.98, layout: .device(config: .iPhone16), traits: .init(displayScale: 3)),
            named: "idle-screen-paper-map"
        )
    }

    @MainActor
    @Test("AC-2: PlanningScreen renders paper substrate with contours", .snapshot())
    func planningScreenPaperSubstrate() {
        // GIVEN: PlanningScreen is displayed
        let planningScreen = PlanningScreen()

        // WHEN: The map slot area renders
        // THEN: Background is paper substrate with contour lines (no LinearGradient)
        assertSnapshot(
            matching: planningScreen.laneShadowTheme(),
            as: .image(precision: 0.98, layout: .device(config: .iPhone16), traits: .init(displayScale: 3)),
            named: "planning-screen-paper-map"
        )
    }

    @MainActor
    @Test("AC-3: ErrorScreen renders paper with broken polyline overlay", .snapshot())
    func errorScreenBrokenPolylineOverlay() {
        // GIVEN: ErrorScreen is displayed
        let errorScreen = ErrorScreen()

        // WHEN: The map slot area renders
        // THEN: Background is paper with dashed error polyline + origin/destination pins
        assertSnapshot(
            matching: errorScreen.laneShadowTheme(),
            as: .image(precision: 0.98, layout: .device(config: .iPhone16), traits: .init(displayScale: 3)),
            named: "error-screen-broken-polyline"
        )
    }

    @MainActor
    @Test("AC-4: Dark mode map substrate resolves correctly", .snapshot())
    func darkModeMapSubstrate() {
        // GIVEN: Device is in dark mode
        // WHEN: Any screen's map slot renders
        // THEN: Paper substrate resolves to dark ink-900 with inverted contours
        let idleScreen = IdleScreen()
            .preferredColorScheme(.dark)

        assertSnapshot(
            matching: idleScreen.laneShadowTheme(),
            as: .image(precision: 0.98, layout: .device(config: .iPhone16), traits: .init(displayScale: 3)),
            named: "idle-screen-dark-mode"
        )
    }

    @MainActor
    @Test("AC-5: Favorite pin overlay rendering", .snapshot())
    func favoritePinOverlay() {
        // GIVEN: IdleScreen with favorite locations
        // WHEN: Map slot renders
        // THEN: Copper-filled circle pins (16pt) with card-colored border
        let idleScreen = IdleScreen()

        assertSnapshot(
            matching: idleScreen.laneShadowTheme(),
            as: .image(precision: 0.98, layout: .device(config: .iPhone16), traits: .init(displayScale: 3)),
            named: "idle-screen-favorite-pins"
        )
    }

    // MARK: - FID-S01-T11: Implementation Fixes

    @MainActor
    @Test("FID-S01-T11 AC-2: LSPaperMap uses semantic map token, not surface.default")
    func paperMapUsesSemanticToken() throws {
        // GIVEN: LSPaperMap component renders paper substrate
        // WHEN: Source code is checked
        // THEN: Should NOT use surface.default (wrong token), should use card.default or map-specific token

        let source = try source(named: "LSPaperMap.swift", in: "Molecules")

        // MUST NOT use surface.default (acknowledged as wrong in original comment)
        #expect(!source.contains("surface.default"), "LSPaperMap MUST NOT use surface.default — should use card.default or map.paper token")

        // SHOULD use a semantic token for the paper substrate
        #expect(source.contains("card.default") || source.contains("map.paper"), "LSPaperMap SHOULD use card.default or map.paper semantic token for paper substrate")
    }

    @MainActor
    @Test("FID-S01-T11 AC-3: LSFavoritePinDot uses theme token, not hardcoded CGFloat")
    func favoritePinDotUsesThemeToken() throws {
        // GIVEN: LSFavoritePinDot component renders pin dots
        // WHEN: Source code is checked
        // THEN: Should NOT have hardcoded CGFloat = 16, should use theme token

        let source = try source(named: "LSFavoritePinDot.swift", in: "Molecules")

        // MUST NOT have hardcoded CGFloat literal
        #expect(!source.contains("CGFloat = 16") && !source.contains("let pinSize: CGFloat = 16"), "LSFavoritePinDot MUST NOT use hardcoded CGFloat = 16 — should use theme.iconSize.small")

        // SHOULD use theme token for pin size
        #expect(source.contains("theme.iconSize") || source.contains("pinSize"), "LSFavoritePinDot SHOULD use theme token for pin size")
    }

    @MainActor
    @Test("FID-S01-T11 AC-3: LSScenicDotStrip uses theme token, not hardcoded CGFloat")
    func scenicDotStripUsesThemeToken() throws {
        // GIVEN: LSScenicDotStrip component renders scenic rating dots
        // WHEN: Source code is checked
        // THEN: Should NOT have hardcoded CGFloat = 8, should use theme token

        let source = try source(named: "LSScenicDotStrip.swift", in: "Molecules")

        // MUST NOT have hardcoded CGFloat literal
        #expect(!source.contains("CGFloat = 8") && !source.contains("let dotSize: CGFloat = 8"), "LSScenicDotStrip MUST NOT use hardcoded CGFloat = 8 — should use theme token")

        // SHOULD use theme token for dot size
        #expect(source.contains("theme.iconSize") || source.contains("dotSize"), "LSScenicDotStrip SHOULD use theme token for dot size")
    }

    // MARK: - Helpers

    private func source(named name: String, in directory: String = "Molecules") throws -> String {
        let path = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/\(directory)/\(name)"
        return try String(contentsOfFile: path, encoding: .utf8)
    }
}
