package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.atoms.RouteVariant
import com.laneshadow.ui.molecules.RouteAttachment
import com.laneshadow.ui.organisms.LSNavigatorMessage
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSNavigatorMessageStory {
    val all: List<Story> = listOf(
        Story(
            id = "organisms.navigatormessage.message-only",
            tier = ComponentTier.Organism,
            component = "LSNavigatorMessage",
            name = "Message Only",
            summary = "Compass chip + THE NAVIGATOR label + body in Newsreader. Pin + close actions. No attachments.",
            content = { MessageOnlyStory() },
        ),
        Story(
            id = "organisms.navigatormessage.with-one-attachment",
            tier = ComponentTier.Organism,
            component = "LSNavigatorMessage",
            name = "With One Attachment",
            summary = "Single LSRouteAttachmentCard below body. First (and only) card selected:true with Best badge.",
            content = { WithOneAttachmentStory() },
        ),
        Story(
            id = "organisms.navigatormessage.with-three-attachments",
            tier = ComponentTier.Organism,
            component = "LSNavigatorMessage",
            name = "With Three Attachments",
            summary = "Three cards stacked 6pt apart. First card selected:true. Alt1 sage, Alt2 slate stripe colors.",
            content = { WithThreeAttachmentsStory() },
        ),
        Story(
            id = "organisms.navigatormessage.pinned",
            tier = ComponentTier.Organism,
            component = "LSNavigatorMessage",
            name = "Pinned",
            summary = "pinned:true state. Bookmark icon filled + signal-colored. Pinned label shown. Auto-dismiss disabled.",
            content = { PinnedStory() },
        ),
        Story(
            id = "organisms.navigatormessage.long-body",
            tier = ComponentTier.Organism,
            component = "LSNavigatorMessage",
            name = "Long Body",
            summary = "Multi-line opinion.md body. Container expands. Verify legibility and line-height at 13.5px/1.45.",
            content = { LongBodyStory() },
        ),
        Story(
            id = "organisms.navigatormessage.dark-mode",
            tier = ComponentTier.Organism,
            component = "LSNavigatorMessage",
            name = "Dark Mode",
            summary = "Glass tint + text re-resolves against dark paper map. Border copper tint remains visible.",
            content = { DarkModeStory() },
        ),
    )
}

@Composable
private fun MessageOnlyStory() {
    LaneShadowTheme {
        StoryColumn {
            LSNavigatorMessage(
                body = "Highway 1 south is open. Recommend the coastal run — light traffic until Cambria.",
                attachments = emptyList(),
                pinned = false,
                onPin = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun WithOneAttachmentStory() {
    LaneShadowTheme {
        StoryColumn {
            LSNavigatorMessage(
                body = "One route through the hills looks good today.",
                attachments = listOf(
                    RouteAttachment(
                        id = "route-1",
                        title = "The Skyline Spine",
                        via = "via Kings Mountain Rd",
                        distance = "47 mi",
                        duration = "1h 22m",
                        scenicScore = 4,
                        variant = RouteVariant.Best,
                        isBest = true,
                    ),
                ),
                pinned = false,
                onPin = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun WithThreeAttachmentsStory() {
    LaneShadowTheme {
        StoryColumn {
            LSNavigatorMessage(
                body = "Three options through the Santa Cruz mountains.",
                attachments = listOf(
                    RouteAttachment(
                        id = "route-1",
                        title = "The Skyline Spine",
                        via = "via Kings Mountain Rd",
                        distance = "47 mi",
                        duration = "1h 22m",
                        scenicScore = 4,
                        variant = RouteVariant.Best,
                        isBest = true,
                    ),
                    RouteAttachment(
                        id = "route-2",
                        title = "Old La Honda",
                        via = "via Page Mill Rd",
                        distance = "38 mi",
                        duration = "1h 05m",
                        scenicScore = 3,
                        variant = RouteVariant.Alt1,
                    ),
                    RouteAttachment(
                        id = "route-3",
                        title = "Coastal Connector",
                        via = "via Hwy 1",
                        distance = "52 mi",
                        duration = "1h 35m",
                        scenicScore = 2,
                        variant = RouteVariant.Alt2,
                    ),
                ),
                pinned = true,
                onPin = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun PinnedStory() {
    LaneShadowTheme {
        StoryColumn {
            LSNavigatorMessage(
                body = "Take 280 south to 92 east, then Skyline. Best window closes at 3pm.",
                attachments = emptyList(),
                pinned = true,
                onPin = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun LongBodyStory() {
    LaneShadowTheme {
        StoryColumn {
            LSNavigatorMessage(
                body = "The coastal run looks good but there's a wind advisory above 2,000 feet on Skyline. If you want to avoid the exposed ridgeline, Old La Honda into Page Mill keeps you in the trees most of the way.",
                attachments = emptyList(),
                pinned = false,
                onPin = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun DarkModeStory() {
    LaneShadowTheme(darkTheme = true) {
        StoryColumn {
            LSNavigatorMessage(
                body = "Highway 1 south is open. Coastal run recommended.",
                attachments = emptyList(),
                pinned = false,
                onPin = {},
                onDismiss = {},
            )
        }
    }
}

@Composable
private fun StoryColumn(content: @Composable () -> Unit) {
    val theme = LocalLaneShadowTheme.current
    Column(
        modifier = Modifier.padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        content()
    }
}
