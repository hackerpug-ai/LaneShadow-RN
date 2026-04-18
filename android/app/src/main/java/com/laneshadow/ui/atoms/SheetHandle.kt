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
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun SheetHandle(
    modifier: Modifier = Modifier,
    expanded: Boolean = false,
) {
    val theme = LocalLaneShadowTheme.current
    val animatedWidth by animateDpAsState(
        targetValue = if (expanded) theme.space.xxxxl else theme.space.xxxl,
        animationSpec = spring(),
        label = "sheetHandleWidth",
    )

    Box(
        modifier =
            modifier
                .width(animatedWidth)
                .height(theme.space.xs)
                .background(
                    color = if (expanded) theme.colors.onSurface.default else theme.colors.muted.default,
                    shape = RoundedCornerShape(theme.radius.full),
                )
                .semantics { contentDescription = "SheetHandle" },
    )
}
