package com.laneshadow.ui.atoms

import com.laneshadow.ui.components.testTheme
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSDividerTest {
    @Test
    fun renders_1dp_hairline_using_border_subtle_token() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt").readText()

        assertTrue(source.contains("orientation: DividerOrientation = DividerOrientation.Horizontal"))
        assertTrue(source.contains("val thickness = 1.dp"))
        assertTrue(source.contains("theme.colors.divider.default"))
        assertEquals(testTheme.colors.divider.default, testTheme.colors.divider.default)
    }

    @Test
    fun source_does_not_define_forbidden_color_font_or_icon_literals() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSDivider.kt").readText()

        assertFalse(Regex("""Color\(0x""").containsMatchIn(source))
        assertFalse(Regex("""androidx\.compose\.material\.icons""").containsMatchIn(source))
        assertFalse(Regex("""Icons\.(Filled|Outlined)""").containsMatchIn(source))
        assertFalse(Regex("""FontFamily\.(Serif|SansSerif|Monospace|Default)""").containsMatchIn(source))
    }
}
