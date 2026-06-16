---
stability: CONSTITUTION
last_validated: 2026-06-15
prd_version: 3.0.0
---

> **✅ v3.0.0 (2026-06-15): the separate discovery view is removed.** Discovery is **not a screen** — it rides machinery that already exists in the **route plan view** (`app/(app)/(tabs)/index.tsx`): the chat-input **suggestion slot** (re-pointed to curated routes) and the **`routing_card` → `RouteAttachmentCard` → map** loop. The dedicated `RouteDiscoveryScreen` / `discover.tsx` and the structured-browse components (`DiscoveryFilterBar`, `DiscoverySortToggle`, `RoutePin` browse pins, `StateFilterSheet`/`StateListItem`) are **out of the MVP**. §1–§4 below are the canonical client wiring; the historical dedicated-screen plan is summarized in §7.

# UI Infrastructure: Discovery Client Wiring

This section is the constitution for the CLIENT side of the LaneShadow Discovery MVP. It is grounded in the live code in `/Users/justinrich/Projects/LaneShadow-RN`, not on an idealized flow. Where spec and code disagree, the code wins and the divergence is flagged.

> The visual/token side of the client (design tokens, the `ScoreDimensionBar` primitive, the detail-screen scroll architecture) lives in its own section: [10-design-system.md](./10-design-system.md).

## 1. Discovery rides existing plan-view machinery (the canonical model)

Discovery is the behavior of `app/(app)/(tabs)/index.tsx` (the route plan view). It reuses machinery already present and proven on-device (verified in code 2026-06-14):

- **Route cards already exist** — the agent emits `routing_card` messages rendered as `RouteAttachmentCard` in the transcript (`components/chat/routing-card.tsx` → `route-attachment-card.tsx`).
- **The map already shows the latest route** — `hooks/use-active-session-route.ts` resolves the newest plan unless one is pinned.
- **Tap-an-earlier-card already works** — `route-attachment-card.tsx` `handlePress` → `onSelect()` (`routing-card.tsx`: `setSelectedRouteId` + `setDisplayedRoutePlanId` + camera fit) + `onViewOnMap()` (`index.tsx`: `setChatMode(false)`).
- **The suggestion slot already exists** — `components/chat/chat-input.tsx` (`SuggestionChips`), today fed `IDLE_SUGGESTIONS` (`index.tsx`).

| Component | File | Status | Rework needed |
|---|---|---|---|
| Chat input suggestion slot | `components/chat/chat-input.tsx` | REWORK (focused) | Suggestion content → **whole curated routes** (name + mileage) from `useCuratedDiscovery`; visibility re-keyed to **"no active route on the map"** (not "empty session"); a tapped card plots that curated route. Visually distinct from generic `IDLE_SUGGESTIONS`. |
| Routing card / RouteAttachmentCard | `components/chat/routing-card.tsx`, `route-attachment-card.tsx` | REUSE | The agent's curated-route results surface here and ride the existing card→map→tap-back loop. No rework beyond accepting curated-route results. |
| useActiveSessionRoute | `hooks/use-active-session-route.ts` | REUSE | Already resolves the newest/pinned route plan for the map. |
| Full-chat footer button | `components/chat/chat-input.tsx` + `index.tsx` | NEW (small) | A button to the right of the chat input opens the full chat view (reuses the existing `chatMode` toggle / `cycleTranscript`), distinct from send. |
| **Dropped from MVP** | `route-discovery-screen.tsx`, `discovery-filter-bar.tsx`, `discovery-sort-toggle.tsx`, `route-pin.tsx`, `state-filter-sheet.tsx`, `state-list-item.tsx`, `intent-search-sheet.tsx`, `intent-summary-pill.tsx` | NOT IN MVP | The dedicated Discovery screen and all structured-browse UI are out of scope. Region/archetype intent is conversational. These components MUST be left unmounted and not imported from any active screen or hook (delete them or leave them orphaned) — they must not be wired back in; the deferred local-DB `hooks/use-route-discovery.ts` stays untouched for the offline fast-follow. |

## 2. Map engine — no divergence to resolve

The route plan view (`index.tsx`) already uses `MapboxMapView` (`@rnmapbox/maps`), confirmed rendering on-device. Because discovery now rides `index.tsx` rather than a separate screen, the former map-engine divergence (the orphan `RouteDiscoveryScreen` rendered via `MapViewWrapper` / `react-native-maps`, and `route-pin.tsx` importing `Marker` from `react-native-maps`) is **moot** — that render path is not in the MVP. Curated routes plot through the existing route-polyline machinery (`components/map/route-polyline*`, `buildRoutePolylines`) the plan view already uses. `react-native-maps` remains installed only as the home rollback wrapper and is not on the discovery path.

## 3. Hook architecture

