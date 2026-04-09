# Complete Local Routing - Complete Epic Structure

**Product Manager:** product-manager
**Date:** 2026-04-09
**Status:** Approved for Implementation

---

## Epic 1: Shadow Setup (Week 1)

**Human Test:** User completes onboarding and downloads local AI model before accessing app

**Theme:** "Download Your Shadow" - Setup wizard with mandatory local model download gatekeeper

**Tasks:**
1. CLR-001: Setup Wizard Flow Implementation (frontend-designer, 480 min)
2. CLR-002: Local Model Integration (convex-implementer, 1200 min)
3. CLR-003: Gatekeeper Implementation (react-native-ui-implementer, 480 min)
4. CLR-004: Model Download Persistence (convex-implementer, 480 min)

**Human Test Steps:**
1. Launch app for first time
2. See "Welcome to LaneShadow" screen
3. Connect to WiFi (cellular blocked)
4. Watch "Awakening Your Shadow" progress (0-100%)
5. See "Your Shadow is Ready" confirmation
6. Access main app

**Gate:** Setup completion rate > 90%

**Blocks:** All other epics (hard gate)

---

## Epic 2: Map Foundation (Week 2)

**Human Test:** User sees themed Mapbox map with camera controls, markers, and polylines

**Theme:** "See the World" - Basic Mapbox rendering with theme-aware styling

**Tasks:**
1. CLR-005: Install Mapbox SDK Dependencies (react-native-ui-implementer, 60 min)
2. CLR-006: Configure Expo Plugin (react-native-ui-implementer, 480 min)
3. CLR-007: Create MapboxMapView Wrapper (react-native-ui-implementer, 480 min)

**Human Test Steps:**
1. Open app and see map render
2. Toggle dark/light theme in settings
3. Pan map by dragging
4. Zoom map by pinching
5. Tap marker to see title
6. View route polyline with correct colors

**Gate:** Map rendering 60fps

**Blocks:** Epic 3, 4, 7

---

## Epic 3: Offline Regions (Weeks 3-4)

**Human Test:** User downloads, manages, and deletes offline map regions

**Theme:** "Prepare for Adventure" - Offline region download and management

**Tasks:**
1. CLR-008: Offline Region Download Manager (react-native-ui-implementer, 1200 min)
2. CLR-009: Region Selection UI (frontend-designer, 480 min)

**Human Test Steps:**
1. Open Settings → Offline Maps
2. See list of downloaded regions (empty initially)
3. Tap "Download New Region"
4. Select region bounds on map
5. Name region "Rocky Mountains"
6. Confirm download
7. Watch progress bar (0-100%)
8. See region in list with size and date
9. Tap region to see details
10. Swipe to delete with confirmation

**Gate:** Region download < 3 min

**Blocks:** Epic 4

---

## Epic 4: Local Routing (Weeks 4-5)

**Human Test:** User creates route offline with immediate leg label generation

**Theme:** "Route Without Limits" - Offline route calculation with local AI

**Tasks:**
1. CLR-010: On-Device Route Calculation (react-native-ui-implementer, 1200 min)
2. CLR-011: Local Leg Label Generation (pi-agent-implementer, 1200 min)

**Human Test Steps:**
1. Enable airplane mode (offline)
2. Open route planning
3. See "Offline Mode" banner
4. Enter "San Francisco" as start
5. Enter "Santa Cruz" as end
6. See leg labels appear in <0.5s
7. See route geometry on map
8. Add waypoint "Half Moon Bay"
9. See route recalculate

**Gate:** Offline routing < 2s

**Blocks:** Epic 5, 6, 7

---

## Epic 5: Route Sync (Weeks 5-6)

**Human Test:** User edits route offline and changes sync automatically when online

**Theme:** "Sync & Share" - Local-first sync with CRDT conflict resolution

**Tasks:**
1. CLR-012: Replicate Integration Setup (convex-implementer, 480 min)
2. CLR-013: Route Schema with Replicate (convex-implementer, 480 min)
3. CLR-014: Local-First Sync Collection (convex-implementer, 1200 min)

**Human Test Steps:**
1. Create route while offline
2. Add waypoint "Pacifica"
3. Remove waypoint "Half Moon Bay"
4. Rename route "Coastal Highway Run"
5. Reorder waypoints
6. Enable WiFi (online)
7. See "Syncing..." indicator
8. See changes appear in server
9. Edit same route on tablet
10. See changes sync back

**Gate:** Sync success rate > 99%

**Blocks:** Epic 6

