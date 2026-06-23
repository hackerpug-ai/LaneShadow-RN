---
audit: reality-gate-retrofit
prd: .spec/prds/mvp
generated: 2026-06-23
applied: 2026-06-23
mode: applied
tool: /kb-e2e-retrofit --apply
---

# Reality-Gate Retrofit Audit — LaneShadow Discovery-MVP

> **Status: APPLIED (2026-06-23).** Re-running `--apply` is idempotent — the registry,
> Sprint-01 `human-flows.json`, and the 12 PRIMARY-AC `flow_ref` bindings are all in place.
> The next gate-relevant action is the verbatim "Next step" at the bottom of this file.

## TL;DR

| Verdict | Reason |
|---|---|
| **No catch-up sprint needed.** | No sprint is marked COMPLETED, so the fail-closed UNVERIFIED rule does not fire. Sprint-01 is `In Progress` with code already merged but the gate has not been run. |
| **Conformance re-plan IS needed.** ✅ **APPLIED** | The PRD predates `.spec/scenarios` (no flow registry). All 17 UCs lacked core+edge enumeration. Sprint-01 had no locked `human-flows.json`. The registry + Sprint-01's locked flows + flow_ref bindings are now written. |
| **First move was registry backfill.** ✅ **DONE** | `.spec/scenarios/<UC>/*.scenario.md` written for all 17 UCs (34 scenarios). `flow_coverage_check.py --prd` → exit 0. |

The retrofit is **conformance-only** (the cheap case). The expensive case — a catch-up sprint
that re-plays shipped-broken flows — does not apply because nothing has been declared done.
That will change the moment Sprint-01 is marked COMPLETED; at that point the gate will replay
its locked flows and the bugs the founder has already been finding by hand (SPRINT-RUN-STATUS.md
rounds R1/R2) will surface deterministically.

---

## Infra (Goal 1)

`detect_e2e_framework.py` verdict:

| Surface | Stack | Status | Framework | Recommendation |
|---|---|---|---|---|
| mobile | expo-rn | **PRESENT** | maestro | Maestro (simulator + live backend) |
| service | convex-service | **PRESENT** | integration | full-integration (real Convex dev + real HTTP) |

`any_missing: false`. **No infra sprint required.** Maestro is already wired (`.maestro/`
flows exist; the SPRINT-RUN-STATUS.md "PHASE 3.5 Maestro E2E" closeout gate references it),
and the Convex integration tier is real-dev-deployment, not mocked.

---

## Flow Registry (core + edge) — REQUIRED BACKFILL

**State:** `.spec/scenarios/` **does not exist.** This PRD was authored 2026-06-13, before the
flow-coverage contract. `flow_coverage_check.py --prd` returns "no scenarios" → every UC is
gapped. This is a **full registry backfill**, not a targeted gap fill.

### UC inventory (17 use cases across 4 functional groups)

| Group | UC IDs | Sprint that delivers |
|---|---|---|
| DATA (backend gates) | UC-DATA-01 · -02 · -03 · -04 · -05 · -06 | 01 (01/02/04/05) · 02 (03/06) |
| DISC (discovery on the plan view) | UC-DISC-01 · -04 · -09 · -10 · -11 | 01 (04/09/10/11) · 03 (journey capstone `-01`) |
| DTL (route detail) | UC-DTL-01 · -02 · -03 · -04 | 02 |
| SAVE (library + handoff) | UC-SAVE-01 · -02 | 02 |

### Per-UC registry gaps (everything is ✗ until backfill runs)

