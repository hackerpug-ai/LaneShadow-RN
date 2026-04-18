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

    public static let shared: Theme = buildShared()
}

// MARK: - Builders (split out to keep type-checker happy + readable)

private extension Theme {
    static func buildShared() -> Theme {
        Theme(
            colors: buildColors(),
            space: buildSpace(),
            radius: buildRadius(),
            type: buildType(),
            elevation: buildElevation(),
            domain: DomainColors.shared
        )
    }

    static func buildColors() -> ThemeColors {
        let L = Tokens.Semantic.Color.Light.self
        let D = Tokens.Semantic.Color.Dark.self
        return ThemeColors(
            primary: ColorSet(
                default: dyn(L.Primary.default, D.Primary.default),
                hover: dyn(L.Primary.hover, D.Primary.hover),
                pressed: dyn(L.Primary.pressed, D.Primary.pressed),
                disabled: dyn(L.Primary.disabled, D.Primary.disabled)
            ),
            secondary: ColorSet(
                default: dyn(L.Secondary.default, D.Secondary.default),
                hover: dyn(L.Secondary.hover, D.Secondary.hover),
                pressed: dyn(L.Secondary.pressed, D.Secondary.pressed),
                disabled: dyn(L.Secondary.disabled, D.Secondary.disabled)
            ),
            tertiary: ColorSet(
                default: dyn(L.Tertiary.default, D.Tertiary.default),
                hover: dyn(L.Tertiary.hover, D.Tertiary.hover),
                pressed: dyn(L.Tertiary.pressed, D.Tertiary.pressed),
                disabled: dyn(L.Tertiary.disabled, D.Tertiary.disabled)
            ),
            success: ColorSet(
                default: dyn(L.Success.default, D.Success.default),
                hover: dyn(L.Success.hover, D.Success.hover),
                pressed: dyn(L.Success.pressed, D.Success.pressed),
                disabled: dyn(L.Success.disabled, D.Success.disabled)
            ),
            warning: ColorSet(
                default: dyn(L.Warning.default, D.Warning.default),
                hover: dyn(L.Warning.hover, D.Warning.hover),
                pressed: dyn(L.Warning.pressed, D.Warning.pressed),
                disabled: dyn(L.Warning.disabled, D.Warning.disabled)
            ),
            warningContainer: ColorSet(
                default: dyn(L.WarningContainer.default, D.WarningContainer.default),
                hover: dyn(L.WarningContainer.hover, D.WarningContainer.hover),
                pressed: dyn(L.WarningContainer.pressed, D.WarningContainer.pressed),
                disabled: dyn(L.WarningContainer.disabled, D.WarningContainer.disabled)
            ),
            onWarningContainer: ColorSet(
                default: dyn(L.OnWarningContainer.default, D.OnWarningContainer.default),
                hover: dyn(L.OnWarningContainer.hover, D.OnWarningContainer.hover),
                pressed: dyn(L.OnWarningContainer.pressed, D.OnWarningContainer.pressed),
                disabled: dyn(L.OnWarningContainer.disabled, D.OnWarningContainer.disabled)
            ),
            danger: ColorSet(
                default: dyn(L.Danger.default, D.Danger.default),
                hover: dyn(L.Danger.hover, D.Danger.hover),
                pressed: dyn(L.Danger.pressed, D.Danger.pressed),
                disabled: dyn(L.Danger.disabled, D.Danger.disabled)
            ),
            info: ColorSet(
                default: dyn(L.Info.default, D.Info.default),
                hover: dyn(L.Info.hover, D.Info.hover),
                pressed: dyn(L.Info.pressed, D.Info.pressed),
                disabled: dyn(L.Info.disabled, D.Info.disabled)
            ),
            surface: ColorSet(
                default: dyn(L.Surface.default, D.Surface.default),
                hover: dyn(L.Surface.hover, D.Surface.hover),
                pressed: dyn(L.Surface.pressed, D.Surface.pressed),
                disabled: dyn(L.Surface.disabled, D.Surface.disabled)
            ),
            surfaceVariant: ColorSet(
                default: dyn(L.SurfaceVariant.default, D.SurfaceVariant.default),
                hover: dyn(L.SurfaceVariant.hover, D.SurfaceVariant.hover),
                pressed: dyn(L.SurfaceVariant.pressed, D.SurfaceVariant.pressed),
                disabled: dyn(L.SurfaceVariant.disabled, D.SurfaceVariant.disabled)
            ),
            background: ColorSet(
                default: dyn(L.Background.default, D.Background.default),
                hover: dyn(L.Background.hover, D.Background.hover),
                pressed: dyn(L.Background.pressed, D.Background.pressed),
                disabled: dyn(L.Background.disabled, D.Background.disabled)
            ),
            onSurface: ColorSet(
                default: dyn(L.OnSurface.default, D.OnSurface.default),
                hover: dyn(L.OnSurface.hover, D.OnSurface.hover),
                pressed: dyn(L.OnSurface.pressed, D.OnSurface.pressed),
                disabled: dyn(L.OnSurface.disabled, D.OnSurface.disabled)
            ),
            onPrimary: ColorSet(
                default: dyn(L.OnPrimary.default, D.OnPrimary.default),
                hover: dyn(L.OnPrimary.hover, D.OnPrimary.hover),
                pressed: dyn(L.OnPrimary.pressed, D.OnPrimary.pressed),
                disabled: dyn(L.OnPrimary.disabled, D.OnPrimary.disabled)
            ),
            onSecondary: ColorSet(
                default: dyn(L.OnSecondary.default, D.OnSecondary.default),
                hover: dyn(L.OnSecondary.hover, D.OnSecondary.hover),
                pressed: dyn(L.OnSecondary.pressed, D.OnSecondary.pressed),
                disabled: dyn(L.OnSecondary.disabled, D.OnSecondary.disabled)
            ),
            secondaryContainer: ColorSet(
                default: dyn(L.SecondaryContainer.default, D.SecondaryContainer.default),
                hover: dyn(L.SecondaryContainer.hover, D.SecondaryContainer.hover),
                pressed: dyn(L.SecondaryContainer.pressed, D.SecondaryContainer.pressed),
                disabled: dyn(L.SecondaryContainer.disabled, D.SecondaryContainer.disabled)
            ),
            onSecondaryContainer: ColorSet(
                default: dyn(L.OnSecondaryContainer.default, D.OnSecondaryContainer.default),
                hover: dyn(L.OnSecondaryContainer.hover, D.OnSecondaryContainer.hover),
                pressed: dyn(L.OnSecondaryContainer.pressed, D.OnSecondaryContainer.pressed),
                disabled: dyn(L.OnSecondaryContainer.disabled, D.OnSecondaryContainer.disabled)
            ),
            border: ColorSet(
                default: dyn(L.Border.default, D.Border.default),
                hover: dyn(L.Border.hover, D.Border.hover),
                pressed: dyn(L.Border.pressed, D.Border.pressed),
                disabled: dyn(L.Border.disabled, D.Border.disabled)
            ),
            input: ColorSet(
                default: dyn(L.Input.default, D.Input.default),
                hover: dyn(L.Input.hover, D.Input.hover),
                pressed: dyn(L.Input.pressed, D.Input.pressed),
                disabled: dyn(L.Input.disabled, D.Input.disabled)
            ),
            ring: ColorSet(
                default: dyn(L.Ring.default, D.Ring.default),
                hover: dyn(L.Ring.hover, D.Ring.hover),
                pressed: dyn(L.Ring.pressed, D.Ring.pressed),
                disabled: dyn(L.Ring.disabled, D.Ring.disabled)
            ),
            card: ColorSet(
                default: dyn(L.Card.default, D.Card.default),
                hover: dyn(L.Card.hover, D.Card.hover),
                pressed: dyn(L.Card.pressed, D.Card.pressed),
                disabled: dyn(L.Card.disabled, D.Card.disabled)
            ),
            popover: ColorSet(
                default: dyn(L.Popover.default, D.Popover.default),
                hover: dyn(L.Popover.hover, D.Popover.hover),
                pressed: dyn(L.Popover.pressed, D.Popover.pressed),
                disabled: dyn(L.Popover.disabled, D.Popover.disabled)
            ),
            accent: ColorSet(
                default: dyn(L.Accent.default, D.Accent.default),
                hover: dyn(L.Accent.hover, D.Accent.hover),
                pressed: dyn(L.Accent.pressed, D.Accent.pressed),
                disabled: dyn(L.Accent.disabled, D.Accent.disabled)
            ),
            muted: ColorSet(
                default: dyn(L.Muted.default, D.Muted.default),
                hover: dyn(L.Muted.hover, D.Muted.hover),
                pressed: dyn(L.Muted.pressed, D.Muted.pressed),
                disabled: dyn(L.Muted.disabled, D.Muted.disabled)
            ),
            divider: ColorSet(default: dyn(L.Divider.default, D.Divider.default)),
            scrim: ColorSet(default: dyn(L.Scrim.default, D.Scrim.default)),
            routeSelected: ColorSet(
                default: dyn(L.RouteSelected.default, D.RouteSelected.default),
                hover: dyn(L.RouteSelected.hover, D.RouteSelected.hover),
                pressed: dyn(L.RouteSelected.pressed, D.RouteSelected.pressed)
            ),
            routeAlternate: ColorSet(
                default: dyn(L.RouteAlternate.default, D.RouteAlternate.default)
            )
        )
    }

