# S6-T5 — Saved-routes reachability: canonical redirect, approximate state, never gate-hidden (SURF-06)

> Status: ⬜ Pending
> Proposed By: `convex-planner`

| Field | Value |
|---|---|
| TASK_ID | S6-T5 |
| SPRINT | [Sprint 06 — Rider-ready surface](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | `convex-implementer` |
| ESTIMATE | 90 min |
| EFFORT | M |
| PRIORITY | P0 |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | touches CAP-GEO-04 |
| DEPENDS_ON | S6-T2 |
| BLOCKS | S6-T3, S6-T4 |

RUNTIME_COMMANDS:
- typecheck: `pnpm type-check`
- lint: `pnpm lint`
- test: `pnpm test`
- build: `pnpm convex:dev -- --once`

## BACKGROUND
Guarantee that a rider can open any previously saved curated route to its detail view regardless of rider-ready status: resolve duplicate-shadow merges to the canonical row, return routePolyline: null for un-recovered rows, and let the RN side render the existing honest 'Approximate location' state.

## 🚫 CRITICAL CONSTRAINTS (Never tier)
- **MUST** MUST resolve duplicateOf → canonical inside getCuratedRouteDetail: when the by_routeId lookup yields a row with duplicateOf set, re-resolve via the canonical routeId and return the canonical row's detail
- **MUST** MUST preserve gate-independence: getCuratedRouteDetail MUST NOT read or filter by riderReady — the query resolves any saved routeId regardless of gate status
- **MUST** MUST return routePolyline: null for un-recovered saved routes (no curated_route_geometry row AND no in-row routePolyline) — the honest 'Approximate location' state's data prerequisite
- **MUST** MUST return geometryStatus + retirementReason + retiredAt on the response so the RN side can distinguish 'Approximate' from 'Retired' honest states
- **MUST** MUST seed saved_routes via the real by_curated_route index lookups — never mock the saved-route resolution path
- **NEVER** NEVER gate getCuratedRouteDetail on riderReady — gate filters SUGGESTIONS, never the rider's library (UC-SURF-06)
- **NEVER** NEVER fabricate a polyline for an un-recovered saved route — return null and let the RN side render honest 'Approximate location'
- **NEVER** NEVER mutate saved_routes.curatedRouteRef during the redirect — canonical resolution is read-path only (the rider's library is immutable from a query)
- **NEVER** NEVER mock ctx or the saved_routes table — integration tests exercise the real deployed query via npx convex run
- **NEVER** NEVER return an error / throw ConvexError NOT_FOUND for a saved route that resolves to a non-ready row — return the detail with the honest status fields (curatedRoutes.ts:498-503 already avoids throwing for this reason)
- **STRICTLY** STRICTLY redirect at most ONCE: a shadow → canonical → canonical chain is forbidden; if the canonical row also has duplicateOf set, return null (data integrity fault — never loop)
- **STRICTLY** STRICTLY return the canonical row's geometryStatus / retirementReason / retiredAt on redirect (not the shadow's) — the rider sees the canonical state
- **STRICTLY** STRICTLY resolve duplicateOf via by_routeId index lookup (curatedRoutes.ts:511-514 is the existing pattern)

## SPECIFICATION
**Objective:** Guarantee that a rider can open any previously saved curated route to its detail view regardless of rider-ready status: resolve duplicate-shadow merges to the canonical row, return routePolyline: null for un-recovered rows, and let the RN side render the existing honest 'Approximate location' state.

**Success state:** A rider whose saved route becomes non-ready (quarantined, retired, or merged as a shadow) can still open its detail; un-recovered rows surface as honest 'Approximate location' rather than errors; shadow-merged rows resolve to the canonical row's detail.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR)
### AC-1 [PRIMARY] — Saved route detail resolves regardless of rider-ready status

**Requirement:** GIVEN A saved_routes row pointing at a curated route whose riderReady === false (quarantined post-save) AND the rider calls getCuratedRouteDetail with that routeId WHEN getCuratedRouteDetail runs against the real deployed query THEN The detail returns (NOT null, NOT an error) with riderReady: false and the route's stored geometryStatus — no gate filter applies

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: convex-test-deployment  ·  FLOW_REF: UC-SURF-06  ·  VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts --grep AC-1`

SCENARIO:
- CASE 1 (`saved-route-flipped-non-ready`): MUST_OBSERVE ['result !== null', 'result.routeId === saved routeId', 'result.riderReady === false', "result.geometryStatus reflects the stored status (e.g. 'generated')"]; MUST_NOT_OBSERVE ['result === null (gate hid the row)', 'a thrown ConvexError NOT_FOUND', 'result.riderReady === true (stale)']
- NEGATIVE_CONTROL (would_fail_if): ['getCuratedRouteDetail silently adds a riderReady===true filter (gate leaks into the detail path)', 'the query throws ConvexError NOT_FOUND for a saved route whose riderReady flipped false (the curatedRoutes.ts:498-503 comment explicitly avoids this — the regression would be a render-time LogBox crash)', 'the test patches riderReady=true to bypass the gate rather than seeding a real non-ready row']
- EVIDENCE: `api_response` (required_capture=True)

### AC-2 — Un-recovered saved route renders honest 'Approximate location' (routePolyline: null)

**Requirement:** GIVEN A saved route with NO plottable geometry: no curated_route_geometry side-table row AND no in-row routePolyline (geometryStatus 'unresolved') WHEN getCuratedRouteDetail runs THEN The response carries routePolyline: null AND geometryStatus: 'unresolved' — the data shape that supports the existing honest 'Approximate location' state; NO fabricated line, NO error

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: convex-test-deployment  ·  FLOW_REF: UC-SURF-06  ·  VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts --grep AC-2`

SCENARIO:
- CASE 1 (`saved-route-unrecovered`): MUST_OBSERVE ['result.routePolyline === null', "result.geometryStatus === 'unresolved'", 'result !== null']; MUST_NOT_OBSERVE ['result.routePolyline is a non-empty string (fabricated)', 'result === null (error path)', 'an empty bounds object']
- NEGATIVE_CONTROL (would_fail_if): ['the query fabricates a polyline (e.g. falls back to a synthesized centroid line) rather than returning null', 'the query throws on missing geometry rather than returning null routePolyline', 'resolveDetailRoutePolyline at curatedRoutes.ts:443-452 is changed to invent a default line']
- EVIDENCE: `api_response` (required_capture=True)

### AC-3 — Shadow-merged saved route resolves to canonical row's detail

**Requirement:** GIVEN A saved route whose curatedRouteRef points to a row with duplicateOf = '<canonicalRouteId>' (the row was merged as a duplicate shadow after the rider saved it) WHEN getCuratedRouteDetail runs with the shadow's routeId THEN The query resolves the canonical row and returns ITS detail (canonical routeId, canonical geometryStatus, canonical retirementReason); saved_routes.curatedRouteRef is NOT mutated

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: convex-test-deployment  ·  FLOW_REF: UC-SURF-06  ·  VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-canonical-redirect.integration.test.ts --grep AC-3`

SCENARIO:
- CASE 1 (`saved-route-shadow-of-canonical`): MUST_OBSERVE ["result.routeId === 'test:s6t5-canonical'", "result.geometryStatus === canonical's status", "saved_routes row byte-identical before/after (curatedRouteRef STILL === 'test:s6t5-shadow' — read-path never mutates)"]; MUST_NOT_OBSERVE ["result.routeId === 'test:s6t5-shadow' (redirect missed)", 'saved_routes.curatedRouteRef mutated to canonical', 'result === null']
- CASE 2 (`saved-route-canonical-chain-guard`): MUST_OBSERVE ['result === null (data-integrity fault — redirect refused, no infinite loop) OR a single-hop maximum is enforced']; MUST_NOT_OBSERVE ['infinite recursion / stack overflow', 'more than one redirect hop']
- NEGATIVE_CONTROL (would_fail_if): ['the canonical redirect is missing — the query returns the shadow row (which has no geometry / wrong status)', 'the query mutates saved_routes.curatedRouteRef to the canonical (read-path write — Convex queries cannot do this, but the test pins it)', 'the query loops on a canonical → canonical chain (no infinite-redirect guard)', 'the test mocks the by_routeId lookup instead of seeding real rows']
- EVIDENCE: `api_response` (required_capture=True)

### AC-4 — Status changes after save never lose access (quarantine / retire / shadow)

**Requirement:** GIVEN A saved route that becomes successively: quarantined, retired, then merged-as-shadow, each driven through the real backend mutations WHEN getCuratedRouteDetail runs at each stage THEN Every stage returns a non-null detail with the up-to-date geometryStatus / retirementReason / riderReady — the rider never loses access

TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: convex-test-deployment  ·  FLOW_REF: UC-SURF-06  ·  VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts --grep AC-4`

SCENARIO:
- CASE 1 (`saved-route-status-progression`): MUST_OBSERVE ['after quarantine: result !== null AND result.riderReady === false', "after retire: result !== null AND result.retiredAt != null AND result.geometryStatus === 'retired'", 'after shadow merge: result.routeId === canonical routeId']; MUST_NOT_OBSERVE ['any stage returns null or throws', 'loss of access between stages', 'stale status fields from before the transition']
- NEGATIVE_CONTROL (would_fail_if): ['any status transition causes getCuratedRouteDetail to return null or throw (gate leak)', 'the retirementReason / geometryStatus fields are dropped from the response (RN cannot distinguish honest states)', 'the test seeds each transition by direct patch instead of the real retireRoute / persistGeometryVerified path']
- EVIDENCE: `api_response` (required_capture=True)

## TEST CRITERIA
- **TC-1** (→ AC-1): Saved route with riderReady===false (post-quarantine) returns non-null detail
  - VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts -t 'TC-1'`
- **TC-2** (→ AC-1): getCuratedRouteDetail does NOT add a riderReady===true filter (grep the source for the absence of any riderReady predicate in the detail handler)
  - VERIFY: `grep -n 'riderReady' convex/curatedRoutes.ts shows no predicate inside getCuratedRouteDetail's handler`
- **TC-3** (→ AC-2): Un-recovered saved route returns routePolyline === null + geometryStatus === 'unresolved' (no fabricated line)
  - VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts -t 'TC-3'`
- **TC-4** (→ AC-3): Shadow-merged saved route resolves to canonical row's routeId
  - VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-canonical-redirect.integration.test.ts -t 'TC-4'`
- **TC-5** (→ AC-3): saved_routes.curatedRouteRef is NOT mutated by the canonical redirect (read-path immutability)
  - VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-canonical-redirect.integration.test.ts -t 'TC-5'`
- **TC-6** (→ AC-3): Canonical chain guard: corrupted canonical chain returns null OR enforces single-hop max (no infinite recursion)
  - VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-canonical-redirect.integration.test.ts -t 'TC-6'`
- **TC-7** (→ AC-4): Saved route remains reachable through quarantine, retire, and shadow-merge transitions
  - VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts -t 'TC-7'`
- **TC-8** (→ AC-4): Retired saved route returns retirementReason + retiredAt on the detail response (honest state data)
  - VERIFY: `pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts -t 'TC-8'`

## SCOPE (file-level write permissions)
**writeAllowed:**
- `convex/curatedRoutes.ts (MODIFY — add canonical redirect inside getCuratedRouteDetail handler at lines 498-527; NO riderReady predicate; NO change to routeDetailReturnValidator)`
- `convex/__tests__/S6T5-saved-route-reachable.integration.test.ts (NEW)`
- `convex/__tests__/S6T5-saved-route-canonical-redirect.integration.test.ts (NEW)`
- `convex/curatedGeometryTestSupport.ts (MODIFY — add S6-T5 saved-route + canonical-redirect seeders if not already present)`
**writeProhibited:**
- `convex/schema.ts (saved_routes + curated_routes schemas already exist; no field additions needed)`
- `convex/curatedGeometry.ts (S6-T1 owns recompute; S6-T5 consumes the gate flag read-only on the detail response)`
- `app/** and any React Native surface (the honest 'Approximate location' UI rendering is S6-T3/S6-T4)`
- `convex/actions/agent/tools/discoverCuratedRoutes.ts (S6-T2 scope — discovery tool stays gated, this task only touches DETAIL)`
- `saved_routes write paths / mutations (canonical resolution is READ-PATH only — saved_routes.curatedRouteRef is immutable from getCuratedRouteDetail)`

## READING LIST
- `convex/curatedRoutes.ts` (498-527) — [PRIMARY PATTERN] getCuratedRouteDetail — the gate-INDEPENDENT detail query; AC-3 canonical redirect lands here (after the by_routeId lookup at 511-514)
- `convex/curatedRoutes.ts` (443-496) — resolveDetailRoutePolyline + buildRouteDetail — the AC-2 honest-null routePolyline pattern (already correct; pin against regression)
- `convex/curatedRoutes.ts` (388-436) — routeDetailReturnValidator — already includes geometryStatus, retirementReason, retiredAt, riderReady on the response (S6-T5 only ADDS canonical redirect, no schema change)
- `convex/schema.ts` (54-59) — saved_routes table + by_curated_route index (the rider's library lookup)
- `shared/models/curated-routes.ts` (165-212) — duplicateOf field — the canonical-redirect source field
- `convex/__tests__/getCuratedRouteDetail.integration.test.ts` (1-120) — Existing detail-query integration pattern — execFileSync npx convex run --identity; never mock ctx
- `.spec/prds/route-agent-quality/07-uc-surf.md` (94-104) — UC-SURF-06 acceptance criteria
- `.spec/prds/route-agent-quality/11-e2e-testing-criteria.md` (187-194) — T-SURF-019..021 acceptance gates

## DESIGN
- Reference: .spec/prds/route-agent-quality/07-uc-surf.md
- Reference: .spec/prds/route-agent-quality/11-e2e-testing-criteria.md
- S6-T5 DEPENDS ON S6-T2: the gated list/discovery queries (S6-T2) determine what gets SUGGESTED; S6-T5's getCuratedRouteDetail determines what a saved rider can RE-OPEN — the two paths are deliberately separate (UC-SURF-06 AC-1)
- Canonical redirect is read-path only: saved_routes.curatedRouteRef is NEVER rewritten by the detail query — the rider's library is immutable from a read
- The honest 'Approximate location' state is rendered RN-side by S6-T3/S6-T4; S6-T5's job is to return routePolyline: null + geometryStatus so the RN side has what it needs

**Pattern:** Single-hop canonical redirect inside a gate-INDEPENDENT detail query: by_routeId lookup → if duplicateOf set, re-resolve by_routeId on the canonical → return canonical detail
- pattern_source: `convex/curatedRoutes.ts:498-527 (existing detail query — extend with redirect)`

**Anti-pattern:** riderReady filter on detail (gate leaks into the rider's library), fabricating a polyline for un-recovered rows, mutating saved_routes from a read path, ungated canonical recursion (chain loops)

## EVIDENCE / VERIFICATION GATES
- **Integration tests pass** — `pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts convex/__tests__/S6T5-saved-route-canonical-redirect.integration.test.ts` → Exit 0
- **Detail-query gate-independence source check** — `grep -n 'riderReady' convex/curatedRoutes.ts` → Matches only appear in the listCuratedRoutesHandler / listCuratedRoutesReturnValidator; the getCuratedRouteDetail handler (lines 498-527) contains NO riderReady predicate
- **Type-check** — `pnpm type-check` → Exit 0 on convex pass
- **Lint** — `pnpm lint` → Exit 0
- **Convex schema/build** — `pnpm convex:dev -- --once` → Exit 0
- **No-regression on existing detail tests** — `pnpm test -- convex/__tests__/getCuratedRouteDetail.integration.test.ts` → Exit 0

## DEPENDENCIES
- Depends on: S6-T2
- Blocks: S6-T3, S6-T4

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S6-T5",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "saved-route-flipped-non-ready": {
      "description": "A curated route saved to saved_routes, then driven non-ready via persistRideWorthiness verdict='not_a_ride'",
      "seed_method": "public_api",
      "records": [
        "curated route test:s6t5-saved-flip with valid geometry + rideWorthiness initially 'ride'",
        "saved_routes row {ownerType:'user', curatedRouteRef:'test:s6t5-saved-flip'}",
        "persistRideWorthiness verdict='not_a_ride' (flips riderReady=false via S6-T1 trigger)"
      ]
    },
    "saved-route-unrecovered": {
      "description": "A saved route with no plottable geometry — no curated_route_geometry row, routePolyline absent, geometryStatus='unresolved'",
      "seed_method": "public_api",
      "records": [
        "curated route test:s6t5-saved-unrecovered with geometryStatus='unresolved', no geometry row",
        "saved_routes row pointing at it"
      ]
    },
    "saved-route-shadow-of-canonical": {
      "description": "A saved route whose curatedRouteRef points at a shadow row with duplicateOf set to a canonical",
      "seed_method": "public_api",
      "records": [
        "canonical route test:s6t5-canonical (riderReady=true, valid geometry)",
        "shadow route test:s6t5-shadow with duplicateOf='test:s6t5-canonical'",
        "saved_routes row {curatedRouteRef:'test:s6t5-shadow'}"
      ]
    },
    "saved-route-canonical-chain-guard": {
      "description": "Corrupted canonical chain A→B→A (or A→B→C→A) to prove the redirect enforces single-hop max / returns null on chain",
      "seed_method": "public_api",
      "records": [
        "test:s6t5-chain-A with duplicateOf='test:s6t5-chain-B'",
        "test:s6t5-chain-B with duplicateOf='test:s6t5-chain-A'"
      ]
    },
    "saved-route-status-progression": {
      "description": "A saved route progressed through quarantine → retire → shadow-merge via the real mutations",
      "seed_method": "public_api",
      "records": [
        "curated route test:s6t5-progression initially riderReady=true",
        "saved_routes row",
        "transition 1: set quarantine.reason='length_outlier'",
        "transition 2: retireRoute",
        "transition 3: unretire + set duplicateOf on the row"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN A saved_routes row pointing at a curated route whose riderReady === false (quarantined post-save) AND the rider calls getCuratedRouteDetail with that routeId WHEN getCuratedRouteDetail runs against the real deployed query THEN The detail returns (NOT null, NOT an error) with riderReady: false and the route's stored geometryStatus — no gate filter applies",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts --grep AC-1",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "convex-test-deployment",
        "negative_control": {
          "would_fail_if": [
            "getCuratedRouteDetail silently adds a riderReady===true filter (gate leaks into the detail path)",
            "the query throws ConvexError NOT_FOUND for a saved route whose riderReady flipped false (the curatedRoutes.ts:498-503 comment explicitly avoids this — the regression would be a render-time LogBox crash)",
            "the test patches riderReady=true to bypass the gate rather than seeding a real non-ready row"
          ]
        },
        "evidence": {
          "artifact_type": "api_response"
        },
        "cases": [
          {
            "start_ref": "saved-route-flipped-non-ready",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed a curated route and save it via the real saved_routes insert (curatedRouteRef = routeId)",
                "Drive the route non-ready: persistRideWorthiness verdict='not_a_ride' (so riderReady flips false via S6-T1 trigger)",
                "Call getCuratedRouteDetail {routeId} with the saved routeId"
              ]
            },
            "end_state": {
              "must_observe": [
                "result !== null",
                "result.routeId === saved routeId",
                "result.riderReady === false",
                "result.geometryStatus reflects the stored status (e.g. 'generated')"
              ],
              "must_not_observe": [
                "result === null (gate hid the row)",
                "a thrown ConvexError NOT_FOUND",
                "result.riderReady === true (stale)"
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
      "description": "GIVEN A saved route with NO plottable geometry: no curated_route_geometry side-table row AND no in-row routePolyline (geometryStatus 'unresolved') WHEN getCuratedRouteDetail runs THEN The response carries routePolyline: null AND geometryStatus: 'unresolved' — the data shape that supports the existing honest 'Approximate location' state; NO fabricated line, NO error",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts --grep AC-2",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "convex-test-deployment",
        "negative_control": {
          "would_fail_if": [
            "the query fabricates a polyline (e.g. falls back to a synthesized centroid line) rather than returning null",
            "the query throws on missing geometry rather than returning null routePolyline",
            "resolveDetailRoutePolyline at curatedRoutes.ts:443-452 is changed to invent a default line"
          ]
        },
        "evidence": {
          "artifact_type": "api_response"
        },
        "cases": [
          {
            "start_ref": "saved-route-unrecovered",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed a curated route with geometryStatus='unresolved', no curated_route_geometry row, routePolyline absent",
                "Save it via real saved_routes insert",
                "Call getCuratedRouteDetail {routeId}"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.routePolyline === null",
                "result.geometryStatus === 'unresolved'",
                "result !== null"
              ],
              "must_not_observe": [
                "result.routePolyline is a non-empty string (fabricated)",
                "result === null (error path)",
                "an empty bounds object"
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
      "description": "GIVEN A saved route whose curatedRouteRef points to a row with duplicateOf = '<canonicalRouteId>' (the row was merged as a duplicate shadow after the rider saved it) WHEN getCuratedRouteDetail runs with the shadow's routeId THEN The query resolves the canonical row and returns ITS detail (canonical routeId, canonical geometryStatus, canonical retirementReason); saved_routes.curatedRouteRef is NOT mutated",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-canonical-redirect.integration.test.ts --grep AC-3",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "convex-test-deployment",
        "negative_control": {
          "would_fail_if": [
            "the canonical redirect is missing — the query returns the shadow row (which has no geometry / wrong status)",
            "the query mutates saved_routes.curatedRouteRef to the canonical (read-path write — Convex queries cannot do this, but the test pins it)",
            "the query loops on a canonical → canonical chain (no infinite-redirect guard)",
            "the test mocks the by_routeId lookup instead of seeding real rows"
          ]
        },
        "evidence": {
          "artifact_type": "api_response"
        },
        "cases": [
          {
            "start_ref": "saved-route-shadow-of-canonical",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed canonical route (test:s6t5-canonical) with valid geometry + riderReady=true",
                "Seed shadow route (test:s6t5-shadow) with duplicateOf='test:s6t5-canonical'",
                "Insert saved_routes row with curatedRouteRef='test:s6t5-shadow'",
                "Snapshot the saved_routes row",
                "Call getCuratedRouteDetail {routeId: 'test:s6t5-shadow'}",
                "Re-read the saved_routes row"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.routeId === 'test:s6t5-canonical'",
                "result.geometryStatus === canonical's status",
                "saved_routes row byte-identical before/after (curatedRouteRef STILL === 'test:s6t5-shadow' — read-path never mutates)"
              ],
              "must_not_observe": [
                "result.routeId === 'test:s6t5-shadow' (redirect missed)",
                "saved_routes.curatedRouteRef mutated to canonical",
                "result === null"
              ]
            }
          },
          {
            "start_ref": "saved-route-canonical-chain-guard",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed a corrupted canonical chain: row A duplicateOf=row B, row B duplicateOf=row A (or row B duplicateOf=row C duplicateOf=row A)",
                "Call getCuratedRouteDetail {routeId: 'A'}"
              ]
            },
            "end_state": {
              "must_observe": [
                "result === null (data-integrity fault — redirect refused, no infinite loop) OR a single-hop maximum is enforced"
              ],
              "must_not_observe": [
                "infinite recursion / stack overflow",
                "more than one redirect hop"
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
      "description": "GIVEN A saved route that becomes successively: quarantined, retired, then merged-as-shadow, each driven through the real backend mutations WHEN getCuratedRouteDetail runs at each stage THEN Every stage returns a non-null detail with the up-to-date geometryStatus / retirementReason / riderReady — the rider never loses access",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts --grep AC-4",
      "maps_to_ac": null,
      "scenario": {
        "test_tier": "integration",
        "verification_service": "convex-test-deployment",
        "negative_control": {
          "would_fail_if": [
            "any status transition causes getCuratedRouteDetail to return null or throw (gate leak)",
            "the retirementReason / geometryStatus fields are dropped from the response (RN cannot distinguish honest states)",
            "the test seeds each transition by direct patch instead of the real retireRoute / persistGeometryVerified path"
          ]
        },
        "evidence": {
          "artifact_type": "api_response"
        },
        "cases": [
          {
            "start_ref": "saved-route-status-progression",
            "action": {
              "actor": "api_client",
              "steps": [
                "Seed a saved route (riderReady=true initially)",
                "Drive quarantine (set quarantine.reason='length_outlier' via the real mutation)",
                "Call getCuratedRouteDetail — assert non-null + status",
                "Drive retire (call retireRoute)",
                "Call getCuratedRouteDetail — assert non-null + retirementReason set",
                "Drive shadow merge (set duplicateOf on the row)",
                "Call getCuratedRouteDetail — assert it returns the canonical row"
              ]
            },
            "end_state": {
              "must_observe": [
                "after quarantine: result !== null AND result.riderReady === false",
                "after retire: result !== null AND result.retiredAt != null AND result.geometryStatus === 'retired'",
                "after shadow merge: result.routeId === canonical routeId"
              ],
              "must_not_observe": [
                "any stage returns null or throws",
                "loss of access between stages",
                "stale status fields from before the transition"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Saved route with riderReady===false (post-quarantine) returns non-null detail",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts -t 'TC-1'",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "getCuratedRouteDetail does NOT add a riderReady===true filter (grep the source for the absence of any riderReady predicate in the detail handler)",
      "verify": "grep -n 'riderReady' convex/curatedRoutes.ts shows no predicate inside getCuratedRouteDetail's handler",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Un-recovered saved route returns routePolyline === null + geometryStatus === 'unresolved' (no fabricated line)",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts -t 'TC-3'",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Shadow-merged saved route resolves to canonical row's routeId",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-canonical-redirect.integration.test.ts -t 'TC-4'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "saved_routes.curatedRouteRef is NOT mutated by the canonical redirect (read-path immutability)",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-canonical-redirect.integration.test.ts -t 'TC-5'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Canonical chain guard: corrupted canonical chain returns null OR enforces single-hop max (no infinite recursion)",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-canonical-redirect.integration.test.ts -t 'TC-6'",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Saved route remains reachable through quarantine, retire, and shadow-merge transitions",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts -t 'TC-7'",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Retired saved route returns retirementReason + retiredAt on the detail response (honest state data)",
      "verify": "pnpm test -- convex/__tests__/S6T5-saved-route-reachable.integration.test.ts -t 'TC-8'",
      "maps_to_ac": "AC-4"
    }
  ]
}
-->