package com.laneshadow.sandbox.stories

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.getValue
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.atoms.DragHandle
import com.laneshadow.ui.atoms.IconSymbol
import com.laneshadow.ui.atoms.PrimaryButton
import com.laneshadow.ui.atoms.Separator
import com.laneshadow.ui.atoms.SeparatorOrientation
import com.laneshadow.ui.atoms.SheetHandle
import com.laneshadow.ui.atoms.ThemeBottomSheetInput
import com.laneshadow.ui.atoms.ThemeButton
import com.laneshadow.ui.atoms.ThemeButtonSize
import com.laneshadow.ui.atoms.ThemeButtonVariant
import com.laneshadow.ui.atoms.ThemeCheckbox
import com.laneshadow.ui.atoms.ThemedText
import com.laneshadow.ui.atoms.ThemedTextVariant
import com.laneshadow.ui.atoms.ThemedView
import com.laneshadow.ui.atoms.ThemedViewVariant
import com.laneshadow.ui.atoms.ThemeInput
import com.laneshadow.ui.atoms.ThemeSlider
import com.laneshadow.ui.atoms.ThemeSwitch
import com.laneshadow.ui.atoms.ThemeTextarea
import com.laneshadow.ui.atoms.ThemeToggle
import com.laneshadow.ui.atoms.ThemeToggleVariant
import com.nativesandbox.model.ComponentTier
import com.nativesandbox.model.Story

object AtomsStories {
    val all: List<Story> =
        listOf(
            Story(
                id = "atoms/themed-text/default",
                tier = ComponentTier.Atom,
                component = "ThemedText",
                name = "Default",
                summary = "react-native/components/themed-text.tsx#Default",
            ) { AtomsTextStory(emphasis = false) },
            Story(
                id = "atoms/themed-text/emphasis",
                tier = ComponentTier.Atom,
                component = "ThemedText",
                name = "Emphasis",
                summary = "react-native/components/themed-text.tsx#DefaultSemiBold",
            ) { AtomsTextStory(emphasis = true) },
            Story(
                id = "atoms/themed-view/surface",
                tier = ComponentTier.Atom,
                component = "ThemedView",
                name = "Surface",
                summary = "react-native/components/themed-view.tsx#Surface",
            ) { AtomsViewStory(variant = ThemedViewVariant.Surface) },
            Story(
                id = "atoms/themed-view/muted",
                tier = ComponentTier.Atom,
                component = "ThemedView",
                name = "Muted",
                summary = "react-native/components/themed-view.tsx#Surface",
            ) { AtomsViewStory(variant = ThemedViewVariant.Muted) },
            Story(
                id = "atoms/icon-symbol/default",
                tier = ComponentTier.Atom,
                component = "IconSymbol",
                name = "Default",
                summary = "react-native/components/ui/icon-symbol.tsx#Default",
            ) { AtomsIconStory(accent = false) },
            Story(
                id = "atoms/icon-symbol/accent",
                tier = ComponentTier.Atom,
                component = "IconSymbol",
                name = "Accent",
                summary = "react-native/components/ui/icon-symbol.tsx#ActionIcons",
            ) { AtomsIconStory(accent = true) },
            Story(
                id = "atoms/separator/horizontal",
                tier = ComponentTier.Atom,
                component = "Separator",
                name = "Horizontal",
                summary = "react-native/components/ui/separator.tsx#Horizontal",
            ) { AtomsSeparatorStory(orientation = SeparatorOrientation.Horizontal) },
            Story(
                id = "atoms/separator/vertical",
                tier = ComponentTier.Atom,
                component = "Separator",
                name = "Vertical",
                summary = "react-native/components/ui/separator.tsx#Vertical",
            ) { AtomsSeparatorStory(orientation = SeparatorOrientation.Vertical) },
            Story(
                id = "atoms/drag-handle/default",
                tier = ComponentTier.Atom,
                component = "DragHandle",
                name = "Default",
                summary = "react-native/components/ui/drag-handle.tsx#Default",
            ) { AtomsDragHandleStory(active = false) },
            Story(
                id = "atoms/drag-handle/active",
                tier = ComponentTier.Atom,
                component = "DragHandle",
                name = "Active",
                summary = "react-native/stories/components/DragHandle.stories.tsx#Rounded",
            ) { AtomsDragHandleStory(active = true) },
            Story(
                id = "atoms/sheet-handle/default",
                tier = ComponentTier.Atom,
                component = "SheetHandle",
                name = "Default",
                summary = "react-native/stories/components/DragHandle.stories.tsx#InContext",
            ) { AtomsSheetHandleStory(expanded = false) },
            Story(
                id = "atoms/sheet-handle/expanded",
                tier = ComponentTier.Atom,
                component = "SheetHandle",
                name = "Expanded",
                summary = "react-native/stories/components/DragHandle.stories.tsx#Wide",
            ) { AtomsSheetHandleStory(expanded = true) },
            Story(
                id = "atoms/theme-button/default",
                tier = ComponentTier.Atom,
                component = "ThemeButton",
                name = "Default",
                summary = "react-native/components/ui/button.tsx#Default",
            ) { ThemeButtonStory() },
            Story(
                id = "atoms/primary-button/default",
                tier = ComponentTier.Atom,
                component = "PrimaryButton",
                name = "Default",
                summary = "react-native/components/ui/primary-button.tsx#Default",
            ) { PrimaryButtonStory() },
            Story(
                id = "atoms/theme-input/default",
                tier = ComponentTier.Atom,
                component = "ThemeInput",
                name = "Default",
                summary = "react-native/components/ui/input.tsx#Default",
            ) { ThemeInputStory(error = false) },
            Story(
                id = "atoms/theme-input/error",
                tier = ComponentTier.Atom,
                component = "ThemeInput",
                name = "Error",
                summary = "react-native/components/ui/input.tsx#Error",
            ) { ThemeInputStory(error = true) },
            Story(
                id = "atoms/theme-textarea/default",
                tier = ComponentTier.Atom,
                component = "ThemeTextarea",
                name = "Default",
                summary = "react-native/components/ui/textarea.tsx#Default",
            ) { ThemeTextareaStory() },
            Story(
                id = "atoms/theme-bottom-sheet-input/default",
                tier = ComponentTier.Atom,
                component = "ThemeBottomSheetInput",
                name = "Default",
                summary = "react-native/components/ui/bottom-sheet-input.tsx#Default",
            ) { ThemeBottomSheetInputStory() },
            Story(
                id = "atoms/theme-switch/checked",
                tier = ComponentTier.Atom,
                component = "ThemeSwitch",
                name = "Checked",
                summary = "react-native/components/ui/switch.tsx#Checked",
            ) { ThemeSwitchStory() },
            Story(
                id = "atoms/theme-toggle/pressed",
                tier = ComponentTier.Atom,
                component = "ThemeToggle",
                name = "Pressed",
                summary = "react-native/components/ui/toggle.tsx#Pressed",
            ) { ThemeToggleStory() },
            Story(
                id = "atoms/theme-checkbox/checked",
                tier = ComponentTier.Atom,
                component = "ThemeCheckbox",
                name = "Checked",
                summary = "react-native/components/ui/checkbox.tsx#Checked",
            ) { ThemeCheckboxStory() },
            Story(
                id = "atoms/theme-slider/default",
                tier = ComponentTier.Atom,
                component = "ThemeSlider",
                name = "Default",
                summary = "react-native/components/ui/slider.tsx#Default",
            ) { ThemeSliderStory() },
        )
}

