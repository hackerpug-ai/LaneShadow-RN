---
stability: FEATURE_SPEC
last_validated: 2026-06-15
prd_version: 3.0.0
functional_group: DISC
---

> **✅ v3.0.0 (2026-06-15): the separate discovery view is removed.** Discovery is the behavior of the **route plan view** (`app/(app)/(tabs)/index.tsx`): curated-route **suggestion cards** over the chat input (tap → plot) plus **chat-driven natural-language curated discovery** surfaced as the existing route-cards that render on the map. The dedicated `discover.tsx` / `RouteDiscoveryScreen` and the structured browse UI (archetype filter-bar, best/nearest sort-toggle, by-state browse picker) are dropped. This folds [DELTA-001](./DELTA-001-unified-map-chat-discovery.md) into the canonical use cases below.
>
> **Superseded use cases (removed with the dedicated screen):** UC-DISC-02 (dedicated default-home + chat demotion) → replaced by UC-DISC-11; UC-DISC-03 (by-state browse picker) → region/state intent is now conversational, folded into UC-DISC-10; UC-DISC-05 / UC-DISC-06 (wire/standardize the standalone `RouteDiscoveryScreen` on Mapbox) → obsolete (discovery rides `index.tsx`); UC-DISC-07 / UC-DISC-08 (filter-bar/sort legibility + dedicated-screen empty/loading) → obsolete. IDs 02/03/05/06/07/08 are retired and not reused; the gaps are intentional so downstream references stay stable.

# Use Cases: Discovery (on the route plan view) (DISC)

Discovery is the behavior of the route plan view (`index.tsx`), not a separate screen. When no route is on the map, curated-route **suggestion cards** sit over the chat input; tapping one plots that curated route on the map. **Chat-driven natural-language curated discovery** ("twisties near Asheville", "scenic roads in North Carolina") returns curated routes as the existing route-cards that render on the map, riding the existing tap-an-earlier-card → re-render → return-to-map loop. A new `useCuratedDiscovery` Convex hook feeds the cards from the live 5,654-route catalog. Includes the cross-cutting full discover-to-ride journey UC that the D9 on-device gate verifies on the plan view.

| ID | Title | Tier |
|---|---|---|
| UC-DISC-01 | Rider completes the full discover-to-ride journey on a real device | e2e |
| UC-DISC-04 | useCuratedDiscovery hook returns live rows in the shape the suggestion cards + chat discovery consume | integration |
| UC-DISC-09 | Rider discovers whole curated routes from the suggestion cards over the plan input | e2e |
| UC-DISC-10 | Rider discovers curated routes by chatting; results ride the existing card→map loop | e2e |
| UC-DISC-11 | Discovery lives on the route plan view — no separate Discovery screen | e2e |

---

## UC-DISC-01: Rider completes the full discover-to-ride journey on a real device

The single end-to-end MVP arc and the journey that the D9 on-device gate verifies. A rider opens the app to the route plan view (map + chat home), finds a great road — by tapping a curated-route suggestion card over the input, or by chatting a natural-language request — opens it, understands why it's good and whether today is rideable, saves it, and hands off to a maps app to ride it. This is the cross-cutting journey that stitches together DATA, DISC, DTL, and SAVE; it is the one job the MVP must do well. Verified on real iOS AND real Android against live Convex — no mocks.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device against live Convex dev deployment

**Acceptance Criteria**

- ☐ Rider can open the app and land directly on the route plan view (map + chat home) without passing through any separate Discovery screen
- ☐ Rider can see curated-route suggestion cards over the chat input when no route is on the map, sourced from the live 5,654-route catalog
- ☐ Rider can tap a suggestion card and see that curated route plot on the map
- ☐ Rider can type a natural-language request and receive curated route(s) as chat route-cards with the latest plotted on the map
- ☐ Rider can tap a route to open a detail view showing its headline, score bars, geometry-or-centroid, and basic conditions
- ☐ Rider can save the route from the detail view and find it persisted in the Saved screen on reopen
- ☐ Rider can hand off the saved route to Google or Apple Maps to navigate to it on both iOS and Android
- ☐ Founder can complete the entire discover-to-ride arc on a real iOS device and a real Android device against live Convex with recorded evidence

---

## UC-DISC-04: useCuratedDiscovery hook returns live rows in the shape the suggestion cards + chat discovery consume

