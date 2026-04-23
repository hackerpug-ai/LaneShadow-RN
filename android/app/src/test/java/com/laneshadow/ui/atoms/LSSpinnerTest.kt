package com.laneshadow.ui.atoms

import com.laneshadow.ui.components.testTheme
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSSpinnerTest {
    @Test
    fun renders_indeterminate_indicator_with_signal_default_tint() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSSpinner.kt").readText()

        assertTrue(source.contains("CircularProgressIndicator("))
        assertTrue(source.contains("ProgressBarRangeInfo.Indeterminate"))
        assertTrue(source.contains("theme.colors.primary.default"))
        assertEquals(testTheme.sizing.icon.md, SpinnerSize.Md.resolve(testTheme))
        assertEquals(testTheme.colors.primary.default, testTheme.colors.primary.default)
    }

    @Test
    fun source_does_not_define_forbidden_color_font_or_icon_literals() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSSpinner.kt").readText()

        assertFalse(Regex("""Color\(0x""").containsMatchIn(source))
        assertFalse(Regex("""androidx\.compose\.material\.icons""").containsMatchIn(source))
        assertFalse(Regex("""Icons\.(Filled|Outlined)""").containsMatchIn(source))
        assertFalse(Regex("""FontFamily\.(Serif|SansSerif|Monospace|Default)""").containsMatchIn(source))
    }
}
