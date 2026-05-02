package com.laneshadow.ui.routeresults

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onAllNodesWithTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.semantics.SemanticsActions
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.navigation.Route
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.molecules.LSRouteAttachmentCardTag
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicReference

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

    @Composable
    private fun RouteResultsRouteHarness(
        navController: NavHostController,
        state: RouteResultsUiState,
        onRouteCardTapObserved: (String) -> Unit,
    ) {
        val loadedState = state as RouteResultsUiState.Loaded

        NavHost(
            navController = navController,
            startDestination = "route-results",
            modifier = Modifier.fillMaxSize(),
        ) {
            composable("route-results") {
                RouteResultsRoute(
                    navController = navController,
                    stateOverride = state,
                    onRouteCardTap = { routeOptionId ->
                        onRouteCardTapObserved(routeOptionId)
                        navController.navigate(
                            Route.RouteDetails(
                                sessionId = loadedState.sessionId,
                                routeOptionId = routeOptionId,
                            ),
                        )
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
