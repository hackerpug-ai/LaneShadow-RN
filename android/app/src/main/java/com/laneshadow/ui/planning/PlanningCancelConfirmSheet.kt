package com.laneshadow.ui.planning

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.laneshadow.ui.molecules.LSCancelConfirmSheet

/**
 * PlanningCancelConfirmSheet — Planning-specific cancel-confirm dialog.
 *
 * Thin wrapper around LSCancelConfirmSheet that adds planning-specific testTags
 * for cross-platform parity (RULES.md §Cross-Platform Component Parity).
 *
 * Renders a modal dialog asking the user to confirm cancellation of the planning
 * operation. Presents two actions:
 * - "Keep thinking" (secondary) — dismisses without invoking cancel
 * - "Cancel plan" (primary, copper-tinted) — invokes cancel to cancel the route plan
 *
 * @param onKeep Callback when "Keep planning" button is tapped
 * @param onCancel Callback when "Cancel plan" button is tapped
 * @param onDismiss Callback when dialog is dismissed without action
 * @param modifier Modifier for the dialog content
 */
@Composable
fun PlanningCancelConfirmSheet(
    onKeep: () -> Unit,
    onCancel: () -> Unit,
    onDismiss: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    // Delegate to LSCancelConfirmSheet with planning-specific text and testTags
    // Pass button-specific testTags via keepButtonModifier and cancelButtonModifier
    LSCancelConfirmSheet(
        title = "Cancel this plan?",
        body = "I've drawn one route already. You can back out now — but I'll toss what I have.",
        keepLabel = "Keep thinking",
        cancelLabel = "Cancel plan",
        onKeep = onKeep,
        onCancel = onCancel,
        onDismiss = onDismiss,
        modifier = modifier
            .testTag("planning.cancel-confirm")
            .semantics(mergeDescendants = false) {
                contentDescription = "Cancel planning confirmation"
            },
        keepButtonModifier = Modifier.testTag("planning.cancel-confirm.keep-button"),
        cancelButtonModifier = Modifier.testTag("planning.cancel-confirm.cancel-button"),
    )
}
