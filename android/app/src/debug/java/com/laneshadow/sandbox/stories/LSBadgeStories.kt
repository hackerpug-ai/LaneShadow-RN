package com.laneshadow.sandbox.stories

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.BadgeVariant
import com.laneshadow.ui.atoms.LSBadge
import com.laneshadow.ui.atoms.LSBestBadge
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSBadgeStories {
    val all: List<Story> = listOf(
        badgeStory(
            id = "atoms.badge.statusInfo",
            name = "Status Info",
            summary = "Status badge using info tokens.",
        ) { LSBadge(label = "INFO", variant = BadgeVariant.Status.Info) },
        badgeStory(
            id = "atoms.badge.statusSuccess",
            name = "Status Success",
            summary = "Status badge using success tokens.",
        ) { LSBadge(label = "ON", variant = BadgeVariant.Status.Success) },
        badgeStory(
            id = "atoms.badge.statusWarning",
            name = "Status Warning",
            summary = "Status badge using warning tokens.",
        ) { LSBadge(label = "WATCH", variant = BadgeVariant.Status.Warning) },
        badgeStory(
            id = "atoms.badge.statusError",
            name = "Status Error",
            summary = "Status badge using error tokens.",
        ) { LSBadge(label = "ERROR", variant = BadgeVariant.Status.Error) },
        badgeStory(
            id = "atoms.badge.statusRecording",
            name = "Status Recording",
            summary = "Count-only recording badge using recording tokens.",
        ) { LSBadge(count = 3, variant = BadgeVariant.Status.Recording) },
        badgeStory(
            id = "atoms.badge.weatherClear",
            name = "Weather Clear",
            summary = "Weather badge with sun icon and clear token colors.",
        ) { LSBadge(label = "CLEAR", variant = BadgeVariant.Weather.Clear) },
        badgeStory(
            id = "atoms.badge.weatherRain",
            name = "Weather Rain",
            summary = "Weather badge with rain icon and rain token colors.",
        ) { LSBadge(label = "RAIN", variant = BadgeVariant.Weather.Rain) },
        badgeStory(
            id = "atoms.badge.weatherWind",
            name = "Weather Wind",
            summary = "Weather badge with wind icon and wind token colors.",
        ) { LSBadge(label = "GUSTS", variant = BadgeVariant.Weather.Wind) },
        badgeStory(
            id = "atoms.badge.weatherStorm",
            name = "Weather Storm",
            summary = "Weather badge with storm icon and storm token colors.",
        ) { LSBadge(label = "STORM", variant = BadgeVariant.Weather.Storm) },
        badgeStory(
            id = "atoms.badge.weatherHot",
            name = "Weather Hot",
            summary = "Weather badge with therm icon and hot token colors.",
        ) { LSBadge(label = "HOT", variant = BadgeVariant.Weather.Hot) },
        badgeStory(
            id = "atoms.badge.weatherCold",
            name = "Weather Cold",
            summary = "Weather badge with wind icon and cold token colors.",
        ) { LSBadge(label = "COLD", variant = BadgeVariant.Weather.Cold) },
        badgeStory(
            id = "atoms.badge.bestForToday",
            name = "Best For Today",
            summary = "Signal badge with filled star prefix.",
        ) { LSBestBadge() },
    )
}

private fun badgeStory(
    id: String,
    name: String,
    summary: String,
    content: @Composable () -> Unit,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Atom,
        component = "LSBadge",
        name = name,
        summary = summary,
        content = { BadgeStoryFrame(content) },
    )

@Composable
private fun BadgeStoryFrame(content: @Composable () -> Unit) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier.padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        content()
    }
}
