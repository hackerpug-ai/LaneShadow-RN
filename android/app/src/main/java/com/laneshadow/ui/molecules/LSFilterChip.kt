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
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize

@Composable
fun LSFilterChip(
    label: String,
    selected: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    size: PillSize = PillSize.Md,
) {
    val theme = LocalLaneShadowTheme.current
    val style = resolveFilterChipStyle(selected = selected)
    val shape = RoundedCornerShape(theme.radius.full)

    LSPill(
        size = size,
        modifier = modifier
            .background(style.backgroundColor, shape)
            .border(1.dp, style.borderColor, shape)
            .semantics {
                role = Role.Button
                this.selected = selected
                contentDescription = label
            }
            .clickable(enabled = enabled, onClick = onToggle),
    ) {
        LSText(
            text = label,
            variant = style.labelVariant,
            color = style.labelColor,
        )
    }
}
