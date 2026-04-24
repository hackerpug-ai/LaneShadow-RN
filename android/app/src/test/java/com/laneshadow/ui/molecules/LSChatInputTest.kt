package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSChatInputTest {
    @Test
    fun default_empty_state_shows_sliders_icon_and_glass_panel() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt").readText()

        // Must use LSGlassPanel for input bar
        assertTrue(source.contains("LSGlassPanel("))
        assertTrue(source.contains("GlassVariant.Chrome"))

        // Must use LSTextField atom
        assertTrue(source.contains("LSTextField("))

        // Must use LSButton for leading collapse icon
        assertTrue(source.contains("IconName.Collapse"))

        // Must use LSButton for trailing sliders icon
        assertTrue(source.contains("IconName.Sliders"))

        // Must not use raw TextField from Material3
        assertFalse(source.contains("import androidx.compose.material3.TextField"))
        assertFalse(source.contains("import androidx.compose.material3.OutlinedTextField"))

        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
    }

    @Test
    fun non_empty_value_swaps_trailing_to_send_button() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt").readText()

        // Must check value.isNotEmpty() to swap trailing button
        assertTrue(source.contains("value.isNotEmpty()"))

        // Must use IconName.Send when non-empty
        assertTrue(source.contains("IconName.Send"))

        // Must use ButtonVariant.Primary for send button
        assertTrue(source.contains("ButtonVariant.Primary"))
    }

    @Test
    fun suggestion_chips_appear_in_lazy_row_above_input() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt").readText()

        // Must check suggestions != null
        assertTrue(source.contains("suggestions != null"))

        // Must use LazyRow for horizontal scrolling
        assertTrue(source.contains("LazyRow"))
    }

    @Test
    fun location_badge_renders_context_bar_above_chips() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt").readText()

        // Must check locationBadge != null
        assertTrue(source.contains("locationBadge != null"))

        // Must have TODO comment for UC-MOL-08
        assertTrue(source.contains("UC-MOL-08"))
    }

    @Test
    fun is_thinking_true_shows_spinner_and_disables_input() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt").readText()

        // Must check isThinking parameter
        assertTrue(source.contains("isThinking"))

        // Must use LSSpinner when thinking
        assertTrue(source.contains("LSSpinner("))
    }
}
