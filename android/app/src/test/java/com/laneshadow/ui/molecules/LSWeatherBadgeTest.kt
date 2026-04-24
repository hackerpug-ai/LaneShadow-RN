package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSWeatherBadgeTest {
    @Test
    fun rain_condition_resolves_correct_tint_and_icon() {
        val rainStyle = WeatherCondition.Rain.resolveWeatherBadgeStyle()
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt").readText()

        assertEquals(LaneShadowTheme.color.Weather.Rain.tint, rainStyle.backgroundColor)
        assertEquals(LaneShadowTheme.color.Weather.Rain.default, rainStyle.foregroundColor)
        assertEquals(LaneShadowTheme.color.Weather.Rain.default, rainStyle.borderColor)
        assertEquals(IconName.Rain, rainStyle.leadingIcon)
        assertTrue(source.contains("LSText("))
        assertTrue(source.contains("color = style.iconColor.asTextColor()"))
        assertFalse(source.contains("import androidx.compose.material3.Text"))
        assertFalse(source.contains("color = ContentColor.Primary"))
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
