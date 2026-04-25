package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.organisms.LSRouteCard
import com.laneshadow.ui.organisms.RouteCardRoute
import com.laneshadow.ui.organisms.RouteDifficulty
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSRouteCardStory {
    val all: List<Story> = listOf(
        Story(
            id = "organisms.routecard.default",
            tier = ComponentTier.Organism,
            component = "LSRouteCard",
            name = "Default",
            summary = "LSCard wrapper, map preview, title ui.title.md, distance + time instrument.sm, moderate difficulty tag.",
            content = { DefaultStory() },
        ),
        Story(
            id = "organisms.routecard.saved",
            tier = ComponentTier.Organism,
            component = "LSRouteCard",
            name = "Saved",
            summary = "heartFill icon in signal copper appears in title row trailing. LSIcon(.heartFill) at signal.default color.",
            content = { SavedStory() },
        ),
        Story(
            id = "organisms.routecard.alt-variant",
            tier = ComponentTier.Organism,
            component = "LSRouteCard",
            name = "Alt Variant",
            summary = "route.variant = .alt1 → polyline stroke resolves to color.route.alt1 sage-green. Dashed alt style.",
            content = { AltVariantStory() },
        ),
        Story(
            id = "organisms.routecard.long-title-overflow",
            tier = ComponentTier.Organism,
            component = "LSRouteCard",
            name = "Long Title Overflow",
            summary = "Title truncates with ellipsis on one line. Multiple tags wrap if needed. Layout remains stable.",
            content = { LongTitleOverflowStory() },
        ),
        Story(
            id = "organisms.routecard.missing-optional-data",
            tier = ComponentTier.Organism,
            component = "LSRouteCard",
            name = "Missing Optional Data",
            summary = "No polyline, no distance, no difficulty tag. Graceful fallback: placeholder map, em-dash values, Unknown tag.",
            content = { MissingOptionalDataStory() },
        ),
        Story(
            id = "organisms.routecard.dark-mode",
            tier = ComponentTier.Organism,
            component = "LSRouteCard",
            name = "Dark Mode",
            summary = "Surface resolves to ink-700. Map paper to #1B140E. Copper polyline and badge remain vivid.",
            content = { DarkModeStory() },
        ),
    )

    // Mock route data
    private val defaultRoute = RouteCardRoute(
        id = "route-skyline-spine",
        title = "The Skyline Spine",
        distance = "47 mi",
        estimatedTime = "1h 22m",
        polyline = listOf(
            LatLng(37.7749, -122.4194),
            LatLng(37.8000, -122.4500),
            LatLng(37.8500, -122.5000),
            LatLng(37.9000, -122.5500),
            LatLng(37.9500, -122.6000),
        ),
        variant = RouteVariant.Best,
        difficulty = RouteDifficulty.Moderate,
        isSaved = false,
    )

    private val savedRoute = defaultRoute.copy(
        id = "route-saved",
        isSaved = true,
    )

    private val alt1Route = defaultRoute.copy(
        id = "route-alt1",
        title = "Old La Honda Road",
        distance = "38 mi",
        estimatedTime = "1h 05m",
        variant = RouteVariant.Alt1,
        difficulty = RouteDifficulty.Easy,
    )

    private val longTitleRoute = defaultRoute.copy(
        id = "route-long-title",
        title = "The Pacific Coast Highway Long Haul South from San Francisco to Big Sur",
        distance = "142 mi",
        estimatedTime = "3h 45m",
        difficulty = RouteDifficulty.Hard,
    )

    private val missingDataRoute = RouteCardRoute(
        id = "route-missing-data",
        title = "Unnamed Route",
        distance = "— mi",
        estimatedTime = "—",
        polyline = null,
        variant = RouteVariant.Best,
        difficulty = RouteDifficulty.Unknown,
        isSaved = false,
    )

    @Composable
    private fun DefaultStory() {
        LaneShadowTheme {
            StoryColumn {
                LSRouteCard(route = defaultRoute)
            }
        }
    }

    @Composable
    private fun SavedStory() {
        LaneShadowTheme {
            StoryColumn {
                LSRouteCard(route = savedRoute)
            }
        }
    }

    @Composable
    private fun AltVariantStory() {
        LaneShadowTheme {
            StoryColumn {
                LSRouteCard(route = alt1Route)
            }
        }
    }

    @Composable
    private fun LongTitleOverflowStory() {
        LaneShadowTheme {
            StoryColumn {
                LSRouteCard(route = longTitleRoute)
            }
        }
    }

    @Composable
    private fun MissingOptionalDataStory() {
        LaneShadowTheme {
            StoryColumn {
                LSRouteCard(route = missingDataRoute)
            }
        }
    }

    @Composable
    private fun DarkModeStory() {
        // Note: Dark mode theme would need to be configured in the sandbox
        // For now, we'll show the light mode version
        LaneShadowTheme {
            StoryColumn {
                LSRouteCard(route = savedRoute)
            }
        }
    }

    @Composable
    private fun StoryColumn(content: @Composable () -> Unit) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            content()
        }
    }
}
