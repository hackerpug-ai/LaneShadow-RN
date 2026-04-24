package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize

@Composable
fun LSTagPill(
    label: String,
    icon: IconName? = IconName.Pin,
    accent: AccentColor = AccentColor.Muted,
    size: PillSize = PillSize.Sm,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val style = resolveTagPillStyle(accent)

    LSPill(
        size = size,
        modifier = modifier.tagPillSurface(style = style, cornerRadius = theme.radius.full),
    ) {
        if (icon != null) {
            LSIcon(
                name = icon,
                size = IconSize.Xs,
                color = style.iconColor,
            )
        }
        LSText(
            text = label,
            variant = style.labelVariant,
            color = style.labelColor,
        )
    }
}

private fun Modifier.tagPillSurface(
    style: TagPillStyle,
    cornerRadius: androidx.compose.ui.unit.Dp,
): Modifier {
    val shape = RoundedCornerShape(cornerRadius)
    return this
        .background(style.backgroundColor, shape)
        .border(1.dp, style.borderColor, shape)
}
