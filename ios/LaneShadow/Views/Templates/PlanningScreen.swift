import LaneShadowTheme
import os
import SwiftUI

// MARK: - Animation Motion Extensions

extension Animation {
    /// Sketch polyline loop animation: reads from motion.recipe.sketchPolylineLoop token
    /// - Duration: 1400ms (from token)
    /// - Easing: linear (from token)
    /// - Repeat: forever (from token)
    static func sketchPolylineLoop(theme: Theme) -> Animation {
        let duration = TimeInterval(theme.motion.recipes["sketchPolylineLoop"]?.duration ?? 1400) / 1000
        return Animation.linear(duration: duration).repeatForever(autoreverses: false)
    }

    /// Breathing head dot animation: reads from motion.recipe.breathingHeadDot token
    /// - Duration: 1400ms (from token)
    /// - Easing: ease-in-out (from token)
    /// - Repeat: forever with autoreverse (from token)
    static func breathingHeadDot(theme: Theme) -> Animation {
        let recipe = theme.motion.recipes["breathingHeadDot"]
        let duration = TimeInterval(recipe?.duration ?? 1400) / 1000
        let easing = safeCubicBezierEasing(recipe?.easing ?? [])
        return Animation.timingCurve(
            easing[0],
            easing[1],
            easing[2],
            easing[3],
            duration: duration
        ).repeatForever(autoreverses: true)
    }
}

/// PlanningScreen — the thinking-state Navigator screen.
///
/// Composes `LSMapLayer`, `LSTopBar`, `LSPhaseIndicator`, parsing polyline animation,
/// and `LSChatInput` (disabled, with spinner) sourced from `PlanningMockProvider`.
public struct PlanningScreen: View {
    @Environment(\.theme) private var theme

    private let provider: PlanningMockProvider.Type
    private let activePhase: Int
    private let state: PlanningScreenState
    private let liveState: PlanningScreenLiveState?

