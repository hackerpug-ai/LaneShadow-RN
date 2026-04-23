package com.laneshadow.ui.atoms

sealed interface GlassVariant {
    data object Chrome : GlassVariant

    data class Callout(val accent: AccentColor) : GlassVariant
}
