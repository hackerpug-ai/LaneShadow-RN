package com.laneshadow.ui.idle

import android.net.Uri
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import com.google.common.truth.Truth.assertThat
import com.laneshadow.BuildConfig
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.favorites.FavoriteLocation
import com.laneshadow.data.favorites.FavoritesRepository
import com.laneshadow.data.location.LocationCoordinate
import com.laneshadow.data.location.LocationRepository
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.data.user.CurrentUser
import com.laneshadow.data.user.UserRepository
import com.laneshadow.data.weather.WeatherRepository
import com.laneshadow.data.weather.WeatherSummary
import com.laneshadow.services.ConvexClientProvider
import com.laneshadow.services.ConvexCurrentUser
import com.laneshadow.services.ConvexGateway
import com.laneshadow.services.ConvexSendMessageResponseDto
import com.laneshadow.services.GeocodeResult
import com.laneshadow.services.PlaceAutocompleteProximity
import com.laneshadow.services.PlaceSuggestionResult
import com.laneshadow.services.SelectedPlaceResult
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.molecules.AUTOCOMPLETE_RECOMMENDATION_ROW_TAG
import com.laneshadow.ui.molecules.AutocompleteRecommendation
import com.laneshadow.ui.templates.IdleScreen
import java.io.IOException
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.TestScope
import kotlinx.coroutines.test.advanceTimeBy
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runner.RunWith
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class IdlePlaceAutocompleteTest {
    private val composeRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRule).around(composeRule)

    @Test
    fun typingTwoCharacters_triggersDebouncedSuggest() = runTest {
        withMainTestDispatcher {
            val gateway = FakeAutocompleteGateway()
            val viewModel = createViewModel(
                gateway = gateway,
                autocompleteDebounceMs = 300L,
                autocompleteDispatcher = StandardTestDispatcher(testScheduler),
            )

            advanceUntilIdle()

            viewModel.onInputChange("Bi")
            runCurrent()
            assertThat(gateway.suggestCalls).isEmpty()

            advanceTimeBy(299L)
            runCurrent()
            assertThat(gateway.suggestCalls).isEmpty()

            advanceTimeBy(1L)
            advanceUntilIdle()

            assertThat(gateway.suggestCalls).hasSize(1)
            val call = gateway.suggestCalls.single()
            assertThat(call.query).isEqualTo("Bi")
            assertThat(call.proximity).isEqualTo(PlaceAutocompleteProximity(lat = 36.97, lng = -122.03))
            assertThat(call.sessionToken).isNotEmpty()
        }
    }

    @Test
    fun shortQuery_clearsAutocompleteRestoresRideChips() = runTest {
        withMainTestDispatcher {
            val gateway = FakeAutocompleteGateway()
            val pendingBig = gateway.pendingSuggest("Big")
            val viewModel = createViewModel(
                gateway = gateway,
                autocompleteDispatcher = StandardTestDispatcher(testScheduler),
            )

            advanceUntilIdle()

            viewModel.onInputChange("Big")
            advanceTimeBy(300L)
            runCurrent()
            assertThat(gateway.suggestCalls).hasSize(1)

            viewModel.onInputChange("B")
            runCurrent()

            pendingBig.complete(
                Result.success(
                    listOf(
                        PlaceSuggestionResult(
                            id = "place-big-sur",
                            name = "Big Sur",
                            label = "Big Sur, CA",
                            secondaryText = "California",
                            featureType = "place",
                        ),
                    ),
                ),
            )
            advanceUntilIdle()

            assertThat(viewModel.state.value.inputValue).isEqualTo("B")
            assertThat(viewModel.state.value.placeSuggestions).isEmpty()
            assertThat(viewModel.state.value.showStaticSuggestions).isTrue()
            assertThat(viewModel.state.value.toMockState().suggestions).isNotEmpty()
        }
    }

    @Test
    fun rendersAtMostThreeAccessibleRecommendations() {
        val uiState = IdleUiState(
            showStaticSuggestions = false,
            placeSuggestions = listOf(
                createUiSuggestion("1", "Big Sur", "Big Sur, CA"),
                createUiSuggestion("2", "Big Basin", "Big Basin Redwoods State Park"),
                createUiSuggestion("3", "Big Creek", "Big Creek, CA"),
                createUiSuggestion("4", "Big Bear", "Big Bear Lake, CA"),
                createUiSuggestion("5", "Big Pine", "Big Pine, CA"),
            ),
        )

        composeRule.setContent {
            LaneShadowTheme {
                IdleScreen(
                    state = uiState.toMockState(),
                    inputValue = "Big",
                    onMenuTap = {},
                    onSuggestionTap = {},
                    onSend = {},
                    onCollapse = {},
                    onFilter = {},
                    onValueChange = {},
                    autocompleteRecommendations = uiState.placeSuggestions.map { suggestion ->
                        AutocompleteRecommendation(
                            id = suggestion.id,
                            title = suggestion.name,
                            supportingText = suggestion.label,
                            contentDescription = suggestion.label,
                        )
                    },
                    onAutocompleteRecommendationTap = {},
                    mapContent = {
                        Box(modifier = Modifier.testTag("mock-map"))
                    },
                )
            }
        }

        assertThat(
            composeRule.onAllNodesWithTag(AUTOCOMPLETE_RECOMMENDATION_ROW_TAG, useUnmergedTree = true)
                .fetchSemanticsNodes()
                .size,
        ).isEqualTo(3)
        composeRule.onNodeWithContentDescription("Big Sur, CA").fetchSemanticsNode()
        composeRule.onNodeWithContentDescription("Big Basin Redwoods State Park").fetchSemanticsNode()
        composeRule.onNodeWithContentDescription("Big Creek, CA").fetchSemanticsNode()
    }

    @Test
    fun selectRecommendation_primesInputWithoutNavigation() = runTest {
        withMainTestDispatcher {
            val gateway = FakeAutocompleteGateway().apply {
                suggestResults["Big"] = Result.success(
                    listOf(
                        PlaceSuggestionResult(
                            id = "mbx-big-sur",
                            name = "Big Sur",
                            label = "Big Sur, CA",
                            secondaryText = "California",
                            featureType = "place",
                        ),
                    ),
                )
                retrieveResults["mbx-big-sur"] = Result.success(
                    SelectedPlaceResult(
                        id = "mbx-big-sur",
                        name = "Big Sur",
                        label = "Big Sur, CA",
                        lat = 36.2704,
                        lng = -121.8081,
                        featureType = "place",
                    ),
                )
            }
            val viewModel = createViewModel(
                gateway = gateway,
                autocompleteDispatcher = StandardTestDispatcher(testScheduler),
            )

            advanceUntilIdle()

            viewModel.onInputChange("Big")
            advanceTimeBy(300L)
            advanceUntilIdle()

            val recommendation = viewModel.state.value.placeSuggestions.single()
            viewModel.onAutocompleteSuggestionTap(recommendation)
            advanceUntilIdle()

            assertThat(viewModel.state.value.inputValue).isEqualTo("Big Sur, CA")
            assertThat(viewModel.state.value.selectedPlace?.label).isEqualTo("Big Sur, CA")
            assertThat(viewModel.state.value.navigateTo).isNull()
        }
    }

    @Test
    fun staleAutocompleteResponse_ignored() = runTest {
        withMainTestDispatcher {
            val gateway = FakeAutocompleteGateway()
            val pendingBi = gateway.pendingSuggest("Bi")
            val pendingBig = gateway.pendingSuggest("Big")
            val viewModel = createViewModel(
                gateway = gateway,
                autocompleteDispatcher = StandardTestDispatcher(testScheduler),
            )

            advanceUntilIdle()

            viewModel.onInputChange("Bi")
            advanceTimeBy(300L)
            runCurrent()
            assertThat(gateway.suggestCalls).hasSize(1)

            viewModel.onInputChange("Big")
            advanceTimeBy(300L)
            runCurrent()
            assertThat(gateway.suggestCalls).hasSize(2)

            pendingBig.complete(
                Result.success(
                    listOf(
                        PlaceSuggestionResult(
                            id = "big",
                            name = "Big Sur",
                            label = "Big Sur, CA",
                            featureType = "place",
                        ),
                    ),
                ),
            )
            advanceUntilIdle()
            assertThat(viewModel.state.value.placeSuggestions.map { it.label })
                .containsExactly("Big Sur, CA")

            pendingBi.complete(
                Result.success(
                    listOf(
                        PlaceSuggestionResult(
                            id = "bi",
                            name = "Bixby Bridge",
                            label = "Bixby Bridge, CA",
                            featureType = "poi",
                        ),
                    ),
                ),
            )
            advanceUntilIdle()

            assertThat(viewModel.state.value.placeSuggestions.map { it.label })
                .containsExactly("Big Sur, CA")
        }
    }

    @Test
    fun autocompleteFailure_recoversOnNextQuery() = runTest {
        withMainTestDispatcher {
            val gateway = FakeAutocompleteGateway().apply {
                suggestResults["Bi"] = Result.failure(IOException("Autocomplete unavailable"))
                suggestResults["Big"] = Result.success(
                    listOf(
                        PlaceSuggestionResult(
                            id = "big",
                            name = "Big Sur",
                            label = "Big Sur, CA",
                            featureType = "place",
                        ),
                    ),
                )
            }
            val viewModel = createViewModel(
                gateway = gateway,
                autocompleteDispatcher = StandardTestDispatcher(testScheduler),
            )

            advanceUntilIdle()

            viewModel.onInputChange("Bi")
            advanceTimeBy(300L)
            advanceUntilIdle()

            assertThat(viewModel.state.value.autocompleteError).contains("Autocomplete unavailable")
            assertThat(viewModel.state.value.placeSuggestions).isEmpty()

            viewModel.onInputChange("Big")
            advanceTimeBy(300L)
            advanceUntilIdle()

            assertThat(viewModel.state.value.autocompleteError).isNull()
            assertThat(viewModel.state.value.placeSuggestions.map { it.label })
                .containsExactly("Big Sur, CA")
        }
    }

    @OptIn(ExperimentalCoroutinesApi::class)
    private suspend fun TestScope.withMainTestDispatcher(block: suspend TestScope.() -> Unit) {
        val dispatcher = StandardTestDispatcher(testScheduler)
        Dispatchers.setMain(dispatcher)
        try {
            block()
        } finally {
            Dispatchers.resetMain()
        }
    }

    private fun createViewModel(
        gateway: FakeAutocompleteGateway,
        autocompleteDebounceMs: Long = 300L,
        autocompleteDispatcher: TestDispatcher,
    ): IdleViewModel {
        return IdleViewModel(
            userRepository = FakeUserRepository(currentUser = null),
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
            weatherRepository = FakeWeatherRepository(),
            favoritesRepository = FakeFavoritesRepository(),
            locationRepository = FakeLocationRepository(),
            convexClientProvider = createProvider(gateway),
            autocompleteDebounceMs = autocompleteDebounceMs,
            autocompleteDispatcher = autocompleteDispatcher,
        )
    }

    private fun createProvider(gateway: FakeAutocompleteGateway): ConvexClientProvider {
        return ConvexClientProvider(
            authRepository = FakeAuthRepository(),
            appContext = android.app.Application(),
            convexGateway = gateway,
        )
    }

    private fun createUiSuggestion(id: String, name: String, label: String): IdlePlaceSuggestion {
        return IdlePlaceSuggestion(
            id = id,
            name = name,
            label = label,
            featureType = "place",
        )
    }
}