Author a new Convex-backed hook `hooks/use-curated-discovery.ts` that wraps `useQuery(api.curatedRoutes.listCuratedRoutes, params)` and returns discovery rows in the shape the suggestion cards (and the agent's curated-route results) consume (id, name, lat, lng, archetype as UI enum, score 0-1, distanceMi). The hook accepts `{ center?: {lat,lng}, state?: string, archetypes?: RouteArchetype[] (UI enum), sort: 'best'|'nearest', limit?, bbox? }`, derives `center` from `useCurrentLocation` when not supplied, passes the UI→DB archetype mapping params through to the query, and exposes `{ routes, isLoading, isEmpty }` honoring Convex's `undefined`=loading and `[]`=empty conventions. Scores arrive on a 0-1 scale and MUST be carried through unmodified (formatting to % is a render concern, not a hook concern). The hook is the single data source for both the suggestion cards (UC-DISC-09) and, via the agent's curated-discovery tool, chat-driven results (UC-DISC-10). `sort` is an internal default (nearest when located, best otherwise) — there is no rider-facing sort toggle in the MVP. This replaces the deferred local-DB `hooks/use-route-discovery.ts` (left untouched for the offline fast-follow).

**Test tier:** integration  
**Verification service:** live Convex dev (api.curatedRoutes.listCuratedRoutes)

**Acceptance Criteria**

- ☐ System can return curated discovery rows from useCuratedDiscovery against live Convex in the {id,name,lat,lng,archetype,score,distanceMi} shape the suggestion cards iterate over.
- ☐ System can surface a loading state (routes undefined) and a distinct empty state (routes === []) from useCuratedDiscovery so the caller renders the correct state.
- ☐ System can derive the query center from useCurrentLocation when no explicit center is passed to useCuratedDiscovery.
- ☐ Rider can receive routes ordered nearest-first when location is available and best-first as the fallback from useCuratedDiscovery.
- ☐ System can carry compositeScore through useCuratedDiscovery on the raw 0-1 scale without rescaling to 0-100.

---

## UC-DISC-09: Rider discovers whole curated routes from the suggestion cards over the plan input

The primary discovery affordance. When there is no route on the map, the chat input's suggestion slot (the existing `chat-input.tsx` idle-suggestion slot) shows **curated-route suggestion cards** — whole curated roads with their mileage, drawn from the live catalog via `useCuratedDiscovery` — visually distinct from the generic `IDLE_SUGGESTIONS` planning prompts. Tapping a card plots that curated route on the map. The cards are keyed to "no active route on the map": they hide whenever a route is displayed and return when it is cleared/dismissed.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device against live Convex

**Acceptance Criteria**

- ☐ Rider can see curated-route suggestion cards over the chat input whenever no route is on the map.
- ☐ Rider can see each suggestion card show a real curated road name and its mileage drawn from the live catalog, not a hardcoded planning prompt.
- ☐ Rider can tap a suggestion card and see that curated route plot on the map.
- ☐ System hides the suggestion cards whenever a route is displayed on the map and re-shows them when the route is cleared or dismissed.
- ☐ System sources the suggestion cards from the live curated catalog via useCuratedDiscovery (nearest-first when location is available, best-first otherwise).

---

## UC-DISC-10: Rider discovers curated routes by chatting; results ride the existing card→map loop

Chat-driven natural-language curated discovery on the plan view. Typing a natural-language request — including region/state and archetype intent like "twisties near Asheville" or "scenic roads in North Carolina" (no filter-bar or state picker required) — routes through the agent's curated-discovery tool (the DATA-008 determinism seam: NL → `listCuratedRoutes` → existing `routing_card`) and returns curated route(s) as the existing chat route-cards. The latest plots on the map; pressing an earlier curated-route card re-renders it on the map and returns the rider to map view.

**Determinism-seam fixture (for the e2e):** inject a fixture intent object — e.g. `{ archetypes: ['scenic'], state: 'North Carolina' }` — directly into the curated-discovery tool call, bypassing NL parsing, so the tool calls `listCuratedRoutes` with deterministic params against live Convex and the test asserts the surfaced/plotted curated route set (engine outcome), never the agent's prose. The concrete fixture mechanism is ratified in the e2e harness constitution at sprint time.

**Test tier:** e2e (NL/intent fixtured at the determinism seam — assert which curated routes are surfaced/plotted, not prose)  
**Verification service:** real iOS device + real Android device against live Convex

**Acceptance Criteria**

- ☐ Rider can type a natural-language request and receive curated route(s) as cards in the chat history.
- ☐ Rider can express region/state and archetype intent conversationally (e.g. "scenic roads in North Carolina") and receive matching curated routes without any filter-bar or state picker.
- ☐ Rider can see the latest suggested curated route rendered on the map.
- ☐ Rider can press an earlier curated-route card in the chat history and see it re-render on the map, returning to map view.
- ☐ System carries composite scores through chat-driven results on the raw 0-1 scale, rendered as bars or percent and never as a raw 0-100 number.

---

## UC-DISC-11: Discovery lives on the route plan view — no separate Discovery screen

The structural contract: the app opens directly to the route plan view (map + chat home). There is no dedicated Discover screen, no drawer-hidden chat, and none of the removed structured-browse UI (archetype filter-bar, best/nearest sort-toggle, by-state browse picker). The full chat view opens from a button to the right of the chat input (reusing the existing `chatMode` toggle), rendered as a navigation affordance distinct from the chat send action.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device (app launch + navigation)

**Acceptance Criteria**

- ☐ Rider can launch the app and land on the route plan view (map + chat home) with no separate Discovery screen and no drawer-hidden chat.
- ☐ Rider cannot reach any dedicated Discovery screen, archetype filter-bar, sort-toggle, or by-state browse picker because they do not exist in the app.
- ☐ Rider can open the full chat view from a button to the right of the chat input in the bottom footer.
- ☐ System renders the full-chat button as a navigation affordance distinct from the chat send action.
- ☐ Rider can dismiss or clear a displayed route and see the suggestion cards return over the input.

---
