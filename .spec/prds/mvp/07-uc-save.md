---
stability: FEATURE_SPEC
last_validated: 2026-06-13
prd_version: 2.0.0
functional_group: SAVE
---

# Use Cases: Library & Handoff (SAVE)

Closing the loop: persist a curated route as a first-class bookmark via curatedRouteRef (recordRouteFeedback('save') + saved_routes write with no synthesized PlanInput/RouteSnapshot/legs), have it appear in and reopen from the existing Saved screen without crashing legacy SavedRouteCard, and the 'Ride it' open-in-Google/Apple-Maps deep-link handoff from the route centroid + name on both platforms (turn-by-turn permanently out).

| ID | Title | Tier |
|---|---|---|
| UC-SAVE-01 | Save a curated route from detail via curatedRouteRef so it appears in Saved and reopens | e2e |
| UC-SAVE-02 | 'Ride it' maps deep-link util hands off the route from centroid + name | e2e |

---

## UC-SAVE-01: Save a curated route from detail via curatedRouteRef so it appears in Saved and reopens

From the lean curated-route detail surface, a Rider taps Save and the route is persisted into `saved_routes` via the new optional `curatedRouteRef: v.id('curated_routes')` path (the SAVE-RESOLVE backend gate). This bypasses the legacy `useSaveRoute` contract in `hooks/use-saved-routes.ts`, which requires PlanInput + RouteSnapshot + routeIndex that curated routes do not have. The client introduces a `useSaveCuratedRoute` mutation hook (or extends use-saved-routes) that takes `{ curatedRouteId, name }`, fires `recordRouteFeedback('save')` (existing in convex/db/routeFeedback.ts) for the discovery signal, and persists the bookmark. The saved curated route then appears in the existing Saved screen list (`app/(app)/(tabs)/saved-routes.tsx`) and reopens — the Saved list/detail rendering must tolerate a saved row that has a curatedRouteRef and no synthesized legs (lean preview: name, centroid, score, archetype). Toggle Save<->Unsave reflects state via a useIsRouteSaved-style check keyed on curatedRouteId.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device against live Convex (saved_routes + recordRouteFeedback)

**Acceptance Criteria**

- ☐ Rider can tap Save on a curated route detail and persist it to saved_routes via curatedRouteRef against live Convex.
- ☐ Rider can open the Saved screen after saving and see the curated route appear in the list.
- ☐ Rider can tap the saved curated route in the Saved screen and reopen its detail without a legs/PlanInput error.
- ☐ System can render a saved curated row (curatedRouteRef, no synthesized legs) in the Saved list without crashing the existing SavedRouteCard.
- ☐ Rider can see the Save control reflect saved state (Saved/Unsave) for an already-bookmarked curated route.

---

## UC-SAVE-02: 'Ride it' maps deep-link util hands off the route from centroid + name

Author a net-new client utility `lib/maps-deeplink.ts` (no equivalent exists) that opens the device maps app to the route using `expo-linking` (already installed at ~8.0.11; NO new dependency). On iOS it builds an Apple Maps URL (e.g. `http://maps.apple.com/?ll={lat},{lng}&q={encodedName}` or `maps://`), on Android a Google Maps geo/navigation URL (`google.navigation:q={lat},{lng}` or `geo:` with a label), selected via `Platform.OS`. The detail surface's 'Ride it' button calls this util with the curated route's centroid + name. Because ~45% of routes have no polyline (geometrySource present on only 55%), the handoff intentionally targets the centroid (a single destination point) — turn-by-turn is permanently out of scope; this is the export-to-maps handoff the strategy prescribes. The util must `Linking.canOpenURL` and fall back gracefully (web maps URL) if the native maps scheme is unavailable.

**Test tier:** e2e  
**Verification service:** real iOS device (Apple Maps) + real Android device (Google Maps)

**Acceptance Criteria**

- ☐ Rider can tap 'Ride it' on a curated route detail on a real iOS device and open Apple Maps positioned at the route centroid with the route name as the query/label.
- ☐ Rider can tap 'Ride it' on a real Android device and open Google Maps positioned at the route centroid with the route name.
- ☐ System can select the correct maps URL scheme per Platform.OS without requiring any dependency beyond the already-installed expo-linking.
- ☐ System can fall back to a web maps URL when the native maps scheme cannot be opened (Linking.canOpenURL is false).

---
