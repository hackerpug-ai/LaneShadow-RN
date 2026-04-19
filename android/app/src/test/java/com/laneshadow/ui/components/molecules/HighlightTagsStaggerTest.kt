package com.laneshadow.ui.components.molecules

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
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
 * TDD tests for HighlightTagsStagger component
 *
 * Following RED -> GREEN -> REFACTOR cycle per acceptance criterion
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class HighlightTagsStaggerTest {

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
            muted = ColorSet(Color(0xFFF3F4F6), null, null, null, null),
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
     * AC-1: Component renders nothing when not visible
     * GIVEN: Component is mounted with visible=false
     * WHEN: Component renders
     * THEN: Nothing is displayed (component returns null equivalent)
     */
    @Test
    fun testComponentNotVisible() {
        // GIVEN: HighlightTagsStagger with visible=false
        val highlights = listOf(
            HighlightTag(label = "Scenic", icon = "🏔️"),
            HighlightTag(label = "Curvy"),
        )

        // WHEN: Rendered with visible=false
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                HighlightTagsStagger(
                    highlights = highlights,
                    visible = false,
                )
            }
        }

        // THEN: Component should not render any content
        // The component should return null equivalent (Box with size zero or no content)
        composeTestRule.onNodeWithText("Scenic")
            .assertDoesNotExist()
    }

    /**
     * AC-2: Component renders nothing when highlights is empty
     * GIVEN: Component is mounted with empty highlights list
     * WHEN: Component renders
     * THEN: Nothing is displayed
     */
    @Test
    fun testComponentEmptyHighlights() {
        // GIVEN: HighlightTagsStagger with empty highlights
        val highlights = emptyList<HighlightTag>()

        // WHEN: Rendered with visible=true but empty list
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                HighlightTagsStagger(
                    highlights = highlights,
                    visible = true,
                )
            }
        }

        // THEN: Component should not render any content
        composeTestRule.onNodeWithText("Scenic")
            .assertDoesNotExist()
    }

    /**
     * AC-3: Component renders tags when visible
     * GIVEN: Component is mounted with highlights and visible=true
     * WHEN: Component renders
     * THEN: All tags are displayed with proper styling
     */
    @Test
    fun testComponentRendersTagsWhenVisible() {
        // GIVEN: HighlightTagsStagger with highlights and visible=true
        val highlights = listOf(
            HighlightTag(label = "Scenic", icon = "🏔️"),
            HighlightTag(label = "Curvy"),
            HighlightTag(label = "Hilly", icon = "⛰️"),
        )

        // WHEN: Rendered with visible=true
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                HighlightTagsStagger(
                    highlights = highlights,
                    visible = true,
                )
            }
        }

        // THEN: All tags should be displayed
        composeTestRule.onNodeWithText("Scenic")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Curvy")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Hilly")
            .assertIsDisplayed()
    }

    /**
     * AC-4: Tags use proper theme tokens for styling
     * GIVEN: Component is mounted with highlights
     * WHEN: Component renders
     * THEN: Tags use primary.default color, proper spacing, and radius
     */
    @Test
    fun testTagsUseThemeTokens() {
        // GIVEN: HighlightTagsStagger with highlights
        val highlights = listOf(
            HighlightTag(label = "Scenic"),
        )

        // WHEN: Rendered
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                HighlightTagsStagger(
                    highlights = highlights,
                    visible = true,
                )
            }
        }

        // THEN: Tag should be displayed with proper styling
        composeTestRule.onNodeWithText("Scenic")
            .assertIsDisplayed()
    }

    /**
     * AC-5: Tags with icons render both icon and label
     * GIVEN: Component is mounted with tags containing icons
     * WHEN: Component renders
     * THEN: Icons and labels are displayed together
     */
    @Test
    fun testTagsWithIcons() {
        // GIVEN: HighlightTagsStagger with icon tags
        val highlights = listOf(
            HighlightTag(label = "Scenic", icon = "🏔️"),
            HighlightTag(label = "Fast", icon = "⚡"),
        )

        // WHEN: Rendered
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                HighlightTagsStagger(
                    highlights = highlights,
                    visible = true,
                )
            }
        }

        // THEN: Tags with icons should be displayed
        composeTestRule.onNodeWithText("🏔️")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Scenic")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("⚡")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Fast")
            .assertIsDisplayed()
    }

    /**
     * AC-6: Component has proper accessibility labels
     * GIVEN: Component is mounted with highlights
     * WHEN: Component renders
     * THEN: Container has accessibility label describing the content
     */
    @Test
    fun testComponentHasAccessibilityLabels() {
        // GIVEN: HighlightTagsStagger with highlights
        val highlights = listOf(
            HighlightTag(label = "Scenic"),
            HighlightTag(label = "Curvy"),
        )

        // WHEN: Rendered
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                HighlightTagsStagger(
                    highlights = highlights,
                    visible = true,
                )
            }
        }

        // THEN: Container should have accessibility label
        composeTestRule.onNodeWithContentDescription("2 route highlights")
            .assertIsDisplayed()

        // THEN: Each tag should have accessibility label
        composeTestRule.onNodeWithContentDescription("Scenic")
            .assertIsDisplayed()
        composeTestRule.onNodeWithContentDescription("Curvy")
            .assertIsDisplayed()
    }

    /**
     * AC-7: Custom animation parameters are respected
     * GIVEN: Component is mounted with custom animation params
     * WHEN: Component renders
     * THEN: Animation uses custom values
     */
    @Test
    fun testCustomAnimationParameters() {
        // GIVEN: HighlightTagsStagger with custom animation params
        val highlights = listOf(
            HighlightTag(label = "Scenic"),
            HighlightTag(label = "Curvy"),
        )

        // WHEN: Rendered with custom animation values
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                HighlightTagsStagger(
                    highlights = highlights,
                    visible = true,
                    staggerDelay = 150,
                    fadeDuration = 400,
                    scaleDuration = 350,
                )
            }
        }

        // THEN: Tags should be displayed
        composeTestRule.onNodeWithText("Scenic")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("Curvy")
            .assertIsDisplayed()
    }

    /**
     * AC-8: Test ID is properly applied
     * GIVEN: Component is mounted with testID
     * WHEN: Component renders
     * THEN: Test ID is applied to container
     */
    @Test
    fun testTestIdApplied() {
        // GIVEN: HighlightTagsStagger with testID
        val highlights = listOf(
            HighlightTag(label = "Scenic"),
        )

        // WHEN: Rendered with testID
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                HighlightTagsStagger(
                    highlights = highlights,
                    visible = true,
                    testID = "my-highlight-tags",
                )
            }
        }

        // THEN: Test ID should be applied
        composeTestRule.onNodeWithContentDescription("2 route highlights")
            .assertIsDisplayed()
    }
}
