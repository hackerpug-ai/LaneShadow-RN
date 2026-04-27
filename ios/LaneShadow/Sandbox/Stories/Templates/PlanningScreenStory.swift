import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// PlanningScreen stories — Navigator planning state templates.
@MainActor
enum PlanningScreenStory {
    static let all: [Story] = [
        // Phase 1 (Scouting)
        Story(
            id: "templates.planning.phase1",
            tier: .template,
            component: "PlanningScreen",
            name: "Phase 1 · Scouting",
            summary: "Region scan — sketching stub growing, phase 1 active pulsing",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 1
            )
        },

        // Phase 2 (Drawing) — Default
        Story(
            id: "templates.planning.default",
            tier: .template,
            component: "PlanningScreen",
            name: "Default — Phase 2",
            summary: "Candidate routes — sketching extended, phase 2 active, phases 1 done",
            argTypes: [
                ArgType(
                    "activePhase",
                    label: "Active Phase",
                    control: .range(min: 1, max: 5, step: 1),
                    summary: "Which planning phase is active (1–5)"
                ),
            ],
            initialArgs: ArgValues(["activePhase": 2]),
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: args.int("activePhase") ?? 2
            )
        },

        // Phase 3 (Weather)
        Story(
            id: "templates.planning.phase3",
            tier: .template,
            component: "PlanningScreen",
            name: "Phase 3 · Weather",
            summary: "Sun & wind check — weather icons along route, phase 3 active",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 3
            )
        },

        // Phase 4 (Scoring)
        Story(
            id: "templates.planning.phase4",
            tier: .template,
            component: "PlanningScreen",
            name: "Phase 4 · Scoring",
            summary: "Ranking candidates — three polylines visible, phase 4 active",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 4
            )
        },

        // Phase 5 (Picking)
        Story(
            id: "templates.planning.phase5",
            tier: .template,
            component: "PlanningScreen",
            name: "Phase 5 · Picking",
            summary: "Selecting best — final evaluation, phase 5 active",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 5
            )
        },

        // Dark mode variant
        Story(
            id: "templates.planning.dark",
            tier: .template,
            component: "PlanningScreen",
            name: "Dark Mode — Phase 2",
            summary: "Phase 2 in dark mode — all surfaces re-resolve to dark tokens",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 2
            )
            .preferredColorScheme(.dark)
        },
    ]
}
