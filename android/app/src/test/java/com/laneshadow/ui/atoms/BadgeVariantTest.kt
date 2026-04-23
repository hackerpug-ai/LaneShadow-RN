package com.laneshadow.ui.atoms

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BadgeVariantTest {
    @Test
    fun badgeVariant_exposes_status_and_weather_cases() {
        val variants = listOf<BadgeVariant>(
            BadgeVariant.Status.Info,
            BadgeVariant.Status.Success,
            BadgeVariant.Status.Warning,
            BadgeVariant.Status.Error,
            BadgeVariant.Status.Recording,
            BadgeVariant.Weather.Clear,
            BadgeVariant.Weather.Rain,
            BadgeVariant.Weather.Wind,
            BadgeVariant.Weather.Storm,
            BadgeVariant.Weather.Hot,
            BadgeVariant.Weather.Cold,
        )

        assertEquals(11, variants.distinct().size)
        assertTrue(variants.any { it is BadgeVariant.Status.Recording })
        assertTrue(variants.any { it is BadgeVariant.Weather.Cold })
    }

    @Test
    fun badge_sources_avoid_forbidden_color_font_and_material_icon_literals() {
        val sources = listOf(
            File("../app/src/main/java/com/laneshadow/ui/atoms/LSBadge.kt").readText(),
            File("../app/src/main/java/com/laneshadow/ui/atoms/LSBestBadge.kt").readText(),
            File("../app/src/main/java/com/laneshadow/ui/atoms/BadgeVariant.kt").readText(),
        ).joinToString(separator = "\n")

        assertFalse(Regex("""Color\(0x""").containsMatchIn(sources))
        assertFalse(Regex("""FontFamily\.Serif""").containsMatchIn(sources))
        assertFalse(Regex("""androidx\.compose\.material\.icons""").containsMatchIn(sources))
        assertFalse(Regex("""Icons\.(Filled|Outlined)""").containsMatchIn(sources))
    }
}
