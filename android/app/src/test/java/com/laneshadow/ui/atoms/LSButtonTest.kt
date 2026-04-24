package com.laneshadow.ui.atoms

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSButtonTest {
    @Test
    fun source_uses_ls_text_ls_icon_and_button_semantics_without_forbidden_refs() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt").readText()

        assertTrue(source.contains("LSText("))
        assertTrue(source.contains("LSIcon("))
        assertTrue(source.contains("role = androidx.compose.ui.semantics.Role.Button"))
        assertFalse(source.contains("Color(0x"))
        assertFalse(source.contains("androidx.compose.material.icons"))
        assertFalse(source.contains("Icons.Filled"))
        assertFalse(source.contains("Icons.Outlined"))
        assertFalse(source.contains("FontFamily.Serif"))
        assertFalse(source.contains("FontFamily.SansSerif"))
        assertFalse(source.contains("FontFamily.Monospace"))
        assertFalse(source.contains("FontFamily.Default"))
    }
}
