package com.laneshadow.theme

data class LaneShadowColors(
    val primary: ColorSet,
    val secondary: ColorSet,
    val tertiary: ColorSet,
    val success: ColorSet,
    val warning: ColorSet,
    val warningContainer: ColorSet,
    val onWarningContainer: ColorSet,
    val danger: ColorSet,
    val info: ColorSet,
    val surface: ColorSet,
    val surfaceVariant: ColorSet,
    val background: ColorSet,
    val onSurface: ColorSet,
    val onPrimary: ColorSet,
    val onSecondary: ColorSet,
    val secondaryContainer: ColorSet,
    val onSecondaryContainer: ColorSet,
    val border: ColorSet,
    val input: ColorSet,
    val ring: ColorSet,
    val card: ColorSet,
    val popover: ColorSet,
    val accent: ColorSet,
    val muted: ColorSet,
    val divider: ColorSet,
    val scrim: ColorSet,
    val routeSelected: ColorSet,
    val routeAlternate: ColorSet,
) {
    companion object {
        fun from(tokens: SemanticTokens, darkMode: Boolean): LaneShadowColors {
            val m = if (darkMode) tokens.color.dark else tokens.color.light
            return LaneShadowColors(
                primary = colorSet(m, "primary"),
                secondary = colorSet(m, "secondary"),
                tertiary = colorSet(m, "tertiary"),
                success = colorSet(m, "success"),
                warning = colorSet(m, "warning"),
                warningContainer = colorSet(m, "warningContainer"),
                onWarningContainer = colorSet(m, "onWarningContainer"),
                danger = colorSet(m, "danger"),
                info = colorSet(m, "info"),
                surface = colorSet(m, "surface"),
                surfaceVariant = colorSet(m, "surfaceVariant"),
                background = colorSet(m, "background"),
                onSurface = colorSet(m, "onSurface"),
                onPrimary = colorSet(m, "onPrimary"),
                onSecondary = colorSet(m, "onSecondary"),
                secondaryContainer = colorSet(m, "secondaryContainer"),
                onSecondaryContainer = colorSet(m, "onSecondaryContainer"),
                border = colorSet(m, "border"),
                input = colorSet(m, "input"),
                ring = colorSet(m, "ring"),
                card = colorSet(m, "card"),
                popover = colorSet(m, "popover"),
                accent = colorSet(m, "accent"),
                muted = colorSet(m, "muted"),
                divider = colorSet(m, "divider"),
                scrim = colorSet(m, "scrim"),
                routeSelected = colorSet(m, "routeSelected"),
                routeAlternate = colorSet(m, "routeAlternate"),
            )
        }
    }
}

internal fun colorSet(mode: Map<String, ColorStatesDefDto>, key: String): ColorSet {
    val group = mode[key] ?: error("LaneShadowTheme: missing color group '$key' in semantic.tokens.json")
    return ColorSet(
        default = parseColorString(group.defaultColor.value),
        hover = group.hover?.let { parseColorString(it.value) },
        pressed = group.pressed?.let { parseColorString(it.value) },
        disabled = group.disabled?.let { parseColorString(it.value) },
        focus = group.focus?.let { parseColorString(it.value) },
    )
}
