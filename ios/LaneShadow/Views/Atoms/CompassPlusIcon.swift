import LaneShadowTheme
import SwiftUI

// MARK: - CompassPlusIcon Component

/**
 * CompassPlusIcon component
 *
 * SVG compass icon with plus badge at bottom-right
 *
 * ## Design Tokens Used
 * - Colors:
 *   - `theme.colors.primary.default` - Compass circle fill
 *   - `theme.colors.onPrimary.default` - Compass needle and N/S marks
 *   - `theme.colors.onSurface.default` - Plus badge background
 *   - `theme.colors.surface.default` - Plus sign foreground
 * - Space:
 *   - `theme.space.xs` (4) - Used for stroke width calculation
 *   - `theme.space.md` (12) - Used for badge radius calculation
 *
 * ## Parameters
 * - Parameters:
 *   - size: Overall icon size (default: 48)
 *   - label: Optional accessibility label (default: "Compass with plus badge")
 *   - testID: Test identifier for UI testing
 */
public struct CompassPlusIcon: View {
    @Environment(\.theme) private var theme

    private let size: CGFloat
    private let label: String?
    private let testID: String?

    public init(
        size: CGFloat = 48,
        label: String? = nil,
        testID: String? = nil
    ) {
        self.size = size
        self.label = label
        self.testID = testID
    }

    // MARK: - Computed Properties

    private var strokeWidth: CGFloat {
        max(1.5, theme.space.xs / 3)
    }

    private var badgeRadius: CGFloat {
        max(6, theme.space.md) / 2
    }

    private var center: CGPoint {
        CGPoint(x: size / 2, y: size / 2)
    }

    private var radius: CGFloat {
        (size - strokeWidth) / 2
    }

    private var badgeCenter: CGPoint {
        CGPoint(x: size - badgeRadius, y: size - badgeRadius)
    }

    // MARK: - Body

    public var body: some View {
        Canvas { context, size in
            drawCompass(in: context, size: size)
            drawBadge(in: context, size: size)
        }
        .frame(width: size, height: size)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label ?? "Compass with plus badge")
        .accessibilityIdentifier(testID ?? "compass-plus-icon")
    }

    // MARK: - Drawing Methods

    private func drawCompass(in context: GraphicsContext, size: CGSize) {
        // Draw compass circle
        context.fill(
            Path(ellipseIn: CGRect(center: center, radius: radius)),
            with: .color(theme.colors.primary.default)
        )

        // Draw compass circle stroke
        context.stroke(
            Path(ellipseIn: CGRect(center: center, radius: radius)),
            with: .color(theme.colors.onPrimary.default),
            lineWidth: strokeWidth
        )

        // Draw diamond needle
        drawNeedle(in: context)

        // Draw North/South marks
        drawMarks(in: context)
    }

    private func drawNeedle(in context: GraphicsContext) {
        let needleWidth = radius * 0.25
        let needleHeight = radius * 0.6

        var needlePath = Path()
        needlePath.move(to: CGPoint(x: center.x, y: center.y - needleHeight / 2))
        needlePath.addLine(to: CGPoint(x: center.x + needleWidth / 2, y: center.y))
        needlePath.addLine(to: CGPoint(x: center.x, y: center.y + needleHeight / 2))
        needlePath.addLine(to: CGPoint(x: center.x - needleWidth / 2, y: center.y))
        needlePath.closeSubpath()

        context.fill(needlePath, with: .color(theme.colors.onPrimary.default))
    }

    private func drawMarks(in context: GraphicsContext) {
        let markLength = radius * 0.15
        let markInset = radius * 0.1

        // North mark
        var northPath = Path()
        northPath.move(to: CGPoint(x: center.x, y: center.y - radius + markInset))
        northPath.addLine(to: CGPoint(x: center.x, y: center.y - radius + markInset + markLength))

        // South mark
        var southPath = Path()
        southPath.move(to: CGPoint(x: center.x, y: center.y + radius - markInset))
        southPath.addLine(to: CGPoint(x: center.x, y: center.y + radius - markInset - markLength))

        context.stroke(northPath, with: .color(theme.colors.onPrimary.default), lineWidth: strokeWidth)
        context.stroke(southPath, with: .color(theme.colors.onPrimary.default), lineWidth: strokeWidth)
    }

    private func drawBadge(in context: GraphicsContext, size: CGSize) {
        // Draw badge circle
        context.fill(
            Path(ellipseIn: CGRect(center: badgeCenter, radius: badgeRadius)),
            with: .color(theme.colors.onSurface.default)
        )

        // Draw plus sign
        drawPlus(in: context)
    }

    private func drawPlus(in context: GraphicsContext) {
        let plusWidth = badgeRadius * 0.6
        let plusThickness = max(1.5, strokeWidth)

        // Horizontal line
        var horizontalPath = Path()
        horizontalPath.move(to: CGPoint(x: badgeCenter.x - plusWidth / 2, y: badgeCenter.y))
        horizontalPath.addLine(to: CGPoint(x: badgeCenter.x + plusWidth / 2, y: badgeCenter.y))

        // Vertical line
        var verticalPath = Path()
        verticalPath.move(to: CGPoint(x: badgeCenter.x, y: badgeCenter.y - plusWidth / 2))
        verticalPath.addLine(to: CGPoint(x: badgeCenter.x, y: badgeCenter.y + plusWidth / 2))

        context.stroke(horizontalPath, with: .color(theme.colors.surface.default), lineWidth: plusThickness)
        context.stroke(verticalPath, with: .color(theme.colors.surface.default), lineWidth: plusThickness)
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
    CompassPlusIcon()
        .laneShadowTheme()
}

#Preview("Small") {
    CompassPlusIcon(size: 32)
        .laneShadowTheme()
}

#Preview("Large") {
    CompassPlusIcon(size: 64)
        .laneShadowTheme()
}

#Preview("With Accessibility Label") {
    CompassPlusIcon(
        size: 48,
        label: "Add new route",
        testID: "add-route-icon"
    )
    .laneShadowTheme()
}
