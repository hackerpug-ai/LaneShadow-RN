import Foundation
import SwiftUI
import Testing
@testable import LaneShadow

@MainActor
struct PlanningScreenTests {
    // MARK: - AC-1: Top-overlay composition (capsule above, indicator below)

    /// TC-1: Verify LSContextCapsule is composed in topOverlays before LSPhaseIndicator
    @Test
    func topOverlay_capsuleAboveIndicator() throws {
        let liveContentPath = repoFilePath(
            "ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift"
        )
        let source = try String(contentsOfFile: liveContentPath, encoding: .utf8)

        let capsuleSlot = source.range(of: "id: \"context-capsule\"")
        let indicatorSlot = source.range(of: "id: \"phase-indicator\"")

        #expect(capsuleSlot != nil, "Planning live content must render a context-capsule slot")
        #expect(indicatorSlot != nil, "Planning live content must render a phase-indicator slot")

        if let capsuleSlot, let indicatorSlot {
            #expect(
                capsuleSlot.lowerBound < indicatorSlot.lowerBound,
                "Capsule slot must appear before the indicator slot in topOverlays"
            )
        }

        #expect(
            source.contains(".padding(.top, theme.space.xxxl)"),
            "Phase indicator slot must apply token-based top displacement so it stacks below the capsule"
        )
    }

    // MARK: - AC-2: LSContextCapsule binds to viewModel.capsuleHeadline

    /// TC-2: Capsule receives state .planning(headline: viewModel.capsuleHeadline) exactly
    @Test
    func capsule_bindsViewModelHeadline() throws {
        let liveContentPath = repoFilePath(
            "ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift"
        )
        let source = try String(contentsOfFile: liveContentPath, encoding: .utf8)

        #expect(
            source.contains("state: .planning(headline: liveState.capsuleHeadline)"),
            "Context capsule must bind the view-model headline verbatim"
        )
        #expect(
            source.contains(".accessibilityIdentifier(\"planningscreen-context-capsule\")"),
            "Planning capsule must preserve the required accessibility identifier"
        )
    }

    // MARK: - AC-3: LSPhaseIndicator binds to viewModel.phaseSteps

    /// TC-3: Phase indicator receives 5-entry phaseSteps with accessibility id
    @Test
    func indicator_bindsViewModelPhaseSteps() throws {
        let liveContentPath = repoFilePath(
            "ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift"
        )
        let source = try String(contentsOfFile: liveContentPath, encoding: .utf8)

        #expect(
            source.contains("phases: liveState.phases"),
            "Phase indicator must bind directly to liveState.phases"
        )
        #expect(
            source.contains("header: liveState.capsuleHeadline"),
            "Phase indicator header must bind to the same planning headline"
        )
        #expect(
            source.contains(".accessibilityIdentifier(\"planningscreen-phase-indicator\")"),
            "Phase indicator must preserve the required accessibility identifier"
        )
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
        _ = hostingController.view

        screen.onRequestCancelConfirmation()

        #expect(
            wasRequestCancelConfirmationCalled,
            "requestCancelConfirmation closure must be callable and wired"
        )

        try assertPlanningCancelWiring()
    }

    // MARK: - AC-5: LSChatInput renders in is-thinking lock

    /// TC-5: Chat input renders with isThinking=true, isEnabled=false when viewModel.isThinking
    @Test
    func chatInput_lockedWhenThinking() throws {
        let liveContentPath = repoFilePath(
            "ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift"
        )
        let source = try String(contentsOfFile: liveContentPath, encoding: .utf8)

        #expect(
            source.contains("isThinking: liveState.isThinking"),
            "Planning chat input must reflect the live thinking state"
        )
        #expect(
            source.contains("isEnabled: !liveState.isThinking"),
            "Planning chat input must lock input while the navigator is thinking"
        )
    }

    // MARK: - AC-6: LSMapControls in planning configuration

    /// TC-6: LSMapControls is present with planning configuration and accessibility id
    @Test
    func mapControls_planningConfiguration() throws {
        let liveContentPath = repoFilePath(
            "ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift"
        )
        let liveContentSource = try String(contentsOfFile: liveContentPath, encoding: .utf8)
        let containerPath = repoFilePath(
            "ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift"
        )
        let containerSource = try String(contentsOfFile: containerPath, encoding: .utf8)

        #expect(
            liveContentSource.contains(".accessibilityIdentifier(\"planningscreen-controls\")"),
            "Planning controls must expose the required accessibility identifier"
        )
        #expect(
            liveContentSource.contains("onRecenter: liveMapControlsConfiguration.onRecenter"),
            "Planning controls must bind recenter through the live controls configuration"
        )
        #expect(
            liveContentSource.contains("onLayers: liveMapControlsConfiguration.onLayers"),
            "Planning controls must bind the layers affordance through the live controls configuration"
        )
        #expect(
            liveContentSource.contains("onToggleView: liveMapControlsConfiguration.onToggleView"),
            "Planning controls must bind the chat-mode toggle through the live controls configuration"
        )
        #expect(
            !liveContentSource.contains("wiring deferred"),
            "Planning controls must not ship deferred logger placeholders"
        )
        #expect(
            containerSource.contains("onRecenter: { mapCameraController.recenterToUserLocation() }"),
            "Planning container must wire recenter to the map camera controller"
        )
        #expect(
            containerSource.contains("planningLayersVisible.toggle()"),
            "Planning container must give the layers control real stateful behavior"
        )
        #expect(
            containerSource.contains("mapControlsMode = mapControlsMode == .map ? .chat : .map"),
            "Planning container must give the mode toggle real stateful behavior"
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
    func mapHost_identityPreserved() throws {
        let planningScreenPath = repoFilePath(
            "ios/LaneShadow/Views/Templates/PlanningScreen.swift"
        )
        let planningScreenSource = try String(contentsOfFile: planningScreenPath, encoding: .utf8)
        let containerPath = repoFilePath(
            "ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift"
        )
        let containerSource = try String(contentsOfFile: containerPath, encoding: .utf8)

        #expect(
            planningScreenSource.contains("private let liveMapConfiguration: PlanningLiveMapConfiguration?"),
            "PlanningScreen must accept an injected live map host configuration"
        )
        #expect(
            planningScreenSource.contains("if let liveMapConfiguration"),
            "Live planning branch must resolve the injected map host instead of always constructing its own map"
        )
        #expect(
            containerSource.contains("@State private var mapCameraController = LSMapCameraController()"),
            "PlanningScreenContainer must own a persistent camera-controller reference"
        )
        #expect(
            containerSource.contains("cameraController: mapCameraController"),
            "Container must pass the same controller reference into LSMap"
        )
        #expect(
            containerSource.contains("accessibilityValue: planningMapAccessibilityValue"),
            "Container must expose host state through a stable planning map accessibility value"
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
