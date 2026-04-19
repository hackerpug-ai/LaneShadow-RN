package com.laneshadow.ui.components.molecules

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.components.atoms.ThemedText

/**
 * AppHeader title variants
 *
 * Defines typography variants for the header title.
 */
enum class AppHeaderTitleVariant {
    Default,
    Large,
}

/**
 * AppHeader molecule component
 *
 * Application header bar with title and optional actions.
 * Following React Native wrapper patterns from react-native/components/ui/app-header.tsx
 *
 * @param title Header title text
 * @param subtitle Optional subtitle text
 * @param leadingIcon Left icon composable (back, menu, etc.)
 * @param trailingActions Right action buttons composable
 * @param elevated Whether to show shadow elevation
 * @param onLeadingClick Callback for leading icon click
 * @param modifier Modifier for the header container
 * @param titleVariant Typography variant for title (Default or Large)
 */
@Composable
fun AppHeader(
    title: String,
    subtitle: String? = null,
    leadingIcon: @Composable (() -> Unit)? = null,
    trailingActions: @Composable (RowScope.() -> Unit)? = null,
    elevated: Boolean = false,
    onLeadingClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    titleVariant: AppHeaderTitleVariant = AppHeaderTitleVariant.Default,
) {
    val theme = LocalLaneShadowTheme.current

    // Container configuration
    val headerHeight = 56.dp
    val horizontalPadding = theme.space.lg
    val verticalPadding = 12.dp

    // Elevation shadow (2dp when elevated)
    val elevation = if (elevated) 2.dp else 0.dp

    // Build modifier
    val headerModifier = modifier
        .shadow(
            elevation = elevation,
            shape = RectangleShape,
        )

    Surface(
        modifier = headerModifier,
        color = theme.colors.surface.default,
        tonalElevation = if (elevated) 2.dp else 0.dp,
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = horizontalPadding, vertical = verticalPadding),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            // Leading icon section
            if (leadingIcon != null) {
                val leadingModifier = Modifier.then(
                    if (onLeadingClick != null) {
                        Modifier.clickable(onClick = onLeadingClick)
                    } else {
                        Modifier
                    }
                )
                Box(
                    modifier = leadingModifier,
                    contentAlignment = Alignment.Center,
                ) {
                    leadingIcon()
                }
            } else {
                // Spacer for alignment when no leading icon
                Box(modifier = Modifier.size(24.dp))
            }

            // Title and subtitle section (center)
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = if (leadingIcon == null && trailingActions == null) {
                    Arrangement.Center
                } else {
                    Arrangement.Start
                },
                verticalAlignment = Alignment.CenterVertically,
            ) {
                if (subtitle != null) {
                    // Title + subtitle layout
                    Row(
                        horizontalArrangement = Arrangement.Start,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        // Title
                        ThemedText(
                            text = title,
                            modifier = Modifier,
                        )

                        // Subtitle
                        ThemedText(
                            text = " • $subtitle",
                            color = theme.colors.onSurface.default.copy(alpha = 0.7f),
                            modifier = Modifier,
                        )
                    }
                } else {
                    // Title only
                    ThemedText(
                        text = title,
                        modifier = Modifier,
                    )
                }
            }

            // Trailing actions section
            if (trailingActions != null) {
                Row(
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically,
                    content = trailingActions,
                )
            } else {
                // Spacer for alignment when no trailing actions
                Box(modifier = Modifier.size(24.dp))
            }
        }
    }
}
