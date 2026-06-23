# DISC-017: FIX: discovery slot shows curated cards only — never the generic IDLE_SUGGESTIONS planning prompts

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** ✅ Completed · **Priority:** P0 · **Effort:** S · **Estimate:** 90 min  
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer  
**Proposed By:** react-native-ui-planner  
**Agent rationale:** Pure plan-view UI state/branching change in index.tsx + ChatInput slot — react-native-ui-implementer; consumes the existing hook, no backend work.  

## Outcome

With curated routes available the slot shows real road names + mileage; while loading it shows nothing and when empty it shows a legible 'no nearby routes' message — the generic IDLE_SUGGESTIONS prompts never appear in the discovery path.

## Specification

index.tsx currently passes `suggestions={curatedPills.length > 0 ? curatedPills : IDLE_SUGGESTIONS}` to ChatInput (line 1381), so while curated routes load or come back empty the slot shows the generic IDLE_SUGGESTIONS planning prompts (lines 69-74) — violating UC-DISC-09 AC2/T-DISC-009 which require real road names + mileage and forbid hardcoded prompts. Change the discovery slot to be curated-only and to honor the hook's state: read {routes, isLoading, isEmpty} from useCuratedDiscovery (the hook already exposes these; line 260 currently destructures only `routes`). Pass curatedPills (built from routes) when present; pass nothing/empty while isLoading; render a legible 'no nearby routes' empty message when isEmpty. Remove the IDLE_SUGGESTIONS fallback and delete the constant from the discovery path. ChatInput's SuggestionChips already renders curated pills (name · {distanceMi}mi) distinctly with the copper road-variant icon (chat-input.tsx:95-147) and gates on `isIdle && !hasActiveRoute` (line 268); this task feeds it the right content and a sibling empty-state. The empty copy may be rendered inside the suggestion-chips slot (a small Text row) or via a tiny dedicated empty component — implementer's choice, but it must be legible and never tappable as a prompt. Maps to T-DISC-009 (content differs from IDLE_SUGGESTIONS; live name+mileage).

## Critical Constraints

- NEVER fall back to IDLE_SUGGESTIONS in the discovery slot. The current ternary `curatedPills.length > 0 ? curatedPills : IDLE_SUGGESTIONS` (index.tsx:1381) is the bug and MUST be removed.
- Remove the IDLE_SUGGESTIONS constant from the discovery render path entirely (index.tsx:69-74) — 'Plan a scenic ride' / 'Ride to the coast' / 'Find coffee nearby' / 'Avoid highways' must not reach the suggestion slot.
- Honor the hook's three states from useCuratedDiscovery: isLoading → render nothing; isEmpty → render a legible 'no nearby routes' empty copy; routes present → render the curated cards.
- Do NOT change the placeholder behavior owned by DISC-018; keep the existing discovery-invite placeholder.
- Empty-state copy must be a real message, not a generic planning prompt and not a card the rider could mistakenly tap.

## Acceptance Criteria

### AC-1: Curated routes present → real road names + mileage
*(PRIMARY)*
- **flow_ref:** `HF-DISC-09-EDGE` · `.spec/scenarios/UC-DISC-09/edge-cards-return-and-empty-catalog.scenario.md` *(bound 2026-06-23 by /kb-e2e-retrofit --apply)*
- **GIVEN** the plan view with no active route and useCuratedDiscovery returning >=1 curated route from live Convex
- **WHEN** the discovery slot renders
- **THEN** the slot shows curated cards bearing a real catalog road name and its mileage (e.g. 'Blue Ridge Parkway · 12mi'), and none of the IDLE_SUGGESTIONS strings appear
- **Test tier:** `integration` · **Service:** live Convex dev (api.curatedRoutes.listCuratedRoutes) via @testing-library/react-native
- **Verify:** `pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx` → `slotShowsCuratedNamesAndMileage`
- **Scenario** (start `live_catalog_located`):
  - must observe: getAllByTestId(/^discovery-suggestion-pill-/).length >= 1; at least one pill label matches the regex /.+ . \d+mi$/ (a real road name followed by ' . {n}mi', e.g. 'Blue Ridge Parkway . 12mi'); the rendered pill label === a real catalog road name + mileage (matches a name from listCuratedRoutes, not a constant)
  - must NOT observe: getAllByTestId(/^discovery-suggestion-pill-/).length === 0 (no curated pills); queryByText('Plan a scenic ride') !== null; queryByText('Ride to the coast') !== null; queryByText('Find coffee nearby') !== null; queryByText('Avoid highways') !== null
  - negative control (would fail if): would fail if the slot falls back to the static IDLE_SUGGESTIONS array (generic prompts shown); would fail if useCuratedDiscovery is disconnected/stubbed to [] so prompts or nothing shows; would fail if the cards render hardcoded/generic prompt text instead of live road names

