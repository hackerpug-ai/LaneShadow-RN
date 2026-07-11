---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# E2E Harness Constitution (Enrichment)

## Reality Gate — surface inventory

| Surface | Framework | Status |
|---|---|---|
| Mobile app (iOS/Android, Expo dev-client) | **Maestro** flows + live Convex (`.maestro/` + per-sprint flow files) | **PRESENT** — proven by the MVP's `discovery-full-gate.yaml` cold-boot gate |
| Convex backend | **vitest integration tests** against the real dev deployment (`convex/__tests__/*.integration.test.ts`) + `npx convex run` operator drives | **PRESENT** |
| Pipeline LLM calls | Real z.ai / OpenAI APIs from Convex actions | **PRESENT** (keys wired; deployment env step in 06) |

No MISSING surfaces → no leading INFRA sprint required. This PRD **reuses** the MVP harness
constitution (Maestro real-device tier; vitest mocks Convex/rnmapbox so the REAL tier is
Maestro — per project memory) and adds the enrichment determinism seam below.

## The determinism seam (agentic product rule)

The LLM appears at exactly two seams — generation and the grounding verifier. Tests fixture
the SIGNAL, assert engine OUTCOMES:

1. **UI / e2e tier (deterministic — no LLM in the path):** a test-only internal mutation
   seeds `qa_passed` enrichment rows for known routeIds on the real dev deployment. Maestro
   flows + RN integration tests open `curated-route/[id]` and assert **rendering outcomes**
   (`curated-detail-enrichment-paragraph` renders the seeded text; a no-row route shows
   `curated-detail-enrichment-empty`; combined-absence collapses two empty lines to one).
   Fixture rows are the determinism seam — never live generation in UI tests.
2. **Pipeline acceptance tier (REAL LLM, real deployment — the Supreme-Rule tier):**
   integration tests run `actions/curatedEnrichment:backfill --sample` +
   `curatedEnrichmentQa:qa` on 5–10 real routes hitting the **real z.ai GLM-5.2 and real
   OpenAI verifier**. Assertions are **invariants, not prose**: a `qa_passed` row exists;
   `whyText` non-empty and ≤320 chars; every claim the verifier extracted maps to a fact;
   score-consistency lint holds; a deliberately seeded ungrounded claim yields `qa_failed`
   with the claim recorded. No mocked LLM in the acceptance path.
3. **Unit tier (pure logic ONLY — zero I/O):** `curatedEnrichmentFacts` (polyline decode →
   curvature/span, thin-grounding flag), `curatedEnrichmentLint` (length/banned/
   score-consistency rules), `inputsContentHash` canonicalization. UNIT_TEST_JUSTIFIED:
   pure transforms with zero I/O. These never substitute for tiers 1–2.

## Turnkey runner & flows

- Maestro: extend the existing flow set with `enrichment-detail.yaml` (seeded-row render +
  absence render), runnable via the same real-device tier as `discovery-full-gate.yaml`
  (dev-client launcher dismissal per project memory).
- Backend: `pnpm vitest run convex/__tests__/curatedEnrichment.integration.test.ts`
  (env-gated on `CONVEX_URL` + provider keys).
- Operator drives double as living smoke tests: `--sample=10` fidelity report.

## Landmine ledger (inherited + new)

- vitest mocks Convex/rnmapbox → UI truth lives in Maestro on a real device (inherited).
- Expo dev-client launcher menu must be dismissed at flow start (inherited memory).
- JS-only RUX changes are Metro-served — no rebuild needed for the detail-screen change.
- z.ai 429 insufficient-balance (FIX-001) — check balance before the sample run; the
  pipeline test should tolerate-and-report a provider outage as SKIP-with-reason, never
  fake success.
- `convex/_generated/ai/guidelines.md` absent in-tree → run `npx convex ai-files install`.

## Flake policy & CI lanes

Pipeline-acceptance tests are operator-triggered (real spend, ~$0.01/run) — not in the
default CI lane. UI/e2e seeded tests run in the standard lanes. One retry max on
provider-network failures; a second failure is a real red.

## Proven-reference-flow gate (spike)

Before the deep build: ONE spike proves the whole chain — extend the detail query with a
hand-seeded row (temporary mutation), render it on a real device via Maestro, AND one real
GLM-5.2 completion from a Convex action. The constitution is INCOMPLETE until this
reference flow is green; it de-risks the model wiring (R3/R4) and the query/render seam in
a day.
