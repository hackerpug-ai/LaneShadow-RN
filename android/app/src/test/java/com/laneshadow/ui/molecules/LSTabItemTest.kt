package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSTabItemTest {
    @Test
    fun selected_and_unselected_states_resolve_token_colors() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSTabItem.kt").readText()

        // Must use LSIcon for icon
        assertTrue(source.contains("LSIcon("))

        // Must use LSText for label
        assertTrue(source.contains("LSText("))

        // Must use color.signal.default for selected state
        assertTrue(source.contains("ContentColor.Signal"))

        // Must use color.content.tertiary for unselected state
        assertTrue(source.contains("ContentColor.Tertiary"))

        // Must show indicator when selected
        assertTrue(source.contains("if (selected)"))

        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
    }
}
