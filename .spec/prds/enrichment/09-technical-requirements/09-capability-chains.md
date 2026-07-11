---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Capability Chains

## CAP-ENR-01 — Batch generate-all (resumable, idempotent)

- **Promise:** every post-drop, plottable route ends a run with a grounded `generated`
  "why", a recorded `abstained`, or a recorded `failed` — none silently unprocessed.
- **Trigger:** Operator runs `scripts/backfill-curated-enrichment.ts --all` (after
  `--sample` review), post-Trust-drop.
- **Hops:** driver → `actions/curatedEnrichment:backfill` → `listForEnrichmentBackfill`
  (`by_composite_score` desc, `enrichmentStatus` absent ∧ `geometryStatus='generated'`) →
  per route: `getRouteForEnrichment` → pure fact extraction (`curatedEnrichmentFacts`:
  polyline decode + `calculateCurvatureScore`) → `inputsContentHash` →
  `complete(enrichment tier: zai GLM-5.2, forced emit_enrichment, explicit apiKey)` →
  `upsertEnrichment(status:'generated')` → cursor advance.
- **Boundary contracts:** external call from a `'use node'` action only; validators on
  every function; static `internal` imports (no lazy `_generated`); eligibility gate
  `geometryStatus='generated'`; explicit apiKey (no env-name coupling).
- **Failure modes:** LLM timeout/parse-fail → `failed` + reason, no fabricated row;
  insufficient facts → `abstained`; sustained provider errors (FIX-001 429) → batch halts
  after N consecutive failures, cursor resumable; route not found → skip.
- **Real-service proof:** `--sample=10` against the real dev deployment hitting the real
  z.ai API; fidelity report shows ≥1 `generated` row with a non-empty grounded paragraph.
- **Owner:** convex-implementer.

## CAP-ENR-02 — Regenerate-on-change (staleness via contentHash)

- **Promise:** when a route's grounding inputs, prompt version, or model change, its "why"
  is flagged stale and regenerated; unchanged routes are skipped with zero spend.
- **Trigger:** re-geocode/score edit changes facts, OR `promptVersion`/model bump; next
  backfill/QA scan.
- **Hops:** scan computes current `inputsContentHash` → differs from stored →
  `patchEnrichmentStatus('stale')` (prior QA-passed text keeps serving) → regenerate →
  QA → `qa_passed` (flag cleared).
- **Boundary contracts:** hash = SHA-256 over sorted-key canonicalized
  structured+geometryDerived+poi + promptVersion + model (`node:crypto`, deterministic,
  unit-tested); identical hash + servable status ⇒ no-op.
- **Failure modes:** non-canonical ordering breaking hash stability → mitigated by
  canonicalization tests; regeneration failure → prior valid row preserved (UC-GEN-03).
- **Real-service proof:** mutate one fixture route's `curvatureScore` on the real dev
  deployment, re-run backfill: only that route regenerates (hash/`generatedAt` change;
  neighbors untouched).
- **Owner:** convex-implementer.

## CAP-ENR-03 — QA gate flow (fail-closed)

- **Promise:** only claims traceable to grounding facts reach the app; hallucinations are
  mechanically blocked.
- **Trigger:** Operator runs `curatedEnrichmentQa:qa` after generation.
- **Hops:** per `generated` row → deterministic lint (length/format, banned claims,
  score-consistency) → cross-provider LLM grounding verifier (forced `emit_qa_verdict`:
  claims ↔ facts) → `qa_passed` | `qa_failed(issues)` → failed: regenerate-once with
  issues as constraints → still failing ⇒ honest absence.
- **Boundary contracts:** read path serves servable statuses ONLY (`qa_passed`, or `stale`
  with prior pass); `qa.issues` persisted for audit; verifier error ⇒ fail (closed).
- **Failure modes:** verifier provider down → rows stay `generated` (unserved), retryable;
  lint false-positives → issue codes reviewable via `qa.issues`.
- **Real-service proof:** seed one row with a deliberately ungrounded claim ("built in
  1932", no matching fact) against the real verifier; assert `qa_failed` with the claim in
  `issues` AND `getCuratedRouteDetail` omits `enrichment`.
- **Owner:** convex-implementer.

## CAP-ENR-04 — Detail renders the "why" (R1 ships)

- **Promise:** the existing detail view shows the grounded paragraph + provenance; honest
  absence otherwise; no new screen.
- **Trigger:** rider opens `curated-route/[id]`.
- **Hops:** `useCuratedRouteDetail` → `getCuratedRouteDetail` (+`by_routeId` enrichment
  side-lookup, servable-only) → `EnrichmentSection` between Summary and Scores → enriched:
  paragraph + provenance; absent: "No write-up yet" (combined-absence rule with Summary).
- **Boundary contracts:** additive optional return field; JS-only change (Metro-served);
  enrichment sub-lookup failure must not break the detail query (collapse to absence).
- **Failure modes:** absent enrichment → today's behavior; oversized text → defensive
  `numberOfLines={6}` + Read more.
- **Real-service proof:** Maestro flow on a real device opens a route with a seeded
  `qa_passed` row → `curated-detail-enrichment-paragraph` renders; a no-row route shows
  `curated-detail-enrichment-empty`.
- **Owner:** react-native-ui-implementer.

## CAP-ENR-05 — R2 couch-test gate (human ship gate)

- **Promise:** the rider-facing "why" cannot ship while the founder's couch test is red.
- **Trigger:** Operator runs `sampleForReview` after the QA pass is green.
- **Hops:** `sampleForReview({count:≥10, knownRoads})` (spans sources, ≥2 thin-grounding) →
  `.tmp/ENR/couch-sample.json` → founder reads each against personal ground truth →
  `recordCouchVerdict(routeId, verdict, notes)` → gate computation (≥9/10 `true` ∧ zero
  fabrications) → green: ship; red: failures route to regeneration/rule-tuning → re-gate.
- **Boundary contracts:** verdicts persisted on the enrichment rows; the gate result is a
  recorded, queryable fact (not chat prose); a fabrication verdict (`wrong`) anywhere in
  the sample forces red regardless of count.
- **Failure modes:** sample too thin (catalog small) → widen `knownRoads` matching;
  repeated fabrication pattern → tighten lint/banned rules, bump `promptVersion`, full
  regen (cheap), re-gate.
- **Real-service proof:** the gate run itself IS the proof — real generated rows, real
  founder verdicts recorded via the real mutation.
- **Owner:** convex-implementer (plumbing) + Operator (verdicts).
