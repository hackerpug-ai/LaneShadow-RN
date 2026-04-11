# Epic 3: Local Discovery Layer & React Hooks

**Sequence**: 3
**Status**: Backlog

## Overview
Build the local op-sqlite discovery database, SQL query layer, and React hooks that bridge local data to UI. Also create the core design components (RouteDiscoveryScreen, RoutePin, IntentSearchInput) that Epic 4 will compose into the full discovery experience.

## Human Test Steps
1. Open app on fresh install, verify discovery.db is created with all 3 tables
2. Verify lean routes sync from Convex to local SQLite (check row count)
3. Run a bounding box query and confirm results return in <20ms
4. Verify intent search cache-hit path returns in <50ms with no network
5. Verify intent search offline path shows "Connect to search" state

## PRD Sections Covered
- S2.4 (Phase 4: Discovery UI — local layer)
- S3-DISC (Route Discovery functional group)
- S4-UC-DISC-01 (Browse Routes on Map)
- S4-UC-DISC-04 (Sort by Score or Proximity)
- S4-UC-DISC-07 (Intent-Based Search)
- S8 (Technical Requirements: Local SQLite)
- S9-TRD-6 (Local SQLite discovery.db)

## Dependencies
- **Depends on**: Epic 1, Epic 2 (for sync endpoints and intent extraction API)
- **Blocks**: Epic 4

## Task List

| ID | Title | Agent | Priority | Effort | Est (min) | Depends On |
|----|-------|-------|----------|--------|-----------|------------|
| CUR-008 | Local discovery.db: SQLite schema + lean tier sync | react-native-ui-implementer | P0 | S | 150 | CONVEX-002 |
| CUR-009 | Local discovery queries: bounding box, archetype, state, score | react-native-ui-implementer | P0 | S | 90 | CUR-008 |
| CUR-010 | React hooks: useRouteDiscovery, useRouteEnrichment, useIntentSearch | react-native-ui-implementer | P0 | M | 180 | CUR-008, CUR-009 |
| DESIGN-001 | RouteDiscoveryScreen layout with map + overlay controls | frontend-designer | P0 | L | 180 | — |
| DESIGN-002 | RoutePin archetype-badged map pin | frontend-designer | P0 | M | 120 | DESIGN-001 |
| DESIGN-005 | IntentSearchInput with loading/offline/cache states | frontend-designer | P0 | L | 150 | DESIGN-001 |

## Wall-clock Estimate
~3-4 days (data layer and design can run in parallel)

## Definition of Done
- [ ] discovery.db created with all tables and indexes
- [ ] Lean sync pulls routes from Convex and stores locally
- [ ] Bounding box queries return in <20ms
- [ ] Intent cache-hit returns in <50ms
- [ ] Offline intent returns OFFLINE_UNSUPPORTED state
- [ ] RouteDiscoveryScreen and RoutePin components render with semantic theme tokens
- [ ] All hook tests pass
