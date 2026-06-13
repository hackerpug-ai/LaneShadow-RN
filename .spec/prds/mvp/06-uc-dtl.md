---
stability: FEATURE_SPEC
last_validated: 2026-06-13
prd_version: 1.1.0
functional_group: DTL
---

# Use Cases: Route Detail (DTL)

The lean detail surface for a single curated route, rendered from LEAN-ONLY data: a name/summary-derived headline (no badges, 0% present), the five dimension scores plus composite rendered as bars/percent on the 0-1 scale (never '92'), polyline geometry with a centroid-marker 'Approximate location' fallback for the ~45% lacking geometry, basic weather conditions for the centroid, and the Save + Ride-it action affordances. No photos/history/elevation (enrichment table EMPTY).

| ID | Title | Tier |
|---|---|---|
| UC-DTL-01 | Lean route detail layout renders correctly from real Convex data | e2e |
| UC-DTL-02 | Score visualization: 0–1 float → labeled percentage bar | integration |
| UC-DTL-03 | Geometry graceful degradation: centroid fallback with 'Approximate location' indicator | e2e |
| UC-DTL-04 | Detail actions: Save and Ride It operate end-to-end | e2e |

---

## UC-DTL-01: Lean route detail layout renders correctly from real Convex data

A rider taps a discovery pin or list row and sees a fully populated detail screen built from lean curated_route fields only. All six sections (header, summary, score bars, map, conditions, actions) render without crashing regardless of whether optional fields (routePolyline, summary, weather) are present or absent. Score values arrive as 0–1 floats and are displayed as percentage bars, never as raw decimals or out-of-range integers.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device against live Convex dev deployment

**Acceptance Criteria**

