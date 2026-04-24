package com.laneshadow.sandbox.stories.molecules

import androidx.compose.runtime.Composable
import com.laneshadow.ui.molecules.LSNavHeader
import com.laneshadow.ui.molecules.NavHeaderVariant
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSNavHeaderStory {
    val all: List<Story> = listOf(
        story(
            id = "molecules.navheader.default",
            name = "Default",
            summary = "Default navigation header with title-row typography.",
        ) {
            LSNavHeader(
                title = "Rides",
                variant = NavHeaderVariant.Default,
            )
        },
        story(
            id = "molecules.navheader.largeTitle",
            name = "Large Title",
            summary = "Static Android large-title style using opinion typography.",
        ) {
            LSNavHeader(
                title = "Chat",
                variant = NavHeaderVariant.LargeTitle,
            )
        },
        story(
            id = "molecules.navheader.largeTitleSubtitle",
            name = "Large Title With Subtitle",
            summary = "Large-title style with supporting subtitle copy.",
        ) {
            LSNavHeader(
                title = "Chat",
                subtitle = "12 rides this week",
                variant = NavHeaderVariant.LargeTitleWithSubtitle,
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
        component = "LSNavHeader",
        name = name,
        summary = summary,
        content = { MoleculeStoryFrame(content) },
    )
