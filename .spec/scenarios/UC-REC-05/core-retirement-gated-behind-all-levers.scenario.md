---
service: convex
feature: UC-REC-05
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-REC-05 core: a route retires only with all-lever failure evidence and an explicit founder confirm

Roughly 274 routes have no in-row polyline, no reconstructable description, and no parseable
endpoint name. The operator reviews the retirement-candidate list on the real dev deployment:
each candidate carries evidence that levers 1–3 all failed (or were inapplicable) plus its
classifier verdict. Retirement requires an explicit per-route founder confirmation; a
confirmed retirement sets `geometryStatus='retired'` with `retiredAt` + `retirementReason`,
flips `riderReady` false, and preserves the row. Un-retire restores it fully.

**Verify (real dev deployment):**
- `npx convex run curatedGeometry:listGeometryReviewQueue '{}'` (plus the residual filter) →
  every candidate shows per-lever failure reasons; a route with an untried applicable lever
  is NOT retirement-eligible.
- `npx convex run curatedGeometryReview:rejectReviewItem '{"routeId": "<residual>", "reason": "no recoverable source", "disposition": "retire"}'`
  → row has `retiredAt`, `retirementReason`, status `retired`, `riderReady=false`; the
  document still exists with all original fields.
- The retired route appears in no suggestion surface but its detail still resolves for a
  saved-route holder.
- `npx convex run curatedGeometry:unretireRoute '{"routeId": "<same>"}'` → status returns to
  its pre-retirement value; `riderReady` recomputes; the audit trail of the retirement
  decision remains queryable.
