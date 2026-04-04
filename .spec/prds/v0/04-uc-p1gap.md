---
stability: FEATURE_SPEC
last_validated: 2026-03-04
prd_version: 1.0.0
functional_group: P1GAP
---

# Use Cases: Phase 1 Gap Closure (P1GAP)

Complete the partially-implemented weather overlay features.

| ID | Title | Description |
|----|-------|-------------|
| UC-P1GAP-01 | Rain Overlay Integration | Display rain forecast data on route cards and map polylines |
| UC-P1GAP-02 | Temperature Overlay Integration | Display temperature data on route cards and map polylines |
| UC-P1GAP-03 | Multi-Overlay Comparison | Enable side-by-side overlay switching for route comparison |

---

## UC-P1GAP-01: Rain Overlay Integration

**Description**: Rain forecast data is already fetched by the backend weatherProvider but not displayed in the UI. Integrate rain overlay badges into route option cards and enable rain-based polyline coloring on the map.

**Existing Infrastructure**:
- `convex/actions/agent/providers/weatherProvider.ts` - fetches rain data
- `components/planning/rain-badge.tsx` - exists but not wired
- `RouteSnapshot.overlays.rain` - data structure exists

**Acceptance Criteria**:
- [ ] Rider can see rain probability badge on each route option card
- [ ] Rider can toggle rain overlay on map view to see precipitation risk along route segments
- [ ] System displays rain data with time-based color coding (light/moderate/heavy)
- [ ] Rider can view rain forecast timing in route summary (e.g., "Rain expected 2-4pm")

---

## UC-P1GAP-02: Temperature Overlay Integration

**Description**: Temperature data is fetched but not displayed. Integrate temperature badges and enable temperature-based route segment coloring.

**Existing Infrastructure**:
- `convex/actions/agent/providers/weatherProvider.ts` - fetches temperature data
- `components/planning/temperature-badge.tsx` - exists but not wired
- `RouteSnapshot.overlays.temperature` - data structure exists

**Acceptance Criteria**:
- [ ] Rider can see temperature range badge on each route option card
- [ ] Rider can toggle temperature overlay on map view to see thermal conditions along route
- [ ] System displays temperature with comfort color coding (cold/comfortable/hot)
- [ ] Rider can view high/low temperatures in route summary

---

## UC-P1GAP-03: Multi-Overlay Comparison

**Description**: Enable riders to compare routes with different overlay combinations visible simultaneously or via quick toggle.

**Existing Infrastructure**:
- `components/sheets/route-options-sheet.tsx` - comparison container exists
- `components/planning/weather-pill.tsx` - composite weather display exists

**Acceptance Criteria**:
- [ ] Rider can toggle between overlay types (wind/rain/temp) on comparison view
- [ ] Rider can view all three overlays summarized in a compact weather strip per route
- [ ] System displays the "worst" weather condition prominently for quick decision-making
- [ ] Rider can expand overlay details for more granular segment-by-segment view
