package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LSLocationContextBarTest {
    @Test
    fun location_context_bar_keeps_pill_composition_and_accessibility_contracts() {
        val source = File("src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt").readText()

        assertTrue(source.contains("Arrangement.SpaceBetween"))
        assertTrue(source.contains("padding(horizontal = theme.space.sm)"))
        assertTrue(source.contains("Role.Button"))
        assertTrue(source.contains("contentDescription = \"Location mode: \${mode.label}\""))
        assertTrue(source.contains(".clickable(onClick = onModeChange)"))
        assertTrue(source.contains("LSLocationContextBarLocationPillTag"))
        assertTrue(source.contains("LSLocationContextBarModePillTag"))
        assertTrue(source.contains("LocationPillMaxWidth = 260.dp"))
        assertEquals(2, "LSTagPill\\(".toRegex().findAll(source).count())
    }
}
