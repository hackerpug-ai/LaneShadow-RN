package com.laneshadow.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ProvidableCompositionLocal
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.generated.Tokens

data class LaneShadowSpace(
    val xs: Dp,
    val sm: Dp,
    val md: Dp,
    val lg: Dp,
    val xl: Dp,
    val xxl: Dp,
    val xxxl: Dp,
    val xxxxl: Dp,
)

data class LaneShadowRadius(
    val none: Dp,
    val sm: Dp,
    val md: Dp,
    val lg: Dp,
    val xl: Dp,
    val xxl: Dp,
    val full: Dp,
)

data class LaneShadowTypeScale(val sm: TextStyle, val md: TextStyle, val lg: TextStyle)

data class LaneShadowType(
    val label: LaneShadowTypeScale,
    val body: LaneShadowTypeScale,
    val title: LaneShadowTypeScale,
    val heading: LaneShadowTypeScale,
    val display: LaneShadowTypeScale,
)

data class LaneShadowThemeValues(
    val colors: LaneShadowColors,
    val space: LaneShadowSpace,
    val radius: LaneShadowRadius,
    val type: LaneShadowType,
    val domain: DomainColors,
)

val LocalLaneShadowTheme: ProvidableCompositionLocal<LaneShadowThemeValues> =
    compositionLocalOf { error("LaneShadowTheme not provided") }

private fun fontWeightFrom(raw: String): FontWeight =
    when (raw) {
        "100" -> FontWeight.Thin
        "200" -> FontWeight.ExtraLight
        "300" -> FontWeight.Light
        "400", "normal" -> FontWeight.Normal
        "500" -> FontWeight.Medium
        "600" -> FontWeight.SemiBold
        "700", "bold" -> FontWeight.Bold
        "800" -> FontWeight.ExtraBold
        "900" -> FontWeight.Black
        else -> FontWeight.Normal
    }

private fun ts(fontSize: Dp, lineHeight: Dp, weightRaw: String): TextStyle =
    TextStyle(
        fontSize = fontSize.value.sp,
        lineHeight = lineHeight.value.sp,
        fontWeight = fontWeightFrom(weightRaw),
    )

private fun spaceValues(): LaneShadowSpace {
    val S = Tokens.Semantic.Space
    return LaneShadowSpace(
        xs = S.xs, sm = S.sm, md = S.md, lg = S.lg,
        xl = S.xl, xxl = S.`_2xl`, xxxl = S.`_3xl`, xxxxl = S.`_4xl`,
    )
}

private fun radiusValues(): LaneShadowRadius {
    val R = Tokens.Semantic.Radius
    return LaneShadowRadius(
        none = R.none, sm = R.sm, md = R.md, lg = R.lg,
        xl = R.xl, xxl = R.`_2xl`, full = R.full,
    )
}

private fun typeValues(): LaneShadowType {
    val T = Tokens.Semantic.Type
    return LaneShadowType(
        label = LaneShadowTypeScale(
            ts(T.Label.Sm.fontSize, T.Label.Sm.lineHeight, T.Label.Sm.fontWeight),
            ts(T.Label.Md.fontSize, T.Label.Md.lineHeight, T.Label.Md.fontWeight),
            ts(T.Label.Lg.fontSize, T.Label.Lg.lineHeight, T.Label.Lg.fontWeight),
        ),
        body = LaneShadowTypeScale(
            ts(T.Body.Sm.fontSize, T.Body.Sm.lineHeight, T.Body.Sm.fontWeight),
            ts(T.Body.Md.fontSize, T.Body.Md.lineHeight, T.Body.Md.fontWeight),
            ts(T.Body.Lg.fontSize, T.Body.Lg.lineHeight, T.Body.Lg.fontWeight),
        ),
        title = LaneShadowTypeScale(
            ts(T.Title.Sm.fontSize, T.Title.Sm.lineHeight, T.Title.Sm.fontWeight),
            ts(T.Title.Md.fontSize, T.Title.Md.lineHeight, T.Title.Md.fontWeight),
            ts(T.Title.Lg.fontSize, T.Title.Lg.lineHeight, T.Title.Lg.fontWeight),
        ),
        heading = LaneShadowTypeScale(
            ts(T.Heading.Sm.fontSize, T.Heading.Sm.lineHeight, T.Heading.Sm.fontWeight),
            ts(T.Heading.Md.fontSize, T.Heading.Md.lineHeight, T.Heading.Md.fontWeight),
            ts(T.Heading.Lg.fontSize, T.Heading.Lg.lineHeight, T.Heading.Lg.fontWeight),
        ),
        display = LaneShadowTypeScale(
            ts(T.Display.Sm.fontSize, T.Display.Sm.lineHeight, T.Display.Sm.fontWeight),
            ts(T.Display.Md.fontSize, T.Display.Md.lineHeight, T.Display.Md.fontWeight),
            ts(T.Display.Lg.fontSize, T.Display.Lg.lineHeight, T.Display.Lg.fontWeight),
        ),
    )
}

private fun materialColorScheme(colors: LaneShadowColors, dark: Boolean): ColorScheme {
    val base = if (dark) darkColorScheme() else lightColorScheme()
    return base.copy(
        primary = colors.primary.default,
        onPrimary = colors.onPrimary.default,
        secondary = colors.secondary.default,
        onSecondary = colors.onSecondary.default,
        tertiary = colors.tertiary.default,
        background = colors.background.default,
        onBackground = colors.onSurface.default,
        surface = colors.surface.default,
        onSurface = colors.onSurface.default,
        surfaceVariant = colors.surfaceVariant.default,
        error = colors.danger.default,
    )
}

@Composable
fun LaneShadowTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val themeValues = remember(darkTheme) {
        val colors = if (darkTheme) LaneShadowColors.dark() else LaneShadowColors.light()
        val domain = if (darkTheme) DomainColors.dark() else DomainColors.light()
        LaneShadowThemeValues(
            colors = colors,
            space = spaceValues(),
            radius = radiusValues(),
            type = typeValues(),
            domain = domain,
        )
    }

    CompositionLocalProvider(LocalLaneShadowTheme provides themeValues) {
        MaterialTheme(
            colorScheme = materialColorScheme(themeValues.colors, darkTheme),
            content = content,
        )
    }
}
