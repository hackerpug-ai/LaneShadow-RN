import SwiftUI
import CoreGraphics

public struct ColorSet: Sendable {
    public let `default`: Color
    public let hover: Color?
    public let pressed: Color?
    public let disabled: Color?
    public let focus: Color?

    public init(
        default defaultColor: Color,
        hover: Color? = nil,
        pressed: Color? = nil,
        disabled: Color? = nil,
        focus: Color? = nil
    ) {
        self.default = defaultColor
        self.hover = hover
        self.pressed = pressed
        self.disabled = disabled
        self.focus = focus
    }
}

public struct TypographyStyle: Sendable {
    public let fontSize: CGFloat
    public let lineHeight: CGFloat
    public let fontWeight: Font.Weight

    public init(fontSize: CGFloat, lineHeight: CGFloat, fontWeight: Font.Weight) {
        self.fontSize = fontSize
        self.lineHeight = lineHeight
        self.fontWeight = fontWeight
    }

    public var font: Font { Font.system(size: fontSize, weight: fontWeight) }
}

public struct ElevationStyle: Sendable {
    public let shadowColor: Color
    public let offsetX: CGFloat
    public let offsetY: CGFloat
    public let opacity: Double
    public let radius: CGFloat
    public let elevation: CGFloat

    public init(
        shadowColor: Color,
        offsetX: CGFloat,
        offsetY: CGFloat,
        opacity: Double,
        radius: CGFloat,
        elevation: CGFloat
    ) {
        self.shadowColor = shadowColor
        self.offsetX = offsetX
        self.offsetY = offsetY
        self.opacity = opacity
        self.radius = radius
        self.elevation = elevation
    }
}

@inline(__always)
internal func fontWeight(from raw: String) -> Font.Weight {
    switch raw {
    case "100": return .ultraLight
    case "200": return .thin
    case "300": return .light
    case "400", "normal": return .regular
    case "500": return .medium
    case "600": return .semibold
    case "700", "bold": return .bold
    case "800": return .heavy
    case "900": return .black
    default: return .regular
    }
}
