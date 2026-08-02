## Task-by-task AC verdict

| Task | Verdict | Basis |
|---|---|---|
| S4-T1 geometry gate/repair | Partial | Implementation/tests exist, but gate provides no direct T1 AC execution evidence. |
| S4-T2 promote/re-route | Partial | Targeted tests exist; human gate only exercises seeded paths. |
| S4-T3 LLM reconstruction | Partial | Gate substitutes `lever2FixedGeometry`, not live anchor extraction/geocoding/LLM. |
| S4-T4 classifier | **Fail** | “Catalog” action does nothing without caller-supplied route IDs; no production whole-catalog traversal. |
| S4-T5 waterfall | Partial | Resume/cascade exercised, but L2 success is injected fixed geometry rather than real recovery. |
| S4-T6 couch gate | **Fail** | A pass is not bound to a real, complete sample and can be forged with arbitrary route IDs. |
| S4-T7 founder review | **Fail** | Gate script programmatically submits 25 `true` verdicts for synthetic fixtures; it is not a human visual review. |

## Gate integrity assessment

`gate-results.json` is internally consistent (8/8 logged exits and verifier reports no discrepancies), but it validates script outputs—not the claimed real-world acceptance.

- Step 1 explicitly injects `lever2FixedGeometry`; thus it does not prove real Google/LLM Lever-2 recovery.
- Step 3 seeds `test:*` couch fixtures and asserts PNG count/byte size, not map correctness or catalog representativeness.
- Step 4 constructs every verdict as `true` in code; no founder interaction occurs.
- Step 8 proves only that one existing pass unlocks one already-recovered test route.

Therefore the green gate is **mechanically reproducible but insufficient for attested human/real-service acceptance**.

## Findings

1. **Blocker — couch pass can be forged and globally unlock `--all`.**  
   **Confidence: high.** `convex/couchVerdict.ts:51-96` accepts any non-empty `routeVerdicts` list without loading `couch_samples`, checking that `sampleId` exists, enforcing one verdict per sampled route, rejecting duplicate/missing/unrelated route IDs, or binding the record to a reviewer/sample. `convex/couchVerdict.ts:128-153` then unlocks based on any latest pass.  
   **Remediation:** Load the sample, require an exact one-to-one verdict set for its route IDs, reject duplicates/unrelated IDs, and bind gate status to a designated approved sample/reviewer/tenant.

2. **High — S4-T4 does not implement “classify the entire catalog.”**  
   **Confidence: high.** `convex/actions/rideWorthinessClassifier.ts:259-262` uses `const ids = routeIds ?? []` and returns zero classifications when omitted. No production caller of `classifyCatalog`/`classifyCatalogInternal` was found. The integration test passes a four-route fixture subset (`convex/__tests__/S4T4-classify-catalog.integration.test.ts:98`).  
   **Remediation:** Add a paginated catalog query/internal job and make omitted `routeIds` enumerate all eligible routes; test against pagination and a catalog larger than one page.

3. **High — declared founder visual review is scripted fixture approval.**  
   **Confidence: high.** `.gate-evidence/.../scripts/step3.sh:6-8` seeds couch fixtures; `step4.sh:6-8` creates a `true` verdict for every sampled route and records `pass`. Corresponding evidence contains only `test:*` routes and all-true verdicts. This cannot establish that a founder inspected real rendered routes.  
   **Remediation:** Require a founder-authenticated review artifact with immutable sample/export hashes, reviewer identity, per-route decisions/notes, and prohibit test-prefixed records in a production closeout sample.

4. **High — “real LLM/API waterfall” claim is contradicted by injected deterministic geometry.**  
   **Confidence: high.** `.gate-evidence/.../scripts/step1.sh:7` passes `lever2FixedGeometry`; `convex/waterfallOrchestrator.ts:574-588` branches to the fixed-geometry reconstruction action instead of the real reconstruction action. Step 7’s retry output similarly reports `routingCallCount: 0`.  
   **Remediation:** Separate deterministic integration coverage from attested live-service evidence; live gate runs must prohibit test seams and capture provider request/result provenance with secrets redacted.

5. **Medium — couch assembler preferentially samples test fixtures whenever present.**  
   **Confidence: high.** `convex/couchSampleAssembler.ts:~565-580` preferentially filters `test:couch-*`, `test:scraped-*`, `test:ai-recon-*`, and `test:name-routed-*`; it falls back to catalog only if fewer than 20 fixtures exist. This makes the purported trust sample non-representative in any environment containing fixture records.  
   **Remediation:** Exclude test/fixture namespaces by default; expose fixture selection only through a test-only endpoint and require a production catalog sampling policy.

6. **Medium — PNG evidence checks non-blank bytes, not geographic/render correctness.**  
   **Confidence: high.** `.gate-evidence/.../scripts/step3.sh:26-29` asserts only count, minimum byte size, and at least one distinct byte size. It does not validate decoded geometry, route-to-metadata correspondence, or visual correctness.  
   **Remediation:** Validate PNG decoding plus metadata-to-polyline consistency; retain human-reviewed image hashes and sample manifest.