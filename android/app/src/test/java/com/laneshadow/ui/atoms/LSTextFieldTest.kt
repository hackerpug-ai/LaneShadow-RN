package com.laneshadow.ui.atoms

import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.laneshadow.ui.components.testTheme
import org.junit.Assert.assertEquals
import org.junit.Test

class LSTextFieldTest {
    private val tokenTheme = testTheme.copy(
        space = testTheme.space.copy(md = 12.dp),
        radius = testTheme.radius.copy(sm = 6.dp),
    )

    @Test
    fun default_state_resolves_border_radius_padding_tokens() {
        val padding = resolveLSInputPadding(tokenTheme)

        assertEquals(tokenTheme.colors.border.default, resolveLSInputBorderColor(tokenTheme, InputState.Default))
        assertEquals(tokenTheme.radius.sm, resolveLSInputCornerRadius(tokenTheme))
        assertEquals(tokenTheme.space.md, padding.calculateLeftPadding(LayoutDirection.Ltr))
        assertEquals(tokenTheme.space.md, padding.calculateTopPadding())
    }

    @Test
    fun all_four_input_states_resolve_border_tokens() {
        assertEquals(tokenTheme.colors.border.default, resolveLSInputBorderColor(tokenTheme, InputState.Default))
        assertEquals(
            tokenTheme.colors.border.focus ?: tokenTheme.colors.ring.default,
            resolveLSInputBorderColor(tokenTheme, InputState.Focused),
        )
        assertEquals(tokenTheme.colors.danger.default, resolveLSInputBorderColor(tokenTheme, InputState.Error))
        assertEquals(
            tokenTheme.colors.border.disabled ?: tokenTheme.colors.border.default,
            resolveLSInputBorderColor(tokenTheme, InputState.Disabled),
        )
    }

    @Test
    fun error_state_applies_border_danger_token() {
        assertEquals(tokenTheme.colors.danger.default, resolveLSInputBorderColor(tokenTheme, InputState.Error))
    }
}
