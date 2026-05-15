import LaneShadowTheme
import SwiftUI

// MARK: - Sketching Polyline View

struct SketchingPolyline: View {
    @Environment(\.theme) private var theme
    @State private var isAnimating = false

    var body: some View {
        GeometryReader { geometry in
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
                    // Sketch polyline visual opacity (animation component, not interactive state)
                    // Using opacity.90 token as closest semantic value to design-specified 0.85
                    .opacity(theme.opacity.values["90"] ?? 0.9)

                // Breathing leading dot with recipe-driven animation
                let breathingRecipe = breathingDotAnimationRecipe(in: theme)
                let shadowOpacitySoft = theme.opacity.values["25"] ?? 0.25
                let shadowOpacityMedium = theme.opacity.values["40"] ?? 0.4
                Circle()
                    .fill(theme.colors.primary.default)
                    .frame(width: theme.type.label.sm.fontSize, height: theme.type.label.sm.fontSize)
                    .shadow(color: theme.colors.primary.default.opacity(shadowOpacitySoft), radius: theme.space.sm)
                    .shadow(color: theme.colors.primary.default.opacity(shadowOpacityMedium), radius: theme.space.md)
                    .opacity(isAnimating ? breathingRecipe.endOpacity : breathingRecipe.startOpacity)
                    .animation(Animation.breathingHeadDot(theme: theme), value: isAnimating)
                    .position(
                        x: geometry.size.width / 2 - theme.space.xl * 2,
                        y: geometry.size.height / 2 - theme.space.md
                    ) // Positioned along the polyline using geometry proxy + theme tokens
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    // MARK: - Motion Recipes

    private func sketchPolylineLoopAnimation(in theme: Theme) -> Animation {
        // Reads from motion.recipe.sketchPolylineLoop token
        Animation.sketchPolylineLoop(theme: theme)
    }

    private func breathingDotAnimationRecipe(in theme: Theme) -> BreathingDotRecipe {
        // Reads from motion.recipe.breathingHeadDot token
        let recipe = theme.motion.recipes["breathingHeadDot"]
        let duration = recipe?.duration ?? 1400
        let easing = recipe?.easing ?? [0.4, 0, 0.2, 1]
        let endOpacity = theme.opacity.values["50"] ?? 0.5

        return BreathingDotRecipe(
            name: "motion.recipe.breathingHeadDot",
            duration: duration,
            easing: easing,
            scaleRange: 1.0 ... 1.0, // No scale change, only opacity
            startOpacity: 1.0,
            endOpacity: endOpacity, // Breaths from 1.0 to configured opacity
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
        let easing = safeCubicBezierEasing(easing)
        return Animation
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

/// Helper to safely extract cubic Bezier control points from easing array.
/// Returns control points [cp1x, cp1y, cp2x, cp2y]. Falls back to ease-in-out
/// [0.4, 0.0, 0.6, 1.0] if array is malformed or has fewer than 4 elements.
func safeCubicBezierEasing(_ array: [Double]) -> [Double] {
    if array.count >= 4 {
        return Array(array.prefix(4))
    }
    return [0.4, 0.0, 0.6, 1.0]
}
