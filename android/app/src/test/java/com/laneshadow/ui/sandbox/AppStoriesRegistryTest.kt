package com.laneshadow.ui.sandbox

import com.laneshadow.sandbox.stories.AppStories as DebugAppStories
import com.nativesandbox.model.ComponentTier
import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.sandbox.stories.AppStories
import com.laneshadow.ui.sandbox.stories.Sprint04ErrorStories
import com.laneshadow.ui.sandbox.stories.Sprint04IdleStories
import com.laneshadow.ui.sandbox.stories.Sprint04PlanningStories
import com.laneshadow.ui.sandbox.stories.Sprint04RouteDetailsStories
import com.laneshadow.ui.sandbox.stories.Sprint04RouteResultsStories
import com.laneshadow.ui.sandbox.stories.Sprint04SessionsStories
import com.google.common.truth.Truth.assertThat
import org.junit.Test

/**
 * Test AppStories registry for Sprint 04 template story registration.
 *
 * AC1: AppStories.all() returns ≥ 35 sprint-04 template entries
 * AC2: Each screen has exact variant sets matching iOS canonical IDs
 */
class AppStoriesRegistryTest {

    @Test
    fun context_capsule_registers_ten_canonical_stories() {
        val capsuleStories = DebugAppStories.all.filter { it.id.startsWith("molecules.context-capsule.") }

        assertThat(capsuleStories).hasSize(10)
        assertThat(capsuleStories.map { it.id }).containsExactly(
            "molecules.context-capsule.idle-dark",
            "molecules.context-capsule.idle-light",
            "molecules.context-capsule.planning-dark",
            "molecules.context-capsule.planning-light",
            "molecules.context-capsule.route-dark",
            "molecules.context-capsule.route-light",
            "molecules.context-capsule.saved-dark",
            "molecules.context-capsule.saved-light",
            "molecules.context-capsule.warning-dark",
            "molecules.context-capsule.warning-light",
        )
        assertThat(capsuleStories.map { it.component }.distinct()).containsExactly("LSContextCapsule")
        assertThat(capsuleStories.map { it.tier }.distinct()).containsExactly(ComponentTier.Molecule)
    }

    @Test
    fun `AppStories all returns at least 40 sprint-04 template stories`() {
        val allStories = AppStories.all

        // Filter to only template tier stories
        val templateStories = allStories.filter { it.tier == SandboxTier.Template }

        // Should have at least 40 sprint-04 template stories (planning stories expanded from 9 to 14)
        assertThat(templateStories.size).isAtLeast(40)
    }

    @Test
    fun `Idle screen has 7 canonical variants`() {
        val idleStories = Sprint04IdleStories.all

        assertThat(idleStories.size).isEqualTo(7)

        val ids = idleStories.map { it.id }.toSet()
        assertThat(ids).containsAtLeastElementsIn(
            listOf(
                "templates.idle-screen.default",
                "templates.idle-screen.s02-typing-send",
                "templates.idle-screen.s03-dark",
                "templates.idle-screen.s04-filter-sheet",
                "templates.idle-screen.v-first-ride",
                "templates.idle-screen.v-no-location",
                "templates.idle-screen.v-weather-advisory"
            )
        )
    }

    @Test
    fun `Planning screen has 14 canonical variants (7 screens x 2 themes)`() {
        val planningStories = Sprint04PlanningStories.all

        assertThat(planningStories.size).isEqualTo(14)

        val ids = planningStories.map { story -> story.id }.toSet()
        assertThat(ids).containsExactly(
            "templates.planning-screen.scouting-light",
            "templates.planning-screen.scouting-dark",
            "templates.planning-screen.drawing-light",
            "templates.planning-screen.drawing-dark",
            "templates.planning-screen.weather-light",
            "templates.planning-screen.weather-dark",
            "templates.planning-screen.scoring-light",
            "templates.planning-screen.scoring-dark",
            "templates.planning-screen.slow-planning-light",
            "templates.planning-screen.slow-planning-dark",
            "templates.planning-screen.cancel-prompt-light",
            "templates.planning-screen.cancel-prompt-dark",
            "templates.planning-screen.single-candidate-light",
            "templates.planning-screen.single-candidate-dark"
        )
    }

