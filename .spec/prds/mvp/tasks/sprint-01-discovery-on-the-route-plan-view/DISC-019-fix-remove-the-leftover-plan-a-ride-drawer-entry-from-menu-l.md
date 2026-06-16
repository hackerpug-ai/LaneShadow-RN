# DISC-019: FIX: remove the leftover 'Plan a ride' drawer entry from menu-layout.tsx

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** To Do · **Priority:** P2 · **Effort:** XS · **Estimate:** 30 min  
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer  
**Proposed By:** react-native-ui-planner  
**Agent rationale:** Trivial drawer-config edit in an RN layout component — react-native-ui-implementer; no backend or routing change.  

## Outcome

The rendered drawer has no 'Plan a ride' item and no entry resolves to a discover route, while Settings, Saved, and Sessions remain intact.

## Specification

menu-layout.tsx still lists a 'Plan a ride' item in the Navigate section (lines 96-102, testID drawer-plan-a-ride, navigating to /(app)/(tabs)). Per 07-ui-infrastructure.md §4, 09-routing.md v3.0.0 Route Delta, and UC-DISC-11, this entry is removed: the route plan view is already the default landing and the full chat is reached via the footer chat-view button, not a drawer entry. Delete the 'Plan a ride' item object from internalMenuSections' Navigate items, leaving Settings and Saved (and the separate sessionsSection) intact. Verify no remaining drawer item resolves to a discover route. Note: the Navigate item's `active: activeTab === 'index'` was only on the removed item — ensure removal does not leave a dangling reference. Maps to T-DISC-011 (no 'Plan a ride'/'Discover' drawer entry; only standard nav entries).

## Critical Constraints

- Remove the 'Plan a ride' Navigate item (testID drawer-plan-a-ride, menu-layout.tsx:96-102) per the v3.0.0 route delta — chat is integral to the plan view, reached via the footer button.
- Do NOT remove or break Settings, Saved, or the Sessions section.
- Do NOT add or leave any 'Discover' drawer entry — no entry may resolve to a dedicated discover route (none exists).
- Do NOT change navigation targets of the remaining items (Settings → /(app)/(tabs)/settings, Saved → /(app)/(tabs)/saved-routes).

## Acceptance Criteria

### AC-1: Drawer has no 'Plan a ride' item
*(PRIMARY)*
- **GIVEN** the rendered MenuLayout drawer
- **WHEN** the drawer is opened
- **THEN** there is no item labelled 'Plan a ride' and no node with testID drawer-plan-a-ride, and no item navigates to a discover route
- **Test tier:** `integration` · **Service:** @testing-library/react-native rendering the real MenuLayout
- **Verify:** `pnpm test components/layouts/menu-layout.integration.test.tsx` → `drawerHasNoPlanARideEntry`
- **Scenario** (start `drawer_open`):
  - must observe: queryByTestId('drawer-plan-a-ride') === null; queryByText('Plan a ride') === null; queryByText('Discover') === null
  - must NOT observe: queryByText('Plan a ride') !== null (label still rendered); queryByText('Discover') !== null (a 'Discover' label rendered); queryByTestId('drawer-plan-a-ride') !== null (retired testID still present); an empty drawer with 0 navigation items (over-deletion)
  - negative control (would fail if): would fail if the 'Plan a ride' drawer item is hardcoded back in (still present); would fail if a 'Discover' entry exists / resolves to a discover route; would fail if the drawer items array is stubbed/static so the removed item reappears

### AC-2: Settings, Saved, Sessions remain intact
- **GIVEN** the rendered MenuLayout drawer
- **WHEN** the drawer is opened
- **THEN** the Settings and Saved items render and the Sessions section is present
- **Test tier:** `integration` · **Service:** live Convex dev (planningSessions.listSessions) via @testing-library/react-native
- **Verify:** `pnpm test components/layouts/menu-layout.integration.test.tsx` → `settingsSavedSessionsRemain`
- **Scenario** (start `drawer_open`):
  - must observe: getByText('Settings') !== null ('Settings' item present); getByText('Saved') !== null ('Saved' item present); the 'Sessions' section present (getByText('Sessions') !== null OR a session row OR getByText('No sessions yet'))
  - must NOT observe: queryByText('Settings') === null (missing Settings); queryByText('Saved') === null (missing Saved); queryByText('Sessions') === null with zero session rows (Sessions section entirely missing); an empty drawer / 0 navigation items rendered
  - negative control (would fail if): would fail if removing 'Plan a ride' also dropped the Settings/Saved items or the Sessions section; would fail if listSessions is disconnected/stubbed so the Sessions section renders nothing

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | queryByTestId('drawer-plan-a-ride') and queryByText('Plan a ride') both null; no 'Discover' label. | AC-1 | `pnpm test components/layouts/menu-layout.integration.test.tsx -t drawerHasNoPlanARideEntry` |
| TC-2 | Settings, Saved items and the Sessions section still render. | AC-2 | `pnpm test components/layouts/menu-layout.integration.test.tsx -t settingsSavedSessionsRemain` |

## Reading List

