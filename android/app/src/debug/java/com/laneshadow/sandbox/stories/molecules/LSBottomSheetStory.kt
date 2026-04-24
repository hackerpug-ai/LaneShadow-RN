package com.laneshadow.sandbox.stories.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSButton
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.molecules.BottomSheetDetent
import com.laneshadow.ui.molecules.LSBottomSheet
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSBottomSheetStory {
    val all: List<Story> = listOf(
        story(
            id = "molecules.bottomsheet.small",
            name = "Small",
            summary = "Compact quarter-height sheet for peek actions.",
            detent = BottomSheetDetent.Small,
        ),
        story(
            id = "molecules.bottomsheet.medium",
            name = "Medium",
            summary = "Half-height sheet for multi-row contextual actions.",
            detent = BottomSheetDetent.Medium,
        ),
        story(
            id = "molecules.bottomsheet.large",
            name = "Large",
            summary = "Large drawer-height sheet for deeper flows.",
            detent = BottomSheetDetent.Large,
        ),
    )

    private fun story(
        id: String,
        name: String,
        summary: String,
        detent: BottomSheetDetent,
    ): Story =
        Story(
            id = id,
            tier = ComponentTier.Molecule,
            component = "LSBottomSheet",
            name = name,
            summary = summary,
            content = {
                MoleculeStoryFrame {
                    BottomSheetStoryContent(detent = detent)
                }
            },
        )
}

@Composable
private fun BottomSheetStoryContent(detent: BottomSheetDetent) {
    var visible by remember { mutableStateOf(true) }

    if (visible) {
        LSBottomSheet(
            detent = detent,
            onDismiss = { visible = false },
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(com.laneshadow.theme.LocalLaneShadowTheme.current.space.md)) {
                LSText(
                    text = "Route Filters",
                    variant = TypographyVariant.Ui.Title.Md,
                    color = ContentColor.Primary,
                )
                LSText(
                    text = "Tune scenic score, distance, and weather sensitivity without losing map context.",
                    variant = TypographyVariant.Ui.Body.Md,
                    color = ContentColor.Secondary,
                )
                LSButton(
                    label = "Apply Filters",
                    variant = ButtonVariant.Primary,
                    onClick = { visible = false },
                )
            }
        }
    }
}
