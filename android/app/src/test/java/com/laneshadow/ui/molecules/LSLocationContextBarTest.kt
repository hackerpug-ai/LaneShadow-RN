package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LSLocationContextBarTest {
    @Test
    fun renders_two_tag_pills_with_space_between() {
        val source = File("src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt").readText()

        assertTrue(source.contains("Arrangement.SpaceBetween"))
        assertTrue(source.contains("padding(horizontal = theme.space.sm)"))
        assertTrue(source.contains("contentDescription = \"Location mode: \${mode.label}\""))
        assertTrue(source.contains(".clickable(onClick = onModeChange)"))
        assertTrue(source.contains("LocationPillMaxWidth = 260.dp"))
        assertEquals(2, "LSTagPill\\(".toRegex().findAll(source).count())
    }
}
