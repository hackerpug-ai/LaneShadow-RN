package com.laneshadow.ui.routeresults

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performSemanticsAction
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.data.chat.ChatRepository
import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.route.RouteRepository
import com.laneshadow.navigation.Route
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.molecules.LSRouteAttachmentCardBorderColorKey
import com.laneshadow.ui.molecules.LSRouteAttachmentCardTag
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class RouteResultsRouteTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun onRouteCardTap_navigatesToRouteDetailsWithSessionAndOptionId() {
        val tapInvocationCount = AtomicInteger(0)
        val tappedRouteOptionId = AtomicReference<String?>(null)

        composeTestRule.setContent {
            LaneShadowTheme {
                val navController = rememberNavController()
                RouteResultsRouteHarness(
                    navController = navController,
                    sessionId = "sess-1",
                    state = loadedState(),
                    onRouteCardTapObserved = { routeOptionId ->
                        tapInvocationCount.incrementAndGet()
                        tappedRouteOptionId.set(routeOptionId)
                    },
                )
            }
        }

        composeTestRule.waitForIdle()

        composeTestRule.onAllNodesWithTag(LSRouteAttachmentCardTag, useUnmergedTree = true)
            .assertCountEquals(3)
        composeTestRule.onNodeWithContentDescription("Alt 1 route card")
            .assertHasClickAction()
        val wrapperNode = composeTestRule.onNodeWithTag("route-results-attachment-opt-alt1")
        wrapperNode
            .assertHasClickAction()
            .performSemanticsAction(SemanticsActions.OnClick)

        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            tapInvocationCount.get() > 0
        }

        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            tappedRouteOptionId.get() == "opt-alt1"
        }

        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            composeTestRule.onAllNodesWithTag("route-details-destination")
                .fetchSemanticsNodes()
                .isNotEmpty()
        }

        composeTestRule.onNodeWithTag("route-details-destination")
            .assertExists()
        composeTestRule.onNodeWithText("sess-1|opt-alt1")
            .assertExists()
    }

    @Test
    fun tappingRouteCard_updatesSelectedPolylineAndBorderInProductionRoute() {
        val viewModel = createViewModel(sessionId = "sess-1")
        val tapInvocationCount = AtomicInteger(0)

        composeTestRule.setContent {
            LaneShadowTheme {
                val navController = rememberNavController()
                RouteResultsRouteHarness(
                    navController = navController,
                    sessionId = "sess-1",
                    viewModel = viewModel,
                    state = null,
                    navigateOnTap = false,
                    onRouteCardTapObserved = {
                        tapInvocationCount.incrementAndGet()
                    },
                )
            }
        }

        composeTestRule.waitForIdle()

        composeTestRule.onAllNodesWithTag(LSRouteAttachmentCardTag, useUnmergedTree = true)
            .assertCountEquals(3)
        composeTestRule.onNodeWithTag("route-results-map")
            .assert(hasStateDescription("opt-best:Solid,opt-alt1:Dashed,opt-alt2:Dashed"))
        composeTestRule.onNodeWithTag("route-results-attachment-opt-alt2")
            .assertHasClickAction()
            .performSemanticsAction(SemanticsActions.OnClick)

        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            tapInvocationCount.get() == 1
        }

        composeTestRule.waitForIdle()

        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            composeTestRule.onAllNodes(
                hasStateDescription("opt-best:Dashed,opt-alt1:Dashed,opt-alt2:Solid"),
            )
                .fetchSemanticsNodes()
                .isNotEmpty()
        }

        composeTestRule.onNodeWithTag("route-results-attachment-opt-alt2")
            .assert(SemanticsMatcher.expectValue(
                LSRouteAttachmentCardBorderColorKey,
                GeneratedTokens.color.Route.alt2,
            ))
        composeTestRule.onAllNodesWithTag("navigator-pin-icon")
            .assertCountEquals(0)
    }

    @Composable
    private fun RouteResultsRouteHarness(
        navController: NavHostController,
        sessionId: String,
        state: RouteResultsUiState? = null,
        viewModel: RouteResultsViewModel? = null,
        navigateOnTap: Boolean = true,
        onRouteCardTapObserved: (String) -> Unit,
    ) {
        NavHost(
            navController = navController,
            startDestination = "route-results",
            modifier = Modifier.fillMaxSize(),
        ) {
            composable("route-results") {
                RouteResultsRoute(
                    navController = navController,
                    sessionId = sessionId,
                    viewModel = viewModel,
                    stateOverride = state,
                    onRouteCardTap = { routeOptionId ->
                        onRouteCardTapObserved(routeOptionId)
                        if (navigateOnTap) {
                            navController.navigate(
                                Route.RouteDetails(
                                    sessionId = sessionId,
                                    routeOptionId = routeOptionId,
                                ),
                            )
                        }
                    },
                )
            }
            composable<Route.RouteDetails> { backStackEntry ->
                val route = backStackEntry.toRoute<Route.RouteDetails>()
                Text(
                    text = "${route.sessionId}|${route.routeOptionId}",
                    modifier = Modifier
                        .fillMaxSize()
                        .testTag("route-details-destination"),
                )
            }
        }
    }

    private fun createViewModel(sessionId: String): RouteResultsViewModel =
        RouteResultsViewModel(
            sessionId = sessionId,
            decodeDispatcher = Dispatchers.Default,
            routeRepository = FakeRouteRepository(
                activePlans = flowOf(listOf(completedPlan())),
                planJson = flowOf(completedPlanJson()),
            ),
            chatRepository = FakeChatRepository(),
            json = kotlinx.serialization.json.Json {
                ignoreUnknownKeys = true
                encodeDefaults = true
                explicitNulls = false
            },
        )

    private class FakeRouteRepository(
        private val activePlans: Flow<List<RoutePlan>>,
        private val planJson: Flow<JsonObject>,
    ) : RouteRepository {
        override fun subscribeToActiveRoutePlans(sessionId: String): Flow<List<RoutePlan>> = activePlans

        override fun subscribeToPlanById(routePlanId: String): Flow<JsonObject> = planJson

        override suspend fun cancelPlan(routePlanId: String): Result<Unit> = Result.success(Unit)
    }

    private class FakeChatRepository : ChatRepository {
        override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> =
            flowOf(emptyList())

        override suspend fun sendMessage(
            sessionId: String,
            content: String,
            currentLocation: LatLng?,
        ): Result<Unit> = Result.success(Unit)
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

    private fun hasStateDescription(expected: String): SemanticsMatcher =
        SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, expected)

    private fun loadedState(): RouteResultsUiState.Loaded =
        RouteResultsUiState.Loaded(
            sessionId = "sess-1",
            routePlanId = "plan-1",
            navigatorBody = "Three route options ready.",
            selectedRouteId = "opt-best",
            attachmentsDismissed = false,
            polylineEntries = listOf(
                PolylineEntry(
                    routeOptionId = "opt-best",
                    variant = RouteVariant.Best,
                    coordinates = listOf(
                        LatLng(37.0, -122.0),
                        LatLng(37.1, -122.1),
                    ),
                    style = PolylineStyle.Solid,
                ),
                PolylineEntry(
                    routeOptionId = "opt-alt1",
                    variant = RouteVariant.Alt1,
                    coordinates = listOf(
                        LatLng(37.05, -122.05),
                        LatLng(37.15, -122.15),
                    ),
                    style = PolylineStyle.Dashed,
                ),
                PolylineEntry(
                    routeOptionId = "opt-alt2",
                    variant = RouteVariant.Alt2,
                    coordinates = listOf(
                        LatLng(37.08, -122.08),
                        LatLng(37.18, -122.18),
                    ),
                    style = PolylineStyle.Dashed,
                ),
            ),
            attachmentCards = listOf(
                attachmentCard(
                    routeOptionId = "opt-best",
                    title = "Best",
                    via = "The calmest line through the hills.",
                    variant = RouteVariant.Best,
                    borderColor = GeneratedTokens.color.Route.best,
                    selected = true,
                    scenicScore = 5,
                ),
                attachmentCard(
                    routeOptionId = "opt-alt1",
                    title = "Alt 1",
                    via = "A quicker coastal line with more traffic.",
                    variant = RouteVariant.Alt1,
                    borderColor = GeneratedTokens.color.Route.alt1,
                    selected = false,
                    scenicScore = 4,
                ),
                attachmentCard(
                    routeOptionId = "opt-alt2",
                    title = "Alt 2",
                    via = "More climbing but the longest clear sight lines.",
                    variant = RouteVariant.Alt2,
                    borderColor = GeneratedTokens.color.Route.alt2,
                    selected = false,
                    scenicScore = 3,
                ),
            ),
        )

    private fun attachmentCard(
        routeOptionId: String,
        title: String,
        via: String,
        variant: RouteVariant,
        borderColor: androidx.compose.ui.graphics.Color,
        selected: Boolean,
        scenicScore: Int,
    ): AttachmentCard =
        AttachmentCard(
            routeOptionId = routeOptionId,
            title = title,
            via = via,
            distanceLabel = "10 mi",
            durationLabel = "15m",
            scenicScore = scenicScore,
            variant = variant,
            borderColor = borderColor,
            selected = selected,
            isBest = variant == RouteVariant.Best,
        )
}
