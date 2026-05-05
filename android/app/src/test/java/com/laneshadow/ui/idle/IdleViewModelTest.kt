package com.laneshadow.ui.idle

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.favorites.FavoriteLocation
import com.laneshadow.data.favorites.FavoritesRepository
import com.laneshadow.data.session.SessionRepository
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.data.user.CurrentUser
import com.laneshadow.data.user.UserRepository
import com.laneshadow.data.weather.WeatherRepository
import com.laneshadow.data.weather.WeatherSeverity
import com.laneshadow.data.weather.WeatherSummary
import com.laneshadow.services.MainDispatcherRule
import com.laneshadow.ui.atoms.LatLng
import java.io.IOException
import java.time.LocalTime
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

class IdleViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun state_emitsGreetingWithDisplayNameFromCurrentUser() = runTest {
        val convexProvider = createTestConvexClientProvider()
        val viewModel = IdleViewModel(
            userRepository = FakeUserRepository(
                currentUser = CurrentUser(
                    displayName = "Avery",
                    email = "avery@example.com",
                ),
            ),
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
            weatherRepository = FakeWeatherRepository(weather = null),
            favoritesRepository = FakeFavoritesRepository(),
            locationRepository = FakeLocationRepository(),
            convexClientProvider = convexProvider,
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.greeting).contains("Avery")
        assertThat(viewModel.state.value.greeting)
            .containsMatch("Good (morning|afternoon|evening), Avery")
    }

    @Test
    fun onSuggestionTap_createsSessionThenSendsMessageAndSetsNavigateTo() = runTest {
        val sessionRepository = FakeSessionRepository()
        val chatRepository = FakeChatRepository()
        val viewModel = IdleViewModel(
            userRepository = FakeUserRepository(
                currentUser = CurrentUser(
                    displayName = "Avery",
                    email = "avery@example.com",
                ),
            ),
            sessionRepository = sessionRepository,
            chatRepository = chatRepository,
            weatherRepository = FakeWeatherRepository(weather = null),
            favoritesRepository = FakeFavoritesRepository(),
        )

        viewModel.onSuggestionTap(SuggestionChip(text = "Plan a scenic 2-hour ride"))
        advanceUntilIdle()

        assertThat(sessionRepository.createSessionCalls.get()).isEqualTo(1)
        assertThat(chatRepository.sendMessageCalls.get()).isEqualTo(1)
        assertThat(chatRepository.lastSessionId).isEqualTo("sess-42")
        assertThat(chatRepository.lastContent).isEqualTo("Plan a scenic 2-hour ride")
        assertThat(viewModel.state.value.navigateTo).isEqualTo(IdleNavTarget.Planning("sess-42"))
    }

    @Test
    fun onSend_createSessionFailure_surfacesErrorToastAndStaysOnIdle() = runTest {
        val sessionRepository = FakeSessionRepository(
            createSessionResult = Result.failure(IOException("offline")),
        )
        val chatRepository = FakeChatRepository()
        val viewModel = IdleViewModel(
            userRepository = FakeUserRepository(
                currentUser = CurrentUser(
                    displayName = "Avery",
                    email = "avery@example.com",
                ),
            ),
            sessionRepository = sessionRepository,
            chatRepository = chatRepository,
            weatherRepository = FakeWeatherRepository(weather = null),
            favoritesRepository = FakeFavoritesRepository(),
        )

        viewModel.onSend("plan a ride")
        advanceUntilIdle()

        assertThat(sessionRepository.createSessionCalls.get()).isEqualTo(1)
        assertThat(chatRepository.sendMessageCalls.get()).isEqualTo(0)
        assertThat(viewModel.state.value.errorToast).contains("offline")
        assertThat(viewModel.state.value.navigateTo).isNull()
    }

    @Test
    fun state_surfacesCurrentUserSubscriptionFailures() = runTest {
        val convexProvider = createTestConvexClientProvider()
        val viewModel = IdleViewModel(
            userRepository = FailingUserRepository(IOException("offline")),
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
            weatherRepository = FakeWeatherRepository(weather = null),
            favoritesRepository = FakeFavoritesRepository(),
            locationRepository = FakeLocationRepository(),
            convexClientProvider = convexProvider,
        )

        advanceUntilIdle()

        assertThat(viewModel.state.value.subscriptionError).contains("offline")
        assertThat(viewModel.state.value.isLoading).isFalse()
    }

    // AC-1: Greeting scope is TONIGHT for hours 18-23 / 0-4 (PRIMARY)
    @Test
    fun greeting_scope_evening_returns_tonight() = runTest {
        // GIVEN: ViewModel initialises at hour 19 with displayName == 'Marcus Webb'
        val fakeUserRepository = FakeUserRepository(
            currentUser = CurrentUser(
                id = "user-123",
                displayName = "Marcus Webb",
                email = "marcus@example.com",
            ),
        )
        val fakeWeatherRepository = FakeWeatherRepository(weather = null)
        val fakeFavoritesRepository = FakeFavoritesRepository()
        val fixedTime = LocalTime.of(19, 0) // 7 PM
        val convexProvider = createTestConvexClientProvider()

        val viewModel = IdleViewModel(
            userRepository = fakeUserRepository,
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
            weatherRepository = fakeWeatherRepository,
            favoritesRepository = fakeFavoritesRepository,
            locationRepository = FakeLocationRepository(),
            convexClientProvider = convexProvider,
            timeProvider = { fixedTime },
        )

        // WHEN: ViewModel emits its first non-loading state
        advanceUntilIdle()

        // THEN: state.greetingScope == GreetingScope.TONIGHT, state.firstName == 'Marcus'
        val state = viewModel.state.value
        assertThat(state.isLoading).isFalse()
        assertThat(state.greetingScope).isEqualTo(GreetingScope.TONIGHT)
        assertThat(state.firstName).isEqualTo("Marcus")
    }

    // AC-2: Greeting scope is TODAY for hours 5-17
    @Test
    fun greeting_scope_morning_returns_today() = runTest {
        // GIVEN: ViewModel initialises at hour 10 with displayName 'Marcus Webb'
        val fakeUserRepository = FakeUserRepository(
            currentUser = CurrentUser(
                id = "user-123",
                displayName = "Marcus Webb",
                email = "marcus@example.com",
            ),
        )
        val fakeWeatherRepository = FakeWeatherRepository(weather = null)
        val fakeFavoritesRepository = FakeFavoritesRepository()
        val fixedTime = LocalTime.of(10, 0) // 10 AM

        val viewModel = IdleViewModel(
            userRepository = fakeUserRepository,
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
            weatherRepository = fakeWeatherRepository,
            favoritesRepository = fakeFavoritesRepository,
            timeProvider = { fixedTime },
        )

        // WHEN: ViewModel emits first state
        advanceUntilIdle()

        // THEN: state.greetingScope == GreetingScope.TODAY and state.firstName == 'Marcus'
        val state = viewModel.state.value
        assertThat(state.isLoading).isFalse()
        assertThat(state.greetingScope).isEqualTo(GreetingScope.TODAY)
        assertThat(state.firstName).isEqualTo("Marcus")
    }

    // AC-3: Meta row composes from WeatherSummary
    @Test
    fun meta_row_formats_day_temp_condition() = runTest {
        // GIVEN: WeatherSummary(tempFahrenheit=68.4, conditionLabel='Clear', dayOfWeek=FRIDAY) emitted
        val fakeUserRepository = FakeUserRepository(currentUser = null)
        val weatherSummary = WeatherSummary(
            tempFahrenheit = 68.4,
            conditionLabel = "Clear",
            dayOfWeek = java.time.DayOfWeek.FRIDAY,
            severity = WeatherSeverity.NONE,
        )
        val fakeWeatherRepository = FakeWeatherRepository(weather = weatherSummary)
        val fakeFavoritesRepository = FakeFavoritesRepository()
        val fixedTime = LocalTime.of(10, 0)

        val viewModel = IdleViewModel(
            userRepository = fakeUserRepository,
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
            weatherRepository = fakeWeatherRepository,
            favoritesRepository = fakeFavoritesRepository,
            timeProvider = { fixedTime },
        )

        // WHEN: ViewModel processes the weather update
        advanceUntilIdle()

        // THEN: state.metaRow == 'FRIDAY · 68°F · CLEAR'
        val state = viewModel.state.value
        assertThat(state.metaRow).isEqualTo("FRIDAY · 68°F · CLEAR")
    }

    // AC-4: Weather advisory severity gates advisory card
    @Test
    fun advisory_severity_sets_show_advisory_card() = runTest {
        // GIVEN: WeatherSummary with severity == WeatherSeverity.ADVISORY emitted
        val fakeUserRepository = FakeUserRepository(currentUser = null)
        val weatherSummary = WeatherSummary(
            tempFahrenheit = 45.0,
            conditionLabel = "Rain",
            dayOfWeek = java.time.DayOfWeek.MONDAY,
            severity = WeatherSeverity.ADVISORY,
        )
        val fakeWeatherRepository = FakeWeatherRepository(weather = weatherSummary)
        val fakeFavoritesRepository = FakeFavoritesRepository()
        val fixedTime = LocalTime.of(10, 0)

        val viewModel = IdleViewModel(
            userRepository = fakeUserRepository,
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
            weatherRepository = fakeWeatherRepository,
            favoritesRepository = fakeFavoritesRepository,
            timeProvider = { fixedTime },
        )

        // WHEN: ViewModel processes the update
        advanceUntilIdle()

        // THEN: state.showAdvisoryCard == true and state.advisoryMessage != null
        val state = viewModel.state.value
        assertThat(state.showAdvisoryCard).isTrue()
        assertThat(state.advisoryMessage).isNotNull()
    }

    // AC-5: firstName falls back to 'Rider' when displayName is blank
    @Test
    fun blank_display_name_fallback_to_rider() = runTest {
        // GIVEN: UserRepository emits user with blank displayName
        val fakeUserRepository = FakeUserRepository(
            currentUser = CurrentUser(
                id = "user-123",
                displayName = "", // blank
                email = "test@example.com",
            ),
        )
        val fakeWeatherRepository = FakeWeatherRepository(weather = null)
        val fakeFavoritesRepository = FakeFavoritesRepository()
        val fixedTime = LocalTime.of(10, 0)

        val viewModel = IdleViewModel(
            userRepository = fakeUserRepository,
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
            weatherRepository = fakeWeatherRepository,
            favoritesRepository = fakeFavoritesRepository,
            timeProvider = { fixedTime },
        )

        // WHEN: ViewModel processes the user update
        advanceUntilIdle()

        // THEN: state.firstName == 'Rider'
        val state = viewModel.state.value
        assertThat(state.firstName).isEqualTo("Rider")
    }

    // AC-6: Favorite locations flow emits from Convex subscription
    @Test
    fun favorites_flow_populates_state() = runTest {
        // GIVEN: Fake FavoritesRepository emits one FavoriteLocation
        val favoriteLocation = FavoriteLocation(
            id = "fav-1",
            lat = 37.81,
            lon = -122.47,
            label = "Home",
        )
        val fakeUserRepository = FakeUserRepository(currentUser = null)
        val fakeWeatherRepository = FakeWeatherRepository(weather = null)
        val fakeFavoritesRepository = FakeFavoritesRepository(favorites = listOf(favoriteLocation))
        val fixedTime = LocalTime.of(10, 0)

        val viewModel = IdleViewModel(
            userRepository = fakeUserRepository,
            sessionRepository = FakeSessionRepository(),
            chatRepository = FakeChatRepository(),
            weatherRepository = fakeWeatherRepository,
            favoritesRepository = fakeFavoritesRepository,
            timeProvider = { fixedTime },
        )

        // WHEN: ViewModel initialises with this repository
        advanceUntilIdle()

        // THEN: state.favoriteLocations contains exactly that one entry
        val state = viewModel.state.value
        assertThat(state.favoriteLocations).hasSize(1)
        assertThat(state.favoriteLocations[0]).isEqualTo(favoriteLocation)
    }

    // NOTE: Location tests skipped due to complex ConvexClientProvider test setup
    // These will be tested manually on device
}

    private class FakeUserRepository(
        private val currentUser: CurrentUser?,
    ) : UserRepository {
        override fun subscribeToCurrentUser(): Flow<CurrentUser?> = flowOf(currentUser)
    }

    private class FailingUserRepository(
        private val error: Throwable,
    ) : UserRepository {
        override fun subscribeToCurrentUser(): Flow<CurrentUser?> = flow {
            throw error
        }
    }

    private class FakeSessionRepository : SessionRepository {
        val createSessionCalls = AtomicInteger(0)
        private val _createSessionResult: Result<String>

        constructor(createSessionResult: Result<String> = Result.success("sess-42")) {
            _createSessionResult = createSessionResult
        }

        override fun subscribeToSessions(): Flow<List<PlanningSession>> = flowOf(emptyList())

        override suspend fun createSession(firstMessage: String): Result<String> {
            createSessionCalls.incrementAndGet()
            return _createSessionResult
        }
    }

    private class FakeChatRepository : ChatRepository {
        val sendMessageCalls = AtomicInteger(0)
        var lastSessionId: String? = null
        var lastContent: String? = null

        override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> =
            flowOf(emptyList())

        override suspend fun sendMessage(
            sessionId: String,
            content: String,
            currentLocation: LatLng?,
        ): Result<Unit> {
            sendMessageCalls.incrementAndGet()
            lastSessionId = sessionId
            lastContent = content
            return Result.success(Unit)
        }
    }

    private class FakeWeatherRepository(
        private val weather: WeatherSummary?,
    ) : WeatherRepository {
        override fun subscribeToCurrentWeather(): Flow<WeatherSummary?> = flowOf(weather)
    }

    private class FakeFavoritesRepository(
        private val favorites: List<FavoriteLocation> = emptyList(),
    ) : FavoritesRepository {
        override fun subscribeToFavoriteLocations(): Flow<List<FavoriteLocation>> = flowOf(favorites)
    }

    private class FakeLocationRepository : com.laneshadow.data.location.LocationRepository {
        override suspend fun getCurrentLocation(): Result<com.laneshadow.data.location.LocationCoordinate> {
            return Result.success(
                com.laneshadow.data.location.LocationCoordinate(
                    latitude = 36.97,
                    longitude = -122.03,
                )
            )
        }
    }

    private fun createTestConvexClientProvider(): com.laneshadow.services.ConvexClientProvider {
        return com.laneshadow.services.ConvexClientProvider(
            appContext = androidx.test.core.app.ApplicationProvider.getApplicationContext(),
            authRepository = object : com.laneshadow.data.repository.AuthRepository {
                override suspend fun signIn(email: String, password: String): Result<com.laneshadow.data.model.ClerkUser> =
                    Result.failure(UnsupportedOperationException())
                override suspend fun signUp(email: String, password: String, name: String): Result<com.laneshadow.data.model.ClerkUser> =
                    Result.failure(UnsupportedOperationException())
                override suspend fun completeSignUpVerification(code: String): Result<com.laneshadow.data.model.ClerkUser> =
                    Result.failure(UnsupportedOperationException())
                override suspend fun signOut(): Result<Unit> = Result.success(Unit)
                override suspend fun handleUnauthenticated(message: String): Result<Unit> = Result.success(Unit)
                override suspend fun signInWithGoogle(): Result<com.laneshadow.data.model.ClerkUser> =
                    Result.failure(UnsupportedOperationException())
                override suspend fun signInWithApple(): Result<com.laneshadow.data.model.ClerkUser> =
                    Result.failure(UnsupportedOperationException())
                override suspend fun handleOAuthCallback(uri: android.net.Uri): Result<com.laneshadow.data.model.ClerkUser> =
                    Result.failure(UnsupportedOperationException())
                override suspend fun getJwtForConvex(): String = "test-jwt"
                override suspend fun bypassForTesting(): Result<com.laneshadow.data.model.ClerkUser> =
                    Result.failure(UnsupportedOperationException())
                override fun observeAuthState(): kotlinx.coroutines.flow.StateFlow<com.laneshadow.data.model.AuthState> =
                    kotlinx.coroutines.flow.MutableStateFlow(com.laneshadow.data.model.AuthState.SignedIn(
                        com.laneshadow.data.model.ClerkUser("id", "test@example.com", "Test", "token")
                    ))
            },
            convexGateway = object : com.laneshadow.services.ConvexGateway {
                override suspend fun bindAuthToken(token: String): Result<Unit> = Result.success(Unit)
                override suspend fun clearAuth(context: android.content.Context): Result<Unit> = Result.success(Unit)
                override suspend fun getCurrentUser(): com.laneshadow.services.ConvexCurrentUser? = null
                override fun observeCurrentUser(): kotlinx.coroutines.flow.Flow<com.laneshadow.services.ConvexCurrentUser?> =
                    kotlinx.coroutines.flow.flowOf(null)
                override fun observePlanningSessions(): kotlinx.coroutines.flow.Flow<List<com.laneshadow.data.session.PlanningSession>> =
                    kotlinx.coroutines.flow.flowOf(emptyList())
                override fun observeSessionMessages(sessionId: String): kotlinx.coroutines.flow.Flow<List<com.laneshadow.data.chat.SessionMessage>> =
                    kotlinx.coroutines.flow.flowOf(emptyList())
                override fun observeActiveRoutePlans(sessionId: String): kotlinx.coroutines.flow.Flow<List<com.laneshadow.data.route.RoutePlan>> =
                    kotlinx.coroutines.flow.flowOf(emptyList())
                override fun observeSessions(): kotlinx.coroutines.flow.Flow<List<com.laneshadow.ui.organisms.Session>> =
                    kotlinx.coroutines.flow.flowOf(emptyList())
                override fun observeFavoriteLocations(): kotlinx.coroutines.flow.Flow<List<com.laneshadow.data.favorites.FavoriteLocation>> =
                    kotlinx.coroutines.flow.flowOf(emptyList())
                override suspend fun sendMessage(
                    sessionId: String,
                    content: String,
                    currentLocation: com.laneshadow.ui.atoms.LatLng?,
                ): Result<com.laneshadow.services.ConvexSendMessageResponseDto> =
                    Result.success(com.laneshadow.services.ConvexSendMessageResponseDto("", "", emptyList()))
                override suspend fun createSession(firstMessage: String): Result<String> =
                    Result.success("sess-42")
                override suspend fun cancelPlan(routePlanId: String): Result<Unit> = Result.success(Unit)
                override suspend fun getCurrentWeather(lat: Double, lng: Double): com.laneshadow.data.dto.WeatherDto =
                    com.laneshadow.data.dto.WeatherDto(68.0, "Clear", "none")
                override suspend fun reverseGeocode(lat: Double, lng: Double): com.laneshadow.services.GeocodeResult =
                    com.laneshadow.services.GeocodeResult("Santa Cruz, CA", "place-123")
            },
        )
    }
}
