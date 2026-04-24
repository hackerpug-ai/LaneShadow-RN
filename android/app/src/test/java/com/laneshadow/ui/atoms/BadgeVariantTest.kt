package com.laneshadow.ui.atoms

import org.junit.Assert.assertEquals
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
}
