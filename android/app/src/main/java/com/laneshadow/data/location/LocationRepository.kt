package com.laneshadow.data.location

import javax.inject.Inject

/**
 * Domain model for location coordinates
 */
data class LocationCoordinate(
    val latitude: Double,
    val longitude: Double,
)

/**
 * Repository interface for location data from FusedLocationProvider
 */
interface LocationRepository {
    /**
     * Get the current location from FusedLocationProvider
     *
     * Falls back to Santa Cruz coordinates (36.97, -122.03) if:
     * - Permission is denied (SecurityException)
     * - Location provider is unavailable (null)
     * - Any other error occurs
     */
    suspend fun getCurrentLocation(): Result<LocationCoordinate>
}

/**
 * Default Santa Cruz fallback coordinates
 */
private const val SANTA_CRUZ_LAT = 36.97
private const val SANTA_CRUZ_LNG = -122.03

/**
 * Implementation of LocationRepository using FusedLocationProvider
 */
class LocationRepositoryImpl @Inject constructor(
    private val locationProvider: FusedLocationProvider,
) : LocationRepository {

    override suspend fun getCurrentLocation(): Result<LocationCoordinate> = runCatching {
        locationProvider.getCurrentLocation()
            ?: createFallbackLocation()
    }.recover { error ->
        // Fall back to Santa Cruz on any error (permission denied, provider unavailable, etc.)
        createFallbackLocation()
    }

    private fun createFallbackLocation(): LocationCoordinate {
        return LocationCoordinate(
            latitude = SANTA_CRUZ_LAT,
            longitude = SANTA_CRUZ_LNG,
        )
    }
}

/**
 * Abstraction over FusedLocationProviderClient for testability
 */
interface FusedLocationProvider {
    suspend fun getCurrentLocation(): LocationCoordinate?
}
