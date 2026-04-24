package com.laneshadow.theme

import androidx.compose.ui.graphics.Color
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Assert.assertEquals
import org.junit.Test

class TokensMapStyleTest {
    @Test
    fun mapStyle_resolvesFromTokens() {
        assertEquals("mapbox://styles/laneshadow/clxwarm01", GeneratedTokens.map.style.light)
        assertEquals("mapbox://styles/laneshadow/clxnight02", GeneratedTokens.map.style.dark)
    }

    @Test
    fun copperSurfaceAndMapTokens_areExposed() {
        assertEquals(Color(0.133f, 0.094f, 0.063f, 0.18f), GeneratedTokens.color.Surface.scrimSoft)
        assertEquals(Color(0xFFFDFBF8), GeneratedTokens.map.paper)
        assertEquals(Color(0.286f, 0.271f, 0.310f, 0.22f), GeneratedTokens.map.contour)
        assertEquals(Color(0.286f, 0.271f, 0.310f, 0.10f), GeneratedTokens.map.contourFaint)
        assertEquals(Color(0xFFF3A164), GeneratedTokens.color.Signal.hover)
        assertEquals(Color(0xFFEDE7E1), GeneratedTokens.color.Action.Primary.disabled)
        assertEquals(Color(0xFFDBEAFE), GeneratedTokens.color.Status.Info.tint)
        assertEquals(Color(0xFFC9423C), GeneratedTokens.color.Status.recording)
        assertEquals(Color(1.000f, 1.000f, 1.000f, 0.55f), GeneratedTokens.color.Border.glass)
        assertEquals(Color(0xFFFDFBF8), GeneratedTokens.color.Surface.map)
        assertEquals(Color(0.949f, 0.933f, 0.910f, 0.22f), GeneratedTokens.color.Border.dark.glass)
    }
}
