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
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens

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
        backgroundColor = GeneratedTokens.color.Surface.card,
        cornerRadius = theme.radius.lg,
        shadowElevation = theme.elevation.light.level2,
        contentPadding = theme.space.lg,
    )

@Composable
fun LSCard(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    val style = resolveLSCardStyle(LocalLaneShadowTheme.current)

    Surface(
        modifier = modifier.semantics {
            isContainer = true
            lsCardBackgroundColor = style.backgroundColor
            lsCardCornerRadius = style.cornerRadius
            lsCardShadowElevation = style.shadowElevation
            lsCardContentPadding = style.contentPadding
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
