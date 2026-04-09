# Epic 5: Route Sync

**Epic ID:** CLR-E005
**Status:** Pending
**Timeline:** Weeks 5-6
**PRD Coverage:** UC-OFF-06, UC-OFF-07

---

## Human Test Deliverable

User edits route offline and changes sync automatically when online

**Test Steps:**
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

---

## Theme

"Sync & Share" - Local-first sync with CRDT conflict resolution

---

## Tasks

### CLR-012: Replicate Integration Setup

**Assigned To:** convex-implementer
**Estimate:** 480 min
**Type:** [FEATURE]

**Specification:**
Install and configure @trestleinc/replicate for local-first sync:
- Install dependencies: @trestleinc/replicate, @op-engineering/op-sqlite
- Install crypto polyfills: react-native-get-random-values, react-native-random-uuid
- Configure polyfills in app entry point
- Set up Replicate dev server
- Configure Convex integration

**Prerequisites:**
- Epic 4 complete (Route data structure defined)

**Examples:**
```bash
npm install @trestleinc/replicate @op-engineering/op-sqlite
npm install react-native-get-random-values react-native-random-uuid
```

```typescript
// index.ts (app entry)
import 'react-native-get-random-values'
import 'react-native-random-uuid'
```

**Constraints:**
- Must use op-sqlite for React Native (not WASM)
- Must initialize polyfills before any Replicate usage
- Must configure Convex backend component

**Acceptance Criteria:**
- System installs Replicate dependencies
- System installs crypto polyfills
- Polyfills initialize before Replicate usage
- Replicate dev server runs locally
- Convex backend component configured

---

### CLR-013: Route Schema with Replicate

**Assigned To:** convex-implementer
**Estimate:** 480 min
**Type:** [FEATURE]

**Specification:**
Define Replicate collection schema for routes:
- Versioned schema with schema.define()
- Route document structure (id, name, waypoints, geometry, enrichment)
- Indexes for common queries
- Migration strategy for schema changes

**Prerequisites:**
- CLR-012 complete (Replicate installed)

**Examples:**
```typescript
// collections/use-routes.ts
import { schema } from "@trestleinc/replicate"

export const routeSchema = schema.define({
  version: "v1",
  fields: {
    name: schema.string(),
    waypoints: schema.array(schema.object({
      lat: schema.float(),
      lng: schema.float(),
      name: schema.string()
    })),
    geometry: schema.string(), // Encoded polyline
    enrichment: schema.object({
      legLabels: schema.array(schema.string()),
      creativeLabel: schema.optional(schema.string()),
      rationale: schema.optional(schema.string()),
      highlights: schema.optional(schema.array(schema.string()))
    })
  }
})
```

**Constraints:**
- Must use schema.define() for versioning
- Must support incremental migrations
- Must include all route enrichment fields
- Must maintain provider-agnostic geometry format

**Acceptance Criteria:**
- System defines route schema with versioning
- Schema supports all route fields
- Schema includes enrichment data
- Schema supports migrations
- System validates schema on load

---

### CLR-014: Local-First Sync Collection

**Assigned To:** convex-implementer
**Estimate:** 1200 min
**Type:** [FEATURE]

**Specification:**
Implement Replicate collection for routes:
- Create collection with useRoutes hook
- Implement server-side collection with auth
- Test offline route editing (add, rename, reorder)
- Verify bidirectional sync when online
- Handle conflict resolution (Yjs CRDTs auto-merge)

**Prerequisites:**
- CLR-013 complete (Schema defined)

**Examples:**
```typescript
// collections/use-routes.ts
export const useRoutes = () => {
  const collection = useCollection("routes", routeSchema)
  
  return {
    routes: collection.useAll(),
    addRoute: collection.insert,
    updateRoute: collection.update,
    deleteRoute: collection.delete,
    syncStatus: collection.useSyncStatus()
  }
}
```

**Constraints:**
- Must use Yjs CRDTs for conflict resolution
- Must sync automatically when online
- Must work offline without blocking
- Must handle merge conflicts automatically

**Acceptance Criteria:**
- User can add route offline
- User can rename route offline
- User can reorder waypoints offline
- System syncs changes when online
- System shows sync status indicator
- System resolves conflicts automatically
- System syncs bidirectionally across devices

---

## Dependencies

**Blocks:** Epic 6 (Progressive)
**Blocked By:** Epic 4 (Local Routing)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Sync conflicts | Yjs CRDTs auto-merge |
| Offline storage corruption | op-sqlite battle-tested |
| Sync failures | Retry logic with exponential backoff |

---

## Definition of Done

- [ ] All tasks completed
- [ ] Human test steps pass
- [ ] Sync success rate > 99% gate met
- [ ] Unit tests for schema validation
- [ ] Integration tests for sync flow
- [ ] E2E tests for offline→online sync
