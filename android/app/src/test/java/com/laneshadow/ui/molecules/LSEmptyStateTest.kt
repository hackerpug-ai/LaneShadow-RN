package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSEmptyStateTest {
    @Test
    fun default_render_uses_centered_atom_composition() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSEmptyState.kt").readText()

        // Must use LSIcon for illustration
        assertTrue(source.contains("LSIcon("))

        // Must use LSText for title with typography.ui.title.md
        assertTrue(source.contains("TypographyVariant.Ui.Title.Md"))

        // Must use LSText for body with typography.ui.body.md
        assertTrue(source.contains("TypographyVariant.Ui.Body.Md"))

        // Must use LSButton for action
        assertTrue(source.contains("LSButton("))

        // Must use centered Column
        assertTrue(source.contains("horizontalAlignment = Alignment.CenterHorizontally"))

        // Must use IconSize.Xl for illustration
        assertTrue(source.contains("IconSize.Xl"))

        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
    }
}
