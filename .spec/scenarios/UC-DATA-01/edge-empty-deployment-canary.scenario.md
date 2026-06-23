---
service: convex
feature: UC-DATA-01
priority: P1
type: error_handling
tier: visible
scope: task-local
---

# UC-DATA-01 edge: empty / drifted Convex deployment surfaces loudly

The OPS-001 canary (`listCuratedRoutes`) catches an empty or drifted dev deployment before
any subscription silently renders an empty UI. If the geospatial index has 0 rows or the
catalog row count drifts to 0, the health check logs a loud error and the combined dev
script aborts rather than serving a empty world to the client.

**Verify (integration, live Convex dev):**
- With the catalog present, the canary returns rows and the dev script continues.
- Against an empty deployment (simulated by pointing at an empty sandbox), the canary logs
  a non-suppressed error and the dev script exits non-zero.
