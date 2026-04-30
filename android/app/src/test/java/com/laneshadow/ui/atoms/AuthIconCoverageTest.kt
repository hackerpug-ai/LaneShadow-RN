package com.laneshadow.ui.atoms

import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Test

class AuthIconCoverageTest {
    @Test
    fun auth_glyphs_are_covered_by_icon_catalog_or_ios_adapter() {
        val lsIconSource = File("../app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt").readText()
        val adapterSource = File("../app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt").readText()

        assertTrue(lsIconSource.contains("IconName.Compass"))
        assertTrue(adapterSource.contains("\"chevron-left\""))
        assertTrue(adapterSource.contains("\"mail\""))
        assertTrue(adapterSource.contains("\"lock\""))
        assertTrue(adapterSource.contains("\"check\""))
        assertTrue(lsIconSource.contains("IconName.Sparkle") || adapterSource.contains("\"sparkle\""))
        assertTrue(adapterSource.contains("\"eye\"") || adapterSource.contains("\"visibility\""))
    }
}
