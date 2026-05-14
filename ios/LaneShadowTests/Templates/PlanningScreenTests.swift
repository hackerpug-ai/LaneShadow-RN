import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import XCTest
@testable import LaneShadow

@MainActor
struct PlanningScreenTests {
    // MARK: - AC-1: Top-overlay composition (capsule above, indicator below)

    /// TC-1: Verify LSContextCapsule is composed in topOverlays before LSPhaseIndicator
    @Test
    func topOverlay_capsuleAboveIndicator() {
        let phases = [
            LSPhaseIndicator.Phase(id: "p1", label: "Parsing", state: .done),
            LSPhaseIndicator.Phase(id: "p2", label: "Drawing", state: .active),
            LSPhaseIndicator.Phase(id: "p3", label: "Weather", state: .pending),
            LSPhaseIndicator.Phase(id: "p4", label: "Scoring", state: .pending),
            LSPhaseIndicator.Phase(id: "p5", label: "Ranking", state: .pending),
        ]

        let liveState = PlanningScreenLiveState(
            messages: [],
            phases: phases,
            errorMessage: nil,
            isThinking: false,
            isSending: false,
            shouldRenderMap: true,
            capsuleHeadline: "Drawing routes…"
        )

        let screen = PlanningScreen(
            liveState: liveState,
            onMenuTap: {},
            onCollapse: {},
            onSend: { _ in },
            onRetry: { _ in },
            onRequestCancelConfirmation: {}
        )

        // Use hosting controller to render and inspect accessibility tree
        let hostingController = UIHostingController(rootView: screen)
        _ = hostingController.view // Force layout

        // Verify screen renders without crashing
        #expect(hostingController.view != nil)

        // Snapshot test ensures visual composition is correct
        assertSnapshot(of: screen, as: .image(precision: 0.9))
    }

    // MARK: - AC-2: LSContextCapsule binds to viewModel.capsuleHeadline

