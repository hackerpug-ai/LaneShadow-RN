package com.laneshadow.sandbox.stories

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.ColorPainter
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.AvatarSize
import com.laneshadow.ui.atoms.LSAvatar
import com.laneshadow.ui.atoms.LSDivider
import com.laneshadow.ui.atoms.LSSpinner
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSDisplayStories {
    val all: List<Story> = listOf(
        Story(
            id = "atoms.avatar.image",
            tier = ComponentTier.Atom,
            component = "LSAvatar",
            name = "Avatar Image",
            summary = "Image-backed avatar clipped to a circular token-resolved frame.",
            content = { AvatarImageStory() },
        ),
        Story(
            id = "atoms.avatar.initials",
            tier = ComponentTier.Atom,
            component = "LSAvatar",
            name = "Avatar Initials",
            summary = "Initials fallback avatar rendered through LSText.",
            content = { AvatarInitialsStory() },
        ),
        Story(
            id = "atoms.avatar.size-matrix",
            tier = ComponentTier.Atom,
            component = "LSAvatar",
            name = "Avatar Sizes",
            summary = "All five avatar sizes using the live sizing ladder.",
            content = { AvatarSizesStory() },
        ),
        Story(
            id = "atoms.divider.default",
            tier = ComponentTier.Atom,
            component = "LSDivider",
            name = "Horizontal Divider",
            summary = "Hairline divider using the subtle border token mapping.",
            content = { DividerStory() },
        ),
        Story(
            id = "atoms.spinner.default",
            tier = ComponentTier.Atom,
            component = "LSSpinner",
            name = "Medium Spinner",
            summary = "Indeterminate spinner tinted with the default signal color.",
            content = { SpinnerStory() },
        ),
    )
}

@Composable
private fun AvatarImageStory() {
    val theme = LocalLaneShadowTheme.current

    Column(modifier = Modifier.padding(theme.space.lg)) {
        LSAvatar(
            image = ColorPainter(theme.colors.primary.default),
            size = AvatarSize.Md,
        )
    }
}

@Composable
private fun AvatarInitialsStory() {
    val theme = LocalLaneShadowTheme.current

    Column(modifier = Modifier.padding(theme.space.lg)) {
        LSAvatar(
            initials = "JR",
            size = AvatarSize.Md,
        )
    }
}

@Composable
private fun AvatarSizesStory() {
    val theme = LocalLaneShadowTheme.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(theme.space.lg),
        horizontalArrangement = Arrangement.spacedBy(theme.space.md),
    ) {
        AvatarSize.entries.forEach { size ->
            LSAvatar(initials = "JR", size = size)
        }
    }
}

@Composable
private fun DividerStory() {
    val theme = LocalLaneShadowTheme.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(theme.space.lg),
    ) {
        LSDivider()
    }
}

@Composable
private fun SpinnerStory() {
    val theme = LocalLaneShadowTheme.current

    Column(modifier = Modifier.padding(theme.space.lg)) {
        LSSpinner()
    }
}
