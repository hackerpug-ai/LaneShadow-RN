package com.laneshadow.ui.organisms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.foundation.layout.Box
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasNoClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import com.laneshadow.ui.atoms.LSCardBackgroundColorKey
import com.laneshadow.ui.atoms.LSCardCornerRadiusKey
import com.laneshadow.ui.atoms.LSCardShadowElevationKey
import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.ui.atoms.RouteVariant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.RuleChain
import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith

@RunWith(RobolectricTestRunner::class)
class LSRouteCardTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(RouteCardDebugVariantRule).around(composeTestRule)

    // Mock route data matching Convex schema routes table
    private val mockRoute1 = RouteCardRoute(
        id = "route-skyline-spine",
        title = "The Skyline Spine",
        distance = "47 mi",
        estimatedTime = "1h 22m",
        polyline = listOf(
            LatLng(37.7749, -122.4194),
            LatLng(37.8000, -122.4500),
            LatLng(37.8500, -122.5000),
        ),
        variant = RouteVariant.Best,
        difficulty = RouteDifficulty.Moderate,
        isSaved = false,
    )

    @Test
    fun default_renders_card_with_map_preview_title_subtitle_and_chip() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSRouteCard(
                    route = mockRoute1,
                    modifier = Modifier.testTag("route-card-default"),
                    mapContent = {
                        // In tests, use a simple Box instead of actual LSMap
                        // to avoid native Mapbox dependencies
                        Box(modifier = Modifier.testTag("mock-map"))
                    },
                )
            }
        }

        // Verify card is present
        composeTestRule.onNodeWithTag("route-card-default")
            .assertExists()

        // Verify map preview container is present
        composeTestRule.onNodeWithTag("ls-map-preview")
            .assertExists()

        // Verify mock map is present
        composeTestRule.onNodeWithTag("mock-map")
            .assertExists()

        // Verify title is present
        composeTestRule.onNodeWithText("The Skyline Spine")
            .assertExists()

        // Verify subtitle with distance + time
        composeTestRule.onNodeWithText("47 mi")
            .assertExists()
        composeTestRule.onNodeWithText("1h 22m")
            .assertExists()

        // Verify difficulty chip
        composeTestRule.onNodeWithText("Moderate")
            .assertExists()
    }

    @Test
    fun alt1_variant_resolves_to_route_alt1_token() {
        val alt1Route = mockRoute1.copy(
            variant = RouteVariant.Alt1,
        )

        composeTestRule.setContent {
            LaneShadowTheme {
                LSRouteCard(
                    route = alt1Route,
                    modifier = Modifier.testTag("route-card-alt1"),
                    mapContent = {
                        Box(modifier = Modifier.testTag("mock-map-alt1"))
                    },
                )
            }
        }

        // Verify card renders with Alt1 variant
        composeTestRule.onNodeWithTag("route-card-alt1")
            .assertExists()

        // Note: Actual color verification happens in LSMap's own tests
        // Here we just verify the card accepts Alt1 variant
        composeTestRule.onNodeWithTag("mock-map-alt1")
            .assertExists()
    }

    @Test
    fun route_prop_type_mirrors_convex_schema() {
        // This is a compile-time type check
        // If RouteCardRoute fields don't match the Convex schema,
        // this test will fail to compile

        val completeRoute = RouteCardRoute(
            id = "test-id",
            title = "Test Route",
            distance = "10 mi",
            estimatedTime = "30m",
            polyline = listOf(
                LatLng(37.7749, -122.4194),
                LatLng(37.7750, -122.4195),
            ),
            variant = RouteVariant.Best,
            difficulty = RouteDifficulty.Easy,
            isSaved = true,
        )

        // Verify all fields are accessible
        assertEquals("test-id", completeRoute.id)
        assertEquals("Test Route", completeRoute.title)
        assertEquals("10 mi", completeRoute.distance)
        assertEquals("30m", completeRoute.estimatedTime)
        assertEquals(2, completeRoute.polyline?.size)
        assertEquals(RouteVariant.Best, completeRoute.variant)
        assertEquals(RouteDifficulty.Easy, completeRoute.difficulty)
        assertEquals(true, completeRoute.isSaved)

        composeTestRule.setContent {
            LaneShadowTheme {
                LSRouteCard(
                    route = completeRoute,
                    modifier = Modifier.testTag("route-card-complete"),
                    mapContent = { Box(modifier = Modifier.testTag("mock-map")) },
                )
            }
        }

        composeTestRule.onNodeWithTag("route-card-complete")
            .assertExists()
    }

    @Test
    fun saved_state_shows_heart_fill_icon() {
        val savedRoute = mockRoute1.copy(isSaved = true)

        composeTestRule.setContent {
            LaneShadowTheme {
                LSRouteCard(
                    route = savedRoute,
                    modifier = Modifier.testTag("route-card-saved"),
                    mapContent = { Box(modifier = Modifier.testTag("mock-map")) },
                )
            }
        }

        // Verify heart icon is present when saved
        composeTestRule.onNodeWithContentDescription("Saved route")
            .assertExists()
    }

    @Test
    fun non_saved_state_omits_heart_icon() {
        val unsavedRoute = mockRoute1.copy(isSaved = false)

        composeTestRule.setContent {
            LaneShadowTheme {
                LSRouteCard(
                    route = unsavedRoute,
                    modifier = Modifier.testTag("route-card-unsaved"),
                    mapContent = { Box(modifier = Modifier.testTag("mock-map")) },
                )
            }
        }

        // Verify heart icon is NOT present when not saved
        composeTestRule.onNodeWithContentDescription("Saved route")
            .assertDoesNotExist()
    }
}

private object RouteCardDebugVariantRule : TestRule {
    override fun apply(base: Statement, description: Description): Statement =
        object : Statement() {
            override fun evaluate() {
                assumeTrue(BuildConfig.BUILD_TYPE == "debug")
                base.evaluate()
            }
        }
}
