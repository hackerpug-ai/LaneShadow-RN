package com.laneshadow.data.dto

import com.laneshadow.data.favorites.FavoriteLocation
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * Convex DTO for favorite location query response
 * Matches: server/convex/db/favorites.ts listFavoriteLocations returns
 */
@Serializable
data class FavoriteLocationDto(
    @SerialName("_id") val id: String = "",
    val name: String = "",
    val geometry: String = "",
    val bounds: BoundsDto? = null,
) {
    fun toDomain(): FavoriteLocation {
        // Parse geometry to extract lat/lng
        // GeoJSON format: {"type":"Point","coordinates":[lng, lat]}
        val coords = parseGeometry(geometry)

        return FavoriteLocation(
            id = id,
            lat = coords.second,
            lon = coords.first,
            label = name,
        )
    }

    private fun parseGeometry(geometry: String): Pair<Double, Double> {
        // Default to Santa Cruz if parsing fails
        try {
            val json = Json { ignoreUnknownKeys = true }
            val geoJson = json.parseToJsonElement(geometry)
            val coordinates = geoJson.jsonObject["coordinates"]?.jsonArray
            if (coordinates != null && coordinates.size >= 2) {
                val lng = coordinates[0].jsonPrimitive.content.toDouble()
                val lat = coordinates[1].jsonPrimitive.content.toDouble()
                return Pair(lng, lat)
            }
        } catch (e: Exception) {
            // Fall through to default
        }
        return Pair(-122.03, 36.97) // Santa Cruz default
    }
}

@Serializable
data class BoundsDto(
    val north: Double,
    val south: Double,
    val east: Double,
    val west: Double,
)
