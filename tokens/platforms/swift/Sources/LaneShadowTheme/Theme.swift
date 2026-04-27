import CoreGraphics
import NativeTheme
import SwiftUI

// Support primitives (ColorSet, TypographyStyle, ElevationStyle, parseColorString,
// dyn, fontWeight) now come from the NativeTheme Swift Package at
// ../../../../native-theme/platforms/swift. This file owns only the LaneShadow-
// specific aggregation of those primitives into a typed Theme struct.

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
    public let xl: TypographyStyle
}

public struct ThemeType: Sendable {
    public let label: ThemeTypeScale
    public let body: ThemeTypeScale
    public let title: ThemeTypeScale
    public let heading: ThemeTypeScale
    public let display: ThemeTypeScale
    public let opinion: ThemeTypeScale
}

public struct ThemeElevation: Sendable {
    public let level0: ElevationStyle
    public let level1: ElevationStyle
    public let level2: ElevationStyle
    public let level3: ElevationStyle
    public let level4: ElevationStyle
    public let level5: ElevationStyle
    public let level8: ElevationStyle
}

public struct ThemeBorderWidth: Sendable {
    public let hairline: CGFloat
    public let thin: CGFloat
    public let normal: CGFloat
    public let thick: CGFloat
}

public struct ThemeControl: Sendable {
    public let minHeight: CGFloat
    public let minTouchTarget: CGFloat
}

public struct ThemeHitSlop: Sendable {
    public let all: CGFloat
    public let small: CGFloat
    public let medium: CGFloat
    public let large: CGFloat
}

public struct ThemeIconSize: Sendable {
    public let xsmall: CGFloat
    public let small: CGFloat
    public let medium: CGFloat
    public let large: CGFloat
    public let xlarge: CGFloat
}

public struct ThemeMotion: Sendable {
    public let duration: [String: Int]
    public let easing: [String: [Double]]
}

public struct ThemeOpacity: Sendable {
    // Semantic opacity values from semantic.tokens.json
    public let disabled: CGFloat
    public let overlay: CGFloat
    public let shadow: CGFloat
    public let shadowPrimary: CGFloat
    public let actionIdle: CGFloat
    public let actionPressed: CGFloat
    public let border: CGFloat
    public let container: CGFloat
    public let pressed: CGFloat
    public let pressedStrong: CGFloat
    public let surface: CGFloat

    /// Numeric steps as dictionary for general access (0, 5, 10, ..., 100)
    public let values: [String: CGFloat]
}

public struct ThemeShadow: Sendable {
    public let xsmall: CGFloat
    public let small: CGFloat
    public let medium: CGFloat
    public let large: CGFloat
    public let xlarge: CGFloat
}

public struct ThemeSize: Sendable {
    public let xsmall: CGFloat
    public let small: CGFloat
    public let medium: CGFloat
    public let large: CGFloat
    public let xlarge: CGFloat
}

public struct ThemeStrokeWidth: Sendable {
    public let hairline: CGFloat
    public let thin: CGFloat
    public let normal: CGFloat
    public let thick: CGFloat
}

public struct ThemeTouchTarget: Sendable {
    public let minTouchTarget: CGFloat
}

public struct Theme: Sendable {
    public let colors: ThemeColors
    public let space: ThemeSpace
    public let radius: ThemeRadius
    public let type: ThemeType
    public let elevation: ThemeElevation
    public let domain: DomainColors
    public let borderWidth: ThemeBorderWidth
    public let control: ThemeControl
    public let hitSlop: ThemeHitSlop
    public let iconSize: ThemeIconSize
    public let motion: ThemeMotion
    public let opacity: ThemeOpacity
    public let shadow: ThemeShadow
    public let size: ThemeSize
    public let strokeWidth: ThemeStrokeWidth
    public let touchTarget: ThemeTouchTarget

    /// Resolved once at first access by decoding the bundled semantic.tokens.json.
    public static let shared: Theme = build(from: ThemeLoader.loadSemanticTokens())
}

// MARK: - Builders

