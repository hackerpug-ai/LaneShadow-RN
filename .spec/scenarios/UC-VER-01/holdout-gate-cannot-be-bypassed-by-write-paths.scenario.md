---
service: convex
feature: UC-VER-01
priority: P1
type: security
tier: holdout
scope: task-local
---

# UC-VER-01 holdout: no write path can store servable geometry without a gate verdict

Enumerate every mutation that can put a line into `curated_route_geometry` or flip a route to
`geometryStatus='generated'` — the lever persist path, the founder's review approval, and any
legacy patch helper left from the old backfill. For each, attempt to store a line while
omitting or contradicting the verification block: a persist call with no `verification`
object, an approval on a review row whose candidate line is degenerate, and a direct re-use
of the retired Nominatim-era patch function if it still exists in the deployed function set.
None of these may produce a servable route: persisting without a verdict must be rejected by
the validator, approving a degenerate candidate must either be refused or record an explicit
founder-override marker that is queryable later, and the legacy patch path must be absent
from the deployment (or provably gate-wrapped). Finally, confirm from the public client's
perspective that an unauthenticated or rider-scoped caller cannot invoke any of these
mutations at all — they are `internal*` and unreachable through the Clerk-gated API surface.
