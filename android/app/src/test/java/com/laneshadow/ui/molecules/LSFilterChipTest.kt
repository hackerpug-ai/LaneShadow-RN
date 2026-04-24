package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme
import org.junit.Assert.assertEquals
import org.junit.Test

class LSFilterChipTest {
    @Test
    fun selected_and_unselected_resolve_distinct_colors() {
        val selected = resolveFilterChipStyle(selected = true)
        val unselected = resolveFilterChipStyle(selected = false)

        assertEquals(LaneShadowTheme.color.Signal.default, selected.backgroundColor)
        assertEquals(LaneShadowTheme.color.Signal.default, selected.borderColor)

        assertEquals(LaneShadowTheme.color.Surface.card, unselected.backgroundColor)
        assertEquals(LaneShadowTheme.color.Border.default, unselected.borderColor)
    }
}
