package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import com.laneshadow.ui.components.atoms.Button
import com.laneshadow.ui.components.atoms.ButtonSize
import com.laneshadow.ui.components.atoms.ButtonVariant
import com.laneshadow.ui.components.atoms.Progress
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Download state enum
 *
 * Represents the current state of a download operation
 */
enum class DownloadState {
    Idle,
    Downloading,
    Paused,
    Complete,
    Failed,
}

/**
 * DownloadProgressIndicator molecule component
 *
 * Displays download progress with a progress bar, percentage text,
 * downloaded/total MB, and estimated time remaining.
 * Following React Native wrapper patterns from react-native/components/offline/download-progress-indicator.tsx
 *
 * @param packName Pack name being downloaded
 * @param bytesDownloaded Downloaded bytes so far
 * @param totalBytes Total bytes expected
 * @param percentage Download percentage 0-100
 * @param eta Estimated seconds remaining
 * @param state Download state
 * @param onCancel Cancel handler
 * @param modifier Modifier for the component
 * @param testID Test ID for UI testing
 */
@Composable
fun DownloadProgressIndicator(
    packName: String,
    bytesDownloaded: Long,
    totalBytes: Long,
    percentage: Int,
    eta: Long?,
    state: DownloadState,
    onCancel: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    testID: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    /**
     * Format bytes to MB string
     * Returns "< 1 MB" for values less than 1 MB, otherwise "X MB"
     */
    fun formatMB(bytes: Long): String {
        val mb = bytes / (1024.0 * 1024.0)
        return if (mb < 1.0) "< 1 MB" else "${mb.toInt()} MB"
    }

    /**
     * Format ETA seconds to human-readable string
     * Returns "X sec left" for < 60 seconds, "X min left" for >= 60 seconds
     */
    fun formatETA(seconds: Long?): String {
        if (seconds == null || seconds <= 0) return ""
        return if (seconds < 60) {
            "${seconds} sec left"
        } else {
            val mins = (seconds + 59) / 60 // Ceiling division
            "${mins} min left"
        }
    }

    /**
     * Get status text based on download state
     */
    fun statusText(): String {
        return when (state) {
            DownloadState.Complete -> "Download complete"
            DownloadState.Failed -> "Download failed"
            DownloadState.Paused -> "Paused"
            else -> formatETA(eta)
        }
    }

    val baseTestTag = testID ?: "download-progress"

    Column(
        modifier = modifier
            .testTag(baseTestTag)
            .semantics {
                contentDescription = "Download progress for $packName: $percentage%"
            },
        verticalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        // Title row with state and percentage
        Row(
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            androidx.compose.material3.Text(
                text = if (state == DownloadState.Complete) "Complete" else "Downloading...",
                style = theme.type.title.md,
                color = theme.colors.onSurface.default,
                modifier = Modifier.testTag("${baseTestTag}-title"),
            )

            androidx.compose.material3.Text(
                text = "$percentage%",
                style = theme.type.label.md,
                color = theme.colors.primary.default,
                modifier = Modifier.testTag("${baseTestTag}-percentage"),
            )
        }

        // Progress bar with accessibility label
        Progress(
            value = percentage.toFloat(),
            modifier = Modifier.testTag("${baseTestTag}-progress"),
            testID = "${baseTestTag}-progress",
        )

        // Download info row with bytes and status
        Row(
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            androidx.compose.material3.Text(
                text = "${formatMB(bytesDownloaded)} / ${formatMB(totalBytes)}",
                style = theme.type.body.sm,
                color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                modifier = Modifier.testTag("${baseTestTag}-bytes"),
            )

            androidx.compose.material3.Text(
                text = statusText(),
                style = theme.type.body.sm,
                color = theme.colors.onSurface.default.copy(alpha = 0.6f),
                modifier = Modifier.testTag("${baseTestTag}-status"),
            )
        }

        // Cancel button (only during downloading state with callback)
        if (state == DownloadState.Downloading && onCancel != null) {
            Button(
                variant = ButtonVariant.Ghost,
                size = ButtonSize.Sm,
                text = "Cancel Download",
                onPress = onCancel,
                accessibilityLabel = "Cancel Download",
                testID = "${baseTestTag}-cancel",
                modifier = Modifier.testTag("${baseTestTag}-cancel-button"),
            )
        }
    }
}
