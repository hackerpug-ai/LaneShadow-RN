# REDHAT-FIX-001 Evidence

## Date
2026-07-12

## AC-1 / AC-3 Maestro (PRIMARY)
- Command: `maestro test .maestro/rec-016-cold-boot-recovered-route-plots.yaml -e RECOVERED_ROUTE_ID='motorcycleroads:twist-of-tepusquet-loop' --device '9051A0C2-CCB5-4D0F-AAAC-F03F74719352'`
- Exit: 0
- Log: `.tmp/REDHAT-FIX-001/maestro-rec-016.log`
- Screenshot (home): `.tmp/REDHAT-FIX-001/01-cold-boot-home.png` (cwd also `./01-cold-boot-home.png`)
- Screenshot (road line plot): `.tmp/REDHAT-FIX-001/02-recovered-route-real-line-plotted.png` (cwd also `./02-recovered-route-real-line-plotted.png`)
- Maestro run dir: `/Users/justinrich/.maestro/tests/2026-07-12_024134`
- Assertions:
  - `mapbox-road-polyline-layer` visible (map-ready + ≥2-pt polyline oracle; opacity 0.01 + collapsable=false)
  - `curated-route-detail-real-line` visible
  - approximate-badge / fallback not visible
  - name: Twist of Tepusquet Loop

## AC-2 Vitest
- Command: `pnpm exec vitest run 'components/map/mapbox-map-view.test.tsx' 'app/(app)/curated-route/[id].geometry-degradation.integration.test.tsx'`
- Exit: 0 (8 tests)
- Log: `.tmp/REDHAT-FIX-001/vitest.log`

## AC-4 Typecheck + Biome
- `pnpm type-check` → exit 0
- `pnpm exec biome check 'app/(app)/curated-route/[id].tsx' components/map/mapbox-map-view.tsx` → exit 0

## Live Convex seed (read-only)
- getVerificationForRoute motorcycleroads:twist-of-tepusquet-loop:
  - geometryStatus=generated, riderReady=true, pointCount=50, verdict=pass, provenance=ai_reconstructed

## Fix summary
- Mapbox LineLayer copper paint (strokeWidth≥4, primary color) unchanged real paint path
- Fit deferred until onDidFinishLoadingMap/Style/Fully
- Maestro oracle `mapbox-road-polyline-layer`: opacity 0.01 (was 0), collapsable=false, min 44×44
- preferPolylineViewport avoids user-location stealing camera before fit
