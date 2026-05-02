package com.laneshadow.ui.routedetails

import androidx.compose.foundation.layout.Box
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class RouteDetailsRouteTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun loadedContent_rendersInstrumentReadoutFromViewModelState() {
        composeTestRule.setContent {
            LaneShadowTheme {
                RouteDetailsLoadedContent(
                    state = loadedState(),
                    onSave = {},
                    onRide = {},
                    onDismiss = {},
                    modifier = Modifier.testTag("route-details-loaded"),
                    mapContent = {
                        Box(modifier = Modifier.testTag("route-details-map"))
                    },
                )
            }
        }

        composeTestRule.onNodeWithTag("route-details-map").assertExists()
        composeTestRule.onNodeWithText("48.28").assertExists()
        composeTestRule.onNodeWithText("120").assertExists()
        composeTestRule.onNodeWithText("540").assertExists()
        composeTestRule.onNodeWithText("82").assertExists()
    }

    private fun loadedState(): RouteDetailsUiState.Loaded =
        RouteDetailsUiState.Loaded(
            sessionId = "sess-1",
            routePlanId = "plan-7",
            routeOptionId = "opt-best",
            routeTitle = "Skyline Spin",
            routeVia = "A calm scenic line.",
            routeVariant = "best",
            isBest = true,
            routePolyline = "encoded_overview",
            routeDistanceMeters = 48280,
            routeDurationSeconds = 7200,
            routeElevationGainMeters = 540,
            routeScenicScore = 82,
            routeIndexFingerprint = "fnv1a:test",
            instrumentReadout = InstrumentReadoutData(
                distanceKm = 48.28,
                durationMinutes = 120,
                elevationGainM = 540,
                scenicScore = 82,
            ),
            weatherTimeline = emptyList(),
            saveButtonState = SaveButtonState.NotSaved,
        )
}
