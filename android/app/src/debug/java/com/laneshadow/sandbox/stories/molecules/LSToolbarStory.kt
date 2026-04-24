package com.laneshadow.sandbox.stories.molecules

import androidx.compose.runtime.Composable
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.molecules.LSToolbar
import com.laneshadow.ui.molecules.LSToolbarAction
import com.laneshadow.ui.molecules.LSToolbarLeading
import com.laneshadow.ui.molecules.LSToolbarTrailing
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSToolbarStory {
    val all: List<Story> = listOf(
        story(
            id = "molecules.toolbar.backTitleAction",
            name = "Back + Title + Action",
            summary = "Back affordance, centered title, and single trailing action.",
        ) {
            LSToolbar(
                leading = LSToolbarLeading.Back(onClick = {}),
                title = "Details",
                trailing = LSToolbarTrailing.Action(icon = IconName.Menu, onClick = {}),
            )
        },
        story(
            id = "molecules.toolbar.titleOnly",
            name = "Title Only",
            summary = "Title-centered toolbar with no leading or trailing actions.",
        ) {
            LSToolbar(
                title = "Title Only",
            )
        },
        story(
            id = "molecules.toolbar.titleTwoActions",
            name = "Title + Two Actions",
            summary = "Centered title with two trailing action buttons.",
        ) {
            LSToolbar(
                title = "Library",
                trailing = LSToolbarTrailing.Actions(
                    first = LSToolbarAction(icon = IconName.Menu, onClick = {}),
                    second = LSToolbarAction(icon = IconName.Share, onClick = {}),
                ),
            )
        },
        story(
            id = "molecules.toolbar.noBack",
            name = "No Back Button",
            summary = "Single trailing action and no leading back affordance.",
        ) {
            LSToolbar(
                title = "Saved Routes",
                trailing = LSToolbarTrailing.Action(icon = IconName.Bookmark, onClick = {}),
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
        component = "LSToolbar",
        name = name,
        summary = summary,
        content = { MoleculeStoryFrame(content) },
    )
