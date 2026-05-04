package com.laneshadow.ui.routeresults

import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotDisplayed
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.getOrNull
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * AC-4: Alt polyline promotes to solid stroke on selection change
 * GIVEN: RouteResultsScreen renders selectedRouteId = 'route-a' (solid) and 'route-b' as dashed alt
 * WHEN:  selectedRouteId state transitions from 'route-a' to 'route-b'
 * THEN:  Polyline for 'route-b' renders with solid stroke AND polyline for 'route-a' renders with dashed stroke (verified via Compose semantics tag 'polyline-style-{routeId}')
 *
 * This test verifies REAL polyline style changes through Compose semantics:
 * - Polyline style (Solid/Dashed) changes based on selectedRouteId
 * - State changes trigger recomposition
 * - Semantics stateDescription reflects the actual polyline styles
 */
@RunWith(AndroidJUnit4::class)
class RouteResultsPolylineUiTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    /**
     * AC-4: Alt polyline promotes to solid stroke on selection change
     *
     * RED PHASE: This test FAILS if polyline styles don't update correctly
     * GREEN PHASE: Passes when stateDescription reflects correct Solid/Dashed styles
     *
     * This test verifies REAL Compose semantics by reading the stateDescription
     * from the map's semantics node, which contains the polyline style information.
     */
    @Test
    fun alt_polyline_promotes_to_solid_on_selection_change() {
        // GIVEN: RouteResultsScreen with route-a selected (solid), route-b dashed
        val initialState = RouteResultsUiState.Loaded(
            sessionId = "test-session",
            routePlanId = "test-plan",
            navigatorBody = "Three route options are ready.",
            selectedRouteId = "route-a",
            attachmentsDismissed = false,
            polylineEntries = listOf(
                PolylineEntry(
                    routeOptionId = "route-a",
                    variant = com.laneshadow.ui.atoms.RouteVariant.Best,
                    coordinates = listOf(
                        com.laneshadow.ui.atoms.LatLng(37.8104, -122.4752),
                        com.laneshadow.ui.atoms.LatLng(37.8105, -122.4753)
                    ),
                    style = PolylineStyle.Solid, // Selected route is solid
                ),
                PolylineEntry(
                    routeOptionId = "route-b",
                    variant = com.laneshadow.ui.atoms.RouteVariant.Alt1,
                    coordinates = listOf(
                        com.laneshadow.ui.atoms.LatLng(37.8104, -122.4752),
                        com.laneshadow.ui.atoms.LatLng(37.8105, -122.4753)
                    ),
                    style = PolylineStyle.Dashed, // Alt route is dashed
                ),
                PolylineEntry(
                    routeOptionId = "route-c",
                    variant = com.laneshadow.ui.atoms.RouteVariant.Alt2,
                    coordinates = listOf(
                        com.laneshadow.ui.atoms.LatLng(37.8104, -122.4752),
                        com.laneshadow.ui.atoms.LatLng(37.8105, -122.4753)
                    ),
                    style = PolylineStyle.Dashed, // Alt route is dashed
                ),
            ),
            attachmentCards = listOf(
                AttachmentCard(
                    routeOptionId = "route-a",
                    title = "Route 1",
                    via = "Via Highway 1",
                    distanceLabel = "12 mi",
                    durationLabel = "25m",
                    scenicScore = 5,
                    variant = com.laneshadow.ui.atoms.RouteVariant.Best,
                    borderColor = androidx.compose.ui.graphics.Color.Red,
                    selected = true,
                    isBest = true,
                ),
                AttachmentCard(
                    routeOptionId = "route-b",
                    title = "Route 2",
                    via = "Via Highway 101",
                    distanceLabel = "15 mi",
                    durationLabel = "30m",
                    scenicScore = 3,
                    variant = com.laneshadow.ui.atoms.RouteVariant.Alt1,
                    borderColor = androidx.compose.ui.graphics.Color.Blue,
                    selected = false,
                ),
                AttachmentCard(
                    routeOptionId = "route-c",
                    title = "Route 3",
                    via = "Via scenic route",
                    distanceLabel = "18 mi",
                    durationLabel = "40m",
                    scenicScore = 4,
                    variant = com.laneshadow.ui.atoms.RouteVariant.Alt2,
                    borderColor = androidx.compose.ui.graphics.Color.Green,
                    selected = false,
                ),
            ),
        )

        var uiState by mutableStateOf(initialState)

        composeTestRule.setContent {
            RouteResultsLoaded(
                state = uiState,
                navController = androidx.navigation.NavHostController(androidx.compose.ui.platform.LocalContext.current),
                onRouteCardTap = { routeOptionId ->
                    // Simulate viewModel.selectRoute(routeOptionId)
                    // This should update the polyline styles
                    uiState = uiState.withSelectedRoute(routeOptionId)
                },
                onDismissAttachments = {},
                onRecallAttachments = {},
                onRefineSend = {},
            )
        }

        // Verify initial state: route-a is solid, route-b and route-c are dashed
        val mapNode = composeTestRule.onNodeWithTag("route-results-map")
        val initialStateDesc = mapNode.fetchSemanticsNode().config.getOrNull(
            androidx.compose.ui.semantics.SemanticsProperties.StateDescription
        )
        assert(initialStateDesc?.contains("route-a:Solid") == true) {
            "Expected route-a:Solid in initial state, got: $initialStateDesc"
        }
        assert(initialStateDesc?.contains("route-b:Dashed") == true) {
            "Expected route-b:Dashed in initial state, got: $initialStateDesc"
        }
        assert(initialStateDesc?.contains("route-c:Dashed") == true) {
            "Expected route-c:Dashed in initial state, got: $initialStateDesc"
        }

        // WHEN: User selects route-b
        composeTestRule.onNodeWithTag("route-results-attachment-route-b")
            .performClick()

        // THEN: route-b becomes solid, route-a becomes dashed
        // Verify through Compose semantics stateDescription
        val newStateDesc = mapNode.fetchSemanticsNode().config.getOrNull(
            androidx.compose.ui.semantics.SemanticsProperties.StateDescription
        )
        assert(newStateDesc?.contains("route-b:Solid") == true) {
            "Expected route-b:Solid after selection, got: $newStateDesc"
        }
        assert(newStateDesc?.contains("route-a:Dashed") == true) {
            "Expected route-a:Dashed after route-b selection, got: $newStateDesc"
        }
        assert(newStateDesc?.contains("route-c:Dashed") == true) {
            "Expected route-c:Dashed (unchanged), got: $newStateDesc"
        }
    }

    /**
     * AC-4: All routes cycle correctly - only selected is Solid
     *
     * Tests that selecting each route in turn correctly updates polyline styles
     * such that only the selected route is Solid and all others are Dashed.
     */
    @Test
    fun all_routes_cycle_correctly_only_selected_is_solid() {
        val initialState = RouteResultsUiState.Loaded(
            sessionId = "test-session",
            routePlanId = "test-plan",
            navigatorBody = "Three route options are ready.",
            selectedRouteId = "route-a",
            attachmentsDismissed = false,
            polylineEntries = listOf(
                PolylineEntry(
                    routeOptionId = "route-a",
                    variant = com.laneshadow.ui.atoms.RouteVariant.Best,
                    coordinates = listOf(
                        com.laneshadow.ui.atoms.LatLng(37.8104, -122.4752),
                        com.laneshadow.ui.atoms.LatLng(37.8105, -122.4753)
                    ),
                    style = PolylineStyle.Solid,
                ),
                PolylineEntry(
                    routeOptionId = "route-b",
                    variant = com.laneshadow.ui.atoms.RouteVariant.Alt1,
                    coordinates = listOf(
                        com.laneshadow.ui.atoms.LatLng(37.8104, -122.4752),
                        com.laneshadow.ui.atoms.LatLng(37.8105, -122.4753)
                    ),
                    style = PolylineStyle.Dashed,
                ),
                PolylineEntry(
                    routeOptionId = "route-c",
                    variant = com.laneshadow.ui.atoms.RouteVariant.Alt2,
                    coordinates = listOf(
                        com.laneshadow.ui.atoms.LatLng(37.8104, -122.4752),
                        com.laneshadow.ui.atoms.LatLng(37.8105, -122.4753)
                    ),
                    style = PolylineStyle.Dashed,
                ),
            ),
            attachmentCards = listOf(
                AttachmentCard(
                    routeOptionId = "route-a",
                    title = "Route 1",
                    via = "Via Highway 1",
                    distanceLabel = "12 mi",
                    durationLabel = "25m",
                    scenicScore = 5,
                    variant = com.laneshadow.ui.atoms.RouteVariant.Best,
                    borderColor = androidx.compose.ui.graphics.Color.Red,
                    selected = true,
                    isBest = true,
                ),
                AttachmentCard(
                    routeOptionId = "route-b",
                    title = "Route 2",
                    via = "Via Highway 101",
                    distanceLabel = "15 mi",
                    durationLabel = "30m",
                    scenicScore = 3,
                    variant = com.laneshadow.ui.atoms.RouteVariant.Alt1,
                    borderColor = androidx.compose.ui.graphics.Color.Blue,
                    selected = false,
                ),
                AttachmentCard(
                    routeOptionId = "route-c",
                    title = "Route 3",
                    via = "Via scenic route",
                    distanceLabel = "18 mi",
                    durationLabel = "40m",
                    scenicScore = 4,
                    variant = com.laneshadow.ui.atoms.RouteVariant.Alt2,
                    borderColor = androidx.compose.ui.graphics.Color.Green,
                    selected = false,
                ),
            ),
        )

        var uiState by mutableStateOf(initialState)

        composeTestRule.setContent {
            RouteResultsLoaded(
                state = uiState,
                navController = androidx.navigation.NavHostController(androidx.compose.ui.platform.LocalContext.current),
                onRouteCardTap = { routeOptionId ->
                    uiState = uiState.withSelectedRoute(routeOptionId)
                },
                onDismissAttachments = {},
                onRecallAttachments = {},
                onRefineSend = {},
            )
        }

        val mapNode = composeTestRule.onNodeWithTag("route-results-map")

        // Helper to verify only one route is Solid
        fun verifyOnlySelectedIsSolid(selectedRouteId: String) {
            val stateDesc = mapNode.fetchSemanticsNode().config.getOrNull(
                androidx.compose.ui.semantics.SemanticsProperties.StateDescription
            )
            val routes = listOf("route-a", "route-b", "route-c")
            routes.forEach { route ->
                val expectedStyle = if (route == selectedRouteId) "Solid" else "Dashed"
                assert(stateDesc?.contains("$route:$expectedStyle") == true) {
                    "Expected $route:$expectedStyle when $selectedRouteId is selected, got: $stateDesc"
                }
            }
        }

        // Initial: route-a is Solid
        verifyOnlySelectedIsSolid("route-a")

        // Select route-b: only route-b is Solid
        composeTestRule.onNodeWithTag("route-results-attachment-route-b").performClick()
        verifyOnlySelectedIsSolid("route-b")

        // Select route-c: only route-c is Solid
        composeTestRule.onNodeWithTag("route-results-attachment-route-c").performClick()
        verifyOnlySelectedIsSolid("route-c")

        // Back to route-a: only route-a is Solid
        composeTestRule.onNodeWithTag("route-results-attachment-route-a").performClick()
        verifyOnlySelectedIsSolid("route-a")
    }
}
