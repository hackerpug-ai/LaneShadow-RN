import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// PlanningScreen stories — Navigator planning state templates.
@MainActor
enum PlanningScreenStory {
    static let all: [Story] = [
        // S01: Scouting · Light (phase 1)
        Story(
            id: "templates.planning-screen.scouting-light",
            tier: .template,
            component: "PlanningScreen",
            name: "S01 · Scouting · Light",
            summary: "Region scan — parsing stub growing, phase 1 active pulsing, light theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 1
            )
        },

        // S01: Scouting · Dark (phase 1, dark theme)
        Story(
            id: "templates.planning-screen.scouting-dark",
            tier: .template,
            component: "PlanningScreen",
            name: "S01 · Scouting · Dark",
            summary: "Region scan — parsing stub growing, phase 1 active pulsing, dark theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 1
            )
            .preferredColorScheme(.dark)
        },

        // S02: Drawing · Light (phase 2)
        Story(
            id: "templates.planning-screen.drawing-light",
            tier: .template,
            component: "PlanningScreen",
            name: "S02 · Drawing · Light",
            summary: "Candidate routes — searching extended, phase 2 active, phases 1 done, light theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 2
            )
        },

        // S02: Drawing · Dark (phase 2, dark theme)
        Story(
            id: "templates.planning-screen.drawing-dark",
            tier: .template,
            component: "PlanningScreen",
            name: "S02 · Drawing · Dark",
            summary: "Candidate routes — searching extended, phase 2 active, phases 1 done, dark theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 2
            )
            .preferredColorScheme(.dark)
        },

        // S03: Weather · Light (phase 3)
        Story(
            id: "templates.planning-screen.weather-light",
            tier: .template,
            component: "PlanningScreen",
            name: "S03 · Weather · Light",
            summary: "Weather overlay — route drafting with conditions, phase 3 active, light theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 3
            )
        },

        // S03: Weather · Dark (phase 3, dark theme)
        Story(
            id: "templates.planning-screen.weather-dark",
            tier: .template,
            component: "PlanningScreen",
            name: "S03 · Weather · Dark",
            summary: "Weather overlay — route drafting with conditions, phase 3 active, dark theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 3
            )
            .preferredColorScheme(.dark)
        },

        // S04: Scoring · Light (phase 4)
        Story(
            id: "templates.planning-screen.scoring-light",
            tier: .template,
            component: "PlanningScreen",
            name: "S04 · Scoring · Light",
            summary: "Route scoring — three candidates visible, phase 4 active, light theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 4
            )
        },

        // S04: Scoring · Dark (phase 4, dark theme)
        Story(
            id: "templates.planning-screen.scoring-dark",
            tier: .template,
            component: "PlanningScreen",
            name: "S04 · Scoring · Dark",
            summary: "Route scoring — three candidates visible, phase 4 active, dark theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 4
            )
            .preferredColorScheme(.dark)
        },

        // V01: Slow Planning · Light
        Story(
            id: "templates.planning-screen.slow-planning-light",
            tier: .template,
            component: "PlanningScreen",
            name: "V01 · Slow Planning · Light",
            summary: "Slow planning delay — italic apology with dashed border, phase 2 active, light theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(provider: PlanningMockProvider.self, variant: "v-slow", activePhase: 2)
        },

        // V01: Slow Planning · Dark
        Story(
            id: "templates.planning-screen.slow-planning-dark",
            tier: .template,
            component: "PlanningScreen",
            name: "V01 · Slow Planning · Dark",
            summary: "Slow planning delay — italic apology with dashed border, phase 2 active, dark theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(provider: PlanningMockProvider.self, variant: "v-slow", activePhase: 2)
                .preferredColorScheme(.dark)
        },

        // V02: Cancel Prompt · Light
        Story(
            id: "templates.planning-screen.cancel-prompt-light",
            tier: .template,
            component: "PlanningScreen",
            name: "V02 · Cancel Prompt · Light",
            summary: "Cancel prompt — dimmed phase card, scrim overlay, confirm sheet, light theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(provider: PlanningMockProvider.self, variant: "v-cancel-confirm", activePhase: 2)
        },

        // V02: Cancel Prompt · Dark
        Story(
            id: "templates.planning-screen.cancel-prompt-dark",
            tier: .template,
            component: "PlanningScreen",
            name: "V02 · Cancel Prompt · Dark",
            summary: "Cancel prompt — dimmed phase card, scrim overlay, confirm sheet, dark theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(provider: PlanningMockProvider.self, variant: "v-cancel-confirm", activePhase: 2)
                .preferredColorScheme(.dark)
        },

        // V03: Single Candidate · Light
        Story(
            id: "templates.planning-screen.single-candidate-light",
            tier: .template,
            component: "PlanningScreen",
            name: "V03 · Single Candidate · Light",
            summary: "Single candidate — warning chrome, over-constraint advisory, phase 5 active, light theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(provider: PlanningMockProvider.self, variant: "v-single-candidate", activePhase: 5)
        },

        // V03: Single Candidate · Dark
        Story(
            id: "templates.planning-screen.single-candidate-dark",
            tier: .template,
            component: "PlanningScreen",
            name: "V03 · Single Candidate · Dark",
            summary: "Single candidate — warning chrome, over-constraint advisory, phase 5 active, dark theme",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(provider: PlanningMockProvider.self, variant: "v-single-candidate", activePhase: 5)
                .preferredColorScheme(.dark)
        },
    ]
}
