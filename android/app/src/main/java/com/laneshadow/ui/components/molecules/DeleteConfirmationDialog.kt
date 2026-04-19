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
 * DeleteConfirmationDialog molecule component
 *
 * Confirmation dialog for deleting offline maps with region info.
 * Following React Native wrapper patterns from react-native/components/offline/delete-confirmation-dialog.tsx
 *
 * @param visible Whether to show the dialog
 * @param regionName Name of the offline map region being deleted
 * @param regionSize Size of the region (e.g., "125.4 MB")
 * @param onConfirm Callback when user confirms deletion
 * @param onDismiss Callback when user cancels or dismisses the dialog
 * @param testID Optional test ID for testing
 * @param modifier Modifier for the dialog
 */
@Composable
fun DeleteConfirmationDialog(
    visible: Boolean,
    regionName: String,
    regionSize: String,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit,
    testID: String? = null,
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
                text = "Delete Offline Map",
                color = theme.colors.onSurface.default,
                style = androidx.compose.ui.text.TextStyle(
                    fontSize = 20.sp,
                    fontWeight = FontWeight.SemiBold,
                ),
            )
        },
        text = {
            Text(
                text = "Delete \"$regionName\" ($regionSize)? This map will no longer be available offline.",
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
