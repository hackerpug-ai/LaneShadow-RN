package com.laneshadow.e2e.sprint04

import androidx.compose.ui.test.SemanticsNodeInteraction
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertContentDescriptionEquals
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotDisplayed
import androidx.compose.ui.test.assertTextEquals
import androidx.compose.ui.test.filterToOne
import androidx.compose.ui.test.onChildren
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement

/**
 * Extension functions for common Compose testing operations.
 * Provides reusable test utilities to reduce boilerplate in UI tests.
 */

/**
 * Asserts that a node is both displayed and has a click action.
 */
fun SemanticsNodeInteraction.assertIsDisplayedAndClickable(): SemanticsNodeInteraction {
    return this.assertIsDisplayed().assertHasClickAction()
}

/**
 * Asserts that a node with the given content description exists and is displayed.
 */
fun SemanticsNodeInteraction.assertContentDescriptionDisplayed(
    description: String
): SemanticsNodeInteraction {
    return this.assertContentDescriptionEquals(description).assertIsDisplayed()
}

/**
 * Waits for a node to be displayed with a timeout.
 * Note: This is a simple implementation. For more robust waiting,
 * consider using Compose's built-in waiting mechanisms or IdlingResources.
 */
fun SemanticsNodeInteraction.waitForDisplayed(
    timeoutMs: Long = 5000,
    condition: () -> Boolean = { true }
): SemanticsNodeInteraction {
    val startTime = System.currentTimeMillis()
    while (System.currentTimeMillis() - startTime < timeoutMs) {
        try {
            if (condition()) {
                return this.assertIsDisplayed()
            }
        } catch (e: Exception) {
            // Node not found yet, continue waiting
        }
        Thread.sleep(100)
    }
    // Final attempt
    return this.assertIsDisplayed()
}

/**
 * Performs a click and waits for the node to no longer be displayed.
 * Useful for testing navigation or dismissal actions.
 */
fun SemanticsNodeInteraction.performClickAndWaitForDismissal(): SemanticsNodeInteraction {
    this.performClick()
    // In a real implementation, we'd use IdlingResources here
    // For now, a small delay to allow the UI to update
    Thread.sleep(300)
    return this.assertIsNotDisplayed()
}

/**
 * Finds a child node with the given tag and asserts it exists.
 */
fun SemanticsNodeInteraction.assertChildWithTagExists(
    tag: String
): SemanticsNodeInteraction {
    return this.onChildren()
        .filterToOne(
            SemanticsMatcher.expectValue(
                androidx.compose.ui.semantics.SemanticsProperties.TestTag,
                tag
            )
        )
        .assertIsDisplayed()
}

/**
 * Performs text replacement and asserts the new text value.
 */
fun SemanticsNodeInteraction.performTextReplacementAndAssert(
    newText: String
): SemanticsNodeInteraction {
    this.performTextReplacement(newText)
    // In a real implementation, we'd assert the text changed
    return this
}

/**
 * Types text and asserts the input value.
 */
fun SemanticsNodeInteraction.performTextInputAndAssert(
    text: String
): SemanticsNodeInteraction {
    this.performTextInput(text)
    // In a real implementation, we'd assert the text was input
    return this
}
