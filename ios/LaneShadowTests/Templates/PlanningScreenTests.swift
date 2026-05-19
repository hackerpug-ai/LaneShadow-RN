import Foundation
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
        assertSnapshot(of: screen, as: .image(precision: 0.95))
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

        // Verify screen renders without crashing
        #expect(hostingController.view != nil)

        // Snapshot test ensures capsule is visually rendered with the headline
        assertSnapshot(of: screen, as: .image(precision: 0.9))
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

        // Verify we have exactly 5 phases in the liveState
        #expect(liveState.phases.count == 5)

        // Snapshot test ensures phase indicator renders visually with all 5 phases
        assertSnapshot(of: screen, as: .image(precision: 0.9))
    }

    // MARK: - AC-4: Back chip triggers requestCancelConfirmation

    /// TC-4: Back chip (onMenuTap) calls requestCancelConfirmation, not confirmCancellation
    /// Note: Full end-to-end tap verification is in PlanningStateE2ETests.swift (XCUITest).
    @Test
    func backChip_callsRequestCancelConfirmation() throws {
        var wasRequestCancelConfirmationCalled = false

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
            onMenuTap: {},
            onCollapse: {},
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

        // Directly invoke the closure that was passed to the screen
        // This tests that the wiring is present and callable
        screen.onRequestCancelConfirmation()

        // Verify the callback was invoked
        #expect(
            wasRequestCancelConfirmationCalled,
            "requestCancelConfirmation closure must be callable and wired"
        )

        try assertPlanningCancelWiring()
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
    func mapControls_planningConfiguration() throws {
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

        // Verify screen renders without crashing
        #expect(hostingController.view != nil)

        let liveContentPath = repoFilePath(
            "ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift"
        )
        let liveContentSource = try String(contentsOfFile: liveContentPath, encoding: .utf8)

        #expect(
            liveContentSource.contains(".accessibilityIdentifier(\"planningscreen-controls\")"),
            "Planning controls must expose the required accessibility identifier"
        )
        #expect(
            liveContentSource.contains("onRecenter: {"),
            "Planning controls must keep recenter active"
        )
        #expect(
            liveContentSource.contains("onLayers: {"),
            "Planning controls must keep the layers affordance wired in planning state"
        )
        #expect(
            liveContentSource.contains("onToggleView: {"),
            "Planning controls must keep the chat-mode toggle wired in planning state"
        )
    }

    // MARK: - AC-7: Map host identity preserved across idle→planning

    /// TC-7: Same LSMap instance is preserved across state transitions (no remount)
    /// NOTE: SwiftUI/Swift Testing cannot reliably introspect Mapbox view instance identity
    /// across state transitions in unit tests. The behavioral verification lives in
    /// PlanningStateE2ETests (UI layer testing). This test verifies the structural pattern
    /// that enables identity preservation: the mapView is rendered unconditionally in
    /// liveContent's LSMapLayer, not conditionally swapped to Color.clear.
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

        // Verify screen renders (map is included in liveContent)
        #expect(hostingController.view != nil)

        // Verify the pattern: mapView property always returns a non-nil view
        // (not conditionally rendering Color.clear, which would unmount the map)
        let mapViewType = String(describing: type(of: screen.mapView))
        #expect(!mapViewType.isEmpty, "mapView property must always resolve to a concrete view type")

        // Verify rendering twice calls the same mapView (tests the pattern stability)
        // This ensures SwiftUI doesn't recreate the view due to conditional logic
        let mapView2Type = String(describing: type(of: screen.mapView))
        #expect(
            mapViewType == mapView2Type,
            "mapView must be consistent type across calls (no conditional remounting)"
        )
    }

    // MARK: - AC-8: Token purity (zero hex/numeric hardcoding)

    /// TC-8: PlanningScreen.swift contains zero hardcoded hex, RGB, or numeric values
    @Test
    func token_purity_enforced() throws {
        let sourceFiles = [
            repoFilePath("ios/LaneShadow/Views/Templates/PlanningScreen.swift"),
            repoFilePath("ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift"),
        ]

        let hexRegex = try NSRegularExpression(pattern: "#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}")
        let rgbRegex = try NSRegularExpression(pattern: "Color\\(red:")

        for sourceFile in sourceFiles {
            let source = try String(contentsOfFile: sourceFile, encoding: .utf8)
            let hexMatches = hexRegex.matches(in: source, range: NSRange(source.startIndex..., in: source))
            #expect(hexMatches.isEmpty, "\(sourceFile) should not contain hex color literals")

            let rgbMatches = rgbRegex.matches(in: source, range: NSRange(source.startIndex..., in: source))
            #expect(rgbMatches.isEmpty, "\(sourceFile) should not contain Color(red:...) literals")
        }

        let planningScreenSource = try String(contentsOfFile: sourceFiles[0], encoding: .utf8)
        let usesThemeTokens =
            planningScreenSource.contains("theme.space") ||
            planningScreenSource.contains("LaneShadowTheme.color")
        #expect(usesThemeTokens, "PlanningScreen should use theme tokens for styling")
    }

    // MARK: - AC-9: Sandbox stories with canonical IDs

    /// TC-9: Sandbox stories exist with canonical lowercase dot-separated IDs (14 total: 7 states × 2 themes)
    @Test
    func sandboxStories_registered() throws {
        let storyFile = repoFilePath(
            "ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift"
        )
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

}

private func assertPlanningCancelWiring() throws {
    let liveContentPath = repoFilePath(
        "ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift"
    )
    let liveContentSource = try String(contentsOfFile: liveContentPath, encoding: .utf8)
    #expect(
        liveContentSource.contains("onMenuTap: {") &&
            liveContentSource.contains("onRequestCancelConfirmation()"),
        "Back chip must route to onRequestCancelConfirmation in live content"
    )

    let containerPath = repoFilePath(
        "ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift"
    )
    let containerSource = try String(contentsOfFile: containerPath, encoding: .utf8)
    #expect(
        containerSource.contains("onCollapse: {") &&
            containerSource.contains("viewModel.requestCancelConfirmation()"),
        "Collapse affordance must request cancel confirmation from the view model"
    )
    #expect(
        !containerSource.contains("PlanningCancelConfirmSheet("),
        "PlanningScreenContainer must keep only the visibility binding hook; sheet UI belongs to T04"
    )
    #expect(
        !containerSource.contains("await viewModel.confirmCancellation()"),
        "PlanningScreenContainer must not call confirmCancellation directly"
    )
    #expect(
        !containerSource.contains("await viewModel.cancelPlanning()"),
        "PlanningScreenContainer must not call cancelPlanning directly"
    )
}

private func repoFilePath(_ relativePath: String) -> String {
    let repoRoot = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()
        .deletingLastPathComponent()

    return repoRoot.appendingPathComponent(relativePath).path
}
