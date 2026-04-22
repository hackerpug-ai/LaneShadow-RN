package com.laneshadow.ui.atoms

import java.io.File
import com.laneshadow.ui.components.testTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class IconSizeTest {
    @Test
    fun iconSize_each_case_maps_to_sizing_token() {
        assertEquals(testTheme.sizing.icon.xs, IconSize.Xs.resolve(testTheme))
        assertEquals(testTheme.sizing.icon.sm, IconSize.Sm.resolve(testTheme))
        assertEquals(testTheme.sizing.icon.md, IconSize.Md.resolve(testTheme))
        assertEquals(testTheme.sizing.icon.lg, IconSize.Lg.resolve(testTheme))
        assertEquals(testTheme.sizing.icon.xl, IconSize.Xl.resolve(testTheme))
    }

    @Test
    fun iconSize_source_does_not_define_dp_literals() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/IconSize.kt").readText()

        assertFalse(Regex("""\d+(?:\.\d+)?\.dp""").containsMatchIn(source))
    }
}
