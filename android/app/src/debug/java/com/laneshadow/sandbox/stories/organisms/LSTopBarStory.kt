package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.organisms.LSTopBar
import com.laneshadow.ui.organisms.TopBarTrailing
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.PreviewMode
import com.nativesandbox.model.Story

object LSTopBarStory {
    val all: List<Story> = listOf(
        Story(
            id = "organisms.topbar.default",
            tier = ComponentTier.Organism,
            component = "LSTopBar",
            name = "Default",
            summary = "Hamburger leading + NEW trailing with glass chrome chips.",
            previewMode = PreviewMode.FullScreen,
            content = { TopBarDefaultStory() },
        ),
        Story(
            id = "organisms.topbar.with-title",
            tier = ComponentTier.Organism,
            component = "LSTopBar",
            name = "With Title",
            summary = "Centered title between hamburger and NEW chips.",
            previewMode = PreviewMode.FullScreen,
            content = { TopBarWithTitleStory() },
        ),
        Story(
            id = "organisms.topbar.hamburger-only",
            tier = ComponentTier.Organism,
            component = "LSTopBar",
            name = "Hamburger Only",
            summary = "Hamburger chip with no trailing slot.",
            previewMode = PreviewMode.FullScreen,
            content = { TopBarHamburgerOnlyStory() },
        ),
        Story(
            id = "organisms.topbar.record-highlight",
            tier = ComponentTier.Organism,
            component = "LSTopBar",
            name = "Record Highlight",
            summary = "Recording indicator with red dot and REC label.",
            previewMode = PreviewMode.FullScreen,
            content = { TopBarRecordHighlightStory() },
        ),
    )
}

@Composable
private fun TopBarDefaultStory() {
    LaneShadowTheme {
        StoryColumn {
            LSTopBar(
                onMenuTap = {},
                onNewTap = {},
            )
        }
    }
}

@Composable
private fun TopBarWithTitleStory() {
    LaneShadowTheme {
        StoryColumn {
            LSTopBar(
                title = "Details",
                trailing = TopBarTrailing.New(onTap = {}),
                onMenuTap = {},
            )
        }
    }
}

@Composable
private fun TopBarHamburgerOnlyStory() {
    LaneShadowTheme {
        StoryColumn {
            LSTopBar(
                onMenuTap = {},
            )
        }
    }
}

@Composable
private fun TopBarRecordHighlightStory() {
    LaneShadowTheme {
        StoryColumn {
            LSTopBar(
                trailing = TopBarTrailing.RecordHighlight,
                onMenuTap = {},
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