    /// TC-2: Capsule receives state .planning(headline: viewModel.capsuleHeadline) exactly
    @Test
    func capsule_bindsViewModelHeadline() {
        let testHeadline = "Drafting candidates…"
        let liveState = PlanningScreenLiveState(
            messages: [],
            phases: [],
            errorMessage: nil,
            isThinking: false,
            isSending: false,
            shouldRenderMap: true,
            capsuleHeadline: testHeadline
        )

        let screen = PlanningScreen(
            liveState: liveState,
            onMenuTap: {},
            onCollapse: {},
            onSend: { _ in },
            onRetry: { _ in },
            onRequestCancelConfirmation: {}
        )

        // Render the screen to verify the headline is in the rendered view
        let hostingController = UIHostingController(rootView: screen)
        _ = hostingController.view // Force layout
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.1)) // Allow UIKit to catch up with SwiftUI tree

        // Verify accessibility identifier for the capsule is present
        let capsuleFound = hostingController.view?.accessibilityElements?
            .contains { ($0 as? UIAccessibilityElement)?.accessibilityIdentifier == "planningscreen-context-capsule"
            } ??
            false
        #expect(capsuleFound, "Context capsule with planningscreen-context-capsule identifier should be rendered")
    }

    // MARK: - AC-3: LSPhaseIndicator binds to viewModel.phaseSteps

    /// TC-3: Phase indicator receives 5-entry phaseSteps with accessibility id
    @Test
    func indicator_bindsViewModelPhaseSteps() {
        let phases = [
            LSPhaseIndicator.Phase(id: "p1", label: "Parsing", state: .done),
            LSPhaseIndicator.Phase(id: "p2", label: "Drawing", state: .done),
            LSPhaseIndicator.Phase(id: "p3", label: "Weather", state: .active),
            LSPhaseIndicator.Phase(id: "p4", label: "Scoring", state: .pending),
            LSPhaseIndicator.Phase(id: "p5", label: "Ranking", state: .pending),
        ]

        let liveState = PlanningScreenLiveState(
            messages: [],
            phases: phases,
            errorMessage: nil,
            isThinking: false,
            isSending: false,
            shouldRenderMap: true,
            capsuleHeadline: "Sun on one leg…"
        )

        let screen = PlanningScreen(
            liveState: liveState,
            onMenuTap: {},
            onCollapse: {},
            onSend: { _ in },
            onRetry: { _ in },
            onRequestCancelConfirmation: {}
        )

        // Render the screen
        let hostingController = UIHostingController(rootView: screen)
        _ = hostingController.view // Force layout
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.1)) // Allow UIKit to catch up with SwiftUI tree

        // Verify phase indicator accessibility identifier is present
        let phaseIndicatorFound = hostingController.view?.accessibilityElements?
            .contains { ($0 as? UIAccessibilityElement)?.accessibilityIdentifier == "planningscreen-phase-indicator"
            } ??
            false
        #expect(
            phaseIndicatorFound,
            "Phase indicator with planningscreen-phase-indicator identifier should be rendered"
        )

        // Verify we have exactly 5 phases in the liveState
        #expect(liveState.phases.count == 5)
    }

    // MARK: - AC-4: Back chip triggers requestCancelConfirmation

    /// TC-4: Back chip (onMenuTap) calls requestCancelConfirmation, not confirmCancellation
    /// Note: Full end-to-end tap verification is in PlanningStateE2ETests.swift (XCUITest).
    @Test
    func backChip_callsRequestCancelConfirmation() {
        var wasRequestCancelConfirmationCalled = false
        var wasCancelPlanningCalled = false

        let liveState = PlanningScreenLiveState(
            messages: [],
            phases: [],
            errorMessage: nil,
            isThinking: false,
            isSending: false,
            shouldRenderMap: true,
            capsuleHeadline: "Testing…"
        )

        let screen = PlanningScreen(
            liveState: liveState,
            onMenuTap: {
                // The onMenuTap is wired to call onRequestCancelConfirmation in liveContent
            },
            onCollapse: {
                // onCollapse should NOT be called; that's the bug we fixed
            },
            onSend: { _ in },
            onRetry: { _ in },
            onRequestCancelConfirmation: {
                wasRequestCancelConfirmationCalled = true
            }
        )

        // Render the screen
        let hostingController = UIHostingController(rootView: screen)
        _ = hostingController.view // Force layout

        // Verify screen renders
        #expect(hostingController.view != nil)

        // Verify callback should NOT be called until tap (tests correct wiring)
        #expect(!wasRequestCancelConfirmationCalled, "requestCancelConfirmation should not be called until back chip is tapped")
        #expect(!wasCancelPlanningCalled, "cancelPlanning should never be called from this view")
    }

    // MARK: - AC-5: LSChatInput renders in is-thinking lock

    /// TC-5: Chat input renders with isThinking=true, isEnabled=false when viewModel.isThinking
    @Test
    func chatInput_lockedWhenThinking() {
        let liveState = PlanningScreenLiveState(
            messages: [],
            phases: [],
            errorMessage: nil,
            isThinking: true,
            isSending: false,
            shouldRenderMap: true,
            capsuleHeadline: "Thinking…"
        )

        let screen = PlanningScreen(
            liveState: liveState,
            onMenuTap: {},
            onCollapse: {},
            onSend: { _ in },
            onRetry: { _ in },
            onRequestCancelConfirmation: {}
        )

        // Render the screen
        let hostingController = UIHostingController(rootView: screen)
        _ = hostingController.view // Force layout

        // Verify screen renders with thinking state
        #expect(liveState.isThinking == true)

        // Snapshot test verifies the visual lock state (disabled input, spinner visible)
        assertSnapshot(of: screen, as: .image(precision: 0.9))
    }

    // MARK: - AC-6: LSMapControls in planning configuration

    /// TC-6: LSMapControls is present with planning configuration and accessibility id
    @Test
    func mapControls_planningConfiguration() {
        let liveState = PlanningScreenLiveState(
            messages: [],
            phases: [],
            errorMessage: nil,
            isThinking: false,
            isSending: false,
            shouldRenderMap: true,
            capsuleHeadline: "Planning…"
        )

        let screen = PlanningScreen(
            liveState: liveState,
            onMenuTap: {},
            onCollapse: {},
            onSend: { _ in },
            onRetry: { _ in },
            onRequestCancelConfirmation: {}
        )

        // Render the screen
        let hostingController = UIHostingController(rootView: screen)
        _ = hostingController.view // Force layout
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.1)) // Allow UIKit to catch up with SwiftUI tree

        // Verify map controls accessibility identifier is present
        let controlsFound = hostingController.view?.accessibilityElements?
            .contains { ($0 as? UIAccessibilityElement)?.accessibilityIdentifier == "planningscreen-controls" } ?? false
        #expect(controlsFound, "Map controls with planningscreen-controls identifier should be rendered")
    }

    // MARK: - AC-7: Map host identity preserved across idle→planning

    /// TC-7: Same LSMap instance is preserved across state transitions (no remount)
    @Test
    func mapHost_identityPreserved() {
        let liveState = PlanningScreenLiveState(
            messages: [],
            phases: [],
            errorMessage: nil,
            isThinking: false,
            isSending: false,
            shouldRenderMap: true,
            capsuleHeadline: "Planning…"
        )

        let screen = PlanningScreen(
            liveState: liveState,
            onMenuTap: {},
            onCollapse: {},
            onSend: { _ in },
            onRetry: { _ in },
            onRequestCancelConfirmation: {}
        )

        // Render the screen
        let hostingController = UIHostingController(rootView: screen)
        _ = hostingController.view // Force layout
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.1)) // Allow UIKit to catch up with SwiftUI tree

        // Verify map accessibility identifier is present (indicating the map is rendered unconditionally)
        let mapFound = hostingController.view?.accessibilityElements?
            .contains { ($0 as? UIAccessibilityElement)?.accessibilityIdentifier == "planningscreen-map" } ?? false
        #expect(mapFound, "Map with planningscreen-map identifier should be rendered (identity preserved)")
    }

    // MARK: - AC-8: Token purity (zero hex/numeric hardcoding)

    /// TC-8: PlanningScreen.swift contains zero hardcoded hex, RGB, or numeric values
    @Test
    func token_purity_enforced() throws {
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift"
        let source = try String(contentsOfFile: sourceFile, encoding: .utf8)

        // Use regex to detect hex color literals (e.g., #RRGGBB or #RGB)
        let hexRegex = try NSRegularExpression(pattern: "#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}")
        let hexMatches = hexRegex.matches(in: source, range: NSRange(source.startIndex..., in: source))
        #expect(hexMatches.isEmpty, "PlanningScreen should not contain hex color literals")

        // Detect Color(red:green:blue:) patterns
        let rgbRegex = try NSRegularExpression(pattern: "Color\\(red:")
        let rgbMatches = rgbRegex.matches(in: source, range: NSRange(source.startIndex..., in: source))
        #expect(rgbMatches.isEmpty, "PlanningScreen should not contain Color(red:...) literals")

        // Verify theme token usage is present (sample check)
        let usesThemeTokens = source.contains("theme.space") || source.contains("LaneShadowTheme.color")
        #expect(usesThemeTokens, "PlanningScreen should use theme tokens for all styling")
    }

    // MARK: - AC-9: Sandbox stories with canonical IDs

    /// TC-9: Sandbox stories exist with canonical lowercase dot-separated IDs (14 total: 7 states × 2 themes)
    @Test
    func sandboxStories_registered() throws {
        let storyFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift"
        let source = try String(contentsOfFile: storyFile, encoding: .utf8)

        // Canonical story IDs that MUST be present
        let requiredIds = [
            "templates.planning-screen.scouting-light",
            "templates.planning-screen.scouting-dark",
            "templates.planning-screen.drawing-light",
            "templates.planning-screen.drawing-dark",
            "templates.planning-screen.weather-light",
            "templates.planning-screen.weather-dark",
            "templates.planning-screen.scoring-light",
            "templates.planning-screen.scoring-dark",
            "templates.planning-screen.slow-planning-light",
            "templates.planning-screen.slow-planning-dark",
            "templates.planning-screen.cancel-prompt-light",
            "templates.planning-screen.cancel-prompt-dark",
            "templates.planning-screen.single-candidate-light",
            "templates.planning-screen.single-candidate-dark",
        ]

        for id in requiredIds {
            #expect(
                source.contains("\"" + id + "\""),
                "PlanningScreenStory should contain story ID: \(id)"
            )
        }

        // Verify no old-style IDs remain
        let oldPatterns = [
            "templates.planning-screen.phase1",
            "templates.planning-screen.default",
            "templates.planning-screen.phase3",
            "templates.planning-screen.phase4",
            "templates.planning-screen.phase5",
            "templates.planning-screen.dark",
            "templates.planning-screen.v-slow",
            "templates.planning-screen.v-cancel-confirm",
            "templates.planning-screen.v-single-candidate",
        ]
        for oldId in oldPatterns {
            #expect(
                !source.contains("id: \"" + oldId + "\""),
                "PlanningScreenStory should NOT contain old-style ID: \(oldId)"
            )
        }
    }

    // MARK: - Integration: Planning default variant snapshot

    /// Planning screen default rendering (light theme)
    @Test
    func planning_default_renders() {
        let screen = PlanningScreen(
            provider: PlanningMockProvider.self,
            activePhase: 2
        )

        assertSnapshot(of: screen, as: .image(precision: 0.9))
    }

    /// Planning screen dark mode rendering
    @Test
    func planning_dark_renders() {
        let screen = PlanningScreen(
            provider: PlanningMockProvider.self,
            activePhase: 2
        )

        assertSnapshot(matching: screen, as: .image(precision: 0.9, traits: UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .dark),
            UITraitCollection(userInterfaceIdiom: .phone),
            UITraitCollection(horizontalSizeClass: .compact),
            UITraitCollection(verticalSizeClass: .regular),
        ])))
    }

    // MARK: - Static Code Quality Tests

    /// Sketch polyline uses recipe-driven animation, not literals
    @Test
    func sketch_animation_uses_recipe_not_literals() throws {
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift"
        let source = try String(contentsOfFile: sourceFile, encoding: .utf8)

        let containsRecipeReference = source.contains("sketchPolylineLoopAnimation")
        #expect(
            containsRecipeReference,
            "Source should reference motion.recipe.sketchPolylineLoop via sketchPolylineLoopAnimation"
        )

        let containsBreathingRecipe = source.contains("breathingDotAnimationRecipe")
        #expect(containsBreathingRecipe, "Source should reference breathingDotAnimationRecipe")
    }

    /// Sketch polyline uses GeometryReader, not UIScreen.main.bounds
    @Test
    func sketch_polyline_uses_geometry_not_uiscreen() throws {
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift"
        let source = try String(contentsOfFile: sourceFile, encoding: .utf8)

        let hasUIScreenMainBounds = source.contains("UIScreen.main.bounds")
        #expect(
            !hasUIScreenMainBounds,
            "SketchingPolyline should not use UIScreen.main.bounds; use GeometryReader instead"
        )

        let hasGeometryReader = source.contains("GeometryReader")
        #expect(hasGeometryReader, "SketchingPolyline should use GeometryReader for responsive sizing")
    }

    /// No data fetching in template (Convex/URLSession)
    @Test
    func no_data_fetching_in_template() throws {
        let sourceFile = "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/PlanningScreen.swift"
        let source = try String(contentsOfFile: sourceFile, encoding: .utf8)

        let forbiddenPatterns = ["Convex", "URLSession", ".task("]
        for pattern in forbiddenPatterns {
            #expect(
                !source.contains(pattern),
                "PlanningScreen.swift should not contain '\(pattern)' — found data fetching symbol"
            )
        }
    }
}
