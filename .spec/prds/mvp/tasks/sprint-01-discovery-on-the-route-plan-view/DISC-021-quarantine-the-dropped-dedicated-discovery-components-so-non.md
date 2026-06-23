# DISC-021: Quarantine the dropped dedicated-discovery components so none are imported by an active screen/hook (lands LAST)

**Sprint:** [SPRINT.md](./SPRINT.md)  
**Type:** FEATURE · **Status:** ✅ Completed · **Priority:** P2 · **Effort:** S · **Estimate:** 60 min  
**Agent:** react-native-ui-implementer · **Reviewer:** react-native-ui-reviewer  
**Proposed By:** react-native-ui-planner  
**Agent rationale:** Structural import-graph quarantine + boy-scout removal of any stray import across the RN client tree — react-native-ui-implementer; it lands last to reflect the final wiring after all other DISC tasks merge.  

## Outcome

An import-graph check finds zero active references to the dropped dedicated-discovery components, and no dedicated discover route / filter-bar / sort-toggle / state-picker is reachable from any active screen or hook.

## Specification

Per UC-DISC-11 and 07-ui-infrastructure.md §1, the dropped dedicated-discovery UI must be unreachable. Current state (verified): components/discovery/ contains discovery-empty-overlay.tsx, discovery-loading-overlay.tsx, intent-search-sheet.tsx, intent-summary-pill.tsx, route-pin.tsx, state-filter-sheet.tsx, state-list-item.tsx and a barrel index.ts that re-exports several; there is no route-discovery-screen.tsx / discovery-filter-bar.tsx / discovery-sort-toggle.tsx file in the active tree (only a native-rewrite spec doc), and grep shows the barrel and its members are imported only WITHIN components/discovery/ (no active screen/hook imports them today). This task makes that guarantee durable: build an import-graph check (a real test that walks the active source tree — app/, hooks/, contexts/, components/ excluding components/discovery/, server/ — and asserts zero import statements resolving to any quarantined module) and run it after all other sprint tasks land. If the check finds an active import (e.g. introduced by another task), remove/rewire it. Then either delete the quarantined components or leave them orphaned (the test must pass either way). Leave hooks/use-route-discovery.ts untouched and excluded from the quarantine list (it is deferred, not dropped). Also assert no dedicated discover tab route exists (app/(app)/(tabs)/discover.tsx absent) and no drawer entry resolves to a discover route (cross-checks DISC-019). Maps to T-DISC-011 (no dedicated discovery surface reachable anywhere).

## Critical Constraints

- LANDS LAST — run only after DISC-016/017/018/019/020 are merged, so the quarantine reflects the final wiring (otherwise a transient import could be missed).
- Leave hooks/use-route-discovery.ts UNTOUCHED (deferred local-DB hook for the offline fast-follow).
- Quarantine targets: route-discovery-screen, discovery-filter-bar, discovery-sort-toggle, route-pin, state-filter-sheet, state-list-item, intent-search-sheet, intent-summary-pill (plus the discovery barrel components/discovery/index.ts re-exports: discovery-empty-overlay, discovery-loading-overlay). Delete them or leave them orphaned — but NONE may be imported by an active screen/hook.
- Do NOT break any active screen — verify the app still type-checks and the plan view renders after quarantine.
- If any active import is found, it MUST be removed/rewired (the boy-scout fix), not merely documented.

## Acceptance Criteria

### AC-1: Zero active references to quarantined components
*(PRIMARY)*
- **flow_ref:** `HF-DISC-11-EDGE` · `.spec/scenarios/UC-DISC-11/edge-dropped-components-quarantined.scenario.md` *(bound 2026-06-23 by /kb-e2e-retrofit --apply)*
- **GIVEN** the final post-sprint source tree
- **WHEN** an import-graph check walks active sources (app/, hooks/, contexts/, components/ excluding components/discovery/, server/) for imports resolving to the quarantined modules
- **THEN** it finds zero such imports
- **Test tier:** `integration` · **Service:** filesystem import-graph scan (real source tree) via vitest
- **Verify:** `pnpm test tests/discovery/quarantine-import-graph.integration.test.ts` → `noActiveImportsOfQuarantinedComponents`
- **Scenario** (start `final_source_tree`):
  - must observe: scanned file count > 100 (proves the walk ran over the real tree); active import matches === 0
  - must NOT observe: scanned file count === 0 (empty scan); any active import of a quarantined module
  - negative control (would fail if): an active screen imports route-pin/state-filter-sheet/etc.; the check scans nothing (empty file list → false pass)

