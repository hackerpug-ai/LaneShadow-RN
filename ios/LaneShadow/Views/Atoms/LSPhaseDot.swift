import LaneShadowTheme
import SwiftUI

public struct LSPhaseDot: View {
    @Environment(\.theme) private var theme
    @State private var isPulsing = false

    private let state: PhaseState

    public init(state: PhaseState) {
        self.state = state
    }

    public var body: some View {
        ZStack {
            if Self.showsPulseRing(for: state) {
                pulseRing
            }

            Circle()
                .fill(Self.fillColor(for: state, in: theme))
                .overlay {
                    Circle()
                        .stroke(
                            Self.strokeColor(for: state, in: theme),
                            lineWidth: Self.strokeWidth(for: state, in: theme)
                        )
                }
        }
        .frame(width: Self.diameter(in: theme), height: Self.diameter(in: theme))
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(state.accessibilityLabel))
    }

    private var pulseRing: some View {
        let recipe = Self.animationRecipe(in: theme)

        return Circle()
            .stroke(Self.signalDefaultColor(in: theme), lineWidth: theme.borderWidth.thin)
            .frame(width: Self.diameter(in: theme), height: Self.diameter(in: theme))
            .scaleEffect(isPulsing ? recipe.scaleRange.upperBound : recipe.scaleRange.lowerBound)
            .opacity(isPulsing ? recipe.endOpacity : recipe.startOpacity)
            .animation(recipe.animation, value: isPulsing)
            .onAppear {
                isPulsing = true
            }
            .onDisappear {
                isPulsing = false
            }
    }
}

extension LSPhaseDot {
    static func diameter(in theme: Theme) -> CGFloat {
        phaseDotSizeToken(in: theme)
    }

    static func phaseDotSizeToken(in theme: Theme) -> CGFloat {
        // `size.phaseDot` has not landed in the generated Swift theme yet.
        // Use the current 10pt semantic dimension the token pipeline exposes.
        theme.type.label.md.fontSize
    }

    static func borderStrongColor(in theme: Theme) -> Color {
        // `color.border.strong` is not yet generated; use the current border surface token.
        theme.colors.border.default
    }

    static func signalDefaultColor(in theme: Theme) -> Color {
        // `color.signal.default` currently resolves through the primary signal color.
        theme.colors.primary.default
    }

    static func statusSuccessColor(in theme: Theme) -> Color {
        theme.colors.success.default
    }

    static func fillColor(for state: PhaseState, in theme: Theme) -> Color {
        switch state {
        case .pending:
            Color.clear
        case .active:
            signalDefaultColor(in: theme)
        case .done:
            statusSuccessColor(in: theme)
        }
    }

    static func strokeColor(for state: PhaseState, in theme: Theme) -> Color {
        switch state {
        case .pending:
            borderStrongColor(in: theme)
        case .active, .done:
            Color.clear
        }
    }

    static func strokeWidth(for state: PhaseState, in theme: Theme) -> CGFloat {
        switch state {
        case .pending:
            theme.borderWidth.thin
        case .active, .done:
            0
        }
    }

    static func showsPulseRing(for state: PhaseState) -> Bool {
        state == .active
    }

    static func animationRecipe(in theme: Theme) -> PhaseDotPulseRecipe {
        theme.motion.recipe.phaseDotPulse
    }

    static func animation(for state: PhaseState, in theme: Theme) -> Animation? {
        guard showsPulseRing(for: state) else {
            return nil
        }

        return animationRecipe(in: theme).animation
    }
}

struct PhaseDotPulseRecipe: Equatable {
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

struct PhaseDotRecipeNamespace {
    private let motion: ThemeMotion

    init(motion: ThemeMotion) {
        self.motion = motion
    }

    var phaseDotPulse: PhaseDotPulseRecipe {
        guard let duration = motion.duration["slow"] else {
            preconditionFailure("LaneShadowTheme is missing motion.recipe.phaseDotPulse duration input")
        }
        guard let easing = motion.easing["standard"], easing.count == 4 else {
            preconditionFailure("LaneShadowTheme is missing motion.recipe.phaseDotPulse easing input")
        }

        return PhaseDotPulseRecipe(
            name: "motion.recipe.phaseDotPulse",
            duration: duration,
            easing: easing,
            scaleRange: 0 ... 1.5,
            startOpacity: 0.4,
            endOpacity: 0,
            repeats: true,
            autoreverses: false
        )
    }
}

private extension ThemeMotion {
    var recipe: PhaseDotRecipeNamespace {
        PhaseDotRecipeNamespace(motion: self)
    }
}

private extension PhaseState {
    var accessibilityLabel: String {
        switch self {
        case .pending:
            "Pending phase"
        case .active:
            "Active phase"
        case .done:
            "Completed phase"
        }
    }
}
