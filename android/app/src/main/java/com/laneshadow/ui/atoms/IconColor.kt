package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens

sealed interface IconColor {
    data class Content(val value: ContentColor) : IconColor
    data object Signal : IconColor
    data class Status(val value: StatusColor) : IconColor
    data class Weather(val value: WeatherColor) : IconColor
}

enum class StatusColor {
    Info,
    Success,
    Warning,
    Error,
}

enum class WeatherColor {
    Clear,
    Rain,
    Wind,
    Storm,
    Hot,
    Cold,
}

fun IconColor.resolve(theme: LaneShadowThemeValues): Color =
    when (this) {
        is IconColor.Content -> value.resolve(theme)
        IconColor.Signal -> GeneratedTokens.color.Signal.default
        is IconColor.Status -> value.resolve()
        is IconColor.Weather -> value.resolve()
    }

private fun StatusColor.resolve(): Color =
    when (this) {
        StatusColor.Info -> GeneratedTokens.color.Status.Info.default
        StatusColor.Success -> GeneratedTokens.color.Status.Success.default
        StatusColor.Warning -> GeneratedTokens.color.Status.Warning.default
        StatusColor.Error -> GeneratedTokens.color.Status.Error.default
    }

private fun WeatherColor.resolve(): Color =
    when (this) {
        WeatherColor.Clear -> GeneratedTokens.color.Weather.Clear.default
        WeatherColor.Rain -> GeneratedTokens.color.Weather.Rain.default
        WeatherColor.Wind -> GeneratedTokens.color.Weather.Wind.default
        WeatherColor.Storm -> GeneratedTokens.color.Weather.Storm.default
        WeatherColor.Hot -> GeneratedTokens.color.Weather.Hot.default
        WeatherColor.Cold -> GeneratedTokens.color.Weather.Cold.default
    }
