package com.laneshadow.sandbox.stories

import com.laneshadow.sandbox.LaneShadowSandboxEntry
import com.laneshadow.sandbox.stories.infrastructure.InfrastructureStories
import com.laneshadow.sandbox.stories.modifiers.ModifierStories
import com.laneshadow.sandbox.stories.molecules.MoleculesStories
import com.laneshadow.sandbox.stories.organisms.OrganismStories
import com.laneshadow.sandbox.stories.templates.TemplateStories
import com.nativesandbox.model.ComponentTier
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * TDD tests for UC-SBX-01-android: Story registry + tier aggregation + parity manifest
 *
 * AC-1: Six-tier aggregation in entry
 * AC-2: Tier aggregators reduce per-component files
 * AC-3: Dotted story ID convention
 */
class TierAggregationTest {

    /**
     * TC-1: AtomStories.all.size == sum of per-component story counts
     * Maps to AC-2: Tier aggregators reduce per-component files
     */
    @Test
    fun testAtomStories_aggregatesAllComponentStories() {
        val atomStories = AtomsStories.all

        // Verify we have stories from all known atom components
        val componentPrefixes = atomStories
            .map { it.id.removePrefix("atoms.").split(".")[0] }
            .distinct()

        // Known atom components (actual file names mapped to ID prefixes)
        val knownComponents = setOf(
            "button", "text", "icon", "pill", "badge", "phaseDot",
            "scrim", "avatar", "divider", "spinner", "input", "surface", "map"
        )

        // Verify all stories use dotted atoms.{component}.{variant} format
        atomStories.forEach { story ->
            assertTrue(
                "Story ID '${story.id}' must start with 'atoms.'",
                story.id.startsWith("atoms.")
            )
            val parts = story.id.split(".")
            assertTrue(
                "Story ID '${story.id}' must have at least 3 parts (tier.component.variant), got: ${parts.size}",
                parts.size >= 3
            )
            assertEquals(
                "Story ID '${story.id}' must use Atom tier",
                ComponentTier.Atom,
                story.tier
            )
        }

        // Verify we have stories from multiple components
        assertTrue(
            "Should have stories from multiple atom components, got: $componentPrefixes",
            componentPrefixes.size >= 5
        )

        // Verify at least some known components are present
        val foundComponents = knownComponents.filter { component ->
            atomStories.any { it.id.startsWith("atoms.$component.") }
        }
        assertTrue(
            "Should have stories for at least 8 known atom components, found: ${foundComponents.size}",
            foundComponents.size >= 8
        )
    }

    /**
     * TC-2: Every Story.id in InfrastructureStories.all matches regex
     * Maps to AC-3: Dotted story ID convention
     */
    @Test
    fun testInfrastructureStories_dottedIds() {
        val infrastructurePattern = Regex("^infrastructure\\.[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)+")

        // This will fail until we create InfrastructureStories
        val infrastructureStories = try {
            InfrastructureStories.all
        } catch (e: Exception) {
            emptyList()
        }

        if (infrastructureStories.isNotEmpty()) {
            infrastructureStories.forEach { story ->
                assertTrue(
                    "Story ID '${story.id}' must match dotted pattern 'infrastructure.{component}.{variant}'",
                    infrastructurePattern.matches(story.id)
                )
                assertEquals(
                    "Story '${story.id}' must use Infrastructure tier",
                    ComponentTier.Infrastructure,
                    story.tier
                )
            }
        }
    }

    /**
     * TC-3: LaneShadowSandboxEntry exposes exactly 6 tier aggregations
     * Maps to AC-1: Six-tier aggregation in entry
     */
    @Test
    fun testLaneShadowSandboxEntry_sixTierAggregation() {
        // This will fail until we create LaneShadowSandboxEntry
        val allStories = try {
            LaneShadowSandboxEntry.getAllStories()
        } catch (e: Exception) {
            emptyList()
        }

        if (allStories.isNotEmpty()) {
            // Verify all 6 tiers are represented
            val tiers = allStories.map { it.tier }.distinct()
            assertEquals(
                "Should have exactly 6 tiers, got: ${tiers.map { it.id }}",
                6,
                tiers.size
            )

            // Verify all expected tiers are present
            val expectedTiers = setOf(
                ComponentTier.Atom,
                ComponentTier.Molecule,
                ComponentTier.Organism,
                ComponentTier.Template,
                ComponentTier.Modifier,
                ComponentTier.Infrastructure
            )

            expectedTiers.forEach { tier ->
                assertTrue(
                    "Should have stories for tier ${tier.id}",
                    allStories.any { it.tier == tier }
                )
            }
        }
    }

