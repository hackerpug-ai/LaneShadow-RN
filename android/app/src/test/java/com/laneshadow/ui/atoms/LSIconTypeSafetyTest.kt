package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import java.io.File
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

    @Test
    fun icon_rendering_uses_token_stroke_not_drawable_width() {
        val source = File("../app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt").readText()

        assertTrue(source.contains("theme.icon.stroke.width.toPx()"))
        assertTrue(source.contains("width = strokeWidth"))
        assertFalse(source.contains("painter" + "Resource"))
        assertFalse(source.contains("R.drawable." + "ic_"))
    }
}
