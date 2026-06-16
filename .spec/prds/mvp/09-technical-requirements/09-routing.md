---
stability: CONSTITUTION
last_validated: 2026-06-15
prd_version: 3.0.0
---

> **✅ v3.0.0 (2026-06-15): the separate discovery view is removed.** `discover.tsx` / `RouteDiscoveryScreen` is **deleted**; discovery is a **state of the route plan view** (`index.tsx`), not its own route. The route map below is the canonical target. The v1.0.0 / v2.0.0 deltas are retained at the bottom as historical record; the **v3.0.0 Route Delta** finalizes the removal.

# Routing & Views

Navigation model: tab bar hidden; navigation via `MenuLayout` drawer + `router.push()` (expo-router). The **route plan view (map + chat home, `app/(app)/(tabs)/index.tsx`) is the default landing**; **discovery is a state of that view** (no route on map → curated-route suggestion cards over the input; route on map → route rendered, cards hidden), not a separate route. The full chat view is the home's existing `chatMode`, opened from a footer button to the right of the chat input.

## Route Map

| Route | Path | Kind | States | Primary UCs | Enter when |
|---|---|---|---|---|---|
| Route Plan View (HOME) | `app/(app)/(tabs)/index.tsx` | tab screen (default landing) | map mode / chat mode (full chat) / no-route → suggestion cards over input / route-on-map → route rendered, cards hidden / planning / route-card in transcript | UC-DISC-01, UC-DISC-09, UC-DISC-10, UC-DISC-11 | App launch (default) |
| Curated Route Detail | `app/(app)/curated-route/[id].tsx` (new) | stack route (pushed) | lean-detail / polyline-present / centroid-fallback (~45%) / saved\|unsaved | UC-DTL-01, UC-DTL-02, UC-DTL-03, UC-DTL-04, UC-SAVE-01, UC-SAVE-02 | Tap a route/pin on the plan view |
| Saved Routes | `app/(app)/(tabs)/saved-routes.tsx` (existing) | tab screen | loading / empty / list (now incl. curated bookmarks) | UC-SAVE-01 | Drawer 'Saved' |
| Saved Route Detail | `app/(app)/saved-route/[id].tsx` (existing) | stack route | detail / rename / delete-undo | UC-SAVE-01 (reopen) | Tap a row in Saved Routes |

## Route Delta (v1.0.0) — SUPERSEDED (historical record)

> **⚠️ SUPERSEDED by v2.0.0 + v3.0.0.** This section describes the original dedicated-`discover.tsx` plan and its route-vs-state rationale. The references below to a "Discover route", "default-landing change", filter/sort/archetype "states of Discover", and the demoted "Plan a ride" drawer entry **no longer apply** — discovery is now a state of the route plan view (`index.tsx`). The one conclusion that **still holds**: curated route **detail is a pushed route** (`curated-route/[id].tsx`), reaffirmed in the v3.0.0 delta. Read this section only as history.

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

---

## Route Delta (v2.0.0 — folded into Sprint 01) — DELTA-001

Applied **after** Sprint 01 ships the route map above. Authoritative spec: [DELTA-001](../DELTA-001-unified-map-chat-discovery.md).

| Change | Route | Type | Rationale |
|---|---|---|---|
| DELETED | `app/(app)/(tabs)/discover.tsx` | route removed | The dedicated Discovery screen is removed; discovery is re-homed onto the map + chat home. |
| CHANGED (default landing) | `app/(app)/(tabs)/index.tsx` (map + chat home) | becomes the discovery home + default landing | Already the map + chat screen. Gains: curated-route **suggestion pills** keyed to "no active route on map" (re-using the existing `chat-input.tsx` idle-pill slot, content swapped from `IDLE_SUGGESTIONS` to live curated routes); curated routes surfaced by the agent as the existing `routing_card` / `RouteAttachmentCard` (which already render the latest on the map and re-render an earlier card on tap, returning to map view); a **footer "open full chat" button** to the right of the chat input (re-uses the existing `chatMode` toggle). |
| SUPERSEDED | drawer "Plan a ride" entry | nav change | Chat is integral to the home; reached via the footer button, not a demoted drawer entry. |
| REMOVED from discovery UX | `DiscoveryFilterBar`, `DiscoverySortToggle` | components dropped | Archetype chips + best/nearest sort are redundant with conversational refinement; dropped to keep the map clean (components may be deleted or left unmounted). |
| UNCHANGED | `app/(app)/curated-route/[id].tsx`, `saved-route/[id].tsx`, `saved-routes.tsx` | reuse | Detail + Save + Saved flows are unaffected (detail is its own pushed route). |

**Route-vs-state note (delta):** discovery is no longer a route — it is the **state of the home** (no route on map ⇒ suggestion pills; route on map ⇒ route rendered, pills hidden). This is the canonical "state of an existing view, not a new route" outcome of the route-vs-state discriminator.

---

## Route Delta (v3.0.0 — separate discovery view removed)

Finalizes the removal of the separate discovery view. Authoritative scope: [01-scope.md](../01-scope.md), use cases [05-uc-disc.md](../05-uc-disc.md).

| Route | NEW/CHANGED/DELETED | Detail | Discriminator rationale |
|---|---|---|---|
| `app/(app)/(tabs)/discover.tsx` | DELETED | The dedicated Discovery screen is removed from the MVP (confirmed; it was never the target architecture after DELTA-001). | Not a seam — discovery is a state of the plan view, not a frame composition change. |
| `app/(app)/(tabs)/index.tsx` (route plan view) | CHANGED | The default landing and the discovery surface. Gains discovery **states**: no-route → curated-route **suggestion cards** over the chat input (tap → plot, sourced from `useCuratedDiscovery`); route-on-map → route rendered + cards hidden; chat-driven curated discovery via the agent's `routing_card` → map loop; full chat via the footer button right of the input. | A STATE of an existing view — the frame (map + docked chat input) is unchanged; only its content/overlay state changes. |
| Structured-browse UI (`DiscoveryFilterBar`, `DiscoverySortToggle`, `StateFilterSheet`/by-state picker) | DELETED | Archetype filter-bar, best/nearest sort-toggle, and the by-state browse picker are removed from the MVP. Region/archetype intent is expressed conversationally (UC-DISC-10). | Removed states, not routes — they were overlay states of the deleted Discovery route. |
| drawer "Plan a ride" entry | DELETED | Chat is integral to the plan view (reached via the footer button), not a demoted drawer entry. | Not a route — a nav affordance removed. |
| `app/(app)/curated-route/[id].tsx`, `saved-routes.tsx`, `saved-route/[id].tsx` | UNCHANGED | Detail + Save + Saved flows are unaffected (curated detail remains its own pushed route per the route-vs-state rationale above). | — |

**Net route count: 4** (Route Plan View HOME, Curated Route Detail, Saved Routes, Saved Route Detail). The former Discover and demoted-chat routes are gone.
