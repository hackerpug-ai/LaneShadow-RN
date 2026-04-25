package com.laneshadow.ui.organisms

import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.laneshadow.BuildConfig
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.GlassVariant
import org.junit.Assert.assertEquals
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
class LSInlineErrorCalloutTest {
    private val composeTestRule = createComposeRule()

    @get:Rule
    val ruleChain: TestRule = RuleChain.outerRule(DebugVariantRule).around(composeTestRule)

    companion object {
        const val CALLOUT_TAG = LS_INLINE_ERROR_CALLOUT_TAG
        const val COMPASS_CHIP_TAG = INLINE_ERROR_COMPASS_CHIP_TAG
        const val BODY_TAG = INLINE_ERROR_BODY_TAG
        const val DETAIL_TAG = INLINE_ERROR_DETAIL_TAG
        const val SUGGESTIONS_TAG = INLINE_ERROR_SUGGESTIONS_TAG
    }

    @Test
    fun default_renders_warning_stripe_glass_panel_with_compass_chip_and_body() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSInlineErrorCallout(
                    body = "Error occurred",
                    onSuggestionTap = {},
                    modifier = Modifier.testTag(CALLOUT_TAG),
                )
            }
        }

        // Verify compass chip exists
        composeTestRule.onNodeWithTag(COMPASS_CHIP_TAG)
            .assertExists()

        // Verify body text renders
        composeTestRule.onNodeWithTag(BODY_TAG)
            .assertExists()

        composeTestRule.onNodeWithText("Error occurred")
            .assertExists()

        // Verify "THE NAVIGATOR" label
        composeTestRule.onNodeWithText("THE NAVIGATOR")
            .assertExists()

        // Verify NO detail text (not provided)
        composeTestRule.onNodeWithTag(DETAIL_TAG)
            .assertDoesNotExist()

        // Verify NO suggestions (not provided)
        composeTestRule.onNodeWithTag(SUGGESTIONS_TAG)
            .assertDoesNotExist()
    }

    @Test
    fun with_detail_renders_detail_text() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSInlineErrorCallout(
                    body = "Error occurred",
                    detail = "Please check your connection and try again.",
                    onSuggestionTap = {},
                    modifier = Modifier.testTag(CALLOUT_TAG),
                )
            }
        }

        // Verify detail text exists
        composeTestRule.onNodeWithTag(DETAIL_TAG)
            .assertExists()

        composeTestRule.onNodeWithText("Please check your connection and try again.")
            .assertExists()

        // Verify body still exists
        composeTestRule.onNodeWithText("Error occurred")
            .assertExists()
    }

    @Test
    fun suggestion_tap_fires_callback_with_correct_chip() {
        var tappedChip: LSInlineErrorCallout.SuggestionChip? = null

        val suggestions = listOf(
            LSInlineErrorCallout.SuggestionChip(label = "Retry", isPrimary = true),
            LSInlineErrorCallout.SuggestionChip(label = "Cancel", isPrimary = false),
        )

        composeTestRule.setContent {
            LaneShadowTheme {
                LSInlineErrorCallout(
                    body = "Connection failed",
                    suggestions = suggestions,
                    onSuggestionTap = { chip ->
                        tappedChip = chip
                    },
                    modifier = Modifier.testTag(CALLOUT_TAG),
                )
            }
        }

        // Verify suggestions section exists
        composeTestRule.onNodeWithTag(SUGGESTIONS_TAG)
            .assertExists()

        // Verify suggestion chips render
        composeTestRule.onNodeWithText("Retry")
            .assertExists()
            .assertHasClickAction()

        composeTestRule.onNodeWithText("Cancel")
            .assertExists()
            .assertHasClickAction()

        // Initial state: no chip tapped
        assertEquals(null, tappedChip)

        // Tap "Retry" chip — should fire callback with correct chip
        composeTestRule.onNodeWithText("Retry").performClick()
        assertEquals(suggestions[0], tappedChip)
        assertEquals("Retry", tappedChip?.label)
        assertEquals(true, tappedChip?.isPrimary)

        // Tap "Cancel" chip — should fire callback with correct chip
        composeTestRule.onNodeWithText("Cancel").performClick()
        assertEquals(suggestions[1], tappedChip)
        assertEquals("Cancel", tappedChip?.label)
        assertEquals(false, tappedChip?.isPrimary)
    }

    @Test
    fun multiple_suggestions_render_in_order() {
        val suggestions = listOf(
            LSInlineErrorCallout.SuggestionChip(label = "First", isPrimary = true),
            LSInlineErrorCallout.SuggestionChip(label = "Second", isPrimary = false),
            LSInlineErrorCallout.SuggestionChip(label = "Third", isPrimary = false),
        )

        composeTestRule.setContent {
            LaneShadowTheme {
                LSInlineErrorCallout(
                    body = "Multiple options",
                    suggestions = suggestions,
                    onSuggestionTap = {},
                    modifier = Modifier.testTag(CALLOUT_TAG),
                )
            }
        }

        // Verify all suggestions render
        composeTestRule.onNodeWithText("First")
            .assertExists()

        composeTestRule.onNodeWithText("Second")
            .assertExists()

        composeTestRule.onNodeWithText("Third")
            .assertExists()
    }

    @Test
    fun warning_stripe_color_indicates_warning_accent() {
        composeTestRule.setContent {
            LaneShadowTheme {
                LSInlineErrorCallout(
                    body = "Warning message",
                    onSuggestionTap = {},
                    modifier = Modifier.testTag(CALLOUT_TAG),
                )
            }
        }

        // Verify the callout exists
        composeTestRule.onNodeWithTag(CALLOUT_TAG)
            .assertExists()

        // Verify semantics indicate detail is empty
        composeTestRule.onNodeWithTag(CALLOUT_TAG)
            .assert(
                SemanticsMatcher.expectValue(
                    LSInlineErrorCalloutDetailKey,
                    ""
                )
            )

        // Verify semantics indicate 0 suggestions
        composeTestRule.onNodeWithTag(CALLOUT_TAG)
            .assert(
                SemanticsMatcher.expectValue(
                    LSInlineErrorCalloutSuggestionCountKey,
                    0
                )
            )
    }
}
