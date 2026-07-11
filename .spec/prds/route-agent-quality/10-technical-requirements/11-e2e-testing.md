---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# E2E Harness Constitution — Route & Agent Quality

Per `brain/docs/E2E-HARNESS-CONSTITUTION.md`. Inherits the MVP + enrichment posture; assert
**engine outcomes** — persisted verdicts, provenance, `riderReady` flags, gated query results
— **never LLM prose**.

## 1. Framework + surface matrix (Reality Gate)

`detect_e2e_framework.py` verified 2026-07-10 — **no INFRA sprint required**:

| Surface | Framework | Status | CI lane |
|---|---|---|---|
| mobile (expo-rn) | **Maestro** (`.maestro/*.yaml`, incl. `discovery-full-gate.yaml`, `curated-route-detail.yaml`) | present | blocking |
| service (convex) | **vitest integration** (`convex/__tests__/*.integration.test.ts` against the real dev deployment) | present | blocking |
| pipeline (driver scripts) | vitest integration + operator-run acceptance batches | present (pattern) | blocking (cost-capped) |

Out of scope: physical-device certification; Android parity lane is non-blocking.

## 2. The determinism seam

**Fixture the LLM signal only.** The two probabilistic seams (anchor extraction, classifier)
are fixtured at the model-call seam — a canned `emit_anchors` response and a canned
`emit_verdict` — so the deterministic engine (gate, repair-round selection by ratio distance,
persistence, provenance, `riderReady` predicate, gated queries) runs identically every time.
Google Geocoding/Routes may also be fixtured at the fetch seam for pure-engine assertions.

**Always paired with a real-API smoke lane** (the Supreme-Rule tier): a cost-capped
`--sample` run against real Anthropic + Google on the PoC's proven fixture set — Twist of
Tepusquet Loop (expect `generated`, `ai_reconstructed`, ratio ∈ [0.6,1.6]), Old Hwy 40
(expect `review`, fail-closed, never `riderReady`), one real BBR row (expect
`scraped_promoted`). The fixture lane proves engine logic; the smoke lane proves the wiring.
SKIP-with-reason on a provider outage — never fake success.

- **Reset mechanism:** test-scoped routeIds on the dev deployment; teardown mutation clears
  side-table rows + status fields for those ids.
- **Seed mechanism:** test-only internal mutation seeds known route rows (incl. a
  deliberately mis-lengthed row and a degenerate line) — public API seeding, not table dumps.
- **Fixture/replay mechanism:** canned tool-call responses injected at the pi-ai call seam;
  anchors persisted on real runs make failures replayable.

## 3. The turnkey runner

- Backend/pipeline: `pnpm test:integration` (existing vitest lane) — preflight asserts
  deployment env keys, runs seeded engine tests, reports.
- Mobile: `pnpm e2e:ios` (existing Maestro lane) — cold boot, dismiss the dev-client
  launcher menu (landmine), run gated-discovery + detail flows.
- Pipeline acceptance: `pnpm tsx scripts/reconstruct-curated-geometry.ts --sample=N` +
  `scripts/geometry-coverage-report.ts` — the operator-facing acceptance run.

## 4. Landmine ledger (inherited + this PRD)

- vitest mocks Convex/rnmapbox → UI truth is Maestro on a real device/sim.
- Dismiss the Expo dev-client launcher menu at flow start.
- Symlink `convex/_generated` into worktrees; use **static** `import { internal }` (never
  `await import('.../_generated/api')`).
- Set `ANTHROPIC_API_KEY` + `GOOGLE_MAPS_API_KEY` on the **deployment** (`npx convex env
  set`), not just `.env.local`.
- Convex `eq()` on an absent optional never matches — use the exclude-known-values pattern.
- pi-ai registry may not carry the intended Sonnet id — verify with one real completion
  before the batch (registry-override escape documented in 06-external-dependencies).
- Metro serves JS-only surface changes without a rebuild.

## 5. The proven reference flow (spike gate)

**One end-to-end proof before the deep build:** reconstruct ONE real PoC route through a
Convex action (real Anthropic + Google) → gate → persist `ai_reconstructed` →
`recomputeRiderReady` → `listCuratedRoutes` returns it → Maestro plots it on the sim from a
cold boot. The constitution is INCOMPLETE until this flow is green through the turnkey
runners — it de-risks the pi-ai geometry-tier wiring and the gate→query→render seam in a day.

## 5b. The Mastra reference conversation (AGT spike gate)

**One real conversation through the embedded framework before the agent deep build:** a
`@mastra/core` Agent constructed inside a Convex `'use node'` action, on the real
`orchestrator` tier, with `geocodePlace` + `searchCuratedRoutes` registered, answers
"twisty roads near Ogden" end to end on the dev deployment — center geocoded, SURF-gated
results with distances, reply rendered through the existing session-message path, and a
trace visible in LangSmith. Proves: Mastra runs in the Convex Node runtime (bundling,
cold-start), the tool seam fixture point exists for evals, and telemetry export works. The
AGT rebuild is BLOCKED until this is green (risk #11's fallback triggers if it cannot be).

## 5c. Agent eval lane (AGT)

- **Fixtured replay (deterministic):** `pnpm agent:eval` replays recorded transcripts —
  including the captured 2026-07-10 SLC/Ogden failure session — with the model signal
  fixtured at the tool-call seam. Tools, queries, and gates run REAL against the dev
  deployment (principled seam). Graders assert: tool selection, `center` presence + value,
  radius honesty (no suggestion beyond `searchedRadiusMi` unlabeled), asked-when-ambiguous,
  distance-stated, no-false-proximity in prose. A violation exits non-zero naming policy +
  turn.
- **Real-API smoke (cost-capped, operator-triggered):** `pnpm agent:eval --smoke` runs a
  small transcript set on the real orchestrator model; SKIP-with-reason on provider outage,
  never fake success.
- **Negative control:** a deliberately-injected false-proximity reply must FAIL the grader.
- **CI placement:** fixtured replay is a blocking lane on agent-touching changes; smoke is
  the recorded pre-merge evidence artifact, like the geometry smoke lane.

## 6. Flake policy

Run once; failures are real; no retry. The single sanctioned re-attempt is the pipeline's
own bounded repair round (product behavior, not test retry). A flaky flow is a broken flow.

## 7. CI lanes

- Blocking: vitest integration (engine + seeded invariants), Maestro iOS gated-discovery +
  detail flows, build-gate greps (no provider literals outside the tier map; no `--no-verify`).
- Non-blocking/informational: Android Maestro parity; the cost-capped real-API smoke lane
  runs operator-triggered (spend), recorded as a required pre-merge evidence artifact for
  pipeline-touching PRs rather than a per-commit lane.
