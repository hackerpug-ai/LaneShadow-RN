# CAPS-S07-T10 — Mapbox Search Box idle autocomplete actions
> Status: ✅ Done
> Cycle: 2
> Commit: 454f230a
> Updated: 2026-05-06T12:05:42-07:00

```
TASK_TYPE:  FEATURE
STATUS:     Done (carried forward)
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     sprint-07-context-capsule-map-controls -> ./SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-MAP-01

RUNTIME_COMMANDS:
  test:      pnpm test -- server/convex/__tests__/places-autocomplete.test.ts
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched server/convex/actions/places.ts server/convex/__tests__/places-autocomplete.test.ts
```

---

## Sprint 7 Carry-Forward

This task was originally executed during Sprint 06 remediation and was moved into Sprint 07 on 2026-05-07 so final autocomplete evidence could live with the post-redesign idle-screen work. Implementation evidence is preserved at commit `454f230a`; Sprint 07 owns backend/iOS/Android/manual-status verification under `gate-evidence/autocomplete/`.

## OUTCOME

iOS and Android can request up to three Mapbox Search Box place suggestions for idle-input typing and retrieve a selected suggestion's coordinates through Convex.

---

## CRITICAL CONSTRAINTS

- **MUST** keep Mapbox Search Box API access server-side in Convex; native clients do not call Mapbox Search directly.
- **MUST** enforce a maximum of 3 suggestions in `suggestPlaces` regardless of provider defaults or caller input.
- **MUST** require and forward a caller-provided `sessionToken` to both `/suggest` and `/retrieve`.
- **NEVER** add Google Places SDK/API dependencies or call Google Places endpoints for this Sprint 07 carry-forward.
- **STRICTLY** preserve existing `reverseGeocode` behavior and public action name.

---

## DONE WHEN

- [x] AC-1: `actions/places:suggestPlaces` returns at most three mapped suggestions for query length >= 2 (PRIMARY)
- [x] AC-2: `suggestPlaces` returns `[]` without upstream fetch for trimmed queries shorter than 2 characters
- [x] AC-3: `suggestPlaces` forwards `session_token`, `country=US`, `language=en`, `limit=3`, and optional `proximity=lng,lat`
- [x] AC-4: `actions/places:retrievePlace` maps a Mapbox suggestion id to `{id,name,label,lat,lng,featureType}`
- [x] AC-5: Mapbox upstream failures return typed Convex errors without leaking `MAPBOX_ACCESS_TOKEN`
- [x] Runtime commands above exit 0

---

## ACCEPTANCE CRITERIA

### AC-1: Suggest places happy path [PRIMARY]
- **GIVEN** Mapbox Search Box `/suggest` returns five suggestions for query `Big Sur`
- **WHEN** `actions/places:suggestPlaces` is invoked with a valid `sessionToken`
- **THEN** the action returns exactly the first three `PlaceSuggestion` DTOs with `id`, `name`, `label`, optional `secondaryText`, `featureType`, and optional `distanceMeters`
- **VERIFY:** `pnpm test -- server/convex/__tests__/places-autocomplete.test.ts`

### AC-2: Short query avoids network
- **GIVEN** query text trims to one character
- **WHEN** `suggestPlaces` runs
- **THEN** it returns an empty `suggestions` array and `fetch` is not called
- **VERIFY:** `pnpm test -- server/convex/__tests__/places-autocomplete.test.ts`

### AC-3: Search Box request contract
- **GIVEN** query `Santa Cruz` and proximity `{lat:36.97,lng:-122.03}`
- **WHEN** `suggestPlaces` builds the Mapbox request
- **THEN** the URL contains `q`, `session_token`, `limit=3`, `country=US`, `language=en`, and `proximity=-122.03,36.97`
- **VERIFY:** `pnpm test -- server/convex/__tests__/places-autocomplete.test.ts`

### AC-4: Retrieve selected place coordinates
- **GIVEN** Mapbox Search Box `/retrieve/{mapboxId}` returns a feature with coordinates
- **WHEN** `actions/places:retrievePlace` runs with the same `sessionToken`
- **THEN** it returns `SelectedPlace` with `lat/lng` converted from Mapbox `[lng,lat]`
- **VERIFY:** `pnpm test -- server/convex/__tests__/places-autocomplete.test.ts`

### AC-5: Upstream failure is safe
- **GIVEN** Mapbox returns HTTP 500 or malformed JSON
- **WHEN** suggest or retrieve runs
- **THEN** the action throws a typed Convex error that omits access tokens and provider response secrets
- **VERIFY:** `pnpm test -- server/convex/__tests__/places-autocomplete.test.ts`

---

## TEST CRITERIA

| ID | Statement | Maps To | Type |
|----|-----------|---------|------|
| TC-1 | `suggestPlaces` returns three suggestions when Mapbox returns five suggestions | AC-1 | happy_path |
| TC-2 | `suggestPlaces` returns zero suggestions when trimmed query length is one | AC-2 | edge_case |
| TC-3 | `fetch` is not called when trimmed query length is one | AC-2 | edge_case |
| TC-4 | Suggest URL contains `limit=3` when query length is valid | AC-3 | contract |
| TC-5 | Suggest URL contains `proximity=-122.03,36.97` when proximity is supplied | AC-3 | contract |
| TC-6 | `retrievePlace` returns latitude from the second Mapbox coordinate value | AC-4 | happy_path |
| TC-7 | Convex error message excludes `MAPBOX_ACCESS_TOKEN` when Mapbox fails | AC-5 | security |

---

## SCOPE

