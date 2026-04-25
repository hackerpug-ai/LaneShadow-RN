package com.laneshadow.ui.organisms

import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant

/**
 * Route difficulty level for tag pill styling.
 */
enum class RouteDifficulty {
    Easy,
    Moderate,
    Hard,
    Unknown,
}

/**
 * Route card data model.
 *
 * This mirrors the routes read type in server/convex/schema.ts.
 * The organism is data-agnostic and consumes this as a prop.
 */
data class RouteCardRoute(
    val id: String,
    val title: String,
    val distance: String,
    val estimatedTime: String,
    val polyline: List<LatLng>? = null,
    val variant: RouteVariant = RouteVariant.Best,
    val difficulty: RouteDifficulty = RouteDifficulty.Unknown,
    val isSaved: Boolean = false,
)
