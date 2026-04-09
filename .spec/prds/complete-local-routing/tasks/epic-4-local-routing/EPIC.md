# Epic 4: Local Routing

**Epic ID:** CLR-E004
**Status:** Pending
**Timeline:** Weeks 4-5
**PRD Coverage:** UC-RTE-01 through UC-RTE-04

---

## Human Test Deliverable

User creates route offline with immediate leg label generation

**Test Steps:**
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

---

## Theme

"Route Without Limits" - Offline route calculation with local AI

---

## Tasks

### CLR-010: On-Device Route Calculation

**Assigned To:** react-native-ui-implementer
**Estimate:** 1200 min
**Type:** [FEATURE]

**Specification:**
Implement offline route calculation using Mapbox SDK:
- Route calculation from downloaded offline data
- Waypoint support (multi-stop routes)
- Route geometry extraction as encoded polyline
- Bounds calculation for map fitting
- Error handling for insufficient offline data
- Fallback to online routing when offline data unavailable

**Prerequisites:**
- Epic 2 complete (MapboxMapView working)
- Epic 3 complete (Offline regions downloaded)

**Examples:**
```typescript
// lib/mapbox/routing.ts
export const calculateRoute = async (
  waypoints: CLLocationCoordinate2D[],
  profile: RouteProfile = "driving"
): Promise<Route> => {
  const response = await Mapbox.directions.getDirections({
    profile,
    waypoints,
    geometries: "polyline6"
  })
  
  return {
    geometry: response.routes[0].geometry,
    bounds: response.routes[0].bounds,
    duration: response.routes[0].duration,
    distance: response.routes[0].distance
  }
}
```

**Constraints:**
- Must use downloaded offline data when available
- Must handle offline data missing gracefully
- Must support up to 10 waypoints
- Must return provider-agnostic geometry format
- Must validate waypoint coordinates

**Acceptance Criteria:**
- System calculates route without internet connection
- User can add waypoints to route
- System displays route geometry on map
- System shows error when offline data insufficient
- Route calculation completes in < 2 seconds
- System stores route geometry in provider-agnostic format

---

### CLR-011: Local Leg Label Generation

**Assigned To:** pi-agent-implementer
**Estimate:** 1200 min
**Type:** [FEATURE]

**Specification:**
Integrate Qwen3.5 0.8B model for on-device leg label generation:
- Model loading with MLX framework
- In-memory model caching (singleton)
- "FROM → TO" label generation for route legs
- 0.35s target inference time
- Fallback to generic labels on failure
- Coordinate-to-place-name resolution

**Prerequisites:**
- Epic 1 complete (Qwen3.5 model downloaded)
- CLR-010 complete (Route legs available)

**Examples:**
```typescript
// lib/ai/local-enrichment.ts
export const generateLegLabels = async (
  legs: RouteLeg[]
): Promise<string[]> => {
  const model = await QwenModel.load()
  
  return Promise.all(legs.map(async leg => {
    const prompt = `Generate route label: ${leg.from.name} to ${leg.to.name}`
    const result = await model.infer(prompt, { maxTokens: 50 })
    return result.text || `${leg.from.name} → ${leg.to.name}`
  }))
}
```

**Constraints:**
- Must use cached model (singleton pattern)
- Must target < 0.5s inference time
- Must handle model failures gracefully
- Must work offline without network
- Must validate output format

**Acceptance Criteria:**
- System generates leg labels locally
- Leg labels appear in < 0.5 seconds
- System works offline without internet
- System shows fallback labels on model failure
- Labels follow "FROM → TO" format
- System caches model in memory

---

## Dependencies

**Blocks:** Epic 5 (Route Sync), Epic 6 (Progressive), Epic 7 (Weather)
**Blocked By:** Epic 2 (Map Foundation), Epic 3 (Offline Regions)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Offline data missing | Clear error messaging, fallback to online |
| Model failure | Generic label fallback |
| Performance regression | Benchmark before/after |

---

## Definition of Done

- [ ] All tasks completed
- [ ] Human test steps pass
- [ ] Offline routing < 2s gate met
- [ ] Leg labels < 0.5s gate met
- [ ] Unit tests for coordinate conversion
- [ ] Integration tests for offline flow
- [ ] Model inference benchmarks documented
