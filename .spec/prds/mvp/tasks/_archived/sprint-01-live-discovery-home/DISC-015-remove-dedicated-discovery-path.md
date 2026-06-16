# DISC-015: Remove the dedicated discovery path (discover.tsx + Tabs.Screen + drawer entries + filter-bar/sort-toggle); make index.tsx the default landing

| Field | Value |
|---|---|
| Sprint | [sprint-01-live-discovery-home](./SPRINT.md) |
| Type | INFRA |
| Agent | implementer = `react-native-ui-implementer` · reviewer = `react-native-ui-reviewer` |
| Estimate | S |
| Priority | P1 |
| Status | Backlog |
| Proposed By | react-native-ui-planner |
| Depends on | DISC-011, DISC-012 |
| Blocks | — |
| PRD refs | DELTA-001 §1/§2/§5 · ROADMAP Sprint 01 (DISC-015) |

## Background

DELTA-001 makes discovery a STATE of the map+chat home, not a dedicated screen. Once the home discovery path is proven (DISC-011 + DISC-012 merged), the dedicated `discover.tsx` route, its `Tabs.Screen` registration, the drawer 'Discover'/'Plan a ride'→dedicated-screen entries, and the now-redundant `DiscoveryFilterBar` + `DiscoverySortToggle` (filter/sort are handled conversationally) are removed, with `index.tsx` left as the default landing. This lands LAST so there is never a window where discovery is unreachable. `useCuratedDiscovery`, `RoutePin`, the overlays, and `StateFilterSheet` are KEPT — the home path depends on them.

## Critical constraints

- Lands LAST (after DISC-011 + DISC-012 prove the home discovery path) so there is NEVER a window where discovery is unreachable.
- DELETE `app/(app)/(tabs)/discover.tsx` and its `Tabs.Screen name="discover"` registration in `_layout.tsx`; remove the drawer 'Discover' entry and reconcile the 'Plan a ride'→dedicated-screen entry in `menu-layout.tsx`.
- DROP `DiscoveryFilterBar` + `DiscoverySortToggle` (delete the files or remove all imports/usages so they are unmounted).
- KEEP `useCuratedDiscovery`, `RoutePin`, overlays, and `StateFilterSheet` — do NOT delete these; the home path depends on useCuratedDiscovery.
- `index.tsx` must be the default landing after auth; the build (type-check + lint + test) must be green and no route may resolve to a dedicated Discover screen.

## Specification

**Objective:** The dedicated Discover screen and its registration/drawer entries are removed, DiscoveryFilterBar + DiscoverySortToggle are dropped, and index.tsx is the default landing — with the build green and no dedicated discovery screen reachable.

**Success state:** The dedicated Discover screen and its registration/drawer entries are removed, DiscoveryFilterBar + DiscoverySortToggle are dropped, and index.tsx is the default landing — with the build green and no dedicated discovery screen reachable. The build (type-check + lint + test) is green and no route resolves to a dedicated Discover screen.

## Implementation steps

1. Confirm DISC-011 + DISC-012 are merged (home discovery path proven) before starting.
2. Delete `app/(app)/(tabs)/discover.tsx`.
3. Remove the `Tabs.Screen name="discover"` block from `app/(app)/(tabs)/_layout.tsx` (lines 26-38); ensure `index` remains the first/default screen.
4. In `components/layouts/menu-layout.tsx` remove the 'Discover' drawer item (lines 96-102) and reconcile the 'Plan a ride' item (lines 103-109) so it does not point at a deleted screen — point ride discovery at `/(app)/(tabs)` (the home) and resolve duplicate-landing.
5. Remove all imports/usages of `DiscoveryFilterBar` and `DiscoverySortToggle`; delete the component files if no longer referenced (verify with grep).
6. Verify `useCuratedDiscovery`, `RoutePin`, discovery overlays, and `StateFilterSheet` remain present and unbroken.
7. Run `pnpm type-check`, `pnpm lint`, `pnpm test`; fix any references left dangling by the deletions.
8. Manually verify on simulator that the app lands on the map/chat home and no navigation reaches a Discover screen.

## Verification checklist

- [ ] VC-1 (PRIMARY): `app/(app)/(tabs)/discover.tsx` no longer exists and no route resolves to it.
- [ ] VC-2: `_layout.tsx` has no `Tabs.Screen name="discover"`; index is the landing.
- [ ] VC-3: `menu-layout.tsx` has no drawer entry routing to `/(app)/(tabs)/discover`.
- [ ] VC-4: `DiscoveryFilterBar` and `DiscoverySortToggle` are not imported anywhere in `app/` or mounted components.
- [ ] VC-5: `useCuratedDiscovery`, `RoutePin`, overlays, `StateFilterSheet` are retained (still present).
- [ ] VC-6: `pnpm type-check` clean + `pnpm lint` clean + `pnpm test` passes (build green).
- [ ] VC-7: Only SCOPE.writeAllowed files modified (git diff --name-only).

## Reading list

