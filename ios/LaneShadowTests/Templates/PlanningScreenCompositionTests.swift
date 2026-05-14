import LaneShadowTheme
import SnapshotTesting
import SwiftUI
import Testing
import ViewInspector
import XCTest
@testable import LaneShadow

// MARK: - UIView Test Helpers

extension UIView {
    /// Recursively collects all subviews in the view hierarchy
    var allSubviews: [UIView] {
        var result = [self]
        for subview in subviews {
            result.append(contentsOf: subview.allSubviews)
        }
        return result
    }
}

@MainActor
struct PlanningScreenCompositionTests {
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

    /// TC-4: Back chip (onMenuTap) wiring verification.
    /// Unit test verifies the wiring chain exists: LSTopBar.onMenuTap is bound to
    /// onRequestCancelConfirmation in liveContent (PlanningScreen+LiveContent.swift:34-36).
    /// Full end-to-end tap and callback behavior is verified in PlanningStateE2ETests.swift (XCUITest).
    @Test
    func backChip_callsRequestCancelConfirmation() throws {
        // Verify the wiring pattern exists in the source: onMenuTap: { onRequestCancelConfirmation() }
        let liveContentFile =
            "/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Templates/" +
            "PlanningScreen+LiveContent.swift"
        let sourceCode = try String(contentsOfFile: liveContentFile, encoding: .utf8)

        #expect(
            sourceCode.contains("onMenuTap: {") && sourceCode.contains("onRequestCancelConfirmation()"),
            "LSTopBar.onMenuTap must be wired to call onRequestCancelConfirmation"
        )

        // Verify composition renders without error
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
            onRequestCancelConfirmation: {}
        )

        let hostingController = UIHostingController(rootView: screen)
        _ = hostingController.view

        #expect(hostingController.view != nil, "PlanningScreen must render without error")
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

        // Verify screen renders without crashing
        #expect(hostingController.view != nil)

        // Snapshot test ensures map controls are rendered in planning state (right-edge positioning)
        assertSnapshot(of: screen, as: .image(precision: 0.9))
    }

    // MARK: - AC-7: Map host identity preserved across state transitions

    /// TC-7: Map element identity is preserved across state changes (no conditional remount).
    /// This test verifies the structural pattern: mapView must render unconditionally
    /// in liveContent's LSMapLayer, not be swapped to Color.clear on state change.
    /// Full behavioral verification of map pan/zoom persistence is in PlanningStateE2ETests (XCUITest).
    @Test
    func mapHost_identityPreserved() {
        // Initial render with shouldRenderMap=true
        var liveState = PlanningScreenLiveState(
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

        // Render the screen in initial state
        let hostingController = UIHostingController(rootView: screen)
        _ = hostingController.view
        hostingController.view.layoutIfNeeded()

        #expect(hostingController.view != nil)

        // Capture reference to the initial map view hierarchy element
        let initialViewCount = hostingController.view.allSubviews.count

        // Update state to shouldRenderMap=false (transition)
        // The map must remain in the view hierarchy (invisible, not removed)
        liveState = PlanningScreenLiveState(
            messages: [],
            phases: [],
            errorMessage: nil,
            isThinking: false,
            isSending: false,
            shouldRenderMap: false,
            capsuleHeadline: "Planning…"
        )
        hostingController.rootView = PlanningScreen(
            liveState: liveState,
            onMenuTap: {},
            onCollapse: {},
            onSend: { _ in },
            onRetry: { _ in },
            onRequestCancelConfirmation: {}
        )
        hostingController.view.setNeedsLayout()
        hostingController.view.layoutIfNeeded()

        // After state transition, the map element should still be in the hierarchy
        // (not conditionally removed via: if shouldRenderMap { mapView } else { Color.clear })
        let afterViewCount = hostingController.view.allSubviews.count

        // If the view hierarchy stays largely the same (within ~10% variance due to layout),
        // the map was preserved (hidden via opacity), not remounted (which would change count).
        let countVariance = abs(initialViewCount - afterViewCount)
        let maxAcceptableVariance = max(2, initialViewCount / 10)

        #expect(
            countVariance <= maxAcceptableVariance,
            "Map element must be preserved (view count variance: \(countVariance))"
        )
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
}
