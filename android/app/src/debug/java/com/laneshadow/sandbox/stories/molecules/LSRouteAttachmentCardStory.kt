package com.laneshadow.sandbox.stories.molecules

import androidx.compose.runtime.Composable
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.molecules.LSRouteAttachmentCard
import com.laneshadow.ui.molecules.RouteAttachment
import com.laneshadow.ui.molecules.RouteAttachmentWeather
import com.laneshadow.ui.molecules.WeatherCondition
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSRouteAttachmentCardStory {
    val all: List<Story> = listOf(
        routeStory(
            id = "molecules.routeattachment.bestSelected",
            name = "Best Selected",
            summary = "Selected best route shows signal border, best badge, and weather.",
        ) {
            LSRouteAttachmentCard(
                route = route(variant = RouteVariant.Best, isBest = true),
                selected = true,
            )
        },
        routeStory(
            id = "molecules.routeattachment.bestCompact",
            name = "Best Compact",
            summary = "Compact layout hides best and weather badges while keeping metrics.",
        ) {
            LSRouteAttachmentCard(
                route = route(variant = RouteVariant.Best, isBest = true),
                compact = true,
            )
        },
        routeStory(
            id = "molecules.routeattachment.alt1",
            name = "Alt1",
            summary = "Alternate route one uses the alt1 leading stripe.",
        ) {
            LSRouteAttachmentCard(route = route(variant = RouteVariant.Alt1))
        },
        routeStory(
            id = "molecules.routeattachment.alt2",
            name = "Alt2",
            summary = "Alternate route two uses the alt2 leading stripe.",
        ) {
            LSRouteAttachmentCard(route = route(variant = RouteVariant.Alt2))
        },
        routeStory(
            id = "molecules.routeattachment.favoriteFlag",
            name = "With Favorite Flag",
            summary = "Favorite label row renders below the metrics row.",
        ) {
            LSRouteAttachmentCard(
                route = route(
                    variant = RouteVariant.Best,
                    includesFavorite = true,
                ),
            )
        },
        routeStory(
            id = "molecules.routeattachment.longTitle",
            name = "Long Title (Overflow)",
            summary = "Long route titles wrap within the card content column.",
        ) {
            LSRouteAttachmentCard(
                route = route(
                    variant = RouteVariant.Best,
                    title = "Pacific Coast Sweep with Skyline Ridge Detour Through the Redwood Overlook Loop",
                ),
            )
        },
    )
}

private fun routeStory(
    id: String,
    name: String,
    summary: String,
    content: @Composable () -> Unit,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Molecule,
        component = "LSRouteAttachmentCard",
        name = name,
        summary = summary,
        content = { MoleculeStoryFrame(content) },
    )

private fun route(
    variant: RouteVariant,
    title: String = "Pacific Coast Sweep",
    isBest: Boolean = false,
    includesFavorite: Boolean = false,
): RouteAttachment =
    RouteAttachment(
        id = "story-${variant.javaClass.simpleName.lowercase()}",
        title = title,
        via = "via Highway 1 and Skyline",
        distance = "82 MI",
        duration = "2H 15M",
        scenicScore = 4,
        variant = variant,
        weatherBadge = RouteAttachmentWeather(
            condition = WeatherCondition.Sun,
            label = "CLEAR",
        ),
        isBest = isBest,
        includesFavorite = includesFavorite,
    )
