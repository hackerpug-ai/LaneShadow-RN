/**
 * S2-T2 REMEDIATION (cycle 1) — AC-2 seeded-scenario constants.
 *
 * Single source of truth for the isolated open-Pacific test center, radius,
 * and the 3 routeIds the AC-2 non-degenerate test seeds via `npx convex
 * import` + the already-deployed `geospatialSeed:seedGeospatialAll` action
 * (see `convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts`'s
 * "AC-2 non-degenerate" describe block — `npx convex dev` pushes to this
 * task's dev deployment are currently broken deployment-wide on a
 * pre-existing, unrelated bundle-size error, so seeding goes through
 * already-deployed real primitives instead of a new mutation; see
 * `convex/spikeAc2Seed.ts`'s header for the full explanation and the
 * cleaner computed-riderReady approach to revisit once that's fixed).
 *
 * Kept dependency-free (no Convex imports) so the vitest-run integration
 * test can import these values directly without ever touching
 * `convex/geospatialIndex.ts` -> `@convex-dev/geospatial`, whose resolution
 * is broken under vitest from a worktree checkout (see
 * `convex/__tests__/listCuratedRoutes.integration.test.ts`, which works
 * around the same issue by mocking `../geospatialIndex` outright).
 */

// Isolated open-Pacific test center — far from Hawaii (~lat 20, lng -155/-160)
// and every mainland US curated route, so the 3 seeded rows are the ONLY
// points the geospatial nearest-neighbor query can return near this
// coordinate.
export const AC2_SEED_CENTER = { lat: 5.0, lng: -155.0 }
export const AC2_SEED_RADIUS_MI = 12

// Due-north offsets in degrees latitude from AC2_SEED_CENTER, chosen with
// wide margins either side of AC2_SEED_RADIUS_MI so no floating-point
// rounding in the real geodesic distance calc could flip which side of the
// radius a row lands on:
//   near ~3.5mi, mid ~10.4mi   (both comfortably < 12mi radius)
//   far-excluded ~17.3mi      (comfortably > 12mi radius, but still
//                              < MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI=20mi
//                              so the server's own nearest-mode query still
//                              returns it — it's the TOOL's radiusMi filter,
//                              not the server's hard cap, that must exclude it)
export const AC2_SEED_ROUTE_ID_NEAR = 'spike-test:s2-t2-ac2-near'
export const AC2_SEED_LAT_OFFSET_NEAR = 0.05
export const AC2_SEED_ROUTE_ID_MID = 'spike-test:s2-t2-ac2-mid'
export const AC2_SEED_LAT_OFFSET_MID = 0.15
export const AC2_SEED_ROUTE_ID_FAR_EXCLUDED = 'spike-test:s2-t2-ac2-far-excluded'
export const AC2_SEED_LAT_OFFSET_FAR_EXCLUDED = 0.25
