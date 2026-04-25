package com.laneshadow.sandbox.argcontrols

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
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme

/**
 * Text input control for story args.
 *
 * AC-3: Standard argType controls render
 * GIVEN: Story declares argTypes of text
 * WHEN: Developer views the inspector pane
 * THEN: They see a TextField for text input
 */
@Composable
fun TextArgControl(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val theme = LocalLaneShadowTheme.current

    Column(modifier = modifier.padding(vertical = theme.space.sm)) {
        Text(
            text = label,
            style = theme.type.label.sm,
            color = theme.colors.onSurface.default.copy(alpha = 0.72f),
            modifier = Modifier.padding(bottom = theme.space.xs),
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
        )
    }
}