| UC | core | edge | Notes for the backfill |
|---|---|---|---|
| UC-DATA-01 | ✗ | ✗ | Idempotent re-seed; edge = empty/deployment-drift (OPS-001 canary) |
| UC-DATA-02 | ✗ | ✗ | Pure map fn; edge = unknown archetype string passthrough |
| UC-DATA-03 | ✗ | ✗ | Additive `curatedRouteRef`; edge = XOR-validate vs planned-payload |
| UC-DATA-04 | ✗ | ✗ | State-normalize + length-clamp; edge = dirty-state strings, ≤999 clamp, 0-length blank |
| UC-DATA-05 | ✗ | ✗ | `listCuratedRoutes` 4 browse modes; edge = empty bbox, missing center, unlocated fallback |
| UC-DATA-06 | ✗ | ✗ | `getCuratedRouteDetail`; edge = no-polyline (45%), no-summary (32%), weather-fetch fail |
| UC-DISC-01 | ✗ | ✗ | **Journey** (scope:journey) — spans Sprint 01 + 02 + 03; cold-boot discover-to-ride |
| UC-DISC-04 | ✗ | ✗ | `useCuratedDiscovery`; edge = loading vs empty distinction, unlocated → best-first |
| UC-DISC-09 | ✗ | ✗ | Suggestion cards over input; edge = cards hidden when route shown, catalog-empty state |
| UC-DISC-10 | ✗ | ✗ | Chat NL discovery; edge = zero-score bug (DATA-008b), no-result intent, re-tap earlier card |
| UC-DISC-11 | ✗ | ✗ | Plan-view contract; edge = "Plan a ride" drawer absent, full-chat footer distinct from send |
| UC-DTL-01 | ✗ | ✗ | Lean detail render; edge = absent summary/polyline/weather across all 5,654 rows |
| UC-DTL-02 | ✗ | ✗ | Score→% bar; edge = null-score graceful omission |
| UC-DTL-03 | ✗ | ✗ | Geometry fallback; edge = the ~45% no-polyline population, "Approximate location" badge |
| UC-DTL-04 | ✗ | ✗ | Save + Ride It; edge = actions reachable without scroll on short + long detail |
| UC-SAVE-01 | ✗ | ✗ | `curatedRouteRef` save; edge = SavedRouteCard tolerance, reopen without synthesized legs |
| UC-SAVE-02 | ✗ | ✗ | Maps deep-link; edge = Google Maps uninstalled → web fallback |

**Action:** invoke `kb-prd-plan --update "enumerate core+edge functional flows (FUNCTIONAL-FLOW-COVERAGE) for UCs in scope of Sprints 01-03"` to write `.spec/scenarios/<UC>/*.scenario.md` files, then re-run `flow_coverage_check.py --prd` until exit 0. This is the COMPLETE source the catch-up and re-plan derive from.

---

## Sprint status

Sprint status is classified from each SPRINT.md frontmatter + ROADMAP.md status + the live
`SPRINT-RUN-STATUS.md` + git log. None have a `state.json` or `sprint-goal-state.json`.

| # | Sprint | Status | Locked `human-flows.json`? | Gate evidence? | Verdict |
|---|---|---|---|---|---|
| 01 | Discovery on the Route Plan View | **IN PROGRESS** (SPRINT.md `status: In Progress`; ROADMAP "In Progress"; SPRINT-RUN-STATUS.md "Remaining" with RUX wave + carried verifies outstanding) | no | none (gate never run) | **NONCONFORMANT → re-plan** (locked flows must exist before close) |
| 02 | Route Detail + Close the Loop | **PLANNED** (not yet JIT-expanded; no `tasks/sprint-02-*` dir) | n/a | n/a | **NONCONFORMANT → derive at JIT expansion** |
| 03 | On-Device D9 Capstone | **PLANNED** (not yet JIT-expanded) | n/a | n/a | **NONCONFORMANT → derive at JIT expansion** |

**Crucially:** the fail-closed UNVERIFIED rule (`COMPLETED` + no locked flows + no passing
goal-state) **does not fire for any sprint here.** Nothing is marked COMPLETED. The
SPRINT-RUN-STATUS.md shows substantial code has merged (DATA-009/010, DESIGN-S01-005/006/007,
RUX-006/007, hotfixes, and the full DATA-011 multi-commit arc: schema → C → C3 → C5 → C6 →
merge → side-table fix), but the sprint itself is open and the gate has never been run.

### What this means for the catch-up step

