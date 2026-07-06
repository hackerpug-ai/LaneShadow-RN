# Sprint 02 — Canonical Fixture Manifest

> **Authoritative source** for all E2E test fixtures. Every task's must-observe literals MUST match the values declared here. If a fixture appears in multiple tasks, this manifest's spec wins.

## Curated Routes (seeded via `seedGeospatialTest:seedE2ETestRoutes`)

### `wasatch-ridge-traverse` (polyline-present route)
| Field | Value |
|-------|-------|
| routeId | `wasatch-ridge-traverse` |
| name | `Wasatch Ridge Traverse` |
| state | `UT` |
| primaryArchetype | `scenic_byway` |
| centroidLat | 40.6 |
| centroidLng | -111.6 |
| compositeScore | 85 (0.85 normalized) |
| curvatureScore | 60 (0.60) |
| scenicScore | 90 (0.90) |
| technicalScore | 45 (0.45) |
| trafficScore | 30 (0.30) |
| remotenessScore | 75 (0.75) |
| routePolyline | `encoded_polyline_placeholder` (truthy string) |
| summary | `A stunning traverse through the Wasatch Range with epic views.` |

**Used by:** DATA-006 AC-1, DESIGN-002 AC-1, DESIGN-003 AC-1, DESIGN-004 AC-2, SAVE-002 AC-1, DTL-001 AC-1 (via cherohala-skyway as alt), uc-dtl-03-with-polyline.yaml, uc-dtl-04-save.yaml, uc-dtl-04-ride-it.yaml

### `blue-ridge-overlook` (no-polyline route)
| Field | Value |
|-------|-------|
| routeId | `blue-ridge-overlook` |
| name | `Blue Ridge Overlook` |
| state | `NC` |
| centroidLat | 35.6 |
| centroidLng | -82.5 |
| compositeScore | 72 (0.72) |
| routePolyline | `null` (absent — undefined in seed, returned as null by query) |
| summary | `` (empty — tests the "No description yet" placeholder) |

**Used by:** DATA-006 AC-2, DESIGN-003 AC-2, DTL-001 AC-2, uc-dtl-03-without-polyline.yaml

### `cherohala-skyway` (second polyline route)
| Field | Value |
|-------|-------|
| routeId | `cherohala-skyway` |
| name | `Cherohala Skyway` |
| state | `TN` |
| centroidLat | 35.3 |
| centroidLng | -84.0 |
| compositeScore | 90 (0.90) |
| routePolyline | `encoded_polyline_placeholder` |

**Used by:** DTL-001 AC-1/AC-3 (card/pin tap from plan view), curated-route-detail.yaml

## TestID Convention (authoritative)

All detail-screen testIDs use the `curated-detail-*` prefix for section roots and `curated-route-detail-*` for legacy probes:

| Element | testID |
|---------|--------|
| Detail screen root | `curated-route-detail-screen` |
| Name text | `curated-route-detail-name` |
| Polyline probe | `curated-route-detail-polyline` |
| Loading skeleton | `curated-route-detail-loading` |
| Fallback ("Route not found") | `curated-route-detail-fallback` |
| Map section root | `curated-detail-map` |
| Scores section root | `curated-detail-scores` |
| Actions row root | `curated-detail-actions` |
| Approximate badge | `curated-detail-approximate-badge` |
| Save button | `save-curated-button` |
| Save success badge | `save-curated-saved-badge` |
| Ride It button | `ride-it-button` |

## Notes

- `compositeScore` is an INDEPENDENT field on the row, NOT the mean of the 5 dimension scores. Do not recompute it. (RH-021)
- Fixture names `convex_polyline_route`, `convex_no_polyline_route`, `convex_score_row` etc. in task REQUIREMENT-CONTRACTs are SCENARIO KEYS, not separate seed rows. They all map to the canonical routes above.
- The seed file `convex/seedGeospatialTest.ts` (function `seedE2ETestRoutes`) is the WRITE-OWNED artifact for all fixture data. (RH-013)
