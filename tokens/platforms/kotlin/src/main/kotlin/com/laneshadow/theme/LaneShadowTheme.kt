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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens

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

data class LaneShadowElevationLevel(
    val level0: Dp,
    val level1: Dp,
    val level2: Dp,
    val level3: Dp,
    val level4: Dp,
    val level5: Dp,
    val level8: Dp,
)

data class LaneShadowElevation(
    val light: LaneShadowElevationLevel,
    val dark: LaneShadowElevationLevel,
)

data class LaneShadowMotionDuration(
    val fast: Int,
    val standard: Int,
    val slow: Int,
    val slower: Int,
)

data class LaneShadowMotionEasing(
    val linear: List<Double>,
    val easeIn: List<Double>,
    val easeOut: List<Double>,
    val easeInOut: List<Double>,
)

data class LaneShadowMotion(
    val duration: Map<String, Int>,
    val delay: Map<String, Int>,
    val scale: Map<String, Double>,
    val easing: Map<String, List<Double>>,
)

data class LaneShadowOpacity(
    val values: Map<String, Float>,
)

data class LaneShadowTypeScale(val sm: TextStyle, val md: TextStyle, val lg: TextStyle)

data class LaneShadowType(
    val label: LaneShadowTypeScale,
    val body: LaneShadowTypeScale,
    val title: LaneShadowTypeScale,
    val heading: LaneShadowTypeScale,
    val display: LaneShadowTypeScale,
)

data class LaneShadowOpinionTypography(
    val xl: TextStyle = GeneratedTokens.typography.opinion.xl,
    val lg: TextStyle = GeneratedTokens.typography.opinion.lg,
    val md: TextStyle = GeneratedTokens.typography.opinion.md,
    val sm: TextStyle = GeneratedTokens.typography.opinion.sm,
)

data class LaneShadowUiTitleTypography(
    val lg: TextStyle = GeneratedTokens.typography.ui.title.lg,
    val md: TextStyle = GeneratedTokens.typography.ui.title.md,
    val sm: TextStyle = GeneratedTokens.typography.ui.title.sm,
)

data class LaneShadowUiBodyTypography(
    val lg: TextStyle = GeneratedTokens.typography.ui.body.lg,
    val md: TextStyle = GeneratedTokens.typography.ui.body.md,
    val sm: TextStyle = GeneratedTokens.typography.ui.body.sm,
)

data class LaneShadowUiLabelTypography(
    val lg: TextStyle = GeneratedTokens.typography.ui.label.lg,
    val md: TextStyle = GeneratedTokens.typography.ui.label.md,
    val sm: TextStyle = GeneratedTokens.typography.ui.label.sm,
)

data class LaneShadowUiTypography(
    val title: LaneShadowUiTitleTypography = LaneShadowUiTitleTypography(),
    val body: LaneShadowUiBodyTypography = LaneShadowUiBodyTypography(),
    val label: LaneShadowUiLabelTypography = LaneShadowUiLabelTypography(),
)

data class LaneShadowInstrumentTypography(
    val lg: TextStyle = GeneratedTokens.typography.instrument.lg,
    val md: TextStyle = GeneratedTokens.typography.instrument.md,
    val sm: TextStyle = GeneratedTokens.typography.instrument.sm,
    val xs: TextStyle = GeneratedTokens.typography.instrument.xs,
)

data class LaneShadowTypography(
    val opinion: LaneShadowOpinionTypography = LaneShadowOpinionTypography(),
    val ui: LaneShadowUiTypography = LaneShadowUiTypography(),
    val instrument: LaneShadowInstrumentTypography = LaneShadowInstrumentTypography(),
)

data class LaneShadowContentColors(
    val primary: Color,
    val secondary: Color,
    val tertiary: Color,
    val subtle: Color,
    val onSignal: Color,
)

data class LaneShadowIconSizing(
    val xs: Dp = GeneratedTokens.sizing.icon.xs,
    val sm: Dp = GeneratedTokens.sizing.icon.sm,
    val md: Dp = GeneratedTokens.sizing.icon.md,
    val lg: Dp = GeneratedTokens.sizing.icon.lg,
    val xl: Dp = GeneratedTokens.sizing.icon.xl,
)

data class LaneShadowSizing(
    val icon: LaneShadowIconSizing = LaneShadowIconSizing(),
)

data class LaneShadowIconStroke(
    val width: Dp = GeneratedTokens.icon.stroke.width,
)

data class LaneShadowIconTokens(
    val stroke: LaneShadowIconStroke = LaneShadowIconStroke(),
)

