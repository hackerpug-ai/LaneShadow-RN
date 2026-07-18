# S4-T2 RED-against-start evidence

**Base SHA**: `aca1343f19cf030302c38289e8d7922e4dd76598` (S4-T1 landed; Lever 1/3 absent)

At base, the following public Convex surfaces did **not** exist:

| AC | Surface | Expected RED failure |
|----|---------|----------------------|
| AC-1 | `curatedGeometryReconstruct:promoteForRoute` | Could not find function |
| AC-2 | `promoteForRoute` disposition `next_lever` | Could not find function |
| AC-3 | `curatedGeometryReconstruct:rerouteForRoute` | Could not find function |
| AC-4 | `listGeometryReviewQueue` | Could not find function |
| AC-5 | `parseRouteNameStructure` + `convex/lib/endpointParser.ts` | Module / function missing |
| AC-6 | `geocodeWithRegionBias` | Could not find function |

Confirmed by `git show aca1343f:convex/curatedGeometryReconstruct.ts` containing only Lever-2 wrappers
(reconstructForRoute*, getVerificationForRoute, getRouteForReading) — no promote/reroute/parser.

Vanity-test control: integration tests call real `npx convex run` against the dev deployment and
assert seeded MUST_OBSERVE values from the DB (`getVerificationForRoute`, `listGeometryReviewQueue`).