**writeAllowed:**
- `server/convex/actions/places.ts` (MODIFY)
- `server/convex/__tests__/places-autocomplete.test.ts` (NEW)
- `server/convex/errors.ts` (MODIFY only if new typed error constants are required)
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` (READ-ONLY contract reference)
- `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` (READ-ONLY contract reference)

**writeProhibited:**
- `ios/**` and `android/**` implementation changes - owned by platform autocomplete remediation tasks
- `server/convex/actions/agent/providers/placesProvider.ts` - Google Places agent provider is not the idle autocomplete path
- Any route-planning, map-camera, or polyline code

---

## BOUNDARIES

✅ **Always:**
- Use `MAPBOX_ACCESS_TOKEN` from existing server env handling.
- Trim and collapse whitespace before sending `q`.
- Return a small mobile DTO rather than raw Mapbox JSON.
- Keep `retrievePlace` separate from `suggestPlaces`.

⚠️ **Ask First:**
- Adding billing-affecting route ETA, Matrix API, or search-along-route fields.
- Introducing a new package dependency.
- Changing existing Google Places agent tooling.

---

## DELIVERABLE

- `server/convex/actions/places.ts` (MODIFY): add `suggestPlaces`, `retrievePlace`, DTO validators, request builders, and safe error mapping.
- `server/convex/__tests__/places-autocomplete.test.ts` (NEW): contract tests for max-3 suggestions, no-fetch short query, request URL, retrieve mapping, and failure safety.

---

## AGENT INSTRUCTIONS

For each AC: RED -> GREEN -> REFACTOR. Start with `places-autocomplete.test.ts` using mocked `global.fetch`. Do not touch mobile clients in this backend task; the mobile tasks consume the new Convex contract after this is green.

---

## READING LIST

1. `server/convex/actions/places.ts` - existing Mapbox reverse-geocode patterns and validators
2. `server/convex/__tests__/places.test.ts` - current mocked-fetch contract-test style
3. `server/convex/actions/agent/lib/reliability.ts` - timeout/retry helper pattern
4. `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` - Swift action enum and protocol surface
5. `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` - Kotlin Convex action wrapper pattern
6. `https://docs.mapbox.com/api/search/search-box/` - Mapbox Search Box suggest/retrieve request contract

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Autocomplete tests | `pnpm test -- server/convex/__tests__/places-autocomplete.test.ts` | Exit 0 |
| Typecheck | `pnpm type-check:native` | Exit 0 |
| Biome | `pnpm exec biome check --no-errors-on-unmatched server/convex/actions/places.ts server/convex/__tests__/places-autocomplete.test.ts` | Exit 0 |
| Convex build | `pnpm --dir server run convex:dev -- --once` | Exit 0 |

---

## OUT OF SCOPE

- Native idle input rendering
- Manual PlanRideSheet
- Routing, camera movement, markers for selected suggestions
- Google Places SDK/API integration

---

## REVIEW

Reviewer must verify that `suggestPlaces` and `retrievePlace` use Mapbox Search Box, enforce `limit=3`, pass `session_token`, and never expose raw provider payloads or secrets to mobile.

---

## DESIGN

**References:** `.spec/design/system/views/idle-screen/README.md`, `SPRINT.md`, `https://docs.mapbox.com/api/search/search-box/`

**Pattern:** Small Convex action DTOs isolate native clients from provider-specific JSON.

**Pattern source:** `server/convex/actions/places.ts` reverse-geocode handler and `server/convex/__tests__/places.test.ts`.

**Anti-pattern:** Adding native Google Places SDKs or using the existing Google Places agent provider for idle autocomplete.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-REM-CVX-T01
- **Blocks:** CAPS-S07-T11, CAPS-S07-T12, CAPS-S07-T13

---

## CODING STANDARDS

- `RULES.md` section "Convex Backend"
- `convex/_generated/ai/guidelines.md`
- `/Users/justinrich/Projects/brain/docs/REQUIREMENT-TRACKING.md`
- `/Users/justinrich/Projects/brain/docs/TDD-METHODOLOGY.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN Mapbox Search Box returns five suggestions WHEN actions/places:suggestPlaces is invoked THEN exactly three PlaceSuggestion DTOs return",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN query text trims to one character WHEN suggestPlaces runs THEN it returns empty suggestions without upstream fetch",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN query and proximity WHEN suggestPlaces builds the request THEN q/session_token/limit/country/language/proximity are forwarded",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN Mapbox retrieve returns coordinates WHEN retrievePlace runs THEN SelectedPlace returns lat/lng converted from Mapbox coordinate order",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN Mapbox fails WHEN suggest or retrieve runs THEN typed Convex errors omit access tokens and secrets",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "suggestPlaces returns three suggestions when Mapbox returns five suggestions",
      "maps_to_ac": "AC-1",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "suggestPlaces returns zero suggestions when trimmed query length is one",
      "maps_to_ac": "AC-2",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "fetch is not called when trimmed query length is one",
      "maps_to_ac": "AC-2",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Suggest URL contains limit=3 when query length is valid",
      "maps_to_ac": "AC-3",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Suggest URL contains proximity=-122.03,36.97 when proximity is supplied",
      "maps_to_ac": "AC-3",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "retrievePlace returns latitude from the second Mapbox coordinate value",
      "maps_to_ac": "AC-4",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Convex error message excludes MAPBOX_ACCESS_TOKEN when Mapbox fails",
      "maps_to_ac": "AC-5",
      "verify": "pnpm test -- server/convex/__tests__/places-autocomplete.test.ts",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    }
  ]
}
-->