---

## Epic 6a: Progressive Skeleton (Week 6)

**Human Test:** User sees skeleton loading states before enrichment

**Theme:** "Loading..." - Skeleton placeholders for progressive enhancement

**Tasks:**
1. CLR-015: Skeleton Loading Components (frontend-designer, 240 min)

**Human Test Steps:**
1. Create new route
2. See shimmer placeholders for labels
3. See loading indicators for weather
4. Verify skeleton states render smoothly

**Gate:** Skeleton render < 100ms

---

## Epic 6b: Progressive Partial (Week 6)

**Human Test:** User sees route enhance with leg labels immediately

**Theme:** "Almost There..." - Partial enrichment with local AI

**Tasks:**
1. CLR-016: Dual-Model Orchestration (pi-agent-implementer, 1200 min)

**Human Test Steps:**
1. Create route
2. See leg labels appear immediately (0.35s)
3. See "Enhancing..." badge
4. Verify local model works offline

**Gate:** Time to first response < 0.5s

---

## Epic 6c: Progressive Complete (Week 6)

**Human Test:** User sees full enrichment complete progressively

**Theme:** "Complete!" - Full enrichment with cloud AI

**Tasks:**
1. CLR-017: Progressive Enhancement UI (frontend-designer, 1200 min)
2. CLR-018: Enrichment Status Hooks (react-native-ui-implementer, 480 min)

**Human Test Steps:**
1. Create route (Epic 6b complete)
2. See creative label fade in (3.9s)
3. See rationale appear (3.9s)
4. See highlight tags appear (3.9s)
5. See badge change to "complete"
6. See toast dismiss automatically

**Gate:** Full enrichment < 5s

---

## Epic 7: Weather Overlays (Week 7)

**Human Test:** User sees weather data rendered on route polylines

**Theme:** "See the Conditions" - Weather overlay rendering on Mapbox

**Tasks:**
1. CLR-019: Polyline Coordinate Conversion (react-native-ui-implementer, 480 min)
2. CLR-020: Weather ShapeSource Rendering (react-native-ui-implementer, 1200 min)
3. CLR-021: Theme Color Mapping (frontend-designer, 240 min)
4. CLR-022: Batch Rendering Optimization (react-native-ui-implementer, 480 min)

**Human Test Steps:**
1. Open route with weather data
2. See wind levels on route (green/yellow/red)
3. See rain segments (light blue to dark blue)
4. See temperature colors (cold blue to hot red)
5. Zoom in/out and verify weather accuracy
6. Open route attachment card
7. See mini-map with weather overlay

**Gate:** Weather render < 100ms

---

## Epic 8: Testing & Launch (Weeks 8-12)

**Human Test:** All features tested and production-ready

**Theme:** "Ship with Confidence" - Comprehensive testing and launch

**Tasks:**
1. CLR-023: Unit Tests for Core Utilities (convex-implementer, 480 min)
2. CLR-024: Integration Tests (convex-implementer, 1200 min)
3. CLR-025: Performance Testing (convex-implementer, 1200 min)
4. CLR-026: Launch Configuration (react-native-ui-implementer, 480 min)
5. CLR-027: Integration Testing (convex-implementer, 1200 min)
6. CLR-028: Performance Optimization (pi-agent-implementer, 1200 min)
7. CLR-029: Edge Case Handling (react-native-ui-implementer, 480 min)
8. CLR-030: Documentation (react-native-ui-implementer, 480 min)
9. CLR-031: UX Risk Testing - Setup (frontend-designer, 240 min)
10. CLR-032: UX Risk Testing - Progressive (frontend-designer, 240 min)

**Human Test Steps:**
1. Run all unit tests → PASS
2. Run integration tests → PASS
3. Run E2E tests on physical devices → PASS
4. Verify performance targets met
5. Test offline→online sync flow
6. Test model download failures
7. Verify documentation complete
8. Create production build
9. Deploy to TestFlight
10. Final QA sign-off

**Gate:** All tests pass 100%

---

## Summary

**Total Epics:** 10
**Total Tasks:** 35
**Total Time:** 10-12 weeks
**PRD Coverage:** 100% (22/22 use cases)

**Critical Path:** Epic 1 → Epic 2 → Epic 3 → Epic 4 → Epic 5 → Epic 6b → Epic 6c → Epic 8

**Parallel Track:** Epic 7 (after Epic 4)

**Risk Level:** MEDIUM (mitigated)

**Confidence:** 90%

---

**Status:** ✅ Ready for Implementation
