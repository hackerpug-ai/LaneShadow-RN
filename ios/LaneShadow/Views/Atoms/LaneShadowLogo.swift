import LaneShadowTheme
import SwiftUI

// MARK: - LSLaneShadowLogo Component

/**
 * LSLaneShadowLogo component
 *
 * SVG logo rendered with Canvas. The logo is a stylized "route" glyph:
 * an S-curve path with two filled circle endpoints.
 *
 * ## Design Tokens Used
 * - Colors:
 *   - `theme.colors.onPrimary.default` - Path stroke and circle fills
 * - Space:
 *   - `theme.space.sm` (8) - Used for stroke width calculation
 *   - `theme.space.xs` (4) - Used for circle radius calculation
 *
 * ## Parameters
 * - Parameters:
 *   - size: Logo dimensions (default: 24)
 *   - label: Optional accessibility label (default: "LaneShadow Logo")
 *   - testID: Test identifier for UI testing
 */
public struct LSLaneShadowLogo: View {
    @Environment(\.theme) private var theme

    private let size: CGFloat
    private let label: String?
    private let testID: String?

    public init(
        size: CGFloat,
        label: String? = nil,
        testID: String? = nil
    ) {
        self.size = size
        self.label = label
        self.testID = testID
    }

    // MARK: - Computed Properties

    /// ViewBox dimensions for the SVG (24x24)
    private let viewBoxSize: CGFloat = 24

    /// Scale factor to map viewBox coordinates to actual size
    private var scale: CGFloat {
        size / viewBoxSize
    }

    /// Stroke width calculated from space.sm (8) → max(2, 8/3.rounded()) = 3
    private var strokeWidth: CGFloat {
        max(2, (theme.space.sm / 3).rounded())
    }

    /// Circle radius calculated from space.xs (4) → max(2, 4/1.5.rounded()) = 3
    private var circleRadius: CGFloat {
        max(2, (theme.space.xs / 1.5).rounded())
    }

    // MARK: - Body

    public var body: some View {
        Canvas { context, size in
            drawSCurvePath(in: context)
            drawTopCircle(in: context)
            drawBottomCircle(in: context)
        }
        .frame(width: size, height: size)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label ?? "LaneShadow Logo")
        .accessibilityIdentifier(testID ?? "lane-shadow-logo")
    }

    // MARK: - Drawing Methods

    /// Draw the S-curve path (stroke only, no fill)
    /// Path data: "M8 6 V12 C8 15 12 15 12 12 V10 C12 7 16 7 16 10 V18"
    private func drawSCurvePath(in context: GraphicsContext) {
        var path = Path()

        // Start point (8, 6)
        path.move(to: scaledPoint(x: 8, y: 6))

        // Vertical line to (8, 12)
        path.addLine(to: scaledPoint(x: 8, y: 12))

        // Cubic bezier curve: control1=(8, 15), control2=(12, 15), end=(12, 12)
        path.addCurve(
            to: scaledPoint(x: 12, y: 12),
            control1: scaledPoint(x: 8, y: 15),
            control2: scaledPoint(x: 12, y: 15)
        )

        // Vertical line to (12, 10)
        path.addLine(to: scaledPoint(x: 12, y: 10))

        // Cubic bezier curve: control1=(12, 7), control2=(16, 7), end=(16, 10)
        path.addCurve(
            to: scaledPoint(x: 16, y: 10),
            control1: scaledPoint(x: 12, y: 7),
            control2: scaledPoint(x: 16, y: 7)
        )

        // Vertical line to (16, 18)
        path.addLine(to: scaledPoint(x: 16, y: 18))

        // Stroke the path
        context.stroke(
            path,
            with: .color(theme.colors.onPrimary.default),
            lineWidth: strokeWidth * scale
        )
    }

    /// Draw the top circle endpoint at (8, 6)
    private func drawTopCircle(in context: GraphicsContext) {
        let center = scaledPoint(x: 8, y: 6)
        let radius = circleRadius * scale

        context.fill(
            Path(ellipseIn: CGRect(center: center, radius: radius)),
            with: .color(theme.colors.onPrimary.default)
        )
    }

    /// Draw the bottom circle endpoint at (16, 18)
    private func drawBottomCircle(in context: GraphicsContext) {
        let center = scaledPoint(x: 16, y: 18)
        let radius = circleRadius * scale

        context.fill(
            Path(ellipseIn: CGRect(center: center, radius: radius)),
            with: .color(theme.colors.onPrimary.default)
        )
    }

    /// Scale a viewBox point to the actual canvas size
    private func scaledPoint(x: CGFloat, y: CGFloat) -> CGPoint {
        CGPoint(x: x * scale, y: y * scale)
    }
}

// MARK: - CGRect Extension for Center

private extension CGRect {
    init(center: CGPoint, radius: CGFloat) {
        self.init(
            x: center.x - radius,
            y: center.y - radius,
            width: radius * 2,
            height: radius * 2
        )
    }
}

// MARK: - Preview

#Preview("Default Size") {
    LSLaneShadowLogo(size: 24)
        .laneShadowTheme()
        .padding()
        .background(Color.black)
}

#Preview("Small") {
    LSLaneShadowLogo(size: 16)
        .laneShadowTheme()
        .padding()
        .background(Color.black)
}

#Preview("Medium") {
    LSLaneShadowLogo(size: 32)
        .laneShadowTheme()
        .padding()
        .background(Color.black)
}

#Preview("Large") {
    LSLaneShadowLogo(size: 48)
        .laneShadowTheme()
        .padding()
        .background(Color.black)
}

#Preview("With Accessibility Label") {
    LSLaneShadowLogo(
        size: 24,
        label: "LaneShadow route logo",
        testID: "lane-shadow-logo-test"
    )
    .laneShadowTheme()
    .padding()
    .background(Color.black)
}

#Preview("Multiple Sizes") {
    VStack(spacing: 16) {
        LSLaneShadowLogo(size: 16)
        LSLaneShadowLogo(size: 24)
        LSLaneShadowLogo(size: 32)
        LSLaneShadowLogo(size: 48)
    }
    .laneShadowTheme()
    .padding()
    .background(Color.black)
}
