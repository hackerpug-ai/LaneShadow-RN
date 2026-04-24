package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSListRowTest {
    @Test
    fun avatar_subtitle_chevron_variant_uses_atoms_and_token_layout() {
        val source = File("src/main/java/com/laneshadow/ui/molecules/LSListRow.kt").readText()

        assertTrue(source.contains("LSAvatar("))
        assertTrue(source.contains("LSIcon("))
        assertTrue(source.contains("LSText as LSLabel"))
        assertTrue(source.contains("LSListRowMinHeight = 44.dp"))
        assertTrue(source.contains("horizontal = theme.space.lg"))
        assertTrue(source.contains("vertical = theme.space.xs"))
        assertTrue(source.contains("horizontalArrangement = Arrangement.spacedBy(theme.space.sm)"))
        assertFalse(source.contains("import androidx.compose.material3.Text"))
        assertFalse(source.contains("Color(0xFF"))
    }

    @Test
    fun molecule_files_contain_no_literal_colors_or_bare_text_calls() {
        val contentCardSource = File("src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt").readText()
        val listRowSource = File("src/main/java/com/laneshadow/ui/molecules/LSListRow.kt").readText()

        assertFalse(contentCardSource.contains("Color(0xFF"))
        assertFalse(listRowSource.contains("Color(0xFF"))
        assertFalse(contentCardSource.contains("Text("))
        assertFalse(listRowSource.contains("Text("))
    }
}
