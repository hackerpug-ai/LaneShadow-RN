package com.laneshadow.sandbox.stories.molecules

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
import com.laneshadow.ui.molecules.LSChatInput
import com.laneshadow.ui.molecules.LocationContext
import com.laneshadow.ui.molecules.LocationMode
import com.laneshadow.ui.molecules.SuggestionChip
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSChatInputStory {
    val all: List<Story> = listOf(
        Story(
            id = "molecules.chatinput.default",
            tier = ComponentTier.Molecule,
            component = "LSChatInput",
            name = "Default",
            summary = "Chat input in default empty state with sliders icon.",
            content = { DefaultChatInputStory() },
        ),
        Story(
            id = "molecules.chatinput.with-text",
            tier = ComponentTier.Molecule,
            component = "LSChatInput",
            name = "With Text",
            summary = "Chat input with text showing send button.",
            content = { WithTextChatInputStory() },
        ),
        Story(
            id = "molecules.chatinput.thinking",
            tier = ComponentTier.Molecule,
            component = "LSChatInput",
            name = "Thinking",
            summary = "Chat input in thinking state with spinner.",
            content = { ThinkingChatInputStory() },
        ),
        Story(
            id = "molecules.chatinput.disabled",
            tier = ComponentTier.Molecule,
            component = "LSChatInput",
            name = "Disabled",
            summary = "Chat input in disabled state.",
            content = { DisabledChatInputStory() },
        ),
        Story(
            id = "molecules.chatinput.refining-prompt",
            tier = ComponentTier.Molecule,
            component = "LSChatInput",
            name = "Refining Prompt",
            summary = "Chat input with suggestions and location badge.",
            content = { RefiningPromptChatInputStory() },
        ),
    )
}

@Composable
private fun DefaultChatInputStory() {
    LaneShadowTheme {
        StoryColumn {
            var text by remember { mutableStateOf("") }

            LSChatInput(
                value = text,
                onValueChange = { text = it },
                placeholder = "Plan a ride…",
                onSend = {},
                onCollapse = {},
                onFilter = {},
            )
        }
    }
}

@Composable
private fun WithTextChatInputStory() {
    LaneShadowTheme {
        StoryColumn {
            var text by remember { mutableStateOf("Twisty roads near Aptos") }

            LSChatInput(
                value = text,
                onValueChange = { text = it },
                placeholder = "Plan a ride…",
                onSend = {},
                onCollapse = {},
                onFilter = {},
            )
        }
    }
}

@Composable
private fun ThinkingChatInputStory() {
    LaneShadowTheme {
        StoryColumn {
            var text by remember { mutableStateOf("Planning your route...") }

            LSChatInput(
                value = text,
                onValueChange = { text = it },
                placeholder = "Plan a ride…",
                onSend = {},
                onCollapse = {},
                onFilter = {},
                isThinking = true,
            )
        }
    }
}

@Composable
private fun DisabledChatInputStory() {
    LaneShadowTheme {
        StoryColumn {
            var text by remember { mutableStateOf("") }

            LSChatInput(
                value = text,
                onValueChange = { text = it },
                placeholder = "Plan a ride…",
                onSend = {},
                onCollapse = {},
                onFilter = {},
                isEnabled = false,
            )
        }
    }
}

@Composable
private fun RefiningPromptChatInputStory() {
    LaneShadowTheme {
        StoryColumn {
            var text by remember { mutableStateOf("") }
            val suggestions = remember {
                listOf(
                    SuggestionChip("Twisty back roads"),
                    SuggestionChip("Coastal Highway 1"),
                    SuggestionChip("Gravel path"),
                )
            }
            val locationBadge = remember {
                LocationContext(
                    label = "Near Santa Cruz, CA",
                    mode = LocationMode.Manual,
                )
            }

            LSChatInput(
                value = text,
                onValueChange = { text = it },
                placeholder = "Plan a ride…",
                onSend = {},
                onCollapse = {},
                onFilter = {},
                suggestions = suggestions,
                onSuggestionTap = {},
                locationBadge = locationBadge,
            )
        }
    }
}

@Composable
private fun StoryColumn(content: @Composable () -> Unit) {
    Column(
        modifier = Modifier.padding(com.laneshadow.theme.LocalLaneShadowTheme.current.space.lg),
        verticalArrangement = Arrangement.spacedBy(com.laneshadow.theme.LocalLaneShadowTheme.current.space.md),
    ) {
        content()
    }
}