- ☐ Rider can see the route name rendered in semantic.type.title.lg (Geist 17/600) at the top of the detail screen for every curated route with a name field.
- ☐ Rider can see the primaryArchetype displayed as a Badge component (variant='secondary') using the DB archetype value mapped through the UI label table (e.g. 'mountain' → 'Mountain').
- ☐ Rider can see lengthMiles rendered via StatRow with icon 'ruler' and value clamped to ≤999 mi with a '1000+ mi' label for the 41 junk-outlier routes, and blank/hidden for the 64 routes at 0.
- ☐ Rider can see the summary block rendered in semantic.type.body.md (Geist 14/400, content.secondary color) when the summary field is populated (~68% of routes).
- ☐ Rider can see 'No description yet' in italic semantic.type.body.md with semantic.color.onSurface.muted color when the summary field is absent (~32% of routes).
- ☐ Rider can see five labeled horizontal score bars (Curvature, Scenic, Technical, Traffic, Remoteness) where each bar fill width equals the dimension score × 100%, bar fill uses semantic.color.primary.default (copper-500 #EE7C2B), and track uses semantic.color.surface.inset.
- ☐ Rider can see a composite score headline rendered as Math.round(compositeScore × 100) followed by '/100' in semantic.type.title.lg, positioned above the score bars.
- ☐ Rider can see the routePolyline rendered on a MapboxMapView for routes where routePolyline is present (~55%), with the camera fitting to the polyline bounds.
- ☐ Rider can see a single centroid marker on MapboxMapView plus a Badge (variant='outline', label='Approximate location') when routePolyline is absent (~45% of routes).
- ☐ Rider can see a WeatherPillsRow displaying wind, temperature, and conditions for the route's centroid coordinates when weather data is available.
- ☐ Rider can see a 'Save' Button (variant='primary') and a 'Ride It' Button (variant='outline') in the action row at the bottom of the detail screen.
- ☐ System renders the detail screen without a JS error or blank section for any of the 5,654 real curated_routes rows against live Convex dev.

---

## UC-DTL-02: Score visualization: 0–1 float → labeled percentage bar

The five dimension scores (curvatureScore, scenicScore, technicalScore, trafficScore, remotenessScore) arrive from Convex as floats in the range 0–1. The ScoreDimensionBar component (new, to be authored in components/discovery/score-dimension-bar.tsx) converts each value to a visual horizontal bar with a percentage label. This component is the canonical score-visualization primitive; it must not be duplicated or inline-styled.

**Test tier:** integration  
**Verification service:** live Convex dev — query real curated_routes rows and verify rendered bar widths match expected percentages on device

**Acceptance Criteria**

- ☐ Rider can see a horizontal bar whose fill width equals Math.round(score × 100)% of the available track width for any score in [0, 1].
- ☐ Rider can see a label to the left of the bar (e.g. 'Scenic') in semantic.type.label.sm (Geist 12/600, content.secondary color) with minimum width of 80dp to keep all five bars left-aligned.
- ☐ Rider can see the percentage value (e.g. '74%') to the right of the bar in semantic.type.label.sm (instrument/JetBrains Mono for numeric readouts, per typography tokens) using content.primary color.
- ☐ Rider can see the bar fill color as semantic.color.primary.default (#EE7C2B copper) and the track color as semantic.color.surface.inset with borderRadius of semantic.radius.full (pill shape).
- ☐ Rider can see bar height of 8dp (spacing.3 per dimensions token, matching Slider component track height convention).
- ☐ System renders the composite score as a single headline number (Math.round(compositeScore × 100) + '/100') in semantic.type.title.lg above the five dimension bars.
- ☐ System does not render any score bar section when all five dimension score fields are null or undefined (graceful omission, no broken layout).

---

## UC-DTL-03: Geometry graceful degradation: centroid fallback with 'Approximate location' indicator

Approximately 45% of curated_routes have no routePolyline. The detail screen must handle this gracefully: show a centroid marker on the map, display a clearly labeled 'Approximate location' note so the rider knows the exact route trace is not available, and never show a blank or crashed map section.

**Test tier:** e2e  
**Verification service:** real iOS device against live Convex dev — test against a known no-polyline route from the 45% population

**Acceptance Criteria**

- ☐ Rider can see a MapboxMapView centered on the route centroid with a single marker when routePolyline is null or absent.
- ☐ Rider can see an 'Approximate location' Badge (variant='outline') rendered below the map section when routePolyline is absent, using semantic.color.border.default border and semantic.color.onSurface.default text.
- ☐ Rider can see the map camera zoomed to zoom level 11 centered on the centroid when no polyline is present, giving regional context without over-zooming to a single point.
- ☐ Rider cannot see any 'Approximate location' indicator when routePolyline is present and rendered.
- ☐ System does not crash or render a blank map section for routes without polyline data against live Convex dev.

---

## UC-DTL-04: Detail actions: Save and Ride It operate end-to-end

From the detail screen a rider can save the route to their library (UC-SAVE-07 in the RN planner's domain, referenced here for UX completeness) or immediately hand off to a maps app. Both buttons must be reachable without scrolling on a standard iPhone 14 viewport. The 'Ride It' button opens Apple Maps (iOS) or Google Maps (Android) via deep link using the centroid coordinates as the destination.

**Test tier:** e2e  
**Verification service:** real iOS device + real Android device — tap Ride It and verify the maps app opens with the correct destination

**Acceptance Criteria**

- ☐ Rider can see the Save button and Ride It button without scrolling on an iPhone 14 (390pt wide, 844pt tall) in portrait orientation.
- ☐ Rider can tap 'Save' and see the button enter a loading state (ActivityIndicator replacing button label) while the Convex mutation runs.
- ☐ Rider can see the Save button switch to a 'Saved' confirmed state (checkmark icon, variant='success' Badge) after the mutation resolves, without navigating away.
- ☐ Rider can tap 'Ride It' and see Apple Maps open (iOS) or Google Maps open (Android) with the route centroid as the destination.
- ☐ Rider can tap 'Ride It' when Google Maps is not installed on Android and see the system browser open maps.google.com with the destination parameter.
- ☐ System does not crash when the deep-link target app is not installed, falling back to the platform's URL handler.

---
