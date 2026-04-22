package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import com.laneshadow.ui.components.testTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSTextTest {
    @Test
    fun opinion_xl_resolves_newsreader_token() {
        val variant = TypographyVariant.Opinion.Xl
        val style = variant.resolveTextStyle(testTheme)

        assertEquals(TypographyFamily.Opinion, variant.family)
        assertEquals(testTheme.typography.opinion.xl.fontFamily, style.fontFamily)
        assertEquals(FontFamily.Serif, style.fontFamily)
        assertEquals(testTheme.typography.opinion.xl.fontSize, style.fontSize)
        assertEquals(testTheme.typography.opinion.xl.lineHeight, style.lineHeight)
        assertEquals(testTheme.typography.opinion.xl.fontWeight, style.fontWeight)
    }

    @Test
    fun ui_body_md_resolves_geist_token() {
        val variant = TypographyVariant.Ui.Body.Md
        val style = variant.resolveTextStyle(testTheme)

        assertEquals(TypographyFamily.Ui, variant.family)
        assertEquals(testTheme.typography.ui.body.md.fontFamily, style.fontFamily)
        assertEquals(FontFamily.SansSerif, style.fontFamily)
        assertEquals(testTheme.typography.ui.body.md.fontSize, style.fontSize)
        assertEquals(testTheme.typography.ui.body.md.lineHeight, style.lineHeight)
        assertEquals(testTheme.typography.ui.body.md.fontWeight, style.fontWeight)
    }

    @Test
    fun instrument_lg_resolves_mono_token() {
        val variant = TypographyVariant.Instrument.Lg
        val style = variant.resolveTextStyle(testTheme)

        assertEquals(TypographyFamily.Instrument, variant.family)
        assertEquals(testTheme.typography.instrument.lg.fontFamily, style.fontFamily)
        assertEquals(FontFamily.Monospace, style.fontFamily)
        assertEquals(testTheme.typography.instrument.lg.fontSize, style.fontSize)
        assertEquals(testTheme.typography.instrument.lg.lineHeight, style.lineHeight)
        assertEquals(testTheme.typography.instrument.lg.fontWeight, style.fontWeight)
    }

    @Test
    fun content_color_secondary_resolves_active_theme_token() {
        assertEquals(testTheme.content.secondary, ContentColor.Secondary.resolve(testTheme))
    }

    @Test
    fun color_param_rejects_raw_Color() {
        val lsTextFunctions = Class.forName("com.laneshadow.ui.atoms.LSTextKt").declaredMethods
            .filter { it.name == "LSText" }

        assertTrue(lsTextFunctions.isNotEmpty())
        assertTrue(
            lsTextFunctions.any { method ->
                method.parameterTypes.any { parameterType -> parameterType == ContentColor::class.java }
            },
        )
        assertFalse(
            lsTextFunctions.any { method ->
                method.parameterTypes.any { parameterType -> parameterType == Color::class.java }
            },
        )
    }
}
