package com.laneshadow.theme

import androidx.compose.ui.graphics.Color
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class ColorSetTest {
    private fun loadBundledTokens(): SemanticTokens {
        val stream = javaClass.classLoader?.getResourceAsStream("semantic.tokens.json")
            ?: error("test resource 'semantic.tokens.json' not found on classpath")
        return ThemeLoader.fromStream(stream)
    }

    @Test
    fun colorSet_defaultIsRequired_otherStatesOptional() {
        val cs = ColorSet(default = Color(0xFFB87333), hover = Color(0xFFC58545))
        assertEquals(Color(0xFFB87333), cs.default)
        assertEquals(Color(0xFFC58545), cs.hover)
        assertNull(cs.pressed)
        assertNull(cs.disabled)
        assertNull(cs.focus)
    }

    @Test
    fun bundledJson_decodesAllCoreGroups() {
        val tokens = loadBundledTokens()
        val colors = LaneShadowColors.from(tokens, darkMode = false)
        assertNotNull(colors.primary.default)
        assertNotNull(colors.onSurface.default)
        assertNotNull(colors.divider.default)
        // Divider only has `default` state per source JSON — optional states stay null.
        assertNull(colors.divider.hover)
    }

    @Test
    fun bundledJson_decodesDarkModeDomainGroups() {
        val tokens = loadBundledTokens()
        val domain = DomainColors.from(tokens, darkMode = true)
        assertNotNull(domain.waypointOnRoute.default)
        assertNotNull(domain.enrichmentFast.default)
        assertNotNull(domain.deviationDetourPath.default)
    }
}
