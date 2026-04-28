package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant

/**
 * LSCancelConfirmSheet — A centered confirmation sheet for Planning V02.
 *
 * Renders a modal dialog asking the user to confirm cancellation
 * of the current planning operation.
 *
 * @param title Dialog title (e.g., "Cancel this plan?")
 * @param body Dialog body text explaining the consequences
 * @param keepLabel Text for the keep button (default: "Keep thinking")
 * @param cancelLabel Text for the cancel button (default: "Cancel plan")
 * @param onKeep Callback when keep button is tapped
 * @param onCancel Callback when cancel button is tapped
 * @param onDismiss Callback when dialog is dismissed without action
 * @param modifier Modifier for the dialog content
 */
@Composable
fun LSCancelConfirmSheet(
    title: String,
    body: String,
    keepLabel: String = "Keep thinking",
    cancelLabel: String = "Cancel plan",
    onKeep: () -> Unit,
    onCancel: () -> Unit,
    onDismiss: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = true,
            usePlatformDefaultWidth = false,
        ),
    ) {
        // Scrim backdrop - use surface.scrim token (semi-transparent black)
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.Black.copy(alpha = 0.4f))
                .padding(theme.space.md),
            horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            // Dialog body - surface.default background
            Column(
                modifier = modifier
                    .background(
                        color = theme.colors.surface.default,
                        shape = RoundedCornerShape(theme.radius.xl),
                    )
                    .padding(theme.space.lg),
                verticalArrangement = Arrangement.spacedBy(theme.space.md),
            ) {
                // Title
                LSText(
                    text = title,
                    variant = TypographyVariant.Opinion.Lg,
                    color = ContentColor.Primary,
                    modifier = Modifier.fillMaxWidth(),
                )

                // Body (italic, secondary color)
                LSText(
                    text = body,
                    variant = TypographyVariant.Opinion.Sm,
                    color = ContentColor.Secondary,
                    modifier = Modifier.fillMaxWidth(),
                )

                // Actions row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(theme.space.md),
                ) {
                    // Keep button (tertiary - outlined)
                    LSButton(
                        label = keepLabel,
                        variant = ButtonVariant.Tertiary,
                        onClick = onKeep,
                        modifier = Modifier.weight(1f),
                    )

                    // Cancel button (signal - primary filled with signal color)
                    LSButton(
                        label = cancelLabel,
                        variant = ButtonVariant.Primary,
                        onClick = onCancel,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}
