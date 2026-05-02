package com.laneshadow.ui.routeresults

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.services.MainDispatcherRule
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.StandardTestDispatcher
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
            planJsonById = { flowOf(completedPlanJson()) },
        )
        val chatRepository = FakeChatRepository()

        createViewModel(
            sessionId = "sess-1",
            decodeDispatcher = StandardTestDispatcher(testScheduler),
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
            planJsonById = { flowOf(completedPlanJson()) },
        )
        val chatRepository = FakeChatRepository()

        createViewModel(
            sessionId = "sess-1",
            decodeDispatcher = StandardTestDispatcher(testScheduler),
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
            planJsonById = { flowOf(completedPlanJson()) },
        )
        val chatRepository = FakeChatRepository()

        createViewModel(
            sessionId = "sess-1",
            decodeDispatcher = StandardTestDispatcher(testScheduler),
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
            planJsonById = { flowOf(completedPlanJson()) },
        )
        val chatRepository = FakeChatRepository()

        createViewModel(
            sessionId = "sess-1",
            decodeDispatcher = StandardTestDispatcher(testScheduler),
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

    @Test
    fun activePlanFlow_switchesToLatestCompletedPlanAndKeepsListening() = runTest {
        val activePlans = MutableSharedFlow<List<RoutePlan>>(replay = 1)
        val planOneJson = MutableSharedFlow<JsonObject>(replay = 1)
        val planTwoJson = MutableSharedFlow<JsonObject>(replay = 1)

        val routeRepository = FakeRouteRepository(
            activePlans = activePlans,
            planJsonById = { routePlanId ->
                when (routePlanId) {
                    "plan-1" -> planOneJson
                    "plan-2" -> planTwoJson
                    else -> flowOf(completedPlanJson(routePlanId = routePlanId))
                }
            },
        )
        val chatRepository = FakeChatRepository()

        createViewModel(
            sessionId = "sess-1",
            decodeDispatcher = StandardTestDispatcher(testScheduler),
            routeRepository = routeRepository,
            chatRepository = chatRepository,
        ).use { handle ->
            activePlans.tryEmit(listOf(completedPlan(routePlanId = "plan-1")))
            planOneJson.tryEmit(completedPlanJson(routePlanId = "plan-1", statusMessage = "Plan 1 ready."))
            advanceUntilIdle()

            val firstLoaded = awaitLoadedState(handle.viewModel)
            assertThat(firstLoaded.routePlanId).isEqualTo("plan-1")
            assertThat(firstLoaded.navigatorBody).isEqualTo("Plan 1 ready.")

            activePlans.tryEmit(listOf(completedPlan(routePlanId = "plan-2")))
            planTwoJson.tryEmit(completedPlanJson(routePlanId = "plan-2", statusMessage = "Plan 2 ready."))
            advanceUntilIdle()

            val secondLoaded = awaitLoadedState(handle.viewModel)
            assertThat(secondLoaded.routePlanId).isEqualTo("plan-2")
            assertThat(secondLoaded.navigatorBody).isEqualTo("Plan 2 ready.")
        }
    }

    private class FakeRouteRepository(
        private val activePlans: Flow<List<RoutePlan>>,
        private val planJsonById: (String) -> Flow<JsonObject>,
    ) : RouteRepository {
        val lastActivePlansSessionId = AtomicReference<String?>(null)
        val lastPlanId = AtomicReference<String?>(null)

        override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> {
            lastActivePlansSessionId.set(sessionId)
            return activePlans
        }

        override fun subscribeToPlanById(routePlanId: String): Flow<JsonObject> {
            lastPlanId.set(routePlanId)
            return planJsonById(routePlanId)
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

    private fun completedPlan(
        routePlanId: String = "plan-1",
        statusMessage: String = "Three route options ready.",
    ): RoutePlan =
        RoutePlan(
            id = routePlanId,
            status = "completed",
            options = emptyList(),
            statusMessage = statusMessage,
        )

    private fun completedPlanJson(
        routePlanId: String = "plan-1",
        statusMessage: String = "Three route options ready.",
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
        sessionId: String,
        decodeDispatcher: CoroutineDispatcher,
        routeRepository: RouteRepository,
        chatRepository: ChatRepository,
    ): TestRouteResultsViewModel {
        val viewModel = RouteResultsViewModel(
            sessionId = sessionId,
            decodeDispatcher = decodeDispatcher,
            routeRepository = routeRepository,
            chatRepository = chatRepository,
            json = kotlinx.serialization.json.Json {
                ignoreUnknownKeys = true
                encodeDefaults = true
                explicitNulls = false
            },
        )

        return TestRouteResultsViewModel(viewModel = viewModel)
    }

    private data class TestRouteResultsViewModel(
        val viewModel: RouteResultsViewModel,
    ) : AutoCloseable {
        override fun close() = Unit
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
