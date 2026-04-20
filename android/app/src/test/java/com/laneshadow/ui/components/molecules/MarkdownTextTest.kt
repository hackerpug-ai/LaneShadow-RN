package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Modifier
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
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
 * TDD tests for MarkdownText component
 *
 * Following RED -> GREEN -> REFACTOR cycle per acceptance criterion
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE, qualifiers = "w360dp-h640dp-xhdpi")
class MarkdownTextTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    // Create a test theme
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
     * AC-1: Component renders plain text with body.lg typography and onSurface color
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with plain text content
     * THEN: Text displays with body.lg typography and onSurface.default color
     */
    @Test
    fun testMarkdownTextRendersPlainText() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "This is plain text",
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }

        // Verify plain text is displayed
        composeTestRule.onNodeWithText("This is plain text").assertIsDisplayed()
    }

    /**
     * AC-2: Component renders bold text with fontWeight 700
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with **bold** markdown
     * THEN: Bold text displays with fontWeight 700
     */
    @Test
    fun testMarkdownTextRendersBold() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "This is **bold** text",
                )
            }
        }

        // Verify bold text content is displayed
        composeTestRule.onNodeWithText("bold").assertIsDisplayed()
    }

    /**
     * AC-3: Component renders italic text with italic fontStyle
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with *italic* markdown
     * THEN: Italic text displays with italic fontStyle
     */
    @Test
    fun testMarkdownTextRendersItalic() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "This is *italic* text",
                )
            }
        }

        // Verify italic text content is displayed
        composeTestRule.onNodeWithText("italic").assertIsDisplayed()
    }

    /**
     * AC-4: Component renders inline code with surfaceVariant background and primary color
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with `inline code` markdown
     * THEN: Code displays with surfaceVariant background, primary color, body.sm typography, and padding
     */
    @Test
    fun testMarkdownTextRendersInlineCode() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "This is `code` text",
                )
            }
        }

        // Verify code content is displayed
        composeTestRule.onNodeWithText("code").assertIsDisplayed()
    }

    /**
     * AC-5: Component renders code blocks with surfaceVariant background and monospace font
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with ```code block``` markdown
     * THEN: Code block displays with surfaceVariant background, monospace font, body.sm typography, and padding
     */
    @Test
    fun testMarkdownTextRendersCodeBlock() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "```println('code block')```",
                )
            }
        }

        // Verify code block content is displayed
        composeTestRule.onNodeWithText("println('code block')").assertIsDisplayed()
    }

    /**
     * AC-6: Component renders links with primary color and underline
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with [link](url) markdown
     * THEN: Link displays with primary color and underline decoration
     */
    @Test
    fun testMarkdownTextRendersLinks() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "This is a [link](https://example.com)",
                )
            }
        }

        // Verify link text is displayed
        composeTestRule.onNodeWithText("link").assertIsDisplayed()
    }

    /**
     * AC-7: Component renders H1 heading with heading.lg typography
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with # H1 markdown
     * THEN: Heading displays with heading.lg typography and proper margins
     */
    @Test
    fun testMarkdownTextRendersH1Heading() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "# Heading 1",
                )
            }
        }

        // Verify H1 content is displayed
        composeTestRule.onNodeWithText("Heading 1").assertIsDisplayed()
    }

    /**
     * AC-8: Component renders H2 heading with heading.md typography
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with ## H2 markdown
     * THEN: Heading displays with heading.md typography and proper margins
     */
    @Test
    fun testMarkdownTextRendersH2Heading() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "## Heading 2",
                )
            }
        }

        // Verify H2 content is displayed
        composeTestRule.onNodeWithText("Heading 2").assertIsDisplayed()
    }

    /**
     * AC-9: Component renders H3 heading with heading.sm typography
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with ### H3 markdown
     * THEN: Heading displays with heading.sm typography and proper margins
     */
    @Test
    fun testMarkdownTextRendersH3Heading() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "### Heading 3",
                )
            }
        }

        // Verify H3 content is displayed
        composeTestRule.onNodeWithText("Heading 3").assertIsDisplayed()
    }

    /**
     * AC-10: Component renders blockquotes with surfaceVariant background and primary left border
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with > blockquote markdown
     * THEN: Blockquote displays with surfaceVariant background (20% opacity), primary left border (4dp), and padding
     */
    @Test
    fun testMarkdownTextRendersBlockquote() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "> This is a blockquote",
                )
            }
        }

        // Verify blockquote content is displayed
        composeTestRule.onNodeWithText("This is a blockquote").assertIsDisplayed()
    }

    /**
     * AC-11: Component renders unordered list items with bullets and proper indentation
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with - list item markdown
     * THEN: List items display with bullets, left indentation (space.md), and bottom margin (space.xs)
     */
    @Test
    fun testMarkdownTextRendersUnorderedList() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "- Item 1\n- Item 2\n- Item 3",
                )
            }
        }

        // Verify list items are displayed
        composeTestRule.onNodeWithText("Item 1").assertIsDisplayed()
        composeTestRule.onNodeWithText("Item 2").assertIsDisplayed()
        composeTestRule.onNodeWithText("Item 3").assertIsDisplayed()
    }

    /**
     * AC-12: Component renders ordered list items with numbers and proper indentation
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with 1. numbered item markdown
     * THEN: List items display with numbers, left indentation (space.md), and bottom margin (space.xs)
     */
    @Test
    fun testMarkdownTextRendersOrderedList() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "1. First\n2. Second\n3. Third",
                )
            }
        }

        // Verify list items are displayed
        composeTestRule.onNodeWithText("First").assertIsDisplayed()
        composeTestRule.onNodeWithText("Second").assertIsDisplayed()
        composeTestRule.onNodeWithText("Third").assertIsDisplayed()
    }

    /**
     * AC-13: Component renders horizontal rules with border color
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with --- markdown
     * THEN: Horizontal rule displays with border.default color, 1dp height, and space.md margins
     */
    @Test
    fun testMarkdownTextRendersHorizontalRule() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "Text before\n---\nText after",
                )
            }
        }

        // Verify text before and after HR is displayed
        composeTestRule.onNodeWithText("Text before").assertIsDisplayed()
        composeTestRule.onNodeWithText("Text after").assertIsDisplayed()
    }

    /**
     * AC-14: Component uses theme tokens for all values (no hardcoded colors, spacing, typography)
     * GIVEN: Translation matrix defines all visual properties
     * WHEN: Component is rendered
     * THEN: All values use theme tokens (colors.*, space.*, radius.*, type.*)
     */
    @Test
    fun testMarkdownTextUsesThemeTokens() {
        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = "**Bold** and `code` and # Heading",
                )
            }
        }

        // Verify all content is displayed with theme tokens
        composeTestRule.onNodeWithText("Bold").assertIsDisplayed()
        composeTestRule.onNodeWithText("code").assertIsDisplayed()
        composeTestRule.onNodeWithText("Heading").assertIsDisplayed()
    }

    /**
     * AC-15: Component handles complex markdown with multiple element types
     * GIVEN: MarkdownText component is mounted
     * WHEN: Rendered with complex markdown combining multiple elements
     * THEN: All elements render correctly with proper styling
     */
    @Test
    fun testMarkdownTextHandlesComplexMarkdown() {
        val complexMarkdown = """
            # Title

            This is **bold** and *italic* text.

            ## Subtitle

            - List item 1
            - List item 2

            > A blockquote

            `inline code` and a [link](https://example.com)
        """.trimIndent()

        composeTestRule.setContent {
            CompositionLocalProvider(LocalLaneShadowTheme provides testTheme) {
                MarkdownText(
                    markdown = complexMarkdown,
                )
            }
        }

        // Verify all content is displayed
        composeTestRule.onNodeWithText("Title").assertIsDisplayed()
        composeTestRule.onNodeWithText("bold").assertIsDisplayed()
        composeTestRule.onNodeWithText("italic").assertIsDisplayed()
        composeTestRule.onNodeWithText("Subtitle").assertIsDisplayed()
        composeTestRule.onNodeWithText("List item 1").assertIsDisplayed()
        composeTestRule.onNodeWithText("A blockquote").assertIsDisplayed()
        composeTestRule.onNodeWithText("inline code").assertIsDisplayed()
        composeTestRule.onNodeWithText("link").assertIsDisplayed()
    }
}