### AC-2: No dedicated discover route/filter/sort/state-picker reachable
- **GIVEN** the final route tree and drawer config
- **WHEN** the check inspects app/(app)/(tabs)/ for a discover route and the drawer for a discover entry
- **THEN** no discover.tsx tab route exists and no drawer item resolves to a discover route
- **Test tier:** `integration` · **Service:** filesystem route-tree scan + MenuLayout render via @testing-library/react-native
- **Verify:** `pnpm test tests/discovery/quarantine-import-graph.integration.test.ts` → `noDedicatedDiscoverRouteReachable`
- **Scenario** (start `final_source_tree`):
  - must observe: fs.existsSync('app/(app)/(tabs)/discover.tsx') === false (route file absent); the scanned (tabs) route-file list length >= 1 (the walk ran over real files); MenuLayout exposes exactly 4 navigable surfaces (plan view via launch, Settings, Saved, Sessions) and none has a pathname matching /discover|route-discovery/
  - must NOT observe: fs.existsSync('app/(app)/(tabs)/discover.tsx') === true (a discover tab route present); any drawer item pathname matching /discover|route-discovery/; the scanned route-file list length === 0 (empty scan — false pass)
  - negative control (would fail if): would fail if a discover.tsx tab route file is hardcoded back into app/(app)/(tabs)/; would fail if a drawer item is hardcoded to navigate to a discover/route-discovery pathname; would fail if the route-tree scan reads an empty file list (false pass on a static/empty walk)

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Import-graph scan over the active tree (>100 files) yields zero imports of any quarantined module. | AC-1 | `pnpm test tests/discovery/quarantine-import-graph.integration.test.ts -t noActiveImportsOfQuarantinedComponents` |
| TC-2 | No discover.tsx tab route file; no drawer item resolves to a discover route. | AC-2 | `pnpm test tests/discovery/quarantine-import-graph.integration.test.ts -t noDedicatedDiscoverRouteReachable` |

## Reading List

- `components/discovery/index.ts` (1-14) — PRIMARY — the barrel re-exporting the dropped components; the quarantine target list and what may be deleted/trimmed
- `.spec/prds/mvp/09-technical-requirements/07-ui-infrastructure.md` (30, 59) — the exact dropped-component list + retired testIDs that must be unreachable; use-route-discovery.ts left untouched
- `.spec/prds/mvp/05-uc-disc.md` (99-113) — UC-DISC-11 AC2 — rider cannot reach any dedicated Discovery screen/filter-bar/sort-toggle/state-picker
- `.spec/prds/mvp/10-e2e-testing-criteria.md` (91-95) — T-DISC-011 — grep the route tree + drawer; no dedicated discovery surface may exist
- `vitest.config.ts` (1-40) — test setup + path resolution so the import-graph walk resolves specifiers consistently with the build

## Guardrails

- The import-graph check is a real filesystem walk over the active tree — it must scan >0 files (guard against an empty-scan false pass).
- Quarantine is structural, not a per-component file edit; prefer deletion of orphans or a single durable test that enforces non-reachability.
- Do not touch hooks/use-route-discovery.ts.

## Design

- ref: 07-ui-infrastructure.md §1 (Dropped from MVP — components left unmounted/unimported) + §7 (historical dedicated-screen plan retired)
- ref: 09-routing.md v3.0.0 Route Delta (discover.tsx DELETED; structured-browse UI DELETED)

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test tests/discovery/quarantine-import-graph.integration.test.ts` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check tests/discovery/quarantine-import-graph.integration.test.ts` |
| scope | `git diff --name-only ⊆ scope.write_allowed` |
| scenario | `RED-against-stub: the check must FAIL if a quarantined import is deliberately added (and must not pass on an empty scan) — proving the walk bites` |
| human_gate | `Folds into T-DISC-011 (real device): no discover screen/filter/sort/state-picker reachable; app lands on the plan view` |

## Coding Standards

- Import-graph test is deterministic and self-contained (no network); it walks the real source tree.
- If deleting orphans, remove their barrel exports too so type-check stays clean.
- No `any` in the test's import-resolution logic.

## Dependencies

