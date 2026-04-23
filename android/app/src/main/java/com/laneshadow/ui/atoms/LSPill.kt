package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import com.laneshadow.theme.LocalLaneShadowTheme

val LSPillCornerRadiusKey = SemanticsPropertyKey<Dp>("LSPillCornerRadius")
val LSPillHorizontalPaddingKey = SemanticsPropertyKey<Dp>("LSPillHorizontalPadding")
val LSPillVerticalPaddingKey = SemanticsPropertyKey<Dp>("LSPillVerticalPadding")

private var SemanticsPropertyReceiver.lsPillCornerRadius by LSPillCornerRadiusKey
private var SemanticsPropertyReceiver.lsPillHorizontalPadding by LSPillHorizontalPaddingKey
private var SemanticsPropertyReceiver.lsPillVerticalPadding by LSPillVerticalPaddingKey

@Composable
fun LSPill(
    size: PillSize,
    padding: PaddingValues? = null,
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val resolvedHeight = size.resolveHeight(theme)
    val resolvedPadding = padding ?: size.resolveDefaultPadding(theme)
    val pillRadius = theme.radius.full

    Row(
        modifier = modifier
            .height(resolvedHeight)
            .clip(RoundedCornerShape(pillRadius))
            .semantics {
                lsPillCornerRadius = pillRadius
                lsPillHorizontalPadding = resolvedPadding.calculateLeftPadding(LayoutDirection.Ltr)
                lsPillVerticalPadding = resolvedPadding.calculateTopPadding()
            }
            .padding(resolvedPadding),
        horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
        verticalAlignment = Alignment.CenterVertically,
        content = content,
    )
}
