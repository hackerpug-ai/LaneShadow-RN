package com.laneshadow.sandbox.stories.molecules

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.molecules.LSEmptyState
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSEmptyStateStory {
    val all: List<Story> = listOf(
        Story(
            id = "molecules.emptystate.with-illustration",
            tier = ComponentTier.Molecule,
            component = "LSEmptyState",
            name = "With Illustration",
            summary = "Empty state with icon illustration.",
            content = { EmptyStateWithIllustrationStory() },
        ),
        Story(
            id = "molecules.emptystate.without-illustration",
            tier = ComponentTier.Molecule,
            component = "LSEmptyState",
            name = "Without Illustration",
            summary = "Empty state without icon illustration.",
            content = { EmptyStateWithoutIllustrationStory() },
        ),
        Story(
            id = "molecules.emptystate.with-action",
            tier = ComponentTier.Molecule,
            component = "LSEmptyState",
            name = "With Action",
            summary = "Empty state with action button.",
            content = { EmptyStateWithActionStory() },
        ),
    )
}

@Composable
private fun EmptyStateWithIllustrationStory() {
    LaneShadowTheme {
        StoryColumn {
            LSEmptyState(
                icon = IconName.Pin,
                title = "No rides yet",
                body = "Record your first ride to see it here.",
            )
        }
    }
}

@Composable
private fun EmptyStateWithoutIllustrationStory() {
    LaneShadowTheme {
        StoryColumn {
            LSEmptyState(
                title = "No results",
                body = "Try adjusting your search filters.",
            )
        }
    }
}

@Composable
private fun EmptyStateWithActionStory() {
    LaneShadowTheme {
        StoryColumn {
            LSEmptyState(
                icon = IconName.Pin,
                title = "No rides yet",
                body = "Record your first ride.",
                actionText = "Get Started",
                onAction = {},
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
