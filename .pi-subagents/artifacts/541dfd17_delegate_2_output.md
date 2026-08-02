## Security red-team review — Sprint 04 Trust Pipeline

### Verified controls
- Convex auth config exists: `convex/auth.config.ts:17-25`.
- Operational Sprint APIs call `requireIdentity`, rejecting unauthenticated callers: `convex/guards.ts:15-28`.
- `wrong` cannot accompany a passing couch verdict: `convex/couchVerdict.ts:29-43,64-71`.
- Ride-worthiness uses a separate z.ai provider and environment-derived key: `convex/actions/rideWorthinessClassifier.ts:24-30`; `convex/actions/agent/lib/zaiProvider.ts:31-47`.
- Classifier persistence is internal and recomputes rider-ready: `convex/curatedGeometry.ts:541-556`.
- Normal lever paths invoke the canonical geometry gate: `convex/curatedGeometryReconstruct.ts:574,822`.
- `--all` calls the gate before delegating: `convex/couchVerdict.ts:323-341`.

### Findings
1. **CRITICAL / High — Any authenticated user can forge a couch PASS and unlock `--all`.**  
   `recordCouchVerdict` only requires authentication, accepts arbitrary `sampleId` and arbitrary nonempty route verdicts, and replaces any existing verdict: `convex/couchVerdict.ts:51-101`. `couchGateStatus` accepts any pass row, without sample membership, immutable manifest, reviewer role, version, or current-sample binding: `convex/couchVerdict.ts:128-153`.  
   **Remediation:** Require a canonical founder/operator role; load the stored sample; require exact unique route-ID set and expected count; bind to immutable export/snapshot hash and geometry versions; append immutable signed/audited verdicts; gate only the active approved manifest.

2. **CRITICAL / High — REVIEW approval bypasses canonical geometry verification and forces rider-ready.**  
   `approveDisposition` re-labels stored candidate geometry as `pass`, fabricates/defaults verification values, and directly sets `riderReady: true`, without calling `determineGateVerdict` or rider-ready recomputation: `convex/reviewQueue.ts:236-315`.  
   **Remediation:** Recompute measurements and invoke the canonical gate server-side. Reject failures; call `recomputeRiderReady`; preserve actual provenance and immutable prior evidence. A manual override, if allowed, must be founder-only and explicitly marked/audited—not rewritten as gate-pass evidence.

3. **HIGH / High — No founder/operator authorization on trust-changing APIs.**  
   `requireIdentity` verifies only that a caller has an identity and returns `identity.subject`; it has no role/ownership evaluation: `convex/guards.ts:15-28`. REVIEW approve/retry/retire, couch verdict recording/clearing, sample storage, fixture seeding, waterfall execution, and classifier execution rely on this guard (examples: `convex/reviewQueue.ts:236,317,356,411`; `convex/couchVerdict.ts:51,157,323`; `convex/couchSampleAssembler.ts:523,583`; `convex/waterfallOrchestrator.ts:442`; `convex/actions/rideWorthinessClassifier.ts:238,255`). User schema contains no role/capability field: `shared/models/users.ts:10-24`.  
   **Remediation:** Add a server-owned role/capability guard based on canonical user/org data; restrict all curation, seed/test, review, verdict, and batch endpoints to operators. Move test seams to internal/test-only deployments.

4. **HIGH / High — Public test/fixture seams enable production-state manipulation and evidence fabrication.**  
   Authenticated callers can seed review candidates with caller-chosen geometry: `convex/reviewQueue.ts:96-224`; create/delete couch fixtures: `convex/couchSampleAssembler.ts:356-423`; seed waterfall fixtures: `convex/waterfallOrchestrator.ts:249-372`; and clear all couch verdicts: `convex/couchVerdict.ts:157-169`.  
   **Remediation:** Remove from production bundles or make `internalMutation`s, guard with deployment/test environment plus operator capability, and namespace cleanup to a server-issued run ID.

