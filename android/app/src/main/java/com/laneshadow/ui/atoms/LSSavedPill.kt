package com.laneshadow.ui.atoms

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens

/**
 * LSSavedPill — A small "Saved" pill atom for RouteDetails V01 saved-state.
 *
 * Renders "Saved" text with glass background + copper/signal accent border.
 * Designed to be displayed beside LSBestBadge.
 *
 * @param modifier Modifier for the pill
 */
@Composable
fun LSSavedPill(
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    LSText(
        text = "Saved",
        variant = TypographyVariant.Ui.Label.Sm,
        color = ContentColor.Signal,
        modifier = modifier
            .background(
                color = theme.colors.surface.default.copy(alpha = 0.5f),
                shape = RoundedCornerShape(theme.radius.sm),
            )
            .border(
                width = GeneratedTokens.sizing.stroke.sm,
                color = theme.colors.primary.default,
                shape = RoundedCornerShape(theme.radius.sm),
            )
            .padding(
                horizontal = theme.space.sm,
                vertical = theme.space.xs,
            ),
    )
}
