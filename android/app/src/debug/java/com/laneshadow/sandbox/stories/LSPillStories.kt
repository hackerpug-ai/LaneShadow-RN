package com.laneshadow.sandbox.stories

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.IconColor
import com.laneshadow.ui.atoms.IconSize
import com.laneshadow.ui.atoms.LSIcon
import com.laneshadow.ui.atoms.LSPill
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.PillSize
import com.laneshadow.ui.atoms.TypographyVariant
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSPillStories {
    val all: List<Story> = listOf(
        Story(
            id = "atoms.pill.small",
            tier = ComponentTier.Atom,
            component = "LSPill",
            name = "Small",
            summary = "Small pill surface with token-resolved 24dp height and default padding.",
            content = { PillTextStory(size = PillSize.Sm, label = "Quiet road") },
        ),
        Story(
            id = "atoms.pill.medium",
            tier = ComponentTier.Atom,
            component = "LSPill",
            name = "Medium",
            summary = "Medium pill surface for standard atom and molecule labels.",
            content = { PillTextStory(size = PillSize.Md, label = "Scenic route") },
        ),
        Story(
            id = "atoms.pill.large",
            tier = ComponentTier.Atom,
            component = "LSPill",
            name = "Large",
            summary = "Large pill surface with room for more prominent chip labels.",
            content = { PillTextStory(size = PillSize.Lg, label = "Touring weekend") },
        ),
        Story(
            id = "atoms.pill.withIconLabel",
            tier = ComponentTier.Atom,
            component = "LSPill",
            name = "With Icon + Label",
            summary = "Pill carrying both an icon atom and label text content.",
            content = { PillIconLabelStory() },
        ),
        Story(
            id = "atoms.pill.withIconOnly",
            tier = ComponentTier.Atom,
            component = "LSPill",
            name = "With Icon Only",
            summary = "Square icon-only pill showing zero-padding override behavior.",
            content = { PillIconOnlyStory() },
        ),
    )
}

@Composable
private fun PillTextStory(size: PillSize, label: String) {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier.padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        StoryPillSurface(size = size) {
            LSText(
                text = label,
                variant = TypographyVariant.Ui.Label.Sm,
                color = ContentColor.Secondary,
            )
        }
    }
}

@Composable
private fun PillIconLabelStory() {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier.padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        StoryPillSurface(
            size = PillSize.Md,
            background = theme.colors.primary.default,
            border = theme.colors.primary.default,
        ) {
            LSIcon(
                name = IconName.Compass,
                size = IconSize.Sm,
                color = IconColor.Content(ContentColor.OnSignal),
            )
            LSText(
                text = "Ride plan",
                variant = TypographyVariant.Ui.Label.Sm,
                color = ContentColor.OnSignal,
            )
        }
    }
}

@Composable
private fun PillIconOnlyStory() {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier.padding(theme.space.lg),
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        StoryPillSurface(
            size = PillSize.Md,
            padding = PaddingValues(0.dp),
            background = theme.colors.surfaceVariant.default,
        ) {
            Box(
                modifier = Modifier.size(PillSize.Md.resolveHeight(theme)),
                contentAlignment = Alignment.Center,
            ) {
                LSIcon(
                    name = IconName.Compass,
                    size = IconSize.Md,
                    color = IconColor.Content(ContentColor.Primary),
                )
            }
        }
    }
}

@Composable
private fun StoryPillSurface(
    size: PillSize,
    padding: PaddingValues? = null,
    background: Color? = null,
    border: Color? = null,
    content: @Composable androidx.compose.foundation.layout.RowScope.() -> Unit,
) {
    val theme = LocalLaneShadowTheme.current
    val shape = RoundedCornerShape(theme.radius.full)
    val resolvedBackground = background ?: theme.colors.surfaceVariant.default
    val resolvedBorder = border ?: theme.colors.border.default

    LSPill(
        size = size,
        padding = padding,
        modifier = Modifier
            .background(resolvedBackground, shape)
            .border(1.dp, resolvedBorder, shape),
        content = content,
    )
}
