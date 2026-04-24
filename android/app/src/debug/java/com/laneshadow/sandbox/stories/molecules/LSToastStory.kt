package com.laneshadow.sandbox.stories.molecules

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.laneshadow.ui.molecules.LSToast
import com.laneshadow.ui.molecules.LSToastState
import com.laneshadow.ui.molecules.LSToastVisuals
import com.laneshadow.ui.molecules.ToastVariant
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSToastStory {
    val all: List<Story> = listOf(
        story(
            id = "molecules.toast.default",
            name = "Default",
            summary = "Neutral overlay feedback.",
            visuals = LSToastVisuals(
                message = "Draft saved",
                detail = "Your changes are synced locally.",
            ),
        ),
        story(
            id = "molecules.toast.success",
            name = "Success",
            summary = "Success feedback in status color.",
            visuals = LSToastVisuals(
                message = "Route saved",
                detail = "Added to your ride library.",
                variant = ToastVariant.Success,
            ),
        ),
        story(
            id = "molecules.toast.warning",
            name = "Warning",
            summary = "Warning feedback for degraded state.",
            visuals = LSToastVisuals(
                message = "Weak signal",
                detail = "Offline tiles may take longer to load.",
                variant = ToastVariant.Warning,
            ),
        ),
        story(
            id = "molecules.toast.error",
            name = "Error",
            summary = "Error feedback for blocking failures.",
            visuals = LSToastVisuals(
                message = "Save failed",
                detail = "Check your connection and try again.",
                variant = ToastVariant.Error,
            ),
        ),
    )

    private fun story(
        id: String,
        name: String,
        summary: String,
        visuals: LSToastVisuals,
    ): Story =
        Story(
            id = id,
            tier = ComponentTier.Molecule,
            component = "LSToast",
            name = name,
            summary = summary,
            content = {
                MoleculeStoryFrame {
                    ToastStoryContent(visuals = visuals)
                }
            },
        )
}

@Composable
private fun ToastStoryContent(visuals: LSToastVisuals) {
    val state = remember { LSToastState() }
    var refreshKey by remember { mutableIntStateOf(0) }

    LaunchedEffect(refreshKey) {
        state.show(
            message = visuals.message,
            variant = visuals.variant,
            detail = visuals.detail,
            actionLabel = visuals.actionLabel,
            onAction = visuals.onAction,
        )
    }

    LSToast(
        state = state,
        onDismissed = {
            refreshKey += 1
        },
    )
}
