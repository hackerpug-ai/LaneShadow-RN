package com.laneshadow.sandbox.stories

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import com.laneshadow.ui.atoms.ButtonState
import com.laneshadow.ui.atoms.ButtonVariant
import com.laneshadow.ui.atoms.LSButton
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object LSButtonStories {
    val all: List<Story> = listOf(
        Story(
            id = "atoms.button.primary",
            tier = ComponentTier.Atom,
            component = "LSButton",
            name = "Primary",
            summary = "Primary action button across default, pressed, disabled, and loading states.",
            content = { ButtonVariantStory(ButtonVariant.Primary, "Save Ride") },
        ),
        Story(
            id = "atoms.button.secondary",
            tier = ComponentTier.Atom,
            component = "LSButton",
            name = "Secondary",
            summary = "Secondary action button with border-backed neutral styling.",
            content = { ButtonVariantStory(ButtonVariant.Secondary, "Review Plan") },
        ),
        Story(
            id = "atoms.button.tertiary",
            tier = ComponentTier.Atom,
            component = "LSButton",
            name = "Tertiary",
            summary = "Tertiary action button using the current tertiary token set.",
            content = { ButtonVariantStory(ButtonVariant.Tertiary, "Ask AI") },
        ),
        Story(
            id = "atoms.button.outline",
            tier = ComponentTier.Atom,
            component = "LSButton",
            name = "Outline",
            summary = "Outline button including the NEW chip composition with a leading icon.",
            content = { OutlineButtonStory() },
        ),
        Story(
            id = "atoms.button.ghost",
            tier = ComponentTier.Atom,
            component = "LSButton",
            name = "Ghost",
            summary = "Ghost button for low-emphasis actions with pressed surface feedback.",
            content = { ButtonVariantStory(ButtonVariant.Ghost, "Skip") },
        ),
        Story(
            id = "atoms.button.destructive",
            tier = ComponentTier.Atom,
            component = "LSButton",
            name = "Destructive",
            summary = "Destructive button for irreversible actions.",
            content = { ButtonVariantStory(ButtonVariant.Destructive, "Delete Ride") },
        ),
    )
}

@Composable
private fun ButtonVariantStory(
    variant: ButtonVariant,
    label: String,
) {
    LaneShadowTheme {
        StoryColumn {
            LSButton(
                label = label,
                variant = variant,
                onClick = {},
            )
            LSButton(
                label = label,
                variant = variant,
                state = ButtonState.Pressed,
                onClick = {},
            )
            LSButton(
                label = label,
                variant = variant,
                state = ButtonState.Disabled,
                onClick = {},
            )
            LSButton(
                label = label,
                variant = variant,
                state = ButtonState.Loading,
                onClick = {},
            )
        }
    }
}

@Composable
private fun OutlineButtonStory() {
    LaneShadowTheme {
        StoryColumn {
            LSButton(
                label = "NEW",
                variant = ButtonVariant.Outline,
                leadingIcon = IconName.Sparkle,
                onClick = {},
            )
            LSButton(
                label = "NEW",
                variant = ButtonVariant.Outline,
                leadingIcon = IconName.Sparkle,
                state = ButtonState.Pressed,
                onClick = {},
            )
            LSButton(
                label = "NEW",
                variant = ButtonVariant.Outline,
                leadingIcon = IconName.Sparkle,
                state = ButtonState.Disabled,
                onClick = {},
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
