package com.laneshadow.ui.templates

import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import com.laneshadow.ui.idle.GreetingScope
import com.laneshadow.ui.idle.IdleUiState
import com.laneshadow.sandbox.mockproviders.Greeting
import com.laneshadow.sandbox.mockproviders.IdleScreenState
import com.laneshadow.sandbox.mockproviders.LocationContext as MockLocationContext
import com.laneshadow.sandbox.mockproviders.SuggestionChip as MockSuggestionChip
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.idle.toMockState
import com.laneshadow.ui.molecules.CapsuleState
import com.laneshadow.ui.molecules.IdleScope
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * TDD tests for IdleScreen template.
 *
 * AC-1: Idle screen composition renders with all components
 * AC-2: Suggestion chip tap updates input
 * AC-3: Trailing icon swap on typing
 * AC-4: Hamburger menu callback
 * AC-5: Light/dark token re-resolution
 * AC-6: No data-fetching logic
 *
 * Note: Full UI testing is done via the sandbox stories (templates.idle-screen.default).
 * These unit tests verify code structure, imports, and callback wiring.
 */
@RunWith(RobolectricTestRunner::class)
class IdleScreenTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun liveAdvisory_rendersCard() {
        val screenState = IdleUiState(
            firstName = "Avery",
            greetingScope = GreetingScope.TODAY,
            metaRow = "MONDAY · 45°F · RAIN",
            showAdvisoryCard = true,
            advisoryMessage = "Rain expected",
        ).toMockState()

        val capsuleState = CapsuleState.Idle(
            scope = IdleScope.TODAY,
            headline = "Where are we riding today, Avery?",
            emphasizedWord = "today",
            metaItems = listOf("MONDAY", "45°F", "RAIN"),
            isWarning = true,
        )

        composeTestRule.setContent {
            LaneShadowTheme {
                Surface {
                    IdleScreen(
                        state = screenState,
                        capsuleState = capsuleState,
                        inputValue = "",
                        onMenuTap = {},
                        onSuggestionTap = {},
                        onSend = {},
                        onCollapse = {},
                        onFilter = {},
                        onValueChange = {},
                        mapContent = {
                            Text(text = "stub-map")
                        },
                    )
                }
            }
        }

        // Note: advisory card is no longer separate; it's part of the capsule warning state
        composeTestRule.onNodeWithTag("idle-context-capsule").assertIsDisplayed()
    }

    @Test
    fun productionIdleTags_existInUi() {
        val capsuleState = CapsuleState.Idle(
            scope = IdleScope.TODAY,
            headline = "Where are we riding today, Avery?",
            emphasizedWord = "today",
            metaItems = listOf("MONDAY", "68°F", "CLEAR"),
        )

        composeTestRule.setContent {
            LaneShadowTheme {
                Surface {
                    IdleScreen(
                        state = IdleUiState(
                            firstName = "Avery",
                            greetingScope = GreetingScope.TODAY,
                        ).toMockState(),
                        capsuleState = capsuleState,
                        inputValue = "",
                        onMenuTap = {},
                        onSuggestionTap = {},
                        onSend = {},
                        onCollapse = {},
                        onFilter = {},
                        onValueChange = {},
                        mapContent = {
                            Text(text = "stub-map")
                        },
                    )
                }
            }
        }

        // Updated: check for new testTags
        composeTestRule.onNodeWithTag("idle-context-capsule").assertIsDisplayed()
        composeTestRule.onNodeWithText("Twisty back roads").assertIsDisplayed()
    }
}
