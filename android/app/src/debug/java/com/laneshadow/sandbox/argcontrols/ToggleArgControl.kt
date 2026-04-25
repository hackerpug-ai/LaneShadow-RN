package com.laneshadow.sandbox.argcontrols

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Toggle control for story args.
 *
 * AC-3: Standard argType controls render
 * GIVEN: Story declares argTypes of toggle
 * WHEN: Developer views the inspector pane
 * THEN: They see a Switch for toggle input
 */
@Composable
fun ToggleArgControl(
    label: String,
    value: Boolean,
    onValueChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
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
        Switch(
            checked = value,
            onCheckedChange = onValueChange,
        )
    }
}
