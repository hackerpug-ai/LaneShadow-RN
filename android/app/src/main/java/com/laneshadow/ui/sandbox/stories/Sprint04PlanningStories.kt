package com.laneshadow.ui.sandbox.stories

import androidx.compose.runtime.Composable
import com.laneshadow.sandbox.mockproviders.PlanningMockProvider
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.templates.PlanningScreen

/**
 * Sprint 04 PlanningScreen stories.
 *
 * Canonical story IDs (must match iOS exactly):
 * - templates.planning-screen.default
 * - templates.planning-screen.dark
 * - templates.planning-screen.phase1
 * - templates.planning-screen.phase3
 * - templates.planning-screen.phase4
 * - templates.planning-screen.phase5
 * - templates.planning-screen.v-cancel-confirm
 * - templates.planning-screen.v-single-candidate
 * - templates.planning-screen.v-slow
 */
object Sprint04PlanningStories {

    val all: List<SandboxStory> = listOf(
        SandboxStory(
            id = "templates.planning-screen.phase1",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "Phase 1 · Parsing",
            summary = "Region scan — parsing stub growing, phase 1 active pulsing",
        ) {
            val state = PlanningMockProvider.value("default")
            PlanningScreen(
                state = state,
                onMenuTap = {},
                onCollapse = {},
                onFilter = {},
                onDismissCancelConfirm = {},
                onKeepPlanning = {},
                onCancelPlan = {}
            )
        },

        SandboxStory(
            id = "templates.planning-screen.default",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "Default — Phase 2",
            summary = "Candidate routes — searching extended, phase 2 active, phases 1 done",
        ) {
            val state = PlanningMockProvider.value("default")
            PlanningScreen(
                state = state,
                onMenuTap = {},
                onCollapse = {},
                onFilter = {},
                onDismissCancelConfirm = {},
                onKeepPlanning = {},
                onCancelPlan = {}
            )
        },

        SandboxStory(
            id = "templates.planning-screen.phase3",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "Phase 3 · Drafting",
            summary = "Drafting options — route cards forming, phase 3 active",
        ) {
            val state = PlanningMockProvider.value("default")
            PlanningScreen(
                state = state,
                onMenuTap = {},
                onCollapse = {},
                onFilter = {},
                onDismissCancelConfirm = {},
                onKeepPlanning = {},
                onCancelPlan = {}
            )
        },

        SandboxStory(
            id = "templates.planning-screen.phase4",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "Phase 4 · Enriching",
            summary = "Enriching with details — weather, scoring, phase 4 active",
        ) {
            val state = PlanningMockProvider.value("default")
            PlanningScreen(
                state = state,
                onMenuTap = {},
                onCollapse = {},
                onFilter = {},
                onDismissCancelConfirm = {},
                onKeepPlanning = {},
                onCancelPlan = {}
            )
        },

        SandboxStory(
            id = "templates.planning-screen.phase5",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "Phase 5 · Finalizing",
            summary = "Finalizing routes — final polish, phase 5 active",
        ) {
            val state = PlanningMockProvider.value("default")
            PlanningScreen(
                state = state,
                onMenuTap = {},
                onCollapse = {},
                onFilter = {},
                onDismissCancelConfirm = {},
                onKeepPlanning = {},
                onCancelPlan = {}
            )
        },

        SandboxStory(
            id = "templates.planning-screen.dark",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "Dark Mode — Phase 2",
            summary = "Phase 2 in dark mode — all surfaces re-resolve to dark tokens",
        ) {
            val state = PlanningMockProvider.value("default")
            PlanningScreen(
                state = state,
                onMenuTap = {},
                onCollapse = {},
                onFilter = {},
                onDismissCancelConfirm = {},
                onKeepPlanning = {},
                onCancelPlan = {}
            )
        },

        SandboxStory(
            id = "templates.planning-screen.v-slow",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "V01 · Slow Planning",
            summary = "Slow planning — italic apology with dashed border.",
        ) {
            val state = PlanningMockProvider.value("v-slow")
            PlanningScreen(
                state = state,
                onMenuTap = {},
                onCollapse = {},
                onFilter = {},
                onDismissCancelConfirm = {},
                onKeepPlanning = {},
                onCancelPlan = {}
            )
        },

        SandboxStory(
            id = "templates.planning-screen.v-cancel-confirm",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "V02 · Cancel Confirm",
            summary = "Cancel confirm — dimmed phase card, scrim overlay, confirm sheet.",
        ) {
            val state = PlanningMockProvider.value("v-cancel-confirm")
            PlanningScreen(
                state = state,
                onMenuTap = {},
                onCollapse = {},
                onFilter = {},
                onDismissCancelConfirm = {},
                onKeepPlanning = {},
                onCancelPlan = {}
            )
        },

        SandboxStory(
            id = "templates.planning-screen.v-single-candidate",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "V03 · Single Candidate",
            summary = "Single candidate — warning chrome, compass warning tint.",
        ) {
            val state = PlanningMockProvider.value("v-single-candidate")
            PlanningScreen(
                state = state,
                onMenuTap = {},
                onCollapse = {},
                onFilter = {},
                onDismissCancelConfirm = {},
                onKeepPlanning = {},
                onCancelPlan = {}
            )
        },
    )
}
