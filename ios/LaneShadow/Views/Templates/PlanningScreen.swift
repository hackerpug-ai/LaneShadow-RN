import LaneShadowTheme
import SwiftUI

/// PlanningScreen — the thinking-state Navigator screen.
///
/// Composes `LSMapLayer`, `LSTopBar`, `LSPhaseIndicator`, sketching polyline animation,
/// and `LSChatInput` (disabled, with spinner) sourced from `PlanningMockProvider`.
public struct PlanningScreen: View {
    @Environment(\.theme) private var theme

    private let provider: PlanningMockProvider.Type
    private let activePhase: Int
    private let state: PlanningScreenState

    @State private var chatInputValue: String = ""
    private let onMenuTap: () -> Void

    public init(
        provider: PlanningMockProvider.Type = PlanningMockProvider.self,
        activePhase: Int = 2,
        onMenuTap: @escaping () -> Void = {}
    ) {
        self.provider = provider
        self.activePhase = activePhase
        state = provider.value(variant: "default")
        self.onMenuTap = onMenuTap
    }

    public var body: some View {
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
    }

    // MARK: - Map

    private var mapView: some View {
        ZStack {
            // Placeholder map background
            LinearGradient(
                gradient: Gradient(colors: [
                    theme.colors.surface.default,
                    theme.colors.background.default,
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Sketching polyline animation
            sketchingPolyline
        }
        .accessibilityIdentifier("planningscreen-map")
    }

    // MARK: - Sketching Polyline

    private var sketchingPolyline: some View {
        SketchingPolyline()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .accessibilityIdentifier("planningscreen-sketch-polyline")
    }

    // MARK: - Phase Indicator

    private var phaseIndicatorView: some View {
        LSPhaseIndicator(
            phases: convertedPhases,
            header: phaseHeader
        )
        .accessibilityIdentifier("planningscreen-phase-indicator")
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
            onSend: { _ in },
            onCollapse: {},
            onFilter: {},
            isThinking: state.isThinking,
            isEnabled: !state.isThinking
        )
        .accessibilityIdentifier("planningscreen-chat-input")
    }
}

// MARK: - Sketching Polyline View

struct SketchingPolyline: View {
    @Environment(\.theme) private var theme
    @State private var isAnimating = false

    var body: some View {
        ZStack {
            // Animated dashed polyline
            PolylineShape()
                .stroke(
                    theme.colors.primary.default,
                    style: StrokeStyle(
                        lineWidth: 2.5,
                        lineCap: .round,
                        lineJoin: .round,
                        dash: [5, 8],
                        dashPhase: isAnimating ? -52 : 0
                    )
                )
                .animation(
                    sketchPolylineLoopAnimation(in: theme),
                    value: isAnimating
                )
                .onAppear {
                    isAnimating = true
                }
                .opacity(0.85)

            // Breathing leading dot
            Circle()
                .fill(theme.colors.primary.default)
                .frame(width: 9, height: 9)
                .shadow(color: theme.colors.primary.default.opacity(0.25), radius: 3)
                .shadow(color: theme.colors.primary.default.opacity(0.4), radius: 5)
                .scaleEffect(isAnimating ? 1.25 : 1.0)
                .opacity(isAnimating ? 0.75 : 1.0)
                .animation(
                    Animation
                        .easeInOut(duration: 1.4)
                        .repeatForever(autoreverses: true),
                    value: isAnimating
                )
                .position(x: 200, y: 250) // Positioned along the polyline
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func sketchPolylineLoopAnimation(in theme: Theme) -> Animation {
        // Reference motion.recipe.sketchPolylineLoop
        // Uses "deliberate" duration (600ms) and linear easing
        let duration = theme.motion.duration["deliberate"] ?? 600
        let easing = theme.motion.easing["linear"] ?? [0.0, 0.0, 1.0, 1.0]

        return Animation
            .timingCurve(
                easing[0],
                easing[1],
                easing[2],
                easing[3],
                duration: Double(duration) / 1000
            )
            .repeatForever(autoreverses: false)
    }

    private var sketchDuration: TimeInterval {
        Double(theme.motion.duration["deliberate"] ?? 600) / 1000
    }

    private var sketchEasing: [Double] {
        theme.motion.easing["linear"] ?? [0.0, 0.0, 1.0, 1.0]
    }
}

// MARK: - Polyline Shape

struct PolylineShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()

        // Start point
        path.move(to: CGPoint(x: rect.midX - 80, y: rect.midY - 40))

        // Sketching polyline path
        path.addCurve(
            to: CGPoint(x: rect.midX - 40, y: rect.midY - 60),
            control1: CGPoint(x: rect.midX - 70, y: rect.midY - 50),
            control2: CGPoint(x: rect.midX - 50, y: rect.midY - 60)
        )

        path.addCurve(
            to: CGPoint(x: rect.midX + 20, y: rect.midY - 30),
            control1: CGPoint(x: rect.midX, y: rect.midY - 50),
            control2: CGPoint(x: rect.midX + 10, y: rect.midY - 40)
        )

        path.addCurve(
            to: CGPoint(x: rect.midX + 60, y: rect.midY),
            control1: CGPoint(x: rect.midX + 40, y: rect.midY - 20),
            control2: CGPoint(x: rect.midX + 50, y: rect.midY - 10)
        )

        return path
    }
}
