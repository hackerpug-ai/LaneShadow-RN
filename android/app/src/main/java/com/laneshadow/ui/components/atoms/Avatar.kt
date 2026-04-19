package com.laneshadow.ui.components.atoms

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalInspectionMode
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Avatar size variants
 *
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 */
enum class AvatarSize {
    Default,  // 40×40px
    Large,    // 64×64px (lg)
    ExtraLarge, // 96×96px (xl)
}

/**
 * Avatar badge variant
 *
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 */
enum class AvatarBadgeVariant {
    Default,
    Success,
    Warning,
    Danger,
}

/**
 * Avatar component props
 *
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 *
 * @param size Size variant (default, lg, xl)
 * @param source Image source URL (optional)
 * @param initials Fallback text when no image (optional)
 * @param alt Accessibility label (optional)
 * @param showBorder Show border around avatar (default: false)
 * @param showRing Show primary color ring around avatar (default: false)
 * @param badge Optional badge component to display
 * @param modifier Modifier for the container
 */
@Composable
fun Avatar(
    size: AvatarSize = AvatarSize.Default,
    source: String? = null,
    initials: String? = null,
    alt: String? = null,
    showBorder: Boolean = false,
    showRing: Boolean = false,
    badge: @Composable (() -> Unit)? = null,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    // Get avatar dimensions based on size
    val avatarSize: Dp = when (size) {
        AvatarSize.Default -> 40.dp
        AvatarSize.Large -> 64.dp
        AvatarSize.ExtraLarge -> 96.dp
    }

    // Get initials font size based on avatar size
    val initialsFontSize = when (size) {
        AvatarSize.Default -> 16.sp
        AvatarSize.Large -> 24.sp
        AvatarSize.ExtraLarge -> 36.sp
    }

    // Determine border color and width
    val borderColor = when {
        showRing -> theme.colors.primary.default
        showBorder -> theme.colors.border.default
        else -> Color.Transparent
    }
    val borderWidth = if (showBorder || showRing) 2.dp else 0.dp

    // Container with badge support
    Box(
        modifier = modifier,
    ) {
        Surface(
            modifier = Modifier
                .size(avatarSize)
                .clip(CircleShape),
            shape = CircleShape,
            color = theme.colors.muted.default,
            border = if (borderWidth > 0.dp) {
                BorderStroke(borderWidth, borderColor)
            } else null,
        ) {
            Box(
                contentAlignment = Alignment.Center,
            ) {
                if (source != null) {
                    // TODO: Add AsyncImage support when Coil dependency is added
                    // For now, show initials as fallback
                    if (initials != null) {
                        Text(
                            text = initials,
                            style = theme.type.body.sm,
                            fontSize = initialsFontSize,
                            color = theme.colors.onSurface.default,
                        )
                    }
                } else if (initials != null) {
                    Text(
                        text = initials,
                        style = theme.type.body.sm,
                        fontSize = initialsFontSize,
                        color = theme.colors.onSurface.default,
                    )
                }
            }
        }

        // Badge positioning: absolute at top-right (-4, -4) offset
        if (badge != null) {
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .padding(0.dp), // No padding to allow exact positioning
                contentAlignment = Alignment.TopEnd
            ) {
                Box(
                    modifier = Modifier
                        .offset(x = (-4).dp, y = (-4).dp)
                ) {
                    badge()
                }
            }
        }
    }
}

/**
 * Avatar Badge Component
 *
 * For status indicators on avatars
 * Following RN wrapper API from react-native/components/ui/avatar.tsx
 *
 * @param variant Badge color variant (default, success, warning, danger)
 * @param modifier Modifier for the badge
 * @param content Optional content to display inside badge
 */
@Composable
fun AvatarBadge(
    variant: AvatarBadgeVariant = AvatarBadgeVariant.Default,
    modifier: Modifier = Modifier,
    content: @Composable (() -> Unit)? = null,
) {
    val theme = LocalLaneShadowTheme.current

    val backgroundColor = when (variant) {
        AvatarBadgeVariant.Default -> theme.colors.primary.default
        AvatarBadgeVariant.Success -> theme.colors.success.default
        AvatarBadgeVariant.Warning -> theme.colors.warning.default
        AvatarBadgeVariant.Danger -> theme.colors.danger.default
    }

    Surface(
        modifier = modifier
            .widthIn(min = 20.dp)
            .heightIn(min = 20.dp)
            .padding(horizontal = 4.dp, vertical = 2.dp),
        shape = CircleShape,
        color = backgroundColor,
    ) {
        Box(
            contentAlignment = Alignment.Center,
        ) {
            if (content != null) {
                content()
            }
        }
    }
}
