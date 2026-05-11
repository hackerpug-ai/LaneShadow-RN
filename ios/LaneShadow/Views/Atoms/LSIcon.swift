import LaneShadowTheme
import SwiftUI

public extension IconName {
    static let canonicalCases: [IconName] = allCases
}

public enum IconContentColor: CaseIterable, Hashable, Sendable {
    case primary
    case secondary
    case tertiary
    case subtle
    case onSignal
    case signal

    public func resolved(in theme: Theme) -> Color {
        switch self {
        case .primary:
            ContentColor.primary.resolved(in: theme)
        case .secondary:
            ContentColor.secondary.resolved(in: theme)
        case .tertiary:
            ContentColor.tertiary.resolved(in: theme)
        case .subtle:
            ContentColor.subtle.resolved(in: theme)
        case .onSignal:
            ContentColor.onSignal.resolved(in: theme)
        case .signal:
            theme.colors.primary.default
        }
    }
}

public struct LSIcon: View {
    @Environment(\.theme) private var theme

    private let name: IconName
    private let size: IconSize
    private let color: IconContentColor
    private let resolvedColorOverride: Color?

    public init(
        name: IconName,
        size: IconSize,
        color: IconContentColor = .primary
    ) {
        self.name = name
        self.size = size
        self.color = color
        resolvedColorOverride = nil
    }

    init(
        name: IconName,
        size: IconSize,
        resolvedColorOverride: Color
    ) {
        self.name = name
        self.size = size
        color = .primary
        self.resolvedColorOverride = resolvedColorOverride
    }

    public var body: some View {
        let resolvedSize = Self.resolvedSize(size, in: theme)
        let strokeWidth = Self.strokeWidth(in: theme)
        let foreground = resolvedColorOverride ?? Self.resolvedColor(color, in: theme)

        Canvas { context, canvasSize in
            let scale = min(canvasSize.width, canvasSize.height) / Self.sourceExtent
            context.scaleBy(x: scale, y: scale)
            draw(name, in: &context, strokeWidth: strokeWidth / scale, foreground: foreground)
        }
        .frame(width: resolvedSize, height: resolvedSize)
        .accessibilityHidden(true)
        .accessibilityIdentifier("lsicon-\(name.rawValue)-\(size)")
    }

    public static func resolvedSize(_ size: IconSize, in theme: Theme) -> CGFloat {
        size.value(in: theme)
    }

    public static func strokeWidth(in theme: Theme) -> CGFloat {
        theme.strokeWidth.normal
    }

    public static func resolvedColor(_ color: IconContentColor, in theme: Theme) -> Color {
        color.resolved(in: theme)
    }

    public static func hasDrawable(for name: IconName) -> Bool {
        IconName.allCases.contains(name)
    }

    private static let sourceExtent: CGFloat = 24