private class FakeAutocompleteGateway : ConvexGateway {
    val suggestCalls = mutableListOf<SuggestCall>()
    val retrieveCalls = mutableListOf<RetrieveCall>()
    val suggestResults = mutableMapOf<String, Result<List<PlaceSuggestionResult>>>()
    val retrieveResults = mutableMapOf<String, Result<SelectedPlaceResult>>()
    private val pendingSuggestResults =
        mutableMapOf<String, CompletableDeferred<Result<List<PlaceSuggestionResult>>>>()

    fun pendingSuggest(query: String): CompletableDeferred<Result<List<PlaceSuggestionResult>>> {
        return CompletableDeferred<Result<List<PlaceSuggestionResult>>>().also { deferred ->
            pendingSuggestResults[query] = deferred
        }
    }

    override suspend fun bindAuthToken(token: String): Result<Unit> = Result.success(Unit)

    override suspend fun clearAuth(context: android.content.Context): Result<Unit> = Result.success(Unit)

    override suspend fun getCurrentUser(): ConvexCurrentUser? = null

    override fun observeCurrentUser(): Flow<ConvexCurrentUser?> = flowOf(null)

    override fun observePlanningSessions(): Flow<List<com.laneshadow.data.session.PlanningSession>> =
        flowOf(emptyList())

