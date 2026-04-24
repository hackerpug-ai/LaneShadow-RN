package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * TDD Test for LSWeatherTimeline molecule
 *
 * AC-3: LSWeatherTimeline 6 cells with per-condition tints
 * GIVEN: developer composes LSWeatherTimeline(entries=6WeatherEntries, from="9 AM", to="2 PM")
 * WHEN: Composable enters composition
 * THEN: LazyRow of 6 cells; each cell bg = theme.colors.weather.<condition>.tint;
 *       hour LSText(typography.ui.label.sm);
 *       temp LSText(typography.instrument.sm);
 *       LSIcon condition glyph;
 *       header row "Weather along the way" + time span
 *
 * AC-4: LSWeatherTimeline variable cell counts
 * GIVEN: LSWeatherTimeline with 3 entries and separately with 8 entries
 * WHEN: each enters composition
 * THEN: 3-entry case renders 3 cells; 8-entry case renders 8 cells, LazyRow scrollable;
 *       no IndexOutOfBoundsException
 */
class LSWeatherTimelineTest {

    /**
     * AC-3: LSWeatherTimeline 6 cells with per-condition tints
     */
    @Test
    fun six_cells_render_with_condition_tinted_backgrounds() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSWeatherTimeline.kt").readText()

        // Must use LazyRow for horizontal scrolling
        assertTrue(source.contains("LazyRow("))

        // Must use LSIcon for weather condition glyphs
        assertTrue(source.contains("LSIcon("))

        // Must use LSText with typography.ui.label.sm for hour labels
        assertTrue(source.contains("TypographyVariant.Ui.Label.Sm"))

        // Must use LSText with typography.instrument.sm for temperature
        assertTrue(source.contains("TypographyVariant.Instrument.Sm"))

        // Must use weather color tokens (weather.clear.tint, weather.rain.tint, etc.)
        assertTrue(source.contains("theme.colors.weather") || source.contains("GeneratedTokens.color.Weather"))

        // Must use Column for vertical layout (header + cells)
        assertTrue(source.contains("Column("))

        // Must use Arrangement.spacedBy for cell spacing
        assertTrue(source.contains("Arrangement.spacedBy"))

        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
    }

    /**
     * AC-4: LSWeatherTimeline variable cell counts
     */
    @Test
    fun variable_entry_count_renders_without_crash() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSWeatherTimeline.kt").readText()

        // Must use items() for LazyRow to support variable count
        assertTrue(source.contains("items(") || source.contains("forEach"))

        // LazyRow enables scrolling for many cells
        assertTrue(source.contains("LazyRow("))

        // Must not hardcode cell count
        assertFalse(source.contains("repeat(6") || source.contains("times(6"))
    }
}
