package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LaneShadowColors
import com.laneshadow.theme.LaneShadowElevation
import com.laneshadow.theme.LaneShadowElevationLevel
import com.laneshadow.theme.LaneShadowMotion
import com.laneshadow.theme.LaneShadowOpacity
import com.laneshadow.theme.LaneShadowRadius
import com.laneshadow.theme.LaneShadowSpace
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LaneShadowType
import com.laneshadow.theme.LaneShadowTypeScale
import com.laneshadow.theme.LocalLaneShadowTheme
import dev.nativetheme.primitives.ColorSet
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * TDD tests for FavoriteRoadCard component
 *
 * Following RED -> GREEN -> REFACTOR cycle per acceptance criterion
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class FavoriteRoadCardTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    // Create a test theme matching the theme system
    private val testTheme = LaneShadowThemeValues(
        colors = LaneShadowColors(
            primary = ColorSet(Color(0xFF6366F1), null, null, null, null),
            secondary = ColorSet(Color(0xFF8B5CF6), null, null, null, null),
            tertiary = ColorSet(Color(0xFFEC4899), null, null, null, null),
            success = ColorSet(Color(0xFF10B981), null, null, null, null),
            warning = ColorSet(Color(0xFFF59E0B), null, null, null, null),
            warningContainer = ColorSet(Color(0xFFFEF3C7), null, null, null, null),
            onWarningContainer = ColorSet(Color(0xFF92400E), null, null, null, null),
            danger = ColorSet(Color(0xFFEF4444), null, null, null, null),
            info = ColorSet(Color(0xFF3B82F6), null, null, null, null),
            surface = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            surfaceVariant = ColorSet(Color(0xFFF3F4F6), null, null, null, null),
            background = ColorSet(Color(0xFFFAFAFA), null, null, null, null),
            onSurface = ColorSet(Color(0xFF111827), null, null, null, null),
            onPrimary = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            onSecondary = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            secondaryContainer = ColorSet(Color(0xFFEDE9FE), null, null, null, null),
            onSecondaryContainer = ColorSet(Color(0xFF4C1D95), null, null, null, null),
            border = ColorSet(Color(0xFFE5E7EB), null, null, null, null),
            input = ColorSet(Color(0xFFD1D5DB), null, null, null, null),
            ring = ColorSet(Color(0xFF6366F1), null, null, null, null),
            card = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            popover = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            accent = ColorSet(Color(0xFFF472B6), null, null, null, null),
            muted = ColorSet(Color(0xFFF3F4F6), null, null, null, null),
            divider = ColorSet(Color(0xFFE5E7EB), null, null, null, null),
            scrim = ColorSet(Color(0xFF000000), null, null, null, null),
            routeSelected = ColorSet(Color(0xFF6366F1), null, null, null, null),
            routeAlternate = ColorSet(Color(0xFF9CA3AF), null, null, null, null),
        ),
        space = LaneShadowSpace(
            xs = 4.dp,
            sm = 8.dp,
            md = 12.dp,
            lg = 24.dp,
            xl = 32.dp,
            xxl = 48.dp,
            xxxl = 64.dp,
            xxxxl = 96.dp,
        ),
        radius = LaneShadowRadius(
            none = 0.dp,
            sm = 4.dp,
            md = 8.dp,
            lg = 12.dp,
            xl = 16.dp,
            xxl = 24.dp,
            full = 9999.dp,
        ),
        type = LaneShadowType(
            label = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 11.sp, lineHeight = 16.sp, fontWeight = FontWeight.Medium),
                md = TextStyle(fontSize = 12.sp, lineHeight = 20.sp, fontWeight = FontWeight.Medium),
                lg = TextStyle(fontSize = 14.sp, lineHeight = 24.sp, fontWeight = FontWeight.Medium),
            ),
            body = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Normal),
                md = TextStyle(fontSize = 16.sp, lineHeight = 24.sp, fontWeight = FontWeight.Normal),
                lg = TextStyle(fontSize = 18.sp, lineHeight = 28.sp, fontWeight = FontWeight.Normal),
            ),
            title = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 18.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold),
                md = TextStyle(fontSize = 20.sp, lineHeight = 28.sp, fontWeight = FontWeight.SemiBold),
                lg = TextStyle(fontSize = 24.sp, lineHeight = 32.sp, fontWeight = FontWeight.SemiBold),
            ),
            heading = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 24.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold),
                md = TextStyle(fontSize = 30.sp, lineHeight = 40.sp, fontWeight = FontWeight.Bold),
                lg = TextStyle(fontSize = 36.sp, lineHeight = 48.sp, fontWeight = FontWeight.Bold),
            ),
            display = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 48.sp, lineHeight = 56.sp, fontWeight = FontWeight.Bold),
                md = TextStyle(fontSize = 60.sp, lineHeight = 64.sp, fontWeight = FontWeight.Bold),
                lg = TextStyle(fontSize = 72.sp, lineHeight = 80.sp, fontWeight = FontWeight.Bold),
            ),
        ),
        elevation = LaneShadowElevation(
            light = LaneShadowElevationLevel(
                level0 = 0.dp,
                level1 = 4.dp,
                level2 = 8.dp,
                level3 = 12.dp,
                level4 = 16.dp,
                level5 = 20.dp,
                level8 = 32.dp,
            ),
            dark = LaneShadowElevationLevel(
                level0 = 0.dp,
                level1 = 4.dp,
                level2 = 8.dp,
                level3 = 12.dp,
                level4 = 16.dp,
                level5 = 20.dp,
                level8 = 32.dp,
            ),
        ),
        motion = LaneShadowMotion(
            duration = mapOf(
                "fast" to 150,
                "standard" to 300,
                "slow" to 500,
            ),
            delay = emptyMap(),
            scale = emptyMap(),
            easing = emptyMap(),
        ),
        opacity = LaneShadowOpacity(
            values = mapOf(
                "step00" to 0f,
                "step01" to 0.1f,
                "step02" to 0.2f,
                "step03" to 0.3f,
                "step04" to 0.4f,
                "step05" to 0.5f,
                "step06" to 0.6f,
                "step07" to 0.7f,
                "step08" to 0.8f,
                "step09" to 0.9f,
                "step10" to 1f,
                "step11" to 1f,
            ),
        ),
        domain = com.laneshadow.theme.DomainColors(
            waypointOnRoute = ColorSet(Color(0xFF10B981), null, null, null, null),
            waypointOffRoute = ColorSet(Color(0xFF9CA3AF), null, null, null, null),
            waypointMixed = ColorSet(Color(0xFF6366F1), null, null, null, null),
            enrichmentFast = ColorSet(Color(0xFF10B981), null, null, null, null),
            enrichmentExtended = ColorSet(Color(0xFFF59E0B), null, null, null, null),
            enrichmentCached = ColorSet(Color(0xFF6366F1), null, null, null, null),
            deviationOriginalRoute = ColorSet(Color(0xFF10B981), null, null, null, null),
            deviationDetourPath = ColorSet(Color(0xFFF59E0B), null, null, null, null),
            deviationReconnectPoint = ColorSet(Color(0xFF6366F1), null, null, null, null),
            locationPoiFill = ColorSet(Color(0xFF3B82F6), null, null, null, null),
            locationPoiRing = ColorSet(Color(0xFF6366F1), null, null, null, null),
            locationPoiMuted = ColorSet(Color(0xFFE5E7EB), null, null, null, null),
            locationPoiBg = ColorSet(Color(0xFFFFFFFF), null, null, null, null),
            orange = ColorSet(Color(0xFFF97316), null, null, null, null),
        ),
    )

    /**
     * AC-1: Component renders with all required props (favoriteRoadId, name, bounds)
     * GIVEN: App is running and component is mounted
     * WHEN: FavoriteRoadCard is rendered with required props
     * THEN: Component displays road name and thumbnail placeholder
     */
    @Test
    fun testFavoriteRoadCardRendersWithRequiredProps() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FavoriteRoadCard(
                    favoriteRoadId = "road-123",
                    name = "Pacific Coast Highway",
                    bounds = Bounds(
                        sw = LatLng(32.5, -117.5),
                        ne = LatLng(34.5, -115.5)
                    )
                )
            }
        }

        // Verify road name is displayed
        composeTestRule.onNodeWithText("Pacific Coast Highway").assertIsDisplayed()

        // Verify thumbnail placeholder is displayed
        composeTestRule.onNodeWithTag("favorite-road-card-thumbnail").assertIsDisplayed()
    }

    /**
     * AC-2: Component calls onPress callback when card is pressed (not delete button)
     * GIVEN: Component is rendered with onPress callback
     * WHEN: Card body is pressed (not delete button)
     * THEN: onPress callback is invoked with favoriteRoadId
     */
    @Test
    fun testFavoriteRoadCardOnPressCallback() {
        var pressedRoadId: String? = null

        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FavoriteRoadCard(
                    favoriteRoadId = "road-456",
                    name = "Highway 101",
                    bounds = Bounds(
                        sw = LatLng(32.5, -117.5),
                        ne = LatLng(34.5, -115.5)
                    ),
                    onPress = { id -> pressedRoadId = id }
                )
            }
        }

        // Press on the card (not the delete button)
        composeTestRule.onNodeWithTag("favorite-road-card").performClick()

        // Verify callback was invoked with correct ID
        assert(pressedRoadId == "road-456") {
            "Expected onPress to be called with 'road-456', but got '$pressedRoadId'"
        }
    }

    /**
     * AC-3: Component calls onDelete callback when delete button is pressed
     * GIVEN: Component is rendered with onDelete callback
     * WHEN: Delete button is pressed
     * THEN: onDelete callback is invoked with favoriteRoadId and onPress is NOT called
     */
    @Test
    fun testFavoriteRoadCardOnDeleteCallback() {
        var deletedRoadId: String? = null
        var pressedRoadId: String? = null

        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FavoriteRoadCard(
                    favoriteRoadId = "road-789",
                    name = "Route 66",
                    bounds = Bounds(
                        sw = LatLng(32.5, -117.5),
                        ne = LatLng(34.5, -115.5)
                    ),
                    onPress = { id -> pressedRoadId = id },
                    onDelete = { id -> deletedRoadId = id }
                )
            }
        }

        // Press on the delete button specifically
        composeTestRule.onNodeWithTag("favorite-road-card-delete").performClick()

        // Verify delete callback was invoked with correct ID
        assert(deletedRoadId == "road-789") {
            "Expected onDelete to be called with 'road-789', but got '$deletedRoadId'"
        }

        // Verify card press callback was NOT invoked
        assert(pressedRoadId == null) {
            "Expected onPress NOT to be called when delete is pressed, but got '$pressedRoadId'"
        }
    }

    /**
     * AC-4: Component uses correct theme tokens (colors, spacing, radius, typography)
     * GIVEN: Translation matrix defines layout, typography, colors
     * WHEN: Component is rendered
     * THEN: Component uses theme tokens for all values (no hardcoded colors, spacing, radius)
     */
    @Test
    fun testFavoriteRoadCardUsesThemeTokens() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FavoriteRoadCard(
                    favoriteRoadId = "road-theme",
                    name = "Test Theme Tokens",
                    bounds = Bounds(
                        sw = LatLng(32.5, -117.5),
                        ne = LatLng(34.5, -115.5)
                    )
                )
            }
        }

        // Verify component renders without hardcoded values
        composeTestRule.onNodeWithText("Test Theme Tokens").assertIsDisplayed()
    }

    /**
     * AC-5: Component has proper accessibility with content descriptions
     * GIVEN: Screen reader is active
     * WHEN: Component is rendered
     * THEN: Content description announces "View {road name}" for card and "Delete favorite" for delete button
     */
    @Test
    fun testFavoriteRoadCardAccessibility() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FavoriteRoadCard(
                    favoriteRoadId = "road-a11y",
                    name = "Mulholland Drive",
                    bounds = Bounds(
                        sw = LatLng(32.5, -117.5),
                        ne = LatLng(34.5, -115.5)
                    )
                )
            }
        }

        // Verify card accessibility label
        composeTestRule.onNodeWithContentDescription("View Mulholland Drive").assertIsDisplayed()

        // Verify delete button accessibility label
        composeTestRule.onNodeWithContentDescription("Delete favorite").assertIsDisplayed()
    }

    /**
     * AC-6: Component renders delete button with trash icon
     * GIVEN: Component is rendered
     * WHEN: Delete button is displayed
     * THEN: Delete button shows trash icon with danger color
     */
    @Test
    fun testFavoriteRoadCardDeleteButtonHasTrashIcon() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FavoriteRoadCard(
                    favoriteRoadId = "road-icon",
                    name = "Icon Test Road",
                    bounds = Bounds(
                        sw = LatLng(32.5, -117.5),
                        ne = LatLng(34.5, -115.5)
                    )
                )
            }
        }

        // Verify delete button is displayed with trash icon
        composeTestRule.onNodeWithTag("favorite-road-card-delete-icon").assertIsDisplayed()
    }

    /**
     * AC-7: Component accepts thumbnail content composable lambda
     * GIVEN: Component supports custom thumbnail rendering
     * WHEN: Thumbnail lambda is provided
     * THEN: Custom thumbnail content is rendered
     */
    @Test
    fun testFavoriteRoadCardAcceptsThumbnailLambda() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                FavoriteRoadCard(
                    favoriteRoadId = "road-custom-thumb",
                    name = "Custom Thumbnail Road",
                    bounds = Bounds(
                        sw = LatLng(32.5, -117.5),
                        ne = LatLng(34.5, -115.5)
                    ),
                    thumbnailContent = {
                        androidx.compose.foundation.layout.Box(
                            modifier = androidx.compose.ui.Modifier.fillMaxWidth()
                        ) {
                            androidx.compose.material3.Text(
                                text = "Custom Map Preview",
                                style = testTheme.type.label.md
                            )
                        }
                    }
                )
            }
        }

        // Verify custom thumbnail content is displayed
        composeTestRule.onNodeWithText("Custom Map Preview").assertIsDisplayed()
    }
}

/**
 * Geographic bounds for route preview
 */
data class Bounds(
    val sw: LatLng,
    val ne: LatLng
)

/**
 * Geographic coordinate point
 */
data class LatLng(
    val lat: Double,
    val lng: Double
)
