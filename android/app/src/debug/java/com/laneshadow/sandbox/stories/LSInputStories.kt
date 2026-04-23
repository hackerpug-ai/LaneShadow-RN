package com.laneshadow.sandbox.stories

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.InputState
import com.laneshadow.ui.atoms.LSTextArea
import com.laneshadow.ui.atoms.LSTextField
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSInputStories {
    val all: List<Story> = listOf(
        inputStory(
            id = "atoms.textfield.default",
            component = "LSTextField",
            name = "Default",
            summary = "Single-line input in the default subtle-border state.",
            state = InputState.Default,
            multiline = false,
            initialValue = "",
            placeholder = "Enter destination",
        ),
        inputStory(
            id = "atoms.textfield.focused",
            component = "LSTextField",
            name = "Focused",
            summary = "Single-line input with the focused border token.",
            state = InputState.Focused,
            multiline = false,
            initialValue = "Marin Headlands",
            placeholder = "Enter destination",
        ),
        inputStory(
            id = "atoms.textfield.error",
            component = "LSTextField",
            name = "Error",
            summary = "Single-line input using the danger border token.",
            state = InputState.Error,
            multiline = false,
            initialValue = "???",
            placeholder = "Enter destination",
        ),
        inputStory(
            id = "atoms.textfield.disabled",
            component = "LSTextField",
            name = "Disabled",
            summary = "Single-line input rendered in a non-interactive state.",
            state = InputState.Disabled,
            multiline = false,
            initialValue = "Set automatically",
            placeholder = "Enter destination",
        ),
        inputStory(
            id = "atoms.textarea.default",
            component = "LSTextArea",
            name = "Default",
            summary = "Multi-line input in the default subtle-border state.",
            state = InputState.Default,
            multiline = true,
            initialValue = "",
            placeholder = "Add ride notes",
        ),
        inputStory(
            id = "atoms.textarea.focused",
            component = "LSTextArea",
            name = "Focused",
            summary = "Multi-line input with the focused border token.",
            state = InputState.Focused,
            multiline = true,
            initialValue = "Scenic route via the ridge road.",
            placeholder = "Add ride notes",
        ),
        inputStory(
            id = "atoms.textarea.error",
            component = "LSTextArea",
            name = "Error",
            summary = "Multi-line input using the danger border token.",
            state = InputState.Error,
            multiline = true,
            initialValue = "Need a clearer meeting point.",
            placeholder = "Add ride notes",
        ),
        inputStory(
            id = "atoms.textarea.disabled",
            component = "LSTextArea",
            name = "Disabled",
            summary = "Multi-line input rendered in a non-interactive state.",
            state = InputState.Disabled,
            multiline = true,
            initialValue = "Navigator will generate a route summary.",
            placeholder = "Add ride notes",
        ),
    )
}

private fun inputStory(
    id: String,
    component: String,
    name: String,
    summary: String,
    state: InputState,
    multiline: Boolean,
    initialValue: String,
    placeholder: String,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Atom,
        component = component,
        name = name,
        summary = summary,
        content = {
            LaneShadowTheme {
                var text by remember { mutableStateOf(initialValue) }
                InputStoryColumn {
                    if (multiline) {
                        LSTextArea(
                            value = text,
                            onValueChange = { text = it },
                            state = state,
                            placeholder = placeholder,
                            maxRows = 6,
                        )
                    } else {
                        LSTextField(
                            value = text,
                            onValueChange = { text = it },
                            state = state,
                            placeholder = placeholder,
                        )
                    }
                }
            }
        },
    )

@Composable
private fun InputStoryColumn(content: @Composable () -> Unit) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier.padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        content()
    }
}