    @State private var chatInputValue: String = ""
    private let onMenuTap: () -> Void
    private let onCollapse: () -> Void
    private let onSend: (String) -> Void
    private let onRetry: (String) -> Void
    private let onRequestCancelConfirmation: () -> Void

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
        self.onMenuTap = onMenuTap
        onCollapse = {}
        onSend = { _ in }
        onRetry = { _ in }
        onRequestCancelConfirmation = {}
    }

    init(
        liveState: PlanningScreenLiveState,
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
                            trailing: .none,
                            onMenuTap: onMenuTap,
                            onNewTap: {}
                        )
                    }
                )
                .accessibilityIdentifier("planningscreen")
                .opacity(state.showCancelConfirm ? theme.opacity.disabled : 1.0) // V02: Dim phase card

                // V02: Cancel confirm overlay
                if state.showCancelConfirm {
                    // Scrim
                    LSScrim(blocking: true)
                        .ignoresSafeArea()
                        .accessibilityIdentifier("planningscreen-scrim")

                    // Cancel confirm sheet (inline implementation since LSCancelConfirmSheet is not in project)
                    VStack {
                        Spacer()

                        VStack(spacing: theme.space.md) {
                            // Title
                            Text("Cancel this plan?")
                                .font(theme.type.opinion.lg.font)
                                .foregroundStyle(LaneShadowTheme.color.content.primary)
                                .frame(maxWidth: .infinity, alignment: .leading)

                            // Body
                            Text("I've drawn one route already. You can back out now — but I'll toss what I have.")
                                .font(theme.type.opinion.sm.font)
                                .italic()
                                .foregroundStyle(LaneShadowTheme.color.content.secondary)
                                .frame(maxWidth: .infinity, alignment: .leading)

                            // Actions
                            HStack(spacing: theme.space.md) {
                                // Keep button (tertiary)
                                Button(action: {}) {
                                    Text("Keep thinking")
                                        .font(theme.type.title.sm.font)
                                        .foregroundStyle(LaneShadowTheme.color.content.secondary)
                                        .frame(maxWidth: .infinity)
                                        .frame(height: theme.space.xxl + theme.space.md)
                                        .background(
                                            RoundedRectangle(cornerRadius: theme.radius.lg)
                                                .strokeBorder(
                                                    LaneShadowTheme.color.border.default,
                                                    lineWidth: theme.borderWidth.hairline
                                                )
                                        )
                                }
                                .accessibilityIdentifier("cancel-confirm-keep")

                                // Cancel button (signal)
                                Button(action: {}) {
                                    Text("Cancel plan")
                                        .font(theme.type.title.sm.font)
                                        .foregroundStyle(LaneShadowTheme.color.content.primary)
                                        .frame(maxWidth: .infinity)
                                        .frame(height: theme.space.xxl + theme.space.md)
                                        .background(
                                            RoundedRectangle(cornerRadius: theme.radius.lg)
                                                .fill(LaneShadowTheme.color.surface.inset)
                                        )
                                }
                                .accessibilityIdentifier("cancel-confirm-cancel")
                            }
                        }
                        .padding(theme.space.lg)
                        .background(
                            RoundedRectangle(cornerRadius: theme.radius.xl)
                                .fill(LaneShadowTheme.color.surface.card)
                        )
                        .shadow(
                            color: theme.elevation.level1.shadowColor,
                            radius: theme.elevation.level1.radius,
                            x: theme.elevation.level1.offsetX,
                            y: theme.elevation.level1.offsetY
                        )
                        .padding(.horizontal, theme.space.md)
                        .accessibilityIdentifier("planningscreen-cancel-confirm")

                        Spacer()
                            .frame(height: theme.space.xl * 2) // Position from bottom
                    }
                }
            }
        }
    }

    // MARK: - Map

    private var mapView: some View {
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

    private static let defaultCamera = CameraPosition(
        center: LatLng(lat: 37.7749, lon: -122.4194),
        zoom: 12
    )

    // MARK: - Parsing Polyline

    private var parsingPolyline: some View {
        SketchingPolyline()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .accessibilityIdentifier("planningscreen-sketch-polyline")
    }

    // MARK: - Theme Tokens for Parsing Polyline

    private var parsingLineWidth: CGFloat {
        // Use border thick token for parsing line width
        theme.borderWidth.thick
    }

    private var parsingDashPattern: [CGFloat] {
        // Dash pattern: [dash length, gap length]
        // Use space tokens for semantic dash pattern
        [theme.space.sm, theme.space.md]
    }

    private var breathingDotSize: CGFloat {
        // Use label small font size as semantic dimension for dot
        theme.type.label.sm.fontSize
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

    private func liveContent(for liveState: PlanningScreenLiveState) -> some View {
        ZStack(alignment: .trailing) {
            LSMapLayer(
                map: {
                    mapView
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
                bottomOverlays: [
                    GlassOverlaySlot(
                        id: "chat-input",
                        content: { liveBottomOverlay(for: liveState) }
                    ),
                ],
                topBar: {
                    LSTopBar(
                        trailing: .none,
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

    private var mapControlsView: some View {
        LSMapControls(
            mode: .map,
            hasRouteToSave: false,
            isSavedRoute: false,
            onRecenter: {
                Logger().info("[PLAN-S08-IOS-T02] Recenter in planning mode — wiring to camera controller deferred to PLAN-S08-IOS-T04")
            },
            onToggleView: {
                Logger().info("[PLAN-S08-IOS-T02] Toggle mode (planning→idle) — wiring deferred to PLAN-S08-IOS-T04")
            }
        )
        .accessibilityIdentifier("planningscreen-controls")
    }

    private func liveCapsuleView(for liveState: PlanningScreenLiveState) -> some View {
        LSContextCapsule(
            state: .planning(headline: liveState.capsuleHeadline)
        )
        .accessibilityIdentifier("planningscreen-context-capsule")
    }

    private func livePhaseIndicatorView(for liveState: PlanningScreenLiveState) -> some View {
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
    }

    private func liveBottomOverlay(for liveState: PlanningScreenLiveState) -> some View {
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

    private func liveErrorBanner(_ message: String) -> some View {
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

