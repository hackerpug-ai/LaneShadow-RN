package com.laneshadow.ui.components.molecules

import com.laneshadow.ui.atoms.Glyphs

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * ErrorToast molecule component
 *
 * Red-themed toast for error notifications.
 * Displays error title, description, and optional close button.
 * Following React Native wrapper from react-native/components/toasts/error-toast.tsx
 *
 * @param title Error title text
 * @param description Error description text
 * @param showCloseButton Whether to show close button (default: true)
 * @param onClose Callback when close button is clicked
 * @param modifier Modifier for the toast container
 */
@Composable
fun ErrorToast(
    title: String,
    description: String,
    showCloseButton: Boolean = true,
    onClose: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Background color from danger token
    val backgroundColor = theme.colors.danger.default

    // Text/icon color from onPrimary token
    val contentColor = theme.colors.onPrimary.default

    // Build semantics with accessibility description
    val toastModifier = modifier.semantics {
        this.contentDescription = "Error: $title. $description"
    }

    Surface(
        modifier = toastModifier,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.lg),
        color = backgroundColor,
        shadowElevation = theme.elevation.light.level4,
    ) {
        Column(
            modifier = Modifier.padding(theme.space.md),
            verticalArrangement = Arrangement.spacedBy(theme.space.xs),
        ) {
            // Header row: icon + title + close button
            Row(
                modifier = Modifier,
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Icon + title row
                Row(
                    modifier = Modifier.weight(1f),
                    horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    // Error icon
                    Icon(
                        imageVector = Glyphs.Default.Warning,
                        contentDescription = "Error icon",
                        tint = contentColor,
                        modifier = Modifier.size(20.dp),
                    )

                    // Title text
                    Text(
                        text = title,
                        style = theme.type.title.sm,
                        color = contentColor,
                    )
                }

                // Optional close button
                if (showCloseButton) {
                    IconButton(
                        onClick = { onClose?.invoke() },
                        modifier = Modifier.semantics {
                            this.contentDescription = "Close error toast"
                        },
                    ) {
                        Icon(
                            imageVector = Glyphs.Default.Close,
                            contentDescription = "Close",
                            tint = contentColor,
                            modifier = Modifier.size(20.dp),
                        )
                    }
                }
            }

            // Description text
            Text(
                text = description,
                style = theme.type.body.sm,
                color = contentColor,
            )
        }
    }
}
