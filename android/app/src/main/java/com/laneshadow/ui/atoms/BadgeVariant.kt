package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import dev.nativetheme.primitives.parseColorString

sealed interface BadgeVariant {
    sealed interface Status : BadgeVariant {
        data object Info : Status

        data object Success : Status

        data object Warning : Status

        data object Error : Status

        data object Recording : Status
    }

    sealed interface Weather : BadgeVariant {
        data object Clear : Weather

        data object Rain : Weather

        data object Wind : Weather

        data object Storm : Weather

        data object Hot : Weather

        data object Cold : Weather
    }
}

internal fun BadgeVariant.resolveStyle(theme: LaneShadowThemeValues): LSBadgeResolvedStyle =
    when (this) {
        BadgeVariant.Status.Info -> statusStyle(
            backgroundColor = badgeColor("#DBEAFE"),
            foregroundColor = GeneratedTokens.color.Status.Info.default,
        )
        BadgeVariant.Status.Success -> statusStyle(
            backgroundColor = badgeColor("#DCFCE7"),
            foregroundColor = GeneratedTokens.color.Status.Success.default,
        )
        BadgeVariant.Status.Warning -> statusStyle(
            backgroundColor = badgeColor("#FEF3C7"),
            foregroundColor = GeneratedTokens.color.Status.Warning.default,
        )
        BadgeVariant.Status.Error -> statusStyle(
            backgroundColor = badgeColor("#FEE2E2"),
            foregroundColor = GeneratedTokens.color.Status.Error.default,
        )
        BadgeVariant.Status.Recording -> statusStyle(
            backgroundColor = badgeColor("#FEE2E2"),
            foregroundColor = GeneratedTokens.color.Status.Error.default,
        )
        BadgeVariant.Weather.Clear -> weatherStyle(
            backgroundColor = badgeColor("#FBEFCF"),
            foregroundColor = GeneratedTokens.color.Weather.Clear.default,
            iconName = IconName.Sun,
            iconColor = IconColor.Weather(WeatherColor.Clear),
            borderAlpha = weatherBorderAlpha(theme),
        )
        BadgeVariant.Weather.Rain -> weatherStyle(
            backgroundColor = badgeColor("#DBEAF4"),
            foregroundColor = GeneratedTokens.color.Weather.Rain.default,
            iconName = IconName.Rain,
            iconColor = IconColor.Weather(WeatherColor.Rain),
            borderAlpha = weatherBorderAlpha(theme),
        )
        BadgeVariant.Weather.Wind -> weatherStyle(
            backgroundColor = badgeColor("#E1E6EC"),
            foregroundColor = GeneratedTokens.color.Weather.Wind.default,
            iconName = IconName.Wind,
            iconColor = IconColor.Weather(WeatherColor.Wind),
            borderAlpha = weatherBorderAlpha(theme),
        )
        BadgeVariant.Weather.Storm -> weatherStyle(
            backgroundColor = badgeColor("#E3DCF2"),
            foregroundColor = GeneratedTokens.color.Weather.Storm.default,
            iconName = IconName.Storm,
            iconColor = IconColor.Weather(WeatherColor.Storm),
            borderAlpha = weatherBorderAlpha(theme),
        )
        BadgeVariant.Weather.Hot -> weatherStyle(
            backgroundColor = badgeColor("#F5D8D6"),
            foregroundColor = GeneratedTokens.color.Weather.Hot.default,
            iconName = IconName.Therm,
            iconColor = IconColor.Weather(WeatherColor.Hot),
            borderAlpha = weatherBorderAlpha(theme),
        )
        BadgeVariant.Weather.Cold -> weatherStyle(
            backgroundColor = badgeColor("#D6E5F7"),
            foregroundColor = GeneratedTokens.color.Weather.Cold.default,
            iconName = IconName.Wind,
            iconColor = IconColor.Weather(WeatherColor.Cold),
            borderAlpha = weatherBorderAlpha(theme),
        )
    }

private fun statusStyle(
    backgroundColor: Color,
    foregroundColor: Color,
): LSBadgeResolvedStyle =
    LSBadgeResolvedStyle(
        backgroundColor = backgroundColor,
        foregroundColor = foregroundColor,
    )

private fun weatherStyle(
    backgroundColor: Color,
    foregroundColor: Color,
    iconName: IconName,
    iconColor: IconColor,
    borderAlpha: Float,
): LSBadgeResolvedStyle =
    LSBadgeResolvedStyle(
        backgroundColor = backgroundColor,
        foregroundColor = foregroundColor,
        borderColor = foregroundColor.copy(alpha = borderAlpha),
        borderWidth = BadgeBorderWidth,
        leadingIcon = iconName,
        leadingIconColor = iconColor,
    )

internal fun badgeColor(hex: String): Color = parseColorString(hex)