@Composable
private fun AtomsTextStory(emphasis: Boolean) {
    val theme = LocalLaneShadowTheme.current

    ThemedView(
        modifier = Modifier.fillMaxWidth(),
        variant = ThemedViewVariant.Surface,
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(theme.space.sm),
            modifier = Modifier.semantics { contentDescription = "ThemedText Story" },
        ) {
            ThemedText(
                text = if (emphasis) "ThemedText Emphasis" else "ThemedText Default",
                variant = if (emphasis) ThemedTextVariant.TitleLg else ThemedTextVariant.BodyMd,
            )
            ThemedText(
                text = "Token-driven typography for light and dark parity.",
                variant = ThemedTextVariant.LabelMd,
                color = theme.colors.muted.default,
            )
        }
    }
}

@Composable
private fun AtomsViewStory(variant: ThemedViewVariant) {
    ThemedView(
        modifier = Modifier.fillMaxWidth(),
        variant = variant,
    ) {
        ThemedText(
            text = "ThemedView ${variant.name}",
            variant = ThemedTextVariant.BodyMd,
            modifier = Modifier.semantics { contentDescription = "ThemedView Label" },
        )
    }
}

@Composable
private fun AtomsIconStory(accent: Boolean) {
    val theme = LocalLaneShadowTheme.current

    ThemedView(
        modifier = Modifier.fillMaxWidth(),
        variant = ThemedViewVariant.SurfaceVariant,
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(theme.space.md),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.semantics { contentDescription = "IconSymbol Row" },
        ) {
            IconSymbol(
                name = if (accent) "location" else "search",
                size = theme.space.xl,
                color = if (accent) theme.colors.accent.default else null,
                modifier = Modifier.size(theme.space.xl),
            )
            ThemedText(
                text = if (accent) "Accent Icon" else "Default Icon",
                variant = ThemedTextVariant.BodyMd,
            )
        }
    }
}

