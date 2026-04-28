package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
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
 * LSConfirmDialog - Centered confirmation dialog with scrim backdrop.
 *
 * @param title Dialog title (e.g., "Start a new ride?")
 * @param onConfirm Callback when confirm button is tapped
 * @param onDismiss Callback when cancel button is tapped or dialog is dismissed
 * @param confirmText Text for confirm button (default: "Start new")
 * @param cancelText Text for cancel button (default: "Cancel")
 * @param modifier Modifier for the dialog content
 */
@Composable
fun LSConfirmDialog(
    title: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    confirmText: String = "Start new",
    cancelText: String = "Cancel",
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
        // Scrim backdrop - use a semi-transparent black color
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.Black.copy(alpha = 0.5f))
                .padding(theme.space.xl),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            // Dialog body
            Column(
                modifier = modifier
                    .shadow(
                        elevation = 8.dp,
                        shape = RoundedCornerShape(theme.radius.md),
                        spotColor = Color.Black,
                    )
                    .background(
                        color = theme.colors.surface.default,
                        shape = RoundedCornerShape(theme.radius.md),
                    )
                    .padding(theme.space.xl),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(theme.space.lg),
            ) {
                // Title
                LSText(
                    text = title,
                    variant = TypographyVariant.Opinion.Lg,
                    color = ContentColor.Primary,
                )

                Spacer(modifier = Modifier.height(theme.space.sm))

                // Button row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(theme.space.md),
                ) {
                    // Cancel button (tertiary)
                    LSButton(
                        label = cancelText,
                        variant = ButtonVariant.Tertiary,
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                    )

                    // Confirm button (primary)
                    LSButton(
                        label = confirmText,
                        variant = ButtonVariant.Primary,
                        onClick = onConfirm,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}