    override fun observeSessionMessages(sessionId: String): Flow<List<com.laneshadow.data.chat.SessionMessage>> =
        flowOf(emptyList())

    override fun observeActiveRoutePlans(sessionId: String): Flow<List<com.laneshadow.data.route.RoutePlan>> =
        flowOf(emptyList())

    override fun observeSessions(): Flow<List<com.laneshadow.ui.organisms.Session>> =
        flowOf(emptyList())

    override fun observeFavoriteLocations(): Flow<List<FavoriteLocation>> = flowOf(emptyList())

    override suspend fun sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLng?,
    ): Result<ConvexSendMessageResponseDto> =
        Result.success(ConvexSendMessageResponseDto("", "", emptyList()))

    override suspend fun createSession(firstMessage: String): Result<String> = Result.success("sess-42")

    override suspend fun cancelPlan(routePlanId: String): Result<Unit> = Result.success(Unit)

    override suspend fun getCurrentWeather(
        lat: Double,
        lng: Double,
    ): com.laneshadow.data.dto.WeatherDto =
        com.laneshadow.data.dto.WeatherDto(
            tempFahrenheit = 68.0,
            condition = "Clear",
            severity = "none",
            dayOfWeek = "MONDAY",
        )

    override suspend fun reverseGeocode(lat: Double, lng: Double): GeocodeResult =
        GeocodeResult(label = "Santa Cruz, CA", placeId = "place-123")

    override suspend fun suggestPlaces(
        query: String,
        proximity: PlaceAutocompleteProximity?,
        sessionToken: String,
    ): List<PlaceSuggestionResult> {
        suggestCalls += SuggestCall(query = query, proximity = proximity, sessionToken = sessionToken)
        pendingSuggestResults.remove(query)?.let { deferred ->
            return deferred.await().getOrThrow()
        }
        return suggestResults[query]?.getOrThrow() ?: emptyList()
    }

    override suspend fun retrievePlace(
        mapboxId: String,
        sessionToken: String,
    ): SelectedPlaceResult {
        retrieveCalls += RetrieveCall(mapboxId = mapboxId, sessionToken = sessionToken)
        return retrieveResults[mapboxId]?.getOrThrow()
            ?: SelectedPlaceResult(
                id = mapboxId,
                name = "Selected Place",
                label = "Selected Place, CA",
                lat = 36.97,
                lng = -122.03,
                featureType = "place",
            )
    }
}

