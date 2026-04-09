# Epic 2: Map Foundation

**Sequence:** 2
**Timeline:** Week 2
**Theme:** "See the World"
**Status:** Blocked by Epic 1

---

## Overview

User sees themed Mapbox map with camera controls, markers, and polylines. This epic migrates from Google Maps to Mapbox SDK with @rnmapbox/maps, establishing the foundation for all map-dependent features.

---

## Human Test Deliverable

**What a human can test after this epic:**

User opens app and sees Mapbox map render correctly with dark/light theme support, pan/zoom controls work smoothly, camera positioning responds to programmatic controls, markers display at correct coordinates, and polylines render with appropriate colors.

**Test Steps:**
1. Open app after Epic 1 completion
2. See map render in correct theme (dark/light)
3. Pan map by dragging
4. Zoom map by pinching
5. Tap camera controls (recenter, fit bounds)
6. Toggle theme in settings
7. Verify map style updates immediately
8. View route polyline with markers

---

## Acceptance Criteria

From PRD Sections:
- 03-functional-groups.md (MAP group)
- 04-uc-map.md (UC-MAP-01 through UC-MAP-05)
- 08-technical-requirements.md (Mapbox integration)

| Criterion | Given | When | Then |
|-----------|-------|------|------|
| 1 | App launches after Epic 1 | MapboxMapView component mounts | Map renders with camera at initial position |
| 2 | Theme is dark mode | MapboxMapView renders | Map uses dark-v11 style URL |
| 3 | Theme is light mode | MapboxMapView renders | Map uses streets-v12 style URL |
| 4 | System theme changes | MapboxMapView receives theme update | Map style updates immediately (no lag) |
| 5 | User drags map | Touch input detected | Map pans smoothly |
| 6 | User pinches map | Touch input detected | Map zooms smoothly |
| 7 | Markers array provided | Component renders | All markers display at correct coordinates ([lng, lat]) |
| 8 | Polylines array provided | Component renders | Polylines render with correct colors and stroke widths |
| 9 | Invalid coordinates provided | Component attempts render | Error boundary catches and displays fallback |
| 10 | Camera fitToCoordinates called | Route geometry available | Camera animates to fit route bounds with padding |

---

## Tasks

### CLR-005: Install Mapbox SDK Dependencies
**Type:** INFRA
**Agent:** react-native-ui-implementer
**Effort:** 60 min (1 hour)

**Objective:** Install @rnmapbox/maps v10.1.0 and verify compatibility

**Success:** Package installed without conflicts, dependency tree clean

**Files:**
- `package.json` (MODIFY)

**Dependencies:** None

---

### CLR-006: Configure Expo Plugin
**Type:** INFRA
**Agent:** react-native-ui-implementer
**Effort:** 480 min (8 hours)

**Objective:** Configure @rnmapbox/maps Expo plugin with Mapbox tokens

**Success:** Expo plugin configured, app builds successfully on iOS and Android

**Files:**
- `app.config.ts` (MODIFY)
- `.env` (MODIFY)

**Dependencies:** CLR-005

---

### CLR-007: Create MapboxMapView Wrapper
**Type:** FEATURE
**Agent:** react-native-ui-implementer
**Effort:** 480 min (8 hours)

**Objective:** Build MapboxMapView wrapper with camera controls, theme support, and coordinate conversion

**Success:** MapboxMapView renders map with camera positioning, marker support, polyline rendering, and theme-aware style URLs

**Files:**
- `components/map/mapbox-map-view.tsx` (NEW)
- `lib/mapbox/coordinate-converter.ts` (NEW)

**Dependencies:** CLR-006

---

## Human Testing Gate

**Metric:** Map rendering 60fps

**Measurement:** Frames per second during pan/zoom operations

**Success Criteria:**
- Map renders without errors on iOS and Android
- Theme switches immediately (< 100ms)
- Camera animations are smooth
- 60fps rendering during pan/zoom
- No coordinate drift or offset errors
- Markers and polylines display correctly

**Testing Method:**
- Performance profiling with React Native Debugger
- Manual testing on physical devices (iOS + Android)
- Coordinate conversion unit tests
- Theme switch latency measurement

---

## PRD Coverage

**Use Cases Covered:**
- UC-MAP-01: Install and Configure Mapbox SDK
- UC-MAP-02: Render MapView with Theme Support
- UC-MAP-03: Control Camera Position
- UC-MAP-04: Render Markers and Shapes
- UC-MAP-05: Handle Coordinate Systems

**PRD Sections:**
- 03-functional-groups.md (MAP group)
- 04-uc-map.md (All MAP use cases)
- 08-technical-requirements.md (Mapbox integration)

---

## Blocks

**Blocked By:** Epic 1 (Shadow Setup)

**Blocks:** Epic 3, 4, 7 (all require map rendering)

---

## Design References

**HTML Mockups:** None (technical migration, user-visible changes minimal)

**Existing Components:**
- `components/map/map-view.tsx` - Google Maps wrapper (reference for API)

**Pattern:**
```typescript
const mapStyles = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/streets-v12'
};
```

**Anti-Pattern:** Do NOT use Google Maps [lat, lng] format - MUST flip to [lng, lat]

---

## Risk Mitigation

**Risk:** Coordinate conversion bugs cause rendering errors

**Mitigation:**
- Comprehensive unit tests for coordinate conversion
- Code review requirement for all coordinate operations
- Property-based testing with edge cases
- Visual verification on real devices

**Risk:** Performance regression vs Google Maps

**Mitigation:**
- Baseline benchmarking before migration
- Continuous profiling during development
- Level-of-detail rendering for large routes
- Batch rendering optimization

---

## Notes

**Critical Path:** Second epic - enables all map-dependent features

**Coordinate System:** Google uses [lat, lng], Mapbox uses [lng, lat] - ALL coordinates must be flipped

**Style URLs:** Use Mapbox's default styles initially, custom copper-accented styles in future epic

**Camera Controls:** Preserve existing camera API from Google Maps wrapper for compatibility

---

## Next Steps

1. Complete Epic 1 (Shadow Setup)
2. Implement CLR-005 through CLR-007
3. Pass human testing gate (60fps rendering)
4. Proceed to Epic 3 (Offline Regions) and Epic 4 (Local Routing) in parallel
