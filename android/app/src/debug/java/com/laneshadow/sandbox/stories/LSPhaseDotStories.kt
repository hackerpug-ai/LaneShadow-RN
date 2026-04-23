package com.laneshadow.sandbox.stories

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.LSPhaseDot
import com.laneshadow.ui.atoms.PhaseDotState
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSPhaseDotStories {
    val all: List<Story> = listOf(
        phaseDotStory(
            id = "atoms.phaseDot.pending",
            name = "Pending",
            summary = "Pending ride phase with hollow border-strong treatment.",
            state = PhaseDotState.Pending,
        ),
        phaseDotStory(
            id = "atoms.phaseDot.active",
            name = "Active",
            summary = "Active ride phase with signal fill and pulse ring.",
            state = PhaseDotState.Active,
        ),
        phaseDotStory(
            id = "atoms.phaseDot.done",
            name = "Done",
            summary = "Done ride phase with success fill and no pulse.",
            state = PhaseDotState.Done,
        ),
    )
}

private fun phaseDotStory(
    id: String,
    name: String,
    summary: String,
    state: PhaseDotState,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Atom,
        component = "LSPhaseDot",
        name = name,
        summary = summary,
        content = {
            PhaseDotStoryFrame {
                LSPhaseDot(state = state)
            }
        },
    )

@Composable
private fun PhaseDotStoryFrame(content: @Composable () -> Unit) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier.padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        content()
    }
}
