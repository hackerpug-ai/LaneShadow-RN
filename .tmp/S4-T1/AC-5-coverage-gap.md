# AC-5 — integrity gap: the test verifies a parallel re-implementation, not production

**Status: reported, NOT fixed.** Flagged for `convex-reviewer`. AC-5's test is green
(14/14) but it does not verify the production repair round.

## What AC-5 claims

> VERIFICATION_SERVICE: Convex dev deployment (real `reconstructForRoute` with repair round)

NEGATIVE_CONTROL — the test must fail if:
1. "repair round runs more than 2 attempts"
2. "attempt selection logic is stubbed"
3. "geocode log feedback is not passed to LLM"

## What the test actually exercises

`S4T1-repair-round-bounded.integration.test.ts` calls
`curatedGeometryTestSupport:runSimulatedRepair`, a thin wrapper over
`internal.actions.curatedGeometryReconstruct.reconstructForRouteWithSimulatedRepair`
(`convex/actions/curatedGeometryReconstruct.ts:587`). It **never calls
`reconstructForRoute`** — the production function AC-5 names.

`reconstructForRouteWithSimulatedRepair` contains **its own copy** of the repair-round
logic: it increments `routingInvocationCount` by hand, recomputes the ratio from
injected `firstAttemptRoutedMiles`/`secondAttemptRoutedMiles` args, and re-implements
the `|log(ratio)|` "keep better" comparison. Verified by grep — within its body there
is no reference to `reconstructForRoute`, `runPipelineAttempt`, `extractAnchors`, or
`feedback`. It shares only `determineGateVerdict` and `persistGateResult` with
production. Its polyline is `buildCannedPolyline(...)` and its anchors are
`makeInRegionAnchors(...)`; there is **no LLM call and no geocoding**.

## Consequence

Negative controls (2) and (3) are **not satisfied**:

- (2) The tested selection logic is a duplicate. Deleting or breaking the selection
  logic in production `reconstructForRoute` (lines 396–410) **cannot** fail this test.
- (3) The simulated path has no LLM at all, so the test cannot detect whether geocode
  log feedback reaches the model.

The 2-attempt bound is likewise asserted against a hand-incremented counter in the
test-only action, not against production's control flow.

This also sits against the task's MUST ("reuse … never re-implement per lever") and
`SCOPE.writeProhibited` ("Re-implementing gate logic per lever").

## Important: the production feature is real

This is a **test-coverage** defect, not a fake feature. Production
`reconstructForRoute` (`:327`) implements the real thing:

- bounded to 2 attempts (1 initial + 1 repair) — `if (bestAttempt.gateResult.verdict !== 'pass')`, single `runPipelineAttempt(feedback)`
- builds real `feedback` from the routed-vs-claimed miles and the `geocodeLog`, and
  passes it into `extractAnchors(..., { feedback })` — i.e. a real LLM call
- selects the better attempt by `Math.abs(Math.log(ratio))`

So the code AC-5 describes exists and looks correct; it is simply **unverified**.

## Why it was not fixed here

A faithful test of `reconstructForRoute` needs the LLM/geocode/routing outputs
controlled to force the ratio sequence (0.5 → 0.9); against the live LLM it would be
non-deterministic. That is presumably why the simulation was written.

**Recommended fix (follow-up):** extract the repair-round decision (attempt bound +
`|log(ratio)|` selection) into a pure function in `curatedGeometryGate.ts` and have
**both** `reconstructForRoute` and the simulated action call it. The test then covers
the real, shared selection logic and satisfies negative control (2). Control (3)
additionally needs `reconstructForRoute` to accept injectable geocode/routing/anchor
providers so a seam test can assert `feedback` reaches `extractAnchors`.

This was not attempted in this recovery because it changes production code paths
beyond verifying the preserved work, and the reviewer should decide.

## Secondary: 21 of 61 assertions pass vacuously

With the Convex data path disconnected, 21 of the 61 tests still pass (see
`AC-*-red-against-start.txt`). They are the `MUST_NOT_OBSERVE` assertions —
`expect(verificationData?.verdict).not.toBe('pass')` passes when
`verificationData` is `undefined` — plus six `EVIDENCE:` tests asserting
`expect(true).toBe(true)`.

The 40 `MUST_OBSERVE` assertions **do** discriminate correctly and carry the suite, so
the tier verdict stands. But the `MUST_NOT_OBSERVE` assertions should first assert the
data was actually fetched (e.g. `expect(verificationData).toBeDefined()`), and the
`EVIDENCE` tests should assert the captured artifact contains the seeded value rather
than `true === true`.
