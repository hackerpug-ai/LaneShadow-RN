package com.laneshadow.sandbox.stories.molecules

import androidx.compose.runtime.Composable
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.molecules.LSListRow
import com.laneshadow.ui.molecules.LSListRowLeading
import com.laneshadow.ui.molecules.LSListRowTrailing
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSListRowStory {
    val all: List<Story> = listOf(
        story(
            id = "molecules.listrow.leadingIcon",
            name = "Leading Icon",
            summary = "Row with icon-leading content.",
        ) {
            LSListRow(
                title = "Notifications",
                leading = LSListRowLeading.Icon(IconName.Menu),
            )
        },
        story(
            id = "molecules.listrow.leadingAvatar",
            name = "Leading Avatar",
            summary = "Row with avatar-leading content.",
        ) {
            LSListRow(
                title = "Jordan Kim",
                leading = LSListRowLeading.Avatar(initials = "JK"),
            )
        },
        story(
            id = "molecules.listrow.withSubtitle",
            name = "With Subtitle",
            summary = "Row with subtitle under title text.",
        ) {
            LSListRow(
                title = "Ride Alerts",
                subtitle = "Mentions and route updates",
                leading = LSListRowLeading.Icon(IconName.Route),
            )
        },
        story(
            id = "molecules.listrow.withToggle",
            name = "With Toggle",
            summary = "Row with trailing toggle indicator variant.",
        ) {
            LSListRow(
                title = "Location Sharing",
                leading = LSListRowLeading.Icon(IconName.Pin),
                trailing = LSListRowTrailing.Toggle(checked = true),
            )
        },
        story(
            id = "molecules.listrow.withChevron",
            name = "With Chevron",
            summary = "Row with default trailing chevron affordance.",
        ) {
            LSListRow(
                title = "Saved Routes",
                leading = LSListRowLeading.Icon(IconName.Map),
                trailing = LSListRowTrailing.Chevron,
            )
        },
        story(
            id = "molecules.listrow.withTrailingButton",
            name = "With Trailing Button",
            summary = "Row with trailing button-style label treatment.",
        ) {
            LSListRow(
                title = "Rider Profile",
                leading = LSListRowLeading.Avatar(initials = "RS"),
                trailing = LSListRowTrailing.Button(label = "Follow"),
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
        component = "LSListRow",
        name = name,
        summary = summary,
        content = { MoleculeStoryFrame(content) },
    )
