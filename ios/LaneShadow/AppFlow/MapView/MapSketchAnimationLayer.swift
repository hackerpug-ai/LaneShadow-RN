import LaneShadowTheme
import SwiftUI

/// MapSketchAnimationLayer — animated sketch polyline with breathing head dot
///
/// Renders a copper sketch polyline with continuous dashed-animation loop and a breathing head dot
/// at the path's final point. Both animations honor accessibility reduce-motion settings.
///
/// - Parameters:
///   - pathPoints: Array of CGPoint coordinates defining the polyline geometry (data-driven, not screen-space)
///
/// - Environment requirements:
///   - `\.theme` — LaneShadowTheme for token lookups (colors, spacing, motion recipes)
///   - `\.accessibilityReduceMotion` — when true, collapses both animations to static rendering
public struct MapSketchAnimationLayer: View {
    @Environment(\.theme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    let pathPoints: [CGPoint]

    @State private var isAnimating = false

    public init(pathPoints: [CGPoint]) {
        self.pathPoints = pathPoints
    }

    public var body: some View {
        let resolved = displayState(theme: theme, reduceMotion: reduceMotion, isAnimating: isAnimating)

        ZStack {
            if !resolved.pathPoints.isEmpty {
                polylinePath(for: resolved.pathPoints)
                    .stroke(
                        resolved.polylineColor,
                        style: resolved.strokeStyle
                    )
                    .if(resolved.polylineMotion != nil) { view in
                        view.animation(
                            resolved.polylineMotion?.animation ?? .default,
                            value: isAnimating
                        )
                    }

                if let headDotPoint = resolved.headDotPoint {
                    Circle()
                        .fill(resolved.polylineColor)
                        .frame(
                            width: resolved.headDotSize,
                            height: resolved.headDotSize
                        )
                        .opacity(resolved.headDotOpacity)
                        .if(resolved.headDotMotion != nil) { view in
                            view.animation(
                                resolved.headDotMotion?.animation ?? .default,
                                value: isAnimating
                            )
                        }
                        .position(headDotPoint)
                }
            }
        }
        .onAppear {
            isAnimating = !reduceMotion
        }
        .onChange(of: reduceMotion) { _, nextValue in
            isAnimating = !nextValue
        }
    }

    func resolvedState(theme: Theme, reduceMotion: Bool) -> MapSketchResolvedState {
        let dashPattern = [theme.space.sm, theme.space.md]
        let staticDashPhase = CGFloat.zero
        let animatedDashPhase = -dashPattern.reduce(CGFloat.zero, +)
        let fullOpacity = Double(theme.opacity.values["100"] ?? 1)
        let animatedHeadDotOpacity = Double(
            theme.opacity.values["50"] ?? theme.opacity.actionIdle
        )

        return MapSketchResolvedState(
            pathPoints: pathPoints,
            headDotPoint: pathPoints.last,
            polylineColorToken: "color.signal.default",
            polylineColor: LaneShadowTheme.color.signal.default,
            lineWidth: theme.borderWidth.thick,
            dashPattern: dashPattern,
            staticDashPhase: staticDashPhase,
            animatedDashPhase: reduceMotion ? staticDashPhase : animatedDashPhase,
            headDotSize: theme.type.label.sm.fontSize,
            fullOpacity: fullOpacity,
            animatedHeadDotOpacity: reduceMotion ? fullOpacity : animatedHeadDotOpacity,
            polylineMotion: reduceMotion ? nil : sketchMotionDescriptor(
                named: "motion.recipe.sketchPolylineLoop",
                recipe: theme.motion.recipes["sketchPolylineLoop"]
            ),
            headDotMotion: reduceMotion ? nil : sketchMotionDescriptor(
                named: "motion.recipe.breathingHeadDot",
                recipe: theme.motion.recipes["breathingHeadDot"]
            )
        )
    }

    private func displayState(
        theme: Theme,
        reduceMotion: Bool,
        isAnimating: Bool
    ) -> MapSketchResolvedState {
        let resolved = resolvedState(theme: theme, reduceMotion: reduceMotion)
        guard !reduceMotion, !isAnimating else {
            return resolved
        }

        return resolved.withDisplayState(
            dashPhase: resolved.staticDashPhase,
            headDotOpacity: resolved.fullOpacity
        )
    }

    private func polylinePath(for points: [CGPoint]) -> Path {
        var path = Path()
        guard !points.isEmpty else { return path }
        path.move(to: points[0])
        for index in 1 ..< points.count {
            path.addLine(to: points[index])
        }
        return path
    }
}

struct MapSketchResolvedState {
    let pathPoints: [CGPoint]
    let headDotPoint: CGPoint?
    let polylineColorToken: String
    let polylineColor: Color
    let lineWidth: CGFloat
    let dashPattern: [CGFloat]
    let staticDashPhase: CGFloat
    let animatedDashPhase: CGFloat
    let headDotSize: CGFloat
    let fullOpacity: Double
    let animatedHeadDotOpacity: Double
    let polylineMotion: MapSketchMotionDescriptor?
    let headDotMotion: MapSketchMotionDescriptor?
    private let displayDashPhase: CGFloat?
    private let displayHeadDotOpacity: Double?

