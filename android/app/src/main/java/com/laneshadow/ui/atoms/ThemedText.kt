package com.laneshadow.ui.atoms

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import com.laneshadow.theme.LaneShadowThemeValues
import com.laneshadow.theme.LocalLaneShadowTheme

@Composable
fun ThemedText(
    text: String,
    modifier: Modifier = Modifier,
    variant: ThemedTextVariant = ThemedTextVariant.BodyMd,
    color: Color? = null,
) {
    val theme = LocalLaneShadowTheme.current

    Text(
        text = text,
        modifier = modifier,
        style = variant.textStyle(theme),
        color = color ?: theme.colors.onSurface.default,
    )
}

enum class ThemedTextVariant {
    LabelSm,
    LabelMd,
    LabelLg,
    BodySm,
    BodyMd,
    BodyLg,
    TitleSm,
    TitleMd,
    TitleLg,
    HeadingSm,
    HeadingMd,
    HeadingLg,
    DisplaySm,
    DisplayMd,
    DisplayLg,
}

internal fun ThemedTextVariant.textStyle(theme: LaneShadowThemeValues): TextStyle =
    when (this) {
        ThemedTextVariant.LabelSm -> theme.type.label.sm
        ThemedTextVariant.LabelMd -> theme.type.label.md
        ThemedTextVariant.LabelLg -> theme.type.label.lg
        ThemedTextVariant.BodySm -> theme.type.body.sm
        ThemedTextVariant.BodyMd -> theme.type.body.md
        ThemedTextVariant.BodyLg -> theme.type.body.lg
        ThemedTextVariant.TitleSm -> theme.type.title.sm
        ThemedTextVariant.TitleMd -> theme.type.title.md
        ThemedTextVariant.TitleLg -> theme.type.title.lg
        ThemedTextVariant.HeadingSm -> theme.type.heading.sm
        ThemedTextVariant.HeadingMd -> theme.type.heading.md
        ThemedTextVariant.HeadingLg -> theme.type.heading.lg
        ThemedTextVariant.DisplaySm -> theme.type.display.sm
        ThemedTextVariant.DisplayMd -> theme.type.display.md
        ThemedTextVariant.DisplayLg -> theme.type.display.lg
    }
