package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Assert.assertFalse
import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * TDD tests for LSCancelConfirmSheet molecule (FID-S02-R03 AC-1, AC-3).
 *
 * Verifies:
 * - Dialog composes from LS atoms (LSText, LSButton)
 * - Callbacks are properly wired (no println stubs)
 * - Uses theme tokens for colors, spacing, radius
 */
class LSCancelConfirmSheetTest {

    private val source by lazy {
        File("src/main/java/com/laneshadow/ui/molecules/LSCancelConfirmSheet.kt").readText()
    }

    // ========================================================================
    // AC-1: LSCancelConfirmSheet renders with title and body
    // ========================================================================

    @Test
    fun cancel_confirm_sheet_composes_from_ls_atoms() {
        // THEN: Component uses Dialog foundation
        assertTrue(source.contains("Dialog("))

        // THEN: Uses LSText for title and body
        assertTrue(source.contains("LSText("))
        assertTrue(source.contains("TypographyVariant.Opinion.Lg"))
        assertTrue(source.contains("TypographyVariant.Opinion.Sm"))

        // THEN: Uses LSButton for actions
        assertTrue(source.contains("LSButton("))
        assertTrue(source.contains("ButtonVariant.Tertiary"))
        assertTrue(source.contains("ButtonVariant.Primary"))
    }

    // ========================================================================
    // AC-1: Callbacks are properly wired (no println stubs)
    // ========================================================================

    @Test
    fun cancel_confirm_sheet_has_real_callbacks_not_println_stubs() {
        // THEN: onKeep callback parameter exists
        assertTrue(source.contains("onKeep: () -> Unit"))

        // THEN: onCancel callback parameter exists
        assertTrue(source.contains("onCancel: () -> Unit"))

        // THEN: onDismiss callback parameter exists
        assertTrue(source.contains("onDismiss: () -> Unit"))

        // THEN: No println stubs in this component
        assertFalse(source.contains("println("))
    }

    // ========================================================================
    // AC-1: Uses theme tokens (no hardcoded values)
    // ========================================================================

    @Test
    fun cancel_confirm_sheet_uses_theme_tokens() {
        // THEN: Uses theme.colors.surface.default for background
        assertTrue(source.contains("theme.colors.surface.default"))

        // THEN: Uses theme.radius.xl for dialog corner radius
        assertTrue(source.contains("theme.radius.xl"))

        // THEN: Uses theme.space.lg for dialog padding
        assertTrue(source.contains("theme.space.lg"))

        // THEN: Uses theme.space.md for vertical spacing
        assertTrue(source.contains("theme.space.md"))

        // THEN: No hardcoded color values
        assertFalse(source.contains("Color(0x"))
        assertFalse(source.contains("color = Color."))
    }

    // ========================================================================
    // AC-3: PlanningScreen wires LSCancelConfirmSheet with real callbacks
    // ========================================================================

    @Test
    fun planning_screen_wires_cancel_confirm_with_real_callbacks() {
        val planningSource = File("src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt").readText()

        // THEN: PlanningScreen imports LSCancelConfirmSheet
        assertTrue(planningSource.contains("import com.laneshadow.ui.molecules.LSCancelConfirmSheet"))

        // THEN: PlanningScreen has callback parameters for cancel confirm
        assertTrue(planningSource.contains("onDismissCancelConfirm: () -> Unit"))
        assertTrue(planningSource.contains("onKeepPlanning: () -> Unit"))
        assertTrue(planningSource.contains("onCancelPlan: () -> Unit"))

        // THEN: PlanningScreen wires callbacks to LSCancelConfirmSheet
        assertTrue(planningSource.contains("onKeep = onKeepPlanning"))
        assertTrue(planningSource.contains("onCancel = onCancelPlan"))
        assertTrue(planningSource.contains("onDismiss = onDismissCancelConfirm"))

        // THEN: No println stubs in PlanningScreen's LSCancelConfirmSheet wiring
        val cancelConfirmBlock = planningSource.substringAfter("LSCancelConfirmSheet(").substringBefore("}")
        assertFalse(cancelConfirmBlock.contains("println("))
    }
}
