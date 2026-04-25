package com.laneshadow.ui.organisms

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.laneshadow.theme.LaneShadowTheme
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class LSInlineErrorCalloutTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    // Test tags
    companion object {
        const val INLINE_ERROR_CALLOUT_TAG = "ls-inline-error-callout"
        const val INLINE_ERROR_COMPASS_CHIP_TAG = "inline-error-compass-chip"
        const val INLINE_ERROR_BODY_TAG = "inline-error-body"
        const val INLINE_ERROR_DETAIL_TAG = "inline-error-detail"
        const val INLINE_ERROR_SUGGESTIONS_TAG = "inline-error-suggestions"
    }

    @Test
    fun renders_warn_callout_with_body_detail_and_suggestions() {
        val suggestions = listOf(
            SuggestionChip(label = "Try inland", isPrimary = true),
            SuggestionChip(label = "End at Big Sur", isPrimary = false),
        )

        composeTestRule.setContent {
            LaneShadowTheme {
                LSInlineErrorCallout(
                    body = "Couldn't stitch that one together — the segment through Lucia looked broken.",
                    detail = "Try a different end point, or let me route you inland via Carmel Valley Rd instead?",
                    suggestions = suggestions,
                    onSuggestionTap = {},
                )
            }
        }

        // Verify compass chip is displayed
        composeTestRule.onNodeWithTag(INLINE_ERROR_COMPASS_CHIP_TAG)
            .assertIsDisplayed()

        // Verify "THE NAVIGATOR" label is displayed
        composeTestRule.onNodeWithText("THE NAVIGATOR")
            .assertIsDisplayed()

        // Verify body text is displayed
        composeTestRule.onNodeWithTag(INLINE_ERROR_BODY_TAG)
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Couldn't stitch that one together — the segment through Lucia looked broken.")
            .assertIsDisplayed()

        // Verify detail is displayed
        composeTestRule.onNodeWithTag(INLINE_ERROR_DETAIL_TAG)
            .assertIsDisplayed()

        composeTestRule.onNodeWithText("Try a different end point, or let me route you inland via Carmel Valley Rd instead?")
            .assertIsDisplayed()

        // Verify suggestions container is displayed
        composeTestRule.onNodeWithTag(INLINE_ERROR_SUGGESTIONS_TAG)
            .assertIsDisplayed()

        // Verify both suggestion labels are displayed
        composeTestRule.onNodeWithText("Try inland")
            .assertIsDisplayed()
        composeTestRule.onNodeWithText("End at Big Sur")
            .assertIsDisplayed()
    }

    @Test
    fun suggestion_tap_fires_callback_exactly_once_with_tapped_chip() {
        val suggestions = listOf(
            SuggestionChip(label = "Try inland", isPrimary = true),
            SuggestionChip(label = "End at Big Sur", isPrimary = false),
        )

        var tappedChip: SuggestionChip? = null
        var tapCount = 0

        composeTestRule.setContent {
            LaneShadowTheme {
                LSInlineErrorCallout(
                    body = "Couldn't stitch that route.",
                    suggestions = suggestions,
                    onSuggestionTap = { chip ->
                        tappedChip = chip
                        tapCount++
                    },
                )
            }
        }

        // Tap the second suggestion chip
        composeTestRule.onNodeWithText("End at Big Sur")
            .performClick()

        composeTestRule.runOnIdle {
            assertEquals(1, tapCount)
            assertEquals("End at Big Sur", tappedChip?.label)
            assertEquals(false, tappedChip?.isPrimary)
        }
    }
}