private extension Theme {
    static func build(from tokens: SemanticTokens) -> Theme {
        LaneShadowFontRegistry.registerFonts()
        return Theme(
            colors: buildColors(from: tokens),
            space: buildSpace(from: tokens),
            radius: buildRadius(from: tokens),
            type: buildType(from: tokens),
            elevation: buildElevation(from: tokens),
            domain: DomainColors.build(from: tokens),
            borderWidth: buildBorderWidth(from: tokens),
            control: buildControl(from: tokens),
            hitSlop: buildHitSlop(from: tokens),
            iconSize: buildIconSize(from: tokens),
            motion: buildMotion(from: tokens),
            opacity: buildOpacity(from: tokens),
            shadow: buildShadow(from: tokens),
            size: buildSize(from: tokens),
            strokeWidth: buildStrokeWidth(from: tokens),
            touchTarget: buildTouchTarget(from: tokens)
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

    static func typographyStyle(from def: TypeStyleDef, fontFamily: String) -> TypographyStyle {
        TypographyStyle(
            fontSize: CGFloat(def.fontSize.value),
            lineHeight: CGFloat(def.lineHeight.value),
            fontWeight: fontWeight(from: def.fontWeight.value),
            fontFamily: fontFamily
        )
    }

    static func buildType(from tokens: SemanticTokens) -> ThemeType {
        let t = tokens.type
        return ThemeType(
            label: ThemeTypeScale(
                sm: typographyStyle(from: t.label.sm, fontFamily: "Geist"),
                md: typographyStyle(from: t.label.md, fontFamily: "Geist"),
                lg: typographyStyle(from: t.label.lg, fontFamily: "Geist"),
                xl: typographyStyle(from: t.label.lg, fontFamily: "Geist")
            ),
            body: ThemeTypeScale(
                sm: typographyStyle(from: t.body.sm, fontFamily: "Geist"),
                md: typographyStyle(from: t.body.md, fontFamily: "Geist"),
                lg: typographyStyle(from: t.body.lg, fontFamily: "Geist"),
                xl: typographyStyle(from: t.body.lg, fontFamily: "Geist")
            ),
            title: ThemeTypeScale(
                sm: typographyStyle(from: t.title.sm, fontFamily: "Geist"),
                md: typographyStyle(from: t.title.md, fontFamily: "Geist"),
                lg: typographyStyle(from: t.title.lg, fontFamily: "Geist"),
                xl: typographyStyle(from: t.title.lg, fontFamily: "Geist")
            ),
            heading: ThemeTypeScale(
                sm: typographyStyle(from: t.heading.sm, fontFamily: "Newsreader"),
                md: typographyStyle(from: t.heading.md, fontFamily: "Newsreader"),
                lg: typographyStyle(from: t.heading.lg, fontFamily: "Newsreader"),
                xl: typographyStyle(from: t.heading.lg, fontFamily: "Newsreader")
            ),
            display: ThemeTypeScale(
                sm: typographyStyle(from: t.display.sm, fontFamily: "Newsreader"),
                md: typographyStyle(from: t.display.md, fontFamily: "Newsreader"),
                lg: typographyStyle(from: t.display.lg, fontFamily: "Newsreader"),
                xl: typographyStyle(from: t.display.lg, fontFamily: "Newsreader")
            ),
            opinion: ThemeTypeScale(
                sm: TypographyStyle(
                    fontSize: LaneShadowTheme.typography.opinionSm.fontSize,
                    lineHeight: LaneShadowTheme.typography.opinionSm.lineHeight,
                    fontWeight: LaneShadowTheme.typography.opinionSm.fontWeight,
                    fontFamily: "Newsreader"
                ),
                md: TypographyStyle(
                    fontSize: LaneShadowTheme.typography.opinionMd.fontSize,
                    lineHeight: LaneShadowTheme.typography.opinionMd.lineHeight,
                    fontWeight: LaneShadowTheme.typography.opinionMd.fontWeight,
                    fontFamily: "Newsreader"
                ),
                lg: TypographyStyle(
                    fontSize: LaneShadowTheme.typography.opinionLg.fontSize,
                    lineHeight: LaneShadowTheme.typography.opinionLg.lineHeight,
                    fontWeight: LaneShadowTheme.typography.opinionLg.fontWeight,
                    fontFamily: "Newsreader"
                ),
                xl: TypographyStyle(
                    fontSize: LaneShadowTheme.typography.opinionXl.fontSize,
                    lineHeight: LaneShadowTheme.typography.opinionXl.lineHeight,
                    fontWeight: LaneShadowTheme.typography.opinionXl.fontWeight,
                    fontFamily: "Newsreader"
                )
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
            level5: elevationStyle(from: e["5"]!),
            level8: elevationStyle(from: e["8"]!)
        )
    }

    static func buildBorderWidth(from tokens: SemanticTokens) -> ThemeBorderWidth {
        let bw = tokens.borderWidth
        return ThemeBorderWidth(
            hairline: CGFloat(bw["hairline"]!.value),
            thin: CGFloat(bw["thin"]!.value),
            normal: CGFloat(bw["normal"]!.value),
            thick: CGFloat(bw["thick"]!.value)
        )
    }

    static func buildControl(from tokens: SemanticTokens) -> ThemeControl {
        let c = tokens.control
        return ThemeControl(
            minHeight: CGFloat(c["minHeight"]!.value),
            minTouchTarget: CGFloat(c["minTouchTarget"]!.value)
        )
    }

    static func buildHitSlop(from tokens: SemanticTokens) -> ThemeHitSlop {
        let h = tokens.hitSlop
        return ThemeHitSlop(
            all: CGFloat(h["all"]!.value),
            small: CGFloat(h["small"]!.value),
            medium: CGFloat(h["medium"]!.value),
            large: CGFloat(h["large"]!.value)
        )
    }

    static func buildIconSize(from tokens: SemanticTokens) -> ThemeIconSize {
        let i = tokens.iconSize
        return ThemeIconSize(
            xsmall: CGFloat(i["xsmall"]!.value),
            small: CGFloat(i["small"]!.value),
            medium: CGFloat(i["medium"]!.value),
            large: CGFloat(i["large"]!.value),
            xlarge: CGFloat(i["xlarge"]!.value)
        )
    }

    static func buildMotion(from tokens: SemanticTokens) -> ThemeMotion {
        let m = tokens.motion
        let durationDict = m.duration.reduce(into: [String: Int]()) { dict, item in
            dict[item.key] = Int(item.value.value)
        }
        let easingDict = m.easing.reduce(into: [String: [Double]]()) { dict, item in
            dict[item.key] = item.value.value
        }
        return ThemeMotion(
            duration: durationDict,
            easing: easingDict
        )
    }

    static func buildOpacity(from tokens: SemanticTokens) -> ThemeOpacity {
        let o = tokens.opacity

        // Extract semantic named values
        let disabled = CGFloat(o["disabled"]!.value)
        let overlay = CGFloat(o["overlay"]!.value)
        let shadow = CGFloat(o["shadow"]!.value)
        let shadowPrimary = CGFloat(o["shadowPrimary"]!.value)
        let actionIdle = CGFloat(o["actionIdle"]!.value)
        let actionPressed = CGFloat(o["actionPressed"]!.value)
        let border = CGFloat(o["border"]!.value)
        let container = CGFloat(o["container"]!.value)
        let pressed = CGFloat(o["pressed"]!.value)
        let pressedStrong = CGFloat(o["pressedStrong"]!.value)
        let surface = CGFloat(o["surface"]!.value)

        // Build values dictionary for numeric step access
        var values: [String: CGFloat] = [:]
        for key in ["0", "5", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"] {
            if let token = o[key] {
                values[key] = CGFloat(token.value)
            }
        }

        return ThemeOpacity(
            disabled: disabled,
            overlay: overlay,
            shadow: shadow,
            shadowPrimary: shadowPrimary,
            actionIdle: actionIdle,
            actionPressed: actionPressed,
            border: border,
            container: container,
            pressed: pressed,
            pressedStrong: pressedStrong,
            surface: surface,
            values: values
        )
    }

    static func buildShadow(from tokens: SemanticTokens) -> ThemeShadow {
        let s = tokens.shadow
        return ThemeShadow(
            xsmall: CGFloat(s["xsmall"]!.value),
            small: CGFloat(s["small"]!.value),
            medium: CGFloat(s["medium"]!.value),
            large: CGFloat(s["large"]!.value),
            xlarge: CGFloat(s["xlarge"]!.value)
        )
    }

    static func buildSize(from tokens: SemanticTokens) -> ThemeSize {
        let s = tokens.size
        return ThemeSize(
            xsmall: CGFloat(s["xsmall"]!.value),
            small: CGFloat(s["small"]!.value),
            medium: CGFloat(s["medium"]!.value),
            large: CGFloat(s["large"]!.value),
            xlarge: CGFloat(s["xlarge"]!.value)
        )
    }

    static func buildStrokeWidth(from tokens: SemanticTokens) -> ThemeStrokeWidth {
        let sw = tokens.strokeWidth
        return ThemeStrokeWidth(
            hairline: CGFloat(sw["hairline"]!.value),
            thin: CGFloat(sw["thin"]!.value),
            normal: CGFloat(sw["normal"]!.value),
            thick: CGFloat(sw["thick"]!.value)
        )
    }

    static func buildTouchTarget(from tokens: SemanticTokens) -> ThemeTouchTarget {
        let tt = tokens.touchTarget
        return ThemeTouchTarget(
            minTouchTarget: CGFloat(tt["minTouchTarget"]!.value)
        )
    }
}
