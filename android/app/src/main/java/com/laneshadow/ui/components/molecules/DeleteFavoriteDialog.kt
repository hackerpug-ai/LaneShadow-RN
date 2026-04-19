package com.laneshadow.ui.components.molecules

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * DeleteFavoriteDialog molecule component
 *
 * Confirmation dialog for deleting saved routes.
 * Following React Native wrapper patterns from react-native/components/ui/delete-favorite-dialog.tsx
 *
 * @param visible Whether the dialog is currently visible
 * @param favoriteName Name of the favorite route being deleted
 * @param onConfirm Callback when user confirms deletion
 * @param onDismiss Callback when user dismisses the dialog (cancel or tap outside)
 * @param modifier Modifier for the dialog
 */
@Composable
fun DeleteFavoriteDialog(
    visible: Boolean,
    favoriteName: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (!visible) return

    val theme = LocalLaneShadowTheme.current

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = onConfirm,
            ) {
                Text(
                    text = "Delete",
                    color = theme.colors.danger.default,
                )
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
            ) {
                Text(
                    text = "Cancel",
                    color = theme.colors.onSurface.default,
                )
            }
        },
        title = {
            Text(
                text = "Delete saved route?",
                color = theme.colors.onSurface.default,
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
            )
        },
        text = {
            Text(
                text = "Are you sure you want to delete \"$favoriteName\"?",
                color = theme.colors.onSurface.default,
                fontSize = 14.sp,
                textAlign = TextAlign.Start,
            )
        },
        modifier = modifier,
        containerColor = theme.colors.surface.default,
    )
}
