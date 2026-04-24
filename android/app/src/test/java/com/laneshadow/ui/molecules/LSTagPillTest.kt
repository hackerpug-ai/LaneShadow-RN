package com.laneshadow.ui.molecules

import com.laneshadow.theme.generated.LaneShadowTheme
import com.laneshadow.theme.generated.LaneShadowTheme.IconName
import org.junit.Assert.assertEquals
import org.junit.Test

class LSTagPillTest {
    @Test
    fun renders_glass_surface_pill_with_icon_and_label() {
        val style = resolveTagPillStyle(accent = AccentColor.Muted)

        assertEquals(LaneShadowTheme.color.Surface.glass, style.backgroundColor)
        assertEquals(LaneShadowTheme.color.Border.glass, style.borderColor)
        assertEquals(IconName.Pin, style.leadingIcon)
        assertEquals(TagPillLabelVariant, style.labelVariant)
    }
}