- **No catch-up SPRINT needed at this time.** Generating one would replay flows for a sprint
  that hasn't been declared done — premature.
- **The catch-up trigger will fire the moment Sprint-01 is marked COMPLETED.** At that point,
  if no locked `human-flows.json` exists and no `sprint-goal-state.json` passes, the gate
  blocks the close and a catch-up sprint becomes the path to green. Doing the registry +
  locked-flow work NOW (as part of Sprint-01's closeout) means there is no later catch-up.
- The bugs the founder has already surfaced by hand (rounds R1: 7 UX defects; R2: 5 items)
  are exactly what the gate would have caught deterministically. R1/R2 remediation tasks are
  in SPRINT.md; they should land BEFORE the gate runs.

---

## Remediation plan

### 1. Infra sprint
**None.** Both required surfaces (mobile-maestro, service-convex-integration) are PRESENT.

### 2. Catch-up sprint
**None (not yet).** See "What this means for the catch-up step" above. Re-evaluate if/when
Sprint-01 is marked COMPLETED without a passing `sprint-goal-state.json`.

### 3. PRD flow registry backfill — **required, blocks everything else**
- Invoke `kb-prd-plan --update "enumerate core+edge functional flows (FUNCTIONAL-FLOW-COVERAGE) for UCs {UC-DATA-01..06, UC-DISC-01, UC-DISC-04, UC-DISC-09..11, UC-DTL-01..04, UC-SAVE-01..02}"`.
- Writes `.spec/scenarios/<UC>/*.scenario.md` (CORE + EDGE per UC; tag UC-DISC-01 as `scope:journey`).
- Verify: `python3 ~/Projects/brain/tools/flow-coverage/flow_coverage_check.py --prd .spec/scenarios` → exit 0.

### 4. Re-plan remaining sprints for conformance

**Sprint-01 (IN PROGRESS → close it under the gate):**
- After the registry lands, derive `tasks/sprint-01-discovery-on-the-route-plan-view/human-flows.json` from the registry for UCs in Sprint-01's scope: `UC-DATA-01,UC-DATA-02,UC-DATA-04,UC-DATA-05,UC-DISC-04,UC-DISC-09,UC-DISC-10,UC-DISC-11`.
- Tag the chat→card→map loop as `scope:journey` (it spans DISC-016/017/018/020/021 + the agent tool).
- Bind `flow_ref` on every PRIMARY AC in the existing task `.md` files (additive edit; do not rewrite the bodies).
- Verify: `flow_coverage_check.py --sprint .spec/scenarios --human-flows tasks/sprint-01-discovery-on-the-route-plan-view/human-flows.json --scope UC-DATA-01,UC-DATA-02,UC-DATA-04,UC-DATA-05,UC-DISC-04,UC-DISC-09,UC-DISC-10,UC-DISC-11` → exit 0.
- Then the sprint can close via the normal gate: `/kb-run-sprint tasks/sprint-01-discovery-on-the-route-plan-view` replays every locked flow at the human surface, cold-boot. This is the step that surfaces R1/R2-class bugs deterministically.

**Sprint-02 + Sprint-03 (PLANNED):**
- Both will be JIT-expanded by `kb-sprint-tasks-plan` from the v3.0.0 ROADMAP. The registry
  must exist FIRST so the JIT expansion can derive locked flows and bind `flow_ref`.
- Sprint-02 scope: `UC-DATA-03,UC-DATA-06,UC-DTL-01..04,UC-SAVE-01..02`.
- Sprint-03 scope: `UC-DISC-01` (journey — replays the cross-sprint discover-to-ride arc post-integration).

### 5. ROADMAP.md re-sequencing
**Not needed.** The existing 3-sprint sequence is already correct (Sprint 01 → 02 → 03 with
Sprint 03 as the journey capstone). No infra sprint to insert; no catch-up to slot in. The
only ROADMAP edit required is documenting the new flow-registry dependency in the Notes
section, which the `--apply` run will do.

---

## What was written (APPLIED 2026-06-23)

| Artifact | Path | Status |
|---|---|---|
| PRD flow registry | `.spec/scenarios/<UC>/*.scenario.md` (17 UC dirs · 34 scenario files) | ✅ Written. `flow_coverage_check.py --prd` → exit 0. |
| Sprint-01 locked flows | `.spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view/human-flows.json` (16 flows · 8 in-scope UCs) | ✅ Written. `flow_coverage_check.py --sprint` → exit 0. |
| Sprint-01 task `flow_ref` bindings | 12 PRIMARY ACs in the flow-owning task files | ✅ Additive `flow_ref:` line inserted after each `*(PRIMARY)*` marker |
| ROADMAP.md Notes | Notes section now references the registry dependency + Sprint-01 closeout path | ✅ Updated |
| Catch-up SPRINT.md | — | ⏭️ Not written (no UNVERIFIED sprint — nothing COMPLETED yet) |
| Infra sprint | — | ⏭️ Not written (Maestro + Convex integration already PRESENT) |
| ROADMAP re-sequencing | — | ⏭️ Not needed (3-sprint sequence already correct) |

### Coverage of Sprint-01's 8 in-scope UCs (16 flows)

| UC | CORE flow | EDGE flow |
|---|---|---|
| UC-DATA-01 | HF-DATA-01-CORE (seed idempotent) · `DATA-001` | HF-DATA-01-EDGE (empty-deployment canary) · `OPS-001` |
| UC-DATA-02 | HF-DATA-02-CORE (archetype mapping) · `DATA-002` | HF-DATA-02-EDGE (unknown archetype passthrough) · `DATA-002` |
| UC-DATA-04 | HF-DATA-04-CORE (state-normalize + length-clamp) · `DATA-004` | HF-DATA-04-EDGE (blank state + extreme length) · `DATA-004` |
| UC-DATA-05 | HF-DATA-05-CORE (4 browse modes) · `DATA-005` | HF-DATA-05-EDGE (empty + unlocated fallback) · `DATA-005` |
| UC-DISC-04 | HF-DISC-04-CORE (hook returns rows) · `DISC-002` | HF-DISC-04-EDGE (loading≠empty + unlocated) · `DISC-002` |
| UC-DISC-09 | HF-DISC-09-CORE **(journey)**: card→direct plot · `DISC-016` | HF-DISC-09-EDGE (cards return + empty catalog) · `DISC-017` |
| UC-DISC-10 | HF-DISC-10-CORE **(journey)**: chat NL → card→map loop · `DISC-020` | HF-DISC-10-EDGE (zero-score bug + no-result) · `DATA-008b` |
| UC-DISC-11 | HF-DISC-11-CORE (plan view, no separate screen) · `DISC-018` | HF-DISC-11-EDGE (dropped components quarantined) · `DISC-021` |

**Replay posture:** cold-boot Maestro `.maestro/discovery-full-gate.yaml` (covers UC-DISC-09/10/11 at the human surface) + Convex integration tests (`scripts/__tests__/check-convex-health.integration.test.ts`, `hooks/__tests__/use-curated-discovery.integration.test.ts`, `tests/discovery/quarantine-import-graph.integration.test.ts`) for the backend-gate + hook flows.

---

## Next step (human-initiated) — DO NOT AUTO-RUN

```
/kb-run-sprint tasks/sprint-01-discovery-on-the-route-plan-view
```

This replays every locked flow at the human surface, cold-boot, against live Convex. **It is
expected to surface flows that shipped broken** — that is the deliverable. The bugs the
founder has already been finding by hand (SPRINT-RUN-STATUS.md rounds R1/R2) are the kind
of finding the gate will turn into deterministic evidence. Fix-to-green from there.

**Sprint 01 is NOT done until this gate is green.** A `status: Completed` SPRINT.md with no
passing `sprint-goal-state.json` will fail-closed as UNVERIFIED — exactly the case the next
`/kb-e2e-retrofit` run would catch up. Avoid that by running the gate before marking the
sprint complete.

