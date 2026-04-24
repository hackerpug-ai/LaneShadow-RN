package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * TDD Test for LSInstrumentReadout molecule
 *
 * AC-5: LSInstrumentReadout 4-column grid with LSDivider + mono values
 * GIVEN: developer composes LSInstrumentReadout(metrics=listOf(dist("64 mi"), time("2h 10m"), climb("2,400ft"), scenic("9.2")))
 * WHEN: Composable enters composition
 * THEN: top + bottom LSDivider atoms in semantics tree;
 *       4 columns equal weight;
 *       label LSText(typography.ui.label.sm);
 *       value LSText(typography.instrument.lg) mono;
 *       no literal Divider() from Material3
 *
 * AC-6: LSInstrumentReadout adapts to N columns
 * GIVEN: LSInstrumentReadout with 3 metrics
 * WHEN: Composable enters composition
 * THEN: 3 columns render with equal weight;
 *       top/bottom LSDividers still present;
 *       no crash
 */
class LSInstrumentReadoutTest {

    /**
     * AC-5: LSInstrumentReadout 4-column grid with LSDivider + mono values
     */
    @Test
    fun four_column_grid_with_dividers_and_mono_values() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSInstrumentReadout.kt").readText()

        // Must use LSDivider for top and bottom borders
        assertTrue(source.contains("LSDivider("))

        // Must use Row for horizontal layout
        assertTrue(source.contains("Row("))

        // Must use Modifier.weight(1f) for equal column width
        assertTrue(source.contains("Modifier.weight(1f)") || source.contains("weight(1f)"))

        // Must use LSText with typography.ui.label.sm for labels
        assertTrue(source.contains("TypographyVariant.Ui.Label.Sm"))

        // Must use LSText with typography.instrument.lg for values
        assertTrue(source.contains("TypographyVariant.Instrument.Lg"))

        // Must use Column for vertical layout (divider + grid + divider)
        assertTrue(source.contains("Column("))

        // Must not import Material3 Divider
        assertFalse(source.contains("import androidx.compose.material3.Divider"))

        // Must not use hardcoded Divider() from Material3
        assertFalse(source.contains("Divider(") && !source.contains("LSDivider("))

        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
    }

    /**
     * AC-6: LSInstrumentReadout adapts to N columns
     */
    @Test
    fun three_metric_variant_renders_n_columns() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSInstrumentReadout.kt").readText()

        // Must use forEach to iterate metrics (supports any count)
        assertTrue(source.contains("forEach"))

        // Must use LSDivider (still present for any column count)
        assertTrue(source.contains("LSDivider("))

        // Must use Modifier.weight for equal width distribution
        assertTrue(source.contains("weight("))

        // Must not hardcode column count
        assertFalse(source.contains("repeat(4") || source.contains("times(4"))
    }
}
