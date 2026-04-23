package com.laneshadow.ui.atoms

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSTextAreaTest {
    @Test
    fun textarea_renders_multiline_with_max_rows() {
        assertFalse(lsTextAreaIsSingleLine())
        assertEquals(1, resolveLSTextAreaVisibleRows("", maxRows = 6))
        assertEquals(6, resolveLSTextAreaMaxRows(6))
    }

    @Test
    fun textarea_auto_grows_then_scrolls_at_maxRows() {
        val overflowingText = (1..8).joinToString("\n") { "Line $it" }

        assertEquals(6, resolveLSTextAreaVisibleRows(overflowingText, maxRows = 6))
        assertTrue(lsTextAreaIsScrollable(overflowingText, maxRows = 6))
    }
}