    private func draw(
        _ name: IconName,
        in context: inout GraphicsContext,
        strokeWidth: CGFloat,
        foreground: Color
    ) {
        switch name {
        case .bike:
            stroke(bikePath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .bookmark:
            stroke(bookmarkPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .bookmarkFill:
            fillAndStroke(bookmarkPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .chevL:
            stroke(chevLPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .chevR:
            stroke(chevRPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .clock:
            stroke(clockPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .circle:
            stroke(circlePath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .circleFill:
            fillAndStroke(circlePath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .close:
            stroke(closePath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .collapse:
            stroke(collapsePath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .compass:
            stroke(compassPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .edit:
            stroke(editPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .expand:
            stroke(expandPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .heart:
            stroke(heartPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .heartFill:
            fillAndStroke(heartPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .layers:
            stroke(layersPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .map:
            stroke(mapPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .menu:
            stroke(menuPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .pin:
            stroke(pinPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .plus:
            stroke(plusPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .minus:
            stroke(minusPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .rain:
            stroke(rainPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .route:
            stroke(routePath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .send:
            stroke(sendPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .share:
            stroke(sharePath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .sliders:
            drawSliders(in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .sparkle:
            stroke(sparklePath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .star:
            stroke(starPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .starFill:
            fillAndStroke(starPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .storm:
            stroke(stormPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .sun:
            stroke(sunPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .therm:
            stroke(thermPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .trash:
            stroke(trashPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        case .wind:
            stroke(windPath, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        }
    }

    private func stroke(
        _ path: Path,
        in context: inout GraphicsContext,
        strokeWidth: CGFloat,
        foreground: Color
    ) {
        context.stroke(
            path,
            with: .color(foreground),
            style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, lineJoin: .round)
        )
    }

    private func fillAndStroke(
        _ path: Path,
        in context: inout GraphicsContext,
        strokeWidth: CGFloat,
        foreground: Color
    ) {
        context.fill(path, with: .color(foreground))
        stroke(path, in: &context, strokeWidth: strokeWidth, foreground: foreground)
    }

    private func addLine(_ path: inout Path, _ start: CGPoint, _ end: CGPoint) {
        path.move(to: start)
        path.addLine(to: end)
    }

    private func addPolyline(_ path: inout Path, _ points: [CGPoint]) {
        guard let first = points.first else { return }
        path.move(to: first)
        points.dropFirst().forEach { path.addLine(to: $0) }
    }

    private func addPolygon(_ path: inout Path, _ points: [CGPoint]) {
        addPolyline(&path, points)
        path.closeSubpath()
    }

    private func addCircle(_ path: inout Path, center: CGPoint, radius: CGFloat) {
        path.addEllipse(in: CGRect(
            x: center.x - radius,
            y: center.y - radius,
            width: radius * 2,
            height: radius * 2
        ))
    }

    private func fillCircle(_ context: inout GraphicsContext, center: CGPoint, radius: CGFloat, foreground: Color) {
        var path = Path()
        addCircle(&path, center: center, radius: radius)
        context.fill(path, with: .color(foreground))
    }

    private var bikePath: Path {
        var path = Path()
        addCircle(&path, center: CGPoint(x: 5.5, y: 17.5), radius: 2.5)
        addCircle(&path, center: CGPoint(x: 18.5, y: 17.5), radius: 2.5)
        addPolygon(&path, [
            CGPoint(x: 15, y: 6),
            CGPoint(x: 9, y: 6),
            CGPoint(x: 6, y: 14),
            CGPoint(x: 18, y: 14),
        ])
        path.move(to: CGPoint(x: 18, y: 14))
        path.addLine(to: CGPoint(x: 16, y: 7))
        path.move(to: CGPoint(x: 6, y: 14))
        path.addLine(to: CGPoint(x: 3, y: 14))
        path.addLine(to: CGPoint(x: 2.5, y: 15.5))
        path.move(to: CGPoint(x: 18, y: 14))
        path.addLine(to: CGPoint(x: 20, y: 14))
        path.addLine(to: CGPoint(x: 20.5, y: 15.5))
        return path
    }

    private var bookmarkPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 19, y: 21))
        path.addLine(to: CGPoint(x: 12, y: 16))
        path.addLine(to: CGPoint(x: 5, y: 21))
        path.addLine(to: CGPoint(x: 5, y: 5))
        path.addCurve(to: CGPoint(x: 7, y: 3), control1: CGPoint(x: 5, y: 3.9), control2: CGPoint(x: 5.9, y: 3))
        path.addLine(to: CGPoint(x: 17, y: 3))
        path.addCurve(to: CGPoint(x: 19, y: 5), control1: CGPoint(x: 18.1, y: 3), control2: CGPoint(x: 19, y: 3.9))
        path.closeSubpath()
        return path
    }

    private var chevLPath: Path {
        var path = Path()
        addPolyline(&path, [CGPoint(x: 15, y: 18), CGPoint(x: 9, y: 12), CGPoint(x: 15, y: 6)])
        return path
    }

    private var chevRPath: Path {
        var path = Path()
        addPolyline(&path, [CGPoint(x: 9, y: 18), CGPoint(x: 15, y: 12), CGPoint(x: 9, y: 6)])
        return path
    }

    private var clockPath: Path {
        var path = Path()
        addCircle(&path, center: CGPoint(x: 12, y: 12), radius: 10)
        addPolyline(&path, [CGPoint(x: 12, y: 6), CGPoint(x: 12, y: 12), CGPoint(x: 16, y: 14)])
        return path
    }

    private var circlePath: Path {
        var path = Path()
        addCircle(&path, center: CGPoint(x: 12, y: 12), radius: 8)
        return path
    }

    private var closePath: Path {
        var path = Path()
        addLine(&path, CGPoint(x: 18, y: 6), CGPoint(x: 6, y: 18))
        addLine(&path, CGPoint(x: 6, y: 6), CGPoint(x: 18, y: 18))
        return path
    }

    private var collapsePath: Path {
        var path = Path()
        addPolyline(&path, [CGPoint(x: 4, y: 14), CGPoint(x: 10, y: 14), CGPoint(x: 10, y: 20)])
        addPolyline(&path, [CGPoint(x: 20, y: 10), CGPoint(x: 14, y: 10), CGPoint(x: 14, y: 4)])
        addLine(&path, CGPoint(x: 10, y: 14), CGPoint(x: 3, y: 21))
        addLine(&path, CGPoint(x: 21, y: 3), CGPoint(x: 14, y: 10))
        return path
    }

    private var compassPath: Path {
        var path = Path()
        addCircle(&path, center: CGPoint(x: 12, y: 12), radius: 10)
        addPolygon(&path, [
            CGPoint(x: 16.24, y: 7.76),
            CGPoint(x: 14.12, y: 14.12),
            CGPoint(x: 7.76, y: 16.24),
            CGPoint(x: 9.88, y: 9.88),
        ])
        return path
    }

    private var editPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 11, y: 4))
        path.addLine(to: CGPoint(x: 4, y: 4))
        path.addCurve(to: CGPoint(x: 2, y: 6), control1: CGPoint(x: 2.9, y: 4), control2: CGPoint(x: 2, y: 4.9))
        path.addLine(to: CGPoint(x: 2, y: 20))
        path.addCurve(to: CGPoint(x: 4, y: 22), control1: CGPoint(x: 2, y: 21.1), control2: CGPoint(x: 2.9, y: 22))
        path.addLine(to: CGPoint(x: 18, y: 22))
        path.addCurve(to: CGPoint(x: 20, y: 20), control1: CGPoint(x: 19.1, y: 22), control2: CGPoint(x: 20, y: 21.1))
        path.addLine(to: CGPoint(x: 20, y: 13))
        path.move(to: CGPoint(x: 18.5, y: 2.5))
        path.addCurve(
            to: CGPoint(x: 21.5, y: 5.5),
            control1: CGPoint(x: 19.33, y: 1.67),
            control2: CGPoint(x: 20.67, y: 1.67)
        )
        path.addLine(to: CGPoint(x: 12, y: 15))
        path.addLine(to: CGPoint(x: 8, y: 16))
        path.addLine(to: CGPoint(x: 9, y: 12))
        path.closeSubpath()
        return path
    }

    private var expandPath: Path {
        var path = Path()
        addPolyline(&path, [CGPoint(x: 15, y: 3), CGPoint(x: 21, y: 3), CGPoint(x: 21, y: 9)])
        addPolyline(&path, [CGPoint(x: 9, y: 21), CGPoint(x: 3, y: 21), CGPoint(x: 3, y: 15)])
        addLine(&path, CGPoint(x: 21, y: 3), CGPoint(x: 14, y: 10))
        addLine(&path, CGPoint(x: 3, y: 21), CGPoint(x: 10, y: 14))
        return path
    }

    private var heartPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 20.84, y: 4.61))
        path.addCurve(
            to: CGPoint(x: 13.06, y: 4.61),
            control1: CGPoint(x: 18.69, y: 2.46),
            control2: CGPoint(x: 15.21, y: 2.46)
        )
        path.addLine(to: CGPoint(x: 12, y: 5.67))
        path.addLine(to: CGPoint(x: 10.94, y: 4.61))
        path.addCurve(
            to: CGPoint(x: 3.16, y: 4.61),
            control1: CGPoint(x: 8.79, y: 2.46),
            control2: CGPoint(x: 5.31, y: 2.46)
        )
        path.addCurve(
            to: CGPoint(x: 3.16, y: 12.39),
            control1: CGPoint(x: 1.01, y: 6.76),
            control2: CGPoint(x: 1.01, y: 10.24)
        )
        path.addLine(to: CGPoint(x: 4.22, y: 13.45))
        path.addLine(to: CGPoint(x: 12, y: 21.23))
        path.addLine(to: CGPoint(x: 19.78, y: 13.45))
        path.addLine(to: CGPoint(x: 20.84, y: 12.39))
        path.addCurve(
            to: CGPoint(x: 20.84, y: 4.61),
            control1: CGPoint(x: 22.99, y: 10.24),
            control2: CGPoint(x: 22.99, y: 6.76)
        )
        path.closeSubpath()
        return path
    }

    private var layersPath: Path {
        var path = Path()
        addPolygon(&path, [
            CGPoint(x: 12, y: 2),
            CGPoint(x: 2, y: 7),
            CGPoint(x: 12, y: 12),
            CGPoint(x: 22, y: 7),
        ])
        addPolyline(&path, [CGPoint(x: 2, y: 17), CGPoint(x: 12, y: 22), CGPoint(x: 22, y: 17)])
        addPolyline(&path, [CGPoint(x: 2, y: 12), CGPoint(x: 12, y: 17), CGPoint(x: 22, y: 12)])
        return path
    }

    private var mapPath: Path {
        var path = Path()
        addPolygon(&path, [
            CGPoint(x: 1, y: 6),
            CGPoint(x: 1, y: 22),
            CGPoint(x: 8, y: 18),
            CGPoint(x: 16, y: 22),
            CGPoint(x: 23, y: 18),
            CGPoint(x: 23, y: 2),
            CGPoint(x: 16, y: 6),
            CGPoint(x: 8, y: 2),
        ])
        addLine(&path, CGPoint(x: 8, y: 2), CGPoint(x: 8, y: 18))
        addLine(&path, CGPoint(x: 16, y: 6), CGPoint(x: 16, y: 22))
        return path
    }

    private var menuPath: Path {
        var path = Path()
        for y in [CGFloat(6), CGFloat(12), CGFloat(18)] {
            addLine(&path, CGPoint(x: 3, y: y), CGPoint(x: 21, y: y))
        }
        return path
    }

    private var pinPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 21, y: 10))
        path.addCurve(
            to: CGPoint(x: 12, y: 23),
            control1: CGPoint(x: 21, y: 17),
            control2: CGPoint(x: 12, y: 23)
        )
        path.addCurve(
            to: CGPoint(x: 3, y: 10),
            control1: CGPoint(x: 12, y: 23),
            control2: CGPoint(x: 3, y: 17)
        )
        path.addCurve(
            to: CGPoint(x: 21, y: 10),
            control1: CGPoint(x: 3, y: 5.03),
            control2: CGPoint(x: 7.03, y: 1)
        )
        addCircle(&path, center: CGPoint(x: 12, y: 10), radius: 3)
        return path
    }

    private var plusPath: Path {
        var path = Path()
        addLine(&path, CGPoint(x: 12, y: 5), CGPoint(x: 12, y: 19))
        addLine(&path, CGPoint(x: 5, y: 12), CGPoint(x: 19, y: 12))
        return path
    }

    private var minusPath: Path {
        var path = Path()
        addLine(&path, CGPoint(x: 5, y: 12), CGPoint(x: 19, y: 12))
        return path
    }

    private var rainPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 20, y: 17.58))
        path.addCurve(to: CGPoint(x: 18, y: 8), control1: CGPoint(x: 23.1, y: 15.5), control2: CGPoint(x: 22.1, y: 8))
        path.addLine(to: CGPoint(x: 16.74, y: 8))
        path.addCurve(
            to: CGPoint(x: 4, y: 16.25),
            control1: CGPoint(x: 15.55, y: 1.1),
            control2: CGPoint(x: 5.55, y: 1.4)
        )
        addLine(&path, CGPoint(x: 8, y: 19), CGPoint(x: 8, y: 21))
        addLine(&path, CGPoint(x: 12, y: 21), CGPoint(x: 12, y: 23))
        addLine(&path, CGPoint(x: 16, y: 19), CGPoint(x: 16, y: 21))
        return path
    }

    private var routePath: Path {
        var path = Path()
        addPolyline(&path, [
            CGPoint(x: 3, y: 17),
            CGPoint(x: 7, y: 9),
            CGPoint(x: 11, y: 13),
            CGPoint(x: 15, y: 7),
            CGPoint(x: 19, y: 17),
        ])
        return path
    }

    private var sendPath: Path {
        var path = Path()
        addLine(&path, CGPoint(x: 22, y: 2), CGPoint(x: 11, y: 13))
        addPolygon(&path, [
            CGPoint(x: 22, y: 2),
            CGPoint(x: 15, y: 22),
            CGPoint(x: 11, y: 13),
            CGPoint(x: 2, y: 9),
        ])
        return path
    }

    private var sharePath: Path {
        var path = Path()
        addCircle(&path, center: CGPoint(x: 18, y: 5), radius: 3)
        addCircle(&path, center: CGPoint(x: 6, y: 12), radius: 3)
        addCircle(&path, center: CGPoint(x: 18, y: 19), radius: 3)
        addLine(&path, CGPoint(x: 8.59, y: 13.51), CGPoint(x: 15.42, y: 17.49))
        addLine(&path, CGPoint(x: 15.41, y: 6.51), CGPoint(x: 8.59, y: 10.49))
        return path
    }

    private func drawSliders(
        in context: inout GraphicsContext,
        strokeWidth: CGFloat,
        foreground: Color
    ) {
        var path = Path()
        for y in [CGFloat(6), CGFloat(12), CGFloat(18)] {
            addLine(&path, CGPoint(x: 4, y: y), CGPoint(x: 20, y: y))
        }
        stroke(path, in: &context, strokeWidth: strokeWidth, foreground: foreground)
        fillCircle(&context, center: CGPoint(x: 8, y: 6), radius: 2, foreground: foreground)
        fillCircle(&context, center: CGPoint(x: 16, y: 12), radius: 2, foreground: foreground)
        fillCircle(&context, center: CGPoint(x: 10, y: 18), radius: 2, foreground: foreground)
    }

    private var sparklePath: Path {
        var path = Path()
        addPolygon(&path, [
            CGPoint(x: 12, y: 3),
            CGPoint(x: 13.5, y: 8.5),
            CGPoint(x: 19, y: 8.5),
            CGPoint(x: 14.75, y: 11.5),
            CGPoint(x: 16.5, y: 17),
            CGPoint(x: 12, y: 14),
            CGPoint(x: 7.5, y: 17),
            CGPoint(x: 9.25, y: 11.5),
            CGPoint(x: 5, y: 8.5),
            CGPoint(x: 10.5, y: 8.5),
        ])
        return path
    }

    private var starPath: Path {
        var path = Path()
        addPolygon(&path, [
            CGPoint(x: 12, y: 2),
            CGPoint(x: 15.09, y: 8.26),
            CGPoint(x: 22, y: 9.27),
            CGPoint(x: 17, y: 14.14),
            CGPoint(x: 18.18, y: 21.02),
            CGPoint(x: 12, y: 17.77),
            CGPoint(x: 5.82, y: 21.02),
            CGPoint(x: 7, y: 14.14),
            CGPoint(x: 2, y: 9.27),
            CGPoint(x: 8.91, y: 8.26),
        ])
        return path
    }

    private var stormPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 19, y: 16.9))
        path.addCurve(to: CGPoint(x: 18, y: 7), control1: CGPoint(x: 22.5, y: 14.5), control2: CGPoint(x: 22, y: 7))
        path.addLine(to: CGPoint(x: 16.74, y: 7))
        path.addCurve(
            to: CGPoint(x: 5.12, y: 16),
            control1: CGPoint(x: 15.55, y: 0.1),
            control2: CGPoint(x: 5.5, y: 0.5)
        )
        addPolyline(&path, [
            CGPoint(x: 13, y: 11),
            CGPoint(x: 9, y: 17),
            CGPoint(x: 15, y: 17),
            CGPoint(x: 11, y: 23),
        ])
        return path
    }

    private var sunPath: Path {
        var path = Path()
        addCircle(&path, center: CGPoint(x: 12, y: 12), radius: 5)
        addLine(&path, CGPoint(x: 12, y: 1), CGPoint(x: 12, y: 3))
        addLine(&path, CGPoint(x: 12, y: 21), CGPoint(x: 12, y: 23))
        addLine(&path, CGPoint(x: 4.22, y: 4.22), CGPoint(x: 5.64, y: 5.64))
        addLine(&path, CGPoint(x: 18.36, y: 18.36), CGPoint(x: 19.78, y: 19.78))
        addLine(&path, CGPoint(x: 1, y: 12), CGPoint(x: 3, y: 12))
        addLine(&path, CGPoint(x: 21, y: 12), CGPoint(x: 23, y: 12))
        addLine(&path, CGPoint(x: 4.22, y: 19.78), CGPoint(x: 5.64, y: 18.36))
        addLine(&path, CGPoint(x: 18.36, y: 5.64), CGPoint(x: 19.78, y: 4.22))
        return path
    }

    private var thermPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 14, y: 14.76))
        path.addLine(to: CGPoint(x: 14, y: 3.5))
        path.addCurve(to: CGPoint(x: 9, y: 3.5), control1: CGPoint(x: 14, y: 0.17), control2: CGPoint(x: 9, y: 0.17))
        path.addLine(to: CGPoint(x: 9, y: 14.76))
        path.addCurve(to: CGPoint(x: 14, y: 14.76), control1: CGPoint(x: 6, y: 17.8), control2: CGPoint(x: 11, y: 24))
        return path
    }

    private var trashPath: Path {
        var path = Path()
        addPolyline(&path, [CGPoint(x: 3, y: 6), CGPoint(x: 5, y: 6), CGPoint(x: 21, y: 6)])
        path.move(to: CGPoint(x: 19, y: 6))
        path.addLine(to: CGPoint(x: 19, y: 20))
        path.addCurve(to: CGPoint(x: 17, y: 22), control1: CGPoint(x: 19, y: 21.1), control2: CGPoint(x: 18.1, y: 22))
        path.addLine(to: CGPoint(x: 7, y: 22))
        path.addCurve(to: CGPoint(x: 5, y: 20), control1: CGPoint(x: 5.9, y: 22), control2: CGPoint(x: 5, y: 21.1))
        path.addLine(to: CGPoint(x: 5, y: 6))
        path.move(to: CGPoint(x: 8, y: 6))
        path.addLine(to: CGPoint(x: 8, y: 4))
        path.addCurve(to: CGPoint(x: 9, y: 3), control1: CGPoint(x: 8, y: 3.45), control2: CGPoint(x: 8.45, y: 3))
        path.addLine(to: CGPoint(x: 13, y: 3))
        path.addCurve(to: CGPoint(x: 14, y: 4), control1: CGPoint(x: 13.55, y: 3), control2: CGPoint(x: 14, y: 3.45))
        path.addLine(to: CGPoint(x: 14, y: 6))
        return path
    }

    private var windPath: Path {
        var path = Path()
        path.move(to: CGPoint(x: 9.59, y: 4.59))
        path.addCurve(to: CGPoint(x: 11, y: 8), control1: CGPoint(x: 10.37, y: 3.81), control2: CGPoint(x: 12, y: 4.7))
        path.addLine(to: CGPoint(x: 2, y: 8))
        path.move(to: CGPoint(x: 12.59, y: 19.41))
        path.addCurve(
            to: CGPoint(x: 14, y: 16),
            control1: CGPoint(x: 13.37, y: 20.19),
            control2: CGPoint(x: 15, y: 19.3)
        )
        path.addLine(to: CGPoint(x: 2, y: 16))
        path.move(to: CGPoint(x: 17.73, y: 7.73))
        path.addCurve(
            to: CGPoint(x: 19.5, y: 12),
            control1: CGPoint(x: 18.7, y: 6.76),
            control2: CGPoint(x: 21.2, y: 8.3)
        )
        path.addLine(to: CGPoint(x: 2, y: 12))
        return path
    }
}
