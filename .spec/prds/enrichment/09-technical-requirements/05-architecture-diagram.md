---
stability: CONSTITUTION
last_validated: 2026-07-10
prd_version: 1.0.0
---

# Architecture Diagram

```
 OPERATOR (founder)
   │  npx convex run / scripts/backfill-curated-enrichment.ts (--top/--sample/--all/--cursor)
   ▼
 [backfill action  'use node']──────────── halt after N consecutive provider errors
   │  listForEnrichmentBackfill (by_composite_score, enrichmentStatus absent ∧ geometryStatus='generated')
   ▼
 [generateForRoute]
   │  getRouteForEnrichment ──► curated_routes + curated_route_geometry (polyline)
   ▼
 [curatedEnrichmentFacts  (pure)]
   │  decode polyline → curvature/span · normalize scores/state/length · thinGrounding flag
   │  inputsContentHash (canonical SHA-256)
   ├── hash == stored ∧ servable ──► SKIP (idempotent, $0)
   ▼
 {z.ai GLM-5.2}  ◄── enrichment tier (models.ts) · apiKey = Z_AI_API_KEY (explicit)
   │  forced tool-call: emit_enrichment(whyText, …)
   ├── insufficient facts ──► route.enrichmentStatus = 'abstained' (no row)
   ├── provider/parse fail ──► 'failed' + reason (prior row preserved)
   ▼
 [upsertEnrichment  status='generated']
   ▼
 [QA action  'use node']
   │  1. curatedEnrichmentLint (pure): length/format · banned claims · score-consistency
   │  2. {OpenAI low tier}  forced emit_qa_verdict: claims ↔ groundingFacts   (cross-provider)
   ├── any unsupported claim / verifier error ──► status='qa_failed' (fail-closed) ─► regenerate-once ─► still failing ⇒ honest absence
   ▼
 [status='qa_passed']──────► OPERATOR couch test (R2): sampleForReview → recordCouchVerdict
   │                                   gate green (≥9/10 true ∧ 0 fabrications) required to ship
   ▼
 [getCuratedRouteDetail  (public, Clerk-gated)]
   │  by_routeId side-lookup · serves qa_passed (or stale-with-prior-pass) ONLY
   │  enrichment?: { why, generatedAt }   (< 1 KB)
   ▼
 [curated-route/[id].tsx  ──  EnrichmentSection "Why ride it"]
   │  enriched: paragraph + provenance caption
   │  absent/abstained/failed/error: "No write-up yet" (single honest copy; combined-absence rule)
   ▼
 RIDER

 LIFECYCLE: route inputs change / promptVersion bump ─► hash mismatch ─► status='stale'
            (keeps serving prior QA-passed text) ─► scoped regeneration ─► QA ─► qa_passed
 COVERAGE:  coverageReport (live counts: ship-ready % · absent · abstained · stale · failed · qa_failed · thin) ─► R1 verdict
```
