package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * TDD Test for LSPhaseIndicator molecule
 *
 * AC-1: LSPhaseIndicator renders compass chip + header + LSPhaseDot list
 * GIVEN: developer composes LSPhaseIndicator(phases=mockPhases, header="Let me think on that…")
 * WHEN: Composable enters composition with 5 phases (1 active, 2 done, 2 pending)
 * THEN: leading compass chip = LSIcon(.compass, color=.signal) inside LSPill(size=sm) with 22%-tinted color.signal.default bg;
 *       header LSText(typography.opinion.md);
 *       each step LSPhaseDot at correct state;
 *       step labels LSText(typography.instrument.sm) mono
 */
class LSPhaseIndicatorTest {

    /**
     * AC-1: LSPhaseIndicator renders compass chip + header + LSPhaseDot list
     */
    @Test
    fun renders_compass_chip_header_and_phase_dot_list() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt").readText()

        // Must use LSIcon.Compass for compass chip
        assertTrue(source.contains("IconName.Compass"))

        // Must use LSPill for compass chip container
        assertTrue(source.contains("LSPill("))

        // Must use PillSize.Sm for compass chip
        assertTrue(source.contains("PillSize.Sm"))

        // Must use LSText with typography.opinion.md for header
        assertTrue(source.contains("TypographyVariant.Opinion.Md"))

        // Must use LSPhaseDot for each step
        assertTrue(source.contains("LSPhaseDot("))

        // Must use LSText with typography.instrument.sm for step labels
        assertTrue(source.contains("TypographyVariant.Instrument.Sm"))

        // Must use Column for vertical layout
        assertTrue(source.contains("Column("))

        // Must use Arrangement.spacedBy for step spacing
        assertTrue(source.contains("Arrangement.spacedBy"))

        // Must use color.signal.default with alpha for compass chip bg
        assertTrue(source.contains("GeneratedTokens.color.Signal.default") || source.contains("theme.colors.signal.default"))

        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
    }

    /**
     * AC-2: phaseDotPulse animation present via LSPhaseDot delegation
     */
    @Test
    fun active_step_has_phase_dot_pulse_via_delegation() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt").readText()

        // Must NOT reimplement phaseDotPulse animation
        assertFalse(source.contains("InfiniteTransition"))
        assertFalse(source.contains("animateFloat"))
        assertFalse(source.contains("phaseDotPulse"))

        // Must delegate to LSPhaseDot for Active state
        assertTrue(source.contains("PhaseDotState.Active"))

        // LSPhaseDot handles its own animation — molecule just passes state
        assertTrue(source.contains("LSPhaseDot("))
    }
}
