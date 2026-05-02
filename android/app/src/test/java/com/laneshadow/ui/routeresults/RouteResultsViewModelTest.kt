package com.laneshadow.ui.routeresults

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.services.AppPreferences
import com.laneshadow.services.AppStateRepository
import com.laneshadow.services.MainDispatcherRule
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Rule
import org.junit.Test

class RouteResultsViewModelTest {
    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    @Test
    fun state_completedPlanWithThreeOptions_emitsThreePolylinesAndThreeCards() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = flowOf(listOf(completedPlan())),
            planJson = completedPlanJson(),
        )
        val chatRepository = FakeChatRepository()
        val appStateRepository = FakeAppStateRepository(sessionId = "sess-1")

        createViewModel(
            appStateRepository = appStateRepository,
            routeRepository = routeRepository,
            chatRepository = chatRepository,
        ).use { handle ->
            advanceUntilIdle()
            assertThat(routeRepository.lastActivePlansSessionId.get()).isEqualTo("sess-1")
            assertThat(routeRepository.lastPlanId.get()).isEqualTo("plan-1")
            val loaded = awaitLoadedState(handle.viewModel)
            assertThat(loaded.sessionId).isEqualTo("sess-1")
            assertThat(loaded.routePlanId).isEqualTo("plan-1")
            assertThat(loaded.navigatorBody).isEqualTo("Three route options ready.")
            assertThat(loaded.selectedRouteId).isEqualTo("opt-best")
            assertThat(loaded.polylineEntries).hasSize(3)
            assertThat(loaded.polylineEntries.map { it.routeOptionId }).containsExactly(
                "opt-best",
                "opt-alt1",
                "opt-alt2",
            ).inOrder()
            assertThat(loaded.polylineEntries.map { it.variant }).containsExactly(
                RouteVariant.Best,
                RouteVariant.Alt1,
                RouteVariant.Alt2,
            ).inOrder()
            assertThat(loaded.polylineEntries.map { it.style }).containsExactly(
                PolylineStyle.Solid,
                PolylineStyle.Dashed,
                PolylineStyle.Dashed,
            ).inOrder()
            assertThat(loaded.attachmentCards).hasSize(3)
            assertThat(loaded.attachmentCards.map { it.routeOptionId }).containsExactly(
                "opt-best",
                "opt-alt1",
                "opt-alt2",
            ).inOrder()
            assertThat(loaded.attachmentCards[0].selected).isTrue()
            assertThat(loaded.attachmentCards[0].borderColor).isEqualTo(GeneratedTokens.color.Route.best)
        }
    }

    @Test
    fun selectRoute_altOption_promotesPolylineAndRetintsCardBorder() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = flowOf(listOf(completedPlan())),
            planJson = completedPlanJson(),
        )
        val chatRepository = FakeChatRepository()
        val appStateRepository = FakeAppStateRepository(sessionId = "sess-1")

        createViewModel(
            appStateRepository = appStateRepository,
            routeRepository = routeRepository,
            chatRepository = chatRepository,
        ).use { handle ->
            advanceUntilIdle()
            awaitLoadedState(handle.viewModel)
            handle.viewModel.selectRoute("opt-alt2")

            val loaded = handle.viewModel.state.value as RouteResultsUiState.Loaded
            assertThat(loaded.selectedRouteId).isEqualTo("opt-alt2")
            assertThat(loaded.polylineEntries[0].style).isEqualTo(PolylineStyle.Dashed)
            assertThat(loaded.polylineEntries[1].style).isEqualTo(PolylineStyle.Dashed)
            assertThat(loaded.polylineEntries[2].style).isEqualTo(PolylineStyle.Solid)
            assertThat(loaded.attachmentCards[2].selected).isTrue()
            assertThat(loaded.attachmentCards[2].borderColor).isEqualTo(GeneratedTokens.color.Route.alt2)
        }
    }

    @Test
    fun recallAttachments_afterDismiss_restoresThreeAttachmentCards() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = flowOf(listOf(completedPlan())),
            planJson = completedPlanJson(),
        )
        val chatRepository = FakeChatRepository()
        val appStateRepository = FakeAppStateRepository(sessionId = "sess-1")

        createViewModel(
            appStateRepository = appStateRepository,
            routeRepository = routeRepository,
            chatRepository = chatRepository,
        ).use { handle ->
            advanceUntilIdle()
            awaitLoadedState(handle.viewModel)
            handle.viewModel.dismissAttachments()

            val dismissed = handle.viewModel.state.value as RouteResultsUiState.Loaded
            assertThat(dismissed.attachmentsDismissed).isTrue()
            assertThat(dismissed.showRecallChip).isTrue()
            assertThat(dismissed.attachmentCards).hasSize(3)

            handle.viewModel.recallAttachments()
            advanceUntilIdle()

            val recalled = handle.viewModel.state.value as RouteResultsUiState.Loaded
            assertThat(recalled.attachmentsDismissed).isFalse()
            assertThat(recalled.showRecallChip).isFalse()
            assertThat(recalled.attachmentCards).hasSize(3)
        }
    }

    @Test
    fun refine_reusesExistingSessionIdAndDispatchesSendMessage() = runTest {
        val routeRepository = FakeRouteRepository(
            activePlans = flowOf(listOf(completedPlan())),
            planJson = completedPlanJson(),
        )
        val chatRepository = FakeChatRepository()
        val appStateRepository = FakeAppStateRepository(sessionId = "sess-1")

        createViewModel(
            appStateRepository = appStateRepository,
            routeRepository = routeRepository,
            chatRepository = chatRepository,
        ).use { handle ->
            advanceUntilIdle()
            awaitLoadedState(handle.viewModel)
            handle.viewModel.refine("shorter, avoid Hwy 1")
            advanceUntilIdle()

            assertThat(chatRepository.sendMessageCalls.get()).isEqualTo(1)
            assertThat(chatRepository.lastSessionId.get()).isEqualTo("sess-1")
            assertThat(chatRepository.lastContent.get()).isEqualTo("shorter, avoid Hwy 1")
        }
    }

    private class FakeAppStateRepository(
        sessionId: String?,
    ) : AppStateRepository {
        override val appState: Flow<AppPreferences> = flowOf(
            AppPreferences(lastViewedSessionId = sessionId),
        )

        override suspend fun setLastViewedSessionId(sessionId: String?) = Unit

        override suspend fun setSessionCamera(
            sessionId: String,
            camera: com.laneshadow.services.CameraPosition,
        ) = Unit

        override suspend fun setDefaultCamera(camera: com.laneshadow.services.CameraPosition?) = Unit

        override suspend fun setThemeMode(themeMode: com.laneshadow.services.ThemeMode) = Unit

        override suspend fun setHasCompletedOnboarding(hasCompletedOnboarding: Boolean) = Unit

        override suspend fun clearSessionLocalState() = Unit
    }

    private class FakeRouteRepository(
        private val activePlans: Flow<List<RoutePlan>>,
        private val planJson: JsonObject,
    ) : RouteRepository {
        val lastActivePlansSessionId = AtomicReference<String?>(null)
        val lastPlanId = AtomicReference<String?>(null)

        override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> {
            lastActivePlansSessionId.set(sessionId)
            return activePlans
        }

        override fun subscribeToPlanById(routePlanId: String): Flow<JsonObject> {
            lastPlanId.set(routePlanId)
            return flowOf(planJson)
        }

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> = Result.success(Unit)
    }

    private class FakeChatRepository : ChatRepository {
        val sendMessageCalls = AtomicInteger(0)
        val lastSessionId = AtomicReference<String?>(null)
        val lastContent = AtomicReference<String?>(null)

        override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> =
            flowOf(emptyList())

        override suspend fun sendMessage(
            sessionId: String,
            content: String,
            currentLocation: LatLng?,
        ): Result<Unit> {
            sendMessageCalls.incrementAndGet()
            lastSessionId.set(sessionId)
            lastContent.set(content)
            return Result.success(Unit)
        }
    }

    private fun completedPlan(): RoutePlan =
        RoutePlan(
            id = "plan-1",
            status = "completed",
            options = emptyList(),
            statusMessage = "Three route options ready.",
        )

    private fun completedPlanJson(): JsonObject =
        buildJsonObject {
            put("_id", JsonPrimitive("plan-1"))
            put("status", JsonPrimitive("completed"))
            put("statusMessage", JsonPrimitive("Three route options ready."))
            put(
                "result",
                buildJsonObject {
                    put(
                        "options",
                        buildJsonArray {
                            add(routeOptionJson(
                                id = "opt-best",
                                label = "Best",
                                rationale = "The calmest line through the hills.",
                                polyline = "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
                                distanceMeters = 10000,
                                durationSeconds = 900,
                            ))
                            add(routeOptionJson(
                                id = "opt-alt1",
                                label = "Alt 1",
                                rationale = "A quicker coastal line with more traffic.",
                                polyline = "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
                                distanceMeters = 11000,
                                durationSeconds = 960,
                            ))
                            add(routeOptionJson(
                                id = "opt-alt2",
                                label = "Alt 2",
                                rationale = "More climbing but the longest clear sight lines.",
                                polyline = "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
                                distanceMeters = 12000,
                                durationSeconds = 1020,
                            ))
                        },
                    )
                },
            )
        }

    private fun routeOptionJson(
        id: String,
        label: String,
        rationale: String,
        polyline: String,
        distanceMeters: Int,
        durationSeconds: Int,
    ): JsonObject =
        buildJsonObject {
            put("routeOptionId", JsonPrimitive(id))
            put("label", JsonPrimitive(label))
            put("rationale", JsonPrimitive(rationale))
            put(
                "stats",
                buildJsonObject {
                    put("distanceMeters", JsonPrimitive(distanceMeters))
                    put("durationSeconds", JsonPrimitive(durationSeconds))
                },
            )
            put(
                "map",
                buildJsonObject {
                    put(
                        "overviewGeometry",
                        buildJsonObject {
                            put("value", JsonPrimitive(polyline))
                        },
                    )
                },
            )
        }

    private fun createViewModel(
        appStateRepository: AppStateRepository,
        routeRepository: RouteRepository,
        chatRepository: ChatRepository,
    ): TestRouteResultsViewModel {
        val store = ViewModelStore()
        val factory = object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                @Suppress("UNCHECKED_CAST")
                return RouteResultsViewModel(
                    appStateRepository = appStateRepository,
                    routeRepository = routeRepository,
                    chatRepository = chatRepository,
                    json = kotlinx.serialization.json.Json {
                        ignoreUnknownKeys = true
                        encodeDefaults = true
                        explicitNulls = false
                    },
                ) as T
            }
        }

        val viewModel = ViewModelProvider(store, factory)[RouteResultsViewModel::class.java]
        return TestRouteResultsViewModel(store = store, viewModel = viewModel)
    }

    private data class TestRouteResultsViewModel(
        val store: ViewModelStore,
        val viewModel: RouteResultsViewModel,
    ) : AutoCloseable {
        override fun close() {
            store.clear()
        }
    }

    private suspend fun awaitLoadedState(viewModel: RouteResultsViewModel): RouteResultsUiState.Loaded {
        val state = withTimeout(5_000) {
            viewModel.state.first { it !is RouteResultsUiState.Loading }
        }

        require(state is RouteResultsUiState.Loaded) {
            "Expected Loaded state, got $state"
        }
        return state
    }
}
