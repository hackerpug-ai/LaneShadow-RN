package com.laneshadow.ui.atoms

import androidx.compose.ui.graphics.Color
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class LSTextTest {
    @Test
    fun color_param_rejects_raw_Color() {
        val lsTextFunctions = Class.forName("com.laneshadow.ui.atoms.LSTextKt").declaredMethods
            .filter { it.name == "LSText" }

        assertTrue(lsTextFunctions.isNotEmpty())
        assertTrue(
            lsTextFunctions.any { method ->
                method.parameterTypes.any { parameterType -> parameterType == ContentColor::class.java }
            },
        )
        assertFalse(
            lsTextFunctions.any { method ->
                method.parameterTypes.any { parameterType -> parameterType == Color::class.java }
            },
        )
    }
}
