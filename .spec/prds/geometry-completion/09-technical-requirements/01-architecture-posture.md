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
(`convex/actions/agent/lib/models.ts`, pi-ai): a new dedicated **`geometry` tier** for anchor
extraction (Anthropic Sonnet-class — the PoC proved anchor extraction at ratio 1.00 on two
real routes), and the existing **`low` tier on a different provider** for the ride-worthiness
classifier (cross-provider decorrelation, mirroring enrichment's cross-provider QA). Forced
tool calls (`emit_anchors` / `emit_verdict` with typed schemas) replace the PoC's JSON-regex
parse. No provider/model literals outside the tier map.