- **NEW** `hooks/use-curated-discovery.ts` — wraps `useQuery(api.curatedRoutes.listCuratedRoutes, params)`. Input `{center?, state?, archetypes?: UIEnum[], sort, limit?, bbox?}`; output `{routes, isLoading, isEmpty}`. Derives center from `useCurrentLocation` (existing, `expo-location`). Returns rows in the `{id,name,lat,lng,archetype(UI enum),score(0-1),distanceMi}` shape the **suggestion cards** consume. This is the data source for the suggestion cards and (via the agent's curated-discovery tool, DATA-008) chat-driven results. Replaces the deferred local-DB `hooks/use-route-discovery.ts` (LEFT UNTOUCHED for the offline fast-follow).
- **NEW** `hooks/use-curated-route-detail.ts` (or co-located) — wraps `getCuratedRouteDetail(routeId)`; returns lean detail (summary/name-derived headline, 5 dimension scores + composite on 0-1, polyline-or-centroid, basic weather). Falls back to a centroid marker when `routePolyline` is absent (~45% of catalog).
- **NEW** `hooks/use-save-curated-route.ts` (or extend `hooks/use-saved-routes.ts`) — `{curatedRouteId, name}` → persists via `curatedRouteRef` + fires `recordRouteFeedback('save')`. Must NOT route through the legacy `useSaveRoute` (which demands PlanInput+RouteSnapshot+routeIndex). A `useIsCuratedRouteSaved(curatedRouteId)` mirrors the existing `useIsRouteSaved`.
- Score formatting (0-1 → %/bar), archetype mapping (UI↔DB enum), and length clamping are PURE transforms — candidates for unit tests (UNIT_TEST_JUSTIFIED: zero I/O).

## 4. Navigation — no default-landing change, no dedicated route

Tabs are defined in `app/(app)/(tabs)/_layout.tsx` via expo-router `Tabs` with `tabBarStyle.display: 'none'`; navigation happens through the `MenuLayout` drawer and `router.push()`. The route plan view (`index.tsx`) is **already the default landing** — no new `discover.tsx` route, no default-landing rewiring, and **no drawer "Plan a ride" entry** (chat is integral to the plan view, reached via the footer full-chat button). Curated route **detail** stays a pushed stack route (`app/(app)/curated-route/[id].tsx`), consistent with the existing `app/(app)/saved-route/[id].tsx` pattern. See [09-routing.md](./09-routing.md).

## 5. Dependencies

- **No new runtime dependency required.** `expo-linking` (~8.0.11) and `expo-location` (~19.0.8) are already in `package.json`. The 'Ride it' deep-link util uses `expo-linking` + `Platform`.
- `react-native-maps` (1.14.0) remains installed (home rollback wrapper) but is NOT on the discovery render path.
- Mapbox token wiring is already proven on-device.

## 6. Mobile patterns (apply to the plan view + detail screen)

- **Safe areas:** map is full-bleed (no SafeAreaView wrapper); overlays apply their own `useSafeAreaInsets().top` padding. Detail/saved screens use `SubpageLayout` (top+bottom insets) per `components/CLAUDE.md`.
- **Touch targets:** suggestion cards and the full-chat button ≥ 44pt.
- **Theming:** all colors via `useSemanticTheme()`; no hardcoded hex.
- **Platform differences:** maps deep-link scheme differs by `Platform.OS` (Apple vs Google Maps); Android keyboard/adjustResize handled by existing infra.
- **testIDs (E2E) — names match the live code:** `chat-input`, `chat-input-suggestion-chips` (the suggestion slot), `discovery-suggestion-pill-{routeId}` (curated-route suggestion cards over the input), `route-attachment-card` (chat route-cards), `chat-input-chat-view-button` (footer open-full-chat, distinct from the send action), `home-route-polyline`, `curated-detail-screen`, `curated-detail-save`, `curated-detail-ride-it`, `saved-routes-list`. (Retired with the dedicated screen: `route-discovery-screen`, `discovery-filter-bar*`, `discovery-sort-toggle`, `discovery-loading-overlay`, `discovery-empty-overlay`, `route-pin-*`, `drawer-discover`, `drawer-plan-a-ride`.)

## 7. Historical: the dedicated-screen plan (retired)

The v1.x PRD planned discovery as a dedicated `app/(app)/(tabs)/discover.tsx` rendering a wired `RouteDiscoveryScreen` (mounting `components/discovery/*`: `DiscoveryFilterBar`, `DiscoverySortToggle`, `RoutePin`, `StateFilterSheet`, loading/empty overlays), with Discovery as the default landing and the chat agent demoted to a "Plan a ride" drawer entry. DELTA-001 (2026-06-14) re-homed discovery onto `index.tsx`; **v3.0.0 (2026-06-15) removed the dedicated screen and the structured-browse UI entirely**, leaving the canonical wiring in §1–§4. The dedicated-screen components remain in the repo as orphans (deletable) but are not part of the MVP.