    init(
        pathPoints: [CGPoint],
        headDotPoint: CGPoint?,
        polylineColorToken: String,
        polylineColor: Color,
        lineWidth: CGFloat,
        dashPattern: [CGFloat],
        staticDashPhase: CGFloat,
        animatedDashPhase: CGFloat,
        headDotSize: CGFloat,
        fullOpacity: Double,
        animatedHeadDotOpacity: Double,
        polylineMotion: MapSketchMotionDescriptor?,
        headDotMotion: MapSketchMotionDescriptor?,
        displayDashPhase: CGFloat? = nil,
        displayHeadDotOpacity: Double? = nil
    ) {
        self.pathPoints = pathPoints
        self.headDotPoint = headDotPoint
        self.polylineColorToken = polylineColorToken
        self.polylineColor = polylineColor
        self.lineWidth = lineWidth
        self.dashPattern = dashPattern
        self.staticDashPhase = staticDashPhase
        self.animatedDashPhase = animatedDashPhase
        self.headDotSize = headDotSize
        self.fullOpacity = fullOpacity
        self.animatedHeadDotOpacity = animatedHeadDotOpacity
        self.polylineMotion = polylineMotion
        self.headDotMotion = headDotMotion
        self.displayDashPhase = displayDashPhase
        self.displayHeadDotOpacity = displayHeadDotOpacity
    }

    var strokeStyle: StrokeStyle {
        StrokeStyle(
            lineWidth: lineWidth,
            lineCap: .round,
            lineJoin: .round,
            dash: dashPattern,
            dashPhase: displayDashPhase ?? animatedDashPhase
        )
    }

    var headDotOpacity: Double {
        displayHeadDotOpacity ?? animatedHeadDotOpacity
    }

    func withDisplayState(dashPhase: CGFloat, headDotOpacity: Double) -> Self {
        MapSketchResolvedState(
            pathPoints: pathPoints,
            headDotPoint: headDotPoint,
            polylineColorToken: polylineColorToken,
            polylineColor: polylineColor,
            lineWidth: lineWidth,
            dashPattern: dashPattern,
            staticDashPhase: staticDashPhase,
            animatedDashPhase: animatedDashPhase,
            headDotSize: headDotSize,
            fullOpacity: fullOpacity,
            animatedHeadDotOpacity: animatedHeadDotOpacity,
            polylineMotion: polylineMotion,
            headDotMotion: headDotMotion,
            displayDashPhase: dashPhase,
            displayHeadDotOpacity: headDotOpacity
        )
    }
}

struct MapSketchMotionDescriptor: Equatable {
    let name: String
    let duration: TimeInterval
    let easing: [Double]
    let autoreverses: Bool

    var animation: Animation {
        let controlPoints = safeCubicBezierEasing(easing)
        return Animation.timingCurve(
            controlPoints[0],
            controlPoints[1],
            controlPoints[2],
            controlPoints[3],
            duration: duration
        )
        .repeatForever(autoreverses: autoreverses)
    }
}

private func sketchMotionDescriptor(
    named name: String,
    recipe: MotionRecipe?
) -> MapSketchMotionDescriptor? {
    guard let recipe else {
        return nil
    }

    return MapSketchMotionDescriptor(
        name: name,
        duration: TimeInterval(recipe.duration) / 1000,
        easing: recipe.easing,
        autoreverses: name == "motion.recipe.breathingHeadDot"
    )
}

extension Animation {
    static func sketchPolylineLoop(theme: Theme) -> Animation {
        guard let motion = sketchMotionDescriptor(
            named: "motion.recipe.sketchPolylineLoop",
            recipe: theme.motion.recipes["sketchPolylineLoop"]
        ) else {
            return .default
        }

        return motion.animation
    }

    static func breathingHeadDot(theme: Theme) -> Animation {
        guard let motion = sketchMotionDescriptor(
            named: "motion.recipe.breathingHeadDot",
            recipe: theme.motion.recipes["breathingHeadDot"]
        ) else {
            return .default
        }

        return motion.animation
    }
}

func safeCubicBezierEasing(_ array: [Double]) -> [Double] {
    if array.count >= 4 {
        return Array(array.prefix(4))
    }

    let fallback = Theme.shared.motion.easing["easeInOut"] ?? Theme.shared.motion.easing["linear"] ?? []
    if fallback.count >= 4 {
        return Array(fallback.prefix(4))
    }

    return [0, 0, 1, 1]
}
