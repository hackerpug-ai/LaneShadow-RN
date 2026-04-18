package com.laneshadow.ui.atoms

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun DragHandle(
    modifier: Modifier = Modifier,
    active: Boolean = false,
    width: Dp? = null,
    height: Dp? = null,
    borderRadius: Dp? = null,
    color: Color? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val animatedWidth by animateDpAsState(
        targetValue = width ?: if (active) theme.space.xxxl else theme.space.xxl,
        animationSpec = spring(),
        label = "dragHandleWidth",
    )
    val resolvedHeight = height ?: theme.space.xs
    val resolvedRadius = borderRadius ?: (resolvedHeight / 2)

    Box(
        modifier =
            modifier
                .width(animatedWidth)
                .height(resolvedHeight)
                .background(
                    color = color ?: if (active) theme.colors.primary.default else theme.colors.divider.default,
                    shape = RoundedCornerShape(resolvedRadius),
                )
                .semantics { contentDescription = "DragHandle" },
    )
}
