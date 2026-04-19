package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.ui.components.atoms.Button
import com.laneshadow.ui.components.atoms.ButtonVariant
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * DownloadErrorSheet molecule component
 *
 * Bottom sheet dialog for download error states with retry and support options.
 * Following React Native wrapper patterns from react-native/components/offline/download-error-sheet.tsx
 *
 * @param isVisible Whether to show the error sheet
 * @param onRetry Callback when user taps retry button
 * @param onClose Callback when user cancels or dismisses the sheet
 * @param error Optional error message to display (defaults to generic message)
 * @param retryCount Number of retry attempts (defaults to 0, shows "Contact Support" at 3+)
 * @param testID Optional test ID for UI testing
 */
@Composable
fun DownloadErrorSheet(
    isVisible: Boolean,
    onRetry: () -> Unit,
    onClose: () -> Unit,
    error: String? = null,
    retryCount: Int = 0,
    testID: String? = null,
) {
    if (!isVisible) {
        return
    }

    val theme = LocalLaneShadowTheme.current

    // Default error message if none provided
    val errorMessage = error ?: "There was a problem downloading this map. Please check your connection and try again."

    // Show contact support option after 3 retries
    val showContactSupport = retryCount >= 3

    // Build accessibility description
    val accessibilityDescription = "Download failed. $errorMessage"

    AlertDialog(
        onDismissRequest = onClose,
        modifier = Modifier
            .testTag(testID ?: "download-error-sheet")
            .semantics {
                contentDescription = accessibilityDescription
            },
        title = null,
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                // Error icon (64x64 danger circle with "!" text)
                ErrorIcon(
                    modifier = Modifier
                        .size(64.dp)
                        .testTag(testID?.let { "$it-icon" } ?: "download-error-icon")
                )

                Spacer(modifier = Modifier.height(theme.space.lg))

                // Title: "Download Failed" (title.lg = 18sp, SemiBold)
                Text(
                    text = "Download Failed",
                    color = theme.colors.onSurface.default,
                    style = androidx.compose.ui.text.TextStyle(
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                    ),
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag(testID?.let { "$it-title" } ?: "download-error-title")
                )

                Spacer(modifier = Modifier.height(theme.space.md))

                // Error message (body.md = 14sp, muted color)
                Text(
                    text = errorMessage,
                    color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                    style = androidx.compose.ui.text.TextStyle(
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal,
                    ),
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag(testID?.let { "$it-message" } ?: "download-error-message")
                )

                Spacer(modifier = Modifier.height(theme.space.lg))

                // Retry Download button (default variant, lg size = 44dp, full width)
                Button(
                    variant = ButtonVariant.Default,
                    size = com.laneshadow.ui.components.atoms.ButtonSize.Large,
                    text = "Retry Download",
                    onPress = onRetry,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag(testID?.let { "$it-retry" } ?: "download-error-retry"),
                )

                Spacer(modifier = Modifier.height(theme.space.md))

                // Contact Support button (ghost, shown when retryCount >= 3)
                if (showContactSupport) {
                    Button(
                        variant = ButtonVariant.Ghost,
                        size = com.laneshadow.ui.components.atoms.ButtonSize.Default,
                        text = "Contact Support",
                        onPress = {
                            // TODO: Navigate to support flow
                            onClose()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag(testID?.let { "$it-support" } ?: "download-error-support"),
                    )

                    Spacer(modifier = Modifier.height(theme.space.md))
                }

                // Cancel button (ghost, full width)
                Button(
                    variant = ButtonVariant.Ghost,
                    size = com.laneshadow.ui.components.atoms.ButtonSize.Default,
                    text = "Cancel",
                    onPress = onClose,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag(testID?.let { "$it-cancel" } ?: "download-error-cancel"),
                )
            }
        },
        confirmButton = {},
        containerColor = theme.colors.surface.default,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.xl),
    )
}

/**
 * Error icon component
 *
 * 64x64 danger circle background with "!" text in center.
 * Following RN wrapper design tokens.
 *
 * @param modifier Modifier for the icon
 */
@Composable
private fun ErrorIcon(
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Circular background with danger color
    Box(
        modifier = modifier
            .background(
                color = theme.colors.danger.default,
                shape = CircleShape,
            ),
        contentAlignment = Alignment.Center,
    ) {
        // Exclamation mark text
        Text(
            text = "!",
            color = theme.colors.onPrimary.default,
            style = androidx.compose.ui.text.TextStyle(
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold,
            ),
        )
    }
}
