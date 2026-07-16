# S4-T1 — Deterministic geometry gate (VER-01 full: ratio band, anchor/region, degenerate, pre-existing sweep, quarantine ratio-skip) + bounded LLM repair round (VER-02) (UC-VER-01, UC-VER-02)

| Field | Value |
|-------|-------|
| TASK_ID | S4-T1 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 210 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-01, CAP-GEO-02, CAP-GEO-05, CAP-GEO-06 |
| DEPENDS_ON | — |
| BLOCKS | S4-T2, S4-T3, S4-T4, S4-T5, S4-T6 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/<FILE>.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json` (in-scope surface; see DONE WHEN for the repo-wide no-regression clause)
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Every lever calls ONE gate module; pre-existing geometry re-evaluated; repair round bounded to 2 attempts; quarantine rows skip ratio; all stored geometry is gate-passing

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST reuse curatedGeometryGate.ts pure functions - never re-implement per lever
- MUST apply gate to ALL geometry (new and pre-existing)
- MUST limit reconstruction attempts to 2 per route (repair round budget)
- MUST skip the ratio check ONLY when the quarantine flag is set — the real computed ratio MUST still be recorded on the verdict (never nulled) so the skip is observable

**NEVER**
- NEVER store geometry that fails the gate
- NEVER exceed 2 reconstruction attempts per route
- NEVER bypass anchor/region checks for reconstructed routes
- NEVER allow a not_a_ride verdict to reach rider-ready surface
- NEVER let the couch gate pass without a recorded verdict
- NEVER let quarantine short-circuit the degenerate or anchor/region checks
- NEVER conflate `ratio==null` (unknown claimed length) with quarantine — distinct code paths, each needs its own verdict evidence

**STRICTLY**
- STRICTLY enforce ratio band 0.6–1.6 for non-quarantined routes
- STRICTLY require ≥2 anchors within 150mi of centroid
- STRICTLY reject degenerate geometry (≤4 points OR <1 pt/mi)
- STRICTLY quarantine flag → ratio skipped (routed length becomes truth)
- STRICTLY repair round budget = 2 attempts total per route

## DONE WHEN

- AC-1 [Gate enforces ratio band 0.6–1.6 for non-quarantined routes] [PRIMARY]: Verdict is 'review' with failedCondition='ratio' because 0.75 < 0.6
- AC-2 [Gate requires ≥2 anchors within 150mi of centroid]: Verdict is 'review' with failedCondition='anchors' because anchorCount < 2
- AC-3 [Gate rejects degenerate geometry (≤4 points OR <1 pt/mi)]: Verdict is 'review' with failedCondition='degenerate' because pointCount ≤ 4
- AC-4 [Quarantine flag skips ratio check but applies degenerate + region checks]: A quarantined route and its unquarantined twin — same real ratio 0.22 — split: 'pass' with `ratio=0.22` + `ratioSkipped=true` vs 'review' with failedCondition='ratio'; a quarantined 3-point route still returns 'review'/'degenerate'
- AC-5 [Bounded repair round limits attempts to 2 and keeps better attempt by ratio distance]: driven through production `reconstructForRoute` against a cassette recorded from the real Google Routes API — the repair attempt is stored because |log(repair ratio)| < |log(first ratio)|, asserted against the cassette's **recorded** values (never ratio literals), with the 2-attempt budget capped and every routing increment originating at the real client boundary `routeWithInvocationCount`
- AC-6 [Pre-existing geometry rows are re-evaluated against the full gate]: Rows failing the enhanced gate are flipped to verdict='review'
- Every behavioral AC scenario passes `validate_scenario` (exit 0 — run the extract-and-pipe command in VERIFICATION GATES); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors (the in-scope surface) + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports **zero new errors vs. a baseline captured at task start** (capture with `pnpm type-check 2>&1 | grep -c 'error TS'` before the first edit; compare at the end). Repo-wide `pnpm type-check` exit 0 is **NOT** an S4-T1 deliverable — `package.json`'s `type-check` runs two passes (`tsc -p convex/tsconfig.json && tsc -p tsconfig.json`). The **convex** pass is clean (measured: exit 0, 0 errors). The **root** pass (measured: exit 2, 10 errors) carries 10 pre-existing errors in **`convex/actions/agent/**`** — `spike/rideAgentSpike.ts` (8 × TS2345), `lib/zaiProvider.ts` (1 × TS2339), `spike/spikeTools.ts` (1 × TS2322). **None are React Native**; all 10 are Convex agent code that sits **outside S4-T1's `SCOPE.writeAllowed`**, so they are unsatisfiable from this task's scope. They surface only because the **root** tsconfig applies **non-strict** options to the same `convex/` tree: without `strictNullChecks`, zod's `requiredKeys<T>` (`{[k in keyof T]: undefined extends T[k] ? never : k}`, `zod/v3/helpers/util.d.ts:34`) collapses to `never` for every key — hence "Argument of type `'sessionId'` is not assignable to parameter of type `never`". The root config **excludes** `convex/actions/**`, but `exclude` cannot drop files pulled in transitively: `convex/_generated/api.d.ts` (lines 32/46/49) imports all three offending modules.
- This debt is **owned and discharged**, not unowned: prerequisite **TYPEFIX-001** (real, user-approved; branch `task/TYPEFIX-001` @ `0f79ce63`) sets `"strict": true` at the root tsconfig (`tsconfig.json:7`) — **measured** to take `pnpm type-check` from 10 errors to **exit 0, 0 errors**. Enabling strict *clears* these 10 (it restores zod's conditional types); it does not add any. **Separately**, TYPEFIX-001 repairs the ~26 latent **RN** null-safety bugs that enabling strict newly reveals — that is TYPEFIX-001's own additional work and must **not** be conflated with these 10 errors.
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Harden curatedGeometryGate.ts to full VER-01 deterministic gate (ratio, anchors, degeneracy, pre-existing sweep, quarantine ratio-skip) and implement VER-02 bounded repair round (max 2 attempts, keep better by ratio distance)

**Success state:** Every lever calls ONE gate module; pre-existing geometry re-evaluated; repair round bounded to 2 attempts; quarantine rows skip ratio; all stored geometry is gate-passing

**Required API seam (AC-4 — the quarantine skip must be OBSERVABLE):**

```
determineGateVerdict({ ratio, pointCount, routedMiles, anchorCount, quarantine })
  → { verdict, failedCondition?, ratio: number | null, ratioSkipped: boolean }
```

The current return type carries only `{ verdict, failedCondition? }`. Because `evaluateRatioBoundary(null)` early-returns `{passes:true, ratio:null}`, a test that seeds a null claimed length gets `verdict='pass'` from the **null path**, not the quarantine branch — the two are indistinguishable from outside, and deleting the quarantine branch leaves such a test green (independently proven). Recording the **real computed `ratio`** plus a `ratioSkipped` boolean on the verdict is what makes the skip falsifiable: `verdict=='pass'` co-occurring with an out-of-band `ratio==0.22` is reachable ONLY through the quarantine branch. `reevaluateExistingGeometry` (AC-6) returns the same shape.

## FIXTURES (shared seed data — referenced by scenario `start_ref`; seeded via `curatedGeometryTestSupport`)

- `ratio-boundary-passing` (seed_method: `public_api`): Route with claimedMiles=41, routedMiles=41 (ratio=1.0, in band)
    - routeId: 'test:ratio-100', name: 'Ratio 1.00', lengthMiles: 41, compositeScore: 0.85
- `ratio-boundary-failing-low` (seed_method: `public_api`): Route with claimedMiles=100, routedMiles=59 (ratio=0.59, below 0.6)
    - routeId: 'test:ratio-059', name: 'Ratio 0.59', lengthMiles: 100, compositeScore: 0.85
- `ratio-boundary-failing-high` (seed_method: `public_api`): Route with claimedMiles=100, routedMiles=161 (ratio=1.61, above 1.6)
    - routeId: 'test:ratio-161', name: 'Ratio 1.61', lengthMiles: 100, compositeScore: 0.85
- `anchors-sufficient-in-region` (seed_method: `public_api`): Route with 2 anchors within 150mi of centroid (34.95, -120.42)
    - routeId: 'test:anchors-sufficient', name: 'Sufficient Anchors', lengthMiles: 41, centroidLat: 34.95, centroidLng: -120.42, compositeScore: 0.85
- `anchors-insufficient-count` (seed_method: `public_api`): Route with only 1 anchor (fails anchor count check)
    - routeId: 'test:single-anchor', name: 'Single anchor', lengthMiles: 41, compositeScore: 0.85
- `degenerate-low-point-count` (seed_method: `public_api`): Route with 3 points (fails <=4 point degenerate check)
    - routeId: 'test:degenerate-2pt', name: 'Degenerate 2pt', lengthMiles: 40, compositeScore: 0.85
- `degenerate-low-density` (seed_method: `public_api`): Route with 10 points but 50mi (fails <1 pt/mi check)
    - routeId: 'test:degenerate-10pt-50mi', name: 'Degenerate 10pt/50mi', lengthMiles: 50, compositeScore: 0.85
- `anchors-off-region-rejected` (seed_method: `public_api`): Route whose anchors straddle the 150mi region boundary around centroid (34.95, -120.42) — seeded by the EXISTING `seedAnchorTestRoutes` mutation
    - routeId: 'test:mixed-anchors', name: 'Mixed anchors', lengthMiles: 41, centroidLat: 34.95, centroidLng: -120.42, compositeScore: 0.85
- `non-degenerate-valid` (seed_method: `public_api`): Healthy route — 50 points over 41mi (passes both degenerate checks) — seeded by the EXISTING `seedPoCRoute` mutation
    - routeId: 'motorcycleroads:twist-of-tepusquet-loop', name: 'Twist of Tepusquet Loop', lengthMiles: 41, pointCount: 50, compositeScore: 0.85
- `quarantined-row-out-of-band-ratio` (seed_method: `public_api`): Quarantined route with a REAL out-of-band ratio 0.22 (claimed 100mi, routed 22mi) — the ratio is computed and non-null; quarantine is what skips the band check
    - routeId: 'test:quarantined-ratio-022', name: 'Quarantined ratio 0.22', lengthMiles: 100, quarantine: {reason: 'length_outlier', flaggedAt: DATE_NOW}, compositeScore: 0.85 — new seeder `seedQuarantinedOutOfBandRatioRow`
- `unquarantined-row-out-of-band-ratio` (seed_method: `public_api`): Discriminating twin — IDENTICAL geometry and claimed length to `quarantined-row-out-of-band-ratio` (real ratio 0.22) but with NO quarantine flag
    - routeId: 'test:unquarantined-ratio-022', name: 'Unquarantined ratio 0.22', lengthMiles: 100, quarantine: undefined, compositeScore: 0.85 — new seeder `seedUnquarantinedOutOfBandRatioRow`
- `quarantined-row-degenerate-geometry` (seed_method: `public_api`): Quarantined route with 3-point geometry — proves quarantine does NOT bypass the degenerate check
    - routeId: 'test:quarantined-degenerate-3pt', name: 'Quarantined degenerate 3pt', lengthMiles: 100, pointCount: 3, quarantine: {reason: 'length_outlier', flaggedAt: DATE_NOW}, compositeScore: 0.85 — new seeder `seedQuarantinedDegenerateRow`
> **Recording honesty (AC-5).** The two repair-round fixtures below are `recorded_external`: their routed lengths are **whatever the real provider returned**, captured once and committed. The contract does **not** prescribe them — a genuine Google Routes response is a value like `51.38`, never a designed `50.0000`. Round decimals in a file labelled "cassette" would be a mock in disguise, so every AC-5 assertion is expressed as a **property of the recording** (band membership, `|log(ratio)|` ordering, equality with the cassette's own value) and **never as a literal**. The route for each fixture is **selected because its real behaviour exhibits the property**; the property is not dictated onto the recording. If no recording of a candidate route exhibits it, **the fixture does not exist** and the case must be re-derived from a recording that does — it must never be hand-authored to fit.

- `repair-round-two-attempts-better-second` (seed_method: `recorded_external`): Route driving a real 2-attempt repair round through production `reconstructForRoute`, selected because its **real** first attempt lands **outside** the 0.6–1.6 band and its **real** repair attempt lands **inside** it
    - routeId: 'test:repair-round', name: 'Repair Round Test', lengthMiles: 100 — seeded by the **EXISTING** `seedRepairRoundRoute` mutation (`convex/curatedGeometryTestSupport.ts:1319`). **No new seeder** — round 1 wrongly described this as new and invented routeId 'test:repair-round-better-second'.
    - cassette: `convex/__tests__/fixtures/S4T1-repair-round-better-second.cassette.json` — recorded ONCE from the **Google Routes API v2** (`https://routes.googleapis.com/directions/v2:computeRoutes`) and the **Google Geocoding API** (`https://maps.googleapis.com/maps/api/geocode/json`) reached via `defaultRoute` (`convex/actions/curatedGeometryReconstruct.ts:173`, fetch at :192 / :159)
    - recording procedure: with a live `GOOGLE_MAPS_API_KEY`, run `reconstructForRoute` once for this route with cassette recording enabled; `routeWithInvocationCount` (`:78-83`) persists each request/response pair **in call order** with the provider's verbatim body (routed distance + encoded polyline). Commit the cassette. Replay is byte-exact and offline; re-recording requires deleting the file, never editing it.
- `repair-round-exhausted-to-review` (seed_method: `recorded_external`): Route selected because **BOTH** of its real attempts land outside the band, exhausting the 2-attempt budget to verdict='review'
    - routeId: 'test:repair-exhausted', name: 'Repair Exhausted Test', lengthMiles: 100 — seeded by the **EXISTING** `seedRepairExhaustedRoute` mutation (`convex/curatedGeometryTestSupport.ts:1335`), which round 1's contract ignored entirely. **No new seeder.**
    - cassette: `convex/__tests__/fixtures/S4T1-repair-round-exhausted.cassette.json` — same provider, same recording procedure as above
- `preexisting-row-needs-region-check` (seed_method: `public_api`): Legacy geometry row with verification.verdict='pass' but off-region anchors
    - curatedRouteGeometry doc with routeId, verification.verdict='pass', anchors ~211mi from centroid (beyond the 150mi region bound)

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Gate enforces ratio band 0.6–1.6 for non-quarantined routes

**Requirement:** GIVEN A route with claimedMiles=100, routedMiles=75, and no quarantine flag WHEN The gate evaluates the ratio routedMiles/claimedMiles THEN Verdict is 'review' with failedCondition='ratio' because 0.75 < 0.6

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts module)
- FLOW_REF: UC-VER-01
- VERIFY: `npx vitest run convex/__tests__/S4T1-gate-ratio-band.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: evaluateRatioBoundary returns passes=true for all values; ratio check is bypassed or mocked; gate always returns verdict='pass'
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `ratio-boundary-passing`
    - ACTION (api_client): Call evaluateRatioBoundary({ratio: 1.0}); Verify returns {passes:true, ratio:1.0}
    - MUST_OBSERVE: passes == true, ratio == 1.0
    - MUST_NOT_OBSERVE: passes == false, failedCondition == 'ratio', ratio == null or the ratio field is empty — the seeded input was never echoed back through the real boundary check
- CASE 2 — start_ref `ratio-boundary-failing-low`
    - ACTION (api_client): Call evaluateRatioBoundary({ratio: 0.59}); Verify returns {passes:false, ratio:0.59, failedCondition:'ratio'}
    - MUST_OBSERVE: passes == false, failedCondition == 'ratio', ratio == 0.59
    - MUST_NOT_OBSERVE: passes == true, ratio == null or empty — evaluateRatioBoundary returned no computed ratio alongside the failure
- CASE 3 — start_ref `ratio-boundary-failing-high`
    - ACTION (api_client): Call evaluateRatioBoundary({ratio: 1.61}); Verify returns {passes:false, failedCondition:'ratio'}
    - MUST_OBSERVE: passes == false, failedCondition == 'ratio', ratio == 1.61
    - MUST_NOT_OBSERVE: passes == true, failedCondition is empty or absent — the specific band failure was not recorded

### AC-2 — Gate requires ≥2 anchors within 150mi of centroid

**Requirement:** GIVEN A reconstruction with 1 geocoded anchor within 150mi and 2 off-region WHEN The gate evaluates anchor count and region compliance THEN Verdict is 'review' with failedCondition='anchors' because anchorCount < 2

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts + isAnchorInRegion)
- FLOW_REF: UC-VER-01
- VERIFY: `npx vitest run convex/__tests__/S4T1-gate-anchors-region.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: isAnchorInRegion always returns true; anchor count check is skipped; region check is mocked out
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `anchors-sufficient-in-region`
    - ACTION (api_client): Call determineGateVerdict({anchorCount:2, pointCount:50, routedMiles:41, ratio:1.0}); Verify returns {verdict:'pass', ratio:1.0}
    - MUST_OBSERVE: verdict == 'pass', ratio == 1.0 (the seeded in-band ratio is echoed back on the verdict — pins `ratio` provenance so a stub hardcoding `ratio: 0.22` for AC-4 cannot also satisfy this case)
    - MUST_NOT_OBSERVE: failedCondition == 'anchors', verdict is empty or absent — the gate returned no verdict at all, ratio == 0.22 or any value other than the seeded 1.0 — the verdict carries a hardcoded ratio rather than the computed one
- CASE 2 — start_ref `anchors-insufficient-count`
    - ACTION (api_client): Call determineGateVerdict({anchorCount:1, pointCount:50, routedMiles:41, ratio:1.0}); Verify returns {verdict:'review', failedCondition:'anchors'}
    - MUST_OBSERVE: verdict == 'review', failedCondition == 'anchors'
    - MUST_NOT_OBSERVE: verdict == 'pass', failedCondition is empty or absent while verdict == 'review' — the specific failure reason was not recorded
- CASE 3 — start_ref `anchors-off-region-rejected`
    - ACTION (api_client): Seed route with centroid (34.95, -120.42) via `seedAnchorTestRoutes`; Call isAnchorInRegion({lat:38.0, lng:-120.42}, centroid) — a real haversine distance of 211mi (3.05° of latitude × 3958.8mi radius), beyond the 150mi bound; Verify returns false
    - MUST_OBSERVE: isAnchorInRegion == false, haversineDistance({lat:38.0, lng:-120.42}, centroid) rounds to 211 (mi)
    - MUST_NOT_OBSERVE: isAnchorInRegion == true, haversineDistance == 0 (centroid never read — a hardcoded/placeholder region check)

### AC-3 — Gate rejects degenerate geometry (≤4 points OR <1 pt/mi)

**Requirement:** GIVEN A routed polyline with 3 points and routedMiles=10 WHEN The gate evaluates point count and density THEN Verdict is 'review' with failedCondition='degenerate' because pointCount ≤ 4

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real isDegenerate + determineGateVerdict)
- FLOW_REF: UC-VER-01
- VERIFY: `npx vitest run convex/__tests__/S4T1-gate-degenerate.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: isDegenerate always returns false; point count check is skipped; density check is bypassed; isDegenerate is a stub that returns a hardcoded constant regardless of pointCount
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `degenerate-low-point-count`
    - ACTION (api_client): Call isDegenerate({pointCount:3, routedMiles:10}); Verify returns true
    - MUST_OBSERVE: isDegenerate == true
    - MUST_NOT_OBSERVE: isDegenerate == false, isDegenerate returns undefined or empty — the point-count check never executed
- CASE 2 — start_ref `degenerate-low-density`
    - ACTION (api_client): Call isDegenerate({pointCount:5, routedMiles:10}); Verify returns true (5 pts < 10 mi)
    - MUST_OBSERVE: isDegenerate == true
    - MUST_NOT_OBSERVE: isDegenerate == false, pointCount read as 0 or a default instead of the seeded 5 — the density comparison ran on empty input
- CASE 3 — start_ref `non-degenerate-valid`
    - ACTION (api_client): Call isDegenerate({pointCount:50, routedMiles:41}); Verify returns false
    - MUST_OBSERVE: isDegenerate == false
    - MUST_NOT_OBSERVE: isDegenerate == true, pointCount or routedMiles read as 0 / empty instead of the seeded 50 and 41

### AC-4 — Quarantine flag skips ratio check but applies degenerate + region checks

**Requirement:** GIVEN two routes with **identical** routed geometry (routedMiles=22, pointCount=50, anchorCount=2 in-region) and **identical** claimed length (claimedMiles=100 → **real ratio 0.22**, far outside the 0.6–1.6 band) — one carrying `quarantine.reason='length_outlier'`, one with **no quarantine flag** — WHEN the gate evaluates both with the **same real ratio 0.22 (never null)** THEN the quarantined route returns `verdict='pass'` with the out-of-band `ratio=0.22` **still recorded** and `ratioSkipped=true`, while the unquarantined twin returns `verdict='review'` with `failedCondition='ratio'` — a pair satisfiable **only** by a live quarantine branch, since deleting it collapses both twins to `'review'`.

> **Why this shape:** the previous contract required `ratio == null`, which routed the `pass` verdict through `evaluateRatioBoundary`'s null early-return (`{passes:true, ratio:null}`) rather than the quarantine branch — the test echoed its own input, and deleting the quarantine branch entirely left 6/6 tests green. The load-bearing property now is that **`verdict=='pass'` AND `ratio==0.22` co-occurring is impossible without the quarantine branch.** Case C additionally proves the "*but applies degenerate + region checks*" half of the AC title, which no prior case covered.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts + quarantine flag)
- FLOW_REF: UC-VER-01
- VERIFY: `npx vitest run convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the quarantine branch is **deleted** from `determineGateVerdict` (both twins collapse to verdict='review'); quarantine is implemented as an unconditional early `return {verdict:'pass'}` **stub** that bypasses the degenerate + anchor checks (Case C would wrongly pass); the test seeds a null/**empty** claimed length so ratio==null and the pass verdict comes from the `evaluateRatioBoundary` null early-return instead of the quarantine branch; the quarantine flag is **hardcod**ed true for all routes (the unquarantined twin would wrongly pass)
- EVIDENCE: `db_query` (required_capture: true)
- CASE A — start_ref `quarantined-row-out-of-band-ratio`
    - ACTION (api_client): Seed quarantined route (lengthMiles=100, quarantine.reason='length_outlier'); Call determineGateVerdict({ratio:0.22, pointCount:50, routedMiles:22, anchorCount:2, quarantine:true}); Verify returns {verdict:'pass', ratio:0.22, ratioSkipped:true}
    - MUST_OBSERVE: verdict == 'pass', ratio == 0.22, ratioSkipped == true
    - MUST_NOT_OBSERVE: verdict == 'review', failedCondition == 'ratio', ratioSkipped == false, ratio == null or the ratio field is empty — proves the null early-return fired, not the quarantine branch
- CASE B — start_ref `unquarantined-row-out-of-band-ratio`
    - ACTION (api_client): Seed the identical twin WITHOUT a quarantine flag (lengthMiles=100, quarantine undefined); Call determineGateVerdict({ratio:0.22, pointCount:50, routedMiles:22, anchorCount:2, quarantine:false}); Verify returns {verdict:'review', failedCondition:'ratio'}
    - MUST_OBSERVE: verdict == 'review', failedCondition == 'ratio', ratio == 0.22, ratioSkipped == false
    - MUST_NOT_OBSERVE: verdict == 'pass', ratioSkipped == true, ratio == null or empty — the unquarantined twin must carry the same real computed 0.22 as Case A
- CASE C — start_ref `quarantined-row-degenerate-geometry`
    - ACTION (api_client): Seed quarantined route with 3-point geometry (lengthMiles=100, quarantine.reason='length_outlier'); Call determineGateVerdict({ratio:0.22, pointCount:3, routedMiles:22, anchorCount:2, quarantine:true}); Verify quarantine does NOT bypass the degenerate check
    - MUST_OBSERVE: verdict == 'review', failedCondition == 'degenerate'
    - MUST_NOT_OBSERVE: verdict == 'pass', failedCondition == 'ratio', failedCondition is empty or absent — the degenerate reason must be recorded even under quarantine

### AC-5 — Bounded repair round limits attempts to 2 and keeps better attempt by ratio distance

**Requirement:** GIVEN a reconstruction whose **recorded** first attempt ratio falls **outside** the 0.6–1.6 band and whose **recorded** repair attempt falls **inside** it (illustratively 0.5 then 0.9 — but the binding values are whatever the Google Routes recording returned, never literals in the test) WHEN the repair round runs with geocode-log feedback and selects the better attempt by ratio distance THEN the repair attempt is stored because |log(repair)| < |log(first)|, and the routing budget is capped at 2

> **Why this shape:** round 1 declared this fixture `recorded_external` while prescribing the cassette's contents in advance (50/90/40/45 against a claimed 100 → ratios of exactly 0.50/0.90/0.40/0.45). You cannot specify what a real recording returns; designed values wearing a cassette label are the dishonesty this repair exists to kill. Two further holes are closed here: (1) `routingCallCount` is **hand-incremented** in the current simulation (`curatedGeometryReconstruct.ts:622,643`) without any provider call, so `routingCallCount == 2` was satisfiable by a stub doing `+= 1` twice — the count is now trustworthy **only** if every increment originates inside `routeWithInvocationCount` (`:78-83`), the sole wrapper that delegates to `defaultRoute` → Google Routes; (2) the prose "routing calls originate from production `reconstructForRoute`" was unverifiable by the declared evidence type — it is replaced by a **db-observable** barrier: the stored `encodedPolyline` must equal the polyline carried in the cassette's recorded provider response, which locally-fabricated `buildCannedPolyline` geometry cannot match.

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Google Routes API v2 (`routes.googleapis.com/directions/v2:computeRoutes`) + Google Geocoding API, recorded once and replayed byte-exact; production `reconstructForRoute` on the Convex dev deployment
- FLOW_REF: UC-VER-02
- VERIFY: `npx vitest run convex/__tests__/S4T1-repair-round-bounded.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: repair round runs more than 2 attempts; attempt selection logic is stubbed; geocode log feedback is not passed to LLM; `routingInvocationCount` is hand-incremented outside `routeWithInvocationCount` (the `:622`/`:643` simulation pattern) so the count reaches 2 with zero provider traffic; the stored polyline is `buildCannedPolyline` output rather than the recorded provider geometry; the cassette is hand-authored with designed round values instead of recorded from Google Routes; the test asserts ratio literals instead of comparing against the cassette's own recorded values
- EVIDENCE: `api_response` (required_capture: true) — the recorded Google Routes request/response pairs **in call order**, plus `reconstructForRoute`'s own returned `{routingCallCount, ratio, routedMiles}`
- CASE 1 — start_ref `repair-round-two-attempts-better-second`
    - ACTION (api_client): Seed via the EXISTING `seedRepairRoundRoute` (routeId `test:repair-round`, claimed 100mi); Call production `reconstructForRoute` with the cassette replaying the recorded Google Routes exchanges; Verify the repair round re-prompts with geocode-log feedback after attempt#1 fails the band; Verify the better attempt is stored by |log(ratio)|
    - MUST_OBSERVE: routingCallCount == 2 AND every increment originated inside `routeWithInvocationCount` (`curatedGeometryReconstruct.ts:78-83`) — the only path to `defaultRoute` → Google Routes; recorded attempt#1 ratio < 0.6 (outside band, as recorded); recorded attempt#2 ratio within 0.6–1.6 (as recorded); |log(attempt#2 ratio)| < |log(attempt#1 ratio)|; stored ratio == the cassette's recorded attempt#2 ratio (read from the cassette, not a literal); stored encodedPolyline == the polyline in the cassette's recorded attempt#2 response
    - MUST_NOT_OBSERVE: routingCallCount > 2, stored ratio == the recorded attempt#1 ratio, routingCallCount == 0, `routingInvocationCount` incremented anywhere other than `routeWithInvocationCount` — a hand-incremented counter satisfies a bare count assertion while no provider call happened, stored encodedPolyline == `buildCannedPolyline(...)` output — geometry fabricated locally instead of replayed from the recorded response
- CASE 2 — start_ref `repair-round-exhausted-to-review`
    - ACTION (api_client): Seed via the EXISTING `seedRepairExhaustedRoute` (routeId `test:repair-exhausted`, claimed 100mi) — a route selected because BOTH real attempts fall outside the band; Call production `reconstructForRoute` against its cassette; Verify the 2-attempt budget is exhausted and the final verdict is 'review'
    - MUST_OBSERVE: routingCallCount == 2 AND every increment originated inside `routeWithInvocationCount`; both recorded attempt ratios outside 0.6–1.6 (as recorded); verdict == 'review'; failedCondition == "ratio" (specific failure recorded)
    - MUST_NOT_OBSERVE: routingCallCount > 2, verdict == 'pass', routingCallCount == 0, a third recorded provider exchange is replayed — the budget was exceeded, `routingInvocationCount` incremented outside `routeWithInvocationCount`

### AC-6 — Pre-existing geometry rows are re-evaluated against the full gate

**Requirement:** GIVEN A curated_route_geometry row with verification from before gate hardening (missing region check) WHEN A re-evaluation sweep runs over pre-existing geometry THEN Rows failing the enhanced gate are flipped to verdict='review'

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real pre-existing sweep over curated_route_geometry)
- FLOW_REF: UC-VER-01
- VERIFY: `npx vitest run convex/__tests__/S4T1-preexisting-sweep.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: sweep only processes new geometry; pre-existing verification objects are skipped; gate is bypassed for legacy rows; the sweep is a no-op that leaves pre-existing verification objects unchanged
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `preexisting-row-needs-region-check`
    - ACTION (api_client): Insert geometry row with verification.verdict='pass' but anchors ~211mi from centroid; Run pre-existing sweep; Query verification - should be flipped to 'review'
    - MUST_OBSERVE: verification.verdict == 'review', verification.failedCondition == 'anchors'
    - MUST_NOT_OBSERVE: verification.verdict == 'pass', verification.failedCondition is empty or absent — the sweep flipped the verdict with no recorded reason

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | evaluateRatioBoundary passes for ratio 0.6–1.6 | AC-1 | `npx vitest run convex/__tests__/S4T1-gate-ratio-band.integration.test.ts -t 'TC-1'` |
| TC-2 | evaluateRatioBoundary fails for ratio below 0.6 | AC-1 | `npx vitest run convex/__tests__/S4T1-gate-ratio-band.integration.test.ts -t 'TC-2'` |
| TC-3 | evaluateRatioBoundary fails for ratio above 1.6 | AC-1 | `npx vitest run convex/__tests__/S4T1-gate-ratio-band.integration.test.ts -t 'TC-3'` |
| TC-4 | determineGateVerdict requires at least 2 anchors | AC-2 | `npx vitest run convex/__tests__/S4T1-gate-anchors-region.integration.test.ts -t 'TC-4'` |
| TC-5 | isAnchorInRegion rejects points beyond 150mi (211mi anchor → false) | AC-2 | `npx vitest run convex/__tests__/S4T1-gate-anchors-region.integration.test.ts -t 'TC-5'` |
| TC-6 | isDegenerate returns true for pointCount <= 4 | AC-3 | `npx vitest run convex/__tests__/S4T1-gate-degenerate.integration.test.ts -t 'TC-6'` |
| TC-7 | isDegenerate returns true for pointCount < routedMiles | AC-3 | `npx vitest run convex/__tests__/S4T1-gate-degenerate.integration.test.ts -t 'TC-7'` |
| TC-8 | Quarantined route with out-of-band ratio 0.22 returns verdict='pass' with ratio=0.22 recorded and ratioSkipped=true | AC-4 | `npx vitest run convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts -t 'TC-8'` |
| TC-9 | Repair round limits to 2 attempts total | AC-5 | `npx vitest run convex/__tests__/S4T1-repair-round-bounded.integration.test.ts -t 'TC-9'` |
| TC-10 | Repair round keeps better attempt by ratio distance | AC-5 | `npx vitest run convex/__tests__/S4T1-repair-round-bounded.integration.test.ts -t 'TC-10'` |
| TC-11 | Unquarantined twin with the IDENTICAL real ratio 0.22 returns verdict='review' with failedCondition='ratio' (the discriminator: deleting the quarantine branch collapses TC-8 onto this) | AC-4 | `npx vitest run convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts -t 'TC-11'` |
| TC-12 | Quarantined route with 3-point geometry still returns verdict='review' with failedCondition='degenerate' (quarantine does not bypass degenerate/region checks) | AC-4 | `npx vitest run convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts -t 'TC-12'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/curatedGeometryGate.ts (MODIFY) - add anchor count check, region check, pre-existing sweep, quarantine ratio-skip
- convex/actions/curatedGeometryReconstruct.ts (MODIFY) - repair round logic, 2-attempt budget
- convex/curatedGeometry.ts (MODIFY) - recomputeRiderReady integration
- convex/__tests__/S4T1-*.integration.test.ts (NEW) - gate + repair round integration tests
- convex/curatedGeometryTestSupport.ts (MODIFY) - extend seed helpers for gate boundary cases. AC-5 REUSES the existing `seedRepairRoundRoute` (:1319) and `seedRepairExhaustedRoute` (:1335) — do not add repair-round seeders.
- convex/__tests__/fixtures/S4T1-repair-round-better-second.cassette.json (NEW) - AC-5 Case 1 cassette: Google Routes API v2 + Geocoding request/response pairs in call order, recorded ONCE from the live provider. Values are the provider's, never authored.
- convex/__tests__/fixtures/S4T1-repair-round-exhausted.cassette.json (NEW) - AC-5 Case 2 cassette: same provider and procedure, for the both-attempts-fail route.

**writeProhibited:**
- convex/schema.ts internals - only additive deltas for new fields
- curated_route_geometry side table DELETE operations - use patch/replace only
- Re-implementing gate logic per lever - must reuse curatedGeometryGate.ts
- Bypassing ratio check without quarantine flag - quarantine is the ONLY skip condition
- Exceeding 2 reconstruction attempts - repair budget is enforced at orchestrator level
- Hand-authoring or editing an AC-5 cassette - every value must come from a real recorded Google Routes response; re-record by deleting the file and re-running against the live provider, NEVER by editing values into it
- Incrementing `routingInvocationCount` outside `routeWithInvocationCount` (`curatedGeometryReconstruct.ts:78-83`) - the count is trustworthy only at the real client boundary; the simulation hand-increments at :622/:643 must be deleted, not preserved
- Asserting AC-5 ratio literals - compare against the cassette's recorded values; a literal reintroduces the designed-value fiction this contract exists to remove

## READING LIST

- `convex/curatedGeometryGate.ts` (1-144) — Pure gate functions: evaluateRatioBoundary (5-20, note the `null` early-return at 10-12 that made AC-4 tautological), isDegenerate (22-26), isAnchorInRegion (66-71), determineGateVerdict (73-102, `quarantine?` param at 78 / branch at 92-94 — the return type must gain `ratio` + `ratioSkipped`), reevaluateExistingGeometry (112-144)
- `convex/actions/curatedGeometryReconstruct.ts` (340-420) — Repair round logic in reconstructForRoute
- `convex/actions/curatedGeometryReconstruct.ts` (78-83) — `routeWithInvocationCount`: the ONLY real routing-client boundary. It increments `routingInvocationCount` (:81) and delegates to `defaultRoute` (:173), which calls the **Google Routes API v2** (`https://routes.googleapis.com/directions/v2:computeRoutes`, fetch at :192). Geocoding is the **Google Geocoding API** (`https://maps.googleapis.com/maps/api/geocode/json`, :151/:159). AC-5 requires every routing increment to originate here.
- `convex/actions/curatedGeometryReconstruct.ts` (615-660) — the CURRENT simulated repair round: `SimAttempt` + `buildCannedPolyline` with **hand-incremented** `routingInvocationCount` at :622 and :643 that never calls a router. This is the fake AC-5 must replace — a bare `routingCallCount == 2` assertion passes against it with zero provider traffic.
- `convex/curatedGeometryTestSupport.ts` (1319, 1335) — the **EXISTING** repair-round seeders: `seedRepairRoundRoute` (:1319, seeds routeId `test:repair-round`) and `seedRepairExhaustedRoute` (:1335, seeds routeId `test:repair-exhausted`). AC-5 REUSES both — do not author new seeders.
- `convex/curatedGeometryHygiene.ts` (520-602) — Quarantine flag structure and fixLengthOutliers pattern
- `convex/schema.ts` (216-218) — curatedRouteGeometry side table schema
- `brain/docs/TESTING-HIERARCHY.md` (11-23) — Integration test tier is PRIMARY for Convex backend

## CODE PATTERN

- Pattern: Pure function gate with structured verdict return
- Pattern source: `convex/curatedGeometryGate.ts:73-102`
- Anti-pattern: Per-lever gate implementations, ratio skip without quarantine, unbounded repair loops, a verdict that drops the computed `ratio` (makes the quarantine skip unobservable and the AC untestable)

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/S4T1-*.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → **no greater than the baseline captured at task start** (the root pass carries 10 pre-existing errors in `convex/actions/agent/**` — `rideAgentSpike.ts` ×8, `zaiProvider.ts` ×1, `spikeTools.ts` ×1 — Convex code outside this task's `SCOPE.writeAllowed`, surfaced by the root tsconfig's non-strict options collapsing zod's conditional types to `never`; owned and discharged by TYPEFIX-001 @ `0f79ce63`, which sets root `strict: true` and is measured to take `pnpm type-check` to exit 0. Repo-wide exit 0 is not an S4-T1 deliverable)
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH violations. The contract lives **embedded in this .md file**, not at a `.json` path, and the validator reads stdin when given no argv — so extract and pipe (verified working):

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/S4-T1-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation - hardens curatedGeometryGate.ts module, adds repair round logic, integrates with existing verification pipeline
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green (TDD_STATE history).
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment.
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").

## DEPENDENCIES

- Depends on: —
- Blocks: S4-T2, S4-T3, S4-T4, S4-T5, S4-T6

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S4-T1",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "ratio-boundary-passing": {
      "description": "Route with claimedMiles=41, routedMiles=41 (ratio=1.0, in band)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:ratio-100', name: 'Ratio 1.00', lengthMiles: 41, compositeScore: 0.85"
      ]
    },
    "ratio-boundary-failing-low": {
      "description": "Route with claimedMiles=100, routedMiles=59 (ratio=0.59, below 0.6)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:ratio-059', name: 'Ratio 0.59', lengthMiles: 100, compositeScore: 0.85"
      ]
    },
    "ratio-boundary-failing-high": {
      "description": "Route with claimedMiles=100, routedMiles=161 (ratio=1.61, above 1.6)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:ratio-161', name: 'Ratio 1.61', lengthMiles: 100, compositeScore: 0.85"
      ]
    },
    "anchors-sufficient-in-region": {
      "description": "Route with 2 anchors within 150mi of centroid (34.95, -120.42)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:anchors-sufficient', name: 'Sufficient Anchors', lengthMiles: 41, centroidLat: 34.95, centroidLng: -120.42, compositeScore: 0.85"
      ]
    },
    "anchors-insufficient-count": {
      "description": "Route with only 1 anchor (fails anchor count check)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:single-anchor', name: 'Single anchor', lengthMiles: 41, compositeScore: 0.85"
      ]
    },
    "degenerate-low-point-count": {
      "description": "Route with 3 points (fails <=4 point degenerate check)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:degenerate-2pt', name: 'Degenerate 2pt', lengthMiles: 40, compositeScore: 0.85"
      ]
    },
    "degenerate-low-density": {
      "description": "Route with 10 points but 50mi (fails <1 pt/mi check)",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:degenerate-10pt-50mi', name: 'Degenerate 10pt/50mi', lengthMiles: 50, compositeScore: 0.85"
      ]
    },
    "anchors-off-region-rejected": {
      "description": "Route whose anchors straddle the 150mi region boundary around centroid (34.95, -120.42) - seeded by the EXISTING seedAnchorTestRoutes mutation",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:mixed-anchors', name: 'Mixed anchors', lengthMiles: 41, centroidLat: 34.95, centroidLng: -120.42, compositeScore: 0.85"
      ]
    },
    "non-degenerate-valid": {
      "description": "Healthy route - 50 points over 41mi (passes both degenerate checks) - seeded by the EXISTING seedPoCRoute mutation",
      "seed_method": "public_api",
      "records": [
        "routeId: 'motorcycleroads:twist-of-tepusquet-loop', name: 'Twist of Tepusquet Loop', lengthMiles: 41, pointCount: 50, compositeScore: 0.85"
      ]
    },
    "quarantined-row-out-of-band-ratio": {
      "description": "Quarantined route with a REAL out-of-band ratio 0.22 (claimed 100mi, routed 22mi) - the ratio is computed and non-null; quarantine is what skips the band check",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:quarantined-ratio-022', name: 'Quarantined ratio 0.22', lengthMiles: 100, quarantine: {reason: 'length_outlier', flaggedAt: DATE_NOW}, compositeScore: 0.85",
        "new seeder seedQuarantinedOutOfBandRatioRow in convex/curatedGeometryTestSupport.ts"
      ]
    },
    "unquarantined-row-out-of-band-ratio": {
      "description": "Discriminating twin - IDENTICAL geometry and claimed length to quarantined-row-out-of-band-ratio (real ratio 0.22) but with NO quarantine flag",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:unquarantined-ratio-022', name: 'Unquarantined ratio 0.22', lengthMiles: 100, quarantine: undefined, compositeScore: 0.85",
        "new seeder seedUnquarantinedOutOfBandRatioRow in convex/curatedGeometryTestSupport.ts"
      ]
    },
    "quarantined-row-degenerate-geometry": {
      "description": "Quarantined route with 3-point geometry - proves quarantine does NOT bypass the degenerate check",
      "seed_method": "public_api",
      "records": [
        "routeId: 'test:quarantined-degenerate-3pt', name: 'Quarantined degenerate 3pt', lengthMiles: 100, pointCount: 3, quarantine: {reason: 'length_outlier', flaggedAt: DATE_NOW}, compositeScore: 0.85",
        "new seeder seedQuarantinedDegenerateRow in convex/curatedGeometryTestSupport.ts"
      ]
    },
    "repair-round-two-attempts-better-second": {
      "description": "Route driving a real 2-attempt repair round through production reconstructForRoute, SELECTED because its real first attempt lands outside the 0.6-1.6 band and its real repair attempt lands inside it. The routed lengths are whatever the Google Routes API returned - the contract does NOT prescribe them (a genuine response is a value like 51.38, never a designed 50.0000). Every assertion is a property of the recording (band membership, |log(ratio)| ordering, equality with the cassette's own value), never a literal. If no recording of a candidate route exhibits the property, this fixture does not exist and the case must be re-derived from a recording that does - it must never be hand-authored to fit.",
      "seed_method": "recorded_external",
      "records": [
        "routeId: 'test:repair-round', name: 'Repair Round Test', lengthMiles: 100",
        "seeded by the EXISTING seedRepairRoundRoute mutation at convex/curatedGeometryTestSupport.ts:1319 - NOT a new seeder (round 1 wrongly described it as new and invented routeId 'test:repair-round-better-second')",
        "cassette: convex/__tests__/fixtures/S4T1-repair-round-better-second.cassette.json - recorded ONCE from the Google Routes API v2 (https://routes.googleapis.com/directions/v2:computeRoutes) and the Google Geocoding API (https://maps.googleapis.com/maps/api/geocode/json), reached via defaultRoute (convex/actions/curatedGeometryReconstruct.ts:173, fetch at :192 / :159)",
        "recording procedure: with a live GOOGLE_MAPS_API_KEY, run reconstructForRoute once for this route with cassette recording enabled; routeWithInvocationCount (:78-83) persists each request/response pair in call order with the provider's verbatim body (routed distance + encoded polyline); commit the cassette; replay is byte-exact and offline; re-recording requires deleting the file, never editing it"
      ]
    },
    "repair-round-exhausted-to-review": {
      "description": "Route SELECTED because BOTH of its real attempts land outside the 0.6-1.6 band, exhausting the 2-attempt budget to verdict='review'. As with the better-second fixture, the recorded routed lengths are the provider's own values and are never prescribed by this contract.",
      "seed_method": "recorded_external",
      "records": [
        "routeId: 'test:repair-exhausted', name: 'Repair Exhausted Test', lengthMiles: 100",
        "seeded by the EXISTING seedRepairExhaustedRoute mutation at convex/curatedGeometryTestSupport.ts:1335 - NOT a new seeder (round 1's contract ignored this existing seeder entirely)",
        "cassette: convex/__tests__/fixtures/S4T1-repair-round-exhausted.cassette.json - same provider and same recording procedure as repair-round-two-attempts-better-second"
      ]
    },
    "preexisting-row-needs-region-check": {
      "description": "Legacy geometry row with verification.verdict='pass' but off-region anchors",
      "seed_method": "public_api",
      "records": [
        "curatedRouteGeometry doc with routeId, verification.verdict='pass', anchors ~211mi from centroid (beyond the 150mi region bound)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN a route with claimedMiles=100, routedMiles=75, and no quarantine flag WHEN the gate evaluates the ratio routedMiles/claimedMiles THEN verdict is 'review' with failedCondition='ratio' because 0.75 < 0.6",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-ratio-band.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curatedGeometryGate.ts module)",
        "negative_control": {
          "would_fail_if": [
            "evaluateRatioBoundary returns passes=true for all values",
            "ratio check is bypassed or mocked",
            "gate always returns verdict='pass'"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "ratio-boundary-passing",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call evaluateRatioBoundary({ratio: 1.0})",
                "Verify returns {passes:true, ratio:1.0}"
              ]
            },
            "end_state": {
              "must_observe": [
                "passes == true",
                "ratio == 1.0"
              ],
              "must_not_observe": [
                "passes == false",
                "failedCondition == 'ratio'",
                "ratio == null or the ratio field is empty — the seeded input was never echoed back through the real boundary check"
              ]
            }
          },
          {
            "start_ref": "ratio-boundary-failing-low",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call evaluateRatioBoundary({ratio: 0.59})",
                "Verify returns {passes:false, ratio:0.59, failedCondition:'ratio'}"
              ]
            },
            "end_state": {
              "must_observe": [
                "passes == false",
                "failedCondition == 'ratio'",
                "ratio == 0.59"
              ],
              "must_not_observe": [
                "passes == true",
                "ratio == null or empty — evaluateRatioBoundary returned no computed ratio alongside the failure"
              ]
            }
          },
          {
            "start_ref": "ratio-boundary-failing-high",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call evaluateRatioBoundary({ratio: 1.61})",
                "Verify returns {passes:false, failedCondition:'ratio'}"
              ]
            },
            "end_state": {
              "must_observe": [
                "passes == false",
                "failedCondition == 'ratio'",
                "ratio == 1.61"
              ],
              "must_not_observe": [
                "passes == true",
                "failedCondition is empty or absent — the specific band failure was not recorded"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a reconstruction with 1 geocoded anchor within 150mi and 2 off-region WHEN the gate evaluates anchor count and region compliance THEN verdict is 'review' with failedCondition='anchors' because anchorCount < 2",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-anchors-region.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curatedGeometryGate.ts + isAnchorInRegion)",
        "negative_control": {
          "would_fail_if": [
            "isAnchorInRegion always returns true",
            "anchor count check is skipped",
            "region check is mocked out"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "anchors-sufficient-in-region",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call determineGateVerdict({anchorCount:2, pointCount:50, routedMiles:41, ratio:1.0})",
                "Verify returns {verdict:'pass', ratio:1.0}"
              ]
            },
            "end_state": {
              "must_observe": [
                "verdict == 'pass'",
                "ratio == 1.0 — the seeded in-band ratio is echoed back on the verdict, pinning `ratio` provenance so a stub hardcoding `ratio: 0.22` for AC-4 cannot also satisfy this case"
              ],
              "must_not_observe": [
                "failedCondition == 'anchors'",
                "verdict is empty or absent — the gate returned no verdict at all",
                "ratio == 0.22 or any value other than the seeded 1.0 — the verdict carries a hardcoded ratio rather than the computed one"
              ]
            }
          },
          {
            "start_ref": "anchors-insufficient-count",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call determineGateVerdict({anchorCount:1, pointCount:50, routedMiles:41, ratio:1.0})",
                "Verify returns {verdict:'review', failedCondition:'anchors'}"
              ]
            },
            "end_state": {
              "must_observe": [
                "verdict == 'review'",
                "failedCondition == 'anchors'"
              ],
              "must_not_observe": [
                "verdict == 'pass'",
                "failedCondition is empty or absent while verdict == 'review' — the specific failure reason was not recorded"
              ]
            }
          },
          {
            "start_ref": "anchors-off-region-rejected",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed route with centroid (34.95, -120.42) via the existing seedAnchorTestRoutes mutation",
                "Call isAnchorInRegion({lat:38.0, lng:-120.42}, centroid) - a real haversine distance of 211mi (3.05 degrees of latitude x 3958.8mi radius), beyond the 150mi bound",
                "Verify returns false"
              ]
            },
            "end_state": {
              "must_observe": [
                "isAnchorInRegion == false",
                "haversineDistance({lat:38.0, lng:-120.42}, centroid) rounds to 211 (mi)"
              ],
              "must_not_observe": [
                "isAnchorInRegion == true",
                "haversineDistance == 0 (centroid never read — a hardcoded/placeholder region check)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a routed polyline with 3 points and routedMiles=10 WHEN the gate evaluates point count and density THEN verdict is 'review' with failedCondition='degenerate' because pointCount <= 4",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-degenerate.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real isDegenerate + determineGateVerdict)",
        "negative_control": {
          "would_fail_if": [
            "isDegenerate always returns false",
            "point count check is skipped",
            "density check is bypassed",
            "isDegenerate is a stub that returns a hardcoded constant regardless of pointCount"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "degenerate-low-point-count",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call isDegenerate({pointCount:3, routedMiles:10})",
                "Verify returns true"
              ]
            },
            "end_state": {
              "must_observe": [
                "isDegenerate == true"
              ],
              "must_not_observe": [
                "isDegenerate == false",
                "isDegenerate returns undefined or empty — the point-count check never executed"
              ]
            }
          },
          {
            "start_ref": "degenerate-low-density",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call isDegenerate({pointCount:5, routedMiles:10})",
                "Verify returns true (5 pts < 10 mi)"
              ]
            },
            "end_state": {
              "must_observe": [
                "isDegenerate == true"
              ],
              "must_not_observe": [
                "isDegenerate == false",
                "pointCount read as 0 or a default instead of the seeded 5 — the density comparison ran on empty input"
              ]
            }
          },
          {
            "start_ref": "non-degenerate-valid",
            "action": {
              "actor": "api_client",
              "steps": [
                "Call isDegenerate({pointCount:50, routedMiles:41})",
                "Verify returns false"
              ]
            },
            "end_state": {
              "must_observe": [
                "isDegenerate == false"
              ],
              "must_not_observe": [
                "isDegenerate == true",
                "pointCount or routedMiles read as 0 / empty instead of the seeded 50 and 41"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN two routes with IDENTICAL routed geometry (routedMiles=22, pointCount=50, anchorCount=2 in-region) and IDENTICAL claimed length (claimedMiles=100 -> real ratio 0.22, far outside the 0.6-1.6 band) - one carrying quarantine.reason='length_outlier', one with NO quarantine flag - WHEN the gate evaluates both with the SAME real ratio 0.22 (never null) THEN the quarantined route returns verdict='pass' with the out-of-band ratio=0.22 still recorded and ratioSkipped=true, while the unquarantined twin returns verdict='review' with failedCondition='ratio' - a pair satisfiable ONLY by a live quarantine branch, since deleting it collapses both twins to 'review'",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real curatedGeometryGate.ts + quarantine flag)",
        "negative_control": {
          "would_fail_if": [
            "the quarantine branch is deleted from determineGateVerdict (both twins collapse to verdict='review')",
            "quarantine is implemented as an unconditional early return {verdict:'pass'} stub that bypasses the degenerate + anchor checks (Case C would wrongly pass)",
            "the test seeds a null/empty claimed length so ratio==null and the pass verdict comes from the evaluateRatioBoundary null early-return instead of the quarantine branch",
            "the quarantine flag is hardcoded true for all routes (the unquarantined twin would wrongly pass)"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "quarantined-row-out-of-band-ratio",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed quarantined route (lengthMiles=100, quarantine.reason='length_outlier') via seedQuarantinedOutOfBandRatioRow",
                "Call determineGateVerdict({ratio:0.22, pointCount:50, routedMiles:22, anchorCount:2, quarantine:true})",
                "Verify returns {verdict:'pass', ratio:0.22, ratioSkipped:true}"
              ]
            },
            "end_state": {
              "must_observe": [
                "verdict == 'pass'",
                "ratio == 0.22",
                "ratioSkipped == true"
              ],
              "must_not_observe": [
                "verdict == 'review'",
                "failedCondition == 'ratio'",
                "ratioSkipped == false",
                "ratio == null or the ratio field is empty — proves the null early-return fired, not the quarantine branch"
              ]
            }
          },
          {
            "start_ref": "unquarantined-row-out-of-band-ratio",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed the identical twin WITHOUT a quarantine flag (lengthMiles=100, quarantine undefined) via seedUnquarantinedOutOfBandRatioRow",
                "Call determineGateVerdict({ratio:0.22, pointCount:50, routedMiles:22, anchorCount:2, quarantine:false})",
                "Verify returns {verdict:'review', failedCondition:'ratio'}"
              ]
            },
            "end_state": {
              "must_observe": [
                "verdict == 'review'",
                "failedCondition == 'ratio'",
                "ratio == 0.22",
                "ratioSkipped == false"
              ],
              "must_not_observe": [
                "verdict == 'pass'",
                "ratioSkipped == true",
                "ratio == null or empty — the unquarantined twin must carry the same real computed 0.22 as Case A"
              ]
            }
          },
          {
            "start_ref": "quarantined-row-degenerate-geometry",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed quarantined route with 3-point geometry (lengthMiles=100, quarantine.reason='length_outlier') via seedQuarantinedDegenerateRow",
                "Call determineGateVerdict({ratio:0.22, pointCount:3, routedMiles:22, anchorCount:2, quarantine:true})",
                "Verify quarantine does NOT bypass the degenerate check"
              ]
            },
            "end_state": {
              "must_observe": [
                "verdict == 'review'",
                "failedCondition == 'degenerate'"
              ],
              "must_not_observe": [
                "verdict == 'pass'",
                "failedCondition == 'ratio'",
                "failedCondition is empty or absent — the degenerate reason must be recorded even under quarantine"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a reconstruction whose RECORDED first attempt ratio falls outside the 0.6-1.6 band and whose RECORDED repair attempt falls inside it (illustratively 0.5 then 0.9 - but the binding values are whatever the Google Routes recording returned, never literals in the test) WHEN the repair round runs with geocode-log feedback and selects the better attempt by ratio distance THEN the repair attempt is stored because |log(repair)| < |log(first)|, and the routing budget is capped at 2",
      "verify": "npx vitest run convex/__tests__/S4T1-repair-round-bounded.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Google Routes API v2 (routes.googleapis.com/directions/v2:computeRoutes) + Google Geocoding API, recorded once and replayed byte-exact; production reconstructForRoute on the Convex dev deployment",
        "negative_control": {
          "would_fail_if": [
            "repair round runs more than 2 attempts",
            "attempt selection logic is stubbed",
            "geocode log feedback is not passed to LLM",
            "routingInvocationCount is hand-incremented outside routeWithInvocationCount (the :622/:643 simulation pattern) so the count reaches 2 with zero provider traffic",
            "the stored polyline is buildCannedPolyline output rather than the recorded provider geometry",
            "the cassette is hand-authored with designed round values instead of recorded from Google Routes",
            "the test asserts ratio literals instead of comparing against the cassette's own recorded values"
          ]
        },
        "evidence": {
          "artifact_type": "api_response",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "repair-round-two-attempts-better-second",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed via the EXISTING seedRepairRoundRoute mutation (routeId 'test:repair-round', claimed 100mi)",
                "Call production reconstructForRoute with the cassette replaying the recorded Google Routes exchanges in call order",
                "Verify the repair round re-prompts with geocode-log feedback after attempt#1 fails the band",
                "Verify the better attempt is stored by |log(ratio)|, comparing against the cassette's recorded values rather than literals"
              ]
            },
            "end_state": {
              "must_observe": [
                "routingCallCount == 2 AND every increment originated inside routeWithInvocationCount (convex/actions/curatedGeometryReconstruct.ts:78-83) — the only path to defaultRoute -> Google Routes",
                "recorded attempt#1 ratio < 0.6 (outside the band, as recorded — not as designed)",
                "recorded attempt#2 ratio within 0.6-1.6 (as recorded)",
                "|log(attempt#2 ratio)| < |log(attempt#1 ratio)| — the repair attempt is strictly closer to 1.0",
                "stored ratio == the cassette's recorded attempt#2 ratio (read from the cassette, not a literal in the test)",
                "stored encodedPolyline == the polyline carried in the cassette's recorded attempt#2 response"
              ],
              "must_not_observe": [
                "routingCallCount > 2",
                "stored ratio == the recorded attempt#1 ratio",
                "routingCallCount == 0",
                "routingInvocationCount incremented anywhere other than routeWithInvocationCount — a hand-incremented counter satisfies a bare count assertion while no provider call happened",
                "stored encodedPolyline == buildCannedPolyline(...) output — geometry fabricated locally instead of replayed from the recorded provider response"
              ]
            }
          },
          {
            "start_ref": "repair-round-exhausted-to-review",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed via the EXISTING seedRepairExhaustedRoute mutation (routeId 'test:repair-exhausted', claimed 100mi) — a route selected because BOTH real attempts fall outside the band",
                "Call production reconstructForRoute against its cassette",
                "Verify the 2-attempt budget is exhausted and the final verdict is 'review'"
              ]
            },
            "end_state": {
              "must_observe": [
                "routingCallCount == 2 AND every increment originated inside routeWithInvocationCount",
                "both recorded attempt ratios outside 0.6-1.6 (as recorded — not as designed)",
                "verdict == 'review'",
                "failedCondition == \"ratio\" (specific failure recorded)"
              ],
              "must_not_observe": [
                "routingCallCount > 2",
                "verdict == 'pass'",
                "routingCallCount == 0",
                "a third recorded provider exchange is replayed — the budget was exceeded",
                "routingInvocationCount incremented outside routeWithInvocationCount"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a curated_route_geometry row with verification from before gate hardening (missing region check) WHEN a re-evaluation sweep runs over pre-existing geometry THEN rows failing the enhanced gate are flipped to verdict='review'",
      "verify": "npx vitest run convex/__tests__/S4T1-preexisting-sweep.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real pre-existing sweep over curated_route_geometry)",
        "negative_control": {
          "would_fail_if": [
            "sweep only processes new geometry",
            "pre-existing verification objects are skipped",
            "gate is bypassed for legacy rows",
            "the sweep is a no-op that leaves pre-existing verification objects unchanged"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "preexisting-row-needs-region-check",
            "action": {
              "actor": "api_client",
              "steps": [
                "Insert geometry row with verification.verdict='pass' but anchors ~211mi from centroid",
                "Run pre-existing sweep",
                "Query verification - should be flipped to 'review'"
              ]
            },
            "end_state": {
              "must_observe": [
                "verification.verdict == 'review'",
                "verification.failedCondition == 'anchors'"
              ],
              "must_not_observe": [
                "verification.verdict == 'pass'",
                "verification.failedCondition is empty or absent — the sweep flipped the verdict with no recorded reason"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "evaluateRatioBoundary passes for ratio 0.6–1.6",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-ratio-band.integration.test.ts -t 'TC-1'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "evaluateRatioBoundary fails for ratio below 0.6",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-ratio-band.integration.test.ts -t 'TC-2'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "evaluateRatioBoundary fails for ratio above 1.6",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-ratio-band.integration.test.ts -t 'TC-3'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "determineGateVerdict requires at least 2 anchors",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-anchors-region.integration.test.ts -t 'TC-4'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "isAnchorInRegion rejects points beyond 150mi",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-anchors-region.integration.test.ts -t 'TC-5'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "isDegenerate returns true for pointCount <= 4",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-degenerate.integration.test.ts -t 'TC-6'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "isDegenerate returns true for pointCount < routedMiles",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-degenerate.integration.test.ts -t 'TC-7'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Quarantined route with out-of-band ratio 0.22 returns verdict='pass' with ratio=0.22 recorded and ratioSkipped=true",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts -t 'TC-8'",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Repair round limits to 2 attempts total",
      "verify": "npx vitest run convex/__tests__/S4T1-repair-round-bounded.integration.test.ts -t 'TC-9'",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "Repair round keeps better attempt by ratio distance",
      "verify": "npx vitest run convex/__tests__/S4T1-repair-round-bounded.integration.test.ts -t 'TC-10'",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "Unquarantined twin with the IDENTICAL real ratio 0.22 returns verdict='review' with failedCondition='ratio' (the discriminator: deleting the quarantine branch collapses TC-8 onto this)",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts -t 'TC-11'",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "Quarantined route with 3-point geometry still returns verdict='review' with failedCondition='degenerate' (quarantine does not bypass degenerate/region checks)",
      "verify": "npx vitest run convex/__tests__/S4T1-gate-quarantine-ratio-skip.integration.test.ts -t 'TC-12'",
      "maps_to_ac": "AC-4"
    }
  ]
}
-->
</details>
