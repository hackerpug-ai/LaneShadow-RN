package com.laneshadow.ui.routedetails

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.dto.HourlyForecastDto
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.data.savedroutes.SavedRouteRepository
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.services.MainDispatcherRule
import com.laneshadow.services.RouteOption
import android.net.Uri
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Rule
import org.junit.Test

class RouteDetailsViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun state_selectedOption_populatesInstrumentReadoutWithRealMetrics() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = flowOf(listOf(completedPlan())),
            planJsonById = { flowOf(completedPlanJson()) },
            enrichmentsByPlanId = { flowOf(oneHourRouteEnrichmentJson()) },
        )
        val savedRouteRepository = FakeSavedRouteRepository(matches = flowOf(false))

        val viewModel = createViewModel(
            sessionId = "sess-1",
            routeOptionId = "opt-best",
            decodeDispatcher = StandardTestDispatcher(testScheduler),
            routeRepository = routeRepository,
            savedRouteRepository = savedRouteRepository,
        )

        val loaded = async {
            viewModel.state.first { state ->
                val loadedState = state as? RouteDetailsUiState.Loaded ?: return@first false
                loadedState.instrumentReadout.distanceKm == 48.28 &&
                    loadedState.instrumentReadout.durationMinutes == 120 &&
                    loadedState.instrumentReadout.elevationGainM == 540 &&
                    loadedState.instrumentReadout.scenicScore == 82
            }
        }
        advanceUntilIdle()

        val state = loaded.await() as RouteDetailsUiState.Loaded
        assertThat(state.routePlanId).isEqualTo("plan-7")
        assertThat(state.instrumentReadout.distanceKm).isWithin(0.01).of(48.28)
        assertThat(state.instrumentReadout.durationMinutes).isEqualTo(120)
        assertThat(state.instrumentReadout.elevationGainM).isEqualTo(540)
        assertThat(state.instrumentReadout.scenicScore).isEqualTo(82)
        assertThat(routeRepository.lastPlanId.get()).isEqualTo("plan-7")
        assertThat(routeRepository.lastEnrichmentPlanId.get()).isEqualTo("plan-7")
    }

    @Test
    fun state_enrichmentEmission_populatesSixHourWeatherTimeline() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = flowOf(listOf(completedPlan())),
            planJsonById = { flowOf(completedPlanJson()) },
            enrichmentsByPlanId = { flowOf(sixHourRouteEnrichmentJson()) },
        )
        val savedRouteRepository = FakeSavedRouteRepository(matches = flowOf(false))

        val viewModel = createViewModel(
            sessionId = "sess-1",
            routeOptionId = "opt-best",
            decodeDispatcher = StandardTestDispatcher(testScheduler),
            routeRepository = routeRepository,
            savedRouteRepository = savedRouteRepository,
        )

        val loaded = async {
            viewModel.state.first { state ->
                val loadedState = state as? RouteDetailsUiState.Loaded ?: return@first false
                loadedState.weatherTimeline.size == 6
            }
        }
        advanceUntilIdle()

        val state = loaded.await() as RouteDetailsUiState.Loaded
        assertThat(state.weatherTimeline).containsExactly(
            HourlyForecastDto(hour = "9 AM", temperature = "62", condition = "clear"),
            HourlyForecastDto(hour = "10 AM", temperature = "65", condition = "clear"),
            HourlyForecastDto(hour = "11 AM", temperature = "68", condition = "wind"),
            HourlyForecastDto(hour = "12 PM", temperature = "71", condition = "rain"),
            HourlyForecastDto(hour = "1 PM", temperature = "73", condition = "rain"),
            HourlyForecastDto(hour = "2 PM", temperature = "74", condition = "clear"),
        ).inOrder()
        assertThat(routeRepository.lastEnrichmentPlanId.get()).isEqualTo("plan-7")
    }

    @Test
    fun state_fingerprintMatch_setsSaveButtonStateAlreadySaved() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = flowOf(listOf(completedPlan())),
            planJsonById = { flowOf(completedPlanJson()) },
            enrichmentsByPlanId = { flowOf(sixHourRouteEnrichmentJson()) },
        )
        val savedRouteRepository = FakeSavedRouteRepository(matches = flowOf(true))

        val viewModel = createViewModel(
            sessionId = "sess-1",
            routeOptionId = "opt-best",
            decodeDispatcher = StandardTestDispatcher(testScheduler),
            routeRepository = routeRepository,
            savedRouteRepository = savedRouteRepository,
        )

        val loaded = async {
            viewModel.state.first { state ->
                val loadedState = state as? RouteDetailsUiState.Loaded ?: return@first false
                loadedState.saveButtonState == SaveButtonState.AlreadySaved
            }
        }
        advanceUntilIdle()

        val state = loaded.await() as RouteDetailsUiState.Loaded
        assertThat(state.saveButtonState).isEqualTo(SaveButtonState.AlreadySaved)
        assertThat(savedRouteRepository.lastFingerprint.get()).isNotNull()
        assertThat(savedRouteRepository.lastFingerprint.get()).startsWith("fnv1a:")
    }

    @Test
    fun onSaveTapped_raisesShowSaveSheetFlag() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = flowOf(listOf(completedPlan())),
            planJsonById = { flowOf(completedPlanJson()) },
            enrichmentsByPlanId = { flowOf(oneHourRouteEnrichmentJson()) },
        )
        val savedRouteRepository = FakeSavedRouteRepository(matches = flowOf(false))

        val viewModel = createViewModel(
            sessionId = "sess-1",
            routeOptionId = "opt-best",
            decodeDispatcher = StandardTestDispatcher(testScheduler),
            routeRepository = routeRepository,
            savedRouteRepository = savedRouteRepository,
        )

        val loaded = async {
            viewModel.state.first { it is RouteDetailsUiState.Loaded }
        }
        advanceUntilIdle()
        loaded.await()

        viewModel.onSaveTapped()
        advanceUntilIdle()

        val state = viewModel.state.value as RouteDetailsUiState.Loaded
        assertThat(state.showSaveSheet).isTrue()
        assertThat(state.saveButtonState).isEqualTo(SaveButtonState.NotSaved)
    }

    @Test
    fun state_enrichmentDelayed_emitsInstrumentReadoutWithoutBlockingOnWeather() = runTest {
        val delayedEnrichmentFlow = flow<JsonElement> {
            awaitCancellation()
        }
        val routeRepository = FakeRouteRepository(
            activePlans = flowOf(listOf(completedPlan())),
            planJsonById = { flowOf(completedPlanJson()) },
            enrichmentsByPlanId = { delayedEnrichmentFlow },
        )
        val savedRouteRepository = FakeSavedRouteRepository(matches = flowOf(false))

        val viewModel = createViewModel(
            sessionId = "sess-1",
            routeOptionId = "opt-best",
            decodeDispatcher = StandardTestDispatcher(testScheduler),
            routeRepository = routeRepository,
            savedRouteRepository = savedRouteRepository,
        )

        val loaded = async {
            viewModel.state.first { state ->
                val loadedState = state as? RouteDetailsUiState.Loaded ?: return@first false
                loadedState.weatherTimeline.isEmpty()
            }
        }
        advanceUntilIdle()

        val state = loaded.await() as RouteDetailsUiState.Loaded
        assertThat(state.instrumentReadout.distanceKm).isWithin(0.01).of(48.28)
        assertThat(state.instrumentReadout.durationMinutes).isEqualTo(120)
        assertThat(state.weatherTimeline).isEmpty()
    }

    private class FakeRouteRepository(
        private val activePlans: Flow<List<RoutePlan>>,
        private val planJsonById: (String) -> Flow<JsonObject>,
        private val enrichmentsByPlanId: (String) -> Flow<JsonElement>,
    ) : RouteRepository {
        val lastActivePlansSessionId = AtomicReference<String?>(null)
        val lastPlanId = AtomicReference<String?>(null)
        val lastEnrichmentPlanId = AtomicReference<String?>(null)

        override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> {
            lastActivePlansSessionId.set(sessionId)
            return activePlans
        }

        override fun subscribeToPlanById(routePlanId: String): Flow<JsonObject> {
            lastPlanId.set(routePlanId)
            return planJsonById(routePlanId)
        }

        override fun subscribeToEnrichments(routePlanId: String): Flow<JsonElement> {
            lastEnrichmentPlanId.set(routePlanId)
            return enrichmentsByPlanId(routePlanId)
        }

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> = Result.success(Unit)
    }

    private class FakeSavedRouteRepository(
        private val matches: Flow<Boolean>,
    ) : SavedRouteRepository(NoopAuthRepository) {
        val lastFingerprint = AtomicReference<String?>(null)

        override fun matchesFingerprint(routeIndexFingerprint: String): Flow<Boolean> {
            lastFingerprint.set(routeIndexFingerprint)
            return matches
        }
    }

    private object NoopAuthRepository : AuthRepository {
        private val authState = MutableStateFlow<AuthState>(AuthState.SignedOut)

        override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
            unsupported()

        override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
            unsupported()

        override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> =
            unsupported()

        override suspend fun signOut(): Result<Unit> = Result.success(Unit)

        override suspend fun handleUnauthenticated(message: String): Result<Unit> =
            Result.success(Unit)

        override suspend fun signInWithGoogle(): Result<ClerkUser> = unsupported()

        override suspend fun signInWithApple(): Result<ClerkUser> = unsupported()

        override suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser> = unsupported()

        override suspend fun getJwtForConvex(): String = "test-token"

        override suspend fun bypassForTesting(): Result<ClerkUser> = unsupported()

        override fun observeAuthState(): kotlinx.coroutines.flow.StateFlow<AuthState> = authState

        private fun <T> unsupported(): Result<T> =
            Result.failure(UnsupportedOperationException("Not used in RouteDetailsViewModelTest"))
    }

    private fun createViewModel(
        sessionId: String,
        routeOptionId: String,
        decodeDispatcher: CoroutineDispatcher,
        routeRepository: RouteRepository,
        savedRouteRepository: SavedRouteRepository,
    ): RouteDetailsViewModel =
        RouteDetailsViewModel(
            sessionId = sessionId,
            routeOptionId = routeOptionId,
            decodeDispatcher = decodeDispatcher,
            routeRepository = routeRepository,
            savedRouteRepository = savedRouteRepository,
            json = kotlinx.serialization.json.Json {
                ignoreUnknownKeys = true
                encodeDefaults = true
                explicitNulls = false
            },
        )

    private fun completedPlan(
        routePlanId: String = "plan-7",
        statusMessage: String = "Route is ready.",
    ): RoutePlan =
        RoutePlan(
            id = routePlanId,
            status = "completed",
            options = listOf(RouteOption(routeOptionId = "opt-best")),
            statusMessage = statusMessage,
        )

    private fun completedPlanJson(
        routePlanId: String = "plan-7",
        statusMessage: String = "Route is ready.",
    ): JsonObject =
        buildJsonObject {
            put("_id", JsonPrimitive(routePlanId))
            put("status", JsonPrimitive("completed"))
            put("statusMessage", JsonPrimitive(statusMessage))
            put(
                "result",
                buildJsonObject {
                    put(
                        "options",
                        buildJsonArray {
                            add(
                                buildJsonObject {
                                    put("routeOptionId", JsonPrimitive("opt-best"))
                                    put("label", JsonPrimitive("Skyline Spin"))
                                    put("rationale", JsonPrimitive("A calm scenic line."))
                                    put(
                                        "stats",
                                        buildJsonObject {
                                            put("distanceMeters", JsonPrimitive(48280))
                                            put("durationSeconds", JsonPrimitive(7200))
                                            put("elevationGainMeters", JsonPrimitive(540))
                                            put("scenicScore", JsonPrimitive(82))
                                        },
                                    )
                                    put(
                                        "map",
                                        buildJsonObject {
                                            put("provider", JsonPrimitive("google"))
                                            put(
                                                "overviewGeometry",
                                                buildJsonObject {
                                                    put("format", JsonPrimitive("polyline"))
                                                    put("encoding", JsonPrimitive("google_encoded_polyline"))
                                                    put("precision", JsonPrimitive(5))
                                                    put("value", JsonPrimitive("encoded_overview"))
                                                },
                                            )
                                            put(
                                                "legs",
                                                buildJsonArray {
                                                    add(
                                                        buildJsonObject {
                                                            put("legIndex", JsonPrimitive(0))
                                                            put("distanceMeters", JsonPrimitive(24140))
                                                            put("durationSeconds", JsonPrimitive(3600))
                                                            put(
                                                                "geometry",
                                                                buildJsonObject {
                                                                    put("format", JsonPrimitive("polyline"))
                                                                    put("encoding", JsonPrimitive("google_encoded_polyline"))
                                                                    put("precision", JsonPrimitive(5))
                                                                    put("value", JsonPrimitive("encoded_leg_1"))
                                                                },
                                                            )
                                                        },
                                                    )
                                                    add(
                                                        buildJsonObject {
                                                            put("legIndex", JsonPrimitive(1))
                                                            put("distanceMeters", JsonPrimitive(24140))
                                                            put("durationSeconds", JsonPrimitive(3600))
                                                            put(
                                                                "geometry",
                                                                buildJsonObject {
                                                                    put("format", JsonPrimitive("polyline"))
                                                                    put("encoding", JsonPrimitive("google_encoded_polyline"))
                                                                    put("precision", JsonPrimitive(5))
                                                                    put("value", JsonPrimitive("encoded_leg_2"))
                                                                },
                                                            )
                                                        },
                                                    )
                                                },
                                            )
                                        },
                                    )
                                },
                            )
                        },
                    )
                },
            )
        }

    private fun oneHourRouteEnrichmentJson(): JsonObject =
        buildJsonObject {
            put("routePlanId", JsonPrimitive("plan-7"))
            put(
                "enrichments",
                buildJsonArray {
                    add(
                        buildJsonObject {
                            put("routeOptionId", JsonPrimitive("opt-best"))
                            put("label", JsonPrimitive("Skyline Spin"))
                            put("rationale", JsonPrimitive("A calm scenic line."))
                            put(
                                "highlights",
                                buildJsonArray {
                                    add(JsonPrimitive("Coastal air"))
                                },
                            )
                            put(
                                "weather",
                                buildJsonArray {
                                    add(
                                        buildJsonObject {
                                            put("hour", JsonPrimitive("9 AM"))
                                            put("temperature", JsonPrimitive("62"))
                                            put("condition", JsonPrimitive("clear"))
                                        },
                                    )
                                },
                            )
                        },
                    )
                },
            )
        }

    private fun sixHourRouteEnrichmentJson(): JsonObject =
        buildJsonObject {
            put("routePlanId", JsonPrimitive("plan-7"))
            put(
                "enrichments",
                buildJsonArray {
                    add(
                        buildJsonObject {
                            put("routeOptionId", JsonPrimitive("opt-best"))
                            put("label", JsonPrimitive("Skyline Spin"))
                            put("rationale", JsonPrimitive("A calm scenic line."))
                            put(
                                "highlights",
                                buildJsonArray {
                                    add(JsonPrimitive("Coastal air"))
                                },
                            )
                            put(
                                "weather",
                                buildJsonArray {
                                    add(
                                        buildJsonObject {
                                            put("hour", JsonPrimitive("9 AM"))
                                            put("temperature", JsonPrimitive("62"))
                                            put("condition", JsonPrimitive("clear"))
                                        },
                                    )
                                    add(
                                        buildJsonObject {
                                            put("hour", JsonPrimitive("10 AM"))
                                            put("temperature", JsonPrimitive("65"))
                                            put("condition", JsonPrimitive("clear"))
                                        },
                                    )
                                    add(
                                        buildJsonObject {
                                            put("hour", JsonPrimitive("11 AM"))
                                            put("temperature", JsonPrimitive("68"))
                                            put("condition", JsonPrimitive("wind"))
                                        },
                                    )
                                    add(
                                        buildJsonObject {
                                            put("hour", JsonPrimitive("12 PM"))
                                            put("temperature", JsonPrimitive("71"))
                                            put("condition", JsonPrimitive("rain"))
                                        },
                                    )
                                    add(
                                        buildJsonObject {
                                            put("hour", JsonPrimitive("1 PM"))
                                            put("temperature", JsonPrimitive("73"))
                                            put("condition", JsonPrimitive("rain"))
                                        },
                                    )
                                    add(
                                        buildJsonObject {
                                            put("hour", JsonPrimitive("2 PM"))
                                            put("temperature", JsonPrimitive("74"))
                                            put("condition", JsonPrimitive("clear"))
                                        },
                                    )
                                },
                            )
                        },
                    )
                },
            )
        }
}
