---
service: convex
feature: UC-HYG-03
priority: P0
type: happy_path
tier: visible
scope: task-local
---

# UC-HYG-03 core: zero-length, 710,430-mile, and "Test Route" rows are quarantined with reasons

The audit found ~64 rows with lengthMiles ≤ 0, ~41 rows over 1,000 miles (max 710,430 mi),
and FOUNDER-BAR T2 names test/seed rows like "Test Route CO-04". The operator runs the
quarantine passes against the real dev deployment. Every offender gains a `quarantine` object
with the correct reason (`zero_length` / `length_outlier` / `test_row`); zero-length rows
also have their claimed length nulled so a later recovered geometry's routed length becomes
the stored truth. Quarantined rows are excluded from `riderReady` until cleared.

**Verify (real dev deployment, no mocks):**
- `npx convex run curatedGeometryHygiene:fixLengthOutliers '{}'` → `{zeroed ≈ 64, flagged ≈ 41}`.
- `npx convex run curatedGeometryHygiene:quarantineTestRows '{}'` → `{flagged ≥ 1}` and the
  "Test Route CO-04"-style row carries `quarantine.reason='test_row'`.
- Founder listing: a query filtered on `quarantine` present returns every flagged row with
  its reason — reviewable in one pass.
- After `recomputeRiderReadyBatch`: zero rows with `riderReady=true` have length ≤ 0 or
  > 1,000 mi, and no test-named row is rider-ready.
- Recovery clears it: run a real lever on one nulled-length row → its quarantine is removed
  and the stored length equals the routed length (within the sane range).