- Depends on: DISC-016, DISC-017, DISC-018, DISC-019, DISC-020
- Blocks: None

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {
    "final_source_tree": {
      "description": "the repo working tree AFTER DISC-016/017/018/019/020 have merged; active sources under app/, hooks/, contexts/, server/, components/ (excluding components/discovery/) plus the route tree and drawer config",
      "seed_method": "migration_fixture",
      "records": [
        "components/discovery/* present but orphaned (or deleted)",
        "no app/(app)/(tabs)/discover.tsx",
        "drawer has no 'Plan a ride'/'Discover' (post-DISC-019)",
        "hooks/use-route-discovery.ts present and untouched"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN the final post-sprint source tree WHEN an import-graph check walks active sources (app/, hooks/, contexts/, components/ excluding components/discovery/, server/) for imports resolving to the quarantined modules THEN it finds zero such imports",
      "verify": "pnpm test tests/discovery/quarantine-import-graph.integration.test.ts` \u2192 `noActiveImportsOfQuarantinedComponents",
      "scenario": {
        "start_ref": "final_source_tree",
        "tier": "visible",
        "negative_control": {
          "would_fail_if": [
            "an active screen imports route-pin/state-filter-sheet/etc.",
            "the check scans nothing (empty file list \u2192 false pass)"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "action": {
              "actor": "cli_user",
              "steps": [
                "walk all active .ts/.tsx under app/, hooks/, contexts/, server/, and components/ (excluding components/discovery/**)",
                "collect import specifiers",
                "filter to those resolving to: route-discovery-screen, discovery-filter-bar, discovery-sort-toggle, route-pin, state-filter-sheet, state-list-item, intent-search-sheet, intent-summary-pill, discovery-empty-overlay, discovery-loading-overlay, or the components/discovery barrel"
              ]
            },
            "end_state": {
              "must_observe": [
                "scanned file count > 100 (proves the walk ran over the real tree)",
                "active import matches === 0"
              ],
              "must_not_observe": [
                "scanned file count === 0 (empty scan)",
                "any active import of a quarantined module"
              ]
            }
          }
        ],
        "test_tier": "integration",
        "verification_service": "filesystem import-graph scan (real source tree) via vitest"
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN the final route tree and drawer config WHEN the check inspects app/(app)/(tabs)/ for a discover route and the drawer for a discover entry THEN no discover.tsx tab route exists and no drawer item resolves to a discover route",
      "verify": "pnpm test tests/discovery/quarantine-import-graph.integration.test.ts` \u2192 `noDedicatedDiscoverRouteReachable",
      "scenario": {
        "start_ref": "final_source_tree",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "filesystem route-tree scan + MenuLayout render via @testing-library/react-native",
        "negative_control": {
          "would_fail_if": [
            "would fail if a discover.tsx tab route file is hardcoded back into app/(app)/(tabs)/",
            "would fail if a drawer item is hardcoded to navigate to a discover/route-discovery pathname",
            "would fail if the route-tree scan reads an empty file list (false pass on a static/empty walk)"
          ]
        },
        "evidence": {
          "artifact_type": "stdout",
          "required_capture": true
        },
        "cases": [
          {
            "start_ref": "final_source_tree",
            "action": {
              "actor": "cli_user",
              "steps": [
                "assert no file app/(app)/(tabs)/discover.tsx",
                "enumerate the (tabs) route files actually scanned",
                "render MenuLayout and collect every drawer item pathname"
              ]
            },
            "end_state": {
              "must_observe": [
                "fs.existsSync('app/(app)/(tabs)/discover.tsx') === false (route file absent)",
                "the scanned (tabs) route-file list length >= 1 (the walk ran over real files)",
                "MenuLayout exposes exactly 4 navigable surfaces (plan view via launch, Settings, Saved, Sessions) and none has a pathname matching /discover|route-discovery/"
              ],
              "must_not_observe": [
                "fs.existsSync('app/(app)/(tabs)/discover.tsx') === true (a discover tab route present)",
                "any drawer item pathname matching /discover|route-discovery/",
                "the scanned route-file list length === 0 (empty scan \u2014 false pass)"
              ]
            }
          }
        ]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Import-graph scan over the active tree (>100 files) yields zero imports of any quarantined module.",
      "maps_to_ac": "AC-1",
      "verify": "pnpm test tests/discovery/quarantine-import-graph.integration.test.ts -t noActiveImportsOfQuarantinedComponents"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "No discover.tsx tab route file; no drawer item resolves to a discover route.",
      "maps_to_ac": "AC-2",
      "verify": "pnpm test tests/discovery/quarantine-import-graph.integration.test.ts -t noDedicatedDiscoverRouteReachable"
    }
  ]
}
-->
