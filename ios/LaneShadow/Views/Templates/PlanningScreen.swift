import LaneShadowTheme
import SwiftUI

// MARK: - Animation Motion Extensions

extension Animation {
    /// Sketch polyline loop animation: 1400ms linear, repeating forever
    ///
    /// TOKEN GAP: Design specifies 1400ms, but tokens only provide up to 600ms ("deliberate").
    /// Using 1400ms as specified in design until tokens are updated.
    static func sketchPolylineLoop(theme: Theme) -> Animation {
        let duration: TimeInterval = 1.4 // 1400ms
        return Animation.linear(duration: duration).repeatForever(autoreverses: false)
    }

    /// Breathing head dot animation: 1400ms ease-in-out, autoreversing
    ///
    /// TOKEN GAP: Design specifies 1400ms, but tokens only provide up to 600ms ("deliberate").
    /// Using 1400ms as specified in design until tokens are updated.
    static func breathingHeadDot(theme: Theme) -> Animation {
        let duration: TimeInterval = 1.4 // 1400ms
        let easing = theme.motion.easing["standard"] ?? [0.4, 0.0, 0.2, 1.0]
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
        variant: String = "default",
        activePhase: Int = 2,
        onMenuTap: @escaping () -> Void = {}
    ) {
        self.provider = provider
        self.activePhase = activePhase
        state = provider.value(variant: variant)
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
            // Paper substrate with contour grid
            LSPaperMap(overlayStyle: .contours)

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

    // MARK: - Theme Tokens for Sketching Polyline

    private var sketchingLineWidth: CGFloat {
        // Use border thick token for sketching line width
        theme.borderWidth.thick
    }

    private var sketchingDashPattern: [CGFloat] {
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
                        lineWidth: theme.borderWidth.thick,
                        lineCap: .round,
                        lineJoin: .round,
                        dash: [theme.space.sm, theme.space.md],
                        dashPhase: isAnimating ? CGFloat(theme.space.xl) : 0
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

            // Breathing leading dot with recipe-driven animation
            let breathingRecipe = breathingDotAnimationRecipe(in: theme)
            Circle()
                .fill(theme.colors.primary.default)
                .frame(width: theme.type.label.sm.fontSize, height: theme.type.label.sm.fontSize)
                .shadow(color: theme.colors.primary.default.opacity(0.25), radius: theme.space.sm)
                .shadow(color: theme.colors.primary.default.opacity(0.4), radius: theme.space.md)
                .opacity(isAnimating ? breathingRecipe.endOpacity : breathingRecipe.startOpacity)
                .animation(Animation.breathingHeadDot(theme: theme), value: isAnimating)
                .position(
                    x: UIScreen.main.bounds.width / 2 - theme.space.xl * 2,
                    y: UIScreen.main.bounds.height / 2 - theme.space.md
                ) // Positioned along the polyline using theme tokens
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Motion Recipes

    private func sketchPolylineLoopAnimation(in theme: Theme) -> Animation {
        // Use 1400ms linear animation as specified in design
        // TOKEN GAP: Tokens only provide up to 600ms, design requires 1400ms
        Animation.sketchPolylineLoop(theme: theme)
    }

    private func breathingDotAnimationRecipe(in theme: Theme) -> BreathingDotRecipe {
        // Create breathing dot animation recipe from theme tokens
        // Uses 1400ms ease-in-out animation as specified in design
        // TOKEN GAP: Tokens only provide up to 600ms, design requires 1400ms
        let duration = 1400 // 1400ms as per design spec
        let easing = theme.motion.easing["standard"] ?? [0.4, 0, 0.2, 1]

        return BreathingDotRecipe(
            name: "motion.recipe.breathingHeadDot",
            duration: duration,
            easing: easing,
            scaleRange: 1.0 ... 1.0, // No scale change, only opacity
            startOpacity: 1.0,
            endOpacity: 0.55, // Breaths from 1.0 to 0.55
            repeats: true,
            autoreverses: true
        )
    }
}

// MARK: - Breathing Dot Animation Recipe

struct BreathingDotRecipe: Equatable {
    let name: String
    let duration: Int
    let easing: [Double]
    let scaleRange: ClosedRange<CGFloat>
    let startOpacity: Double
    let endOpacity: Double
    let repeats: Bool
    let autoreverses: Bool

    var animation: Animation {
        Animation
            .timingCurve(
                easing[0],
                easing[1],
                easing[2],
                easing[3],
                duration: Double(duration) / 1000
            )
            .repeatForever(autoreverses: autoreverses)
    }
}

// MARK: - Polyline Shape

struct PolylineShape: Shape {
    @Environment(\.theme) private var theme

    func path(in rect: CGRect) -> Path {
        var path = Path()

        // Use theme space tokens for semantic spacing
        let offsetLg = theme.space.lg * 2
        let offsetMd = theme.space.md * 2

        // Start point
        path.move(to: CGPoint(x: rect.midX - offsetLg, y: rect.midY - offsetMd))

        // Sketching polyline path
        path.addCurve(
            to: CGPoint(x: rect.midX - offsetMd, y: rect.midY - offsetLg - theme.space.sm),
            control1: CGPoint(x: rect.midX - offsetLg + theme.space.xs, y: rect.midY - offsetMd - theme.space.sm),
            control2: CGPoint(x: rect.midX - offsetMd - theme.space.xs, y: rect.midY - offsetLg - theme.space.sm)
        )

        path.addCurve(
            to: CGPoint(x: rect.midX + theme.space.md, y: rect.midY - offsetMd + theme.space.sm),
            control1: CGPoint(x: rect.midX, y: rect.midY - offsetLg),
            control2: CGPoint(x: rect.midX + theme.space.sm, y: rect.midY - offsetMd)
        )

        path.addCurve(
            to: CGPoint(x: rect.midX + offsetMd + theme.space.sm, y: rect.midY),
            control1: CGPoint(x: rect.midX + offsetMd, y: rect.midY - theme.space.md),
            control2: CGPoint(x: rect.midX + offsetLg, y: rect.midY - theme.space.sm)
        )

        return path
    }
}
