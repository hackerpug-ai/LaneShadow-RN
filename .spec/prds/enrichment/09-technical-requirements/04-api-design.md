---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# API Design

## Public query delta — `getCuratedRouteDetail` (Clerk-gated, `requireIdentity`)

After resolving the route `by_routeId`, ONE additional indexed side-lookup on
`curated_route_enrichments.by_routeId`. Splice content **only when servable**
(`status === 'qa_passed'`, or `status === 'stale'` with `qa.verdict === 'pass'`). Additive
optional sub-object on `routeDetailReturnValidator` (backward-compatible; the client hook
picks it up via `FunctionReturnType`):

```ts
enrichment: v.optional(v.object({
  why: v.string(),
  generatedAt: v.number(),
}))
```

- Payload budget: ≤ ~600 chars + timestamp ≈ **< 1 KB** added. Single-row read — no size concern.
- **NEVER** return `groundingFacts`, `qa`, `status`, or `couchVerdict` to the client.
- Honest absence: field omitted → the screen renders exactly as today. The rider cannot
  distinguish absent/abstained/failed/fetch-error (single honest copy); telemetry can.

## Internal functions (`convex/curatedEnrichment.ts`, default runtime)

| Function | Kind | Args | Returns |
|---|---|---|---|
| `listForEnrichmentBackfill` | internalQuery | `cursor, batchSize` | page of routes: `enrichmentStatus` absent ∧ `geometryStatus='generated'`, by `by_composite_score` desc |
| `getRouteForEnrichment` | internalQuery | `routeId` | route lean fields + joined geometry row (polyline) |
| `getEnrichmentForRoutes` | internalQuery | `routeIds[]` | enrichment rows (QA batch / read-path tooling) |
| `upsertEnrichment` | internalMutation | full enrichment row | replace-or-insert by `by_routeId` + patch route `enrichmentStatus` |
| `patchEnrichmentStatus` | internalMutation | `id, routeId, status` | stamp status only (both tables stay consistent) |
| `clearEnrichment` | internalMutation | `id` | delete row + unset route `enrichmentStatus` (re-queues) |
| `coverageReport` | internalQuery | — | per-state counts + ship-ready % + R1 verdict, computed live |
| `recordCouchVerdict` | internalMutation | `routeId, verdict, notes?` | persist R2 verdict on the enrichment row |

## Actions (`'use node'`)

**`actions/curatedEnrichment:generateForRoute({ routeId })`** — read route+geometry → pure
fact extraction → `inputsContentHash` → if existing row with same hash AND servable status:
**skip (idempotent, no spend)** → else `complete(enrichmentModel, ctx)` with forced
`emit_enrichment` tool → `upsertEnrichment(status:'generated')`. Insufficient facts →
`abstained` on the route doc, no row. Provider/parse failure → `failed` + reason, prior
valid row preserved.

**`actions/curatedEnrichment:backfill({ sample?, cursor?, batchSize? })`** — paginate,
loop `generateForRoute`, halt after N consecutive provider errors (FIX-001 posture), return
`{ processed, generated, abstained, failed, continueCursor, isDone, perRoute[] }`.

**`actions/curatedEnrichmentQa:qa({ sample?, cursor? })`** — per `generated` row:
deterministic lint (pure) → cross-provider LLM grounding verifier (forced `emit_qa_verdict`
tool: `{ claims: [{claim, supported, sourceFact}], verdict }`) → `qa_passed` |
`qa_failed(issues)`. Verifier error ⇒ fail-closed (`qa_failed`, retryable).
**`resetFailed()`** re-queues `qa_failed` for regenerate-once.
**`sampleForReview({ count, knownRoads? })`** → `.tmp/ENR/couch-sample.json`.

## Regeneration paths

- Single route: `clearEnrichment` → `generateForRoute`.
- Scoped: the backfill scan computes current `inputsContentHash`; mismatch (or
  `promptVersion`/model change) ⇒ `patchEnrichmentStatus('stale')` ⇒ regenerate ⇒ QA.
- Full: bump `promptVersion` → every row hash-mismatches → bounded, cheap full regen.

## Driver CLI — `scripts/backfill-curated-enrichment.ts`

Flags mirror `backfill-curated-geometry.ts`: `--top=N` · `--sample=N` (deterministic sample
+ fidelity report to `.tmp/ENR/sample-report.json`) · `--all` (paginated resumable) ·
`--cursor="…"` · `--help`. All via `npx convex run`.

## Trust boundary

Only `getCuratedRouteDetail` is client-callable (Clerk-gated). Everything else is
`internal*`, operator-invoked via `npx convex run` — identical posture to the geometry
pipeline.
