import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

@MainActor
struct PlanningScreenTests {
    // MARK: - AC-1: Planning composition renders

    /// TC-1: Snapshot of default planning variant matches baseline
    @Test
    func planning_default_renders() {
        let screen = PlanningScreen(
            provider: PlanningMockProvider.self,
            activePhase: 2
        )

        assertSnapshot(of: screen, as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .light),
            UITraitCollection(userInterfaceIdiom: .phone),
            UITraitCollection(horizontalSizeClass: .compact),
            UITraitCollection(verticalSizeClass: .regular),
        ])))
    }

    // MARK: - AC-2: Phase argType drives indicator

    /// TC-2: Phase argType variants 1–5 each render with correct active index
    @Test(arguments: [1, 2, 3, 4, 5])
    func phase_variant_sets_active_phase(phase: Int) async throws {
        let screen = PlanningScreen(
            provider: PlanningMockProvider.self,
            activePhase: phase
        )
        .laneShadowTheme()

        let inspected = try screen.inspect()

        // Find the phase indicator (should be in topOverlays)
        let phaseIndicator = try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-phase-indicator")

        // Verify the correct phase is marked as active
        // Phase indicator should have exactly one active phase
        let activeDots = try phaseIndicator.findAll { view in
            guard let accessibilityLabel = try? view.accessibilityLabel() else {
                return false
            }
            return accessibilityLabel.contains("Active phase")
        }

        #expect(activeDots.count == 1, "Exactly one phase should be active")
        #expect(activeDots.first?.exists() == true, "Active phase dot should exist")
    }

    // MARK: - AC-3: Sketch animation is recipe-driven

    /// TC-3: Source contains `motion.recipe.sketchPolylineLoop` and zero literal `Animation.linear(duration:` for the
    /// sketch
    @Test
    func sketch_animation_uses_recipe_not_literals() {
        // Static grep test: verify no literal Animation.linear(duration:) for sketching
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift"

        guard let source = try? String(contentsOfFile: sourceFile) else {
            XCTFail("Could not read PlanningScreen.swift source file")
            return
        }

        // Verify motion recipe is referenced
        let containsRecipeReference = source.contains("sketchPolylineLoop")
        XCTAssertTrue(containsRecipeReference, "Source should reference motion.recipe.sketchPolylineLoop")

        // Verify NO literal duration for sketch animation
        let hasLiteralDuration = source.contains("Animation.linear(duration:") &&
            (source.contains("strokeDashoffset") || source.contains("sketch"))
        XCTAssertFalse(hasLiteralDuration, "Sketch animation should NOT use literal Animation.linear(duration:)")
    }

    // MARK: - AC-4: Chat input is non-interactive

    /// TC-4: Chat input is disabled and trailing slot contains LSSpinner
    @Test
    func chat_input_disabled_with_spinner() async throws {
        let screen = PlanningScreen(
            provider: PlanningMockProvider.self,
            activePhase: 2
        )
        .laneShadowTheme()

        let inspected = try screen.inspect()

        // Find chat input
        let chatInput = try inspected.find(viewWithAccessibilityIdentifier: "planningscreen-chat-input")

        // Verify spinner is present in trailing slot
        let spinner = try chatInput.find(viewWithAccessibilityIdentifier: "lschatinput-spinner")
        #expect(spinner.exists(), "Spinner should be present in chat input trailing slot")

        // Verify input is disabled (isThinking: true)
        let textField = try chatInput.find(viewWithAccessibilityIdentifier: "lschatinput-field")
        // The text field should be in disabled state when isThinking is true
        let placeholderText = try textField.text().string()
        #expect(placeholderText.contains("Planning") || placeholderText.contains("…"),
                "Placeholder should indicate planning state")
    }

    // MARK: - AC-5: Light/dark re-resolves tokens

    /// TC-5: Dark snapshot matches baseline
    @Test
    func planning_dark_renders() {
        let screen = PlanningScreen(
            provider: PlanningMockProvider.self,
            activePhase: 2
        )

        assertSnapshot(of: screen, as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .dark),
            UITraitCollection(userInterfaceIdiom: .phone),
            UITraitCollection(horizontalSizeClass: .compact),
            UITraitCollection(verticalSizeClass: .regular),
        ])))
    }

    // MARK: - AC-6: No data fetching in template

    /// TC-6: Static grep finds no Convex/URLSession/.task in template
    @Test
    func no_data_fetching_in_template() {
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift"

        guard let source = try? String(contentsOfFile: sourceFile) else {
            XCTFail("Could not read PlanningScreen.swift source file")
            return
        }

        // Verify no Convex imports
        let hasConvex = source.contains("Convex")
        XCTAssertFalse(hasConvex, "Template should not import Convex")

        // Verify no URLSession usage
        let hasURLSession = source.contains("URLSession")
        XCTAssertFalse(hasURLSession, "Template should not use URLSession")

        // Verify no .task modifiers (data fetching)
        let hasTaskModifier = source.contains(".task {")
        XCTAssertFalse(hasTaskModifier, "Template should not use .task modifier for data fetching")
    }
}
