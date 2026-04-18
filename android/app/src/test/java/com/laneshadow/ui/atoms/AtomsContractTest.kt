package com.laneshadow.ui.atoms

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AtomsContractTest {
    @Test
    fun themedTextVariants_coverTheExpectedTypographyScale() {
        assertEquals(15, ThemedTextVariant.entries.size)
        assertTrue(ThemedTextVariant.entries.contains(ThemedTextVariant.BodyMd))
        assertTrue(ThemedTextVariant.entries.contains(ThemedTextVariant.DisplayLg))
    }

    @Test
    fun themedViewVariants_coverExpectedSurfaceModes() {
        assertEquals(
            setOf(
                ThemedViewVariant.Surface,
                ThemedViewVariant.SurfaceVariant,
                ThemedViewVariant.Background,
                ThemedViewVariant.Card,
                ThemedViewVariant.Muted,
            ),
            ThemedViewVariant.entries.toSet(),
        )
    }

    @Test
    fun iconSymbol_unknownNamesFallBackToAStableGlyph() {
        assertEquals(Icons.Filled.Search.name, iconVectorForName("search").name)
        assertEquals(iconVectorForName("unknown-token").name, iconVectorForName("still-unknown").name)
    }
}
