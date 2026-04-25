package com.laneshadow.sandbox.stories.organisms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.organisms.LSInlineErrorCallout
import com.laneshadow.ui.organisms.SuggestionChip
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSInlineErrorCalloutStory {
    val all: List<Story> = listOf(
        Story(
            id = "organisms.inlineerror.error-only",
            tier = ComponentTier.Organism,
            component = "LSInlineErrorCallout",
            name = "Error Only",
            summary = "Warning compass chip + THE NAVIGATOR label + error body in Newsreader. No detail or suggestions.",
            content = { ErrorOnlyStory() },
        ),
        Story(
            id = "organisms.inlineerror.with-detail",
            tier = ComponentTier.Organism,
            component = "LSInlineErrorCallout",
            name = "With Detail",
            summary = "detail prop shown in ui.body.sm / content-secondary below the main body. Adds recoverable context.",
            content = { WithDetailStory() },
        ),
        Story(
            id = "organisms.inlineerror.with-suggestions",
            tier = ComponentTier.Organism,
            component = "LSInlineErrorCallout",
            name = "With Suggestions",
            summary = "Horizontal LSSuggestionChip row below dashed divider. Primary chip tinted warning amber. onSuggestionTap fires once.",
            content = { WithSuggestionsStory() },
        ),
        Story(
            id = "organisms.inlineerror.long-body-suggestions",
            tier = ComponentTier.Organism,
            component = "LSInlineErrorCallout",
            name = "Long Body + Long Suggestions",
            summary = "Long body + detail + three chips. Container expands vertically. Chips wrap if needed.",
            content = { LongBodySuggestionsStory() },
        ),
        Story(
            id = "organisms.inlineerror.dark-mode",
            tier = ComponentTier.Organism,
            component = "LSInlineErrorCallout",
            name = "Dark Mode",
            summary = "Warning amber border and chip tint remain legible on dark glass surface. Glass bg resolves to ink-tinted.",
            content = { DarkModeStory() },
        ),
    )
}

@Composable
private fun ErrorOnlyStory() {
    LaneShadowTheme {
        StoryColumn {
            LSInlineErrorCallout(
                body = "Couldn't stitch that route — segment through Lucia looked broken.",
                detail = null,
                suggestions = emptyList(),
                onSuggestionTap = {},
            )
        }
    }
}

@Composable
private fun WithDetailStory() {
    LaneShadowTheme {
        StoryColumn {
            LSInlineErrorCallout(
                body = "Couldn't stitch that one together.",
                detail = "The segment through Lucia looked broken. Try a different end point or route inland via Carmel Valley Rd instead.",
                suggestions = emptyList(),
                onSuggestionTap = {},
            )
        }
    }
}

@Composable
private fun WithSuggestionsStory() {
    LaneShadowTheme {
        StoryColumn {
            LSInlineErrorCallout(
                body = "Couldn't stitch that one together — the segment through Lucia looked broken.",
                detail = "Try a different end point, or route inland.",
                suggestions = listOf(
                    SuggestionChip(label = "Try inland", isPrimary = true),
                    SuggestionChip(label = "End at Big Sur", isPrimary = false),
                ),
                onSuggestionTap = {},
            )
        }
    }
}

@Composable
private fun LongBodySuggestionsStory() {
    LaneShadowTheme {
        StoryColumn {
            LSInlineErrorCallout(
                body = "Couldn't stitch that one together — the segment through Lucia looked broken. The road data shows a closure between mile marker 40 and 44.",
                detail = "Try a different end point, or let me route you inland via Carmel Valley Rd instead? The views are different but the road is spectacular.",
                suggestions = listOf(
                    SuggestionChip(label = "Try inland via CVR", isPrimary = true),
                    SuggestionChip(label = "End at Big Sur", isPrimary = false),
                    SuggestionChip(label = "Avoid Lucia", isPrimary = false),
                ),
                onSuggestionTap = {},
            )
        }
    }
}

@Composable
private fun DarkModeStory() {
    LaneShadowTheme(darkTheme = true) {
        StoryColumn {
            LSInlineErrorCallout(
                body = "Couldn't stitch that one together.",
                detail = null,
                suggestions = listOf(
                    SuggestionChip(label = "Try inland", isPrimary = true),
                    SuggestionChip(label = "End at Big Sur", isPrimary = false),
                ),
                onSuggestionTap = {},
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
