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

    @State private var dashPhase: CGFloat = 0
    @State private var headDotOpacity: Double = 1.0
    @State private var isAnimating = false

    public init(pathPoints: [CGPoint]) {
        self.pathPoints = pathPoints
    }

    public var body: some View {
        ZStack {
            if !pathPoints.isEmpty {
                // Animated polyline
                buildPolylinePath()
                    .stroke(
                        LaneShadowTheme.color.signal.default,
                        style: polylineStrokeStyle()
                    )
                    .if(!reduceMotion) { view in
                        view.animation(
                            Animation.sketchPolylineLoop(theme: theme),
                            value: isAnimating
                        )
                    }

                // Breathing head dot at final point
                if let lastPoint = pathPoints.last {
                    Circle()
                        .fill(LaneShadowTheme.color.signal.default)
                        .frame(
                            width: theme.type.label.sm.fontSize,
                            height: theme.type.label.sm.fontSize
                        )
                        .opacity(headDotOpacity)
                        .if(!reduceMotion) { view in
                            view.animation(
                                Animation.breathingHeadDot(theme: theme),
                                value: isAnimating
                            )
                        }
                        .position(lastPoint)
                }
            }
        }
        .onAppear {
            startAnimations()
        }
    }

    private func buildPolylinePath() -> Path {
        var path = Path()
        guard !pathPoints.isEmpty else { return path }
        path.move(to: pathPoints[0])
        for i in 1 ..< pathPoints.count {
            path.addLine(to: pathPoints[i])
        }
        return path
    }

    private func polylineStrokeStyle() -> StrokeStyle {
        let dashLength = theme.space.sm + theme.space.md
        return StrokeStyle(
            lineWidth: theme.borderWidth.thick,
            lineCap: .round,
            lineJoin: .round,
            dash: [theme.space.sm, theme.space.md],
            dashPhase: reduceMotion ? 0 : dashPhase
        )
    }

    private func startAnimations() {
        guard !reduceMotion else { return }

        // Drive polyline dash animation
        withAnimation(
            Animation.sketchPolylineLoop(theme: theme).repeatForever(autoreverses: false)
        ) {
            let dashLength = theme.space.sm + theme.space.md
            dashPhase = -(dashLength * 8)
        }

        // Drive breathing head dot animation
        let recipe = theme.motion.recipes["breathingHeadDot"]
        guard let endOpacity = theme.opacity.values["55"] else {
            preconditionFailure("theme.opacity.values[\"55\"] must be defined in semantic tokens")
        }

        withAnimation(
            Animation.breathingHeadDot(theme: theme).repeatForever(autoreverses: true)
        ) {
            headDotOpacity = endOpacity
        }

        isAnimating = true
    }
}

// View.if(_:transform:) helper is provided by ChatTranscript.swift (module-internal extension View).
