import LaneShadowTheme
import os
import SwiftUI

/// PlanningScreen — the thinking-state Navigator screen.
///
/// Composes `LSMapLayer`, `LSTopBar`, `LSPhaseIndicator`, parsing polyline animation,
/// and `LSChatInput` (disabled, with spinner) sourced from `PlanningMockProvider`.
public struct PlanningScreen: View {
    @Environment(\.theme) var theme

    private let provider: PlanningMockProvider.Type
    private let activePhase: Int
    private let state: PlanningScreenState
    let liveState: PlanningScreenLiveState?
    let liveMapConfiguration: PlanningLiveMapConfiguration?
    let liveMapControlsConfiguration: PlanningMapControlsConfiguration

    @State var chatInputValue: String = ""
    private let onMenuTap: () -> Void
    let onCollapse: () -> Void
    let onSend: (String) -> Void
    let onRetry: (String) -> Void
    let onRequestCancelConfirmation: () -> Void

    public init(
        provider: PlanningMockProvider.Type = PlanningMockProvider.self,
        variant: String = "default",
        activePhase: Int = 2,
        onMenuTap: @escaping () -> Void = {}
    ) {
        self.provider = provider
        self.activePhase = activePhase
        state = provider.value(variant: variant)
        liveState = nil
        liveMapConfiguration = nil
        liveMapControlsConfiguration = .disabled
        self.onMenuTap = onMenuTap
        onCollapse = {}
        onSend = { _ in }
        onRetry = { _ in }
        onRequestCancelConfirmation = {}
    }

    init(
        liveState: PlanningScreenLiveState,
        liveMapConfiguration: PlanningLiveMapConfiguration? = nil,
        liveMapControlsConfiguration: PlanningMapControlsConfiguration = .disabled,
        onMenuTap: @escaping () -> Void = {},
        onCollapse: @escaping () -> Void = {},
        onSend: @escaping (String) -> Void = { _ in },
        onRetry: @escaping (String) -> Void = { _ in },
        onRequestCancelConfirmation: @escaping () -> Void = {}
    ) {
        provider = PlanningMockProvider.self
        activePhase = 1
        state = PlanningMockProvider.value(variant: "default")
        self.liveState = liveState
        self.liveMapConfiguration = liveMapConfiguration
        self.liveMapControlsConfiguration = liveMapControlsConfiguration
        self.onMenuTap = onMenuTap
        self.onCollapse = onCollapse
        self.onSend = onSend
        self.onRetry = onRetry
        self.onRequestCancelConfirmation = onRequestCancelConfirmation
    }

    public var body: some View {
        if let liveState {
            liveContent(for: liveState)
        } else {
            ZStack {
                // Main content
                LSMapLayer(
                    map: {
                        mapView
                    },
                    topOverlays: [
                        GlassOverlaySlot(
                            id: "phase-indicator",
                            content: { phaseIndicatorView }
                        ),
                    ],
                    bottomOverlays: [
                        GlassOverlaySlot(
                            id: "chat-input",
                            content: { chatInputView }
                        ),
                    ],
                    topBar: {
                        LSTopBar(
                            trailing: LSTopBarTrailing.none,
                            onMenuTap: onMenuTap,
                            onNewTap: {}
                        )
                    }
                )
                .accessibilityIdentifier("planningscreen")
                .opacity(state.showCancelConfirm ? theme.opacity.disabled : 1.0) // V02: Dim phase card

                // V02: Cancel confirm overlay
                if state.showCancelConfirm {
                    cancelConfirmOverlay
                }
            }
        }
    }

    // MARK: - Map

    var mapView: some View {
        ZStack {
            LSMap(
                mode: .preview,
                camera: Self.defaultCamera,
                polylines: [],
                annotations: []
            )

            // Parsing polyline animation
            parsingPolyline
        }
        .accessibilityIdentifier("planningscreen-map")
    }

