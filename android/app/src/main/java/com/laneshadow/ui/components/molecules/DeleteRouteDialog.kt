package com.laneshadow.ui.components.molecules

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * DeleteRouteDialog molecule component
 *
 * Confirmation dialog for deleting routes with undo notice.
 * Following React Native wrapper patterns from react-native/components/ui/delete-route-dialog.tsx
 *
 * @param visible Whether to show the dialog
 * @param routeName Name of the route being deleted
 * @param onConfirm Callback when user confirms deletion
 * @param onDismiss Callback when user cancels or dismisses the dialog
 * @param modifier Modifier for the dialog
 */
@Composable
fun DeleteRouteDialog(
    visible: Boolean,
    routeName: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (!visible) {
        return
    }

    val theme = LocalLaneShadowTheme.current

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = onConfirm
            ) {
                Text(
                    text = "Delete",
                    color = theme.colors.danger.default,
                )
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss
            ) {
                Text(
                    text = "Cancel",
                    color = theme.colors.onSurface.default,
                )
            }
        },
        title = {
            Text(
                text = "Delete Route",
                color = theme.colors.onSurface.default,
                style = androidx.compose.ui.text.TextStyle(
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                ),
            )
        },
        text = {
            Text(
                text = "Are you sure you want to delete \"$routeName\"? You can undo this within 5 seconds.",
                color = theme.colors.onSurface.default,
                style = androidx.compose.ui.text.TextStyle(
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Normal,
                ),
            )
        },
        modifier = modifier,
        containerColor = theme.colors.surface.default,
    )
}
