# Epic 8: Testing & Launch

**Epic ID:** CLR-E008
**Status:** Pending
**Timeline:** Weeks 8-12
**PRD Coverage:** All UCs (validation)

---

## Human Test Deliverable

All features tested and production-ready

**Test Steps:**
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

## Theme

"Ship with Confidence" - Comprehensive testing and launch

---

## Tasks

### CLR-023: Unit Tests for Core Utilities

**Assigned To:** convex-implementer
**Estimate:** 480 min
**Type:** [FEATURE]

**Specification:**
Write unit tests for core utilities:
- Coordinate conversion (Google ↔ Mapbox)
- Polyline encode/decode
- Weather data formatting
- Model validation

**Prerequisites:**
- All feature epics complete

**Examples:**
```typescript
// lib/__tests__/polyline.test.ts
describe("Polyline Conversion", () => {
  test("converts Google [lat, lng] to Mapbox [lng, lat]", () => {
    const google = [[37.7749, -122.4194]]
    const mapbox = convertToMapbox(google)
    expect(mapbox).toEqual([[-122.4194, 37.7749]])
  })
})
```

**Constraints:**
- Must achieve > 80% code coverage
- Must test edge cases (poles, date line)
- Must test error paths

**Acceptance Criteria:**
- Unit tests cover core utilities
- Code coverage > 80%
- All tests pass
- Edge cases covered

---

### CLR-024: Integration Tests

**Assigned To:** convex-implementer
**Estimate:** 1200 min
**Type:** [FEATURE]

**Specification:**
Write integration tests for critical flows:
- Offline region download
- Offline route calculation
- Route sync (offline→online)
- Progressive enrichment
- Weather overlay rendering

**Prerequisites:**
- CLR-023 complete (Unit tests passing)

**Examples:**
```typescript
// __tests__/integration/offline-routing.test.ts
describe("Offline Routing", () => {
  test("calculates route without internet", async () => {
    await enableAirplaneMode()
    const route = await calculateRoute(waypoints)
    expect(route.geometry).toBeDefined()
  })
})
```

**Constraints:**
- Must test real offline scenarios
- Must use test Convex deployment
- Must clean up test data

**Acceptance Criteria:**
- Integration tests cover critical flows
- All tests pass
- Offline scenarios tested
- Test data cleaned up

---

### CLR-025: Performance Testing

**Assigned To:** convex-implementer
**Estimate:** 1200 min
**Type:** [FEATURE]

**Specification:**
Run performance benchmarks and optimization:
- Route calculation time (offline)
- Leg label generation (Qwen3.5)
- Sync performance (CRDT delta size)
- Weather rendering FPS
- Memory usage profiling

**Prerequisites:**
- CLR-024 complete (Integration tests passing)

**Examples:**
```typescript
// __tests__/performance/routing.bench.ts
describe("Routing Performance", () => {
  test("offline routing < 2s", async () => {
    const start = Date.now()
    await calculateRoute(waypoints)
    const duration = Date.now() - start
    expect(duration).toBeLessThan(2000)
  })
})
```

**Constraints:**
- Must meet all performance gates
- Must profile on physical devices
- Must document optimization opportunities

**Acceptance Criteria:**
- All performance gates met
- Benchmarks documented
- Optimization opportunities identified

---

### CLR-026: Launch Configuration

**Assigned To:** react-native-ui-implementer
**Estimate:** 480 min
**Type:** [FEATURE]

**Specification:**
Configure production build settings:
- Mapbox token provisioning
- Environment variables
- Production certificates
- App Store Connect configuration
- TestFlight setup

**Prerequisites:**
- CLR-025 complete (Performance validated)

**Examples:**
```typescript
// app.config.js
export default {
  expo: {
    extra: {
      mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN
    }
  }
}
```

**Constraints:**
- Must use secure token storage
- Must separate dev/prod environments
- Must follow release process

**Acceptance Criteria:**
- Production builds successfully
- Mapbox token configured
- Environment variables set
- Certificates provisioned
- TestFlight ready

---

### CLR-027: Integration Testing

**Assigned To:** convex-implementer
**Estimate:** 1200 min
**Type:** [FEATURE]

**Specification:**
Run comprehensive integration testing:
- Test offline→online sync flow
- Test model download failures
- Test concurrent enrichment requests
- Test cross-device sync
- Test weather cache invalidation

**Prerequisites:**
- CLR-026 complete (Launch configured)

**Examples:**
```typescript
// __tests__/integration/sync-flow.test.ts
describe("Sync Flow", () => {
  test("offline edits sync when online", async () => {
    await enableAirplaneMode()
    await editRoute(routeId, { name: "Offline Edit" })
    await disableAirplaneMode()
    await waitForSync()
    const serverRoute = await getRouteFromServer(routeId)
    expect(serverRoute.name).toBe("Offline Edit")
  })
})
```

**Constraints:**
- Must test failure scenarios
- Must test recovery paths
- Must validate conflict resolution

**Acceptance Criteria:**
- Offline→online flow tested
- Failure scenarios covered
- Recovery paths validated
- Conflicts resolved correctly

---

### CLR-028: Performance Optimization

