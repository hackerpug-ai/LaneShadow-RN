package com.laneshadow.ui.components

import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Test

class LSAuthProviderButtonTest {
    @Test
    fun auth_provider_button_exposes_provider_specific_accessibility_and_style_contract() {
        val source = File("../app/src/main/java/com/laneshadow/ui/components/LSAuthProviderButton.kt").readText()

        assertTrue(source.contains("Continue with Google"))
        assertTrue(source.contains("Continue with Apple"))
        assertTrue(source.contains("contentDescription"))
        assertTrue(source.contains("AuthProvider.Google"))
        assertTrue(source.contains("AuthProvider.Apple"))
        assertTrue(source.contains("ButtonVariant.Secondary") || source.contains("ButtonVariant.Primary"))
    }
}
