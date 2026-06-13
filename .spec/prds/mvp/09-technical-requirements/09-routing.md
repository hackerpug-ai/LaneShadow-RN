---
stability: CONSTITUTION
last_validated: 2026-06-13
prd_version: 1.0.0
---

# Routing & Views

Navigation model: tab bar hidden; navigation via `MenuLayout` drawer + `router.push()` (expo-router). This MVP makes **Discovery the default landing route** and demotes the chat planning agent to a drawer entry.

## Route Map

| Route | Path | Kind | States | Primary UCs | Enter when |
|---|---|---|---|---|---|
| Discover (HOME) | `app/(app)/(tabs)/discover.tsx` | tab screen (new default landing) | loading / empty / results (pins) / filtered-by-archetype / sorted best\|nearest / by-state | UC-DISC-01, UC-DISC-02, UC-DISC-03, UC-DISC-04 | App launch (default), drawer 'Discover', back from detail |
| Curated Route Detail | `app/(app)/curated-route/[id].tsx` (new) | stack route (pushed) | lean-detail / polyline-present / centroid-fallback (~45%) / saved\|unsaved | UC-SAVE-01, UC-SAVE-02 | Tap a pin or list row on Discover |
| Plan a ride (chat, DEMOTED) | `app/(app)/(tabs)/index.tsx` (unchanged) | tab screen (was default, now secondary) | chat mode / map mode (existing) | (out of MVP scope to modify) | Drawer 'Plan a ride' only |
| Saved Routes | `app/(app)/(tabs)/saved-routes.tsx` (existing) | tab screen | loading / empty / list (now incl. curated bookmarks) | UC-SAVE-01 | Drawer 'Saved' |
| Saved Route Detail | `app/(app)/saved-route/[id].tsx` (existing) | stack route | detail / rename / delete-undo | UC-SAVE-01 (reopen) | Tap a row in Saved Routes |

## Route Delta (v1.0.0)

All routes relative to the current tree:

| Change | Route | Type | Rationale |
|---|---|---|---|
| NEW | `app/(app)/(tabs)/discover.tsx` | route (tab screen) | The hero. New DEFAULT landing. Renders the wired RouteDiscoveryScreen. |
| CHANGED (default-landing) | `app/(app)/(tabs)/index.tsx` (chat) | demotion, not deletion | Was the default home; becomes reachable only via drawer 'Plan a ride'. Screen code is NOT modified for MVP — only its position as default landing changes (via route ordering / index→discover redirect). |
| NEW | `app/(app)/curated-route/[id].tsx` | route (stack, pushed) | Curated detail is a NEW ROUTE, not a state of Discover (see route-vs-state rationale below). |
| CHANGED | `components/layouts/menu-layout.tsx` drawer Navigate section | nav edit | Primary item 'Discover'; new 'Plan a ride' item → /(app)/(tabs); resolve the duplicate 'Home' entry. |
| CHANGED | `app/(app)/(tabs)/_layout.tsx` | register Tabs.Screen `discover` | Add the new screen to the (hidden) Tabs navigator. |
| UNCHANGED | `app/(app)/(tabs)/saved-routes.tsx`, `app/(app)/saved-route/[id].tsx` | reuse | Curated bookmarks flow into the existing Saved screens (must tolerate curatedRouteRef rows with no legs). |

### Route-vs-state rationale: is curated detail a NEW ROUTE or a STATE of Discover?

**Decision: curated route detail is a NEW ROUTE** (`app/(app)/curated-route/[id].tsx`), pushed onto the stack — NOT a sheet/state overlaid on Discover.

Reasons:
1. **Codebase precedent.** The app already models saved-route detail as a pushed route `app/(app)/saved-route/[id].tsx` (via `router.push`). Mirroring that for curated detail keeps the navigation model consistent and lets the back gesture/`router.back()` behave as users expect.
2. **Distinct data lifecycle.** Detail loads via a SEPARATE Convex query (`getCuratedRouteDetail`) returning geometry + scores + weather — a different reactive subscription than the list query. A route boundary cleanly scopes that subscription's lifecycle (mount on enter, tear down on leave) instead of bloating the Discover screen's hook graph.
3. **Deep-linkability / handoff.** A real route gives `/curated-route/{id}` a stable URL that can later be deep-linked (and pairs naturally with the 'Ride it' export). A transient state cannot.
4. **Map engine isolation.** Detail renders its own Mapbox instance (polyline OR centroid-fallback). Keeping it on its own route avoids juggling two map states inside one screen.

Why NOT a state: the filter/sort/archetype selections on Discover ARE states (they mutate the same list query in place and must persist across pin taps) — they correctly live as in-screen state on the Discover route. Detail is a navigation, not a filter, so it is a route.
