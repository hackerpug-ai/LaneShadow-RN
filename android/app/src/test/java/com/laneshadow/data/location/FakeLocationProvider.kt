package com.laneshadow.data.location

/**
 * Fake implementation of FusedLocationProvider for testing
 */
class FakeLocationProvider(
    private val location: LocationCoordinate? = null,
    private val error: Throwable? = null,
) : FusedLocationProvider {

    override suspend fun getCurrentLocation(): LocationCoordinate? {
        error?.let { throw it }
        return location
    }

    companion object {
        fun createSantaCruzLocation(): LocationCoordinate {
            return LocationCoordinate(
                latitude = 36.97,
                longitude = -122.03,
            )
        }
    }
}
