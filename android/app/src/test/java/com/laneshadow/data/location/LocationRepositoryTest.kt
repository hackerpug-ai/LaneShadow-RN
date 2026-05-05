package com.laneshadow.data.location

import com.google.common.truth.Truth.assertThat
import com.laneshadow.services.MainDispatcherRule
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

class LocationRepositoryTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    // AC-1: LocationRepository returns current location from FusedLocationProvider
    @Test
    fun getCurrentLocation_returnsLocationFromProvider() = runTest {
        // GIVEN: FakeLocationProvider with Santa Cruz coordinates
        val expectedLocation = LocationCoordinate(
            latitude = 36.97,
            longitude = -122.03,
        )
        val fakeProvider = FakeLocationProvider(
            location = expectedLocation,
        )
        val repository = LocationRepositoryImpl(
            locationProvider = fakeProvider,
        )

        // WHEN: getCurrentLocation is called
        val result = repository.getCurrentLocation()

        // THEN: Result succeeds with expected coordinates
        assertThat(result.isSuccess).isTrue()
        val location = result.getOrThrow()
        assertThat(location.latitude).isEqualTo(36.97)
        assertThat(location.longitude).isEqualTo(-122.03)
    }

    // AC-1: LocationRepository falls back to Santa Cruz when permission denied
    @Test
    fun getCurrentLocation_permissionDenied_fallsBackToSantaCruz() = runTest {
        // GIVEN: FakeLocationProvider that throws SecurityException
        val fakeProvider = FakeLocationProvider(
            error = SecurityException("Permission denied"),
        )
        val repository = LocationRepositoryImpl(
            locationProvider = fakeProvider,
        )

        // WHEN: getCurrentLocation is called
        val result = repository.getCurrentLocation()

        // THEN: Result succeeds with Santa Cruz fallback coordinates
        assertThat(result.isSuccess).isTrue()
        val location = result.getOrThrow()
        assertThat(location.latitude).isEqualTo(36.97)
        assertThat(location.longitude).isEqualTo(-122.03)
    }

    // AC-1: LocationRepository falls back to Santa Cruz when provider unavailable
    @Test
    fun getCurrentLocation_providerUnavailable_fallsBackToSantaCruz() = runTest {
        // GIVEN: FakeLocationProvider that returns null
        val fakeProvider = FakeLocationProvider(
            location = null,
        )
        val repository = LocationRepositoryImpl(
            locationProvider = fakeProvider,
        )

        // WHEN: getCurrentLocation is called
        val result = repository.getCurrentLocation()

        // THEN: Result succeeds with Santa Cruz fallback coordinates
        assertThat(result.isSuccess).isTrue()
        val location = result.getOrThrow()
        assertThat(location.latitude).isEqualTo(36.97)
        assertThat(location.longitude).isEqualTo(-122.03)
    }
}
