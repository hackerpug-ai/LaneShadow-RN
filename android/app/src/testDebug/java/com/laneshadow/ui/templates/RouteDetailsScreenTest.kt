package com.laneshadow.ui.templates

import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import com.laneshadow.sandbox.mockproviders.RouteDetailsMockProvider
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.molecules.WeatherCondition
import com.laneshadow.ui.routedetails.ROUTE_DETAILS_SHEET_TAG
import com.laneshadow.ui.routedetails.ROUTE_DETAILS_TOPBAR_TAG
import java.util.concurrent.atomic.AtomicInteger
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class RouteDetailsScreenTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun route_details_screen_delegates_to_shared_surface() {
        val state = RouteDetailsMockProvider.value("default")

        composeTestRule.setContent {
            LaneShadowTheme {
                RouteDetailsScreenContent(
                    state = state,
                    onSave = {},
                    onRide = {},
                    onDismiss = {},
                    mapContent = { _ ->
                        Text(text = "stub-map")
                    },
                )
            }
        }

        composeTestRule.onNodeWithTag(ROUTE_DETAILS_SHEET_TAG).assertExists()
        composeTestRule.onNodeWithTag(ROUTE_DETAILS_TOPBAR_TAG).assertExists()
        composeTestRule.onNodeWithText("The Skyline Spine").assertExists()
        composeTestRule.onNodeWithText("280 → 92 → Skyline to Alice's").assertExists()
    }

    @Test
    fun route_details_screen_state_maps_to_route_details_and_polylines() {
        val state = RouteDetailsMockProvider.value("default")

        val routeDetails = state.toRouteDetails()
        assertEquals("route-001", routeDetails.id)
        assertEquals("The Skyline Spine", routeDetails.title)
        assertEquals("280 → 92 → Skyline to Alice's", routeDetails.via)
        assertTrue(routeDetails.isBest)
        assertEquals("26", routeDetails.distance)
        assertEquals("1h 30m", routeDetails.time)
        assertEquals("3200", routeDetails.climb)
        assertEquals("9", routeDetails.scenicScore)
        assertEquals(false, routeDetails.isSaved)

        val weatherTimeline = state.toWeatherTimelineEntries()
        assertEquals(6, weatherTimeline.size)
        assertEquals("9", weatherTimeline.first().hour)
        assertEquals("62°", weatherTimeline.first().temperature)
        assertEquals(WeatherCondition.Clear, weatherTimeline.first().condition)
        assertEquals("14", weatherTimeline.last().hour)
        assertEquals("74°", weatherTimeline.last().temperature)
        assertEquals(WeatherCondition.Clear, weatherTimeline.last().condition)

        val timeRange = state.timeRange()
        assertEquals("9", timeRange.first)
        assertEquals("14", timeRange.second)

        val polylines = state.toPolylines()
        assertEquals(1, polylines.size)
        assertSame(RouteVariant.Best, polylines.single().variant)
        assertTrue(polylines.single().coordinates.isNotEmpty())
    }

    @Test
    fun route_details_screen_memoizes_polyline_decoding_across_recomposition() {
        val state = RouteDetailsMockProvider.value("default")
        val decodeCalls = AtomicInteger(0)
        lateinit var triggerRecompose: () -> Unit

        composeTestRule.setContent {
            LaneShadowTheme {
                var tick by remember { mutableStateOf(0) }
                triggerRecompose = { tick += 1 }
                Text(text = tick.toString())

                RouteDetailsScreenContent(
                    state = state,
                    onSave = {},
                    onRide = {},
                    onDismiss = {},
                    decodePolyline = {
                        decodeCalls.incrementAndGet()
                        listOf(
                            LatLng(lat = 37.0, lon = -122.0),
                            LatLng(lat = 37.1, lon = -122.1),
                        )
                    },
                    mapContent = { _ ->
                        Text(text = "stub-map")
                    },
                )
            }
        }

        composeTestRule.waitForIdle()
        val initialDecodeCalls = decodeCalls.get()
        assertTrue(initialDecodeCalls > 0)

        composeTestRule.runOnIdle {
            triggerRecompose()
        }
        composeTestRule.waitForIdle()

        assertEquals(initialDecodeCalls, decodeCalls.get())
    }
}
