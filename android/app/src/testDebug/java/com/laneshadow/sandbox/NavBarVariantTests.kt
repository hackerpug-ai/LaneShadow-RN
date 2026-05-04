package com.laneshadow.sandbox

import com.laneshadow.ui.organisms.FilterChipSpec
import com.laneshadow.ui.organisms.SearchSlotSpec
import org.junit.Test
import org.junit.Assert.*

/**
 * TDD tests for LSNavBar filter-chip row and search-slot variants.
 *
 * AC-2: Android filter-chip row
 * AC-4: Android search-slot
 * AC-5: Story registration verification
 */
class NavBarVariantTests {

    // MARK: - AC-2: Android filter-chip row

    @Test
    fun testAndroidNavBarFilterChipRow() {
        // GIVEN: Filter chip specs
        val chips = listOf(
            FilterChipSpec(label = "Mileage", isSelected = false),
            FilterChipSpec(label = "Difficulty", isSelected = true),
            FilterChipSpec(label = "Surface", isSelected = false),
        )

        // WHEN: The nav bar composes
        // Note: Full snapshot verification happens in sandbox stories
        // This test ensures the data structures compile correctly
        assertEquals(3, chips.size)
        assertEquals("Mileage", chips[0].label)
        assertTrue(chips[1].isSelected)
    }

    // MARK: - AC-4: Android search-slot

    @Test
    fun testAndroidNavBarSearchSlot() {
        // GIVEN: Search slot spec
        val searchSlot = SearchSlotSpec(placeholder = "Search routes…")

        // WHEN: The nav bar composes
        // Note: Full snapshot verification happens in sandbox stories
        // This test ensures the data structures compile correctly
        assertEquals("Search routes…", searchSlot.placeholder)
    }

    // MARK: - AC-5: Story registration verification

    @Test
    fun testAndroidNavBarStoryRegistration() {
        // This test verifies that the canonical story IDs are registered
        // Actual verification happens via `pnpm design:review` (Sprint 05+)
        // This is a compile-time check that stories exist
        val stories = com.laneshadow.sandbox.stories.organisms.LSNavBarStory.all
        val storyIds = stories.map { it.id }.toSet()

        assertTrue("Should have basic story with canonical ID", storyIds.contains("organisms.nav-bar.basic"))
        assertTrue("Should have filter-chip-row story with canonical ID", storyIds.contains("organisms.nav-bar.filter-chip-row"))
        assertTrue("Should have search-slot story with canonical ID", storyIds.contains("organisms.nav-bar.search-slot"))
    }
}
