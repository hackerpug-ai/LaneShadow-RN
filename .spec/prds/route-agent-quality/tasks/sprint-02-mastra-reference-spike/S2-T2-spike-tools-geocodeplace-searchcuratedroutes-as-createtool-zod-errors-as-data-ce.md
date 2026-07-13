# S2-T2 — Spike tools: geocodePlace + searchCuratedRoutes as createTool + Zod, errors-as-data (center-required, server distanceMi)

| Field | Value |
|-------|-------|
| TASK_ID | S2-T2 |
| SPRINT | [Sprint 02 — Mastra spike + z.ai proof + enrichment re-ratification](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `mastra-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-AGT-01, CAP-AGT-02 |
| DEPENDS_ON | S2-T1 |
| BLOCKS | S2-T3 |

RUNTIME_COMMANDS:
- test: `pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts`
- typecheck: `pnpm type-check`
- lint: `pnpm exec biome check`

## OUTCOME

geocodePlace('Ogden, UT') returns ok:true with a center ~41.22,-111.97 from the real geocoder; searchCuratedRoutes({center:Ogden,radiusMi}) returns routes each carrying a server-computed distanceMi <= radius, nearest-first; a missing center yields { ok:false, errorCode:'center_required' } without throwing; an unresolvable place yields ok:false without throwing; the discriminated-union outputSchema rejects malformed shapes.

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- Import createTool from '@mastra/core/tools' (subpath — the package root exports only Mastra).
- Tool execute is TWO positional args: async (inputData, context) => {} — never a single destructured { context } object (0.x shape).
- geocodePlace resolves centers via the REAL Google Geocoding capability (createGeocodingProvider from convex/actions/agent/providers/geocodingProvider.ts, GOOGLE_MAPS_API_KEY) — the same geocoder the routing pipeline uses; no hardcoded city gazetteer.
- searchCuratedRoutes wraps the REAL curated data (listCuratedRoutesInternal nearest mode) and returns the SERVER-computed distanceMi on every route; the model never invents a distance.
- Both tools are errors-as-data: on a missing center or an unresolvable place they RETURN a typed { ok:false, errorCode } object and NEVER throw out of execute.
- outputSchema is a real discriminated Zod union (ok:true variant with routes / ok:false variant with errorCode) so Mastra runtime output-validation has real teeth.
- center is required by CONTRACT for searchCuratedRoutes: inputSchema keeps center optional so the schema itself doesn't throw, and execute returns { ok:false, errorCode:'center_required' } when it is absent — the original national-best devolution is impossible.

**NEVER**
- NEVER use z.any()/z.unknown() as an inputSchema or outputSchema in the tool definitions.
- NEVER let a missing/undefined center silently fall through to a national-best or statewide query (the Capitol-Reef-170mi-as-near-Ogden bug).
- NEVER mock @mastra/core, the Google geocoder, or the Convex curated query for the PRIMARY or generalization ACs — those run against the real dev deployment.
- NEVER route through pi-ai (convex/actions/agent/lib/models.ts getAgentModel) or tear down any pi-ai file — this is additive spike scope only.
- NEVER capture a per-request identifier (sessionId, center, rider location) in module scope.

**STRICTLY**
- STRICTLY test_tier=integration on AC-1 (geocode) and AC-2 (server distanceMi) against real Google + real Convex dev; a mock-only pass satisfies neither.
- STRICTLY SKIP-with-reason (never fake success) if GOOGLE_MAPS_API_KEY is unset on the deployment or Google/Convex dev is unreachable.
- STRICTLY assert the SERVER distanceMi on the tool RESULT for no-false-proximity — never assert on any reply prose (E2E constitution).

## SPECIFICATION

**Objective:** Deliver the two registered spike tools — geocodePlace (real Google Geocoding) and searchCuratedRoutes (real curated_routes nearest, server distanceMi) — as @mastra/core createTool definitions with real Zod schemas and an errors-as-data contract, so S2-T3's stateless Agent can call them to ground every discovery request in a resolved center.

**Success state:** geocodePlace('Ogden, UT') returns ok:true with a center ~41.22,-111.97 from the real geocoder; searchCuratedRoutes({center:Ogden,radiusMi}) returns routes each carrying a server-computed distanceMi <= radius, nearest-first; a missing center yields { ok:false, errorCode:'center_required' } without throwing; an unresolvable place yields ok:false without throwing; the discriminated-union outputSchema rejects malformed shapes.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `ogden_place` (seed_method: `recorded_external`): Real place string 'Ogden, UT' and its expected Google-geocoded center (~41.223, -111.973) — the canonical §5b location; resolved through the real geocoder, not a fixture table.
- `ogden_center_for_search` (seed_method: `recorded_external`): The resolved Ogden center {lat:41.223,lng:-111.973} used as searchCuratedRoutes input, run against the REAL curated_routes data on the dev deployment (nearest mode, server distanceMi).
- `unresolvable_place` (seed_method: `public_api`): A deliberately non-geocodable garbage place string fed to geocodePlace to exercise the errors-as-data path.
- `tool_schema_samples` (seed_method: `public_api`): Valid and malformed tool arg/result objects fed to the Zod input/output schemas for the pure schema-shape AC.

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1

**Requirement:** GIVEN the real place string 'Ogden, UT' WHEN geocodePlace runs against the real Google Geocoding API on the dev deployment THEN it returns { ok:true } with a center lat in [41.1,41.35], lng in [-112.1,-111.85], and formattedAddress containing 'Ogden'

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: real Google Geocoding API via createGeocodingProvider (GOOGLE_MAPS_API_KEY on the dev deployment)
- FLOW_REF: UC-AGT-01
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t "geocodePlace resolves Ogden via real Google Geocoding"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: geocodePlace is stubbed/mocked to return a canned hardcoded center instead of calling the real Google Geocoding API; the place string is never sent to the geocoder (empty request) so center is undefined or 0,0; the tool throws on a resolvable place instead of returning ok:true (errors-as-data contract broken)
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `ogden_place`
    - ACTION (api_client): call geocodePlace({ place: 'Ogden, UT' }) against the real geocoder with no override
    - MUST_OBSERVE: result.ok === true; result.center.lat >= 41.1 && result.center.lat <= 41.35; result.center.lng >= -112.1 && result.center.lng <= -111.85; result.formattedAddress.includes('Ogden') === true
    - MUST_NOT_OBSERVE: result.ok === false on a resolvable place; result.center.lat === 0 (0,0 fallback — empty geocode); result.center === undefined (no geocode result)

### AC-2

**Requirement:** GIVEN the resolved Ogden center and a radiusMi WHEN searchCuratedRoutes runs against the real curated_routes nearest query on the dev deployment THEN every returned route carries a server-computed distanceMi <= radiusMi, ordered nearest-first, and no route beyond the radius is returned

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment (real listCuratedRoutesInternal nearest, server distanceMi, riderReady gating)
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t "searchCuratedRoutes returns server distanceMi within radius nearest-first"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: distanceMi is faked/echoed from the model instead of the server-computed listCuratedRoutes distanceMi; the tool is stubbed to return a hardcoded routes array with no real curated_routes query; the radius filter is dropped so a 100+ mi route is returned as 'near Ogden' (the original Capitol-Reef bug); the curated query is mocked instead of hitting the real curated_routes data on the dev deployment
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `ogden_center_for_search`
    - ACTION (api_client): call searchCuratedRoutes({ center: {lat:41.223,lng:-111.973}, radiusMi: 30 }) against real curated_routes
    - MUST_OBSERVE: result.ok === true || result.errorCode === 'no_results' (thin coverage is honest); when routes.length >= 1: typeof routes[0].distanceMi === 'number' && routes[0].distanceMi > 0 (server-computed); when routes.length >= 2: routes[0].distanceMi <= routes[1].distanceMi (non-decreasing, nearest-first); every route satisfies route.distanceMi <= 30 (the radiusMi argument)
    - MUST_NOT_OBSERVE: a route with route.distanceMi > 30 (false proximity); routes[0].distanceMi === undefined (model-invented distance); 0 routes carry a numeric distanceMi (nothing server-computed)

### AC-3

**Requirement:** GIVEN a searchCuratedRoutes call with center omitted and a geocodePlace call on an unresolvable string WHEN each tool execute runs on the dev deployment THEN each returns a typed { ok:false, errorCode } value (center_required / not_found) and neither throws; no national/statewide search occurs

- TEST_TIER: `integration`  ·  VERIFICATION_SERVICE: Convex dev deployment + real Google Geocoding (errors-as-data path)
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t "tools return errors-as-data typed values"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: the tool throws an exception instead of returning a typed errors-as-data value (result.ok === false with a named errorCode); the tool is stubbed to return a canned ok:true result regardless of input so the missing-center path is never exercised; center-required is not enforced so the tool queries with center === undefined and returns national-best (false proximity); the unresolvable place silently returns ok:true with an empty 0,0 center
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `tool_schema_samples`
    - ACTION (api_client): call searchCuratedRoutes({ radiusMi: 30 }) with center omitted
    - MUST_OBSERVE: result.ok === false; result.errorCode === 'center_required'; typeof result.message === 'string' && result.message.length >= 1
    - MUST_NOT_OBSERVE: result.ok === true (a search performed with center === undefined); a national/statewide search with sort === 'best' and center absent; result.errorCode is empty/undefined (0 typed error returned)
- CASE 2 — start_ref `unresolvable_place`
    - ACTION (api_client): call geocodePlace({ place: 'zzzq not a real place 00000' }) against the real geocoder
    - MUST_OBSERVE: result.ok === false; result.errorCode === 'not_found' || result.errorCode === 'geocode_failed'; typeof result.errorCode === 'string' && result.errorCode.length >= 1
    - MUST_NOT_OBSERVE: result.ok === true (a fabricated center returned for garbage input); result.center resolved to 0,0 (empty geocode) returned as ok:true; result.errorCode is empty/undefined (nothing returned on an unresolvable place)

### AC-4

**Requirement:** GIVEN valid and malformed tool arg/result objects WHEN the tool inputSchema/outputSchema parse them THEN the discriminated union accepts both ok:true and ok:false variants, rejects a success variant with routes omitted, and rejects an empty place

- TEST_TIER: `unit`  ·  VERIFICATION_SERVICE: n/a — pure Zod validation, zero I/O
- UNIT_TEST_JUSTIFIED: Pure Zod schema-shape validation, zero I/O — the union discriminant and required-field rejection are deterministic parsing logic.
- VERIFY: `pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t "tool schemas are discriminated unions with real teeth"`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: inputSchema/outputSchema use z.any()/z.unknown() so any shape passes with no runtime validation; the outputSchema is not a discriminated union so an ok:false error coerces into an ok:true shape; the schema is a static pass-through stub that returns success:true for every input; the success variant validates with routes omitted (required-field constraint missing)
- EVIDENCE: `stdout` (required_capture: true)
- CASE 1 — start_ref `tool_schema_samples`
    - ACTION (api_client): safeParse { ok:true, routes:[{routeId:'r',name:'n',distanceMi:5,score:80,riderReady:true}] } → safeParse { ok:false, errorCode:'center_required', message:'m' } → safeParse { ok:true } with routes omitted → geocodePlace inputSchema safeParse { place:'' }
    - MUST_OBSERVE: outputSchema.safeParse(okWithRoutes).success === true; outputSchema.safeParse(errWithCode).success === true; outputSchema.safeParse({ ok:true }).success === false (routes required); geocodePlace.inputSchema.safeParse({ place:'' }).success === false
    - MUST_NOT_OBSERVE: an arbitrary object with no ok discriminant parses success === true; the routes-omitted success variant parses success === true; 0 validation issues reported on the empty place '' (nothing rejected)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | geocodePlace('Ogden, UT') against real Google returns ok:true with center.lat in [41.1,41.35] and center.lng in [-112.1,-111.85] | AC-1 | `pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t "geocodePlace resolves Ogden via real Google Geocoding"` |
| TC-2 | searchCuratedRoutes({center:Ogden,radiusMi:30}) returns only routes whose server distanceMi <= 30, nearest-first, with no distanceMi undefined | AC-2 | `pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t "searchCuratedRoutes returns server distanceMi within radius nearest-first"` |
| TC-3 | searchCuratedRoutes with center omitted returns {ok:false,errorCode:'center_required'} and geocodePlace on an unresolvable string returns {ok:false,errorCode:'not_found'} — neither throws | AC-3 | `pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t "tools return errors-as-data typed values"` |
| TC-4 | the tool outputSchema discriminated union accepts ok:true/ok:false variants and rejects a success variant with routes omitted and an empty place | AC-4 | `pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t "tool schemas are discriminated unions with real teeth"` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- `convex/actions/agent/spike/spikeTools.ts (NEW — geocodePlace + searchCuratedRoutes createTool defs + Zod schemas)`
- `convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts (NEW)`

**writeProhibited:**
- `convex/actions/agent/lib/models.ts (S2-T1's orchestrator tier — read-only here)`
- `convex/curatedRoutes.ts (consume listCuratedRoutesInternal read-only; do not edit)`
- `convex/actions/agent/providers/geocodingProvider.ts (consume read-only; do not edit)`
- `any @mariozechner/pi-ai file or teardown (additive spike only)`
- `the React Native app and convex/schema.ts`

## READING LIST

- `convex/actions/agent/providers/geocodingProvider.ts`:6-122 — GeocodeResult { lat, lng } + createGeocodingProvider(apiKey?).geocode(query, bias) — the real geocoder geocodePlace wraps
- `convex/curatedRoutes.ts`:130-266 — listCuratedRoutes nearest mode: server distanceMi, MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI=20, riderReady gating, buildRouteCard — what searchCuratedRoutes wraps (use listCuratedRoutesInternal)
- `convex/actions/agent/tools/discoverCuratedRoutes.ts`:1-45 — existing discovery tool arg/result validator shape (center/sort/limit, error result variant) to mirror as Zod errors-as-data
- `.spec/prds/route-agent-quality/10-technical-requirements/11-e2e-testing.md`:83-108 — §5b: geocodePlace + searchCuratedRoutes registered, SURF-gated results with distances, pinned gate
- `.spec/prds/route-agent-quality/08-uc-agt.md`:56-72 — UC-AGT-02 center-grounding + the 100+mi-as-near bug the server distanceMi filter must prevent

## CODE PATTERN

- Pattern: createTool({ id, description, inputSchema, outputSchema, execute: async (inputData, context) => ({ ok, ... }) }) with a discriminated-union outputSchema
- Pattern source: `@mastra/core/tools (Rosetta KB fact-graph createTool) + existing discoverCuratedRoutes result-union precedent`
- Anti-pattern: single destructured { context } execute arg (0.x); model('provider') object; z.any() schemas; throwing instead of errors-as-data; inventing distanceMi in the tool

## VERIFICATION GATES

- tests pass against real Google + real Convex dev: `pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts` → Exit 0
- typecheck: `pnpm type-check` → Exit 0
- lint: `pnpm exec biome check` → Exit 0
- no z.any/z.unknown in the tool schemas: `grep -nE "z\.any\(|z\.unknown\(" convex/actions/agent/spike/spikeTools.ts` → no matches
- createTool imported from the subpath, not the root: `grep -n "@mastra/core/tools" convex/actions/agent/spike/spikeTools.ts` → matches; and no 'from "@mastra/core"' root import of createTool

## AGENT ASSIGNMENT

- Implementer: `convex-implementer` — two @mastra/core tools wrap the real Google geocoder and curated-route query on the Convex surface.
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC test went red before green (TDD_STATE history).
- Integration/E2E coverage: PRIMARY AC hits real services; captured EVIDENCE shows the seeded MUST_OBSERVE value (not merely "tests passed").
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC.

## DEPENDENCIES

- Depends on: S2-T1
- Blocks: S2-T3

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "S2-T2",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "ogden_place": {
      "description": "Real place string 'Ogden, UT' and its expected Google-geocoded center (~41.223, -111.973) — the canonical §5b location; resolved through the real geocoder, not a fixture table.",
      "seed_method": "recorded_external",
      "records": [
        "place='Ogden, UT'",
        "expected center lat~41.223 lng~-111.973",
        "formattedAddress contains 'Ogden'"
      ]
    },
    "ogden_center_for_search": {
      "description": "The resolved Ogden center {lat:41.223,lng:-111.973} used as searchCuratedRoutes input, run against the REAL curated_routes data on the dev deployment (nearest mode, server distanceMi).",
      "seed_method": "recorded_external",
      "records": [
        "center={lat:41.223,lng:-111.973}",
        "radiusMi=30",
        "listCuratedRoutesInternal nearest, distanceMi server-computed, MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI=20"
      ]
    },
    "unresolvable_place": {
      "description": "A deliberately non-geocodable garbage place string fed to geocodePlace to exercise the errors-as-data path.",
      "seed_method": "public_api",
      "records": [
        "place='zzzq not a real place 00000'"
      ]
    },
    "tool_schema_samples": {
      "description": "Valid and malformed tool arg/result objects fed to the Zod input/output schemas for the pure schema-shape AC.",
      "seed_method": "public_api",
      "records": [
        "{ok:true,routes:[{routeId,name,distanceMi,score,riderReady}]}",
        "{ok:false,errorCode:'center_required',message}",
        "{ok:true} (routes omitted — must reject)",
        "{place:''} (empty — must reject)"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": false,
      "maps_to_ac": null,
      "description": "GIVEN the real place string 'Ogden, UT' WHEN geocodePlace runs against the real Google Geocoding API on the dev deployment THEN it returns { ok:true } with a center lat in [41.1,41.35], lng in [-112.1,-111.85], and formattedAddress containing 'Ogden'",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t \"geocodePlace resolves Ogden via real Google Geocoding\"",
      "scenario": {
        "id": "AC-1",
        "primary": true,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "real Google Geocoding API via createGeocodingProvider (GOOGLE_MAPS_API_KEY on the dev deployment)",
        "negative_control": {
          "would_fail_if": [
            "geocodePlace is stubbed/mocked to return a canned hardcoded center instead of calling the real Google Geocoding API",
            "the place string is never sent to the geocoder (empty request) so center is undefined or 0,0",
            "the tool throws on a resolvable place instead of returning ok:true (errors-as-data contract broken)"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "ogden_place",
            "action": {
              "actor": "api_client",
              "steps": [
                "call geocodePlace({ place: 'Ogden, UT' }) against the real geocoder with no override"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.ok === true",
                "result.center.lat >= 41.1 && result.center.lat <= 41.35",
                "result.center.lng >= -112.1 && result.center.lng <= -111.85",
                "result.formattedAddress.includes('Ogden') === true"
              ],
              "must_not_observe": [
                "result.ok === false on a resolvable place",
                "result.center.lat === 0 (0,0 fallback — empty geocode)",
                "result.center === undefined (no geocode result)"
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
      "maps_to_ac": null,
      "description": "GIVEN the resolved Ogden center and a radiusMi WHEN searchCuratedRoutes runs against the real curated_routes nearest query on the dev deployment THEN every returned route carries a server-computed distanceMi <= radiusMi, ordered nearest-first, and no route beyond the radius is returned",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t \"searchCuratedRoutes returns server distanceMi within radius nearest-first\"",
      "scenario": {
        "id": "AC-2",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment (real listCuratedRoutesInternal nearest, server distanceMi, riderReady gating)",
        "negative_control": {
          "would_fail_if": [
            "distanceMi is faked/echoed from the model instead of the server-computed listCuratedRoutes distanceMi",
            "the tool is stubbed to return a hardcoded routes array with no real curated_routes query",
            "the radius filter is dropped so a 100+ mi route is returned as 'near Ogden' (the original Capitol-Reef bug)",
            "the curated query is mocked instead of hitting the real curated_routes data on the dev deployment"
          ]
        },
        "evidence": {
          "artifact_type": "db_query",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "ogden_center_for_search",
            "action": {
              "actor": "api_client",
              "steps": [
                "call searchCuratedRoutes({ center: {lat:41.223,lng:-111.973}, radiusMi: 30 }) against real curated_routes"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.ok === true || result.errorCode === 'no_results' (thin coverage is honest)",
                "when routes.length >= 1: typeof routes[0].distanceMi === 'number' && routes[0].distanceMi > 0 (server-computed)",
                "when routes.length >= 2: routes[0].distanceMi <= routes[1].distanceMi (non-decreasing, nearest-first)",
                "every route satisfies route.distanceMi <= 30 (the radiusMi argument)"
              ],
              "must_not_observe": [
                "a route with route.distanceMi > 30 (false proximity)",
                "routes[0].distanceMi === undefined (model-invented distance)",
                "0 routes carry a numeric distanceMi (nothing server-computed)"
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
      "maps_to_ac": null,
      "description": "GIVEN a searchCuratedRoutes call with center omitted and a geocodePlace call on an unresolvable string WHEN each tool execute runs on the dev deployment THEN each returns a typed { ok:false, errorCode } value (center_required / not_found) and neither throws; no national/statewide search occurs",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t \"tools return errors-as-data typed values\"",
      "scenario": {
        "id": "AC-3",
        "primary": false,
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "Convex dev deployment + real Google Geocoding (errors-as-data path)",
        "negative_control": {
          "would_fail_if": [
            "the tool throws an exception instead of returning a typed errors-as-data value (result.ok === false with a named errorCode)",
            "the tool is stubbed to return a canned ok:true result regardless of input so the missing-center path is never exercised",
            "center-required is not enforced so the tool queries with center === undefined and returns national-best (false proximity)",
            "the unresolvable place silently returns ok:true with an empty 0,0 center"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "tool_schema_samples",
            "action": {
              "actor": "api_client",
              "steps": [
                "call searchCuratedRoutes({ radiusMi: 30 }) with center omitted"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.ok === false",
                "result.errorCode === 'center_required'",
                "typeof result.message === 'string' && result.message.length >= 1"
              ],
              "must_not_observe": [
                "result.ok === true (a search performed with center === undefined)",
                "a national/statewide search with sort === 'best' and center absent",
                "result.errorCode is empty/undefined (0 typed error returned)"
              ]
            }
          },
          {
            "start_ref": "unresolvable_place",
            "action": {
              "actor": "api_client",
              "steps": [
                "call geocodePlace({ place: 'zzzq not a real place 00000' }) against the real geocoder"
              ]
            },
            "end_state": {
              "must_observe": [
                "result.ok === false",
                "result.errorCode === 'not_found' || result.errorCode === 'geocode_failed'",
                "typeof result.errorCode === 'string' && result.errorCode.length >= 1"
              ],
              "must_not_observe": [
                "result.ok === true (a fabricated center returned for garbage input)",
                "result.center resolved to 0,0 (empty geocode) returned as ok:true",
                "result.errorCode is empty/undefined (nothing returned on an unresolvable place)"
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
      "maps_to_ac": null,
      "description": "GIVEN valid and malformed tool arg/result objects WHEN the tool inputSchema/outputSchema parse them THEN the discriminated union accepts both ok:true and ok:false variants, rejects a success variant with routes omitted, and rejects an empty place",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t \"tool schemas are discriminated unions with real teeth\"",
      "scenario": {
        "id": "AC-4",
        "primary": false,
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "n/a — pure Zod validation, zero I/O",
        "negative_control": {
          "would_fail_if": [
            "inputSchema/outputSchema use z.any()/z.unknown() so any shape passes with no runtime validation",
            "the outputSchema is not a discriminated union so an ok:false error coerces into an ok:true shape",
            "the schema is a static pass-through stub that returns success:true for every input",
            "the success variant validates with routes omitted (required-field constraint missing)"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "tool_schema_samples",
            "action": {
              "actor": "api_client",
              "steps": [
                "safeParse { ok:true, routes:[{routeId:'r',name:'n',distanceMi:5,score:80,riderReady:true}] }",
                "safeParse { ok:false, errorCode:'center_required', message:'m' }",
                "safeParse { ok:true } with routes omitted",
                "geocodePlace inputSchema safeParse { place:'' }"
              ]
            },
            "end_state": {
              "must_observe": [
                "outputSchema.safeParse(okWithRoutes).success === true",
                "outputSchema.safeParse(errWithCode).success === true",
                "outputSchema.safeParse({ ok:true }).success === false (routes required)",
                "geocodePlace.inputSchema.safeParse({ place:'' }).success === false"
              ],
              "must_not_observe": [
                "an arbitrary object with no ok discriminant parses success === true",
                "the routes-omitted success variant parses success === true",
                "0 validation issues reported on the empty place '' (nothing rejected)"
              ]
            },
            "unit_test_justified": "Pure Zod schema-shape validation, zero I/O — the union discriminant and required-field rejection are deterministic parsing logic."
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-1",
      "description": "geocodePlace('Ogden, UT') against real Google returns ok:true with center.lat in [41.1,41.35] and center.lng in [-112.1,-111.85]",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t \"geocodePlace resolves Ogden via real Google Geocoding\""
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-2",
      "description": "searchCuratedRoutes({center:Ogden,radiusMi:30}) returns only routes whose server distanceMi <= 30, nearest-first, with no distanceMi undefined",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t \"searchCuratedRoutes returns server distanceMi within radius nearest-first\""
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-3",
      "description": "searchCuratedRoutes with center omitted returns {ok:false,errorCode:'center_required'} and geocodePlace on an unresolvable string returns {ok:false,errorCode:'not_found'} — neither throws",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t \"tools return errors-as-data typed values\""
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "primary": false,
      "maps_to_ac": "AC-4",
      "description": "the tool outputSchema discriminated union accepts ok:true/ok:false variants and rejects a success variant with routes omitted and an empty place",
      "verify": "pnpm test convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts -t \"tool schemas are discriminated unions with real teeth\""
    }
  ]
}
-->
</details>
