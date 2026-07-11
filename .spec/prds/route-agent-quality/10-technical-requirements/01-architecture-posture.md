---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Architecture Posture

**Structural clone of the proven DATA-011 geometry backfill and the enrichment sibling**
(`.spec/prds/enrichment/09-technical-requirements/01-architecture-posture.md`): one-route-at-
a-time, resumable, idempotent, gated behind QA and a founder couch test. The moving parts
mirror the proven pattern — data-access module (default-runtime `internalQuery`/
`internalMutation`), `'use node'` actions for external calls, a pure gate module, QA/coverage
queries, and resumable driver scripts.

## Deterministic vs probabilistic (the core stance)

The LLM is probabilistic and appears at **exactly two seams**:

1. **Lever-2 anchor extraction** — `description → ordered geocodable anchors`.
2. **The ride-worthiness classifier** — `route metadata → {ride | marginal | not_a_ride}`.

**Everything else is deterministic code**: the length/ratio gate (0.6–1.6), the degenerate
check (>4 pts ∧ ≥1 pt/mi), the 150-mi region check, provenance assignment, `riderReady`
computation, dedup/retirement flags, status transitions, coverage counting, and batch
resumability. Lever 1 (promote) and lever 3 (re-route) contain **no LLM at all** — lever 3
reuses the deterministic `parseRouteEndpoints()` already in
`convex/actions/curatedGeometry.ts:262`.

**The gate is the boundary**: probabilistic input (LLM anchors), deterministic verdict. A
wrong-but-plausible anchor set that fails the ratio gate is held closed and routed to REVIEW
— never auto-shipped. This is the exact inversion of the root-cause failure (name-geocoded
geometry stored with no validation).

## Where the pipeline runs

- Per-batch **external** work runs in Convex `'use node'` internal actions (Convex permits
  outbound network only from actions — proven by `convex/actions/curatedGeometry.ts` and
  `routingProvider.ts`).
- **Long-running orchestration/resume** lives in local driver scripts that call
  `npx convex run` once per bounded batch — the existing `scripts/backfill-curated-geometry.ts`
  pattern, deliberately sidestepping the Convex action wall-clock limit (the driver loops;
  each action call is short).
- **Pure / zero-external** work (hygiene, lever-1 promotion, the gate, coverage, review ops)
  runs in the default V8 runtime — `@mapbox/polyline` already decodes there
  (`convex/curatedGeometryQa.ts` imports it without `'use node'`). Only lever 2, lever 3, and
  the classifier (Google + LLM calls) need `'use node'`.

## Trust boundaries

Every pipeline function is `internal*`, operator-invoked via `npx convex run` against
deployment env keys — identical posture to the enrichment pipeline's trust boundary. The only
client-callable surfaces remain the existing Clerk-gated reads (`listCuratedRoutes`,
`getCuratedRouteDetail`), which only ever **read** post-gate `riderReady` rows. No rider
action writes geometry, verdicts, provenance, or retirement.

## Idempotency / resumability

The `(geometryStatus, geometryProvenance, riderReady)` ledger on the route doc is the resume
state; batches paginate `by_composite_score` desc and re-running skips already-PASSed rows via
the established exclude-known-values pattern (`convex/curatedGeometry.ts:177`, which documents
the Convex "can't `eq` an absent optional" gotcha). Each lever has its own eligibility
predicate, so the waterfall (try 1 → 2 → 3, first PASS wins) is a set of resumable scans.
Batches are **serial by construction** (one driver, sequential `npx convex run`) — no lease
needed in v1; concurrency is a flagged risk, not a built feature.

## Provenance as first-class data

Every produced line records `geometryProvenance ∈ {scraped_promoted | ai_reconstructed |
name_routed}` plus a verification block (`routedMiles`, `claimedMiles`, `ratio`, `verdict`,
`attempts`, `anchorCount`, `verifiedAt`). Provenance and verification are queryable facts that
drive coverage, the REVIEW queue, the couch sample, and the detail-view caption — not log
lines.

## Model indirection

LLM calls ride the repo's single-source model indirection
(`convex/actions/agent/lib/models.ts`), which v3.0.2 rebases wholesale onto the **Mastra
model layer** — every tier resolves to a ModelRouter string and `@mariozechner/pi-ai` is
removed from the dependency tree entirely (founder-ratified 2026-07-11). A new dedicated
**`geometry` tier** serves anchor extraction (Anthropic Sonnet-class — the PoC proved anchor
extraction at ratio 1.00 on two real routes), and the **`low` tier on a different provider**
serves the ride-worthiness classifier (cross-provider decorrelation, mirroring enrichment's
cross-provider QA). Schema-enforced structured outputs (`emit_anchors` / `emit_verdict` as
Zod schemas on single-shot Mastra generations) replace the PoC's JSON-regex parse. No
provider/model literals outside the tier map.

