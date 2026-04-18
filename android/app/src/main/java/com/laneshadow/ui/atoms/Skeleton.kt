package com.laneshadow.ui.atoms

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemeSkeleton(
    width: Dp,
    height: Dp,
    modifier: Modifier = Modifier,
    shape: SkeletonShape = SkeletonShape.Rounded,
    accessibilityLabel: String? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val transition = rememberInfiniteTransition(label = "theme-skeleton")
    val opacity by transition.animateFloat(
        initialValue = 1f,
        targetValue = 0.3f,
        animationSpec = infiniteRepeatable(animation = tween(750), repeatMode = RepeatMode.Reverse),
        label = "theme-skeleton-opacity",
    )

    Box(
        modifier =
            modifier
                .width(width)
                .height(height)
                .alpha(opacity)
                .background(
                    color = theme.colors.muted.default,
                    shape = skeletonShape(shape = shape, cornerRadius = theme.radius.md),
                )
                .then(
                    if (accessibilityLabel != null) {
                        Modifier.semantics { contentDescription = accessibilityLabel }
                    } else {
                        Modifier
                    },
                ),
    )
}

@Composable
fun Skeleton(
    width: Dp,
    height: Dp,
    modifier: Modifier = Modifier,
    shape: SkeletonShape = SkeletonShape.Rounded,
    accessibilityLabel: String? = null,
) = ThemeSkeleton(
    width = width,
    height = height,
    modifier = modifier,
    shape = shape,
    accessibilityLabel = accessibilityLabel,
)

@Composable
fun SkeletonAvatar(
    modifier: Modifier = Modifier,
    size: AvatarSize = AvatarSize.Sm,
) {
    val dimension = avatarDimension(size)
    ThemeSkeleton(
        width = dimension,
        height = dimension,
        modifier = modifier,
        shape = SkeletonShape.Circle,
        accessibilityLabel = "Skeleton avatar",
    )
}

@Composable
fun SkeletonText(
    modifier: Modifier = Modifier,
    lines: Int = 1,
    lineWidth: Dp = 160.dp,
) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(theme.space.sm),
    ) {
        repeat(lines) { index ->
            ThemeSkeleton(
                width = if (index == lines - 1 && lines > 1) lineWidth * 0.75f else lineWidth,
                height = 16.dp,
                shape = SkeletonShape.Text,
                accessibilityLabel = "Skeleton text line ${index + 1}",
            )
        }
    }
}

enum class SkeletonShape {
    Rect,
    Circle,
    Rounded,
    Text,
}

internal fun skeletonShape(shape: SkeletonShape, cornerRadius: Dp): Shape =
    when (shape) {
        SkeletonShape.Circle -> CircleShape
        SkeletonShape.Rect -> RoundedCornerShape(0.dp)
        SkeletonShape.Rounded,
        SkeletonShape.Text,
            -> RoundedCornerShape(cornerRadius)
    }
