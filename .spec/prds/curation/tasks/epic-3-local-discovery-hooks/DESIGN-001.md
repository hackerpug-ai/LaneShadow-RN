# DESIGN-001: RouteDiscoveryScreen Layout with Map + Overlay Controls

**Task ID:** DESIGN-001
**Epic:** Epic 3 - Local Discovery Layer & React Hooks
**Assigned To:** frontend-designer
**Priority:** P0
**Effort:** L
**Estimate:** 180 min
**Type:** [DESIGN]
**Depends On:** (none)

---

## BACKGROUND

The RouteDiscoveryScreen is the primary screen for the route discovery experience (UC-DISC-01 through UC-DISC-04). It uses the existing `MapboxMapView` component with a full-bleed map, glassmorphic overlay controls for archetype filtering and sort toggling, and pin clustering at low zoom levels.

This is a DESIGN task — the output is a presentational React component with hardcoded mock data and semantic theme tokens. Business logic (data fetching, hooks) will be wired in by CUR-012. The component must use `useSemanticTheme()` for all colors, spacing, and typography.

**PRD references:** UC-DISC-01 (Browse Routes on Map), UC-DISC-02 (Filter by Archetype), UC-DISC-04 (Sort by Score or Proximity), S8 (UI Infrastructure), styles/RULES.md.

---

## ACCEPTANCE CRITERIA

### AC-001: Map centered on user location with pins
**GIVEN** the RouteDiscoveryScreen is rendered
**WHEN** the component mounts
**THEN** the map fills the entire screen (full-bleed) using `MapboxMapView`
**AND** mock pin data is displayed at predefined coordinates
**AND** the map centers on a default user location (e.g., Denver: 39.7, -105.0)
**AND** `MenuLayout` is used as the screen wrapper (not SafeAreaView as root)

**Verify:** Render the component, verify full-bleed map with visible pins.

### AC-002: Pan/zoom refreshes visible pins
**GIVEN** pins are displayed on the map
**WHEN** the user pans or zooms the map
**THEN** the visible region updates
**AND** pins within the new viewport are shown
**AND** pins outside the viewport are removed (not hidden off-screen)

**Verify:** Pan the map and observe pins update based on visible region.

### AC-003: Archetype filter works
**GIVEN** the filter bar is visible above the map
**WHEN** the user taps an archetype chip (e.g., "Twisties")
**THEN** only pins matching that archetype are shown
**AND** the chip shows a count of matching routes
**AND** multiple chips can be selected simultaneously
**AND** an "All" chip clears the filter

**Verify:** Tap archetype chips and verify pin filtering.

### AC-004: Sort toggle updates badges
**GIVEN** the sort toggle is visible
**WHEN** the user toggles between "Best" and "Nearest"
**THEN** pins update their visual state
**AND** "Best" mode shows rank numbers on top-10 pins
**AND** "Nearest" mode shows distance labels on pins

**Verify:** Toggle sort mode and verify pin badge changes.

### AC-005: Pin clustering at low zoom
**GIVEN** the map is at a low zoom level (country/state view)
**WHEN** many pins would overlap
**THEN** pins are clustered into group markers showing a count
**AND** tapping a cluster zooms in to reveal individual pins
**AND** clusters use the copper accent color from the theme

**Verify:** Zoom out and verify clusters appear with counts.

### AC-006: Empty state when no routes
**GIVEN** no routes match the current filters or location
**WHEN** the map renders
**THEN** a glassmorphic empty state overlay appears
**AND** it shows a message like "No routes in this area"
**AND** it does not fully cover the map (semi-transparent)

**Verify:** Set filter to return zero results, verify empty state overlay.

---

## TEST CRITERIA

- [ ] Map renders full-bleed using existing MapboxMapView
- [ ] MenuLayout used as root wrapper (not SafeAreaView)
- [ ] Archetype filter chips render with counts
- [ ] Sort toggle switches between Best/Nearest modes
- [ ] Pin clustering activates at low zoom levels
- [ ] Empty state overlay appears for zero results
- [ ] All colors accessed via `useSemanticTheme()` — no hardcoded hex
- [ ] No elevation value exceeds 3 on any overlay element
- [ ] Component renders without runtime errors in Storybook

---

## READING LIST

- `styles/RULES.md` -- Full design system rules, theme tokens, color palette
- `.spec/prds/curation/04-uc-discovery.md` -- UC-DISC-01 through UC-DISC-04
- `.spec/prds/curation/09-technical-requirements.md` -- S8 (UI Infrastructure)
- Existing `components/map/MapboxMapView.tsx` -- Map component API
- Existing `components/layout/MenuLayout.tsx` -- Screen wrapper pattern

