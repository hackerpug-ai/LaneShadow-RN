package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.organisms.LSNavBar
import com.laneshadow.ui.organisms.NavBarLeading
import com.laneshadow.ui.organisms.NavBarTrailing
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSNavBarStory {
    val all: List<Story> = listOf(
        Story(
            id = "organisms.navbar.default",
            tier = ComponentTier.Organism,
            component = "LSNavBar",
            name = "Back + Title + Close",
            summary = "Standard modal toolbar with back leading and close trailing.",
            content = { NavBarDefaultStory() },
        ),
    )
}

@Composable
private fun NavBarDefaultStory() {
    LaneShadowTheme {
        StoryColumn {
            LSNavBar(
                title = "Filter",
                leading = NavBarLeading.Back(onClick = {}),
                trailing = NavBarTrailing.Action(icon = IconName.Close, onClick = {}),
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
