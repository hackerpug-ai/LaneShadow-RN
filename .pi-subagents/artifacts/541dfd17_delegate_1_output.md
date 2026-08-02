## AC coverage verdicts
- **S4-T1:** Partial — canonical gate does not validate anchor region.
- **S4-T2/T3:** Partial — levers call the region-incomplete canonical gate.
- **S4-T4:** Not satisfied — “catalog” classification is a caller-provided subset; empty input classifies zero routes.
- **S4-T5:** Not satisfied — terminal-state and cost accounting claims are unsafe.
- **S4-T6:** Not satisfied — arbitrary/counterfeit couch verdicts can unlock `--all`.
- **S4-T7:** Not attested — scripts seed fixtures and programmatically submit all-`true`; no human inspection evidence.

## Findings
- **CRITICAL (high): Couch PASS is forgeable and not bound to a real reviewed sample.** `recordCouchVerdict` never loads/validates `sampleId`, membership, uniqueness, route count, or rendered snapshot; `couchGateStatus` unlocks on any latest pass. Evidence: `convex/couchVerdict.ts:51-101,128-153,323-345`. **Fix:** require immutable exported sample manifest/hash, exact unique membership and all required decisions before allowing PASS.

- **HIGH (high): Any authenticated identity can approve/retry/retire routes or unlock batch processing.** `requireIdentity` only checks identity existence; operational mutations rely solely on it. Evidence: `convex/guards.ts:15-28`; `convex/reviewQueue.ts:236-239,317-320`; `convex/couchVerdict.ts:57-58,131,329`. **Fix:** enforce founder/operator role or ownership authorization for all REVIEW/couch mutations and actions.

- **HIGH (high): REVIEW approval fabricates a passing verification and sets `riderReady=true` without rerunning the gate.** Defaults invent anchors, point count, ratio, and provenance. Evidence: `convex/reviewQueue.ts:251-269,287-292`. **Fix:** decode/re-measure/re-run canonical gate; retain review status and riderReady false when it fails.

- **HIGH (high): The “canonical” geometry gate does not enforce the required in-region anchors for new geometry.** It accepts only `anchorCount`; distance validation exists only in the legacy sweep helper. Evidence: `convex/curatedGeometryGate.ts:98-127` versus `138-152`. **Fix:** pass anchors/centroid (or in-region count) into `determineGateVerdict` and use it from every lever.

- **HIGH (high): `classifyCatalog()` does not enumerate the catalog.** Absent `routeIds`, it returns successful zero work, contradicting T4 AC-1. Evidence: `convex/actions/rideWorthinessClassifier.ts:255-279`. **Fix:** implement bounded/paginated catalog enumeration with checkpoint/completion records.

- **HIGH (high): Waterfall terminal states conflict and cost accounting undercounts real failed/retried provider calls.** A Lever-3 exception records a `retirement_eligible` terminal artifact and, if a candidate exists, a separate `queued` REVIEW artifact for the same route. L2 cost is charged only after its wrapped call returns, excluding failed/retried API attempts. Evidence: `convex/waterfallOrchestrator.ts:586-607,695-718,759-785`. **Fix:** choose one durable terminal state; charge/reserve each billable L2 attempt before invocation and reconcile actual costs.

- **HIGH (high): Gate/human-test claims are test theatre.** Step 1 injects `lever2FixedGeometry`; Step 2 only asserts each returned row has a nonempty string; Step 3 seeds fixtures and checks PNG byte size; Step 4 submits `true` for every route programmatically. Evidence: `.gate-evidence/2026-07-19T22:59:46Z/scripts/step1.sh:5-11`, `step2.sh:9-16`, `step3.sh:7-37`, `step4.sh:7-18`. This conflicts with the asserted verified/human PASS: `GATE-RESULTS.md:3-9,15-29`. **Fix:** replace with authenticated founder review of a persisted real-route export manifest, individual recorded decisions/notes, and independent verification.

### Human-gate precheck
**Failed / not attested.** The gate runner explicitly had no UI driver (`GATE-RESULTS.md:5-6`) and its scripts do not establish that a human inspected real catalog maps. The current PASS must not unlock Sprint 05.