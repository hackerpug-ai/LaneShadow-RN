package com.laneshadow.sandbox.stories.molecules

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.laneshadow.ui.molecules.LSModal
import com.laneshadow.ui.molecules.ModalAction
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSModalStory {
    val all: List<Story> = listOf(
        story(
            id = "molecules.modal.default",
            name = "Default",
            summary = "Centered confirmation modal with primary and ghost actions.",
        ) { dismiss ->
            LSModal(
                title = "Save this route?",
                body = "Keep this draft in your ride library so you can refine it later.",
                primary = ModalAction.Primary("Save") { dismiss() },
                secondary = ModalAction.Ghost("Cancel") { dismiss() },
                onDismiss = dismiss,
            )
        },
        story(
            id = "molecules.modal.destructive",
            name = "Destructive Actions",
            summary = "Destructive confirmation modal with explicit cancel flow.",
        ) { dismiss ->
            LSModal(
                title = "Delete ride?",
                body = "This removes the saved draft from your device and cannot be undone.",
                primary = ModalAction.Destructive("Delete") { dismiss() },
                secondary = ModalAction.Ghost("Cancel") { dismiss() },
                onDismiss = dismiss,
            )
        },
    )

    private fun story(
        id: String,
        name: String,
        summary: String,
        content: @Composable (dismiss: () -> Unit) -> Unit,
    ): Story =
        Story(
            id = id,
            tier = ComponentTier.Molecule,
            component = "LSModal",
            name = name,
            summary = summary,
            content = {
                MoleculeStoryFrame {
                    ModalStoryContent(content)
                }
            },
        )
}

@Composable
private fun ModalStoryContent(
    content: @Composable (dismiss: () -> Unit) -> Unit,
) {
    var visible by remember { mutableStateOf(true) }

    if (visible) {
        content { visible = false }
    }
}
