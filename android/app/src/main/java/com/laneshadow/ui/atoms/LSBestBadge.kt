package com.laneshadow.ui.atoms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens

private const val BestBadgeLabel = "BEST FOR TODAY"

@Composable
fun LSBestBadge(modifier: Modifier = Modifier) {
    val theme = LocalLaneShadowTheme.current

    LSPill(
        size = PillSize.Sm,
        modifier = modifier.badgeSurface(
            theme = theme,
            backgroundColor = GeneratedTokens.color.Signal.default,
            foregroundColor = theme.content.onSignal,
        ),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = theme.space.xs),
            horizontalArrangement = Arrangement.spacedBy(theme.space.xs),
        ) {
            LSIcon(
                name = IconName.StarFill,
                size = IconSize.Xs,
                color = IconColor.Signal,
            )

            Text(
                text = BestBadgeLabel,
                style = TypographyVariant.Ui.Label.Sm.resolveTextStyle(theme),
                color = theme.content.onSignal,
            )
        }
    }
}
