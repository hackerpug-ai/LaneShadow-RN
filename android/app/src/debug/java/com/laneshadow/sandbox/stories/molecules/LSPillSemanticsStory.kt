package com.laneshadow.sandbox.stories.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.PillSize
import com.laneshadow.ui.molecules.LSFilterChip
import com.laneshadow.ui.molecules.LSSuggestionChip
import com.laneshadow.ui.molecules.LSTagPill
import com.laneshadow.ui.molecules.LSWeatherBadge
import com.laneshadow.ui.molecules.WeatherCondition
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSPillSemanticsStory {
    val all: List<Story> = listOf(
        story("molecules.tagpill.default", "LSTagPill", "Tag Pill Default", "Glass-surface location tag with icon and label.") {
            LSTagPill(label = "Near Santa Cruz, CA")
        },
        story("molecules.filterchip.selected", "LSFilterChip", "Filter Chip Selected", "Selected chip uses signal surface.") {
            LSFilterChip(label = "Scenic", selected = true, onToggle = {})
        },
        story("molecules.filterchip.unselected", "LSFilterChip", "Filter Chip Unselected", "Unselected chip uses card surface with border.") {
            LSFilterChip(label = "Scenic", selected = false, onToggle = {})
        },
        story("molecules.suggestion.default", "LSSuggestionChip", "Suggestion Chip Default", "Default suggestion pill at md height.") {
            LSSuggestionChip(label = "Twisty back roads", onTap = {})
        },
        story("molecules.weather.clear.sm", "LSWeatherBadge", "Weather CLEAR SM", "Weather badge (clear) small.") {
            LSWeatherBadge(condition = WeatherCondition.Clear, label = "Clear", size = PillSize.Sm)
        },
        story("molecules.weather.clear.md", "LSWeatherBadge", "Weather CLEAR MD", "Weather badge (clear) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Clear, label = "Clear", size = PillSize.Md)
        },
        story("molecules.weather.rain.sm", "LSWeatherBadge", "Weather RAIN SM", "Weather badge (rain) small.") {
            LSWeatherBadge(condition = WeatherCondition.Rain, label = "Rain", size = PillSize.Sm)
        },
        story("molecules.weather.rain.md", "LSWeatherBadge", "Weather RAIN MD", "Weather badge (rain) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Rain, label = "Rain", size = PillSize.Md)
        },
        story("molecules.weather.wind.sm", "LSWeatherBadge", "Weather WIND SM", "Weather badge (wind) small.") {
            LSWeatherBadge(condition = WeatherCondition.Wind, label = "Wind", size = PillSize.Sm)
        },
        story("molecules.weather.wind.md", "LSWeatherBadge", "Weather WIND MD", "Weather badge (wind) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Wind, label = "Wind", size = PillSize.Md)
        },
        story("molecules.weather.storm.sm", "LSWeatherBadge", "Weather STORM SM", "Weather badge (storm) small.") {
            LSWeatherBadge(condition = WeatherCondition.Storm, label = "Storm", size = PillSize.Sm)
        },
        story("molecules.weather.storm.md", "LSWeatherBadge", "Weather STORM MD", "Weather badge (storm) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Storm, label = "Storm", size = PillSize.Md)
        },
        story("molecules.weather.hot.sm", "LSWeatherBadge", "Weather HOT SM", "Weather badge (hot) small.") {
            LSWeatherBadge(condition = WeatherCondition.Hot, label = "Hot", size = PillSize.Sm)
        },
        story("molecules.weather.hot.md", "LSWeatherBadge", "Weather HOT MD", "Weather badge (hot) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Hot, label = "Hot", size = PillSize.Md)
        },
        story("molecules.weather.cold.sm", "LSWeatherBadge", "Weather COLD SM", "Weather badge (cold) small.") {
            LSWeatherBadge(condition = WeatherCondition.Cold, label = "Cold", size = PillSize.Sm)
        },
        story("molecules.weather.cold.md", "LSWeatherBadge", "Weather COLD MD", "Weather badge (cold) medium.") {
            LSWeatherBadge(condition = WeatherCondition.Cold, label = "Cold", size = PillSize.Md)
        },
    )
}

private fun story(
    id: String,
    component: String,
    name: String,
    summary: String,
    content: @Composable () -> Unit,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Molecule,
        component = component,
        name = name,
        summary = summary,
        content = {
            val theme = LocalLaneShadowTheme.current
            Column(
                modifier = Modifier.padding(theme.space.lg),
                verticalArrangement = Arrangement.spacedBy(theme.space.md),
            ) {
                content()
            }
        },
    )
