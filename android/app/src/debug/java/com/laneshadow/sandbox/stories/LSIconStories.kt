package com.laneshadow.sandbox.stories

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.StatusColor
import com.laneshadow.ui.atoms.WeatherColor
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSIconStories {
    val all: List<Story> = listOf(
        Story(
            id = "atoms.icon.catalog",
            tier = ComponentTier.Atom,
            component = "LSIcon",
            name = "Catalog",
            summary = "Design-owned icon catalog rendered at the default icon size.",
            content = { LSIconCatalogStory() },
        ),
        Story(
            id = "atoms.icon.color-overrides",
            tier = ComponentTier.Atom,
            component = "LSIcon",
            name = "Color Overrides",
            summary = "Icon color variants resolved through typed token-backed icon colors.",
            content = { LSIconColorOverridesStory() },
        ),
    )
}

@Composable
@OptIn(ExperimentalLayoutApi::class)
private fun LSIconCatalogStory() {
    val theme = LocalLaneShadowTheme.current

    FlowRow(
        modifier = Modifier.padding(theme.space.lg),
        horizontalArrangement = Arrangement.spacedBy(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.lg),
    ) {
        IconName.entries.forEach { iconName ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(theme.space.xs),
            ) {
                LSIcon(name = iconName, size = IconSize.Md)
                Text(
                    text = iconName.value,
                    style = theme.type.label.sm,
                    color = theme.colors.onSurface.default,
                )
            }
        }
    }
}

@Composable
private fun LSIconColorOverridesStory() {
    val theme = LocalLaneShadowTheme.current
    val samples = listOf(
        Triple(IconName.Compass, IconColor.Content(ContentColor.Primary), "content.primary"),
        Triple(IconName.Route, IconColor.Content(ContentColor.Secondary), "content.secondary"),
        Triple(IconName.StarFill, IconColor.Signal, "signal.default"),
        Triple(IconName.Clock, IconColor.Status(StatusColor.Info), "status.info"),
        Triple(IconName.Trash, IconColor.Status(StatusColor.Error), "status.error"),
        Triple(IconName.Sun, IconColor.Weather(WeatherColor.Clear), "weather.clear"),
        Triple(IconName.Rain, IconColor.Weather(WeatherColor.Rain), "weather.rain"),
        Triple(IconName.Wind, IconColor.Weather(WeatherColor.Wind), "weather.wind"),
    )

    Column(
        modifier = Modifier.padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        samples.forEach { (name, color, label) ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(theme.space.md),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                LSIcon(name = name, color = color, size = IconSize.Md)
                Text(
                    text = label,
                    style = theme.type.body.md,
                    color = theme.colors.onSurface.default,
                )
            }
        }
    }
}
