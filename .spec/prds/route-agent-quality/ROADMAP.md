---
roadmap: 1
project: Route & Agent Quality
generated: 2026-07-12T00:09:15Z
prd: .spec/prds/route-agent-quality/README.md
prd_version: 3.1.1
sprint_count: 10
pr_sequencing: false
---

# Sprint Roadmap: Route & Agent Quality

## Overview

**Sprints:** 10
**Total Tasks:** 61
**Current Sprint:** 1 — Geometry reference-flow spike (In Progress; tasks expanded)

Gate-first roadmap for the v3.1.1 PRD (26 UCs / 142 ACs / 97 criteria). Every sprint closes on a
human-testing gate the Founder-Operator verifies on the running app or via a real operator command
on **real, un-seeded** data — the previous PRD "completed" while the catalog stayed junk, so no gate
passes on fixtures alone. Two de-risking spikes open the sequence; REC↔VER are phase-sliced (not
group-sliced) per the PRD slicing note; the capstone proves the Trust half of FOUNDER-BAR.

**No leading INFRA sprint:** both target surfaces have playback frameworks
(`detect_e2e_framework.py`: mobile → Maestro PRESENT, service → vitest-integration PRESENT).

**Cross-PRD prerequisite:** the enrichment PRD's `06-external-dependencies.md` re-ratification
(D1 — z.ai GLM-5.2 via a custom AI-SDK provider) is discharged **inside Sprint 02**, gated on the
z.ai structured-output proof (T-AGT-024), and must land before the enrichment PRD's sprints.

**Scope honesty:** the Sprint 10 capstone proves Trust (T1/T2/T3) + agent feel only — it does NOT
green the whole Saturday Bar (Richness R1/R2, Feel F1–F3, Proof P1–P3 are separate initiatives).

## Sprint Sequence