private data class SuggestCall(
    val query: String,
    val proximity: PlaceAutocompleteProximity?,
    val sessionToken: String,
)

private data class RetrieveCall(
    val mapboxId: String,
    val sessionToken: String,
)

private class FakeUserRepository(
    private val currentUser: CurrentUser?,
) : UserRepository {
    override fun subscribeToCurrentUser(): Flow<CurrentUser?> = flowOf(currentUser)
}

private class FakeSessionRepository : SessionRepository {
    override fun subscribeToSessions(): Flow<List<PlanningSession>> = flowOf(emptyList())
    override suspend fun createSession(firstMessage: String): Result<String> = Result.success("sess-42")
}

private class FakeChatRepository : ChatRepository {
    override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> = flowOf(emptyList())

    override suspend fun sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLng?,
    ): Result<Unit> = Result.success(Unit)
}

private class FakeWeatherRepository : WeatherRepository {
    override fun subscribeToCurrentWeather(): Flow<WeatherSummary?> = flowOf(null)
}

private class FakeFavoritesRepository : FavoritesRepository {
    override fun subscribeToFavoriteLocations(): Flow<List<FavoriteLocation>> = flowOf(emptyList())
}

private class FakeLocationRepository : LocationRepository {
    override suspend fun getCurrentLocation(): Result<LocationCoordinate> =
        Result.success(LocationCoordinate(latitude = 36.97, longitude = -122.03))
}

private class FakeAuthRepository : AuthRepository {
    private val authState = MutableStateFlow<AuthState>(
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

private object DebugVariantRule : TestRule {
    override fun apply(base: Statement, description: Description): Statement =
        object : Statement() {
            override fun evaluate() {
                assumeTrue(BuildConfig.BUILD_TYPE == "debug")
                base.evaluate()
            }
        }
}
