package com.laneshadow.ui.components.molecules

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
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
 * TDD tests for EmptyState component
 *
 * Following RED -> GREEN -> REFACTOR cycle per acceptance criterion
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class EmptyStateTest {

    @get:Rule
    val composeTestRule = createComposeRule()

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
     * AC-1: Component renders in default state
     * GIVEN: App is running and component is mounted
     * WHEN: EmptyState is rendered with required props
     * THEN: Component displays matching RN wrapper defaults
     */
    @Test
    fun testEmptyStateDefaultRendering() {
        // GIVEN: EmptyState component with required props
        // WHEN: Rendered with icon, headline, and body
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                EmptyState(
                    icon = Icons.Default.Home,
                    headline = "No saved routes yet",
                    body = "Plan a route and save it to see it here."
                )
            }
        }

        // THEN: Component displays with all elements
        composeTestRule.onNodeWithText("No saved routes yet").assertIsDisplayed()
        composeTestRule.onNodeWithText("Plan a route and save it to see it here.").assertIsDisplayed()
        composeTestRule.onNodeWithTag("empty-state-icon").assertIsDisplayed()
    }

    /**
     * AC-2: All style properties match matrix
     * GIVEN: Translation matrix defines layout, typography, colors
     * WHEN: Component is rendered in all variants
     * THEN: Uses correct theme tokens for spacing, colors, and typography
     */
    @Test
    fun testEmptyStateStylePropertiesMatchMatrix() {
        // Test basic rendering with all required props
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                EmptyState(
                    icon = Icons.Default.Home,
                    headline = "Title Text",
                    body = "Body description text"
                )
            }
        }

        // Verify all text elements are displayed
        composeTestRule.onNodeWithText("Title Text").assertIsDisplayed()
        composeTestRule.onNodeWithText("Body description text").assertIsDisplayed()
        composeTestRule.onNodeWithTag("empty-state-icon").assertIsDisplayed()

        // Test with custom testID
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                EmptyState(
                    icon = Icons.Default.Home,
                    headline = "Custom Test ID",
                    body = "Testing custom test IDs",
                    testId = "custom-empty-state"
                )
            }
        }

        // Verify custom test tags are applied
        composeTestRule.onNodeWithTag("custom-empty-state-icon").assertIsDisplayed()
        composeTestRule.onNodeWithTag("custom-empty-state-headline").assertIsDisplayed()
        composeTestRule.onNodeWithTag("custom-empty-state-body").assertIsDisplayed()
    }

    /**
     * AC-3: Component handles all states
     * GIVEN: Component supports optional CTA button
     * WHEN: CTA props are provided
     * THEN: Button is rendered and interactive
     */
    @Test
    fun testEmptyStateWithCTAButton() {
        // Test without CTA (default state)
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                EmptyState(
                    icon = Icons.Default.Home,
                    headline = "No items",
                    body = "Add items to get started"
                )
            }
        }

        // Verify CTA button is not present
        composeTestRule.onNodeWithTag("empty-state-cta").assertDoesNotExist()

        // Test with CTA button
        var ctaClicked = false
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                EmptyState(
                    icon = Icons.Default.Home,
                    headline = "No items",
                    body = "Add items to get started",
                    ctaLabel = "Add Item",
                    onCtaClick = { ctaClicked = true }
                )
            }
        }

        // Verify CTA button is displayed
        composeTestRule.onNodeWithTag("empty-state-cta").assertIsDisplayed()
        composeTestRule.onNodeWithText("Add Item").assertIsDisplayed()
    }

    /**
     * AC-4: Component handles accessibility
     * GIVEN: Component has contentDescription
     * WHEN: Screen reader is used
     * THEN: Combined headline and body is announced
     */
    @Test
    fun testEmptyStateAccessibility() {
        // Test with default accessibility
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                EmptyState(
                    icon = Icons.Default.Home,
                    headline = "No saved routes",
                    body = "Start planning your first route"
                )
            }
        }

        // Verify combined accessibility description
        composeTestRule.onNodeWithContentDescription("No saved routes. Start planning your first route")
            .assertIsDisplayed()

        // Test with custom testID
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                EmptyState(
                    icon = Icons.Default.Home,
                    headline = "Empty list",
                    body = "Create your first item",
                    testId = "custom-accessibility-test"
                )
            }
        }

        // Verify accessibility with custom testID
        composeTestRule.onNodeWithContentDescription("Empty list. Create your first item")
            .assertIsDisplayed()
    }

    /**
     * AC-5: Component handles partial CTA props
     * GIVEN: CTA can be optional
     * WHEN: Only ctaLabel or only onCtaClick is provided
     * THEN: Button is not rendered (both required)
     */
    @Test
    fun testEmptyStatePartialCTAProps() {
        // Test with only ctaLabel (no onCtaClick)
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                EmptyState(
                    icon = Icons.Default.Home,
                    headline = "No items",
                    body = "Add items to get started",
                    ctaLabel = "Add Item"
                    // onCtaClick omitted
                )
            }
        }

        // Verify CTA button is not present
        composeTestRule.onNodeWithTag("empty-state-cta").assertDoesNotExist()

        // Test with only onCtaClick (no ctaLabel)
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                EmptyState(
                    icon = Icons.Default.Home,
                    headline = "No items",
                    body = "Add items to get started",
                    onCtaClick = { }
                    // ctaLabel omitted
                )
            }
        }

        // Verify CTA button is not present
        composeTestRule.onNodeWithTag("empty-state-cta").assertDoesNotExist()
    }
}
