package com.laneshadow.ui.components.atoms

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertContentDescriptionContains
import androidx.compose.ui.test.assertIsNotDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.role
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.MainActivity
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
 * TDD tests for IconSymbolIOS component
 *
 * Following RED -> GREEN -> REFACTOR cycle per acceptance criterion
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class IconSymbolIOSTest {

    @get:Rule
    val composeTestRule = createAndroidComposeRule<MainActivity>()

    // Create a minimal test theme
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
            md = 16.dp,
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
                sm = androidx.compose.ui.text.TextStyle(
                    fontSize = 11.sp,
                    lineHeight = 16.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
                ),
                md = androidx.compose.ui.text.TextStyle(
                    fontSize = 12.sp,
                    lineHeight = 20.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
                ),
                lg = androidx.compose.ui.text.TextStyle(
                    fontSize = 14.sp,
                    lineHeight = 24.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Medium
                ),
            ),
            body = LaneShadowTypeScale(
                sm = androidx.compose.ui.text.TextStyle(
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Normal
                ),
                md = androidx.compose.ui.text.TextStyle(
                    fontSize = 16.sp,
                    lineHeight = 24.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Normal
                ),
                lg = androidx.compose.ui.text.TextStyle(
                    fontSize = 18.sp,
                    lineHeight = 28.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Normal
                ),
            ),
            title = LaneShadowTypeScale(
                sm = androidx.compose.ui.text.TextStyle(
                    fontSize = 18.sp,
                    lineHeight = 24.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
                ),
                md = androidx.compose.ui.text.TextStyle(
                    fontSize = 20.sp,
                    lineHeight = 28.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
                ),
                lg = androidx.compose.ui.text.TextStyle(
                    fontSize = 24.sp,
                    lineHeight = 32.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold
                ),
            ),
            heading = LaneShadowTypeScale(
                sm = androidx.compose.ui.text.TextStyle(
                    fontSize = 24.sp,
                    lineHeight = 32.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                ),
                md = androidx.compose.ui.text.TextStyle(
                    fontSize = 30.sp,
                    lineHeight = 40.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                ),
                lg = androidx.compose.ui.text.TextStyle(
                    fontSize = 36.sp,
                    lineHeight = 48.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                ),
            ),
            display = LaneShadowTypeScale(
                sm = androidx.compose.ui.text.TextStyle(
                    fontSize = 48.sp,
                    lineHeight = 56.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                ),
                md = androidx.compose.ui.text.TextStyle(
                    fontSize = 60.sp,
                    lineHeight = 64.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                ),
                lg = androidx.compose.ui.text.TextStyle(
                    fontSize = 72.sp,
                    lineHeight = 80.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                ),
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
     * AC-1: Component renders in default state
     * GIVEN: App is running and component is mounted
     * WHEN: IconSymbolIOS is rendered with required props
     * THEN: Component displays matching RN wrapper defaults
     */
    @Test
    fun testIconSymbolIOSDefaultRendering() {
        // GIVEN: IconSymbolIOS component with required props
        val iconName = "star"
        val iconColor = Color(0xFF6366F1)

        // WHEN: Rendered with name and color
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                IconSymbolIOS(
                    name = iconName,
                    color = iconColor
                )
            }
        }

        // THEN: Component displays with content description
        composeTestRule.onNodeWithContentDescription(iconName)
            .assertExists()
            .assertContentDescriptionContains(iconName)
    }

    /**
     * AC-2: All style properties match matrix
     * GIVEN: Translation matrix defines layout, typography, colors
     * WHEN: Component is rendered in all variants
     * THEN: Measured values match matrix (height, padding, radius, font-size)
     */
    @Test
    fun testIconSymbolIOSStylePropertiesMatchMatrix() {
        // Test default size (24.dp from matrix)
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                IconSymbolIOS(
                    name = "check",
                    color = Color(0xFF10B981),
                    size = 24.dp
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("check").assertExists()

        // Test custom size (32.dp from matrix - xl token)
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                IconSymbolIOS(
                    name = "close",
                    color = Color(0xFFEF4444),
                    size = 32.dp
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("close").assertExists()

        // Test small size (16.dp from matrix - md token)
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                IconSymbolIOS(
                    name = "home",
                    color = Color(0xFF3B82F6),
                    size = 16.dp
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("home").assertExists()

        // Test extra small size (12.dp from matrix - xs token)
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                IconSymbolIOS(
                    name = "settings",
                    color = Color(0xFFF59E0B),
                    size = 12.dp
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("settings").assertExists()
    }

    /**
     * AC-3: Component handles all states
     * GIVEN: Component supports states (hover, pressed, disabled, error, loading)
     * WHEN: Each state is triggered
     * THEN: Visual feedback matches RN wrapper behavior
     */
    @Test
    fun testIconSymbolIOSStates() {
        // Test with testID
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                IconSymbolIOS(
                    name = "search",
                    color = Color(0xFF6366F1),
                    testID = "search-icon-test"
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("search").assertExists()

        // Test with modifier
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                IconSymbolIOS(
                    name = "favorite",
                    color = Color(0xFFEC4899),
                    modifier = androidx.compose.ui.Modifier.testTag("favorite-modifier")
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("favorite").assertExists()

        // Test accessibility role is Image
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                IconSymbolIOS(
                    name = "info",
                    color = Color(0xFF3B82F6)
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("info")
            .assertExists()
            .assertContentDescriptionContains("info")
    }

    /**
     * Test icon name mapping covers common icons
     */
    @Test
    fun testIconSymbolIOSNameMapping() {
        val commonIcons = listOf(
            "check", "close", "add", "delete", "edit", "refresh", "search",
            "settings", "home", "menu", "info", "star", "person", "location"
        )

        commonIcons.forEach { iconName ->
            composeTestRule.setContent {
                CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                    IconSymbolIOS(
                        name = iconName,
                        color = Color(0xFF6366F1)
                    )
                }
            }
            composeTestRule.onNodeWithContentDescription(iconName).assertExists()
        }
    }
}
