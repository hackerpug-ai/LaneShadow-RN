import LaneShadowTheme
import NativeSandbox
import SwiftUI

/// PlanningScreen stories — Navigator planning state templates.
@MainActor
enum PlanningScreenStory {
    static let all: [Story] = [
        // Phase 1 (Parsing)
        Story(
            id: "templates.planning.phase1",
            tier: .template,
            component: "PlanningScreen",
            name: "Phase 1 · Parsing",
            summary: "Region scan — parsing stub growing, phase 1 active pulsing",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 1
            )
        },

        // Phase 2 (Searching) — Default
        Story(
            id: "templates.planning.default",
            tier: .template,
            component: "PlanningScreen",
            name: "Default — Phase 2",
            summary: "Candidate routes — searching extended, phase 2 active, phases 1 done",
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

        // Phase 3 (Drafting)
        Story(
            id: "templates.planning.phase3",
            tier: .template,
            component: "PlanningScreen",
            name: "Phase 3 · Drafting",
            summary: "Drafting options — route cards forming, phase 3 active",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 3
            )
        },

        // Phase 4 (Enriching)
        Story(
            id: "templates.planning.phase4",
            tier: .template,
            component: "PlanningScreen",
            name: "Phase 4 · Enriching",
            summary: "Enriching with details — weather, scoring, phase 4 active",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(
                provider: PlanningMockProvider.self,
                activePhase: 4
            )
        },

        // Phase 5 (Finalizing)
        Story(
            id: "templates.planning.phase5",
            tier: .template,
            component: "PlanningScreen",
            name: "Phase 5 · Finalizing",
            summary: "Finalizing routes — final polish, phase 5 active",
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

        // V01: Slow Planning
        Story(
            id: "templates.planning-screen.v-slow",
            tier: .template,
            component: "PlanningScreen",
            name: "V01 · Slow Planning",
            summary: "Slow planning — italic apology with dashed border.",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(provider: PlanningMockProvider.self, variant: "v-slow", activePhase: 2)
        },

        // V02: Cancel Confirm
        Story(
            id: "templates.planning-screen.v-cancel-confirm",
            tier: .template,
            component: "PlanningScreen",
            name: "V02 · Cancel Confirm",
            summary: "Cancel confirm — dimmed phase card, scrim overlay, confirm sheet.",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(provider: PlanningMockProvider.self, variant: "v-cancel-confirm", activePhase: 2)
        },

        // V03: Single Candidate
        Story(
            id: "templates.planning-screen.v-single-candidate",
            tier: .template,
            component: "PlanningScreen",
            name: "V03 · Single Candidate",
            summary: "Single candidate — warning chrome, compass warning tint.",
            previewMode: .fullScreen
        ) { args in
            PlanningScreen(provider: PlanningMockProvider.self, variant: "v-single-candidate", activePhase: 3)
        },
    ]
}
