package com.laneshadow.data.location

import android.Manifest
import android.annotation.SuppressLint
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
    @param:ApplicationContext private val context: Context,
) : FusedLocationProvider {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    override suspend fun getCurrentLocation(): LocationCoordinate? {
        if (!hasLocationPermission()) {
            return null
        }

        return try {
            val lastLocation = getLastKnownLocation()
            lastLocation?.toLocationCoordinate()
        } catch (_: SecurityException) {
            null
        } catch (_: Exception) {
            null
        }
    }

    private fun hasLocationPermission(): Boolean {
        val hasFineLocation = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED
        val hasCoarseLocation = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED

        return hasFineLocation || hasCoarseLocation
    }

    @SuppressLint("MissingPermission")
    private suspend fun getLastKnownLocation(): Location? {
        return fusedLocationClient.lastLocation.await()
    }

    private fun Location.toLocationCoordinate(): LocationCoordinate {
        return LocationCoordinate(
            latitude = latitude,
            longitude = longitude,
        )
    }
}
