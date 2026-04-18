package com.laneshadow.ui.sandbox.registry

import com.laneshadow.ui.sandbox.model.SandboxTier

data class RnReferenceScenario(
    val id: String,
    val tier: SandboxTier,
    val componentName: String,
    val stateName: String,
    val rnReferencePath: String,
    val storyExport: String,
    val fixtureKey: String,
    val themeCoverage: List<String>,
    val accessibilityLabels: List<String>,
    val supportsOpenById: Boolean = false,
    val requiresKeyboardSafeAreaHandling: Boolean = false,
) {
    val summary: String
        get() = "RN reference: $rnReferencePath#$storyExport"
}

object RnReferenceRegistry {
    val all: List<RnReferenceScenario> = listOf(
        RnReferenceScenario(
            id = "templates/android-sandbox-host/default",
            tier = SandboxTier.Infrastructure,
            componentName = "AndroidSandboxHost",
            stateName = "Default",
            rnReferencePath = "react-native/stories/registry/ScenarioRegistry.stories.tsx",
            storyExport = "Browser",
            fixtureKey = "android-sandbox-host-default",
            themeCoverage = listOf("light", "dark"),
            accessibilityLabels = listOf("Sandbox primary action", "Sandbox secondary action"),
        ),
        RnReferenceScenario(
            id = "templates/sandbox-catalog-navigation/open-by-id",
            tier = SandboxTier.Infrastructure,
            componentName = "SandboxCatalogNavigation",
            stateName = "OpenById",
            rnReferencePath = "react-native/stories/registry/ScenarioRegistry.stories.tsx",
            storyExport = "Browser",
            fixtureKey = "sandbox-catalog-open-by-id",
            themeCoverage = listOf("light", "dark"),
            accessibilityLabels = listOf("Sandbox search field", "Sandbox primary action"),
            supportsOpenById = true,
            requiresKeyboardSafeAreaHandling = true,
        ),
        RnReferenceScenario(
            id = "templates/rn-reference-registry/default",
            tier = SandboxTier.Infrastructure,
            componentName = "RnReferenceRegistry",
            stateName = "Default",
            rnReferencePath = "react-native/stories/registry/scenarioRegistry.generated.ts",
            storyExport = "scenarioRegistry",
            fixtureKey = "rn-reference-registry-default",
            themeCoverage = listOf("light", "dark"),
            accessibilityLabels = listOf("Sandbox primary action"),
        ),
        RnReferenceScenario(
            id = "templates/rn-reference-registry/empty",
            tier = SandboxTier.Infrastructure,
            componentName = "RnReferenceRegistry",
            stateName = "Empty",
            rnReferencePath = "react-native/stories/registry/ScenarioRegistry.stories.tsx",
            storyExport = "Browser",
            fixtureKey = "rn-reference-registry-empty",
            themeCoverage = listOf("light", "dark"),
            accessibilityLabels = listOf("Sandbox secondary action"),
        ),
    )

    fun scenarioIds(): Set<String> = all.map { it.id }.toSet()
}
