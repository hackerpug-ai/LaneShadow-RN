package com.laneshadow.data.location

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

/**
 * Implementation of FusedLocationProvider using Google Play Services
 */
class FusedLocationProviderImpl @Inject constructor(
    @ApplicationContext private val context: Context,
) : FusedLocationProvider {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    override suspend fun getCurrentLocation(): LocationCoordinate? {
        // Check for location permission
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            // Permission denied - return null to trigger fallback
            return null
        }

        // Try to get last known location
        return try {
            val lastLocation = fusedLocationClient.lastLocation.await()
            lastLocation?.toLocationCoordinate()
        } catch (e: Exception) {
            // Error getting location - return null to trigger fallback
            null
        }
    }

    private fun Location.toLocationCoordinate(): LocationCoordinate {
        return LocationCoordinate(
            latitude = latitude,
            longitude = longitude,
        )
    }
}
