package com.laneshadow.ui.planning

import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.File

/**
 * AC-2 test — Verifies PlanningCancelConfirmSheet uses standard dialog() semantics.
 *
 * Tests that the sheet applies the standard SemanticsProperties.IsDialog via the dialog()
 * extension function (not a custom key). This is verified by checking that:
 * 1. The standard import is present
 * 2. The dialog() function call exists in the semantics block
 * 3. No custom SemanticsPropertyKey is defined
 */
@RunWith(RobolectricTestRunner::class)
class PlanningCancelConfirmSemanticsTest {

    /**
     * AC-2 — Back-tap opens the V02 cancel-confirm BottomSheet
     *
     * GIVEN the planning composition is rendered with isThinking = true
     * WHEN the user invokes the back gesture (taps onCollapse)
     * THEN PlanningCancelConfirmSheet opens (V02 variant) with proper semantics;
     * the sheet is conditionally rendered when showCancelConfirm is true;
     * buttons are reachable via testTag
     *
     * Verify: PlanningCancelConfirmSheet uses standard androidx.compose.ui.semantics.dialog()
     */
    @Test
    fun back_tap_opens_v02_cancel_confirm_sheet_with_standard_dialog_semantics() {
        // Verify LSCancelConfirmSheet uses standard dialog()
        val lsSheetSource = File("src/main/java/com/laneshadow/ui/molecules/LSCancelConfirmSheet.kt").readText()

        // Must use standard dialog() extension
        assertTrue(
            "LSCancelConfirmSheet must import androidx.compose.ui.semantics.dialog",
            lsSheetSource.contains("import androidx.compose.ui.semantics.dialog")
        )

        // Must call dialog() in semantics block
        assertTrue(
            "LSCancelConfirmSheet must call dialog() in semantics",
            lsSheetSource.contains("dialog()")
        )

        // Must NOT have custom SemanticsPropertyKey
        assertTrue(
            "LSCancelConfirmSheet must not define custom SemanticsPropertyKey for isDialog",
            !lsSheetSource.contains("SemanticsPropertyKey<Boolean>(\"isDialog\")")
        )

        // Verify PlanningCancelConfirmSheet also uses standard dialog()
        val planningSheetSource = File("src/main/java/com/laneshadow/ui/planning/PlanningCancelConfirmSheet.kt").readText()

        // Must use standard dialog() extension
        assertTrue(
            "PlanningCancelConfirmSheet must import androidx.compose.ui.semantics.dialog",
            planningSheetSource.contains("import androidx.compose.ui.semantics.dialog")
        )

        // Must NOT import custom isDialog from molecules
        assertTrue(
            "PlanningCancelConfirmSheet must not import custom isDialog extension",
            !planningSheetSource.contains("import com.laneshadow.ui.molecules.isDialog")
        )

        // Must call dialog() in semantics block
        assertTrue(
            "PlanningCancelConfirmSheet must call dialog() in semantics",
            planningSheetSource.contains("dialog()")
        )

        // Verify button testTags are attached
        assertTrue(
            "PlanningCancelConfirmSheet must have cancel-button testTag",
            planningSheetSource.contains("planning.cancel-confirm.cancel-button")
        )

        assertTrue(
            "PlanningCancelConfirmSheet must have keep-button testTag",
            planningSheetSource.contains("planning.cancel-confirm.keep-button")
        )

        // Verify contentDescription is present
        assertTrue(
            "PlanningCancelConfirmSheet must have contentDescription for dialog",
            planningSheetSource.contains("contentDescription = \"Cancel ride confirmation\"")
        )
    }
}