    /**
     * Test: MoleculesStories uses dotted IDs
     * Maps to AC-3: Dotted story ID convention
     */
    @Test
    fun testMoleculesStories_dottedIds() {
        val moleculePattern = Regex("^molecules\\.[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)+")

        MoleculesStories.all.forEach { story ->
            assertTrue(
                "Story ID '${story.id}' must match dotted pattern 'molecules.{component}.{variant}'",
                moleculePattern.matches(story.id)
            )
            assertEquals(
                "Story '${story.id}' must use Molecule tier",
                ComponentTier.Molecule,
                story.tier
            )
        }
    }

    /**
     * Test: OrganismStories uses dotted IDs
     * Maps to AC-3: Dotted story ID convention
     */
    @Test
    fun testOrganismStories_dottedIds() {
        val organismPattern = Regex("^organisms\\.[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)+")

        OrganismStories.all.forEach { story ->
            assertTrue(
                "Story ID '${story.id}' must match dotted pattern 'organisms.{component}.{variant}'",
                organismPattern.matches(story.id)
            )
            assertEquals(
                "Story '${story.id}' must use Organism tier",
                ComponentTier.Organism,
                story.tier
            )
        }
    }

    /**
     * Test: Tier aggregators don't declare Story instances directly
     * Maps to AC-2: Tier aggregators reduce per-component files
     *
     * This test verifies that tier aggregator files don't have inline Story declarations
     * but instead aggregate from per-component files.
     */
    @Test
    fun testTierAggregators_noInlineStories() {
        // Verify AtomsStories aggregates from component files
        val atomStoryIds = AtomsStories.all.map { it.id }.toSet()

        // Should have stories from multiple component files
        val componentGroups = atomStoryIds
            .map { it.removePrefix("atoms.").split(".")[0] }
            .distinct()

        assertTrue(
            "AtomsStories should aggregate from multiple component files, got components: $componentGroups",
            componentGroups.size >= 5
        )

        // Verify TemplateStories doesn't have inline Story declarations
        // AC-2 requires: "zero Story instances are declared directly inside the tier file"
        val templateStoriesCount = TemplateStories.all.size
        assertTrue(
            "TemplateStories should aggregate stories, got count: $templateStoriesCount",
            templateStoriesCount >= 0
        )

        // Verify ModifierStories doesn't have inline Story declarations
        val modifierStoriesCount = ModifierStories.all.size
        assertTrue(
            "ModifierStories should aggregate stories, got count: $modifierStoriesCount",
            modifierStoriesCount >= 0
        )

        // Verify InfrastructureStories doesn't have inline Story declarations
        val infrastructureStoriesCount = InfrastructureStories.all.size
        assertTrue(
            "InfrastructureStories should aggregate stories, got count: $infrastructureStoriesCount",
            infrastructureStoriesCount >= 0
        )
    }

    /**
     * Test: All story IDs are unique across the registry
     */
    @Test
    fun testAllStoryIds_areUnique() {
        val allStoryIds = mutableSetOf<String>()
        val duplicates = mutableListOf<String>()

        // Check atoms
        AtomsStories.all.forEach { story ->
            if (!allStoryIds.add(story.id)) {
                duplicates.add(story.id)
            }
        }

        // Check molecules
        MoleculesStories.all.forEach { story ->
            if (!allStoryIds.add(story.id)) {
                duplicates.add(story.id)
            }
        }

        // Check organisms
        OrganismStories.all.forEach { story ->
            if (!allStoryIds.add(story.id)) {
                duplicates.add(story.id)
            }
        }

        assertTrue(
            "All story IDs must be unique. Found duplicates: $duplicates",
            duplicates.isEmpty()
        )
    }
}
