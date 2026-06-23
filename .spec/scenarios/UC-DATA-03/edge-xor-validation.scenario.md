---
service: convex
feature: UC-DATA-03
priority: P1
type: boundary
tier: visible
scope: task-local
---

# UC-DATA-03 edge: curatedRouteRef XOR plan-payload validation

A row that has BOTH `curatedRouteRef` and plan-payload fields (PlanInput/RouteSnapshot/routeIndex)
set is rejected. The two bookmark kinds are mutually exclusive — a curated-route bookmark
must not synthesize legs and a planned-route bookmark must not point at a curated row.

**Verify (integration, live Convex dev):**
- A mutation that writes both kinds of fields throws a validation error.
- A mutation that writes only `curatedRouteRef` succeeds.
- A mutation that writes only plan-payload fields succeeds (legacy path).