    static func buildSpace() -> ThemeSpace {
        let S = Tokens.Semantic.Space.self
        return ThemeSpace(
            xs: S.xs, sm: S.sm, md: S.md, lg: S.lg,
            xl: S.xl, xxl: S._2xl, xxxl: S._3xl, xxxxl: S._4xl
        )
    }

    static func buildRadius() -> ThemeRadius {
        let R = Tokens.Semantic.Radius.self
        return ThemeRadius(
            none: R.none, sm: R.sm, md: R.md, lg: R.lg,
            xl: R.xl, xxl: R._2xl, full: R.full
        )
    }

    static func ts(_ size: CGFloat, _ lh: CGFloat, _ weightRaw: String) -> TypographyStyle {
        TypographyStyle(fontSize: size, lineHeight: lh, fontWeight: fontWeight(from: weightRaw))
    }

    static func buildType() -> ThemeType {
        let T = Tokens.Semantic.Typography.self
        return ThemeType(
            label: ThemeTypeScale(
                sm: ts(T.Label.Sm.fontSize, T.Label.Sm.lineHeight, T.Label.Sm.fontWeight),
                md: ts(T.Label.Md.fontSize, T.Label.Md.lineHeight, T.Label.Md.fontWeight),
                lg: ts(T.Label.Lg.fontSize, T.Label.Lg.lineHeight, T.Label.Lg.fontWeight)
            ),
            body: ThemeTypeScale(
                sm: ts(T.Body.Sm.fontSize, T.Body.Sm.lineHeight, T.Body.Sm.fontWeight),
                md: ts(T.Body.Md.fontSize, T.Body.Md.lineHeight, T.Body.Md.fontWeight),
                lg: ts(T.Body.Lg.fontSize, T.Body.Lg.lineHeight, T.Body.Lg.fontWeight)
            ),
            title: ThemeTypeScale(
                sm: ts(T.Title.Sm.fontSize, T.Title.Sm.lineHeight, T.Title.Sm.fontWeight),
                md: ts(T.Title.Md.fontSize, T.Title.Md.lineHeight, T.Title.Md.fontWeight),
                lg: ts(T.Title.Lg.fontSize, T.Title.Lg.lineHeight, T.Title.Lg.fontWeight)
            ),
            heading: ThemeTypeScale(
                sm: ts(T.Heading.Sm.fontSize, T.Heading.Sm.lineHeight, T.Heading.Sm.fontWeight),
                md: ts(T.Heading.Md.fontSize, T.Heading.Md.lineHeight, T.Heading.Md.fontWeight),
                lg: ts(T.Heading.Lg.fontSize, T.Heading.Lg.lineHeight, T.Heading.Lg.fontWeight)
            ),
            display: ThemeTypeScale(
                sm: ts(T.Display.Sm.fontSize, T.Display.Sm.lineHeight, T.Display.Sm.fontWeight),
                md: ts(T.Display.Md.fontSize, T.Display.Md.lineHeight, T.Display.Md.fontWeight),
                lg: ts(T.Display.Lg.fontSize, T.Display.Lg.lineHeight, T.Display.Lg.fontWeight)
            )
        )
    }

