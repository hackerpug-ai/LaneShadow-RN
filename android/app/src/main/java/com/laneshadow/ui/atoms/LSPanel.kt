package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.SemanticsPropertyKey
import androidx.compose.ui.semantics.SemanticsPropertyReceiver
import androidx.compose.ui.semantics.isContainer
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
val LSPanelBackgroundColorKey = SemanticsPropertyKey<Color>("LSPanelBackgroundColor")
val LSPanelCornerRadiusKey = SemanticsPropertyKey<Dp>("LSPanelCornerRadius")
val LSPanelShadowElevationKey = SemanticsPropertyKey<Dp>("LSPanelShadowElevation")
val LSPanelContentPaddingKey = SemanticsPropertyKey<Dp>("LSPanelContentPadding")

private var SemanticsPropertyReceiver.lsPanelBackgroundColor by LSPanelBackgroundColorKey
private var SemanticsPropertyReceiver.lsPanelCornerRadius by LSPanelCornerRadiusKey
private var SemanticsPropertyReceiver.lsPanelShadowElevation by LSPanelShadowElevationKey
private var SemanticsPropertyReceiver.lsPanelContentPadding by LSPanelContentPaddingKey

data class LSPanelStyle(
    val backgroundColor: Color,
    val cornerRadius: Dp,
    val shadowElevation: Dp,
    val contentPadding: Dp,
)

fun resolveLSPanelStyle(theme: LaneShadowThemeValues): LSPanelStyle =
    LSPanelStyle(
        backgroundColor = theme.colors.surface.default,
        cornerRadius = theme.radius.md,
        shadowElevation = theme.elevation.light.level0,
        contentPadding = theme.space.md,
    )

@Composable
fun LSPanel(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val style = resolveLSPanelStyle(LocalLaneShadowTheme.current)

    Surface(
        modifier = modifier.semantics {
            isContainer = true
            lsPanelBackgroundColor = style.backgroundColor
            lsPanelCornerRadius = style.cornerRadius
            lsPanelShadowElevation = style.shadowElevation
            lsPanelContentPadding = style.contentPadding
        },
        color = style.backgroundColor,
        shape = RoundedCornerShape(style.cornerRadius),
        shadowElevation = style.shadowElevation,
    ) {
        Box(modifier = Modifier.padding(style.contentPadding)) {
            content()
        }
    }
}