5. **HIGH / High — `classifyCatalog` does not classify the catalog; default invocation is a silent no-op.**  
   The public action uses `routeIds ?? []`, returns success with zero classifications when omitted, and has no pagination/checkpointing or coverage proof: `convex/actions/rideWorthinessClassifier.ts:255-281`. This fails UC-VER-03 / S4-T4 AC-1’s whole-catalog requirement.  
   **Remediation:** Internalize catalog enumeration, use indexed bounded pages with checkpoint/completion state, restrict caller-controlled subsets to operator use, and record coverage totals.

6. **MEDIUM / High — Public actions permit unbounded provider-cost abuse.**  
   Any authenticated caller may submit arbitrary `routeIds` and caller-selected `maxCost` to the waterfall: `convex/waterfallOrchestrator.ts:442-466`, or arbitrary route IDs to the z.ai classifier: `convex/actions/rideWorthinessClassifier.ts:238-281`. There is no authorization, batch-size cap, per-caller quota, or server-owned spending budget.  
   **Remediation:** Operator-only dispatch, bounded batch sizes, server-side maximum cost/retry policy, durable job queue, and per-tenant/operator rate and budget limits.

7. **MEDIUM / High — Couch sample integrity is caller-controlled.**  
   `storeCouchSample` validates only count and presence of each provenance; it does not verify candidates exist, are unique, are generated/gate-passing, or that metadata matches live geometry: `convex/couchSampleAssembler.ts:523-580`. The schema stores mutable inline route metadata without hashes: `convex/schema.ts:326-348`.  
   **Remediation:** Assemble and persist samples only server-side from canonical records; enforce unique exact membership; store geometry/version/export hashes and render artifact references; prohibit client-controlled sample writes.

8. **MEDIUM / High — `clearCouchVerdicts` lets any signed-in user erase up to 100 gate records.**  
   `convex/couchVerdict.ts:157-169`. This is an integrity/availability attack and destroys audit evidence.  
   **Remediation:** Remove it from production or make it internal, test-only, role-gated, and scoped to a server-issued test run.

### Gate-evidence vulnerabilities
- **CRITICAL / High:** The claimed “real Google + LLM” waterfall evidence instead supplies `lever2FixedGeometry`, bypassing live reconstruction/provider integrity: `.gate-evidence/.../scripts/step1.sh:6-7`. The result shows all three test routes recovered, including the intended review candidate: `.gate-evidence/.../step1.log`.
- **CRITICAL / High:** Couch “human” verdict evidence is programmatically generated as 25 `true` values, not an authenticated founder review: `.gate-evidence/.../scripts/step4.sh:6-20`.
- **HIGH / High:** Gate scripts use a synthetic identity (`s4-human-gate`) rather than proving an authorized founder identity: `.gate-evidence/.../scripts/step1.sh:4`; `.gate-evidence/.../scripts/step4.sh:6-7`.
- **HIGH / High:** Review-disposition evidence seeds candidates and uses `lever2FixedGeometry`; it proves test seams, not gate-safe manual adjudication: `.gate-evidence/.../scripts/step7.sh:5-13`.
- **HIGH / High:** `--all` evidence clears verdicts and restores a caller-supplied pass, demonstrating the same bypass rather than resistance to it: `.gate-evidence/.../scripts/step8.sh:12-27`.

### AC/security verdict
- **S4-T4 AC-1:** **Not satisfied** — empty `routeIds` yields no-op, not catalog coverage.
- **S4-T5 AC-6 / UC-VER-04:** **Not satisfied (security)** — approve bypasses the required canonical gate.
- **S4-T6/T7 AC-4/5 / UC-VER-05:** **Not satisfied (security)** — unauthenticated-by-role arbitrary PASS can unlock `--all`; no membership/version/export binding.
- **Provider key handling:** **Pass with residual risk** — key is environment-sourced and not logged; public unauthorised invocation remains a cost-abuse risk.
- **Evidence attestation:** **Fail** — artifacts rely on synthetic identities, test fixtures, and fixed geometry; they do not attest to founder review or live-provider pipeline behavior.