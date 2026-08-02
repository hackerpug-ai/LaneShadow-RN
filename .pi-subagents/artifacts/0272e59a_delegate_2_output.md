## Task / AC verdicts

| Task | Applicable | Verdict |
|---|---:|---|
| S4-T1 gate/repair | Yes | Partial — gate implementation appears fail-closed on normal paths, but later REVIEW approval can overwrite a failed gate verdict. |
| S4-T2 levers 1/3 | Yes | Partial — normal gate paths exist; privileged workflow authorization is absent. |
| S4-T3 LLM reconstruction | Yes | Partial — structured z.ai boundary and missing-secret failure are present; real-provider evidence is not established by the gate run. |
| S4-T4 classifier | Yes | **Fail** — `classifyCatalog` does nothing when called without explicit route IDs, contrary to whole-catalog AC. |
| S4-T5 waterfall/REVIEW | Yes | **Fail** — REVIEW approval creates rider-ready gate-pass geometry without revalidation. |
| S4-T6 couch gate | Yes | **Fail** — any authenticated user can create/replace arbitrary pass verdicts; verdict is not bound to a stored sample. |
| S4-T7 founder human gate | Yes | **Fail** — supplied evidence is fixture/CLI attestation, not independently trustworthy founder review evidence. |

## Human-gate integrity

**Not credible as an unlocking control.** Gate artifacts demonstrate scripts using `--identity {"subject":"s4-human-gate"}`, fixture seeding, and automatic `true` verdict construction rather than authenticated founder-role review. Step 3 seeds 30 `test:couch-*` fixtures; step 4 assigns all 25 verdicts to `true`. `GATE-RESULTS.md` additionally admits the waterfall used a fixed-geometry deterministic Lever-2 seam, despite the “real Google + LLM APIs” claim.

## Findings

1. **BLOCKER — failed geometry can be promoted to pass and rider-ready without gate revalidation.**  
   **Confidence: high**  
   `convex/reviewQueue.ts:235-292`  
   `approveDisposition` takes a REVIEW candidate, preserves its failed ratio/anchors/geometry, rewrites `verification.verdict` to `pass`, stamps `scraped_promoted`, and directly sets `riderReady: true`. The gate’s “never store geometry that fails” invariant is bypassed.  
   **Remediation:** require a documented founder override role plus immutable audit justification; re-run the canonical gate and only allow a separately modeled, explicitly non-rider-ready override when it fails.

2. **BLOCKER — couch gate can be forged by any authenticated account and is not bound to the reviewed sample.**  
   **Confidence: high**  
   `convex/guards.ts:15-28`; `convex/couchVerdict.ts:51-101,128-145,323-345`  
   `requireIdentity` only establishes authentication. `recordCouchVerdict` neither confirms `sampleId` exists nor validates route IDs, uniqueness, or exact equality with `couch_samples.routes`; it also permits replacement. `couchGateStatus` unlocks on any retained pass row, regardless of reviewer, sample freshness, or batch/catalog version.  
   **Remediation:** enforce founder/admin authorization using canonical `tokenIdentifier`; validate exact sample membership/count and uniqueness; make reviewed sample immutable/versioned; bind gate pass to the active batch snapshot and invalidate on geometry/provider changes.

3. **HIGH — claimed founder evidence is automated fixture evidence, not human review or real-provider proof.**  
   **Confidence: high**  
   `.gate-evidence/.../scripts/step4.sh:5-7`; `.gate-evidence/.../step3.log`; `GATE-RESULTS.md`  
   Step 4 programmatically turns every sample route into `true`; step 3 is entirely `test:couch-*` fixture data. `GATE-RESULTS.md` says Lever 2 used a fixed-geometry seam. This cannot attest that a founder reviewed real recovered lines or that real Google/LLM calls occurred.  
   **Remediation:** collect signed founder identity, review timestamps, route/image hashes, and immutable exported artifact IDs. Separate fixture integration tests from a production human-gate attestation. Capture provider request IDs/redacted receipts for real-provider claims.

4. **HIGH — whole-catalog classifier AC is unimplemented.**  
   **Confidence: high**  
   `convex/actions/rideWorthinessClassifier.ts:255-265`  
   Omitting `routeIds` returns `{ classified: 0 }`; no catalog enumeration or scheduler exists. Thus the public function advertised as catalog classification cannot meet “every route,” including FHWA/recovered rows, except when a caller supplies a complete list.  
   **Remediation:** implement bounded indexed enumeration/checkpoint scheduling internally, report coverage totals and failures, and block completion attestation when unclassified eligible routes remain.

5. **HIGH — privileged operational mutations are exposed to every authenticated user.**  
   **Confidence: high**  
   `convex/reviewQueue.ts:236-239,317-320`; `convex/couchVerdict.ts:51-58,151-156`  
   REVIEW approve/retry/retire, couch verdict recording, and verdict clearing rely only on `requireIdentity`; no founder/operator role or ownership check exists.  
   **Remediation:** make operational functions internal or enforce server-side founder/admin authorization; remove production-accessible test seed/clear operations or protect them equivalently.

6. **MEDIUM — cost stop starts a route but records no terminal disposition.**  
   **Confidence: medium**  
   `convex/waterfallOrchestrator.ts:518-560`  
   Lever 1 runs, then the cost check `break`s before a terminal artifact/result is created. This conflicts with the stated exactly-one-terminal-state requirement and makes audit accounting ambiguous.  
   **Remediation:** record a distinct resumable `deferred_cost_limit` state/artifact, or perform the affordability check before any per-route lever work.

7. **MEDIUM — Convex typed-secret guidance is bypassed in trust-pipeline API calls.**  
   **Confidence: high**  
   `convex/curatedGeometryReconstruct.ts:208,239`  
   Google API credentials are read via `process.env.GOOGLE_MAPS_API_KEY`, while the project Convex guidance requires declared app environment variables accessed via generated `env`. No secret value is exposed in reviewed output, but this weakens deployment-time validation and typed configuration.  
   **Remediation:** declare required/optional secrets in `convex/convex.config.ts` and use generated `env`; add missing-secret fail-closed tests.