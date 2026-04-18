package com.laneshadow.theme

import com.laneshadow.theme.generated.Tokens

data class LaneShadowColors(
    val primary: ColorSet,
    val secondary: ColorSet,
    val tertiary: ColorSet,
    val success: ColorSet,
    val warning: ColorSet,
    val warningContainer: ColorSet,
    val onWarningContainer: ColorSet,
    val danger: ColorSet,
    val info: ColorSet,
    val surface: ColorSet,
    val surfaceVariant: ColorSet,
    val background: ColorSet,
    val onSurface: ColorSet,
    val onPrimary: ColorSet,
    val onSecondary: ColorSet,
    val secondaryContainer: ColorSet,
    val onSecondaryContainer: ColorSet,
    val border: ColorSet,
    val input: ColorSet,
    val ring: ColorSet,
    val card: ColorSet,
    val popover: ColorSet,
    val accent: ColorSet,
    val muted: ColorSet,
    val divider: ColorSet,
    val scrim: ColorSet,
    val routeSelected: ColorSet,
    val routeAlternate: ColorSet,
) {
    companion object {
        fun light(): LaneShadowColors {
            val L = Tokens.Semantic.Color.Light
            return LaneShadowColors(
                primary = ColorSet(L.Primary.`default`, L.Primary.hover, L.Primary.pressed, L.Primary.disabled),
                secondary = ColorSet(L.Secondary.`default`, L.Secondary.hover, L.Secondary.pressed, L.Secondary.disabled),
                tertiary = ColorSet(L.Tertiary.`default`, L.Tertiary.hover, L.Tertiary.pressed, L.Tertiary.disabled),
                success = ColorSet(L.Success.`default`, L.Success.hover, L.Success.pressed, L.Success.disabled),
                warning = ColorSet(L.Warning.`default`, L.Warning.hover, L.Warning.pressed, L.Warning.disabled),
                warningContainer = ColorSet(L.WarningContainer.`default`, L.WarningContainer.hover, L.WarningContainer.pressed, L.WarningContainer.disabled),
                onWarningContainer = ColorSet(L.OnWarningContainer.`default`, L.OnWarningContainer.hover, L.OnWarningContainer.pressed, L.OnWarningContainer.disabled),
                danger = ColorSet(L.Danger.`default`, L.Danger.hover, L.Danger.pressed, L.Danger.disabled),
                info = ColorSet(L.Info.`default`, L.Info.hover, L.Info.pressed, L.Info.disabled),
                surface = ColorSet(L.Surface.`default`, L.Surface.hover, L.Surface.pressed, L.Surface.disabled),
                surfaceVariant = ColorSet(L.SurfaceVariant.`default`, L.SurfaceVariant.hover, L.SurfaceVariant.pressed, L.SurfaceVariant.disabled),
                background = ColorSet(L.Background.`default`, L.Background.hover, L.Background.pressed, L.Background.disabled),
                onSurface = ColorSet(L.OnSurface.`default`, L.OnSurface.hover, L.OnSurface.pressed, L.OnSurface.disabled),
                onPrimary = ColorSet(L.OnPrimary.`default`, L.OnPrimary.hover, L.OnPrimary.pressed, L.OnPrimary.disabled),
                onSecondary = ColorSet(L.OnSecondary.`default`, L.OnSecondary.hover, L.OnSecondary.pressed, L.OnSecondary.disabled),
                secondaryContainer = ColorSet(L.SecondaryContainer.`default`, L.SecondaryContainer.hover, L.SecondaryContainer.pressed, L.SecondaryContainer.disabled),
                onSecondaryContainer = ColorSet(L.OnSecondaryContainer.`default`, L.OnSecondaryContainer.hover, L.OnSecondaryContainer.pressed, L.OnSecondaryContainer.disabled),
                border = ColorSet(L.Border.`default`, L.Border.hover, L.Border.pressed, L.Border.disabled),
                input = ColorSet(L.Input.`default`, L.Input.hover, L.Input.pressed, L.Input.disabled),
                ring = ColorSet(L.Ring.`default`, L.Ring.hover, L.Ring.pressed, L.Ring.disabled),
                card = ColorSet(L.Card.`default`, L.Card.hover, L.Card.pressed, L.Card.disabled),
                popover = ColorSet(L.Popover.`default`, L.Popover.hover, L.Popover.pressed, L.Popover.disabled),
                accent = ColorSet(L.Accent.`default`, L.Accent.hover, L.Accent.pressed, L.Accent.disabled),
                muted = ColorSet(L.Muted.`default`, L.Muted.hover, L.Muted.pressed, L.Muted.disabled),
                divider = ColorSet(L.Divider.`default`),
                scrim = ColorSet(L.Scrim.`default`),
                routeSelected = ColorSet(L.RouteSelected.`default`, L.RouteSelected.hover, L.RouteSelected.pressed),
                routeAlternate = ColorSet(L.RouteAlternate.`default`),
            )
        }

        fun dark(): LaneShadowColors {
            val D = Tokens.Semantic.Color.Dark
            return LaneShadowColors(
                primary = ColorSet(D.Primary.`default`, D.Primary.hover, D.Primary.pressed, D.Primary.disabled),
                secondary = ColorSet(D.Secondary.`default`, D.Secondary.hover, D.Secondary.pressed, D.Secondary.disabled),
                tertiary = ColorSet(D.Tertiary.`default`, D.Tertiary.hover, D.Tertiary.pressed, D.Tertiary.disabled),
                success = ColorSet(D.Success.`default`, D.Success.hover, D.Success.pressed, D.Success.disabled),
                warning = ColorSet(D.Warning.`default`, D.Warning.hover, D.Warning.pressed, D.Warning.disabled),
                warningContainer = ColorSet(D.WarningContainer.`default`, D.WarningContainer.hover, D.WarningContainer.pressed, D.WarningContainer.disabled),
                onWarningContainer = ColorSet(D.OnWarningContainer.`default`, D.OnWarningContainer.hover, D.OnWarningContainer.pressed, D.OnWarningContainer.disabled),
                danger = ColorSet(D.Danger.`default`, D.Danger.hover, D.Danger.pressed, D.Danger.disabled),
                info = ColorSet(D.Info.`default`, D.Info.hover, D.Info.pressed, D.Info.disabled),
                surface = ColorSet(D.Surface.`default`, D.Surface.hover, D.Surface.pressed, D.Surface.disabled),
                surfaceVariant = ColorSet(D.SurfaceVariant.`default`, D.SurfaceVariant.hover, D.SurfaceVariant.pressed, D.SurfaceVariant.disabled),
                background = ColorSet(D.Background.`default`, D.Background.hover, D.Background.pressed, D.Background.disabled),
                onSurface = ColorSet(D.OnSurface.`default`, D.OnSurface.hover, D.OnSurface.pressed, D.OnSurface.disabled),
                onPrimary = ColorSet(D.OnPrimary.`default`, D.OnPrimary.hover, D.OnPrimary.pressed, D.OnPrimary.disabled),
                onSecondary = ColorSet(D.OnSecondary.`default`, D.OnSecondary.hover, D.OnSecondary.pressed, D.OnSecondary.disabled),
                secondaryContainer = ColorSet(D.SecondaryContainer.`default`, D.SecondaryContainer.hover, D.SecondaryContainer.pressed, D.SecondaryContainer.disabled),
                onSecondaryContainer = ColorSet(D.OnSecondaryContainer.`default`, D.OnSecondaryContainer.hover, D.OnSecondaryContainer.pressed, D.OnSecondaryContainer.disabled),
                border = ColorSet(D.Border.`default`, D.Border.hover, D.Border.pressed, D.Border.disabled),
                input = ColorSet(D.Input.`default`, D.Input.hover, D.Input.pressed, D.Input.disabled),
                ring = ColorSet(D.Ring.`default`, D.Ring.hover, D.Ring.pressed, D.Ring.disabled),
                card = ColorSet(D.Card.`default`, D.Card.hover, D.Card.pressed, D.Card.disabled),
                popover = ColorSet(D.Popover.`default`, D.Popover.hover, D.Popover.pressed, D.Popover.disabled),
                accent = ColorSet(D.Accent.`default`, D.Accent.hover, D.Accent.pressed, D.Accent.disabled),
                muted = ColorSet(D.Muted.`default`, D.Muted.hover, D.Muted.pressed, D.Muted.disabled),
                divider = ColorSet(D.Divider.`default`),
                scrim = ColorSet(D.Scrim.`default`),
                routeSelected = ColorSet(D.RouteSelected.`default`, D.RouteSelected.hover, D.RouteSelected.pressed),
                routeAlternate = ColorSet(D.RouteAlternate.`default`),
            )
        }
    }
}