    static func el(_ shadow: Color, _ ox: CGFloat, _ oy: CGFloat, _ op: CGFloat, _ rad: CGFloat,
                   _ elv: CGFloat) -> ElevationStyle
    {
        ElevationStyle(
            shadowColor: shadow,
            offsetX: ox,
            offsetY: oy,
            opacity: Double(op),
            radius: rad,
            elevation: elv
        )
    }

    static func buildElevation() -> ThemeElevation {
        // Use the light variants as the source of truth; Compose-equivalent logic
        // would resolve dark variants similarly. For the Theme.shared singleton
        // we match the bootstrap behavior of using light tokens for shadow values.
        let E = Tokens.Semantic.Elevation.Light.self
        return ThemeElevation(
            level0: el(
                E._0.shadowColor,
                E._0.ShadowOffset.width,
                E._0.ShadowOffset.height,
                E._0.shadowOpacity,
                E._0.shadowRadius,
                E._0.elevation
            ),
            level1: el(
                E._1.shadowColor,
                E._1.ShadowOffset.width,
                E._1.ShadowOffset.height,
                E._1.shadowOpacity,
                E._1.shadowRadius,
                E._1.elevation
            ),
            level2: el(
                E._2.shadowColor,
                E._2.ShadowOffset.width,
                E._2.ShadowOffset.height,
                E._2.shadowOpacity,
                E._2.shadowRadius,
                E._2.elevation
            ),
            level3: el(
                E._3.shadowColor,
                E._3.ShadowOffset.width,
                E._3.ShadowOffset.height,
                E._3.shadowOpacity,
                E._3.shadowRadius,
                E._3.elevation
            ),
            level4: el(
                E._4.shadowColor,
                E._4.ShadowOffset.width,
                E._4.ShadowOffset.height,
                E._4.shadowOpacity,
                E._4.shadowRadius,
                E._4.elevation
            ),
            level5: el(
                E._5.shadowColor,
                E._5.ShadowOffset.width,
                E._5.ShadowOffset.height,
                E._5.shadowOpacity,
                E._5.shadowRadius,
                E._5.elevation
            )
        )
    }
}
