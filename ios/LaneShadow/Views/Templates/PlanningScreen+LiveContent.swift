import LaneShadowTheme
import SwiftUI

// MARK: - Live Content Rendering (planning state with real view model)

extension PlanningScreen {
    /// Renders the planning state composition with capsule + indicator overlay + map controls
    func liveContent(for liveState: PlanningScreenLiveState) -> some View {
        ZStack(alignment: .trailing) {
            LSMapLayer(
                map: {
                    resolvedLiveMapView
                },
                topOverlays: [
                    GlassOverlaySlot(
                        id: "context-capsule",
                        content: { liveCapsuleView(for: liveState) }
                    ),
                    GlassOverlaySlot(
                        id: "phase-indicator",
                        content: { livePhaseIndicatorView(for: liveState) }
                    ),
                ],
                bottomOverlays: liveBottomOverlays(for: liveState),
                topBar: {
                    LSTopBar(
                        trailing: LSTopBarTrailing.none,
                        onMenuTap: {
                            onRequestCancelConfirmation()
                        },
                        onNewTap: {}
                    )
                }
            )
            .accessibilityIdentifier("planningscreen")

            // Map controls positioned at vertical center of right edge (planning state config)
            VStack {
                Spacer()
                mapControlsView
                Spacer()
            }
            .padding(.trailing, theme.space.md)
        }
    }

    /// Map controls workbar for planning state (recenter + mode toggle)
    var mapControlsView: some View {
        LSMapControls(
            mode: liveMapControlsConfiguration.mode,
            hasRouteToSave: false,
            isSavedRoute: false,
            onZoomIn: liveMapControlsConfiguration.onZoomIn,
            onZoomOut: liveMapControlsConfiguration.onZoomOut,
            onRecenter: liveMapControlsConfiguration.onRecenter,
            onLayers: liveMapControlsConfiguration.onLayers,
            onToggleView: liveMapControlsConfiguration.onToggleView
        )
        .accessibilityIdentifier("planningscreen-controls")
    }

    func liveBottomOverlays(for liveState: PlanningScreenLiveState) -> [GlassOverlaySlot] {
        var overlays = [
            GlassOverlaySlot(
                id: "chat-input",
                content: { liveBottomOverlay(for: liveState) }
            ),
        ]

        if liveMapControlsConfiguration.layersVisible {
            overlays.insert(
                GlassOverlaySlot(
                    id: "sketch",
                    content: { liveSketchOverlay }
                ),
                at: 0
            )
        }

        return overlays
    }

    /// Context capsule showing planning state headline
    func liveCapsuleView(for liveState: PlanningScreenLiveState) -> some View {
        LSContextCapsule(
            state: .planning(headline: liveState.capsuleHeadline)
        )
        .accessibilityIdentifier("planningscreen-context-capsule")
    }

    /// Phase indicator with optional error banner below
    func livePhaseIndicatorView(for liveState: PlanningScreenLiveState) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            LSPhaseIndicator(
                phases: liveState.phases,
                header: liveState.capsuleHeadline,
                showWarningChrome: liveState.errorMessage != nil
            )
            .accessibilityIdentifier("planningscreen-phase-indicator")

            if let errorMessage = liveState.errorMessage {
                liveErrorBanner(errorMessage)
            }
        }
        .padding(.top, theme.space.xxxl)
    }

    /// Bottom overlay: chat transcript + chat input (locked when thinking)
    func liveBottomOverlay(for liveState: PlanningScreenLiveState) -> some View {
        VStack(alignment: .leading, spacing: theme.space.md) {
            LSChatTranscript(
                messages: liveState.messages,
                isTyping: liveState.isThinking || liveState.isSending,
                onRetry: onRetry
            )
            .accessibilityIdentifier("planningscreen-transcript")

            LSChatInput(
                value: $chatInputValue,
                placeholder: "Refine your ride…",
                onSend: onSend,
                onCollapse: onCollapse,
                onFilter: {},
                isThinking: liveState.isThinking,
                isEnabled: !liveState.isThinking
            )
            .accessibilityIdentifier("planningscreen-chat-input")
        }
        .padding(.horizontal, theme.space.md)
        .padding(.bottom, theme.space.md)
    }

    var liveSketchOverlay: some View {
        MapSketchAnimationLayer(pathPoints: liveState?.sketchPathPoints ?? [])
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .accessibilityIdentifier("planningscreen-sketch-polyline")
    }

    /// Inline error banner (red border card)
    func liveErrorBanner(_ message: String) -> some View {
        Text(message)
            .font(theme.type.body.sm.font)
            .foregroundStyle(LaneShadowTheme.color.content.primary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(theme.space.md)
            .background(LaneShadowTheme.color.surface.card)
            .overlay(
                RoundedRectangle(cornerRadius: theme.radius.lg)
                    .stroke(
                        LaneShadowTheme.color.status.warning.default,
                        lineWidth: theme.borderWidth.thin
                    )
            )
            .padding(.bottom, theme.space.sm)
            .accessibilityIdentifier("planningscreen-inline-error")
    }
}
