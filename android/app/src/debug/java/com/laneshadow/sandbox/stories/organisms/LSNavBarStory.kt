package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.organisms.FilterChipSpec
import com.laneshadow.ui.organisms.LSNavBar
import com.laneshadow.ui.organisms.NavBarLeading
import com.laneshadow.ui.organisms.NavBarTrailing
import com.laneshadow.ui.organisms.SearchSlotSpec
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSNavBarStory {
    val all: List<Story> = listOf(
        Story(
            id = "organisms.nav-bar.basic",
            tier = ComponentTier.Organism,
            component = "LSNavBar",
            name = "Back + Title + Close",
            summary = "Standard modal toolbar with back leading and close trailing.",
            content = { NavBarDefaultStory() },
        ),
        Story(
            id = "organisms.nav-bar.filter-chip-row",
            tier = ComponentTier.Organism,
            component = "LSNavBar",
            name = "Filter Chip Row",
            summary = "NavBar with horizontally-scrolling filter chip row below toolbar.",
            content = { NavBarFilterChipRowStory() },
        ),
        Story(
            id = "organisms.nav-bar.search-slot",
            tier = ComponentTier.Organism,
            component = "LSNavBar",
            name = "Search Slot",
            summary = "NavBar with inset search field below toolbar.",
            content = { NavBarSearchSlotStory() },
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
private fun NavBarFilterChipRowStory() {
    LaneShadowTheme {
        StoryColumn {
            LSNavBar(
                title = "Filter",
                leading = NavBarLeading.Back(onClick = {}),
                trailing = NavBarTrailing.Action(icon = IconName.Close, onClick = {}),
                filterChips = listOf(
                    FilterChipSpec(label = "Mileage", isSelected = false),
                    FilterChipSpec(label = "Difficulty", isSelected = true),
                    FilterChipSpec(label = "Surface", isSelected = false),
                    FilterChipSpec(label = "Elevation", isSelected = false),
                    FilterChipSpec(label = "Duration", isSelected = false),
                ),
            )
        }
    }
}

@Composable
private fun NavBarSearchSlotStory() {
    LaneShadowTheme {
        StoryColumn {
            LSNavBar(
                title = "Filter",
                leading = NavBarLeading.Back(onClick = {}),
                trailing = NavBarTrailing.Action(icon = IconName.Close, onClick = {}),
                searchSlot = SearchSlotSpec(placeholder = "Search routes…"),
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