    @Test
    fun `Route results screen has 7 canonical variants`() {
        val routeResultsStories = Sprint04RouteResultsStories.all

        assertThat(routeResultsStories).hasSize(7)

        val ids = routeResultsStories.map { story -> story.id }.toSet()
        assertThat(ids).containsAtLeastElementsIn(
            listOf(
                "templates.route-results-screen.default",
                "templates.route-results-screen.s02-alt-selected",
                "templates.route-results-screen.s03-dark",
                "templates.route-results-screen.s04-refining",
                "templates.route-results-screen.v01-default",
                "templates.route-results-screen.v02-weather-divergent",
                "templates.route-results-screen.v03-recall"
            )
        )
    }

    @Test
    fun `Route details screen has 6 canonical variants`() {
        val routeDetailsStories = Sprint04RouteDetailsStories.all

        assertThat(routeDetailsStories).hasSize(6)

        val ids = routeDetailsStories.map { story -> story.id }.toSet()
        assertThat(ids).containsAtLeastElementsIn(
            listOf(
                "templates.route-details-screen.default",
                "templates.route-details-screen.s02-mixed-weather",
                "templates.route-details-screen.s03-dark",
                "templates.route-details-screen.s04-medium",
                "templates.route-details-screen.s05-dismissing",
                "templates.route-details-screen.v01-saved"
            )
        )
    }

    @Test
    fun `Error screen has 6 canonical variants`() {
        val errorStories = Sprint04ErrorStories.all

        assertThat(errorStories).hasSize(6)

        val ids = errorStories.map { story -> story.id }.toSet()
        assertThat(ids).containsAtLeastElementsIn(
            listOf(
                "templates.error-screen.default",
                "templates.error-screen.s02-dark",
                "templates.error-screen.s03-extended",
                "templates.error-screen.s04-recovered",
                "templates.error-screen.v01-offline",
                "templates.error-screen.v02-generic"
            )
        )
    }

    @Test
    fun `Sessions screen has 1 canonical variant`() {
        val sessionsStories = Sprint04SessionsStories.all

        assertThat(sessionsStories.size).isEqualTo(1)

        val ids = sessionsStories.map { story -> story.id }.toSet()
        assertThat(ids).contains(
            "templates.sessions-screen.default"
        )
    }

    @Test
    fun `All sprint-04 stories have template tier`() {
        val allStories = AppStories.all

        val allTemplates = allStories.filter { it.tier == SandboxTier.Template }

        // All template stories should be from sprint-04
        allTemplates.forEach { story ->
            assertThat(story.id).startsWith("templates.")
        }
    }

    @Test
    fun `All sprint-04 stories have non-empty content lambdas`() {
        val allStories = AppStories.all

        allStories.forEach { story ->
            // Content should be a non-null composable lambda
            assertThat(story.content).isNotNull()
        }
    }

    @Test
    fun map_controls_registers_eight_canonical_stories() {
        val mapControlStories = DebugAppStories.all.filter { it.id.startsWith("organisms.map-controls.") }

        assertThat(mapControlStories).hasSize(8)

        assertThat(mapControlStories.map { it.id }).containsExactly(
            "organisms.map-controls.map-light",
            "organisms.map-controls.map-dark",
            "organisms.map-controls.map-with-route-light",
            "organisms.map-controls.map-with-route-dark",
            "organisms.map-controls.map-saved-light",
            "organisms.map-controls.map-saved-dark",
            "organisms.map-controls.chat-light",
            "organisms.map-controls.chat-dark"
        )

        // Verify each story has correct tier and component
        assertThat(mapControlStories.map { it.component }.distinct()).containsExactly("LSMapControls")
        assertThat(mapControlStories.map { it.tier }.distinct()).containsExactly(ComponentTier.Organism)
    }
}
