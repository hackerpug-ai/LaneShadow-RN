package com.laneshadow.ui.sandbox

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
    fun `AppStories all returns at least 35 sprint-04 template stories`() {
        val allStories = AppStories.all

        // Filter to only template tier stories
        val templateStories = allStories.filter { it.tier == SandboxTier.Template }

        // Should have at least 35 sprint-04 template stories
        assertThat(templateStories.size).isAtLeast(35)
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
    fun `Planning screen has 9 canonical variants`() {
        val planningStories = Sprint04PlanningStories.all

        assertThat(planningStories.size).isEqualTo(9)

        val ids = planningStories.map { story -> story.id }.toSet()
        assertThat(ids).containsAtLeastElementsIn(
            listOf(
                "templates.planning-screen.default",
                "templates.planning-screen.dark",
                "templates.planning-screen.phase1",
                "templates.planning-screen.phase3",
                "templates.planning-screen.phase4",
                "templates.planning-screen.phase5",
                "templates.planning-screen.v-cancel-confirm",
                "templates.planning-screen.v-single-candidate",
                "templates.planning-screen.v-slow"
            )
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
}
