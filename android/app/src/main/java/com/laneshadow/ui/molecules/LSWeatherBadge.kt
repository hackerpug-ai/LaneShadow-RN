package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize
import com.laneshadow.ui.atoms.asTextColor

@Composable
fun LSWeatherBadge(
    condition: WeatherCondition,
    label: String,
    size: PillSize = PillSize.Md,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    val style = condition.resolveWeatherBadgeStyle()
    val shape = RoundedCornerShape(theme.radius.full)

    LSPill(
        size = size,
        modifier = modifier
            .background(style.backgroundColor, shape)
            .border(1.dp, style.borderColor, shape),
    ) {
        LSIcon(
            name = style.leadingIcon,
            size = if (size == PillSize.Sm) IconSize.Xs else IconSize.Sm,
            color = style.iconColor,
        )
        LSText(
            text = label,
            variant = style.labelVariant,
            color = style.iconColor.asTextColor(),
        )
    }
}
