package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant

/**
 * LSWeatherTimeline molecule component
 *
 * Horizontal weather timeline showing hourly forecast with condition-tinted cells.
 * Follows the design spec at .spec/design/system/molecules/weather-timeline/
 *
 * @param entries List of weather timeline entries (hour, condition, temperature)
 * @param from Start time label (e.g., "9 AM")
 * @param to End time label (e.g., "2 PM")
 * @param modifier Modifier for the timeline container
 */
@Composable
fun LSWeatherTimeline(
    entries: List<WeatherTimelineEntry>,
    from: String,
    to: String,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier.padding(theme.space.md, theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        // Header row: title + time span
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            LSText(
                text = "Weather along the way",
                variant = TypographyVariant.Ui.Label.Md,
                color = ContentColor.Primary,
            )

            LSText(
                text = "$from — $to",
                variant = TypographyVariant.Instrument.Xs,
                color = ContentColor.Subtle,
            )
        }

        // Horizontal scrollable cell grid
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
            contentPadding = PaddingValues(horizontal = theme.space.xs),
        ) {
            items(entries) { entry ->
                WeatherCell(entry = entry)
            }
        }
    }
}

/**
 * Individual weather cell with condition tint, icon, hour, and temperature
 */
@Composable
private fun WeatherCell(entry: WeatherTimelineEntry) {
    val theme = LocalLaneShadowTheme.current

    // Get condition tint color
    val tintBg =
        when (entry.condition) {
            is WeatherCondition.Clear -> GeneratedTokens.color.Weather.Clear.tint
            is WeatherCondition.Rain -> GeneratedTokens.color.Weather.Rain.tint
            is WeatherCondition.Wind -> GeneratedTokens.color.Weather.Wind.tint
            is WeatherCondition.Storm -> GeneratedTokens.color.Weather.Storm.tint
            is WeatherCondition.Hot -> GeneratedTokens.color.Weather.Hot.tint
            is WeatherCondition.Cold -> GeneratedTokens.color.Weather.Cold.tint
        }

    // Get condition icon
    val icon = WeatherCondition.icon(entry.condition)

    Box(
        modifier = Modifier
            .width(72.dp)
            .background(tintBg)
            .padding(theme.space.sm),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(theme.space.xs),
        ) {
            // Hour label
            LSText(
                text = entry.hour,
                variant = TypographyVariant.Ui.Label.Sm,
                color = ContentColor.Secondary,
            )

            // Weather condition icon
            LSIcon(
                name = icon,
                size = IconSize.Md,
                color = IconColor.Content(ContentColor.Primary),
            )

            // Temperature
            LSText(
                text = entry.temperature,
                variant = TypographyVariant.Instrument.Sm,
                color = ContentColor.Primary,
            )
        }
    }
}