data class LaneShadowThemeValues(
    val colors: LaneShadowColors,
    val space: LaneShadowSpace,
    val radius: LaneShadowRadius,
    val type: LaneShadowType,
    val elevation: LaneShadowElevation,
    val motion: LaneShadowMotion,
    val opacity: LaneShadowOpacity,
    val domain: DomainColors,
    val typography: LaneShadowTypography = LaneShadowTypography(),
    val content: LaneShadowContentColors = contentValues(colors),
    val sizing: LaneShadowSizing = LaneShadowSizing(),
    val icon: LaneShadowIconTokens = LaneShadowIconTokens(),
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

private fun textStyleFrom(def: TypeStyleDefDto): TextStyle =
    TextStyle(
        fontSize = def.fontSize.value.sp,
        lineHeight = def.lineHeight.value.sp,
        fontWeight = fontWeightFrom(def.fontWeight.value),
    )

internal fun spaceValues(tokens: SemanticTokens): LaneShadowSpace {
    val s = tokens.space
    return LaneShadowSpace(
        xs = requireNotNull(s["xs"]).value.dp,
        sm = requireNotNull(s["sm"]).value.dp,
        md = requireNotNull(s["md"]).value.dp,
        lg = requireNotNull(s["lg"]).value.dp,
        xl = requireNotNull(s["xl"]).value.dp,
        xxl = requireNotNull(s["2xl"]).value.dp,
        xxxl = requireNotNull(s["3xl"]).value.dp,
        xxxxl = requireNotNull(s["4xl"]).value.dp,
    )
}

internal fun radiusValues(tokens: SemanticTokens): LaneShadowRadius {
    val r = tokens.radius
    return LaneShadowRadius(
        none = requireNotNull(r["none"]).value.dp,
        sm = requireNotNull(r["sm"]).value.dp,
        md = requireNotNull(r["md"]).value.dp,
        lg = requireNotNull(r["lg"]).value.dp,
        xl = requireNotNull(r["xl"]).value.dp,
        xxl = requireNotNull(r["2xl"]).value.dp,
        full = requireNotNull(r["full"]).value.dp,
    )
}

internal fun elevationValues(tokens: SemanticTokens): LaneShadowElevation {
    val e = tokens.elevation
    fun level(map: Map<String, com.laneshadow.theme.ElevationDefDto>, key: String) =
        requireNotNull(map[key]).elevation.value.dp

    return LaneShadowElevation(
        light = LaneShadowElevationLevel(
            level0 = level(e.light, "0"),
            level1 = level(e.light, "1"),
            level2 = level(e.light, "2"),
            level3 = level(e.light, "3"),
            level4 = level(e.light, "4"),
            level5 = level(e.light, "5"),
            level8 = level(e.light, "8"),
        ),
        dark = LaneShadowElevationLevel(
            level0 = level(e.dark, "0"),
            level1 = level(e.dark, "1"),
            level2 = level(e.dark, "2"),
            level3 = level(e.dark, "3"),
            level4 = level(e.dark, "4"),
            level5 = level(e.dark, "5"),
            level8 = level(e.dark, "8"),
        ),
    )
}

internal fun motionValues(tokens: SemanticTokens): LaneShadowMotion {
    val m = tokens.motion
    val duration = m.duration.mapValues { (_, dto) -> dto.value.toInt() }
    val delay = m.delay?.mapValues { (_, dto) -> dto.value.toInt() } ?: emptyMap()
    val scale = m.scale?.mapValues { (_, dto) -> dto.value } ?: emptyMap()
    val easing = m.easing.mapValues { (_, dto) -> dto.value }

    return LaneShadowMotion(
        duration = duration,
        delay = delay,
        scale = scale,
        easing = easing,
    )
}

internal fun opacityValues(tokens: SemanticTokens): LaneShadowOpacity {
    val o = tokens.opacity
    val values = o.mapValues { (_, dto) -> dto.value.toFloat() }

    return LaneShadowOpacity(values = values)
}

internal fun typeValues(tokens: SemanticTokens): LaneShadowType {
    val t = tokens.type
    return LaneShadowType(
        label = LaneShadowTypeScale(textStyleFrom(t.label.sm), textStyleFrom(t.label.md), textStyleFrom(t.label.lg)),
        body = LaneShadowTypeScale(textStyleFrom(t.body.sm), textStyleFrom(t.body.md), textStyleFrom(t.body.lg)),
        title = LaneShadowTypeScale(textStyleFrom(t.title.sm), textStyleFrom(t.title.md), textStyleFrom(t.title.lg)),
        heading = LaneShadowTypeScale(textStyleFrom(t.heading.sm), textStyleFrom(t.heading.md), textStyleFrom(t.heading.lg)),
        display = LaneShadowTypeScale(textStyleFrom(t.display.sm), textStyleFrom(t.display.md), textStyleFrom(t.display.lg)),
    )
}

internal fun contentValues(colors: LaneShadowColors): LaneShadowContentColors =
    LaneShadowContentColors(
        primary = colors.onSurface.default,
        secondary = colors.onSecondary.default,
        tertiary = colors.tertiary.default,
        subtle = colors.muted.default,
        onSignal = colors.onPrimary.default,
    )

internal fun materialColorScheme(colors: LaneShadowColors, dark: Boolean): ColorScheme {
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

/** Build LaneShadowThemeValues from a decoded SemanticTokens DTO. Pure; unit-testable. */
fun laneShadowThemeValues(tokens: SemanticTokens, darkTheme: Boolean): LaneShadowThemeValues =
    LaneShadowColors.from(tokens, darkTheme).let { colors ->
        LaneShadowThemeValues(
            colors = colors,
            space = spaceValues(tokens),
            radius = radiusValues(tokens),
            type = typeValues(tokens),
            elevation = elevationValues(tokens),
            motion = motionValues(tokens),
            opacity = opacityValues(tokens),
            domain = DomainColors.from(tokens, darkTheme),
            content = contentValues(colors),
        )
    }

@Composable
fun LaneShadowTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current.applicationContext
    val tokens = remember { ThemeLoader.fromAssets(context) }
    val themeValues = remember(darkTheme, tokens) { laneShadowThemeValues(tokens, darkTheme) }

    CompositionLocalProvider(LocalLaneShadowTheme provides themeValues) {
        MaterialTheme(
            colorScheme = materialColorScheme(themeValues.colors, darkTheme),
            content = content,
        )
    }
}
