package com.laneshadow.ui.atoms

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens

val LSTextColorKey = SemanticsPropertyKey<Color>("LSTextColor")

private var SemanticsPropertyReceiver.lsTextColor by LSTextColorKey

sealed interface TextColor {
    data class Content(val value: ContentColor) : TextColor
    data object Signal : TextColor
    data class Status(val value: StatusColor) : TextColor
    data class Weather(val value: WeatherColor) : TextColor
}

fun TextColor.resolve(theme: LaneShadowThemeValues): Color =
    when (this) {
        is TextColor.Content -> value.resolve(theme)
        TextColor.Signal -> theme.colors.primary.default
        is TextColor.Status -> value.resolve()
        is TextColor.Weather -> value.resolve()
    }

fun IconColor.asTextColor(): TextColor =
    when (this) {
        is IconColor.Content -> TextColor.Content(value)
        IconColor.Signal -> TextColor.Signal
        is IconColor.Status -> TextColor.Status(value)
        is IconColor.Weather -> TextColor.Weather(value)
    }

@Composable
fun LSText(
    text: String,
    variant: TypographyVariant,
    color: ContentColor = ContentColor.Primary,
    modifier: Modifier = Modifier,
) {
    LSText(
        text = text,
        variant = variant,
        color = TextColor.Content(color),
        modifier = modifier,
    )
}

@Composable
fun LSText(
    text: String,
    variant: TypographyVariant,
    color: TextColor,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val resolvedColor = color.resolve(theme)

    Text(
        text = text,
        modifier = modifier.semantics {
            lsTextColor = resolvedColor
        },
        style = variant.resolveTextStyle(theme),
        color = resolvedColor,
    )
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
