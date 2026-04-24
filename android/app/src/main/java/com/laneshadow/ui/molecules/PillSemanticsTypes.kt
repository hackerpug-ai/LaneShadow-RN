package com.laneshadow.ui.molecules

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.generated.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.atoms.WeatherColor

enum class AccentColor {
    Muted,
    Signal,
    Success,
    Warning,
    Error,
}

sealed interface WeatherCondition {
    data object Sun : WeatherCondition

    data object Rain : WeatherCondition

    data object Wind : WeatherCondition

    data object Storm : WeatherCondition

    data object Hot : WeatherCondition

    data object Cold : WeatherCondition

    companion object {
        val all: List<WeatherCondition> = listOf(Sun, Rain, Wind, Storm, Hot, Cold)
    }
}

data class TagPillStyle(
    val backgroundColor: Color,
    val borderColor: Color,
    val iconColor: IconColor,
    val labelColor: ContentColor,
    val leadingIcon: IconName,
    val labelVariant: TypographyVariant,
)

data class FilterChipStyle(
    val backgroundColor: Color,
    val borderColor: Color,
    val labelColor: ContentColor,
    val labelVariant: TypographyVariant,
)

data class SuggestionChipStyle(
    val backgroundColor: Color,
    val borderColor: Color,
    val labelColor: ContentColor,
    val labelVariant: TypographyVariant,
)

data class WeatherBadgeStyle(
    val backgroundColor: Color,
    val foregroundColor: Color,
    val borderColor: Color,
    val leadingIcon: IconName,
    val iconColor: IconColor,
    val labelVariant: TypographyVariant,
)

val TagPillLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Sm

internal val FilterChipLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Md
internal val SuggestionChipLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Md
internal val WeatherBadgeLabelVariant: TypographyVariant = TypographyVariant.Ui.Label.Sm

fun resolveTagPillStyle(accent: AccentColor): TagPillStyle =
    when (accent) {
        AccentColor.Muted -> TagPillStyle(
            backgroundColor = LaneShadowTheme.color.Surface.glass,
            borderColor = LaneShadowTheme.color.Border.glass,
            iconColor = IconColor.Signal,
            labelColor = ContentColor.Secondary,
            leadingIcon = IconName.Pin,
            labelVariant = TagPillLabelVariant,
        )
        AccentColor.Signal -> TagPillStyle(
            backgroundColor = LaneShadowTheme.color.Signal.whisper,
            borderColor = LaneShadowTheme.color.Signal.tint,
            iconColor = IconColor.Signal,
            labelColor = ContentColor.Signal,
            leadingIcon = IconName.Pin,
            labelVariant = TagPillLabelVariant,
        )
        AccentColor.Success -> TagPillStyle(
            backgroundColor = LaneShadowTheme.color.Status.Success.tint,
            borderColor = LaneShadowTheme.color.Status.Success.default,
            iconColor = IconColor.Signal,
            labelColor = ContentColor.Primary,
            leadingIcon = IconName.Pin,
            labelVariant = TagPillLabelVariant,
        )
        AccentColor.Warning -> TagPillStyle(
            backgroundColor = LaneShadowTheme.color.Status.Warning.tint,
            borderColor = LaneShadowTheme.color.Status.Warning.default,
            iconColor = IconColor.Signal,
            labelColor = ContentColor.Primary,
            leadingIcon = IconName.Pin,
            labelVariant = TagPillLabelVariant,
        )
        AccentColor.Error -> TagPillStyle(
            backgroundColor = LaneShadowTheme.color.Status.Error.tint,
            borderColor = LaneShadowTheme.color.Status.Error.default,
            iconColor = IconColor.Signal,
            labelColor = ContentColor.Primary,
            leadingIcon = IconName.Pin,
            labelVariant = TagPillLabelVariant,
        )
    }

fun resolveFilterChipStyle(selected: Boolean): FilterChipStyle =
    if (selected) {
        FilterChipStyle(
            backgroundColor = LaneShadowTheme.color.Signal.default,
            borderColor = LaneShadowTheme.color.Signal.default,
            labelColor = ContentColor.OnSignal,
            labelVariant = FilterChipLabelVariant,
        )
    } else {
        FilterChipStyle(
            backgroundColor = LaneShadowTheme.color.Surface.card,
            borderColor = LaneShadowTheme.color.Border.default,
            labelColor = ContentColor.Secondary,
            labelVariant = FilterChipLabelVariant,
        )
    }

fun resolveSuggestionChipStyle(primed: Boolean): SuggestionChipStyle =
    if (primed) {
        SuggestionChipStyle(
            backgroundColor = LaneShadowTheme.color.Signal.whisper,
            borderColor = LaneShadowTheme.color.Signal.tint,
            labelColor = ContentColor.Signal,
            labelVariant = SuggestionChipLabelVariant,
        )
    } else {
        SuggestionChipStyle(
            backgroundColor = LaneShadowTheme.color.Surface.card,
            borderColor = LaneShadowTheme.color.Border.default,
            labelColor = ContentColor.Secondary,
            labelVariant = SuggestionChipLabelVariant,
        )
    }

fun WeatherCondition.resolveWeatherBadgeStyle(): WeatherBadgeStyle =
    when (this) {
        WeatherCondition.Sun -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Clear.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Clear.default,
            icon = IconName.Sun,
            iconColor = IconColor.Weather(WeatherColor.Clear),
        )
        WeatherCondition.Rain -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Rain.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Rain.default,
            icon = IconName.Rain,
            iconColor = IconColor.Weather(WeatherColor.Rain),
        )
        WeatherCondition.Wind -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Wind.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Wind.default,
            icon = IconName.Wind,
            iconColor = IconColor.Weather(WeatherColor.Wind),
        )
        WeatherCondition.Storm -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Storm.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Storm.default,
            icon = IconName.Storm,
            iconColor = IconColor.Weather(WeatherColor.Storm),
        )
        WeatherCondition.Hot -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Hot.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Hot.default,
            icon = IconName.Therm,
            iconColor = IconColor.Weather(WeatherColor.Hot),
        )
        WeatherCondition.Cold -> weatherStyle(
            backgroundColor = LaneShadowTheme.color.Weather.Cold.tint,
            foregroundColor = LaneShadowTheme.color.Weather.Cold.default,
            icon = IconName.Therm,
            iconColor = IconColor.Weather(WeatherColor.Cold),
        )
    }

private fun weatherStyle(
    backgroundColor: Color,
    foregroundColor: Color,
    icon: IconName,
    iconColor: IconColor,
): WeatherBadgeStyle =
    WeatherBadgeStyle(
        backgroundColor = backgroundColor,
        foregroundColor = foregroundColor,
        borderColor = foregroundColor,
        leadingIcon = icon,
        iconColor = iconColor,
        labelVariant = WeatherBadgeLabelVariant,
    )
