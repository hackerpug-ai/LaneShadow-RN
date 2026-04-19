package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Badge variant types
 *
 * Following RN wrapper API from react-native/components/ui/badge.tsx
 */
enum class BadgeVariant {
    Default,
    Secondary,
    Destructive,
    Outline,
    Success,
    Warning,
    Info,
}

/**
 * Badge component props
 *
 * Following RN wrapper API from react-native/components/ui/badge.tsx
 *
 * @param variant Badge color variant (default, secondary, destructive, outline, success, warning, info)
 * @param text Text content to display
 * @param icon Optional icon composable to display before text
 * @param opacity Opacity value for semi-transparent backgrounds (default: 1.0)
 * @param modifier Modifier for the container
 */
@Composable
fun Badge(
    variant: BadgeVariant = BadgeVariant.Default,
    text: String,
    icon: @Composable (() -> Unit)? = null,
    opacity: Float = 1.0f,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Get background color based on variant
    val backgroundColor: Color = when (variant) {
        BadgeVariant.Secondary -> theme.colors.secondary.default
        BadgeVariant.Destructive -> theme.colors.danger.default
        BadgeVariant.Success -> theme.colors.success.default
        BadgeVariant.Warning -> theme.colors.warning.default
        BadgeVariant.Info -> theme.colors.info.default
        BadgeVariant.Outline -> Color.Transparent
        BadgeVariant.Default -> theme.colors.primary.default
    }

    // Get text color based on variant
    val textColor: Color = when (variant) {
        BadgeVariant.Secondary -> theme.colors.onSecondary.default
        BadgeVariant.Outline -> theme.colors.onSurface.default
        else -> theme.colors.onPrimary.default
    }

    // Get border style for outline variant
    val border: BorderStroke? = when (variant) {
        BadgeVariant.Outline -> BorderStroke(
            width = 1.dp,
            color = theme.colors.border.default
        )
        else -> null
    }

    Surface(
        modifier = modifier.alpha(opacity),
        shape = androidx.compose.foundation.shape.CircleShape,
        color = backgroundColor,
        border = border,
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 10.dp, vertical = 2.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (icon != null) {
                Row(
                    modifier = Modifier.padding(end = theme.space.xs),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    icon()
                }
            }
            Text(
                text = text,
                style = theme.type.label.sm,
                color = textColor,
            )
        }
    }
}
