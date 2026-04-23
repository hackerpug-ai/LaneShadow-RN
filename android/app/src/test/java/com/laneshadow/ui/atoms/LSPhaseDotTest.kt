package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSPhaseDotTest {
    @Test
    fun phaseDotState_exposes_three_cases() {
        val states = listOf(
            PhaseDotState.Pending,
            PhaseDotState.Active,
            PhaseDotState.Done,
        )

        assertEquals(3, states.distinct().size)
        assertTrue(states.any { it is PhaseDotState.Pending })
        assertTrue(states.any { it is PhaseDotState.Active })
        assertTrue(states.any { it is PhaseDotState.Done })
    }

    @Test
    fun phaseDot_recipe_and_fallbacks_resolve_from_theme_primitives() {
        val tokenTheme = com.laneshadow.ui.components.testTheme.copy(
            motion = com.laneshadow.ui.components.testTheme.motion.copy(
                duration = mapOf("slow" to 400),
                easing = mapOf("standard" to listOf(0.4, 0.0, 0.2, 1.0)),
            ),
        )
        val recipe = phaseDotPulseRecipe(tokenTheme)

        assertEquals(PhaseDotPulseRecipePath, recipe.name)
        assertEquals(400, recipe.durationMillis)
        assertEquals(Color.Transparent, fillColor(PhaseDotState.Pending, tokenTheme))
        assertEquals(tokenTheme.colors.border.default, borderStrongColor(tokenTheme))
    }

    @Test
    fun phaseDot_source_avoids_forbidden_literals_and_references_recipe_path() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt").readText()

        assertTrue(source.contains(PhaseDotPulseRecipePath))
        assertFalse(Regex("""tween\(durationMillis\s*=""").containsMatchIn(source))
        assertFalse(Regex("""Color\(0x""").containsMatchIn(source))
        assertFalse(Regex("""androidx\.compose\.material\.icons""").containsMatchIn(source))
        assertFalse(Regex("""Icons\.(Filled|Outlined)""").containsMatchIn(source))
        assertFalse(Regex("""FontFamily\.Serif""").containsMatchIn(source))
    }
}