### AC-2: Loading → slot shows nothing
- **GIVEN** the plan view with useCuratedDiscovery still loading (routes undefined)
- **WHEN** the discovery slot renders before resolve
- **THEN** the slot shows no suggestion cards and no IDLE_SUGGESTIONS prompts and no empty copy
- **Test tier:** `integration` · **Service:** live Convex dev via @testing-library/react-native
- **Verify:** `pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx` → `slotEmptyWhileLoading`
- **Scenario** (start `live_catalog_loading`):
  - must observe: queryAllByTestId(/^discovery-suggestion-pill-/).length === 0 (zero pills while loading); queryByText(/no nearby routes/i) === null (empty copy not shown yet)
  - must NOT observe: queryByText('Plan a scenic ride') !== null (any IDLE_SUGGESTIONS string); queryByText('Avoid highways') !== null; any discovery-suggestion-pill row present while loading; the empty 'no nearby routes' copy shown while still loading (premature empty state)
  - negative control (would fail if): would fail if the loading state falls back to the static IDLE_SUGGESTIONS array (prompts shown while loading); would fail if loading prematurely renders the empty 'no nearby routes' copy

### AC-3: Empty → legible 'no nearby routes' copy, never generic prompts
- **GIVEN** the plan view with useCuratedDiscovery resolved to [] (isEmpty)
- **WHEN** the discovery slot renders
- **THEN** the slot shows a legible 'no nearby routes' message and none of the IDLE_SUGGESTIONS prompts
- **Test tier:** `integration` · **Service:** live Convex dev via @testing-library/react-native
- **Verify:** `pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx` → `slotShowsLegibleEmptyCopyNotPrompts`
- **Scenario** (start `live_catalog_empty`):
  - must observe: getByText(/no nearby routes/i) !== null (a legible empty message containing 'no nearby routes', or the ratified DESIGN-S01-003 copy)
  - must NOT observe: any tappable curated pill present (getAllByTestId(/^discovery-suggestion-pill-/).length >= 1); queryByText('Plan a scenic ride') !== null; queryByText('Find coffee nearby') !== null; queryByText('Ride to the coast') !== null; queryByText('Avoid highways') !== null; a blank slot with no feedback message (empty — rider gets nothing)
  - negative control (would fail if): would fail if the empty state falls back to the static IDLE_SUGGESTIONS array; would fail if the empty state renders nothing (slot disconnected — rider sees no feedback)

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | With live curated routes, slot pills carry real road name + 'mi' mileage and no IDLE_SUGGESTIONS strings. | AC-1 | `pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx -t slotShowsCuratedNamesAndMileage` |
| TC-2 | While loading, slot has zero pills and zero prompts and no empty copy. | AC-2 | `pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx -t slotEmptyWhileLoading` |
| TC-3 | When empty, slot shows 'no nearby routes' copy and no IDLE_SUGGESTIONS prompts. | AC-3 | `pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx -t slotShowsLegibleEmptyCopyNotPrompts` |

## Reading List

