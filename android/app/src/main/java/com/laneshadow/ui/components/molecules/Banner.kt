package com.laneshadow.ui.components.molecules

import com.laneshadow.ui.atoms.Glyphs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Banner variant types
 *
 * Following RN wrapper API from react-native/components/ui/banner.tsx
 */
enum class BannerVariant {
    Info,
    Success,
    Warning,
    Error,
}

/**
 * Banner molecule component
 *
 * Informational banner with optional icon, message, and action button.
 * Following React Native wrapper patterns from react-native/components/ui/banner.tsx
 *
 * @param message Banner message text
 * @param icon Optional left icon composable
 * @param action Optional action button composable on right
 * @param variant Color variant (Info, Success, Warning, Error)
 * @param dismissible Whether to show close button
 * @param onDismiss Callback when dismiss button is clicked
 * @param modifier Modifier for the banner container
 * @param contentDescription Accessibility description for screen readers
 */
@Composable
fun Banner(
    message: String,
    icon: @Composable (() -> Unit)? = null,
    action: @Composable (() -> Unit)? = null,
    variant: BannerVariant = BannerVariant.Info,
    dismissible: Boolean = false,
    onDismiss: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    contentDescription: String? = null,
) {
    val theme = LocalLaneShadowTheme.current

    // Get variant color
    val variantColor: Color = when (variant) {
        BannerVariant.Info -> theme.colors.info.default
        BannerVariant.Success -> theme.colors.success.default
        BannerVariant.Warning -> theme.colors.warning.default
        BannerVariant.Error -> theme.colors.danger.default
    }

    // Background color with low alpha (0.1f = 10% opacity)
    val backgroundColor = variantColor.copy(alpha = 0.1f)

    // Border color with medium alpha (0.3f = 30% opacity)
    val borderColor = variantColor.copy(alpha = 0.3f)

    // Text color from theme
    val textColor = theme.colors.onSurface.default

    // Build semantics
    val bannerModifier = modifier.semantics {
        this.contentDescription = contentDescription ?: message
    }

    Surface(
        modifier = bannerModifier,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(theme.radius.md),
        color = backgroundColor,
        border = BorderStroke(1.dp, borderColor),
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Optional left icon
            if (icon != null) {
                Row(
                    modifier = Modifier,
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    icon()
                }
            }

            // Message text (takes remaining space)
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.Start,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = message,
                    style = androidx.compose.ui.text.TextStyle(
                        fontSize = 14.sp,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Normal,
                    ),
                    color = textColor,
                )
            }

            // Optional action button
            if (action != null) {
                Row(
                    modifier = Modifier,
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    action()
                }
            }

            // Dismiss button (if dismissible)
            if (dismissible) {
                IconButton(
                    onClick = { onDismiss?.invoke() },
                    modifier = Modifier.size(24.dp),
                ) {
                    Icon(
                        imageVector = Glyphs.Default.Close,
                        contentDescription = "Dismiss",
                        tint = textColor,
                    )
                }
            }
        }
    }
}
