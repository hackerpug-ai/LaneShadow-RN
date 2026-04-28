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
}
