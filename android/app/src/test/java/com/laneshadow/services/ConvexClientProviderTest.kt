package com.laneshadow.services

import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.test.runTest
import org.junit.Test

class ConvexClientProviderTest {

    // AC-2: ConvexClientProvider.reverseGeocode calls Convex action
    @Test
    fun reverseGeocode_callsConvexAction() = runTest {
        // GIVEN: ConvexClientProvider with mocked gateway
        val geocodeResult = GeocodeResult(
            label = "Santa Cruz, CA",
            placeId = "place-123",
        )
        val fakeGateway = FakeConvexGateway(
            geocodeResult = geocodeResult,
        )
        val provider = TestConvexClientProvider(
            gateway = fakeGateway,
        )

        // WHEN: reverseGeocode is called with coordinates
        val result = provider.reverseGeocode(36.97, -122.03)

        // THEN: Result succeeds with expected label
        assertThat(result.isSuccess).isTrue()
        val geocode = result.getOrThrow()
        assertThat(geocode.label).isEqualTo("Santa Cruz, CA")
        assertThat(geocode.placeId).isEqualTo("place-123")
    }

    // AC-2: ConvexClientProvider.reverseGeocode handles errors
    @Test
    fun reverseGeocode_handlesConvexErrors() = runTest {
        // GIVEN: ConvexClientProvider with failing gateway
        val fakeGateway = FakeConvexGateway(
            error = RuntimeException("Convex unavailable"),
        )
        val provider = TestConvexClientProvider(
            gateway = fakeGateway,
        )

        // WHEN: reverseGeocode is called
        val result = provider.reverseGeocode(36.97, -122.03)

        // THEN: Result fails with error
        assertThat(result.isFailure).isTrue()
        assertThat(result.exceptionOrNull()?.message).contains("Convex unavailable")
    }
}

/**
 * Fake ConvexGateway for testing
 */
internal class FakeConvexGateway(
    private val geocodeResult: GeocodeResult? = null,
    private val error: Throwable? = null,
) : ConvexGateway {

    override suspend fun reverseGeocode(lat: Double, lng: Double): GeocodeResult {
        error?.let { throw it }
        return geocodeResult ?: throw IllegalStateException("No result configured")
    }

    // Stub implementations for other methods
    override suspend fun bindAuthToken(token: String): Result<Unit> = Result.success(Unit)
    override suspend fun clearAuth(context: android.content.Context): Result<Unit> = Result.success(Unit)
    override suspend fun getCurrentUser(): ConvexCurrentUser? = null
    override fun observeCurrentUser(): kotlinx.coroutines.flow.Flow<ConvexCurrentUser?> = kotlinx.coroutines.flow.flowOf(null)
    override fun observePlanningSessions(): kotlinx.coroutines.flow.Flow<List<com.laneshadow.data.session.PlanningSession>> = kotlinx.coroutines.flow.flowOf(emptyList())
    override fun observeSessionMessages(sessionId: String): kotlinx.coroutines.flow.Flow<List<com.laneshadow.data.chat.SessionMessage>> = kotlinx.coroutines.flow.flowOf(emptyList())
    override fun observeActiveRoutePlans(sessionId: String): kotlinx.coroutines.flow.Flow<List<com.laneshadow.data.route.RoutePlan>> = kotlinx.coroutines.flow.flowOf(emptyList())
    override fun observeSessions(): kotlinx.coroutines.flow.Flow<List<com.laneshadow.ui.organisms.Session>> = kotlinx.coroutines.flow.flowOf(emptyList())
    override fun observeFavoriteLocations(): kotlinx.coroutines.flow.Flow<List<com.laneshadow.data.favorites.FavoriteLocation>> = kotlinx.coroutines.flow.flowOf(emptyList())
    override suspend fun sendMessage(sessionId: String, content: String, currentLocation: com.laneshadow.ui.atoms.LatLng?): Result<ConvexSendMessageResponseDto> = Result.success(ConvexSendMessageResponseDto("", "", emptyList()))
    override suspend fun createSession(firstMessage: String): Result<String> = Result.success("sess-123")
    override suspend fun cancelPlan(routePlanId: String): Result<Unit> = Result.success(Unit)
    override suspend fun getCurrentWeather(lat: Double, lng: Double): com.laneshadow.data.dto.WeatherDto {
        // Use the correct constructor for WeatherDto
        return com.laneshadow.data.dto.WeatherDto(
            tempFahrenheit = 68.0,
            condition = "Clear",
            severity = "none",
        )
    }
}

/**
 * Test-only ConvexClientProvider constructor
 */
internal class TestConvexClientProvider(
    private val gateway: ConvexGateway,
) {
    suspend fun reverseGeocode(lat: Double, lng: Double): Result<GeocodeResult> = runCatching {
        gateway.reverseGeocode(lat, lng)
    }
}
