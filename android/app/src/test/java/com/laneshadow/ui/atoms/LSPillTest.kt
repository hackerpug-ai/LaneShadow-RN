package com.laneshadow.ui.atoms

import androidx.compose.ui.unit.dp
import com.laneshadow.ui.components.testTheme
import org.junit.Assert.assertEquals
import org.junit.Test

class LSPillTest {
    @Test
    fun pillSize_maps_to_token_height() {
        val tokenBackedTheme = testTheme.copy(
            space = testTheme.space.copy(
                md = 12.dp,
                lg = 16.dp,
                xl = 24.dp,
                xxl = 32.dp,
            ),
        )

        assertEquals(tokenBackedTheme.space.xl, PillSize.Sm.resolveHeight(tokenBackedTheme))
        assertEquals(tokenBackedTheme.space.xxl, PillSize.Md.resolveHeight(tokenBackedTheme))
        assertEquals(
            tokenBackedTheme.space.xxl + tokenBackedTheme.space.sm,
            PillSize.Lg.resolveHeight(tokenBackedTheme),
        )
    }
}
