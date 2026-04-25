package com.laneshadow.sandbox.argcontrols

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.theme.generated.LaneShadowTheme.IconName

/**
 * Number stepper control for story args.
 *
 * AC-3: Standard argType controls render
 * GIVEN: Story declares argTypes of number
 * WHEN: Developer views the inspector pane
 * THEN: They see a stepper for number input
 */
@Composable
fun NumberArgControl(
    label: String,
    value: Int,
    onValueChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    min: Int = Int.MIN_VALUE,
    max: Int = Int.MAX_VALUE,
) {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = modifier.padding(vertical = theme.space.sm).fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = label,
            style = theme.type.body.md,
            color = theme.colors.onSurface.default,
            modifier = Modifier.weight(1f),
        )
        IconButton(
            onClick = { if (value > min) onValueChange(value - 1) },
            enabled = value > min,
        ) {
            LSIcon(name = IconName.ChevL, contentDescription = "Decrease")
        }
        Text(
            text = value.toString(),
            style = theme.type.body.md,
            color = theme.colors.onSurface.default,
            modifier = Modifier.padding(horizontal = theme.space.md),
        )
        IconButton(
            onClick = { if (value < max) onValueChange(value + 1) },
            enabled = value < max,
        ) {
            LSIcon(name = IconName.ChevR, contentDescription = "Increase")
        }
    }
}
