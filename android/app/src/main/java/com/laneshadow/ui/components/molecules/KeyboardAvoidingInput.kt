package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBars
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Keyboard behavior enum
 *
 * Following RN wrapper API from react-native/components/ui/keyboard-avoiding-input.tsx
 */
enum class KeyboardBehavior {
    /**
     * Adds padding to bottom of container (default)
     * Corresponds to RN behavior="padding"
     */
    Padding,

    /**
     * Repositions the container (useful for fixed positioning)
     * Corresponds to RN behavior="position"
     */
    Position,

    /**
     * Adjusts container height (Android only)
     * Corresponds to RN behavior="height"
     */
    Height,
}

/**
 * KeyboardAvoidingInput molecule component
 *
 * Global wrapper for any input that needs keyboard avoidance in bottom sheets or modals.
 * Prevents the keyboard from hiding the input field by adjusting layout based on keyboard state.
 *
 * IMPORTANT: Use this component for ALL text inputs in bottom sheets, modals, or any
 * container where the keyboard might obscure the input field.
 *
 * On Android, keyboard avoidance is primarily handled by the system via adjustResize
 * windowSoftInputMode, but this component provides additional padding control and
 * cross-platform API compatibility with the React Native version.
 *
 * Following React Native wrapper patterns from react-native/components/ui/keyboard-avoiding-input.tsx
 *
 * Usage:
 *   KeyboardAvoidingInput {
 *     Input(...)
 *   }
 *
 * Or with custom behavior:
 *   KeyboardAvoidingInput(
 *     behavior = KeyboardBehavior.Position,
 *     offset = 20.dp
 *   ) {
 *     Textarea(...)
 *   }
 *
 * @param modifier Modifier for the container
 * @param behavior How the keyboard avoidance should behave (default: Padding)
 * @param offset Extra vertical offset to add beyond keyboard avoidance (default: 0.dp)
 * @param includeSafeAreaBottom Whether to add safe area bottom padding (default: true)
 * @param testId Test identifier for UI testing (defaults to null)
 * @param content Child content composable
 */
@Composable
fun KeyboardAvoidingInput(
    modifier: Modifier = Modifier,
    behavior: KeyboardBehavior = KeyboardBehavior.Padding,
    offset: Dp = 0.dp,
    includeSafeAreaBottom: Boolean = true,
    testId: String? = null,
    content: @Composable () -> Unit,
) {
    // Get IME (keyboard) insets and system bars insets
    val imeInsets = WindowInsets.ime
    val systemBarsInsets = WindowInsets.systemBars

    // Calculate bottom padding based on behavior
    val bottomPadding = when (behavior) {
        KeyboardBehavior.Padding -> {
            // Add IME padding + optional offset + optional safe area
            val imePadding = imeInsets.asPaddingValues().calculateBottomPadding()
            val safeAreaPadding = if (includeSafeAreaBottom) {
                systemBarsInsets.asPaddingValues().calculateBottomPadding()
            } else {
                0.dp
            }
            imePadding + offset + safeAreaPadding
        }
        KeyboardBehavior.Position -> {
            // For position behavior, we still add padding but may be used differently
            val imePadding = imeInsets.asPaddingValues().calculateBottomPadding()
            val safeAreaPadding = if (includeSafeAreaBottom) {
                systemBarsInsets.asPaddingValues().calculateBottomPadding()
            } else {
                0.dp
            }
            imePadding + offset + safeAreaPadding
        }
        KeyboardBehavior.Height -> {
            // Height behavior uses offset as explicit spacing
            val imePadding = imeInsets.asPaddingValues().calculateBottomPadding()
            val safeAreaPadding = if (includeSafeAreaBottom) {
                systemBarsInsets.asPaddingValues().calculateBottomPadding()
            } else {
                0.dp
            }
            imePadding + offset + safeAreaPadding
        }
    }

    Box(
        modifier = modifier
            .then(
                if (testId != null) {
                    Modifier.testTag(testId)
                } else {
                    Modifier
                }
            )
            .semantics {
                contentDescription = "Keyboard avoiding input container"
            }
            .padding(bottom = bottomPadding)
    ) {
        content()
    }
}
