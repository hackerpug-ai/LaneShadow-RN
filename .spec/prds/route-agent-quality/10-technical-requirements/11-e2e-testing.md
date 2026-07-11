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
- **Fixture/replay mechanism:** canned structured outputs injected at the Mastra model seam
  (the same `MockLanguageModel` pattern as §5c); anchors persisted on real runs make
  failures replayable.

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
- The Mastra model router may not resolve a pinned model id — verify each tier with one real
  completion before its first batch (explicit AI-SDK instance escape documented in
  06-external-dependencies).
- Metro serves JS-only surface changes without a rebuild.

## 5. The proven reference flow (spike gate)

**One end-to-end proof before the deep build:** reconstruct ONE real PoC route through a
Convex action (real Anthropic + Google) → gate → persist `ai_reconstructed` →
`recomputeRiderReady` → `listCuratedRoutes` returns it → Maestro plots it on the sim from a
cold boot. The constitution is INCOMPLETE until this flow is green through the turnkey
runners — it de-risks the geometry-tier wiring (Mastra structured output) and the
gate→query→render seam in a day. **Decoupling (v3.1.0):** so §5 does not transitively depend on
the §5b Mastra-in-Convex spike, anchor extraction here MAY use a direct AI-SDK completion; if it
uses the tool-less-Agent structured-output primitive instead, sequence §5 AFTER §5b. Mirrors
criterion T-REC-016.

## 5b. The Mastra reference conversation (AGT spike gate)

