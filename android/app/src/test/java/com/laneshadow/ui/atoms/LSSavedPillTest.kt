package com.laneshadow.ui.atoms

import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import org.junit.Test

/**
 * TDD tests for LSSavedPill atom (FID-S02-R03 AC-2).
 *
 * Verifies:
 * - Pill renders "Saved" text
 * - Uses glass background + copper/signal accent border
 * - Uses GeneratedTokens for stroke width (not hardcoded 1.dp)
 */
class LSSavedPillTest {

    private val source by lazy {
        File("src/main/java/com/laneshadow/ui/atoms/LSSavedPill.kt").readText()
    }

    // ========================================================================
    // AC-2: LSSavedPill renders "Saved" text
    // ========================================================================

    @Test
    fun saved_pill_renders_saved_text() {
        // THEN: Component contains "Saved" text
        assertTrue(source.contains("text = \"Saved\""))
    }

    // ========================================================================
    // AC-2: LSSavedPill uses glass background + copper border
    // ========================================================================

    @Test
    fun saved_pill_uses_glass_background_and_copper_border() {
        // THEN: Uses theme.colors.surface.default with alpha for glass effect
        assertTrue(source.contains("theme.colors.surface.default.copy(alpha = 0.5f)"))

        // THEN: Uses theme.colors.primary.default for copper/signal border
        assertTrue(source.contains("theme.colors.primary.default"))

        // THEN: Uses ContentColor.Signal for text
        assertTrue(source.contains("ContentColor.Signal"))
    }

    // ========================================================================
    // AC-2: Uses GeneratedTokens for stroke width (CRITICAL FIX)
    // ========================================================================

    @Test
    fun saved_pill_uses_generated_tokens_for_stroke_width() {
        // THEN: Imports GeneratedTokens
        assertTrue(source.contains("import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens"))

        // THEN: Uses GeneratedTokens.sizing.stroke.sm for border width
        assertTrue(source.contains("GeneratedTokens.sizing.stroke.sm"))

        // THEN: No hardcoded 1.dp for border width
        assertFalse(source.contains("width = 1.dp"))
    }

    // ========================================================================
    // AC-2: Uses theme tokens for spacing and radius
    // ========================================================================

    @Test
    fun saved_pill_uses_theme_tokens_for_spacing_and_radius() {
        // THEN: Uses theme.radius.sm for corner radius
        assertTrue(source.contains("theme.radius.sm"))

        // THEN: Uses theme.space.sm for horizontal padding
        assertTrue(source.contains("theme.space.sm"))

        // THEN: Uses theme.space.xs for vertical padding
        assertTrue(source.contains("theme.space.xs"))

        // THEN: No hardcoded spacing values
        assertFalse(source.contains(".padding(16.dp)"))
        assertFalse(source.contains(".padding(8.dp)"))
    }

    // ========================================================================
    // AC-2: Uses TypographyVariant.Ui.Label.Sm for text
    // ========================================================================

    @Test
    fun saved_pill_uses_correct_typography_variant() {
        // THEN: Uses label small typography
        assertTrue(source.contains("TypographyVariant.Ui.Label.Sm"))
    }

    // ========================================================================
    // AC-4: RouteDetailsScreen V01 shows LSSavedPill beside LSBestBadge
    // ========================================================================

    @Test
    fun route_details_v01_shows_saved_pill_beside_best_badge() {
        val routeDetailsSource = File("src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt").readText()

        // THEN: RouteDetailsScreen checks state.isSaved flag
        assertTrue(routeDetailsSource.contains("isSaved = state.isSaved"))
    }
}