- `components/layouts/menu-layout.tsx` (60-123) — PRIMARY — internalMenuSections Navigate items (the 'Plan a ride' item at 96-102 to delete) + sessionsSection to preserve
- `.spec/prds/mvp/09-technical-requirements/09-routing.md` (67-79) — v3.0.0 Route Delta — drawer 'Plan a ride' entry DELETED
- `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` (43-45, 59) — no drawer 'Plan a ride' entry; retired testID drawer-plan-a-ride
- `.spec/prds/mvp/05-uc-disc.md` (99-113) — UC-DISC-11 AC1/AC2 — no separate discovery surface / drawer-hidden chat
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (91-95) — T-DISC-011 — drawer has only standard entries, no 'Plan a ride'/'Discover'

## Guardrails

- Drawer entries are data, not per-route files — edit the items array in place.
- Preserve all remaining testIDs and nav targets.
- No styling changes; tokens unchanged.

## Design

- ref: 09-routing.md v3.0.0 Route Delta (drawer 'Plan a ride' DELETED)
- ref: 07-ui-infrastructure.md §4 (no drawer 'Plan a ride' entry)

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test components/layouts/menu-layout.integration.test.tsx` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check components/layouts/menu-layout.tsx components/layouts/menu-layout.integration.test.tsx` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-bug: AC-1 must FAIL on the current drawer (drawer-plan-a-ride present) before removal` |
| human_gate | `Folds into T-DISC-011 (real device): open drawer → only standard entries, no 'Plan a ride'/'Discover'` |

## Coding Standards

- No `any`; keep DrawerMenuSection/Item typing.
- Integration test renders the real MenuLayout against live Convex (listSessions); no mocked drawer.

## Dependencies

- Depends on: None
- Blocks: None
- Parallel: DISC-002, DISC-016, DISC-017, DISC-018, DISC-020

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "drawer_open": {
      "description": "MenuLayout rendered with menuOpen=true, signed-in, against live Convex (planningSessions.listSessions resolves)",
      "seed_method": "migration_fixture",
      "records": [
        "a signed-in session",
        "0 or more planning_sessions rows"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN the rendered MenuLayout drawer WHEN the drawer is opened THEN there is no item labelled 'Plan a ride' and no node with testID drawer-plan-a-ride, and no item navigates to a discover route",
      "verify": "pnpm test components/layouts/menu-layout.integration.test.tsx` \u2192 `drawerHasNoPlanARideEntry",
      "scenario": {
        "start_ref": "drawer_open",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "@testing-library/react-native rendering the real MenuLayout",
        "negative_control": {
          "would_fail_if": [
            "would fail if the 'Plan a ride' drawer item is hardcoded back in (still present)",
            "would fail if a 'Discover' entry exists / resolves to a discover route",
            "would fail if the drawer items array is stubbed/static so the removed item reappears"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "drawer_open",
            "action": {
              "actor": "user",
              "steps": [
                "render MenuLayout with menuOpen true against live Convex",
                "queryByTestId('drawer-plan-a-ride')",
                "queryByText('Plan a ride')",
                "queryByText('Discover')"
              ]
            },
            "end_state": {
              "must_observe": [
                "queryByTestId('drawer-plan-a-ride') === null",
                "queryByText('Plan a ride') === null",
                "queryByText('Discover') === null"
              ],
              "must_not_observe": [
                "queryByText('Plan a ride') !== null (label still rendered)",
                "queryByText('Discover') !== null (a 'Discover' label rendered)",
                "queryByTestId('drawer-plan-a-ride') !== null (retired testID still present)",
                "an empty drawer with 0 navigation items (over-deletion)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN the rendered MenuLayout drawer WHEN the drawer is opened THEN the Settings and Saved items render and the Sessions section is present",
      "verify": "pnpm test components/layouts/menu-layout.integration.test.tsx` \u2192 `settingsSavedSessionsRemain",
      "scenario": {
        "start_ref": "drawer_open",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev (planningSessions.listSessions) via @testing-library/react-native",
        "negative_control": {
          "would_fail_if": [
            "would fail if removing 'Plan a ride' also dropped the Settings/Saved items or the Sessions section",
            "would fail if listSessions is disconnected/stubbed so the Sessions section renders nothing"
          ]
        },
        "evidence": {
          "artifact_type": "screenshot",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "drawer_open",
            "action": {
              "actor": "user",
              "steps": [
                "render MenuLayout with menuOpen true",
                "query for 'Settings', 'Saved', and the 'Sessions' section title"
              ]
            },
            "end_state": {
              "must_observe": [
                "getByText('Settings') !== null ('Settings' item present)",
                "getByText('Saved') !== null ('Saved' item present)",
                "the 'Sessions' section present (getByText('Sessions') !== null OR a session row OR getByText('No sessions yet'))"
              ],
              "must_not_observe": [
                "queryByText('Settings') === null (missing Settings)",
                "queryByText('Saved') === null (missing Saved)",
                "queryByText('Sessions') === null with zero session rows (Sessions section entirely missing)",
                "an empty drawer / 0 navigation items rendered"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "queryByTestId('drawer-plan-a-ride') and queryByText('Plan a ride') both null; no 'Discover' label.",
      "maps_to_ac": "AC-1",
      "verify": "pnpm test components/layouts/menu-layout.integration.test.tsx -t drawerHasNoPlanARideEntry"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Settings, Saved items and the Sessions section still render.",
      "maps_to_ac": "AC-2",
      "verify": "pnpm test components/layouts/menu-layout.integration.test.tsx -t settingsSavedSessionsRemain"
    }
  ]
}
-->
