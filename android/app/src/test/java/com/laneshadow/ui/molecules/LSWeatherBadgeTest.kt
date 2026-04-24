package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LSWeatherBadgeTest {
    @Test
    fun rain_condition_resolves_correct_tint_and_icon() {
        val rainStyle = WeatherCondition.Rain.resolveWeatherBadgeStyle()

        assertEquals(LaneShadowTheme.color.Weather.Rain.tint, rainStyle.backgroundColor)
        assertEquals(LaneShadowTheme.color.Weather.Rain.default, rainStyle.foregroundColor)
        assertEquals(IconName.Rain, rainStyle.leadingIcon)
    }

    @Test
    fun all_six_conditions_resolve_distinct_tints() {
        val tintColors = listOf(
            WeatherCondition.Sun,
            WeatherCondition.Rain,
            WeatherCondition.Wind,
            WeatherCondition.Storm,
            WeatherCondition.Hot,
            WeatherCondition.Cold,
        ).map { condition -> condition.resolveWeatherBadgeStyle().backgroundColor }

        assertEquals(6, tintColors.size)
        assertEquals(6, tintColors.toSet().size)
        assertTrue(tintColors.distinct().size == tintColors.size)
    }
}
