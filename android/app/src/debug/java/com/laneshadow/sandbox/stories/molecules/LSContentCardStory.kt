package com.laneshadow.sandbox.stories.molecules

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.molecules.LSContentCard
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSContentCardStory {
    val all: List<Story> = listOf(
        story(
            id = "molecules.contentcard.with-image-header",
            name = "With Image Header",
            summary = "Card with optional header slot and primary text body.",
        ) {
            val theme = LocalLaneShadowTheme.current
            LSContentCard(
                title = "Wasatch Crest Trail",
                subtitle = "28 mi · 1h 04m · Mountain",
                header = {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(theme.sizing.icon.xl + theme.space.xxl)
                            .background(theme.colors.surfaceVariant.default)
                            .padding(theme.space.md),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {}
                },
            )
        },
        story(
            id = "molecules.contentcard.title-only",
            name = "Title Only",
            summary = "Minimal card body with title only.",
        ) {
            LSContentCard(
                title = "Mill Creek Canyon Loop",
            )
        },
        story(
            id = "molecules.contentcard.title-subtitle-chips",
            name = "Title+Subtitle+Chips",
            summary = "Title and subtitle with metadata chips rendered in actions slot.",
        ) {
            val theme = LocalLaneShadowTheme.current
            LSContentCard(
                title = "Emigration Canyon Climb",
                subtitle = "42 mi · 1h 12m",
                actions = {
                    Row(horizontalArrangement = Arrangement.spacedBy(theme.space.sm)) {
                        com.laneshadow.ui.atoms.LSText(
                            text = "Best Route",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Ui.Label.Sm,
                            color = com.laneshadow.ui.atoms.ContentColor.Secondary,
                        )
                        com.laneshadow.ui.atoms.LSText(
                            text = "Alpine",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Ui.Label.Sm,
                            color = com.laneshadow.ui.atoms.ContentColor.Secondary,
                        )
                    }
                },
            )
        },
        story(
            id = "molecules.contentcard.with-actions",
            name = "With Actions",
            summary = "Card footer action slot composition.",
        ) {
            val theme = LocalLaneShadowTheme.current
            LSContentCard(
                title = "Pacific Coast Sweep",
                subtitle = "82 mi · 2h 15m",
                actions = {
                    Row(horizontalArrangement = Arrangement.spacedBy(theme.space.sm)) {
                        com.laneshadow.ui.atoms.LSText(
                            text = "Ride This",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Ui.Label.Sm,
                            color = com.laneshadow.ui.atoms.ContentColor.Primary,
                        )
                        com.laneshadow.ui.atoms.LSText(
                            text = "Save",
                            variant = com.laneshadow.ui.atoms.TypographyVariant.Ui.Label.Sm,
                            color = com.laneshadow.ui.atoms.ContentColor.Secondary,
                        )
                    }
                },
            )
        },
    )
}

private fun story(
    id: String,
    name: String,
    summary: String,
    content: @Composable () -> Unit,
): Story =
    Story(
        id = id,
        tier = ComponentTier.Molecule,
        component = "LSContentCard",
        name = name,
        summary = summary,
        content = { MoleculeStoryFrame(content) },
    )
