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

    @Test
    fun formControlEnums_coverExpectedVariants() {
        assertTrue(ThemeButtonVariant.entries.contains(ThemeButtonVariant.Default))
        assertTrue(ThemeButtonVariant.entries.contains(ThemeButtonVariant.Destructive))
        assertTrue(ThemeButtonSize.entries.contains(ThemeButtonSize.Icon))
        assertTrue(ThemeToggleVariant.entries.contains(ThemeToggleVariant.Outline))
        assertTrue(ThemeToggleSize.entries.contains(ThemeToggleSize.Lg))
    }

    @Test
    fun feedbackAndContainerEnums_coverExpectedVariants() {
        assertEquals(
            setOf(
                BadgeVariant.Default,
                BadgeVariant.Secondary,
                BadgeVariant.Destructive,
                BadgeVariant.Outline,
                BadgeVariant.Success,
                BadgeVariant.Warning,
                BadgeVariant.Info,
            ),
            BadgeVariant.entries.toSet(),
        )
        assertEquals(
            setOf(
                CardVariant.Default,
                CardVariant.Primary,
                CardVariant.Success,
                CardVariant.Warning,
                CardVariant.Danger,
            ),
            CardVariant.entries.toSet(),
        )
        assertEquals(
            setOf(
                AvatarSize.Sm,
                AvatarSize.Md,
                AvatarSize.Lg,
            ),
            AvatarSize.entries.toSet(),
        )
        assertEquals(
            setOf(
                SkeletonShape.Rect,
                SkeletonShape.Circle,
                SkeletonShape.Rounded,
                SkeletonShape.Text,
            ),
            SkeletonShape.entries.toSet(),
        )
    }
}