---

## GUARDRAILS

**WRITE-ALLOWED FILES:**
- `components/discovery/route-discovery-screen.tsx` (NEW) — Main screen layout
- `components/discovery/discovery-filter-bar.tsx` (NEW) — Archetype filter chips bar
- `components/discovery/discovery-sort-toggle.tsx` (NEW) — Best/Nearest toggle

**NEVER:**
- Replace map with a list view (map is always primary — design priority #1)
- Use SafeAreaView as root (use MenuLayout instead)
- Use elevation > 3 on any overlay element
- Hardcode hex colors (use `useSemanticTheme()` for everything)
- Wire up real data hooks (this is a DESIGN task — use mock data only)
- Import or reference Zustand stores (design components receive props only)

---

## CODE PATTERN

```typescript
// components/discovery/route-discovery-screen.tsx
import { useSemanticTheme } from '@theme/hooks/useSemanticTheme';
import { MapboxMapView } from '@components/map/MapboxMapView';
import { MenuLayout } from '@components/layout/MenuLayout';

// Mock data for design — will be replaced by CUR-012
const MOCK_PINS = [
  { id: '1', lat: 39.7, lng: -105.0, archetype: 'twisties', name: 'Test Route' },
  // ... more mock pins
];

export function RouteDiscoveryScreen() {
  const { semantic } = useSemanticTheme();

  return (
    <MenuLayout>
      <MapboxMapView
        centerCoordinate={[39.7, -105.0]}
        style={{ flex: 1 }}
      >
        {/* Overlay controls */}
        <DiscoveryFilterBar
          selectedArchetypes={selectedArchetypes}
          onArchetypeChange={setSelectedArchetypes}
          counts={archetypeCounts}
        />
        <DiscoverySortToggle
          mode={sortMode}
          onModeChange={setSortMode}
        />
      </MapboxMapView>
    </MenuLayout>
  );
}
```

---

## AGENT INSTRUCTIONS

1. Read `styles/RULES.md` before writing any JSX — all styling must use semantic theme tokens
2. Study the existing `MapboxMapView` component API for props and children patterns
3. Study `MenuLayout` for the correct screen wrapper pattern
4. Create `route-discovery-screen.tsx` with full-bleed map and overlay controls
5. Create `discovery-filter-bar.tsx` with horizontal scrollable archetype chips
6. Create `discovery-sort-toggle.tsx` with Best/Nearest segmented control
7. Use mock data only — no hooks, no Zustand, no Convex imports
8. All overlays must be glassmorphic (semi-transparent background with blur)
9. Verify the component renders in isolation without errors

---

## ORCHESTRATOR VERIFICATION PROTOCOL

1. Run `npm run typecheck` — must pass
2. Run `npm run lint` — zero lint errors
3. Verify `components/discovery/route-discovery-screen.tsx` uses `MenuLayout` as root
4. Verify no hardcoded hex colors (grep for `#[0-9A-Fa-f]{6}` in new files — only allowed in theme files)
5. Verify no elevation value > 3 in any style
6. Verify no real data hooks imported (no `useRouteDiscovery`, no Zustand stores)
7. Verify component exports are clean and usable by CUR-012

---

## AGENT ASSIGNMENT

**Primary:** frontend-designer
**Reason:** Pure presentational UI component — layout, styling, and visual design. No business logic.

---

## EVIDENCE GATES

- [ ] `components/discovery/route-discovery-screen.tsx` renders a full-bleed map
- [ ] `components/discovery/discovery-filter-bar.tsx` renders archetype filter chips
- [ ] `components/discovery/discovery-sort-toggle.tsx` renders sort toggle
- [ ] TypeScript compiles cleanly
- [ ] No hardcoded hex colors in any component file

---

## REVIEW CRITERIA

- Map is full-bleed (fills entire screen)
- Overlay controls are glassmorphic (semi-transparent, blurred background)
- Filter chips are horizontally scrollable
- Sort toggle is a segmented control (Best | Nearest)
- Pin clustering renders at low zoom with count badges
- Empty state is semi-transparent (map still visible behind it)
- All visual tokens come from `useSemanticTheme()`
- Copper accent color used for pins and active states

---

## DEPENDENCIES

- (none — this is a leaf design task)

---

## NOTES

- This is a DESIGN task. CUR-012 will wire up the real data hooks and Convex queries.
- Mock pin data should cover all 6 archetypes for visual testing.
- The filter bar should be positioned at the top of the screen, below any status bar area.
- The sort toggle should be compact and positioned near the filter bar.
- Pin clustering should use Mapbox's built-in clustering with custom cluster markers.
