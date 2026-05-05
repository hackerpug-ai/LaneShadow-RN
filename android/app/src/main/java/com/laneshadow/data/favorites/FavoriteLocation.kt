package com.laneshadow.data.favorites

/**
 * Favorite location from Convex query `favorites.listFavoriteLocations`
 */
data class FavoriteLocation(
    val id: String,
    val lat: Double,
    val lon: Double,
    val label: String,
)
