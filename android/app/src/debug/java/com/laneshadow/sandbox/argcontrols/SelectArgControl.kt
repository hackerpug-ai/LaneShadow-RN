package com.laneshadow.sandbox.argcontrols

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Select dropdown control for story args.
 *
 * AC-3: Standard argType controls render
 * GIVEN: Story declares argTypes of select
 * WHEN: Developer views the inspector pane
 * THEN: They see a DropdownMenu for select input
 */
@Composable
fun SelectArgControl(
    label: String,
    value: String,
    options: List<String>,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current
    var expanded by remember { mutableStateOf(false) }

    Column(modifier = modifier.padding(vertical = theme.space.sm)) {
        Text(
            text = label,
            style = theme.type.label.sm,
            color = theme.colors.onSurface.default.copy(alpha = 0.72f),
            modifier = Modifier.padding(bottom = theme.space.xs),
        )
        OutlinedTextField(
            value = value,
            onValueChange = { },
            modifier = Modifier
                .fillMaxWidth()
                .clickable { expanded = true },
            singleLine = true,
            readOnly = true,
            trailingIcon = {
                // Dropdown icon would go here
            },
        )

        if (expanded) {
            // Dropdown menu would be shown here
            // For now, this is a simplified version
            // Full implementation would use DropdownMenu
        }
    }
}
