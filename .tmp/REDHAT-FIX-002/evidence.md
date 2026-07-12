# REDHAT-FIX-002 — Honest painted road line oracle (H2)

## Outcome

Transparent `curated-route-detail-real-line` probe retired as PRIMARY Maestro plot proof.
Honest oracle requires: map-settled + line-paint-ready (≥2 coords necessary, not sufficient alone).

## Changes

| File | Change |
|------|--------|
| `components/map/mapbox-map-view.tsx` | Surface `map-settled` when style/map load completes; keep `mapbox-road-polyline-layer` as paint-ready (≥2-pt + settled) |
| `app/(app)/curated-route/[id].tsx` | Replace real-line probe with `curated-route-detail-line-painted` gated on `hasRealRoadLine && isMapStyleReady` |
| `.maestro/rec-016-cold-boot-recovered-route-plots.yaml` | PRIMARY asserts `map-settled` + `mapbox-road-polyline-layer` + `line-painted` (not transparent real-line alone) |
| `[id].geometry-degradation.integration.test.tsx` | Blank+valid coords fails oracle; null/1-pt fail; happy path requires settle+paint |

## Verification

| Gate | Result |
|------|--------|
| Maestro rec-016 twist-of-tepusquet-loop | Exit 0 — map-settled, mapbox-road-polyline-layer, line-painted all COMPLETED |
| Vitest geometry-degradation | 5/5 pass (incl. blank map negative) |
| Typecheck | Exit 0 |
| Biome scoped | Exit 0 (pre-existing no-dynamic-import info only) |
| rg AC-4 | PRIMARY not solely transparent real-line |

## AC mapping

- AC-1: Maestro passes on honest paint/settle oracles for recovered PoC
- AC-2: `honestPaintedLineOracleAbsentWhenMapNotSettledDespiteValidCoords` — ≥2 coords + settle false → oracle ABSENT
- AC-3: null polyline + 1-pt degenerate omit line-painted / mapbox-road-polyline-layer
- AC-4: Maestro PRIMARY is map-settled + mapbox-road-polyline-layer + line-painted
