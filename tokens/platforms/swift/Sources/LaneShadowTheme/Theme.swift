import CoreGraphics
import SwiftUI

#if canImport(UIKit)
    import UIKit

    @inline(__always)
    func dyn(_ light: Color, _ dark: Color) -> Color {
        Color(uiColor: UIColor { trait in
            trait.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
#else
    @inline(__always)
    func dyn(_ light: Color, _ dark: Color) -> Color {
        light
    }
#endif

// MARK: - Color string → SwiftUI.Color

@inline(__always)
func parseColorString(_ raw: String) -> Color {
    let t = raw.trimmingCharacters(in: .whitespaces)
    if t == "transparent" || t == "clear" { return .clear }
    if t.hasPrefix("#") {
        let hex = String(t.dropFirst())
        let norm: String = hex.count == 3
            ? String(hex.flatMap { [$0, $0] })
            : hex
        if norm.count == 6, let v = UInt64(norm, radix: 16) {
            return Color(
                red: Double((v >> 16) & 0xFF) / 255,
                green: Double((v >> 8) & 0xFF) / 255,
                blue: Double(v & 0xFF) / 255
            )
        }
        if norm.count == 8, let v = UInt64(norm, radix: 16) {
            let a = Double((v >> 24) & 0xFF) / 255
            return Color(
                red: Double((v >> 16) & 0xFF) / 255,
                green: Double((v >> 8) & 0xFF) / 255,
                blue: Double(v & 0xFF) / 255
            ).opacity(a)
        }
    }
    if t.hasPrefix("rgb") {
        var s = t
        if s.hasPrefix("rgba(") { s = String(s.dropFirst(5)) }
        else if s.hasPrefix("rgb(") { s = String(s.dropFirst(4)) }
        if s.hasSuffix(")") { s = String(s.dropLast()) }
        let parts = s.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        guard parts.count >= 3,
              let r = Double(parts[0]),
              let g = Double(parts[1]),
              let b = Double(parts[2]) else { return .black }
        let a = parts.count >= 4 ? (Double(parts[3]) ?? 1) : 1
        return Color(red: r / 255, green: g / 255, blue: b / 255).opacity(a)
    }
    return .black
}

// MARK: - ColorSet factory (dynamic light/dark) from DTO dicts

@inline(__always)
func makeColorSet(
    _ light: [String: ColorStatesDef],
    _ dark: [String: ColorStatesDef],
    _ key: String
) -> ColorSet {
    guard let l = light[key], let d = dark[key] else {
        fatalError("LaneShadowTheme: missing color group '\(key)' in semantic.tokens.json")
    }
    func resolve(_ lc: ColorToken, _ dc: ColorToken) -> Color {
        dyn(parseColorString(lc.value), parseColorString(dc.value))
    }
    func resolveOpt(_ lc: ColorToken?, _ dc: ColorToken?) -> Color? {
        guard let lc, let dc else { return nil }
        return resolve(lc, dc)
    }
    return ColorSet(
        default: resolve(l.defaultColor, d.defaultColor),
        hover: resolveOpt(l.hover, d.hover),
        pressed: resolveOpt(l.pressed, d.pressed),
        disabled: resolveOpt(l.disabled, d.disabled),
        focus: resolveOpt(l.focus, d.focus)
    )
}

// MARK: - Aggregated category structs

public struct ThemeColors: Sendable {
    public let primary: ColorSet
    public let secondary: ColorSet
    public let tertiary: ColorSet
    public let success: ColorSet
    public let warning: ColorSet
    public let warningContainer: ColorSet
    public let onWarningContainer: ColorSet
    public let danger: ColorSet
    public let info: ColorSet
    public let surface: ColorSet
    public let surfaceVariant: ColorSet
    public let background: ColorSet
    public let onSurface: ColorSet
    public let onPrimary: ColorSet
    public let onSecondary: ColorSet
    public let secondaryContainer: ColorSet
    public let onSecondaryContainer: ColorSet
    public let border: ColorSet
    public let input: ColorSet
    public let ring: ColorSet
    public let card: ColorSet
    public let popover: ColorSet
    public let accent: ColorSet
    public let muted: ColorSet
    public let divider: ColorSet
    public let scrim: ColorSet
    public let routeSelected: ColorSet
    public let routeAlternate: ColorSet
}

public struct ThemeSpace: Sendable {
    public let xs: CGFloat
    public let sm: CGFloat
    public let md: CGFloat
    public let lg: CGFloat
    public let xl: CGFloat
    public let xxl: CGFloat
    public let xxxl: CGFloat
    public let xxxxl: CGFloat
}

public struct ThemeRadius: Sendable {
    public let none: CGFloat
    public let sm: CGFloat
    public let md: CGFloat
    public let lg: CGFloat
    public let xl: CGFloat
    public let xxl: CGFloat
    public let full: CGFloat
}

public struct ThemeTypeScale: Sendable {
    public let sm: TypographyStyle
    public let md: TypographyStyle
    public let lg: TypographyStyle
}

public struct ThemeType: Sendable {
    public let label: ThemeTypeScale
    public let body: ThemeTypeScale
    public let title: ThemeTypeScale
    public let heading: ThemeTypeScale
    public let display: ThemeTypeScale
}

public struct ThemeElevation: Sendable {
    public let level0: ElevationStyle
    public let level1: ElevationStyle
    public let level2: ElevationStyle
    public let level3: ElevationStyle
    public let level4: ElevationStyle
    public let level5: ElevationStyle
}

public struct Theme: Sendable {
    public let colors: ThemeColors
    public let space: ThemeSpace
    public let radius: ThemeRadius
    public let type: ThemeType
    public let elevation: ThemeElevation
    public let domain: DomainColors

    /// Resolved once at first access by decoding the bundled semantic.tokens.json.
    public static let shared: Theme = build(from: ThemeLoader.loadSemanticTokens())
}

// MARK: - Builders

private extension Theme {
    static func build(from tokens: SemanticTokens) -> Theme {
        Theme(
            colors: buildColors(from: tokens),
            space: buildSpace(from: tokens),
            radius: buildRadius(from: tokens),
            type: buildType(from: tokens),
            elevation: buildElevation(from: tokens),
            domain: DomainColors.build(from: tokens)
        )
    }

    static func buildColors(from tokens: SemanticTokens) -> ThemeColors {
        let L = tokens.color.light
        let D = tokens.color.dark
        return ThemeColors(
            primary: makeColorSet(L, D, "primary"),
            secondary: makeColorSet(L, D, "secondary"),
            tertiary: makeColorSet(L, D, "tertiary"),
            success: makeColorSet(L, D, "success"),
            warning: makeColorSet(L, D, "warning"),
            warningContainer: makeColorSet(L, D, "warningContainer"),
            onWarningContainer: makeColorSet(L, D, "onWarningContainer"),
            danger: makeColorSet(L, D, "danger"),
            info: makeColorSet(L, D, "info"),
            surface: makeColorSet(L, D, "surface"),
            surfaceVariant: makeColorSet(L, D, "surfaceVariant"),
            background: makeColorSet(L, D, "background"),
            onSurface: makeColorSet(L, D, "onSurface"),
            onPrimary: makeColorSet(L, D, "onPrimary"),
            onSecondary: makeColorSet(L, D, "onSecondary"),
            secondaryContainer: makeColorSet(L, D, "secondaryContainer"),
            onSecondaryContainer: makeColorSet(L, D, "onSecondaryContainer"),
            border: makeColorSet(L, D, "border"),
            input: makeColorSet(L, D, "input"),
            ring: makeColorSet(L, D, "ring"),
            card: makeColorSet(L, D, "card"),
            popover: makeColorSet(L, D, "popover"),
            accent: makeColorSet(L, D, "accent"),
            muted: makeColorSet(L, D, "muted"),
            divider: makeColorSet(L, D, "divider"),
            scrim: makeColorSet(L, D, "scrim"),
            routeSelected: makeColorSet(L, D, "routeSelected"),
            routeAlternate: makeColorSet(L, D, "routeAlternate")
        )
    }

    static func buildSpace(from tokens: SemanticTokens) -> ThemeSpace {
        let s = tokens.space
        return ThemeSpace(
            xs: CGFloat(s["xs"]!.value),
            sm: CGFloat(s["sm"]!.value),
            md: CGFloat(s["md"]!.value),
            lg: CGFloat(s["lg"]!.value),
            xl: CGFloat(s["xl"]!.value),
            xxl: CGFloat(s["2xl"]!.value),
            xxxl: CGFloat(s["3xl"]!.value),
            xxxxl: CGFloat(s["4xl"]!.value)
        )
    }

    static func buildRadius(from tokens: SemanticTokens) -> ThemeRadius {
        let r = tokens.radius
        return ThemeRadius(
            none: CGFloat(r["none"]!.value),
            sm: CGFloat(r["sm"]!.value),
            md: CGFloat(r["md"]!.value),
            lg: CGFloat(r["lg"]!.value),
            xl: CGFloat(r["xl"]!.value),
            xxl: CGFloat(r["2xl"]!.value),
            full: CGFloat(r["full"]!.value)
        )
    }

    static func typographyStyle(from def: TypeStyleDef) -> TypographyStyle {
        TypographyStyle(
            fontSize: CGFloat(def.fontSize.value),
            lineHeight: CGFloat(def.lineHeight.value),
            fontWeight: fontWeight(from: def.fontWeight.value)
        )
    }

    static func buildType(from tokens: SemanticTokens) -> ThemeType {
        let t = tokens.type
        return ThemeType(
            label: ThemeTypeScale(
                sm: typographyStyle(from: t.label.sm),
                md: typographyStyle(from: t.label.md),
                lg: typographyStyle(from: t.label.lg)
            ),
            body: ThemeTypeScale(
                sm: typographyStyle(from: t.body.sm),
                md: typographyStyle(from: t.body.md),
                lg: typographyStyle(from: t.body.lg)
            ),
            title: ThemeTypeScale(
                sm: typographyStyle(from: t.title.sm),
                md: typographyStyle(from: t.title.md),
                lg: typographyStyle(from: t.title.lg)
            ),
            heading: ThemeTypeScale(
                sm: typographyStyle(from: t.heading.sm),
                md: typographyStyle(from: t.heading.md),
                lg: typographyStyle(from: t.heading.lg)
            ),
            display: ThemeTypeScale(
                sm: typographyStyle(from: t.display.sm),
                md: typographyStyle(from: t.display.md),
                lg: typographyStyle(from: t.display.lg)
            )
        )
    }

    static func elevationStyle(from def: ElevationDef) -> ElevationStyle {
        ElevationStyle(
            shadowColor: parseColorString(def.shadowColor.value),
            offsetX: CGFloat(def.shadowOffset.width.value),
            offsetY: CGFloat(def.shadowOffset.height.value),
            opacity: def.shadowOpacity.value,
            radius: CGFloat(def.shadowRadius.value),
            elevation: CGFloat(def.elevation.value)
        )
    }

    static func buildElevation(from tokens: SemanticTokens) -> ThemeElevation {
        let e = tokens.elevation.light
        return ThemeElevation(
            level0: elevationStyle(from: e["0"]!),
            level1: elevationStyle(from: e["1"]!),
            level2: elevationStyle(from: e["2"]!),
            level3: elevationStyle(from: e["3"]!),
            level4: elevationStyle(from: e["4"]!),
            level5: elevationStyle(from: e["5"]!)
        )
    }
}