- `app/(app)/(tabs)/index.tsx` (68-74, 259-264, 1375-1391) — PRIMARY — IDLE_SUGGESTIONS constant, curatedPills construction (currently only `routes`), and the buggy `curatedPills.length > 0 ? curatedPills : IDLE_SUGGESTIONS` prop to remove
- `components/chat/chat-input.tsx` (75-150, 264-274) — SuggestionChips rendering of CuratedPill (name · mi + road icon) and the isIdle && !hasActiveRoute visibility gate the empty-state must sit beside
- `hooks/use-curated-discovery.ts` (33-80) — the {routes,isLoading,isEmpty} contract to destructure and branch on
- `.spec/prds/mvp/05-uc-disc.md` (63-77) — UC-DISC-09 AC1/AC2 — cards over input show real road name + mileage, distinct from IDLE_SUGGESTIONS
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (79-83) — T-DISC-009 — content must differ from IDLE_SUGGESTIONS; live name+mileage

## Guardrails

- ONE slot, state-driven (loading/empty/present) — no per-state component files; branch in place.
- Empty copy via useSemanticTheme typography/color tokens; no hardcoded hex.
- Do not reintroduce IDLE_SUGGESTIONS anywhere on the discovery path.

## Design

- ref: DESIGN-S01-003 (home-empty-state: discovery-invite + empty-catalog messaging over surface.glass scrim)
- ref: DESIGN-S01-001 (suggestion-card copper accent + road icon)
- ref: 10-design-system.md §1 (surface.glass @72% for plan-view overlays)

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check 'app/(app)/(tabs)/index.tsx' 'app/(app)/(tabs)/index.suggestions.integration.test.tsx'` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: PRIMARY test must FAIL on the current IDLE_SUGGESTIONS fallback (prompts visible) before the fix` |
| human_gate | `Folds into T-DISC-009 (real device): slot shows live name+mileage, never IDLE_SUGGESTIONS, legible empty copy when no nearby routes` |

## Coding Standards

- Delete dead IDLE_SUGGESTIONS references from the discovery path; if unused elsewhere, remove the constant.
- No `any`; curatedPills typed as CuratedPill[].
- Integration test renders real screen against live Convex; no mocked hook for the verification service.

## Dependencies

