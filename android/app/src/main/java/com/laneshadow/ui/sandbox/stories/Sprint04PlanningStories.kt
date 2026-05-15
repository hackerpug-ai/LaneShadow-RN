package com.laneshadow.ui.sandbox.stories

import androidx.compose.runtime.Composable
import androidx.compose.foundation.isSystemInDarkTheme
import com.laneshadow.sandbox.mockproviders.PlanningMockProvider
import com.laneshadow.theme.LaneShadowTheme
import com.laneshadow.ui.sandbox.model.SandboxStory
import com.laneshadow.ui.sandbox.model.SandboxTier
import com.laneshadow.ui.templates.PlanningScreen

/**
 * PlanningScreen stories — Navigator planning state templates.
 *
 * Canonical story IDs (must match iOS exactly):
 * - templates.planning-screen.scouting-light
 * - templates.planning-screen.scouting-dark
 * - templates.planning-screen.drawing-light
 * - templates.planning-screen.drawing-dark
 * - templates.planning-screen.weather-light
 * - templates.planning-screen.weather-dark
 * - templates.planning-screen.scoring-light
 * - templates.planning-screen.scoring-dark
 * - templates.planning-screen.slow-planning-light
 * - templates.planning-screen.slow-planning-dark
 * - templates.planning-screen.cancel-prompt-light
 * - templates.planning-screen.cancel-prompt-dark
 * - templates.planning-screen.single-candidate-light
 * - templates.planning-screen.single-candidate-dark
 */
object Sprint04PlanningStories {

    val all: List<SandboxStory> = listOf(
        // S01: Scouting (phase 1)
        SandboxStory(
            id = "templates.planning-screen.scouting-light",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "S01 · Scouting · Light",
            summary = "Region scan — parsing stub growing, phase 1 active pulsing, light theme",
        ) {
            val state = PlanningMockProvider.value("default")
            LaneShadowTheme(darkTheme = false) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        SandboxStory(
            id = "templates.planning-screen.scouting-dark",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "S01 · Scouting · Dark",
            summary = "Region scan — parsing stub growing, phase 1 active pulsing, dark theme",
        ) {
            val state = PlanningMockProvider.value("default")
            LaneShadowTheme(darkTheme = true) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        // S02: Drawing (phase 2)
        SandboxStory(
            id = "templates.planning-screen.drawing-light",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "S02 · Drawing · Light",
            summary = "Candidate routes — searching extended, phase 2 active, phases 1 done, light theme",
        ) {
            val state = PlanningMockProvider.value("default")
            LaneShadowTheme(darkTheme = false) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        SandboxStory(
            id = "templates.planning-screen.drawing-dark",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "S02 · Drawing · Dark",
            summary = "Candidate routes — searching extended, phase 2 active, phases 1 done, dark theme",
        ) {
            val state = PlanningMockProvider.value("default")
            LaneShadowTheme(darkTheme = true) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        // S03: Weather (phase 3)
        SandboxStory(
            id = "templates.planning-screen.weather-light",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "S03 · Weather · Light",
            summary = "Weather overlay — route drafting with conditions, phase 3 active, light theme",
        ) {
            val state = PlanningMockProvider.value("default")
            LaneShadowTheme(darkTheme = false) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        SandboxStory(
            id = "templates.planning-screen.weather-dark",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "S03 · Weather · Dark",
            summary = "Weather overlay — route drafting with conditions, phase 3 active, dark theme",
        ) {
            val state = PlanningMockProvider.value("default")
            LaneShadowTheme(darkTheme = true) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        // S04: Scoring (phase 4)
        SandboxStory(
            id = "templates.planning-screen.scoring-light",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "S04 · Scoring · Light",
            summary = "Route scoring — three candidates visible, phase 4 active, light theme",
        ) {
            val state = PlanningMockProvider.value("default")
            LaneShadowTheme(darkTheme = false) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        SandboxStory(
            id = "templates.planning-screen.scoring-dark",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "S04 · Scoring · Dark",
            summary = "Route scoring — three candidates visible, phase 4 active, dark theme",
        ) {
            val state = PlanningMockProvider.value("default")
            LaneShadowTheme(darkTheme = true) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        // V01: Slow Planning
        SandboxStory(
            id = "templates.planning-screen.slow-planning-light",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "V01 · Slow Planning · Light",
            summary = "Slow planning delay — italic apology with dashed border, phase 2 active, light theme",
        ) {
            val state = PlanningMockProvider.value("v-slow")
            LaneShadowTheme(darkTheme = false) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        SandboxStory(
            id = "templates.planning-screen.slow-planning-dark",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "V01 · Slow Planning · Dark",
            summary = "Slow planning delay — italic apology with dashed border, phase 2 active, dark theme",
        ) {
            val state = PlanningMockProvider.value("v-slow")
            LaneShadowTheme(darkTheme = true) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        // V02: Cancel Prompt
        SandboxStory(
            id = "templates.planning-screen.cancel-prompt-light",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "V02 · Cancel Prompt · Light",
            summary = "Cancel prompt — dimmed phase card, scrim overlay, confirm sheet, light theme",
        ) {
            val state = PlanningMockProvider.value("v-cancel-confirm")
            LaneShadowTheme(darkTheme = false) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        SandboxStory(
            id = "templates.planning-screen.cancel-prompt-dark",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "V02 · Cancel Prompt · Dark",
            summary = "Cancel prompt — dimmed phase card, scrim overlay, confirm sheet, dark theme",
        ) {
            val state = PlanningMockProvider.value("v-cancel-confirm")
            LaneShadowTheme(darkTheme = true) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        // V03: Single Candidate
        SandboxStory(
            id = "templates.planning-screen.single-candidate-light",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "V03 · Single Candidate · Light",
            summary = "Single candidate — warning chrome, over-constraint advisory, phase 5 active, light theme",
        ) {
            val state = PlanningMockProvider.value("v-single-candidate")
            LaneShadowTheme(darkTheme = false) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },

        SandboxStory(
            id = "templates.planning-screen.single-candidate-dark",
            tier = SandboxTier.Template,
            component = "PlanningScreen",
            name = "V03 · Single Candidate · Dark",
            summary = "Single candidate — warning chrome, over-constraint advisory, phase 5 active, dark theme",
        ) {
            val state = PlanningMockProvider.value("v-single-candidate")
            LaneShadowTheme(darkTheme = true) {
                PlanningScreen(
                    state = state,
                    onMenuTap = {},
                    onCollapse = {},
                    onFilter = {},
                    onDismissCancelConfirm = {},
                    onKeepPlanning = {},
                    onCancelPlan = {}
                )
            }
        },
    )
}
