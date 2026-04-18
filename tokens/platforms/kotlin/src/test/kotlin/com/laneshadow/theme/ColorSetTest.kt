package com.laneshadow.theme

import androidx.compose.ui.graphics.Color
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class ColorSetTest {
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
    fun laneShadowColors_lightFactoryBuildsAllGroups() {
        val colors = LaneShadowColors.light()
        assertNotNull(colors.primary.default)
        assertNotNull(colors.onSurface.default)
        assertNotNull(colors.divider.default)
        // divider only has `default` state in source JSON
        assertNull(colors.divider.hover)
    }

    @Test
    fun domainColors_darkFactoryBuildsWaypointGroups() {
        val domain = DomainColors.dark()
        assertNotNull(domain.waypointOnRoute.default)
        assertNotNull(domain.enrichmentFast.default)
        assertNotNull(domain.deviationDetourPath.default)
    }
}
