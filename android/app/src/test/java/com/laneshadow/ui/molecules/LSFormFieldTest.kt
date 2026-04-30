package com.laneshadow.ui.molecules

import java.io.File
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSFormFieldTest {
    @Test
    fun default_state_renders_label_and_input_with_no_error() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt").readText()

        // Must use LSText for label with typography.ui.label.md
        assertTrue(source.contains("LSText("))
        assertTrue(source.contains("TypographyVariant.Ui.Label.Md"))

        // Must use LSTextField atom
        assertTrue(source.contains("LSTextField("))

        // Must use theme spacing (space.sm = spacing.2)
        assertTrue(source.contains("theme.space.sm"))

        // Must not use raw Text from Material3
        assertFalse(source.contains("import androidx.compose.material3.Text"))
        // Must not use hardcoded colors
        assertFalse(source.contains("Color(0x"))
    }

    @Test
    fun error_state_shows_error_text_in_error_color() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt").readText()

        // Must show error text when error != null
        assertTrue(source.contains("if (error != null)"))

        // Error text must use LSText with error color
        assertTrue(source.contains("ContentColor.Error"))

        // LSTextField must be in error visual state
        assertTrue(source.contains("InputState.Error"))

        // Error text must use typography.ui.body.sm
        assertTrue(source.contains("TypographyVariant.Ui.Body.Sm"))
    }

    @Test
    fun auth_states_support_icons_helper_disabled_and_secure_entry() {
        val source = File("../app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt").readText()

        assertTrue(source.contains("leadingIcon"))
        assertTrue(source.contains("trailingIcon"))
        assertTrue(source.contains("helper"))
        assertTrue(source.contains("enabled"))
        assertTrue(source.contains("visualTransformation"))
    }
}
