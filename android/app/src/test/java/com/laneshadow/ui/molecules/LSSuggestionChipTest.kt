package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme
import com.laneshadow.ui.atoms.ContentColor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class LSSuggestionChipTest {
    @Test
    fun primed_and_unprimed_resolve_distinct_colors() {
        val primed = resolveSuggestionChipStyle(primed = true)
        val unprimed = resolveSuggestionChipStyle(primed = false)

        assertEquals(LaneShadowTheme.color.Signal.whisper, primed.backgroundColor)
        assertEquals(LaneShadowTheme.color.Signal.tint, primed.borderColor)
        assertEquals(ContentColor.Signal, primed.labelColor)

        assertEquals(LaneShadowTheme.color.Surface.card, unprimed.backgroundColor)
        assertEquals(LaneShadowTheme.color.Border.default, unprimed.borderColor)
        assertEquals(ContentColor.Secondary, unprimed.labelColor)
    }

    @Test
    fun suggestion_chip_composes_pill_atom() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt").readText()

        // Must use LSPill atom for pill shape
        assertTrue(source.contains("LSPill("))

        // Must use LSText for label
        assertTrue(source.contains("LSText("))

        // Must use LSIcon for leading icon
        assertTrue(source.contains("LSIcon("))

        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
    }

    @Test
    fun suggestion_chip_has_button_semantics() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt").readText()

        // Must set Role.Button
        assertTrue(source.contains("Role.Button"))

        // Must set contentDescription
        assertTrue(source.contains("contentDescription = label"))
    }

    @Test
    fun suggestion_chip_respects_primed_state() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt").readText()

        // Must accept primed parameter
        assertTrue(source.contains("primed: Boolean"))

        // Must pass primed to resolve function
        assertTrue(source.contains("primed = primed"))
    }
}
