package com.laneshadow.services

import android.net.Uri
import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import kotlinx.coroutines.test.runTest
import org.junit.Test

class ConvexClientProviderTest {
    @Test
    fun reverseGeocode_callsConvexAction() = runTest {
        val geocodeResult = GeocodeResult(
            label = "Santa Cruz, CA",
            placeId = "place-123",
        )
        val fakeGateway = FakeConvexGateway(
            geocodeResult = geocodeResult,
        )
        val provider = createProvider(fakeGateway)

        val result = provider.reverseGeocode(36.97, -122.03)

        assertThat(result.isSuccess).isTrue()
        val geocode = result.getOrThrow()
        assertThat(geocode.label).isEqualTo("Santa Cruz, CA")
        assertThat(geocode.placeId).isEqualTo("place-123")
    }

    @Test
    fun reverseGeocode_handlesConvexErrors() = runTest {
        val fakeGateway = FakeConvexGateway(
            error = RuntimeException("Convex unavailable"),
        )
        val provider = createProvider(fakeGateway)

        val result = provider.reverseGeocode(36.97, -122.03)

        assertThat(result.isFailure).isTrue()
        assertThat(result.exceptionOrNull()?.message).contains("Convex unavailable")
    }

    @Test
    fun suggestPlaces_bindsAuthAndPassesThroughQueryProximityAndSession() = runTest {
        val suggestions = listOf(
            PlaceSuggestionResult(
                id = "place-big-sur",
                name = "Big Sur",
                label = "Big Sur, CA",
                secondaryText = "California",
                featureType = "place",
                distanceMeters = 1200.0,
            ),
        )
        val fakeGateway = FakeConvexGateway(
            suggestPlacesResult = suggestions,
        )
        val provider = createProvider(fakeGateway)

        val result = provider.suggestPlaces(
            query = "Big Sur",
            proximity = PlaceAutocompleteProximity(lat = 36.97, lng = -122.03),
            sessionToken = "session-123",
        )

        assertThat(result.isSuccess).isTrue()
        assertThat(result.getOrThrow()).containsExactlyElementsIn(suggestions)
        assertThat(fakeGateway.lastBoundToken).isEqualTo("test-jwt")
        assertThat(fakeGateway.lastSuggestCall).isEqualTo(
            SuggestPlacesCall(
                query = "Big Sur",
                proximity = PlaceAutocompleteProximity(lat = 36.97, lng = -122.03),
                sessionToken = "session-123",
            ),
        )
    }

    @Test
    fun retrievePlace_returnsSelectedPlace() = runTest {
        val selectedPlace = SelectedPlaceResult(
            id = "mapbox-big-sur",
            name = "Big Sur",
            label = "Big Sur, CA",
            lat = 36.2704,
            lng = -121.8081,
            featureType = "place",
        )
        val fakeGateway = FakeConvexGateway(
            selectedPlaceResult = selectedPlace,
        )
        val provider = createProvider(fakeGateway)

        val result = provider.retrievePlace(
            mapboxId = "mapbox-big-sur",
            sessionToken = "session-123",
        )

        assertThat(result.isSuccess).isTrue()
        assertThat(result.getOrThrow()).isEqualTo(selectedPlace)
        assertThat(fakeGateway.lastRetrieveCall).isEqualTo(
            RetrievePlaceCall(
                mapboxId = "mapbox-big-sur",
                sessionToken = "session-123",
            ),
        )
    }
}

private fun createProvider(gateway: FakeConvexGateway): ConvexClientProvider {
    return ConvexClientProvider(
        authRepository = TestAuthRepository(),
        appContext = android.app.Application(),
        convexGateway = gateway,
    )
}

internal class FakeConvexGateway(
    private val geocodeResult: GeocodeResult? = null,
    private val suggestPlacesResult: List<PlaceSuggestionResult> = emptyList(),
    private val selectedPlaceResult: SelectedPlaceResult? = null,
    private val error: Throwable? = null,
) : ConvexGateway {
    var lastBoundToken: String? = null
    var lastSuggestCall: SuggestPlacesCall? = null
    var lastRetrieveCall: RetrievePlaceCall? = null

    override suspend fun reverseGeocode(lat: Double, lng: Double): GeocodeResult {
        error?.let { throw it }
        return geocodeResult ?: throw IllegalStateException("No result configured")
    }

    override suspend fun suggestPlaces(
        query: String,
        proximity: PlaceAutocompleteProximity?,
        sessionToken: String,
    ): List<PlaceSuggestionResult> {
        error?.let { throw it }
        lastSuggestCall = SuggestPlacesCall(query = query, proximity = proximity, sessionToken = sessionToken)
        return suggestPlacesResult
    }

    override suspend fun retrievePlace(
        mapboxId: String,
        sessionToken: String,
    ): SelectedPlaceResult {
        error?.let { throw it }
        lastRetrieveCall = RetrievePlaceCall(mapboxId = mapboxId, sessionToken = sessionToken)
        return selectedPlaceResult ?: throw IllegalStateException("No selected place configured")
    }

    override suspend fun bindAuthToken(token: String): Result<Unit> {
        lastBoundToken = token
        return Result.success(Unit)
    }

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
    override suspend fun getCurrentWeather(lat: Double, lng: Double): com.laneshadow.data.dto.WeatherDto =
        com.laneshadow.data.dto.WeatherDto(
            tempFahrenheit = 68.0,
            condition = "Clear",
            severity = "none",
            dayOfWeek = "MONDAY",
        )
}

internal data class SuggestPlacesCall(
    val query: String,
    val proximity: PlaceAutocompleteProximity?,
    val sessionToken: String,
)

internal data class RetrievePlaceCall(
    val mapboxId: String,
    val sessionToken: String,
)

private class TestAuthRepository : AuthRepository {
    private val authState = kotlinx.coroutines.flow.MutableStateFlow<AuthState>(
        AuthState.SignedIn(ClerkUser("id", "test@example.com", "Test Rider", "token")),
    )

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException())

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException())

    override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException())

    override suspend fun signOut(): Result<Unit> = Result.success(Unit)

    override suspend fun handleUnauthenticated(message: String): Result<Unit> = Result.success(Unit)

    override suspend fun signInWithGoogle(): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException())

    override suspend fun signInWithApple(): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException())

    override suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException())

    override suspend fun getJwtForConvex(): String = "test-jwt"

    override suspend fun bypassForTesting(): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException())

    override fun observeAuthState() = authState
}
