# Red-Hat Review — Sprint 04 Trust Pipeline

**Report date:** 2026-07-21T16:56:29Z  
**Target:** `.spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline`  
**Scope:** Verify REDHAT-FIX-17 through REDHAT-FIX-20 against the prior four findings, then re-audit the couch/gate control plane.  
**Severity verdict:** **NEEDS REVISION — CRITICAL open**

## Executive Summary

FIX-17 and FIX-19 are substantively implemented and passed their focused live Convex suites when run serially. The committed `gate-plan.json` is also correctly rebound away from the withdrawn `2026-07-19T22:59:46Z` scripts.

However, the claimed *HEAD-bound* plan authority for FIX-18/FIX-20 is not actually HEAD-bound. Both canonical-step completeness and off-plan validation read a caller-visible working-tree `gate-plan.json`. A dirty one-step plan can therefore reduce the canonical set and allow the withdrawn run ID; the manifest verifier then accepts that one-step bundle. This leaves the original CRITICAL-2 authority problem open and also leaves HIGH-2 only partially resolved. The S4-T7 Founder-Operator gate remains correctly external and BLOCKED; it is **not** a finding.

## Prior-Finding Verdicts

| Prior finding | Verdict | Evidence |
|---|---|---|
| **CRITICAL-1:** later fail must revoke earlier pass | **PASS** | `couchGateStatus` selects the latest *bound* verdict before checking for `pass` (`convex/couchVerdict.ts:295-327`); `runAllWaterfall` blocks on `!gate.allowed` (`:657-665`). Serial live suite: FIX-17 **4/4 passed**. |
| **CRITICAL-2:** canonical 1..8 completeness | **FAIL / not closed at the claimed trust boundary** | The static happy/negative cases pass, but `loadGatePlanExpectedSteps` reads working-tree plan bytes (`tools/gate/verifyEvidenceManifest.ts:84-105`), and the verifier uses that mutable result (`:283-301`). Reproducer below accepts a dirty one-step plan and a one-step stale-run bundle. |
| **HIGH-1:** non-optional manifest/catalog binding and `catalogVersion` response shape | **PASS** | `exactBind` requires both non-empty fields and strict equality (`convex/couchVerdict.ts:291-305`); all seven `couchGateStatus` return shapes include `catalogVersion`, including allowed (`:330-338`); founder attestation rejects missing bindings (`tools/gate/resolveFounderVerdict.ts:115-163`). Serial live suite: FIX-19 **4/4 passed**. |
| **HIGH-2:** retire withdrawn plan and reject off-plan paths | **PARTIAL** | All eight literal commands now point at `2026-07-21T152805Z` (`gate-plan.json:15-106`) and none point to the withdrawn run. But path enforcement is only an allow-list of run IDs read from working-tree bytes, not an immutable plan nor an exact command/script match (`tools/gate/deriveGoalState.ts:395-485`). |

## CRITICAL Findings

- [ ] **CRITICAL-1 — The canonical plan is mutable, so completeness and plan binding can be bypassed.**
  - **Evidence:** `loadGatePlanExpectedSteps` consumes `readFileSync(join(cwd, GATE_PLAN_REL))`, not `git show HEAD:<plan>` or a HEAD-blob comparison (`tools/gate/verifyEvidenceManifest.ts:84-105`). `loadGatePlanBinding` does the same (`tools/gate/deriveGoalState.ts:395-423`); `deriveGoalState` uses those results for identity/completeness and off-plan checks (`:558-576, 616-639`). Neither reader rejects a dirty/stale plan.
  - **Reproduction:** In a temporary git repository, I committed the honest eight-step plan, then left a dirty plan with only step `1` and `2026-07-19T22:59:46Z` as its literal command. I committed a one-step manifest/artifact under that withdrawn run. Actual probe output was: `expected: [1]`, `offPlan: null`, and `manifest.ok: true`.
  - **Impact:** Once a real founder attestation exists, a caller can reduce the mechanical gate to a subset and relabel the plan control surface without changing HEAD. This directly reopens the prior “caller-selected subset” authority failure.
  - **Fix:** Load the plan from `gitShowHead(GATE_PLAN_REL, cwd)` only; require the working-tree plan blob to equal the HEAD blob and require its own last-touch commit to equal HEAD. Return a fail-closed error if either check fails. Use the single parsed immutable plan object for both expected IDs and exact command binding.

## HIGH Findings

