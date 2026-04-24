package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSModalTest {
    private val source by lazy {
        File("src/main/java/com/laneshadow/ui/molecules/LSModal.kt").readText()
    }

    @Test
    fun modal_composes_from_ls_atoms() {
        assertTrue(source.contains("Dialog("))
        assertTrue(source.contains("LSCard("))
        assertTrue(source.contains("LSText("))
        assertTrue(source.contains("LSButton("))
        assertTrue(source.contains("class Destructive"))
        assertTrue(source.contains("class Ghost"))
        assertTrue(source.contains("ButtonVariant.Destructive"))
        assertTrue(source.contains("ButtonVariant.Ghost"))
        assertFalse(source.contains("AlertDialog("))
        assertFalse(source.contains("TextButton("))
    }
}
