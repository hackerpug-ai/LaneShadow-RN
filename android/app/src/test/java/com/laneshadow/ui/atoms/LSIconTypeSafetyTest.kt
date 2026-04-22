package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSIconTypeSafetyTest {
    @Test
    fun icon_color_param_rejects_raw_Color() {
        val methods = Class
            .forName("com.laneshadow.ui.atoms.LSIconKt")
            .declaredMethods
            .filter { it.name == "LSIcon" }

        assertTrue(methods.isNotEmpty())
        assertTrue(methods.any { method -> method.parameterTypes.any { it == IconColor::class.java } })
        assertFalse(methods.any { method -> method.parameterTypes.any { it == Color::class.java } })
    }
}
