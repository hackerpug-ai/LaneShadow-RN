package com.laneshadow.data.dto

import com.laneshadow.data.favorites.FavoriteLocation
import kotlinx.serialization.Serializable

/**
 * Convex DTO for favorite location query response
 * Matches: server/convex/db/favorites.ts listFavoriteLocations returns
 */
@Serializable
data class FavoriteLocationDto(
    val id: String,
    val lat: Double,
    val lng: Double,
    val label: String,
    val bounds: BoundsDto? = null,
) {
    fun toDomain(): FavoriteLocation =
        FavoriteLocation(
            id = id,
            lat = lat,
            lon = lng,
            label = label,
        )
}

@Serializable
data class BoundsDto(
    val north: Double,
    val south: Double,
    val east: Double,
    val west: Double,
)
