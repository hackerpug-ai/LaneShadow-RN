---
sprint: 7
slug: sprint-07-agent-rebuild-grounding
sequence: 7
timeline: Phase 4
status: Planned
prd: .spec/prds/route-agent-quality/README.md
prd_version: 3.1.1
roadmap: .spec/prds/route-agent-quality/ROADMAP.md
generated_by: ro-sprint-tasks-plan
generated: 2026-08-02T00:00:00Z
planned_from_source_sha: c36f48a216c8750483bc679f9d374124983c1dab
source_kind: git-head
registrar_sprint_id: sprint-07-agent-rebuild-grounding
---

# Sprint 07: Agent rebuild — grounded discovery + honesty

**Sequence:** 7
**Timeline:** Phase 4
**Status:** Planned
**Proposed by:** mastra-planner (lane) + aisdk-planner (pi-ai teardown) + mastra-evals-implementer (replay foundation) + react-native-ui-planner (chat render)

## Overview

Rebuild the conversation layer on the proven Sprint 02 Mastra foundation: one
`@mastra/core` agent loop in Convex `'use node'`, with deterministic scaffolding
ported off `@mariozechner/pi-ai`, versioned prompt artifacts, Convex-backed
`agentMemory`, a hardened 9-tool registry that serves through the Sprint 06
rider-ready gate, grounded discovery + honesty behavior, an eval harness with
SLC/Ogden replay, and chat UI that surfaces real distances and clarifying
questions.

**Atomic constraint:** S7-T1 (port scaffolding) and S7-T2 (rideAgent cutover +
pi-ai removal) co-land in one deploy — Convex bundles the whole deployment, so a
single missing pi-ai import fails every function. Teardown is safe only after
Sprint 02 discharged T-AGT-024 (enrichment re-ratification).

## Human Testing Gate

**Gate:** The founder's "twisty roads near Ogden" chat request on the running app
returns only genuinely-near routes, each showing its real distance from Ogden.

### Human Test Deliverable

A cold-boot chat session near Ogden on the iOS simulator where every suggested
route carries a real Ogden distance, no beyond-radius route is called "near",
turn-two "OK what's scenic" stays near Ogden, a location-less ask yields one
clarifying question, and "Slc to park city" still compiles a real route through
the preserved pipeline tools.

### Test Steps

1. Cold-boot the app near Ogden on the iOS sim.
2. Open chat and ask "twisty roads near Ogden".
3. Confirm every suggested route shows a real Ogden distance.
4. Confirm no route beyond the radius is called "near".
5. Ask "OK what's scenic" and confirm results stay near Ogden.
6. Ask "find me something scenic" with no location — expect one clarifying question.
7. Ask "Slc to park city" and confirm a real route still compiles.

## Tasks

| ID | Title | brain_agent | Estimate | depends_on |
|----|-------|-------------|----------|------------|
| S7-T1 | Port deterministic scaffolding off pi-ai (budgetTracker, piTools→Zod, sendMessage types, generateTripPlan live action) | convex-implementer | 180 min | — |
| S7-T2 | rideAgent.ts stateless singleton + ATOMIC cutover: delete dispatch/sub-agents/runAgent, refactor pendingSketches, remove @mariozechner/pi-ai | convex-implementer | 240 min | S7-T1 |
| S7-T3 | Versioned prompt artifact prompts/orchestrator.v1.ts (PROMPT_VERSION + buildSystemPrompt) | convex-implementer | 120 min | S7-T2 |
| S7-T4 | Deterministic memory: agentMemory R/W + dynamic prompt injection + piMessage→AI-SDK read translation + provenance stamping | convex-implementer | 150 min | S7-T2 |
| S7-T5 | Core 9-tool registry hardened: searchCuratedRoutes (center-REQUIRED, SURF-gated) + geocodePlace + planRoute + searchNearby + webSearch (errors-as-data) | convex-implementer | 180 min | S7-T2 |
| S7-T6 | Grounded discovery + one-question interrogation + distance/thin-data honesty behavior | convex-implementer | 150 min | S7-T3, S7-T4, S7-T5 |
| S7-T7 | Eval harness foundation: fixture format + MockLanguageModel seam + eval-gold piMessage→AI-SDK migration (T-AGT-025) | convex-implementer | 180 min | S7-T2 |
| S7-T8 | SLC/Ogden transcript replay: old behavior RED, rebuilt GREEN + deterministic policy graders (T-AGT-013) | convex-implementer | 150 min | S7-T6, S7-T7 |
| S7-T9 | Chat render: per-option real distance cards + clarifying-question/thin-candor prose in session-message bubble | react-native-ui-implementer | 120 min | S7-T6 |
| S7-T10 | Verify grounded discovery on the running app (Ogden no-false-proximity gate) | Founder-Operator | 30 min | S7-T8, S7-T9 |

## Dependencies

- Blocks: Sprint 08 (intent/persona), Sprint 09 (eval lane), Sprint 10 (capstone)
- Dependent on: Sprint 02 (Mastra foundation proven), Sprint 06 (rider-ready gate the tool serves)

## PRD Coverage

- UC-AGT-01/02/03/04/05 (grounding + honesty + replay)
- Criteria: T-AGT-001..013, T-AGT-025

## Capability Coverage

- CAP-AGT-01: location-grounded conversational discovery (core rebuild)
- CAP-AGT-02: eval replay foundation (transcript → graded verdict)

## Verification capability (from rogueone.config.ts)

- `test_command`: `pnpm exec vitest run` (vitest-shaped → filter allowed)
- `verifications[]`: `pnpm type-check`, `pnpm lint`, `pnpm exec vitest run`, `npx convex dev --once`
- `roles.red`: configured
- `holdout.storeRoot`: `~/.rogueone/holdout`

## Notes

- ROADMAP agent column lists `convex-implementer` for T1–T8 (Convex `'use node'`
  actions). Reviewer sibling `convex-reviewer` exists on disk. For Mastra-heavy
  review quality, implementers may still be reviewed by convex-reviewer (domain
  of the write surface); mastra-reviewer is available if `brain_agent` is
  reassigned to `mastra-implementer`.
- S7-T10 is a Founder-Operator human gate (`kind: manual-gate`), not RED/GREEN code.
- The 13-file tracing-stub replacement + build-gate greps may land here or roll into Sprint 09.
