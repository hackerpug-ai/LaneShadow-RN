| Task | AC verdict | Basis |
|---|---|---|
| S4-T1 | Partial | Gate logic exists, but main gate accepts only `anchorCount`, not anchor locations/region. |
| S4-T2 | Partial | Test/artifact claims exist; not independently attested here. |
| S4-T3 | Partial | Gate artifact substitutes `lever2FixedGeometry` for real LLM/Google reconstruction. |
| S4-T4 | Fail | “Catalog” classifier does nothing unless callers provide explicit route IDs. |
| S4-T5 | Fail | Gate’s claimed real-API waterfall used a deterministic fixed-geometry seam. |
| S4-T6 | Partial | Artifact shows a 25-route sample and PNG count, but relies on claimed generated artifacts. |
| S4-T7 | Partial | Founder evidence is a claim referencing `.tmp` artifacts; no durable visual-review evidence was validated. |

## Gate assessment

**Do not accept the current VERIFIED PASS as an attested close.** Gate step 1 explicitly invokes `lever2FixedGeometry`, contradicting the gate requirement and `gate-results.json` claim that the sample waterfall ran on real Google and LLM APIs. This means the central end-to-end proof does not validate Lever 2 recovery or its external-provider behavior.

## Findings

1. **High — high confidence:** The gate evidence’s real-provider claim is contradicted by its executed command.  
   **Evidence:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/.gate-evidence/2026-07-19T22:59:46Z/scripts/step1.sh:6` passes `lever2FixedGeometry`; `GATE-RESULTS.md` claims “real Google + LLM APIs.”  
   **Remediation:** Re-run and preserve a gate capture with no fixed-geometry/canned reconstruction seam, including provider request/cassette provenance and actual LLM/Google result data.

2. **High — high confidence:** `classifyCatalog` is not a whole-catalog classifier.  
   **Evidence:** `convex/actions/rideWorthinessClassifier.ts:226-238` sets `const ids = routeIds ?? []` and returns zero classifications when no IDs are supplied. This fails S4-T4 AC-1’s requirement to classify every catalog route.  
   **Remediation:** Add a bounded, resumable internal catalog scan/query and schedule batches; retain optional `routeIds` only as an explicit subset/testing override.

3. **High — medium confidence:** The purported single geometry gate does not itself enforce anchor region validity for new geometry.  
   **Evidence:** `convex/curatedGeometryGate.ts:99-128` `determineGateVerdict` accepts only `anchorCount`, whereas region distance checks occur only in `reevaluateExistingGeometry`. Two off-region anchors can therefore pass this gate if a caller supplies `anchorCount: 2`.  
   **Remediation:** Pass anchors plus centroid (or independently derived in-region count) into the canonical gate and enforce the ≤150-mile condition there for every lever.

4. **Medium — high confidence:** The classifier violates Convex typing guidance with `any` at its function-call boundary.  
   **Evidence:** `convex/actions/rideWorthinessClassifier.ts:129-133` declares `runQuery: any` and `runMutation: any`; lines around `:166` also cast document IDs via `as any`. The required Convex guidelines prohibit `any` for contexts and require strict IDs.  
   **Remediation:** Use an appropriate `ActionCtx`/narrow interface with typed function references and `Id<"curatedRoutes">`.

### Consolidation

- **Blockers:** findings 1–3.
- **Residual risk:** claimed real-provider and human-review completion remains unverified; current evidence demonstrates deterministic seams and terminal-state bookkeeping, not the required external trust pipeline.