**Assigned To:** pi-agent-implementer
**Estimate:** 1200 min
**Type:** [FEATURE]

**Specification:**
Optimize performance based on benchmark results:
- Profile Qwen3.5 memory usage
- Optimize model loading time
- Implement model preloading
- Batch enrichment queue optimization
- Weather rendering optimization

**Prerequisites:**
- CLR-025 complete (Performance gaps identified)

**Examples:**
```typescript
// lib/ai/model-optimization.ts
export const preloadModel = async () => {
  // Preload Qwen3.5 on app launch
  await QwenModel.load()
}

export const optimizeBatchQueue = (queue: EnrichmentJob[]) => {
  // Group by priority and batch requests
}
```

**Constraints:**
- Must meet all performance gates
- Must not sacrifice functionality
- Must document trade-offs

**Acceptance Criteria:**
- Performance gates met
- Memory usage < 1.5GB for Qwen3.5
- Model loading optimized
- Batch queue optimized
- Optimization documented

---

### CLR-029: Edge Case Handling

**Assigned To:** react-native-ui-implementer
**Estimate:** 480 min
**Type:** [FEATURE]

**Specification:**
Implement edge case handling:
- Model download failure → retry UX
- Corrupted model cache → re-download
- Out-of-disk-space → graceful degradation
- Concurrent inference → request queuing
- Offline data missing → clear error messaging

**Prerequisites:**
- CLR-027 complete (Edge cases identified)

**Examples:**
```typescript
// lib/ai/error-handling.ts
export const handleModelFailure = async (error: Error) => {
  if (error instanceof CorruptedModelError) {
    await clearModelCache()
    await downloadModel()
  }
  if (error instanceof OutOfSpaceError) {
    showStorageFullAlert()
  }
}
```

**Constraints:**
- Must handle all error states
- Must provide clear user messaging
- Must offer recovery paths

**Acceptance Criteria:**
- Model download failures handled
- Corrupted cache recovered
- Out-of-space managed gracefully
- Concurrent requests queued
- Offline missing data reported clearly

---

### CLR-030: Documentation

**Assigned To:** react-native-ui-implementer
**Estimate:** 480 min
**Type:** [FEATURE]

**Specification:**
Write comprehensive documentation:
- Migration notes for developers
- Offline region download user guide
- Cost analysis documentation
- Architecture decision records
- Troubleshooting guide

**Prerequisites:**
- CLR-029 complete (Edge cases handled)

**Examples:**
```markdown
# Migration Guide

## Coordinate System

Mapbox uses [lng, lat] while Google uses [lat, lng].
Always convert coordinates using `lib/polyline.ts`.
```

**Constraints:**
- Must be clear and concise
- Must include examples
- Must cover troubleshooting

**Acceptance Criteria:**
- Migration guide written
- User guide written
- Cost analysis documented
- Architecture decisions recorded
- Troubleshooting guide available

---

### CLR-031: UX Risk Testing - Setup

**Assigned To:** frontend-designer
**Estimate:** 240 min
**Type:** [DESIGN] [FEATURE]

**Specification:**
Test UX risk areas for Shadow Setup flow:
- Model download abandonment rate
- Progress clarity
- WiFi requirement messaging
- Background download behavior
- App state handling (background/foreground)

**Prerequisites:**
- Epic 1 complete (Shadow Setup working)

**Test Scenarios:**
1. User starts download on WiFi
2. User switches to cellular (download pauses)
3. User backgrounds app (download continues)
4. User kills app (download resumes on restart)
5. Download fails (retry UX)

**Constraints:**
- Must test on physical devices
- Must measure abandonment rate
- Must validate messaging clarity

**Acceptance Criteria:**
- Abandonment rate < 10%
- Progress messaging clear
- WiFi requirement understood
- Background download works
- App state handled correctly

---

### CLR-032: UX Risk Testing - Progressive

**Assigned To:** frontend-designer
**Estimate:** 240 min
**Type:** [DESIGN] [FEATURE]

**Specification:**
Test UX risk areas for Progressive Enhancement flow:
- Skeleton state smoothness
- Fade-in animation timing
- Status badge clarity
- Toast notification timing
- Partial vs complete distinction

**Prerequisites:**
- Epic 6 complete (Progressive Enhancement working)

**Test Scenarios:**
1. Route created → skeleton shows
2. Leg labels appear → badge updates
3. Creative label fades in → user notices
4. Enrichment completes → toast shows
5. Multiple rapid route creations

**Constraints:**
- Must test on physical devices
- Must measure animation smoothness
- Must validate timing perception

**Acceptance Criteria:**
- Skeleton states smooth (60fps)
- Fade-in timing feels right
- Badge changes noticeable
- Toast timing appropriate
- Partial/complete distinction clear

---

## Dependencies

**Blocked By:** All feature epics (1-7)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Test flakiness | Retry logic, isolated test environment |
| Performance gates missed | CLR-028 optimization task |
| UX issues | CLR-031, CLR-032 UX testing |

---

## Definition of Done

- [ ] All tasks completed
- [ ] Human test steps pass
- [ ] All tests pass 100% gate met
- [ ] Production build deployed
- [ ] Documentation complete
- [ ] UX risks validated