    static let defaultCamera = CameraPosition(
        center: LatLng(lat: 37.7749, lon: -122.4194),
        zoom: 12
    )

    @ViewBuilder
    var resolvedLiveMapView: some View {
        if let liveMapConfiguration {
            liveMapConfiguration.content
                .accessibilityIdentifier("planningscreen-map")
                .accessibilityLabel("Planning map camera state")
                .accessibilityValue(liveMapConfiguration.accessibilityValue)
        } else {
            mapView
        }
    }

    // MARK: - Parsing Polyline

    private var parsingPolyline: some View {
        MapSketchAnimationLayer(pathPoints: PlanningViewModel.defaultSketchPathPoints)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .accessibilityIdentifier("planningscreen-sketch-polyline")
    }

    // MARK: - Phase Indicator

    private var phaseIndicatorView: some View {
        VStack(alignment: .leading, spacing: 0) {
            LSPhaseIndicator(
                phases: convertedPhases,
                header: phaseHeader,
                showWarningChrome: state.showWarningChrome // V03: Show warning chrome
            )
            .accessibilityIdentifier("planningscreen-phase-indicator")

            // V01: Slow planning apology note
            if state.showSlowApology, let apology = state.message.detail {
                Text(apology)
                    .font(theme.type.opinion.sm.font)
                    .italic()
                    .foregroundStyle(LaneShadowTheme.color.content.tertiary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, theme.space.md)
                    .padding(.horizontal, theme.space.sm)
                    .overlay(
                        Rectangle()
                            .frame(height: theme.borderWidth.thin)
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [LaneShadowTheme.color.border.default, Color.clear],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .offset(y: -theme.space.md)
                            .frame(maxWidth: .infinity, alignment: .top)
                            .padding(.top, theme.space.sm)
                    )
                    .accessibilityIdentifier("planningscreen-slow-apology")
            }
        }
    }

    private var phaseHeader: String {
        switch activePhase {
        case 1:
            "Let me think on that…"
        case 2:
            "Three loops are forming…"
        case 3:
            "Sun on one leg, wind on another…"
        case 4:
            "Ranking by scenic + twist…"
        case 5:
            "Picking the best three"
        default:
            "Let me think on that…"
        }
    }

    private var convertedPhases: [LSPhaseIndicator.Phase] {
        state.phases.enumerated().map { index, phase in
            let phaseNumber = index + 1
            let state: PhaseState = if phaseNumber < activePhase {
                .done
            } else if phaseNumber == activePhase {
                .active
            } else {
                .pending
            }
            return LSPhaseIndicator.Phase(
                id: phase.id,
                label: phase.label,
                state: state
            )
        }
    }

    // MARK: - Chat Input

    private var chatInputView: some View {
        LSChatInput(
            value: $chatInputValue,
            placeholder: state.message.body,
            onSend: onSend,
            onCollapse: {},
            onFilter: {},
            isThinking: state.isThinking,
            isEnabled: !state.isThinking
        )
        .accessibilityIdentifier("planningscreen-chat-input")
    }
}

@MainActor
struct PlanningLiveMapConfiguration {
    let content: AnyView
    let accessibilityValue: String

    init<Content: View>(
        accessibilityValue: String,
        @ViewBuilder content: () -> Content
    ) {
        self.content = AnyView(content())
        self.accessibilityValue = accessibilityValue
    }
}

@MainActor
struct PlanningMapControlsConfiguration {
    let mode: LSMapControlsMode
    let layersVisible: Bool
    let onZoomIn: (() -> Void)?
    let onZoomOut: (() -> Void)?
    let onRecenter: (() -> Void)?
    let onLayers: (() -> Void)?
    let onToggleView: (() -> Void)?

    static let disabled = PlanningMapControlsConfiguration(
        mode: .map,
        layersVisible: true,
        onZoomIn: nil,
        onZoomOut: nil,
        onRecenter: nil,
        onLayers: nil,
        onToggleView: nil
    )
}
