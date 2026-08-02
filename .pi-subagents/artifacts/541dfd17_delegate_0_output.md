## Red-hat review: **NOT ACCEPTED**

### Human-gate precheck: FAILED
The alleged founder gate is automated, not fresh human evidence:

- `step3.sh` seeds synthetic `test:*` routes and assembles a fixture sample, not recovered catalog routes.
- `step4.sh:6-10` supplies a test identity and programmatically assigns every route `"true"`; no human review, map inspection, notes, or founder authorization is evidenced.
- `step1.sh:6` uses `lever2FixedGeometry`, contradicting the claimed real Google + LLM sample run.
- The gate records only `identity.subject` and has no founder/operator role validation.

### AC verdicts

| Task | AC verdicts | Task verdict |
|---|---|---|
| S4-T1 | AC1 pass; **AC2 fail**; AC3 pass; AC4 pass; AC5 provisionally pass (cassette replay only); AC6 pass | **Not satisfied** |
| S4-T2 | **AC1 fail** (canonical gate omission); AC2–AC6 appear implemented | **Not satisfied** |
| S4-T3 | AC1–AC3 appear implemented; **AC4 fail** (same gate omission); AC5–AC6 appear implemented | **Not satisfied** |
| S4-T4 | **AC1 fail**; **AC2 fail**; AC3–AC6 appear implemented | **Not satisfied** |
| S4-T5 | AC1–AC4 partial; **AC5 fail**; **AC6 fail** | **Not satisfied** |
| S4-T6 | AC1–AC3 partial; **AC4 fail**; **AC5 fail** | **Not satisfied** |
| S4-T7 | **AC1–AC5 fail**: no valid human/founder evidence | **Not satisfied** |

### Findings

1. **Blocker — canonical geometry gate does not enforce in-region anchors.**  
   `convex/curatedGeometryGate.ts:98-127` accepts only `anchorCount`, while `reevaluateExistingGeometry` alone evaluates `distanceFromCentroid` at `:148-152`. Lever 1 calls the inadequate canonical gate after deriving start/end anchors (`convex/curatedGeometryReconstruct.ts:569-580`), so a geographically unrelated polyline can pass if its ratio/density/count pass. This violates S4-T1 AC2 and the single-source gate requirement, and infects S4-T2/T3.  
   **Confidence:** high.  
   **Fix:** pass anchor coordinates/distances into `determineGateVerdict`, make it count only anchors within 150mi, and remove per-lever substitutes. Re-run all persisted geometry through the corrected gate.

2. **Blocker — `classifyCatalog` does not enumerate the catalog, checkpoint, or report coverage.**  
   `convex/actions/rideWorthinessClassifier.ts:255-265` defaults omitted `routeIds` to `[]` and returns success with zero classifications. It has no bounded pagination, checkpoint state, completion record, or whole-catalog query.  
   **Confidence:** certain.  
   **Fix:** introduce a bounded indexed page query plus durable checkpoint/coverage record; schedule subsequent pages; only mark completion after every eligible route (including FHWA/recovered rows) is traversed.

3. **High — classifier does not initiate/verify the required rescue-first geometry attempt for freeway rows.**  
   `convex/actions/rideWorthinessClassifier.ts:249-253` explicitly says geometry is independent; its handlers only classify/persist. Thus S4-T4 AC2’s “geometry attempt still proceeds” is not provided by this flow. The test’s likely non-null `geometryStatus` observation is not evidence of an attempt.  
   **Confidence:** high.  
   **Fix:** explicitly enqueue/verify the geometry recovery attempt independently of `not_a_ride`, with an auditable attempt artifact.

4. **Blocker — REVIEW approval fabricates a pass and rider-ready state without re-running the gate.**  
   `convex/reviewQueue.ts:256-290` overwrites verification as `pass`, forcibly sets `degenerate: false`, stamps `scraped_promoted`, and sets `riderReady: true`; it never decodes/re-measures/re-gates the candidate. Any authenticated user can convert a rejected fabricated geometry into rider-ready.  
   **Confidence:** certain.  
   **Fix:** decode and canonically re-evaluate the exact candidate; persist/enable rider-ready only on pass, otherwise retain REVIEW. Preserve actual provenance rather than relabeling it.

5. **Blocker — REVIEW and couch operational mutations have authentication only, not founder/operator authorization.**  
   `convex/guards.ts:15-28` merely returns an authenticated subject. REVIEW approve uses it at `convex/reviewQueue.ts:236-239`; couch approval uses it at `convex/couchVerdict.ts:57-85`. Any authenticated account can approve geometry, retire routes, clear verdicts, or unlock `--all`.  
   **Confidence:** certain.  
   **Fix:** add a server-side role/ownership guard using canonical user records and `tokenIdentifier`; restrict all curation mutations, including fixture/clear mutations in production.

6. **Blocker — couch PASS is not bound to a real immutable sample, exact membership, export, or reviewer.**  
   `recordCouchVerdict` accepts arbitrary `sampleId` and arbitrary nonempty verdict rows (`convex/couchVerdict.ts:51-92`), never loads `couch_samples`, rejects neither duplicate nor omitted route IDs, and permits replacement of a verdict. `couchGateStatus` unlocks on any pass from any sample (`:128-153`).  
   **Confidence:** certain.  
   **Fix:** require an immutable exported sample manifest; verify exact unique membership and count, manifest/export/geometry hashes, sample version, reviewer identity, and notes. Make pass verdicts append-only/superseded rather than replaceable. Gate `--all` on the current approved immutable manifest only.

7. **High — couch sample storage itself is mutable and accepts invented route metadata.**  
   `convex/couchSampleAssembler.ts:523-575` accepts client-provided routes, only checks size and at least one of each provenance, then replaces existing samples. It neither verifies candidates against route/geometry records nor enforces the required ≥5 per provenance.  
   **Confidence:** certain.  
   **Fix:** make sample creation internal/admin-only from server-derived gate-passing geometry; validate real provenance/lengths/anchors and enforce minimum allocation; freeze the manifest once exported.

8. **High — waterfall has a terminal-state hole on Lever 3 exception.**  
   `convex/waterfallOrchestrator.ts:701-719` produces `retirement_eligible` when Lever 3 throws and only creates a REVIEW artifact if a geometry string happened to exist. The route itself is not marked REVIEW, contradicting fail-closed REVIEW handling.  
   **Confidence:** high.  
   **Fix:** route all exhausted/error candidates to a durable REVIEW state with failure provenance; reserve retirement eligibility for explicit authorized disposition.

9. **Medium — cost breaker can leave a route touched by Lever 1 but without a terminal state.**  
   Lever 1 is invoked before the cost check (`convex/waterfallOrchestrator.ts:518-526`), then the loop can break before Lever 2 (`:580-605`). The route is omitted from results and remains unresolved after a partial waterfall attempt.  
   **Confidence:** high.  
   **Fix:** cost-check before beginning a route likely to require L2, or record a durable paused/cost-blocked state and resume checkpoint.

10. **High — recorded closeout evidence contradicts the claimed live human and provider acceptance.**  
    `.gate-evidence/.../scripts/step1.sh:4-11` uses a synthetic identity and `lever2FixedGeometry`; `scripts/step4.sh:6-18` mechanically creates all-true verdicts. `step3.log` shows seeded `test:couch-*` fixtures. This cannot attest founder visual inspection or real-provider waterfall execution.  
    **Confidence:** certain.  
    **Fix:** perform a fresh founder session against a production-like immutable manifest of recovered catalog routes; capture authenticated reviewer identity, reviewed exports/hashes, route-by-route decisions/notes, and live-provider attempt receipts.