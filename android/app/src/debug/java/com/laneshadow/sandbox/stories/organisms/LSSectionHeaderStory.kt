package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.organisms.LSSectionHeader
import com.laneshadow.ui.organisms.SectionHeaderTrailing
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSSectionHeaderStory {
    val all: List<Story> = listOf(
        Story(
            id = "organisms.sectionheader.title-only",
            tier = ComponentTier.Organism,
            component = "LSSectionHeader",
            name = "Title Only",
            summary = "trailing: .none. title in ui.title.md. inset: spacing.3 = 12pt. No see-all link rendered.",
            content = { TitleOnlyStory() },
        ),
        Story(
            id = "organisms.sectionheader.title-with-see-all",
            tier = ComponentTier.Organism,
            component = "LSSectionHeader",
            name = "Title + See All",
            summary = "trailing: .link(\"See all\", onTap). \"See all\" in signal.default + chevron R. onTap fires once per tap.",
            content = { TitleWithSeeAllStory() },
        ),
        Story(
            id = "organisms.sectionheader.caps-label",
            tier = ComponentTier.Organism,
            component = "LSSectionHeader",
            name = "Caps Label",
            summary = "title in ui.label.sm (8.5px 600 0.14em uppercase, content-tertiary). No trailing slot. Used inside drawers.",
            content = { CapsLabelStory() },
        ),
        Story(
            id = "organisms.sectionheader.custom-inset",
            tier = ComponentTier.Organism,
            component = "LSSectionHeader",
            name = "Custom Inset",
            summary = "inset: spacing.4 (16pt) on Saved Routes header. Caps label \"Last Month\" with inset 0 (flush). Prop drives padding-left.",
            content = { CustomInsetStory() },
        ),
        Story(
            id = "organisms.sectionheader.dark-mode",
            tier = ComponentTier.Organism,
            component = "LSSectionHeader",
            name = "Dark Mode",
            summary = "content-primary re-resolves to ink-050. signal.default copper See all remains on dark surface. No new colors.",
            content = { DarkModeStory() },
        ),
    )
}

@Composable
private fun TitleOnlyStory() {
    LaneShadowTheme {
        StoryColumn {
            LSSectionHeader(
                title = "Nearby Routes",
                trailing = SectionHeaderTrailing.None
            )
        }
    }
}

@Composable
private fun TitleWithSeeAllStory() {
    LaneShadowTheme {
        StoryColumn {
            LSSectionHeader(
                title = "Nearby Routes",
                trailing = SectionHeaderTrailing.Link(
                    label = "See all",
                    onTap = {}
                )
            )
        }
    }
}

@Composable
private fun CapsLabelStory() {
    LaneShadowTheme {
        StoryColumn {
            LSSectionHeader(
                title = "THIS WEEK"
            )
        }
    }
}

@Composable
private fun CustomInsetStory() {
    LaneShadowTheme {
        StoryColumn {
            val theme = com.laneshadow.theme.LocalLaneShadowTheme.current

            LSSectionHeader(
                title = "Saved Routes",
                trailing = SectionHeaderTrailing.Link(
                    label = "See all",
                    onTap = {}
                ),
                insetOverride = theme.space.lg // spacing.4 = 16pt
            )

            LSSectionHeader(
                title = "Last Month",
                insetOverride = 0.dp // flush (0pt)
            )
        }
    }
}

@Composable
private fun DarkModeStory() {
    // Note: Dark mode theme would need to be configured in the sandbox
    // For now, we'll show the light mode version
    LaneShadowTheme {
        StoryColumn {
            LSSectionHeader(
                title = "Nearby Routes",
                trailing = SectionHeaderTrailing.Link(
                    label = "See all",
                    onTap = {}
                )
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
