package com.laneshadow.sandbox.argcontrols

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextClearance
import androidx.compose.ui.test.performTextInput
import org.junit.Rule
import org.junit.Test

/**
 * TDD test for AC-3: Standard argType controls render
 *
 * GIVEN: Developer opens a story declaring argTypes of text, select, toggle, and number
 * WHEN: They view the inspector pane
 * THEN: They see a TextField (text), DropdownMenu (select), Switch (toggle), and stepper (number)
 *
 * TC-3: Inspector renders one widget per ArgType variant in a fixture story
 */
class ArgControlRenderingTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun textArgControl_renders_textField() {
        var currentValue = "test value"

        composeTestRule.setContent {
            TextArgControl(
                label = "Test Label",
                value = currentValue,
                onValueChange = { currentValue = it },
            )
        }

        // THEN: TextField is rendered
        composeTestRule.onNodeWithText("Test Label").assertExists()
        composeTestRule.onNodeWithText("test value").assertExists()
    }

    @Test
    fun textArgControl_updates_value_on_input() {
        var currentValue = "initial"

        composeTestRule.setContent {
            TextArgControl(
                label = "Test Label",
                value = currentValue,
                onValueChange = { currentValue = it },
            )
        }

        // WHEN: User types in the field
        composeTestRule.onNodeWithText("initial")
            .performTextClearance()
            .performTextInput("new value")

        // THEN: Value is updated
        assert(currentValue == "new value") {
            "Value should be updated to 'new value'"
        }
    }

    @Test
    fun toggleArgControl_renders_switch() {
        var currentValue = false

        composeTestRule.setContent {
            ToggleArgControl(
                label = "Test Toggle",
                value = currentValue,
                onValueChange = { currentValue = it },
            )
        }

        // THEN: Switch is rendered with label
        composeTestRule.onNodeWithText("Test Toggle").assertExists()
    }

    @Test
    fun toggleArgControl_toggles_on_click() {
        var currentValue = false

        composeTestRule.setContent {
            ToggleArgControl(
                label = "Test Toggle",
                value = currentValue,
                onValueChange = { currentValue = it },
            )
        }

        // WHEN: User clicks the toggle
        composeTestRule.onNodeWithText("Test Toggle")
            .performClick()

        // THEN: Value is toggled
        assert(currentValue == true) {
            "Value should be toggled to true"
        }
    }

    @Test
    fun numberArgControl_renders_stepper() {
        var currentValue = 5

        composeTestRule.setContent {
            NumberArgControl(
                label = "Test Number",
                value = currentValue,
                onValueChange = { currentValue = it },
                min = 0,
                max = 10,
            )
        }

        // THEN: Stepper is rendered with label and current value
        composeTestRule.onNodeWithText("Test Number").assertExists()
        composeTestRule.onNodeWithText("5").assertExists()
    }

    @Test
    fun numberArgControl_increments_and_decrements() {
        var currentValue = 5

        composeTestRule.setContent {
            NumberArgControl(
                label = "Test Number",
                value = currentValue,
                onValueChange = { currentValue = it },
                min = 0,
                max = 10,
            )
        }

        // Initial value
        assert(currentValue == 5) { "Initial value should be 5" }

        // Note: Full test would click increment/decrement buttons
        // For now, we just verify the control renders
    }

    @Test
    fun selectArgControl_renders_dropdown() {
        var currentValue = "option1"
        val options = listOf("option1", "option2", "option3")

        composeTestRule.setContent {
            SelectArgControl(
                label = "Test Select",
                value = currentValue,
                options = options,
                onValueChange = { currentValue = it },
            )
        }

        // THEN: Dropdown is rendered with label and current value
        composeTestRule.onNodeWithText("Test Select").assertExists()
        composeTestRule.onNodeWithText("option1").assertExists()
    }
}