@Composable
private fun AtomsSeparatorStory(orientation: SeparatorOrientation) {
    val theme = LocalLaneShadowTheme.current

    ThemedView(
        modifier = Modifier.fillMaxWidth(),
        variant = ThemedViewVariant.Surface,
    ) {
        if (orientation == SeparatorOrientation.Horizontal) {
            Column(verticalArrangement = Arrangement.spacedBy(theme.space.sm)) {
                ThemedText("Above", variant = ThemedTextVariant.LabelMd)
                Separator(
                    orientation = orientation,
                    modifier = Modifier.height(theme.space.xs / 4),
                )
                ThemedText("Below", variant = ThemedTextVariant.LabelMd)
            }
        } else {
            Row(
                horizontalArrangement = Arrangement.spacedBy(theme.space.sm),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.height(theme.space.xxxl),
            ) {
                ThemedText("Left", variant = ThemedTextVariant.LabelMd)
                Separator(
                    orientation = orientation,
                    modifier = Modifier
                        .height(theme.space.xxxl)
                        .padding(vertical = theme.space.xs / 4),
                        // width comes from the component itself
                )
                ThemedText("Right", variant = ThemedTextVariant.LabelMd)
            }
        }
    }
}

@Composable
private fun AtomsDragHandleStory(active: Boolean) {
    val theme = LocalLaneShadowTheme.current

    Column(
        verticalArrangement = Arrangement.spacedBy(theme.space.md),
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .fillMaxWidth()
            .padding(theme.space.lg),
    ) {
        DragHandle(active = active)
        ThemedText(
            text = if (active) "Active" else "Default",
            variant = ThemedTextVariant.LabelMd,
        )
    }
}

@Composable
private fun AtomsSheetHandleStory(expanded: Boolean) {
    val theme = LocalLaneShadowTheme.current

    ThemedView(
        modifier = Modifier.fillMaxWidth(),
        variant = ThemedViewVariant.SurfaceVariant,
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(theme.space.md),
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth(),
        ) {
            SheetHandle(expanded = expanded)
            ThemedText(
                text = if (expanded) "Expanded" else "Default",
                variant = ThemedTextVariant.LabelMd,
            )
        }
    }
}

@Composable
private fun ThemeButtonStory() {
    ThemedView(modifier = Modifier.fillMaxWidth(), variant = ThemedViewVariant.Surface) {
        ThemeButton(
            onClick = {},
            variant = ThemeButtonVariant.Secondary,
            size = ThemeButtonSize.Md,
            iconName = "search",
        ) {
            ThemedText("Search Route", variant = ThemedTextVariant.LabelMd)
        }
    }
}

@Composable
private fun PrimaryButtonStory() {
    PrimaryButton(text = "Start Ride", onClick = {}, iconName = "location", modifier = Modifier.fillMaxWidth())
}

@Composable
private fun ThemeInputStory(error: Boolean) {
    var value by remember { mutableStateOf("Scenic route") }

    ThemeInput(
        value = value,
        onValueChange = { value = it },
        label = "Destination",
        placeholder = "Enter a destination",
        leftIconName = "search",
        rightIconName = if (error) "warning" else "check-circle",
        isError = error,
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun ThemeTextareaStory() {
    var value by remember { mutableStateOf("Ride notes and weather considerations.") }

    ThemeTextarea(
        value = value,
        onValueChange = { value = it },
        placeholder = "Add notes",
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun ThemeBottomSheetInputStory() {
    var value by remember { mutableStateOf("Waypoint title") }

    ThemeBottomSheetInput(
        value = value,
        onValueChange = { value = it },
        label = "Bottom Sheet",
        placeholder = "Label this stop",
        leftIconName = "location",
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun ThemeSwitchStory() {
    var checked by remember { mutableStateOf(true) }

    ThemeSwitch(
        checked = checked,
        onCheckedChange = { checked = it },
    )
}

@Composable
private fun ThemeToggleStory() {
    var pressed by remember { mutableStateOf(true) }

    ThemeToggle(
        pressed = pressed,
        onPressedChange = { pressed = it },
        variant = ThemeToggleVariant.Outline,
        iconName = "location",
        label = "Scenic",
    )
}

@Composable
private fun ThemeCheckboxStory() {
    var checked by remember { mutableStateOf(true) }

    ThemeCheckbox(
        checked = checked,
        onCheckedChange = { checked = it },
    )
}

@Composable
private fun ThemeSliderStory() {
    var value by remember { mutableFloatStateOf(0.45f) }

    ThemeSlider(
        value = value,
        onValueChange = { value = it },
        modifier = Modifier.fillMaxWidth(),
    )
}