| # | Sprint | Gate | Tasks | Dependencies | Status |
|---|--------|------|-------|--------------|--------|
| 1 | [Geometry reference-flow spike](#sprint-01-geometry-reference-spike) | Founder watches one recovered route plot its correct road line from a cold boot | 4 | — | Completed |
| 2 | [Mastra spike + z.ai proof + enrichment re-ratification](#sprint-02-mastra-reference-spike) | Turn-two "OK what's scenic" inherits the Ogden center on cloud dev | 8 | — | Completed |
| 3 | [Catalog hygiene](#sprint-03-catalog-hygiene) | Founder confirms canonical-vs-shadow per duplicate group before merge commits | 4 | — | Completed |
| 4 | [Trust pipeline](#sprint-04-trust-pipeline) | Founder reviews the ~25 couch-sample lines and records the pass that unlocks the batch | 7 | 1, 3 | In Progress |
| 5 | [Batch acceptance + retirement](#sprint-05-batch-acceptance) | Founder accepts the realized rider-ready count against the expected-yield table | 4 | 4 | Planned |
| 6 | [Rider-ready surface](#sprint-06-rider-ready-surface) | Founder confirms the provenance caption reads as calm context, never a warning | 8 | 4 | Planned |
| 7 | [Agent rebuild — grounded discovery + honesty](#sprint-07-agent-rebuild-grounding) | "Twisty roads near Ogden" returns only genuinely-near routes with real distances | 10 | 2, 6 | Planned |
| 8 | [Agent rebuild — intent + persona shaping](#sprint-08-agent-intent-persona) | A dated "Saturday morning" request returns a real weather go/no-go, unasked | 8 | 7 | Planned |
| 9 | [Agent eval lane + observability + CI](#sprint-09-agent-eval-observability) | Operator runs the cost-capped smoke lane and finds a per-turn trace in LangSmith | 6 | 7 | Planned |
| 10 | [Founder-region Saturday-arc capstone](#sprint-10-saturday-capstone) | Founder near SLC turns a scenic-rides ask into a plotted, saved route on the real catalog | 2 | 5, 8 | Planned |

**Parallel waves** (topological): [1, 2, 3] → [4] → [5, 6] → [7] → [8, 9] → [10].
The eight capability chains (CAP-GEO-01…06, CAP-AGT-01/02) are each owned by ≥1 task (coverage map at the end).

---

## Per-Sprint Details

### Sprint 01: Geometry reference-flow spike

**Sequence:** 1
**Timeline:** Phase 1 (parallel opener)
**Status:** Completed
**Proposed by:** product-manager + convex-planner (lane) + aisdk-planner (anchor completion) + react-native-ui-planner (cold-boot plot flow)

#### Human Testing Gate

**Gate:** The Founder-Operator watches one real recovered route plot its correct road line on the simulator from a cold boot.

**Test Steps:**
1. Reconstruct one real PoC route through a Convex action on real APIs.
2. Confirm the deterministic gate admits the line within the ratio band.
3. Persist the line as ai_reconstructed and recompute its rider-ready flag.
4. Query listCuratedRoutes national-best mode; confirm the route appears.
5. Query listCuratedRoutes nearest mode; confirm the route appears.
6. Cold-boot the simulator and tap the recovered route.
7. Watch the correct road line plot on the map.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S1-T1 | Direct AI-SDK anchor-extraction completion (decoupled from the Mastra spike per T-REC-016) | convex-implementer | 60 min |
| S1-T2 | Deterministic gate module (VER-01 core) + reconstruct-one path + persist ai_reconstructed + recomputeRiderReady seam + query return (best + nearest) | convex-implementer | 180 min |
| S1-T3 | Maestro cold-boot plot-verification flow for the single recovered route | react-native-ui-implementer | 75 min |
| S1-T4 | Observe the recovered line plotted from cold boot; record the §5 seam as green | Founder-Operator | 25 min |

**Next Sprint Tasks:** *(expanded by kb-sprint-tasks-plan on 2026-07-11 → [`tasks/sprint-01-geometry-reference-spike/`](./tasks/sprint-01-geometry-reference-spike/))*

- S1-T1-direct-ai-sdk-anchor-extraction-completion.md
- S1-T2-deterministic-gate-reconstruct-persist-query.md
- S1-T3-maestro-cold-boot-plot-verification-flow.md
- S1-T4-founder-observe-recovered-line-plot.md

#### Dependencies

- Blocks: Sprint 04 (Trust pipeline)
- Dependent on: None

#### PRD Coverage

- UC-REC-02, UC-VER-01, UC-SURF-01 (seam) · criterion T-REC-016 (human-gate)

#### Capability Coverage

- CAP-GEO-01: lever-2 reconstruction seam (reconstruct-one → gate → persist)
- CAP-GEO-03: rider-ready gating seam (recompute → indexed query → plot)

> **Note:** SPIKE — the recorded prerequisite that unblocks the REC deep build. Anchor extraction uses a **direct AI-SDK completion** so this spike does NOT depend on the Sprint 02 Mastra spike. The gate module + persist/recompute seam are reference implementations Sprint 04/06 harden — not throwaway.

---

### Sprint 02: Mastra spike + z.ai proof + enrichment re-ratification

**Sequence:** 2
**Timeline:** Phase 1 (parallel opener)
**Status:** Completed
**Proposed by:** mastra-planner + aisdk-planner (z.ai provider) + product-manager (sequence)

#### Human Testing Gate

**Gate:** On the cloud dev deployment, the operator's second conversation turn ("OK what's scenic") inherits the Ogden center resolved by the first turn through the embedded @mastra/core agent.

**Test Steps:**
1. Run `npx convex deploy` to the cloud dev deployment (not local convex dev).
2. Invoke the spike action with "twisty roads near Ogden".
3. Confirm the reply lists routes with real distances from Ogden.
4. Send turn two "OK what's scenic" in the same session.
5. Confirm turn two searches near Ogden, not statewide.
6. Open the LangSmith trace and grep spans for `sk-ant-`/`AIza` — expect none.
7. Run a z.ai GLM-5.2 structured-output completion; confirm a non-empty parsed object.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S2-T1 | Install @mastra/core + ai@7 + @ai-sdk/openai-compatible; bump convex.json nodeVersion 20→22; add orchestrator tier as a ModelRouter string (additive, coexists with pi-ai) | convex-implementer | 90 min |
| S2-T2 | Spike tools: geocodePlace + searchCuratedRoutes as createTool + Zod, errors-as-data (center-required, server distanceMi) | convex-implementer | 120 min |
| S2-T3 | rideAgentSpike.ts — stateless @mastra/core Agent in a 'use node' action, 2-turn Ogden center inheritance (memory:undefined) | convex-implementer | 150 min |
| S2-T4 | Wire Mastra Observability → OTLP → LangSmith with SensitiveDataFilter; prove one redacted trace | convex-implementer | 120 min |
| S2-T5 | Measure + record cold-start (≤8s cloud dev) + bundle-size delta (≤10MB) from the deploy artifact | convex-implementer | 60 min |
| S2-T6 | z.ai GLM-5.2 custom-provider structured-output proof + text-mode JSON fallback (T-AGT-024) | convex-implementer | 120 min |
| S2-T7 | Run the §5b spike gate; record accept/adjust on the pinned ceilings | Founder-Operator | 30 min |
| S2-T8 | Observe the green T-AGT-024 proof; re-ratify enrichment/06-external-dependencies.md (discharge cross-PRD prerequisite) | Founder-Operator | 30 min |

**Next Sprint Tasks:** *(expanded by kb-sprint-tasks-plan on 2026-07-12 → [`tasks/sprint-02-mastra-reference-spike/`](./tasks/sprint-02-mastra-reference-spike/))*

- S2-T1-install-mastra-core-ai-sdk-openai-compatible-assert-and-preserve-ai-7-nodeversio.md
- S2-T2-spike-tools-geocodeplace-searchcuratedroutes-as-createtool-zod-errors-as-data-ce.md
- S2-T3-rideagentspike-ts-stateless-mastra-core-agent-in-a-use-node-action-2-turn-ogden-.md
- S2-T4-wire-mastra-observability-otlp-langsmith-with-sensitivedatafilter-prove-one-reda.md
- S2-T5-measure-record-cold-start-8s-cloud-dev-bundle-size-delta-10mb-from-the-deploy-ar.md
- S2-T6-z-ai-glm-5-2-custom-provider-structured-output-proof-text-mode-json-fallback-t-a.md
- S2-T7-run-the-5b-spike-gate-record-accept-adjust-on-the-pinned-ceilings.md
- S2-T8-observe-the-green-t-agt-024-proof-re-ratify-enrichment-06-external-dependencies-.md

#### Dependencies

- Blocks: Sprint 07 (Agent rebuild)
- Dependent on: None

#### PRD Coverage

- UC-AGT-01 (AC-1, AC-5) · criteria T-AGT-023 (human-gate), T-AGT-024 (integration)

#### Capability Coverage

- CAP-AGT-01: conversational discovery (de-risk — Mastra-in-Convex + tool seam + memory)
- CAP-AGT-02: eval/observability (LangSmith wiring + redaction proof)

> **Note:** SPIKE — any §5b miss BLOCKS the AGT deep build (risk #11 bespoke-loop fallback triggers). T-AGT-024 **gates the enrichment-PRD re-ratification**, which MUST land before the pi-ai teardown in Sprint 07. Additive: nothing is torn down here — @mastra/core installs alongside the live pi-ai path. Independent of Sprint 01 (runs in parallel).

---

### Sprint 03: Catalog hygiene

**Sequence:** 3
**Timeline:** Phase 1 (parallel opener)
**Status:** Completed
**Proposed by:** product-manager + convex-planner (lane)

#### Human Testing Gate

**Gate:** The Founder-Operator confirms the canonical-versus-shadow pick for every duplicate group before the merge commits.

**Test Steps:**
1. Run normalizeEditorialScores dry-run; preview the divide-by-100 change-set without writing.
2. Run dedupeGroups dry-run on the real catalog.
3. Review each duplicate group's canonical-versus-shadow selection.
4. Confirm the canonical is the gate-passing or highest-score row.
5. Commit the merge; confirm "Cherohala Skyway" search returns exactly one row.
6. Run length and test-row quarantine; confirm each reason is recorded.
7. Run state normalization twice; confirm the second pass changes nothing.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S3-T1 | Score-scale ÷100 normalization at rest with dry-run preview (UC-HYG-01) | convex-implementer | 90 min |
| S3-T2 | Duplicate-group detection + reversible duplicateOf merge with dry-run plan (UC-HYG-02) | convex-implementer | 120 min |
| S3-T3 | Length + test/seed-row quarantine with reasons; state-string normalization idempotent (UC-HYG-03, UC-HYG-04) | convex-implementer | 120 min |
| S3-T4 | Review the dedupe dry-run plan on real data; confirm canonical-vs-shadow per group before commit | Founder-Operator | 30 min |

**Next Sprint Tasks:** *(expanded by kb-sprint-tasks-plan on 2026-07-13 → [`tasks/sprint-03-catalog-hygiene/`](./tasks/sprint-03-catalog-hygiene/); specialist-authored convex-planner; avg 115/115; fakeability 15/15 green)*

- S3-T1-score-scale-normalization-dry-run-preview.md
- S3-T2-duplicate-group-reversible-merge-dry-run-plan.md
- S3-T3-length-testrow-quarantine-state-normalization.md
- S3-T4-review-dedupe-plan-confirm-canonical-vs-shadow.md

#### Dependencies

- Blocks: Sprint 04 (Trust pipeline)
- Dependent on: None

#### PRD Coverage

- UC-HYG-01..04 · criteria T-HYG-001..012 (incl. T-HYG-005 human-gate)

#### Capability Coverage

- N/A — deterministic at-rest cleanup; no boundary chain. Feeds CAP-GEO-01/03 by cleaning the claimed lengths the gate calibrates against.

> **Note:** Runs FIRST in the data pipeline (the gate is calibrated against claimed lengths). No code dependency on the spikes — runs parallel with them; must finish before Sprint 04.

---

### Sprint 04: Trust pipeline

**Sequence:** 4
**Timeline:** Phase 2
**Status:** In Progress
**Proposed by:** product-manager + convex-planner (lane) + aisdk-planner (lever-2 structured output)

#### Human Testing Gate

**Gate:** The Founder-Operator reviews the ~25 rendered couch-sample lines and records the passing verdict that unlocks the full batch.

**Test Steps:**
1. Run the lever waterfall as a --sample batch on real Google + LLM APIs.
2. Confirm each processed route ends in exactly one terminal state.
3. Open the ~25-route couch sample rendered as map PNGs.
4. Record true, off, or wrong for each sampled route.
5. Record an overall pass or fail verdict.
6. Confirm a single "wrong" verdict forces the gate red.
7. Disposition three REVIEW-queue items: approve, retry, retire.
8. Confirm the driver refuses --all until the couch verdict passes.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S4-T1 | Deterministic geometry gate (VER-01 full: ratio band, anchor/region, degenerate, pre-existing sweep, quarantine ratio-skip) + bounded LLM repair round (VER-02) | convex-implementer | 210 min |
| S4-T2 | Lever 1 promote (scraped_promoted, $0) + Lever 3 re-route (name_routed) deterministic paths (REC-01, REC-03) | convex-implementer | 180 min |
| S4-T3 | Lever 2 reconstruct (ai_reconstructed) LLM anchors → geocode → route → gate, structured outputs via the model layer (REC-02) | convex-implementer | 180 min |
| S4-T4 | Cross-provider ride-worthiness classifier stored as evidence (VER-03) | convex-implementer | 150 min |
| S4-T5 | Resumable --sample waterfall + cost circuit-breaker + rate-limit/backoff + REVIEW queue with dispositions (REC-04 sample, T-REC-019, VER-04) | convex-implementer | 210 min |
| S4-T6 | Couch-sample assembler (~25 stratified) + recordCouchVerdict + couchGateStatus --all block (VER-05 AC-1..5) | convex-implementer | 150 min |
| S4-T7 | Review rendered couch-sample lines + record verdicts (couch gate); disposition REVIEW-queue items | Founder-Operator | 45 min |

**Next Sprint Tasks:** *(expanded by kb-sprint-tasks-plan on 2026-07-14 → [`tasks/sprint-04-trust-pipeline/`](./tasks/sprint-04-trust-pipeline/); specialist-authored convex-planner (lane) + aisdk-planner (S4-T3 lever-2 structured output); 0 CRITICAL fakeability; T4 fully clean)*

- S4-T1-deterministic-geometry-gate-ver-01-full-ratio-band-anchor.md
- S4-T2-lever-1-promote-scraped-promoted-0-lever-3-re-route-name-r.md
- S4-T3-lever-2-reconstruct-ai-reconstructed-llm-anchors-geocode-r.md
- S4-T4-cross-provider-ride-worthiness-classifier-stored-as-eviden.md
- S4-T5-resumable-sample-waterfall-cost-circuit-breaker-rate-limit.md
- S4-T6-couch-sample-assembler-25-stratified-recordcouchverdict-co.md
- S4-T7-review-rendered-couch-sample-lines-record-verdicts-couch-g.md

#### Dependencies

- Blocks: Sprint 05 (Batch acceptance), Sprint 06 (Rider-ready surface)
- Dependent on: Sprint 01 (gate module + reconstruct seam), Sprint 03 (cleaned claimed lengths)

#### PRD Coverage

- UC-REC-01/02/03/04(sample), UC-VER-01/02/03/04/05 · criteria T-REC-001..012/019, T-VER-001..019 (incl. T-VER-016, T-VER-018 human-gates)

#### Capability Coverage

- CAP-GEO-01: lever-2 reconstruction (full pipeline)
- CAP-GEO-02: lever-1 promotion
- CAP-GEO-05: couch-sample gate (sample export → founder verdict → batch unlock)
- CAP-GEO-06: lever-3 reroute

> **Note:** Phase-sliced "trust pipeline" per the slicing note — gate + all levers + repair + classifier + REVIEW + couch together so the couch human gate closes in isolation. Couch PASS is the deterministic unlock for the full --all batch in Sprint 05.

---

### Sprint 05: Batch acceptance + retirement

**Sequence:** 5
**Timeline:** Phase 3
**Status:** Planned
**Proposed by:** product-manager + convex-planner (lane)

#### Human Testing Gate

**Gate:** The Founder-Operator accepts the full batch's realized rider-ready count against the expected-yield table on the real catalog.

**Test Steps:**
1. Run the full --all batch under the cost circuit-breaker.
2. Open coverageReport; read per-lever PASS rates and rider-ready count.
3. Compare realized counts against the expected-yield table.
4. Confirm a far-below-estimate lever escalates rather than silently completing.
5. Review the top-50-by-rank routes for correct road and plausible length.
6. Confirm no duplicate headliner or test row among the top-50.
7. Review retirement candidates with per-route failure reasons.
8. Confirm nothing auto-retires without explicit founder confirmation.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S5-T1 | Full --all batch execution + coverageReport realized-yield table + acceptance recording + low-yield-lever escalation (REC-04 AC-7) | convex-implementer | 120 min |
| S5-T2 | Retirement flow: all-lever-failure eligibility, explicit confirm, reversible unretire, record preserved (REC-05) | convex-implementer | 120 min |
| S5-T3 | Top-50-by-composite-rank render harness for founder review (VER-05 AC-6) | convex-implementer | 90 min |
| S5-T4 | Accept realized yield (headline gate); review top-50-by-rank; review retirement candidates before commit | Founder-Operator | 45 min |

**Next Sprint Tasks:** *(populated JIT by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: Sprint 10 (Saturday capstone)
- Dependent on: Sprint 04 (couch PASS unlocks --all)

#### PRD Coverage

- UC-REC-04 (AC-7), UC-REC-05, UC-VER-05 (AC-6) · criteria T-REC-013/014/017/019, T-VER-020 (incl. T-REC-017, T-VER-020, T-REC-014 human-gates)

#### Capability Coverage

- CAP-GEO-04: retirement (all-levers-failed → founder decision → reversible exclusion)

> **Note:** TAIL of the phase-slice. Retirement stays LOCKED until realized-yield acceptance is recorded (REC-04 AC-7). Produces the real, accepted post-batch catalog the Sprint 10 capstone runs on. Runs parallel with Sprint 06.

---

### Sprint 06: Rider-ready surface

**Sequence:** 6
**Timeline:** Phase 3
**Status:** Planned
**Proposed by:** react-native-ui-planner (lane) + convex-planner (gated queries) + frontend-designer (caption + absence states) + product-manager (gate)

#### Human Testing Gate

**Gate:** The Founder-Operator confirms on a real device that the provenance caption reads as calm context, never a warning.

**Test Steps:**
1. Open a detail view for an ai_reconstructed route on device.
2. Confirm the caption reads as plain informational text.
3. Confirm muted styling with no badge or warning affordance.
4. Check the caption in both light and dark mode.
5. Confirm a scraped_promoted route shows no caption.
6. Browse a thin region; confirm the honest "no routes near you yet" state.
7. Confirm a saved non-ready route still opens its detail.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S6-T1 | riderReady flag composition (7 inputs) stored + indexed + geospatial re-index migration gate + recompute triggers (SURF-01) | convex-implementer | 150 min |
| S6-T2 | Hard-gate discovery tool + all listCuratedRoutes modes + carousel; remove centroid fallback (SURF-02, SURF-03) | convex-implementer | 120 min |
| S6-T3 | Honest thin-region absence + labeled national fallback + fabricated-0mi fix (index.tsx:350) + fellBackToBest exposure + a11y announce (SURF-04) | react-native-ui-implementer | 180 min |
| S6-T4 | Provenance caption leaf (calm, muted, no badge) for ai_reconstructed + name_routed only + getCuratedRouteDetail geometryProvenance projection (SURF-05) | frontend-designer | 120 min |
| S6-T5 | Saved-routes reachability: canonical redirect, approximate state, never gate-hidden (SURF-06) | convex-implementer | 90 min |
| S6-T6 | Retarget curated-route-detail.yaml provenance flow off the dead AC-1 testID to deep-link/map-pin; thin-region + saved-reachability Maestro flows | react-native-ui-implementer | 150 min |
| S6-T7 | Eyeball the provenance caption on device (light + dark); confirm it reads as context not alert | Founder-Operator | 30 min |
| S6-T8 | Design handoff — provenance caption calm treatment spec (light + dark tokens) | frontend-designer | 45 min |

**Next Sprint Tasks:** *(populated JIT by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: Sprint 07 (Agent rebuild — discovery tool serves this gate)
- Dependent on: Sprint 04 (rider-ready routes + flag semantics exist)

#### PRD Coverage

- UC-SURF-01..06 · criteria T-SURF-001..021 (incl. T-SURF-018 human-gate)

#### Capability Coverage

- CAP-GEO-03: rider-ready gating (flag → indexed query → discovery → render)
- CAP-GEO-04: saved-route reachability (canonical redirect, gate-independent detail)

> **Note:** The read-path gate the agent's discovery tool must serve through (risk #22 geospatial re-index is migration-gated: point-count == rider-ready count before the SURF gate deploys). Built on the sample-batch rider-ready set (needs Sprint 04); runs parallel with Sprint 05.

---

### Sprint 07: Agent rebuild — grounded discovery + honesty

**Sequence:** 7
**Timeline:** Phase 4
**Status:** Planned
**Proposed by:** mastra-planner (lane) + aisdk-planner (pi-ai teardown) + mastra-evals-implementer (replay foundation) + react-native-ui-planner (chat render)

#### Human Testing Gate

**Gate:** The founder's "twisty roads near Ogden" chat request on the running app returns only genuinely-near routes, each showing its real distance from Ogden.

**Test Steps:**
1. Cold-boot the app near Ogden on the iOS sim.
2. Open chat and ask "twisty roads near Ogden".
3. Confirm every suggested route shows a real Ogden distance.
4. Confirm no route beyond the radius is called "near".
5. Ask "OK what's scenic" and confirm results stay near Ogden.
6. Ask "find me something scenic" with no location — expect one clarifying question.
7. Ask "Slc to park city" and confirm a real route still compiles.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S7-T1 | Port the deterministic scaffolding off pi-ai (budgetTracker, piTools→Zod, sendMessage types, generateTripPlan live action) | convex-implementer | 180 min |
| S7-T2 | rideAgent.ts stateless singleton + ATOMIC cutover: delete the dispatch/sub-agents/runAgent, refactor pendingSketches off module scope, remove @mariozechner/pi-ai (co-lands with S7-T1) | convex-implementer | 240 min |
| S7-T3 | Versioned prompt artifact prompts/orchestrator.v1.ts (PROMPT_VERSION + buildSystemPrompt, static policy + dynamic blocks) | convex-implementer | 120 min |
| S7-T4 | Deterministic memory: agentMemory read/write + dynamic prompt injection + piMessage→AI-SDK read translation + provenance stamping | convex-implementer | 150 min |
| S7-T5 | Core 9-tool registry hardened: searchCuratedRoutes (center-REQUIRED, SURF-gated) + geocodePlace + planRoute + searchNearby + webSearch (errors-as-data) | convex-implementer | 180 min |
| S7-T6 | Grounded discovery + one-question interrogation + distance/thin-data honesty behavior | convex-implementer | 150 min |
| S7-T7 | Eval harness foundation: fixture format + MockLanguageModel seam + eval-gold piMessage→AI-SDK transcript migration (T-AGT-025) | convex-implementer | 180 min |
| S7-T8 | SLC/Ogden transcript replay: old behavior RED, rebuilt behavior GREEN + deterministic policy graders (T-AGT-013) | convex-implementer | 150 min |
| S7-T9 | Chat render: per-option real distance cards + clarifying-question/thin-candor prose in the session-message bubble | react-native-ui-implementer | 120 min |
| S7-T10 | Verify grounded discovery on the running app (Ogden no-false-proximity gate) | Founder-Operator | 30 min |

**Next Sprint Tasks:** *(populated JIT by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: Sprint 08 (intent/persona), Sprint 09 (eval lane), Sprint 10 (capstone)
- Dependent on: Sprint 02 (Mastra foundation proven), Sprint 06 (rider-ready gate the tool serves)

#### PRD Coverage

- UC-AGT-01/02/03/04/05 (grounding + honesty + replay) · criteria T-AGT-001..013, T-AGT-025

#### Capability Coverage

- CAP-AGT-01: location-grounded conversational discovery (core rebuild)
- CAP-AGT-02: eval replay foundation (transcript → graded verdict)

> **Note:** The atomic @mariozechner/pi-ai teardown (S7-T1 ports + S7-T2 cutover) co-lands in ONE deploy — Convex bundles the whole deployment, so a single missing import fails every function. The teardown is safe only AFTER the enrichment re-ratification discharged in Sprint 02 (T-AGT-024). The 13-file tracing-stub replacement + build-gate greps land here or roll into Sprint 09.

---

### Sprint 08: Agent rebuild — intent + persona shaping

**Sequence:** 8
**Timeline:** Phase 4
**Status:** Planned
**Proposed by:** mastra-planner (lane) + convex-planner (weather/favorites queries) + frontend-designer (reply-card shaping + comfort labels) + mastra-evals-implementer (graders)

#### Human Testing Gate

**Gate:** The founder's dated "Saturday morning near SLC" chat request comes back with a real weather go/no-go the founder never had to ask for.

**Test Steps:**
1. Ask "a 2–3 hour loop near SLC, no highways".
2. Confirm at most three options, one line each.
3. Confirm the options fit a 2–3 hour distance window.
4. Add "for Saturday morning" and confirm a volunteered weather verdict.
5. Ask "tell me more about the second one" and confirm deeper detail.
6. Continue the session and confirm no later reply suggests a highway.
7. Ask "which of my saved rides fits" and confirm only saved routes.
8. Tap Save on a suggestion and confirm it enters the library.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S8-T1 | searchCuratedRoutes durationHours→distance-window (pinned recreational-pace constant) | convex-implementer | 90 min |
| S8-T2 | Waypoint-anchored composition via searchAlongRoute/searchNearby (real POI, never invented) | convex-implementer | 120 min |
| S8-T3 | Extend getRouteWeather to fetch the future-dated daily/hourly forecast window (current-only today) | convex-implementer | 120 min |
| S8-T4 | Wire getUserFavorites to the real favorite_roads/saved_routes tables + personal-library awareness (exclusion set + which-of-my-saved) | convex-implementer | 150 min |
| S8-T5 | Persona-fit reply shaping: ≤3-option deterministic truncation + depth-on-request + honest comfort labels + Save-close | convex-implementer | 150 min |
| S8-T6 | Persistent constraints as tool args (no-highways → planRoute.preferences / search filter, stored in agentMemory) | convex-implementer | 120 min |
| S8-T7 | Extend eval graders for intent + persona policies (duration args, comfort negative control, constraint persistence, option count) | convex-implementer | 120 min |
| S8-T8 | Verify intent + persona-fit behavior on the running app (volunteered weather gate) | Founder-Operator | 30 min |

**Next Sprint Tasks:** *(populated JIT by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: Sprint 10 (capstone)
- Dependent on: Sprint 07 (rebuilt agent, tools, prompt, memory, eval harness)

#### PRD Coverage

- UC-AGT-01 (AC-7), UC-AGT-02 (AC-6/7), UC-AGT-04 (AC-6), UC-AGT-06 · criteria T-AGT-016..022

#### Capability Coverage

- CAP-AGT-01: intent + persona remainder (duration, waypoint, weather, library, shaping)

> **Note:** UC-AGT-06 is Save-only — no share-to-link affordance is built or asserted (deferred). getRouteWeather + getUserFavorites are real Convex extensions, not pure wraps (verified: weather is current-only; favorites is an unwired pure fn).

---

### Sprint 09: Agent eval lane + observability + CI

**Sequence:** 9
**Timeline:** Phase 4
**Status:** Planned
**Proposed by:** mastra-evals-implementer (lane) + mastra-implementer (trace completeness + build-gate) + product-manager (gate)

#### Human Testing Gate

**Gate:** The operator runs the cost-capped `pnpm agent:eval --smoke` lane on the real model, then opens LangSmith to inspect that conversation's per-turn model-and-tool trace.

**Test Steps:**
1. Set the smoke-lane cost cap in the environment.
2. Run `pnpm agent:eval --smoke` against the dev deployment.
3. Confirm the lane completes on the real orchestrator model.
4. Confirm `agent-evals/report.json` is written with zero violations.
5. Open the LangSmith project for the run.
6. Locate the conversation's per-turn trace.
7. Confirm each turn shows model + tool calls with args, timings, and cost.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S9-T1 | LLM-judge graders (createScorer, cheap judge) — informational, non-blocking + negative-control transcript (T-AGT-015) | convex-implementer | 150 min |
| S9-T2 | report.json artifacts + per-run metrics (policy pass-rate, tool-error rate, latency, cost) | convex-implementer | 90 min |
| S9-T3 | Real-API cost-capped `pnpm agent:eval --smoke` lane (real Sonnet + real tools on dev) | convex-implementer | 120 min |
| S9-T4 | Per-turn trace completeness (root/model/tool spans + nested enrichRoute model-under-tool) + replace the 13-file tracing stub | convex-implementer | 180 min |
| S9-T5 | CI change-control gate (agent/** + prompts/** blocked on green evals; tool-schema = prompt-affecting; model-id change requires smoke) + build-gate greps (T-AGT-002) | convex-implementer | 150 min |
| S9-T6 | Run the eval smoke + trace-inspection gate (T-AGT-014) | Founder-Operator | 30 min |

**Next Sprint Tasks:** *(populated JIT by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: —
- Dependent on: Sprint 07 (rideAgent + harness); Sprint 08 (persona fixtures feed the report)

#### PRD Coverage

- UC-AGT-05 (AC-3/4/5), UC-AGT-01 (AC-2 CI grep-gate) · criteria T-AGT-014 (human-gate), T-AGT-015, T-AGT-002

#### Capability Coverage

- CAP-AGT-02: eval replay + observability (smoke lane, traces, CI change-control)

> **Note:** LLM-judge graders are informational (non-blocking) — a non-deterministic gate can't reliably block a merge; the blocking lane stays deterministic. The CI gate closes the loop so every future prompt/tool/model edit is eval-verified before it reaches the founder's phone.

---

### Sprint 10: Founder-region Saturday-arc capstone

**Sequence:** 10
**Timeline:** Phase 5 (capstone)
**Status:** Planned
**Proposed by:** react-native-ui-planner (arc flow) + product-manager (gate) + convex-planner (region coverage query)

#### Human Testing Gate

**Gate:** The Founder-Operator, near SLC on the real post-batch catalog, turns an agent scenic-rides ask into a plotted, saved route.

**Test Steps:**
1. Cold-boot the app near SLC/Ogden on the real post-batch catalog; dismiss the launcher menu.
2. Confirm no seeded or fixtured data is in play.
3. Ask the agent "scenic rides near SLC".
4. Confirm at least the threshold count of rider-ready options returns.
5. Confirm each option shows a real distance.
6. Tap an option and watch it plot a real road line.
7. Save the route to the library.
8. Repeat near Ogden; confirm the previous near-Ogden failure is demonstrably fixed.

#### Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| S10-T1 | End-to-end integration glue + founder-region coverage query (SLC/Ogden rider-ready counts) + Maestro Saturday-arc flow (ask → options → tap → plot → save) on the real catalog | react-native-ui-implementer | 150 min |
| S10-T2 | Run the full SLC/Ogden Saturday arc on a real device on the un-seeded post-batch catalog | Founder-Operator | 30 min |

**Next Sprint Tasks:** *(populated JIT by kb-sprint-tasks-plan)*

#### Dependencies

- Blocks: —
- Dependent on: Sprint 05 (accepted post-batch catalog), Sprint 08 (rebuilt agent answers the ask)

#### PRD Coverage

- UC-REC-04 (AC-8) · criterion T-REC-018 (human-gate)

#### Capability Coverage

- CAP-GEO-03: rider-ready gating (surface end-to-end)
- CAP-AGT-01: conversational discovery (chat discovery end-to-end)

> **Note:** CAPSTONE — converges the accepted catalog (S5) + rider-ready surface (S6) + rebuilt agent (S7/S8). Runs on the REAL, un-seeded post-batch catalog (no fixtures). Proves Trust (T1/T2/T3) + agent feel ONLY; does NOT green the whole Saturday Bar (R/F/P legs are separate initiatives per 00-overview v3.1.1).

---

## Capability-chain coverage map

| Chain | Owning sprint(s) | Proof gate |
|-------|------------------|-----------|
| CAP-GEO-01 (lever-2 reconstruction) | 01 (seam), 04 (full) | T-REC-016 spike + couch gate |
| CAP-GEO-02 (lever-1 promotion) | 04 | couch gate |
| CAP-GEO-03 (rider-ready gating) | 01 (seam), 06 (surface) | T-SURF-018 + Saturday arc |
| CAP-GEO-04 (retirement) | 05 | T-REC-014 founder review |
| CAP-GEO-05 (couch-sample gate) | 04 | T-VER-018 human-gate |
| CAP-GEO-06 (lever-3 reroute) | 04 | couch gate |
| CAP-AGT-01 (grounded discovery) | 02 (spike), 07 (core), 08 (remainder) | T-AGT-023 + Ogden chat gate |
| CAP-AGT-02 (eval + observability) | 02 (wiring), 07 (replay), 09 (lane) | T-AGT-014 human-gate |

## Human-gate binding (11/11)

T-REC-016 → S1 · T-AGT-023 → S2 · T-HYG-005 → S3 · T-VER-018 + T-VER-016 → S4 · T-REC-017 + T-VER-020 + T-REC-014 → S5 · T-SURF-018 → S6 · T-AGT-014 → S9 · T-REC-018 → S10.
**Prerequisite gate:** T-AGT-024 (S2) discharges the enrichment-PRD `06-external-dependencies.md` re-ratification.

## Next Steps

- `/kb-sprint-tasks-plan .spec/prds/route-agent-quality/ROADMAP.md` — expand the next sprint's tasks JIT into a per-sprint folder (SPRINT.md + TASK-*.md).
- `/kb-run-sprint sprint-01-geometry-reference-spike` — run the first spike.
- `/kb-sprint-plan .spec/prds/route-agent-quality/README.md --delta-replan` — re-plan after a PRD edit.