## Agent layer (AGT, v2.0.0) — smart loop with tools, not a dispatcher

**Diagnosis this replaces:** discovery ran through `buildDiscoveryIntentFromQuery`
(`convex/actions/agent/agents/orchestrator.ts:197`) — a regex keyword matcher with a
one-entry place gazetteer that never passed the rider's known location as `center` and
hardcoded `sort:'best'`; the orchestrator's "high" tier was gpt-4.1 as an emergency fallback
from a budget model. Intelligence had been moved out of the model into rigid scaffolding;
the scaffolding became the ceiling.

**The stance:** one capable model owns intent; deterministic code owns guarantees.

- **Framework:** `@mastra/core` Agent embedded in the existing Convex `'use node'` actions
  (`sendMessage` entry unchanged for the app). No standalone Mastra server; Convex remains
  the only backend and store. Mastra supplies the agent loop, tool registry, memory
  abstraction, and telemetry hooks; the existing `runAgent.ts` ReAct loop, the orchestrator
  dispatch, its sub-agent meta-tools, `ridePlanningAgent.ts`, and the regex intent path are
  deleted.
- **Module posture — stateless singleton.** One new `convex/actions/agent/rideAgent.ts`
  constructs a module-level `Mastra` registry + one `Agent('ride-agent')` at load; warm
  Convex Node sandboxes reuse module scope (proven in-repo by the module-scoped
  `pendingSketches` map in `agents/routingAgent.ts:79`), so construction is amortized and
  only a fresh sandbox pays bundle-eval + construction (measured by the §5b spike). **The
  singleton must be stateless by contract**: no `clerkUserId` / `planningSessionId` /
  `currentLocation` / message history in module scope — all per-request data flows through
  `RequestContext` and the per-call messages array (a grep-gate enforces this; risk #17).
- **Model:** a new **`orchestrator` tier → Anthropic Sonnet-class** in the tier map — but
  the tier resolver for this tier returns a **Mastra ModelRouter string**
  (`'anthropic/claude-sonnet-…'`, resolved against the deployment's `ANTHROPIC_API_KEY`),
  NOT a pi-ai `Model` object, which Mastra cannot consume (risk #15). **v3.0.2:** the
  pipeline tiers (geometry / classifier / enrichment) move onto the same router-string tier
  map and pi-ai is removed entirely — one model layer for every LLM seam. The
  router-string form also avoids adding an `@ai-sdk/anthropic` dependency; the escape if the
  router can't resolve the pinned Sonnet id is an explicit AI-SDK model instance, verified
  by one real completion in the spike. Cost ≈1–3¢ per conversation turn.
- **Loop bounds + deterministic wrappers:** `maxSteps ≈ 8–12` (single agent with real tools
  needs far fewer hops than the old dispatch nesting). `BudgetTracker` (gate mode, per-turn
  cap) accumulates cost in the step-finish hook and aborts on breach via the existing
  `AGENT_BUDGET_EXCEEDED` path; `LoopDetector` (SHA-of-tool-call, threshold 3) guards at the
  `createTool.execute` boundary, returning a typed `LOOP_DETECTED` error-as-data. Both stay
  code, not prompt text.
- **Processors stance:** NO LLM output-processor for reply-shape — those policies depend on
  tool-result ground truth. The ≤3-option cap is a deterministic truncation of the
  options/attachment array at assembly time in the Convex action; false proximity is
  structurally impossible via server-computed `distanceMi`. Mastra input processors
  (unicode normalization, injection screen) are a deferred optional layer — authenticated
  riders are a low injection surface and a per-turn guardrail-model call isn't justified in
  v1.
- **Tools (the honest contract):** `searchCuratedRoutes({center, radiusMi, archetypes?,
  text?, limit?})` — rider-ready-only via the SURF gate, returns per-route `distanceMi` from
  center; `geocodePlace(name)` — the same real geocoding capability the routing pipeline
  uses (no hardcoded city lists); the preserved deterministic route pipeline (`planRoute`
  et al.); search/enrichment/weather tools re-registered as-is. Tool argument validation,
  budget tracking, rate limits, and the rider-ready gate stay deterministic code.
- **Memory (v3.1.0 — deterministic single path, `@mastra/memory` DROPPED):** in-session
  only, with **no Mastra memory adapter**. The prior design double-loaded (deterministic
  history load in `sendMessage.ts` AND `{memory:{thread,resource}}` recall on the agent).
  Resolution: message history loads deterministically in `sendMessage.ts` and is passed as
  the per-call messages array; working memory (persistent `constraints` + `resolvedCenter`)
  rides `planning_sessions.agentMemory` (03-data-schema), read/written by deterministic
  mutations (`lib/mastraConvexStore.ts` is now just that helper, not a storage adapter) and
  **injected as the dynamic prompt block** (12-agent-prompting) — never a Mastra storage
  call. This eliminates the adapter that would have had to track `@mastra/core`'s shifting
  1.x memory interface; risk #16 collapses to a `piMessage`→AI-SDK payload translation on the
  read path. (Repo doctrine unchanged: persistence is deterministic code.) The Agent is
constructed with **`memory: undefined`** (no adapter); if construction ever fails without a
memory object, the fallback is the risk-#11 bespoke AI-SDK loop, **not** an `agent_memory`
adapter — so the `agent_memory`-table escape-hatch is retired (v3.1.1; 03-data-schema).
- **Behavior policies (prompt-encoded, eval-enforced):** ground every discovery in a
  resolved center; ask exactly one targeted clarifying question when unresolvable; state
  real distances; never claim proximity tool results don't show; offer the custom-route
  fallback on thin coverage. Policies are graded by the AGT eval harness — violations fail
  the run, so prompt drift is caught by evals, not by the founder's thumb.
- **What stays deterministic:** everything that must always happen — persistence, event
  emission, gated reads, cost caps — is code around the loop, never a prompt instruction
  (unchanged from this repo's agent doctrine in `convex/actions/agent/CLAUDE.md`).

## Tools vs prompting — the enforcement ruling (v3.0.1)

The dividing line: **anything that must always hold is a tool/code contract — make the
wrong thing impossible to express. Prompts own judgment. Evals verify the prompt-borne
remainder on every agent-touching diff.** Roughly 70% of the AGT behavior bar is carried
structurally; ~30% is genuinely probabilistic and lives in the prompt, with every such
policy graded in CI.

| Behavior | Enforcement | Why |
|---|---|---|
| Center grounding | **Structural** — `searchCuratedRoutes.center` required | A missing center is unrepresentable; the root-cause bug becomes impossible, not discouraged |
| Radius honesty | **Structural** (server `distanceMi` + max-distance filter) + eval on prose | Data can't lie; the grader catches prose that mislabels |
| Duration → distance ("2–3 hr") | **Structural** — tool computes the miles band from hours | The constraint can't be silently dropped |
| Waypoint composition (BBQ stop) | **Hybrid** — real `searchAlongRoute` (tool) + when-to-compose (prompt) | Businesses must be real; anchoring on a stop is judgment |
| Weather verdicts | **Hybrid** — real forecast (tool) + volunteer-unasked (prompt, eval-graded) | The number is tool-sourced; the decision to volunteer is prompt-borne |
| Interrogation (one question) | **Prompt + eval** | Ambiguity judgment + phrasing; "exactly one, only when unresolvable" asserted by graders |
| ≤3-option default | **Structural** — deterministic truncation of the options array | Unbreakable in code; cheaper than an LLM output processor |
| Comfort-label honesty | **Hybrid** — evidence structural (`technicalScore`), phrasing LLM-judge-graded | "Easy" is a claim about a number; the judge compares them |
| Constraint persistence | **Structural** — stored in `agentMemory.constraints`; tool-arg-mappable constraints ("no highways" → `planRoute.preferences.avoidHighways`) injected deterministically, NOT left to the prompt | Stored AND applied in code so the constraint can't be silently dropped (parity with duration-translation); a highway route in a later reply fails the eval |
| Library awareness | **Structural** — real `getUserFavorites` + exclusion set | Answers from real saved rows, not model memory |
| Share-close | **Prompt + eval** | Formatting/tone; graded present-or-absent |
| No false proximity | **Structural** + negative-control eval | Belt (data) and suspenders (a planted violation must fail CI) |
| Claim grounding | **Structural** (tool outputs feed cards) + eval on prose | Any prose fact not traceable to a tool result fails the grader |
