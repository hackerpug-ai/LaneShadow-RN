# Map components (Expo Maps)

## Dependencies

```bash
pnpm add expo-maps @mapbox/polyline
```

## Env / native config

- Define `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in your `.env.local` (or CI env).
- `app.config.ts` injects this key into `android.config.googleMaps.apiKey`.

## Components

- `MapViewWrapper` — selects Apple Maps on iOS and Google Maps on Android via `expo-maps`.
- `RoutePolyline` — Renders overview polyline, per-leg polylines, and multi-colored wind overlay segments.

## Usage

```tsx
import { MapViewWrapper } from '../components/map/map-view'
import { RoutePolyline } from '../components/map/route-polyline'

<MapViewWrapper>
  <RoutePolyline
    route={route}
    variant="selected"
    showLegs
    showWindOverlay
  />
</MapViewWrapper>
```

Notes:
- All colors/spacing come from `useSemanticTheme()`; do not hardcode values.
- Wind overlays use `RouteSnapshot.overlays.wind.byLeg[].segments[]` to color sub-sections by level (`low/moderate/high`).***
