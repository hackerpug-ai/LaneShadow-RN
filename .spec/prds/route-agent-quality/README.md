---
title: Route & Agent Quality — Real Roads, Honest Assistant
version: 3.1.0
scope_posture: full
pr_sequencing: false
---

# Route & Agent Quality — PRD

One trust program, two halves: **Route Quality** (rescue-first geometry recovery over the
full 5,757-route catalog + one deterministic verification gate + a hard rider-ready gate on
every suggestion surface) and **Agent Quality** (the conversation layer rebuilt on Mastra —
Sonnet-class smart loop with tools, location-grounded discovery, one-question interrogation,
honest distances, transcript-replay evals). Delivers FOUNDER-BAR Trust T1 + T2 and the chat
surface that lets the founder feel them. Ships **before** the enrichment R-leg.

> **Grounding:** the founder-ratified geometry strategy + real-service PoC of 2026-07-10
> (`.spec/proposals/geometry-completion/` — full prod-export audit; reconstruction PASS at
> ratio 1.00 on two real routes) and the same-day agent diagnosis against live
> `session_messages` transcripts + orchestrator source (regex discovery with a one-city
> gazetteer, rider location never passed, gpt-4.1 emergency-fallback tier). Authored by a
> planner team (product-manager lead, convex-planner, frontend-designer). Supersedes/extends
> `.spec/prds/catalog-geometry-recovery/`. v1.0.0 shipped as "Geometry Completion".

## PRD Metadata

| Field | Value |
|-------|-------|
| Version | 3.1.0 |
| Scope Posture | Full feature (default) |
| PR Sequencing | Disabled |
| Created | 2026-07-10 |
| Last Updated | 2026-07-11 |
| Predecessors | `.spec/prds/catalog-geometry-recovery/` (superseded), `.spec/prds/curation-hardening/` (score/dedup context) |
| Sequenced before | `.spec/prds/enrichment/` (R-leg generates only over plottable routes) |

## Document Index

| File | Section | Stability |
|------|---------|-----------|
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution summary, FOUNDER-BAR anchoring | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | Rider, Founder-Operator, System | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Group overview + UC summary | FEATURE_SPEC |
| [04-uc-hyg.md](./04-uc-hyg.md) | UC-HYG-01 … UC-HYG-04 (Catalog Hygiene) | FEATURE_SPEC |
| [05-uc-rec.md](./05-uc-rec.md) | UC-REC-01 … UC-REC-05 (Geometry Recovery) | FEATURE_SPEC |
| [06-uc-ver.md](./06-uc-ver.md) | UC-VER-01 … UC-VER-05 (Verification & Review) | FEATURE_SPEC |
| [07-uc-surf.md](./07-uc-surf.md) | UC-SURF-01 … UC-SURF-06 (Rider-Ready Surface) | FEATURE_SPEC |
| [08-uc-agt.md](./08-uc-agt.md) | UC-AGT-01 … UC-AGT-06 (Agent Quality) | FEATURE_SPEC |
| [09-team-contributions.md](./09-team-contributions.md) | Phase contributions | - |
| [10-technical-requirements/](./10-technical-requirements/README.md) | Technical specifications — folder; see its README Section Index (incl. 10-routing.md: route map + Route Delta; 11-e2e-testing.md: harness constitution) | CONSTITUTION |
| [11-e2e-testing-criteria.md](./11-e2e-testing-criteria.md) | Per-UC test criteria with type tags, AC refs, setup, pass/fail — sprint gates draw [human-gate] criteria from here | TEST_SPEC |

## Quick Stats

| Metric | Value |
|--------|-------|
| Functional Groups | 5 (HYG, REC, VER, SURF, AGT) |
| Use Cases | 26 |
| Acceptance Criteria | 142 |
| Test Criteria | 94 (66 integration, 13 e2e, 11 human-gate, 5 api-contract, 2 build-gate; dual-typed rows noted in-file) |
| System Components | 24 (route pipeline 18 + agent layer 6) |
| Data Entities | 2 modified tables + 2 new indexes + a non-additive geospatial `riderReady` re-index; `agentMemory` rides `planning_sessions` (`@mastra/memory` dropped) |
| Capability Chains | 8 (CAP-GEO-01…06, CAP-AGT-01…02) |
| External Dependencies | Google Geocoding/Routes, LLM tiers (geometry + orchestrator + classifier), @mastra/core, @mapbox/polyline, Mapbox Static, LangSmith |
| Routes / States | 0 new routes / 6 new states across 2 existing views |
| Catalog outcome | rider-ready 1,171 → **realized count accepted against a per-lever yield table** (no committed target; 4,300–4,700 is an unvalidated projection); ≈$150 API spend; agent turn ≈1–3¢ |

