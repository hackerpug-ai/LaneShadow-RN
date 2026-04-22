package com.laneshadow.ui.components.molecules

import com.laneshadow.ui.atoms.Glyphs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * DownloadProgressBanner molecule component
 *
 * A compact, dismissible banner for showing download progress
 * when navigating away from the main download screen.
 * Following React Native wrapper patterns from react-native/components/model/DownloadProgressBanner.tsx
 *
 * @param progress Download progress percentage (0-100)
 * @param downloadedBytes Number of bytes downloaded
 * @param totalBytes Total bytes to download
 * @param isVisible Whether to show the banner
 * @param onDismiss Optional callback when dismiss button is clicked
 * @param onPress Optional callback when banner is pressed
 * @param modifier Modifier for the banner container
 */
@Composable
fun DownloadProgressBanner(
    progress: Float,
    downloadedBytes: Long,
    totalBytes: Long,
    isVisible: Boolean,
    onDismiss: (() -> Unit)? = null,
    onPress: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Round progress to nearest integer for display
    val progressPercent = progress.toInt()

    // Build accessibility description
    val accessibilityDescription = "Download progress: $progressPercent% complete"

    // Only render if visible
    if (!isVisible) {
        return
    }

    Surface(
        modifier = modifier
            .semantics {
                contentDescription = accessibilityDescription
            }
            .then(
                if (onPress != null) {
                    Modifier.clickable { onPress() }
                } else {
                    Modifier
                }
            ),
        color = theme.colors.onSurface.default.copy(
            alpha = 0.95f
        ),
        border = BorderStroke(
            width = 1.dp,
            color = theme.colors.warning.default.copy(
                alpha = theme.opacity.values["step03"] ?: 0.3f
            ),
        ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = theme.space.md, vertical = theme.space.xs),
        ) {
            // Progress bar at top (2px height)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(2.dp)
                    .background(
                        theme.colors.warning.default.copy(
                            alpha = theme.opacity.values["step02"] ?: 0.2f
                        )
                    ),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(progressPercent / 100f)
                        .height(2.dp)
                        .background(theme.colors.warning.default),
                )
            }

            // Content row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = theme.space.xs),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Title and subtitle
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(theme.space.xs),
                ) {
                    // Title text
                    Text(
                        text = "Setting up your AI Companion...",
                        color = theme.colors.onSurface.default.copy(
                            alpha = theme.opacity.values["step09"] ?: 0.9f
                        ),
                        style = androidx.compose.ui.text.TextStyle(
                            fontSize = 14.sp,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                            letterSpacing = (-0.2).sp,
                        ),
                    )

                    // Subtitle text with progress percentage
                    Text(
                        text = "$progressPercent% complete · Keep WiFi connected",
                        color = theme.colors.onSurface.default.copy(
                            alpha = 0.6f
                        ),
                        style = androidx.compose.ui.text.TextStyle(
                            fontSize = 12.sp,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
                        ),
                    )
                }

                // Dismiss button
                if (onDismiss != null) {
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .padding(start = theme.space.xs)
                            .size(24.dp),
                    ) {
                        Icon(
                            imageVector = Glyphs.Default.Close,
                            contentDescription = "Dismiss",
                            tint = theme.colors.onSurface.default.copy(
                                alpha = 0.6f
                            ),
                            modifier = Modifier.size(16.dp),
                        )
                    }
                }
            }
        }
    }
}