- `app/(app)/(tabs)/_layout.tsx:26-51` — [PRIMARY PATTERN] The discover Tabs.Screen block to remove and the index screen ordering to preserve.
- `components/layouts/menu-layout.tsx:92-125` — Drawer 'Discover' + 'Plan a ride' entries to remove/reconcile.
- `app/(app)/(tabs)/discover.tsx:1-7` — The file to delete — confirms RouteDiscoveryScreen is its only consumer.
- `components/discovery/route-discovery-screen.tsx:1-40` — Confirm DiscoveryFilterBar/DiscoverySortToggle imports live here (so deleting the screen removes their last consumer).

## Guardrails

**Write-allowed:** `app/(app)/(tabs)/discover.tsx` (DELETE: Remove the dedicated Discover route.) · `app/(app)/(tabs)/_layout.tsx` (MODIFY: Remove the discover Tabs.Screen; keep index as default landing.) · `components/layouts/menu-layout.tsx` (MODIFY: Remove the 'Discover' drawer entry; reconcile 'Plan a ride' to point at the home (no dedicated screen).) · `components/discovery/discovery-filter-bar.tsx` (DELETE: Drop the archetype filter bar (redundant with conversational refinement).) · `components/discovery/discovery-sort-toggle.tsx` (DELETE: Drop the best/nearest sort toggle.) · `components/discovery/route-discovery-screen.tsx` (DELETE: Remove the standalone RouteDiscoveryScreen (only consumer was discover.tsx).)

**Write-prohibited:** hooks/use-curated-discovery.ts — KEEP (home path depends on it). · components/discovery/route-pin.tsx — KEEP. · components/discovery/discovery-empty-overlay.tsx, discovery-loading-overlay.tsx — KEEP (overlays). · components/discovery/state-filter-sheet.tsx, state-list-item.tsx — KEEP (StateFilterSheet). · Any file not explicitly listed above

## Verification gates

1. `test ! -f 'app/(app)/(tabs)/discover.tsx'` and no route resolves to `RouteDiscoveryScreen` (VC-1, PRIMARY).
2. `pnpm type-check` (exit 0) · `pnpm lint` (exit 0) · `pnpm test` passes — build green after the teardown.
3. KEEP-listed files still present (`useCuratedDiscovery`, `RoutePin`, overlays, `StateFilterSheet`).
4. `git diff --name-only` ⊆ write-allowed.
5. On-device: app lands on the map/chat home and no navigation reaches a Discover screen.

## Design / approach

**Interaction / implementation notes:**
- Delete only the dedicated-discovery surface; keep useCuratedDiscovery/RoutePin/overlays/StateFilterSheet.
- Ensure no dangling imports remain after deletions (grep for RouteDiscoveryScreen, DiscoveryFilterBar, DiscoverySortToggle).
- Keep index.tsx as the default post-auth landing.

**Ask first:**
- Whether to also delete the discovery overlays/state-filter sheet if they become orphaned (spec says KEEP — confirm before deleting any KEEP-listed component).
- Any change to the auth/landing routing beyond making index the default.

## Dependencies

- **Depends on:** DISC-011, DISC-012.
- **Blocks:** —.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "fixtures": {},
  "requirements": [
    {
      "id": "VC-1",
      "type": "verification_criterion",
      "primary": true,
      "description": "The dedicated Discover screen file is deleted and unreachable",
      "verify": "test ! -f 'app/(app)/(tabs)/discover.tsx' && ! grep -rn 'RouteDiscoveryScreen' 'app/'",
      "maps_to_ac": null
    },
    {
      "id": "VC-2",
      "type": "verification_criterion",
      "description": "No discover Tabs.Screen remains; index is default landing",
      "verify": "! grep -n 'name=\"discover\"' 'app/(app)/(tabs)/_layout.tsx'",
      "maps_to_ac": "VC-1"
    },
    {
      "id": "VC-3",
      "type": "verification_criterion",
      "description": "No drawer entry routes to the dedicated discover screen",
      "verify": "! grep -n \"/(app)/(tabs)/discover\" components/layouts/menu-layout.tsx",
      "maps_to_ac": "VC-1"
    },
    {
      "id": "VC-4",
      "type": "verification_criterion",
      "description": "DiscoveryFilterBar and DiscoverySortToggle are not imported anywhere",
      "verify": "! grep -rn 'DiscoveryFilterBar\\|DiscoverySortToggle' app/ components/ hooks/",
      "maps_to_ac": "VC-1"
    },
    {
      "id": "VC-5",
      "type": "verification_criterion",
      "description": "useCuratedDiscovery, RoutePin, overlays, StateFilterSheet are retained",
      "verify": "test -f hooks/use-curated-discovery.ts && test -f components/discovery/route-pin.tsx && test -f components/discovery/state-filter-sheet.tsx",
      "maps_to_ac": "VC-1"
    },
    {
      "id": "VC-6",
      "type": "verification_criterion",
      "description": "Build is green after the teardown",
      "verify": "pnpm type-check && pnpm lint && pnpm test",
      "maps_to_ac": "VC-1"
    }
  ]
}
-->
