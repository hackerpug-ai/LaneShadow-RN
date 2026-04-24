package com.laneshadow.sandbox.stories.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.molecules.LSTabItem
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSTabItemStory {
    val all: List<Story> = listOf(
        Story(
            id = "molecules.tabitem.selected",
            tier = ComponentTier.Molecule,
            component = "LSTabItem",
            name = "Selected",
            summary = "Tab item in selected state with indicator bar.",
            content = { SelectedTabItemStory() },
        ),
        Story(
            id = "molecules.tabitem.unselected",
            tier = ComponentTier.Molecule,
            component = "LSTabItem",
            name = "Unselected",
            summary = "Tab item in unselected state without indicator bar.",
            content = { UnselectedTabItemStory() },
        ),
    )
}

@Composable
private fun SelectedTabItemStory() {
    LaneShadowTheme {
        StoryColumn {
            LSTabItem(
                icon = IconName.Map,
                label = "Explore",
                selected = true,
            )
        }
    }
}

@Composable
private fun UnselectedTabItemStory() {
    LaneShadowTheme {
        StoryColumn {
            LSTabItem(
                icon = IconName.Map,
                label = "Explore",
                selected = false,
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