- Depends on: DISC-002 (hook {routes,isLoading,isEmpty})
- Blocks: DISC-018 (visibility logic builds on a curated-only slot)
- Parallel: DISC-016 (same file — sequence to avoid conflict)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "live_catalog_located": {
      "description": "plan view against live Convex, signed-in, no active route, useCurrentLocation at Asheville \u2192 useCuratedDiscovery returns >=1 route with name + distanceMi",
      "seed_method": "migration_fixture",
      "records": [
        "seeded catalog",
        "current location {lat:35.5951,lng:-82.5515}"
      ]
    },
    "live_catalog_loading": {
      "description": "plan view rendered at the instant the curated query is still pending (routes undefined)",
      "seed_method": "migration_fixture",
      "records": [
        "query in-flight; isLoading true"
      ]
    },
    "live_catalog_empty": {
      "description": "plan view with a location/bbox yielding zero curated matches",
      "seed_method": "migration_fixture",
      "records": [
        "isEmpty true; routes === []"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN the plan view with no active route and useCuratedDiscovery returning >=1 curated route from live Convex WHEN the discovery slot renders THEN the slot shows curated cards bearing a real catalog road name and its mileage (e.g. 'Blue Ridge Parkway \u00b7 12mi'), and none of the IDLE_SUGGESTIONS strings appear",
      "verify": "pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx` \u2192 `slotShowsCuratedNamesAndMileage",
      "scenario": {
        "start_ref": "live_catalog_located",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev (api.curatedRoutes.listCuratedRoutes) via @testing-library/react-native",
        "negative_control": {
          "would_fail_if": [
            "would fail if the slot falls back to the static IDLE_SUGGESTIONS array (generic prompts shown)",
            "would fail if useCuratedDiscovery is disconnected/stubbed to [] so prompts or nothing shows",
            "would fail if the cards render hardcoded/generic prompt text instead of live road names"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "live_catalog_located",
            "action": {
              "actor": "user",
              "steps": [
                "render the plan view against live Convex with no active route and a real location",
                "await curated routes to resolve",
                "read the discovery-suggestion-pill rows"
              ]
            },
            "end_state": {
              "must_observe": [
                "getAllByTestId(/^discovery-suggestion-pill-/).length >= 1",
                "at least one pill label matches the regex /.+ . \\d+mi$/ (a real road name followed by ' . {n}mi', e.g. 'Blue Ridge Parkway . 12mi')",
                "the rendered pill label === a real catalog road name + mileage (matches a name from listCuratedRoutes, not a constant)"
              ],
              "must_not_observe": [
                "getAllByTestId(/^discovery-suggestion-pill-/).length === 0 (no curated pills)",
                "queryByText('Plan a scenic ride') !== null",
                "queryByText('Ride to the coast') !== null",
                "queryByText('Find coffee nearby') !== null",
                "queryByText('Avoid highways') !== null"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN the plan view with useCuratedDiscovery still loading (routes undefined) WHEN the discovery slot renders before resolve THEN the slot shows no suggestion cards and no IDLE_SUGGESTIONS prompts and no empty copy",
      "verify": "pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx` \u2192 `slotEmptyWhileLoading",
      "scenario": {
        "start_ref": "live_catalog_loading",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev via @testing-library/react-native",
        "negative_control": {
          "would_fail_if": [
            "would fail if the loading state falls back to the static IDLE_SUGGESTIONS array (prompts shown while loading)",
            "would fail if loading prematurely renders the empty 'no nearby routes' copy"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "live_catalog_loading",
            "action": {
              "actor": "user",
              "steps": [
                "render the plan view before the curated query resolves (isLoading true)",
                "query the slot for any suggestion pill or prompt text"
              ]
            },
            "end_state": {
              "must_observe": [
                "queryAllByTestId(/^discovery-suggestion-pill-/).length === 0 (zero pills while loading)",
                "queryByText(/no nearby routes/i) === null (empty copy not shown yet)"
              ],
              "must_not_observe": [
                "queryByText('Plan a scenic ride') !== null (any IDLE_SUGGESTIONS string)",
                "queryByText('Avoid highways') !== null",
                "any discovery-suggestion-pill row present while loading",
                "the empty 'no nearby routes' copy shown while still loading (premature empty state)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN the plan view with useCuratedDiscovery resolved to [] (isEmpty) WHEN the discovery slot renders THEN the slot shows a legible 'no nearby routes' message and none of the IDLE_SUGGESTIONS prompts",
      "verify": "pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx` \u2192 `slotShowsLegibleEmptyCopyNotPrompts",
      "scenario": {
        "start_ref": "live_catalog_empty",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev via @testing-library/react-native",
        "negative_control": {
          "would_fail_if": [
            "would fail if the empty state falls back to the static IDLE_SUGGESTIONS array",
            "would fail if the empty state renders nothing (slot disconnected \u2014 rider sees no feedback)"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "live_catalog_empty",
            "action": {
              "actor": "user",
              "steps": [
                "render the plan view with a bbox/location that yields zero curated matches against live Convex",
                "read the slot"
              ]
            },
            "end_state": {
              "must_observe": [
                "getByText(/no nearby routes/i) !== null (a legible empty message containing 'no nearby routes', or the ratified DESIGN-S01-003 copy)"
              ],
              "must_not_observe": [
                "any tappable curated pill present (getAllByTestId(/^discovery-suggestion-pill-/).length >= 1)",
                "queryByText('Plan a scenic ride') !== null",
                "queryByText('Find coffee nearby') !== null",
                "queryByText('Ride to the coast') !== null",
                "queryByText('Avoid highways') !== null",
                "a blank slot with no feedback message (empty \u2014 rider gets nothing)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "With live curated routes, slot pills carry real road name + 'mi' mileage and no IDLE_SUGGESTIONS strings.",
      "maps_to_ac": "AC-1",
      "verify": "pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx -t slotShowsCuratedNamesAndMileage"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "While loading, slot has zero pills and zero prompts and no empty copy.",
      "maps_to_ac": "AC-2",
      "verify": "pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx -t slotEmptyWhileLoading"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "When empty, slot shows 'no nearby routes' copy and no IDLE_SUGGESTIONS prompts.",
      "maps_to_ac": "AC-3",
      "verify": "pnpm test app/(app)/(tabs)/index.suggestions.integration.test.tsx -t slotShowsLegibleEmptyCopyNotPrompts"
    }
  ]
}
-->
