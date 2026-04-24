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
import androidx.compose.foundation.BorderStroke
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme
val LSCardBackgroundColorKey = SemanticsPropertyKey<Color>("LSCardBackgroundColor")
val LSCardCornerRadiusKey = SemanticsPropertyKey<Dp>("LSCardCornerRadius")
val LSCardShadowElevationKey = SemanticsPropertyKey<Dp>("LSCardShadowElevation")
val LSCardContentPaddingKey = SemanticsPropertyKey<Dp>("LSCardContentPadding")

private var SemanticsPropertyReceiver.lsCardBackgroundColor by LSCardBackgroundColorKey
private var SemanticsPropertyReceiver.lsCardCornerRadius by LSCardCornerRadiusKey
private var SemanticsPropertyReceiver.lsCardShadowElevation by LSCardShadowElevationKey
private var SemanticsPropertyReceiver.lsCardContentPadding by LSCardContentPaddingKey

data class LSCardStyle(
    val backgroundColor: Color,
    val cornerRadius: Dp,
    val shadowElevation: Dp,
    val contentPadding: Dp,
)

fun resolveLSCardStyle(theme: LaneShadowThemeValues): LSCardStyle =
    LSCardStyle(
        backgroundColor = theme.colors.card.default,
        cornerRadius = theme.radius.lg,
        shadowElevation = theme.elevation.light.level2,
        contentPadding = theme.space.lg,
    )

@Composable
fun LSCard(
    modifier: Modifier = Modifier,
    backgroundColor: Color? = null,
    cornerRadius: Dp? = null,
    shadowElevation: Dp? = null,
    contentPadding: Dp? = null,
    border: BorderStroke? = null,
    content: @Composable () -> Unit,
) {
    val defaultStyle = resolveLSCardStyle(LocalLaneShadowTheme.current)
    val resolvedBackgroundColor = backgroundColor ?: defaultStyle.backgroundColor
    val resolvedCornerRadius = cornerRadius ?: defaultStyle.cornerRadius
    val resolvedShadowElevation = shadowElevation ?: defaultStyle.shadowElevation
    val resolvedContentPadding = contentPadding ?: defaultStyle.contentPadding

    Surface(
        modifier = modifier.semantics {
            isContainer = true
            lsCardBackgroundColor = resolvedBackgroundColor
            lsCardCornerRadius = resolvedCornerRadius
            lsCardShadowElevation = resolvedShadowElevation
            lsCardContentPadding = resolvedContentPadding
        },
        color = resolvedBackgroundColor,
        shape = RoundedCornerShape(resolvedCornerRadius),
        shadowElevation = resolvedShadowElevation,
        border = border,
    ) {
        Box(modifier = Modifier.padding(resolvedContentPadding)) {
            content()
        }
    }
}
