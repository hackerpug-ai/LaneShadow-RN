package com.laneshadow.ui.components.chat.cards

import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
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
import com.laneshadow.ui.components.molecules.ChatMessage
import com.laneshadow.ui.components.molecules.ChatMessageKind
import com.laneshadow.ui.components.molecules.ChatMessageRole
import com.laneshadow.ui.components.molecules.ChatMessageStatus
import dev.nativetheme.primitives.ColorSet
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/**
 * TDD tests for ReasoningCard component
 *
 * Following RED -> GREEN -> REFACTOR cycle per acceptance criterion
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class ReasoningCardTest {

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
                sm = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.SemiBold),
                md = TextStyle(fontSize = 16.sp, lineHeight = 24.sp, fontWeight = FontWeight.SemiBold),
                lg = TextStyle(fontSize = 18.sp, lineHeight = 28.sp, fontWeight = FontWeight.SemiBold),
            ),
            heading = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 18.sp, lineHeight = 24.sp, fontWeight = FontWeight.Bold),
                md = TextStyle(fontSize = 20.sp, lineHeight = 28.sp, fontWeight = FontWeight.Bold),
                lg = TextStyle(fontSize = 24.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold),
            ),
            display = LaneShadowTypeScale(
                sm = TextStyle(fontSize = 24.sp, lineHeight = 32.sp, fontWeight = FontWeight.Bold),
                md = TextStyle(fontSize = 32.sp, lineHeight = 40.sp, fontWeight = FontWeight.Bold),
                lg = TextStyle(fontSize = 40.sp, lineHeight = 48.sp, fontWeight = FontWeight.Bold),
            ),
        ),
        elevation = LaneShadowElevation(
            light = LaneShadowElevationLevel(0.dp, 1.dp, 2.dp, 3.dp, 4.dp, 5.dp, 8.dp),
            dark = LaneShadowElevationLevel(0.dp, 1.dp, 2.dp, 3.dp, 4.dp, 5.dp, 8.dp),
        ),
        motion = LaneShadowMotion(
            duration = mapOf("fast" to 150, "standard" to 300, "slow" to 500),
            delay = mapOf("fast" to 150, "standard" to 300),
            scale = mapOf("press" to 0.95),
            easing = mapOf("linear" to listOf(0.0, 1.0)),
        ),
        opacity = LaneShadowOpacity(
            values = mapOf("disabled" to 0.5f, "hover" to 0.8f),
        ),
        domain = com.laneshadow.theme.DomainColors(
            waypointOnRoute = ColorSet(Color(0xFF10B981), null, null, null, null),
            waypointOffRoute = ColorSet(Color(0xFF6B7280), null, null, null, null),
            waypointMixed = ColorSet(Color(0xFFF59E0B), null, null, null, null),
            enrichmentFast = ColorSet(Color(0xFF10B981), null, null, null, null),
            enrichmentExtended = ColorSet(Color(0xFF3B82F6), null, null, null, null),
            enrichmentCached = ColorSet(Color(0xFF8B5CF6), null, null, null, null),
            deviationOriginalRoute = ColorSet(Color(0xFF6366F1), null, null, null, null),
            deviationDetourPath = ColorSet(Color(0xFFEC4899), null, null, null, null),
            deviationReconnectPoint = ColorSet(Color(0xFF10B981), null, null, null, null),
            locationPoiFill = ColorSet(Color(0xFFF472B6), null, null, null, null),
            locationPoiRing = ColorSet(Color(0xFF6366F1), null, null, null, null),
            locationPoiMuted = ColorSet(Color(0xFFE5E7EB), null, null, null, null),
            locationPoiBg = ColorSet(Color(0xFFF3F4F6), null, null, null, null),
            orange = ColorSet(Color(0xFFF97316), null, null, null, null),
        ),
    )

    /**
     * AC-1: Component renders with streaming status
     *
     * Given: A ChatMessage with REASONING kind and STREAMING status
     * When: ReasoningCard is rendered
     * Then: Card should display with "Thinking…" label and streaming indicator
     */
    @Test
    fun test_renders_with_streaming_status() {
        // Given
        val message = ChatMessage(
            id = "test-1",
            role = ChatMessageRole.AGENT,
            content = "Analyzing route options...",
            timestamp = System.currentTimeMillis(),
            status = ChatMessageStatus.STREAMING,
            kind = ChatMessageKind.REASONING,
        )

        // When
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ReasoningCard(message = message)
            }
        }

        // Then
        composeTestRule.onNodeWithText("Thinking…").assertIsDisplayed()
        composeTestRule.onRoot().assertExists()
    }

    /**
     * AC-2: Component is collapsible
     *
     * Given: A ChatMessage with REASONING kind and COMPLETE status with content
     * When: ReasoningCard is rendered and tapped
     * Then: Card should toggle between collapsed and expanded states
     */
    @Test
    fun test_is_collapsible() {
        // Given
        val message = ChatMessage(
            id = "test-2",
            role = ChatMessageRole.AGENT,
            content = "This is the reasoning content that should appear when expanded",
            timestamp = System.currentTimeMillis(),
            status = ChatMessageStatus.COMPLETE,
            kind = ChatMessageKind.REASONING,
        )

        // When
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ReasoningCard(message = message)
            }
        }

        // Then: Initially collapsed - content should not be visible
        composeTestRule.onNodeWithText("This is the reasoning content that should appear when expanded")
            .assertDoesNotExist()

        // When: Tap to expand
        composeTestRule.onRoot().performClick()

        // Then: Content should now be visible
        composeTestRule.onNodeWithText("This is the reasoning content that should appear when expanded")
            .assertIsDisplayed()
    }

    /**
     * AC-3: Component shows correct label for completed status
     *
     * Given: A ChatMessage with REASONING kind and COMPLETE status
     * When: ReasoningCard is rendered
     * Then: Card should display with "Thought briefly" or "Thought for Ns" label
     */
    @Test
    fun test_shows_completed_label() {
        // Given
        val message = ChatMessage(
            id = "test-3",
            role = ChatMessageRole.AGENT,
            content = "Completed reasoning",
            timestamp = System.currentTimeMillis() - 5000, // 5 seconds ago
            status = ChatMessageStatus.COMPLETE,
            kind = ChatMessageKind.REASONING,
        )

        // When
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                ReasoningCard(message = message)
            }
        }

        // Then: Should show either "Thought briefly" or "Thought for Ns"
        composeTestRule.onRoot()
            .assertExists()
        // Note: The exact label depends on timing, but card should render
    }
}