**One real conversation through the embedded framework before the agent deep build:** a
`@mastra/core` Agent constructed inside a Convex `'use node'` action, on the real
`orchestrator` tier, with `geocodePlace` + `searchCuratedRoutes` registered, answers
"twisty roads near Ogden" end to end on the dev deployment — center geocoded, SURF-gated
results with distances, reply rendered through the existing session-message path. **Numeric
gate deliverables (v3.1.0 — pass/fail, not a vibe):** (1) cold-start under a recorded ceiling
and bundle-size delta under an agreed MB ceiling (risk #18); (2) a **2-turn** exchange — "twisty
near Ogden" then "OK what's scenic" — where turn 2 inherits the Ogden center (exercises the
deterministic working-memory path, risk #16); (3) ONE visible LangSmith trace whose exported
span JSON contains **no api-key substring** (SensitiveDataFilter redaction, risk #20) and carries
all three span types with `promptVersion`/`sessionId`/`tier`/cost. Proves Mastra runs in the
Convex Node runtime (bundling, cold-start), the model-seam fixture point exists for evals, and
telemetry export works. The AGT rebuild is BLOCKED until every deliverable is green (risk #11's
fallback triggers otherwise). Mirrors criterion T-AGT-023.

**Pinned gate values (v3.1.1 — a numeric gate needs numbers):** cold-start **≤ 8 s** first-token
latency on the first invocation after `convex deploy` to the **cloud dev deployment** (NOT local
`convex dev`, which is a warm sandbox); bundle-size delta **≤ 10 MB** measured from the deploy
artifact (both ceilings are the agreed defaults — the founder may adjust, but a value is pinned so
the gate can actually block). Redaction grep patterns that MUST NOT appear in any exported span
JSON: `sk-ant-`, `sk-`, `AIza`, and any `*_API_KEY` env-var value. **Add the z.ai custom-provider
proof (T-AGT-024) as a §5b/§5c deliverable:** one real GLM-5.2 completion through the custom
`createOpenAICompatible` provider returning a non-empty parsed `result.object` — "one model layer"
is otherwise unverified for the one non-stock provider.

## 5c. Agent eval lane (AGT — deepened v3.0.1)

- **The seam is the model reference.** Because the `orchestrator` tier resolves to a
  swappable AI-SDK/router model, the harness constructs the SAME Agent with a
  `MockLanguageModel` that replays a transcript's `modelSignal.assistantTurns` (text +
  toolCalls) verbatim — while **tools, Convex queries, and gates run REAL against the dev
  deployment**. This is the sanctioned determinism seam (not mocking `@mastra/core`), and it
  is always paired with the real-API smoke lane below. Coupling: the tier resolver and this
  harness must be designed together (08-technical-risks note).
- **Fixture format** — `scripts/agent-evals/fixtures/*.transcript.json`: ordered turns of
  `{ riderInput, expected:{ toolCalls:[{name, argAssertions}], optionCountMax, policies[] },
  modelSignal:{ assistantTurns:[{ text?, toolCalls? }] } }`. The captured 2026-07-10
  SLC/Ogden session is the canonical fixture.
- **Grader taxonomy:**
  - *Deterministic graders* (plain TS assertions — the **blocking** lane): tool-selection,
    arg-assertions (`center` present + expected value, `radiusMi` in band), option-count
    (≤3), distance-echo (stated distance = tool `distanceMi`), no-false-proximity,
    asked-when-ambiguous (exactly one question when no center).
  - *LLM-judge graders* (where deterministic can't reach): clarifying-question quality,
    comfort-label honesty vs stored `technicalScore` — implemented as Mastra
    `createScorer(...)` with a cheap Haiku-class judge; optionally batched via `runEvals`.
    Live production sampling (`scorers` with ratio ~1–5%, async) is deferred/optional.
    **Grader-type discipline (v3.1.1, L5):** LLM-judge graders are **informational (non-blocking)**
    — a non-deterministic gate can't reliably block a merge; the blocking lane is deterministic
    only. Where a prose policy has a structural equivalent, the grader asserts on **tool args, not
    prose** (false-proximity is already impossible via server-computed `distanceMi` + the
    max-distance filter, so T-AGT-012 asserts the tool result, not the reply text).
  - *Negative control*: an injected false-proximity transcript must FAIL (proves teeth).
- **Metrics per run:** policy pass-rate, tool-error rate, turn latency, cost/turn →
  `agent-evals/report.json` (`{ promptVersion, lane, summary{…}, runs[…violation…] }`).
- **CI placement:** `pnpm agent:eval` (fixtured) blocks on any diff under
  `convex/actions/agent/**` or `prompts/**` — including prompt-version bumps and
  tool-schema changes (12-agent-prompting change control); `pnpm agent:eval --smoke` (real
  Sonnet + real tools, cost-capped) is operator-triggered pre-merge evidence;
  SKIP-with-reason on provider outage, never fake success.

## 5d. Telemetry & traces (AGT — net-new wiring)

The existing `lib/tracing.ts` is a **no-op stub** — nothing is traced today. The rebuild
wires Mastra `Observability` on the module-level instance: an OTLP-over-HTTP exporter →
LangSmith's OTEL endpoint (`LANGSMITH_API_KEY` + project headers, env already provisioned),
with `SensitiveDataFilter` as a span-output processor (keys never appear in traces). Spans:
per-turn root (input/reply sizes, finishReason, total tokens+cost, step count), per-model
call (model id, tokens, cost, latency), per-tool call (name, arg/result sizes, latency,
typed error code). Stamped on every span: `promptVersion`, `sessionId`, `clerkUserId`,
`tier`. The §5b spike's explicit deliverables include ONE VISIBLE TRACE in LangSmith and a
measured cold-start number — verifying the OTLP ingestion path is part of the gate, since it
is unverified until install (risk #20).

## 6. Flake policy

Run once; failures are real; no retry. The single sanctioned re-attempt is the pipeline's
own bounded repair round (product behavior, not test retry). A flaky flow is a broken flow.

## 7. CI lanes

- Blocking: vitest integration (engine + seeded invariants), Maestro iOS gated-discovery +
  detail flows, build-gate greps (no provider literals outside the tier map; no `--no-verify`).
- Non-blocking/informational: Android Maestro parity; the cost-capped real-API smoke lane
  runs operator-triggered (spend), recorded as a required pre-merge evidence artifact for
  pipeline-touching PRs rather than a per-commit lane.