## Version History

| Version | Date | Changes | Trigger |
|---------|------|---------|---------|
| 1.0.0 | 2026-07-10 | Initial PRD as "Geometry Completion" (HYG/REC/VER/SURF, 20 UCs) | Ratified geometry-completion strategy (post-audit brainstorm + real-service PoC) |
| 2.0.0 | 2026-07-10 | Renamed to "Route & Agent Quality"; added AGT group (5 UCs: Mastra rebuild, location-grounded discovery, interrogation, honesty, evals+observability); scope + TR + criteria + scenarios extended | Founder agent-failure diagnosis (live SLC/Ogden transcripts) + ratified rebuild decisions |
| 3.0.0 | 2026-07-11 | Persona pass (`.spec/USER-PROFILES.md`): UC-AGT-02 → location AND intent grounding (+duration translation, +waypoint-anchored stops); UC-AGT-04 +volunteered weather verdicts; UC-AGT-01 +personal-library awareness; NEW UC-AGT-06 "Shape replies to the rider" (≤3-option default w/ depth on request, honest comfort labels, persistent constraints, shareable close). 26 UCs / 139 ACs / 89 criteria. Cross-session growth memory stays DEFERRED. | Persona alignment ("what could our users need from our agent?") |
| 3.0.1 | 2026-07-11 | TECHNICAL (TR folder only; UCs/ACs/criteria unchanged): agent shape as stateless module singleton + the tools-vs-prompting enforcement ruling (~70% tool contracts / ~30% eval-verified prompting); full 9-tool contract table (Zod schemas + error taxonomies); `session_messages`/`agentMemory` schema deltas; conversation-path architecture diagram; ModelRouter-string model-ref correction; risks 15–20; eval lane deepened (fixtures, `MockLanguageModel` seam, grader taxonomy, prompt-edit CI gate) + telemetry span spec; NEW TR 12-agent-prompting.md (versioned prompt artifact). | Founder: "thin on technical requirements for the agent work" — mastra-planner deep-dive |
| 3.0.2 | 2026-07-11 | TECHNICAL: pi-ai removed entirely — all four LLM tiers (orchestrator, geometry, classifier, enrichment) resolve through the Mastra model layer as ModelRouter strings; pipeline extractions become Zod structured outputs on single-shot Mastra generations; `@mariozechner/pi-ai` dropped from `package.json`. One model layer, one fixture seam. | Founder: "fine completely removing pi for mastra" |
| 3.1.0 | 2026-07-11 | Red-hat remediation (`/review-red-hat` → `/kb-prd-plan --update`): +3 ACs / +5 criteria → **26 UCs / 142 ACs / 94 criteria**. Founder decisions: (1) pi-ai ported off entirely incl. enrichment GLM-5.2 → custom AI-SDK provider (enrichment PRD flagged for re-ratification); (2) share descoped to Save-only; (3) catalog target dropped for a **realized-yield acceptance gate** (UC-REC-04 AC-7) + **founder-region Saturday-arc gate** (AC-8) + **top-50-by-rank review** (UC-VER-05 AC-6). Spike gates promoted to criteria rows with numeric pass/fail (T-REC-016 geometry §5 decoupled, T-AGT-023 Mastra §5b). TR corrections: geospatial `riderReady` re-index (gating missed bbox/nearest), `geometryStatus` 3-sites, `favorite_roads` gap, `@mastra/memory` dropped (double-load resolved), pi-ai 13-file teardown inventory (`generateTripPlan` was unlisted), structured-output primitive named (tool-less Agent), tracing 13-file refactor, tool-schema token tax, model-id smoke gate, surface fix-sites (0mi at `index.tsx:350`, `fellBackToBest` not returned, dead Maestro AC-1). | Red-hat 4-agent cycle (pm + convex + mastra + rn planners) |

## Next Steps

- `/kb-sprint-plan` — build the implementation roadmap. **Every sprint's human testing gate
  draws [human-gate] criteria from [`11-e2e-testing-criteria.md`](./11-e2e-testing-criteria.md).**
  Two spike gates belong in the first sprints: the geometry reference flow (TR 11 §5) and the
  Mastra-in-Convex reference conversation (TR 11 §5b).
- `/kb-sprint-tasks-plan` — expand sprints into task files.
- Out-of-band review: `/review-red-hat` on this folder, then `/kb-prd-plan --update` to fold
  in findings.
