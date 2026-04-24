package com.laneshadow.theme

import androidx.compose.ui.unit.dp
import com.laneshadow.theme.generated.LaneShadowTheme as GeneratedTokens
import org.junit.Assert.assertEquals
import org.junit.Test

class TokensDimensionsTest {
    @Test
    fun strokeScale_matchesDimensionsTokens() {
        assertEquals(1.dp, GeneratedTokens.sizing.stroke.sm)
        assertEquals(2.dp, GeneratedTokens.sizing.stroke.md)
        assertEquals(3.dp, GeneratedTokens.sizing.stroke.lg)
    }
}
