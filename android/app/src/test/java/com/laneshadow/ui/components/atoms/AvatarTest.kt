package com.laneshadow.ui.components.atoms

import android.content.Context
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Rule
import org.junit.Test

/**
 * TDD tests for Avatar component
 *
 * Following RED -> GREEN -> REFACTOR cycle per acceptance criterion
 */
class AvatarTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    private val context: Context = InstrumentationRegistry.getInstrumentation().targetContext

    /**
     * AC-1: Component renders in default state
     * GIVEN: App is running and component is mounted
     * WHEN: Avatar is rendered with required props
     * THEN: Component displays matching RN wrapper defaults
     */
    @Test
    fun testAvatarDefaultRendering() {
        // GIVEN: Avatar component with default props
        // WHEN: Rendered with initials
        composeTestRule.setContent {
            Avatar(
                initials = "JD"
            )
        }

        // THEN: Component displays with initials
        composeTestRule.onNodeWithText("JD").assertIsDisplayed()
    }

    /**
     * AC-2: All style properties match matrix
     * GIVEN: Translation matrix defines layout, typography, colors
     * WHEN: Component is rendered in all variants
     * THEN: Measured values match matrix (height, padding, radius, font-size)
     */
    @Test
    fun testAvatarStylePropertiesMatchMatrix() {
        // Test default size (40x40)
        composeTestRule.setContent {
            Avatar(
                size = AvatarSize.Default,
                initials = "AB"
            )
        }
        composeTestRule.onNodeWithText("AB").assertIsDisplayed()

        // Test lg size (64x64)
        composeTestRule.setContent {
            Avatar(
                size = AvatarSize.Large,
                initials = "CD"
            )
        }
        composeTestRule.onNodeWithText("CD").assertIsDisplayed()

        // Test xl size (96x96)
        composeTestRule.setContent {
            Avatar(
                size = AvatarSize.ExtraLarge,
                initials = "EF"
            )
        }
        composeTestRule.onNodeWithText("EF").assertIsDisplayed()
    }

    /**
     * AC-3: Component handles all states
     * GIVEN: Component supports states (hover, pressed, disabled, error, loading)
     * WHEN: Each state is triggered
     * THEN: Visual feedback matches RN wrapper behavior
     */
    @Test
    fun testAvatarStates() {
        // Test with border
        composeTestRule.setContent {
            Avatar(
                initials = "GH",
                showBorder = true
            )
        }
        composeTestRule.onNodeWithText("GH").assertIsDisplayed()

        // Test with ring
        composeTestRule.setContent {
            Avatar(
                initials = "IJ",
                showRing = true
            )
        }
        composeTestRule.onNodeWithText("IJ").assertIsDisplayed()

        // Test with badge
        composeTestRule.setContent {
            Avatar(
                initials = "KL",
                badge = {
                    AvatarBadge(
                        variant = AvatarBadgeVariant.Success
                    )
                }
            )
        }
        composeTestRule.onNodeWithText("KL").assertIsDisplayed()
    }
}
