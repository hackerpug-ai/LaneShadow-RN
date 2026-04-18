package com.laneshadow.ui.sandbox

import com.laneshadow.ui.sandbox.navigation.SandboxCatalogDestination
import com.laneshadow.ui.sandbox.navigation.SandboxCatalogNavigation
import com.laneshadow.ui.sandbox.stories.AppStories
import com.laneshadow.ui.sandbox.registry.RnReferenceRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AppStoriesRegistryTest {
    @Test
    fun ac1_exposesBootstrapHostCatalogNavigationAndRnRegistryStories() {
        val components = AppStories.all.map { it.component }.toSet()

        assertTrue(components.contains("AndroidSandboxHost"))
        assertTrue(components.contains("SandboxCatalogNavigation"))
        assertTrue(components.contains("RnReferenceRegistry"))
    }

    @Test
    fun ac2_registryDeclaresLightAndDarkThemeCoverageForEveryScenario() {
        RnReferenceRegistry.all.forEach { scenario ->
            assertEquals(setOf("light", "dark"), scenario.themeCoverage.toSet())
        }
    }

    @Test
    fun ac3_registryScenariosAreDeterministicWithRnReferencesAndStateVariants() {
        val scenarios = RnReferenceRegistry.all
        assertTrue(
            scenarios.all {
                it.id.matches(
                    Regex("^(atoms|molecules|organisms|templates|screens)/[a-z0-9-]+/[a-z0-9-]+$"),
                )
            },
        )
        assertTrue(scenarios.all { it.summary.startsWith("RN reference: react-native/stories/") })
        assertTrue(scenarios.all { it.fixtureKey.isNotBlank() })
        assertTrue(scenarios.groupBy { it.componentName }.getValue("RnReferenceRegistry").size >= 2)
    }

    @Test
    fun ac4_registryCarriesAccessibilityAndInteractionParityMetadata() {
        val scenarios = RnReferenceRegistry.all
        assertTrue(scenarios.all { it.accessibilityLabels.isNotEmpty() })
        assertTrue(scenarios.all { it.accessibilityLabels.all { label -> label.isNotBlank() } })
        assertTrue(scenarios.any { it.componentName == "SandboxCatalogNavigation" && it.supportsOpenById })
        assertTrue(scenarios.any { it.componentName == "SandboxCatalogNavigation" && it.requiresKeyboardSafeAreaHandling })
    }

    @Test
    fun ac5_appStoriesAllIsDeterministicAndSupportsOpenByIdNavigation() {
        val ids = AppStories.all.map { it.id }
        assertEquals(ids.sorted(), ids)
        assertEquals(RnReferenceRegistry.scenarioIds(), ids.toSet())

        val destination =
            SandboxCatalogNavigation.destinationForOpenById(
                storyId = ids.first(),
                stories = AppStories.all,
            )
        assertTrue(destination is SandboxCatalogDestination.StoryDetail)
    }
}
