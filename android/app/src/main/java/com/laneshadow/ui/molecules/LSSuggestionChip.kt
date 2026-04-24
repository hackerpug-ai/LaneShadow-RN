package com.laneshadow.ui.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize

internal val SuggestionChipPillSize: PillSize = PillSize.Md

@Composable
fun LSSuggestionChip(
    label: String,
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
    primed: Boolean = false,
    leadingIcon: IconName? = null,
) {
    val theme = LocalLaneShadowTheme.current
    val style = resolveSuggestionChipStyle(primed = primed)
    val shape = RoundedCornerShape(theme.radius.full)

    LSPill(
        size = SuggestionChipPillSize,
        modifier = modifier
            .background(style.backgroundColor, shape)
            .border(1.dp, style.borderColor, shape)
            .semantics {
                role = Role.Button
                contentDescription = label
            }
            .clickable(onClick = onTap),
    ) {
        if (leadingIcon != null) {
            LSIcon(
                name = leadingIcon,
                size = IconSize.Xs,
                color = IconColor.Signal,
            )
        }
        LSText(
            text = label,
            variant = style.labelVariant,
            color = style.labelColor,
        )
    }
}
