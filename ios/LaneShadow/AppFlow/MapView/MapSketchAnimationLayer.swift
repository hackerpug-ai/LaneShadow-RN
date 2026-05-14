import LaneShadowTheme
import SwiftUI

/// MapSketchAnimationLayer — animated sketch polyline with breathing head dot
public struct MapSketchAnimationLayer: View {
    @Environment(\.theme) var theme
    @Environment(\.accessibilityReduceMotion) var reduceMotionEnabled

    let pathPoints: [CGPoint]
    @State private var headDotOpacity: Double = 1.0

    public init(pathPoints: [CGPoint]) {
        self.pathPoints = pathPoints
    }

    public var body: some View {
        ZStack {
            if !pathPoints.isEmpty {
                buildPath()
                    .stroke(LaneShadowTheme.color.signal.default, lineWidth: 2)
            }
            if let lastPoint = pathPoints.last {
                Circle()
                    .fill(LaneShadowTheme.color.signal.default)
                    .frame(width: 8, height: 8)
                    .position(lastPoint)
                    .opacity(reduceMotionEnabled ? 1.0 : headDotOpacity)
            }
        }
        .onAppear {
            startAnimations()
        }
    }

    private func buildPath() -> Path {
        var path = Path()
        guard !pathPoints.isEmpty else { return path }
        path.move(to: pathPoints[0])
        for point in pathPoints.dropFirst() {
            path.addLine(to: point)
        }
        return path
    }

    private func startAnimations() {
        guard !reduceMotionEnabled else { return }
        // Breathing animation for head dot
        let recipe = theme.motion.recipes["breathingHeadDot"]
        let duration = TimeInterval(recipe?.duration ?? 1400) / 1000
        let anim = Animation.easeInOut(duration: duration).repeatForever(autoreverses: true)
        withAnimation(anim) {
            headDotOpacity = 0.55
        }
    }
}