- [ ] **HIGH-1 — “Off-plan script” validation accepts arbitrary scripts under an allowed run directory.**
  - **Evidence:** `rejectOffPlanScripts` extracts only `.gate-evidence/<runId>/` and compares its timestamp-shaped `runId` to a set (`tools/gate/deriveGoalState.ts:430-484`). It never checks that a `repro_cmd` resolves to one of the plan’s exact `literal_cmd` script paths.
  - **Reproduction:** Calling it with `bash .../.gate-evidence/2026-07-21T152805Z/scripts/not-in-gate-plan.sh` returned `null`, although no plan step names that script.
  - **Impact:** FIX-20’s stated “scripts/bundles not referenced by the HEAD-bound plan” guarantee is weaker than claimed; any script beneath the honest run directory is accepted.
  - **Fix:** Parse and canonicalize each plan script path and compare each referenced `repro_cmd`/bundle to the exact allowed plan-owned paths (or an explicit, immutable artifact allow-list). Fail closed for malformed/no-literal-command plans rather than returning `null` at `:452-454`.

## MEDIUM Findings

- [ ] **MEDIUM-1 — Focused live integration suites share destructive global deployment state and are not safe under normal file parallelism.**
  - **Evidence:** Both FIX-17 and FIX-19 call `clearCouchVerdictsPublic`, `clearCouchManifestActivations`, and shared fixture setup/teardown in `beforeAll`/`afterAll` (`REDHAT-FIX-17...test.ts:96-116`; `REDHAT-FIX-19...test.ts:96-121`).
  - **Observed result:** Launching the two focused suites concurrently produced FIX-17 **2/4 pass** and FIX-19 **1/4 pass**: each observed the other suite’s active sample or cleared result. Re-running them serially produced FIX-17 **4/4** and FIX-19 **4/4**.
  - **Fix:** Use isolated Convex deployments/namespaces, or make the project’s integration-test configuration serial. Do not treat parallel execution failures as product-proof until isolation is repaired.

## LOW Findings

- [ ] **LOW-1 — `couchGateStatus` still uses unbounded `.collect()` over append-only verdict history.**
  - **Evidence:** `convex/couchVerdict.ts:295-305` collects and sorts every verdict for a sample.
  - **Impact:** A heavily reviewed sample can grow toward read/transaction limits. This is a pre-existing scalability issue, not evidence that FIX-17 introduced a semantic regression.
  - **Fix:** Add an index/order suitable for bounded newest-row retrieval, while preserving the strict binding and latest-verdict semantics.

## Gate-Plan / Human-Gate Check

- `gate-plan.json` has eight steps and every `literal_cmd` points to `.gate-evidence/2026-07-21T152805Z`; no command references `2026-07-19T22:59:46Z` (`gate-plan.json:7-106`).
- The current human state remains honest: `sprint-goal-state.json` is `GATE-GOAL: BLOCKED`, `met:false`; `gate-results.json` is `blocked`, with `4/8` steps executed. This is the expected unresolved S4-T7 Founder-Operator condition and is not a code defect.

## Verification Evidence

| Command / probe | Result |
|---|---|
| `npx vitest run convex/__tests__/REDHAT-FIX-17-latest-verdict-revokes-pass.integration.test.ts` | **PASS**, 4/4 (serial live Convex) |
| `npx vitest run convex/__tests__/REDHAT-FIX-19-strict-manifest-binding.integration.test.ts` | **PASS**, 4/4 (serial live Convex) |
| `npx vitest run convex/__tests__/REDHAT-FIX-18-canonical-step-completeness.integration.test.ts` | **PASS**, 5/5 |
| `npx vitest run convex/__tests__/REDHAT-FIX-20-gate-plan-honest-rebinding.integration.test.ts` | **PASS**, 6/6 |
| `npx tsc --noEmit -p convex/tsconfig.json` | **PASS** |
| `pnpm exec biome check` on reviewed sources/tests | **PASS**, 8 files checked |
| Dirty-plan bypass probe | **FAILS CLOSED requirement**: mutable one-step plan accepted; stale run accepted; one-step manifest verified |
| Exact-script probe | **FAILS CLOSED requirement**: unlisted script beneath allowed run returned `null` rather than `OFF_PLAN_SCRIPT` |

## Recommendation

Do **not** close the trust-pipeline code gate yet. First make the canonical plan a verified immutable HEAD object and bind every submitted script/bundle to its exact plan entry. Then add regression tests for: (1) dirty plan reducing `1..8` to `1`, (2) dirty plan re-allowing `2026-07-19T22:59:46Z`, (3) an unlisted script within the allowed `2026-07-21T152805Z` directory, and (4) missing/malformed literal commands. Re-run the live suites in a deterministic isolated/serial configuration.
