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
import { buildRoutePolylines } from '../components/map/route-polyline'
import { useSemanticTheme } from '../hooks/use-semantic-theme'

const { semantic } = useSemanticTheme()

const polylines = buildRoutePolylines({
  route: {
    overviewGeometry: route.overviewGeometry,
    legs: route.legs,
    overlays: route.overlays,
  },
  variant: 'selected',
  showLegs: true,
  showWindOverlay: true,
  semantic: semantic,
})

const markers = [
  { id: 'start', title: 'Start', coordinates: { latitude: start.lat, longitude: start.lng } },
  { id: 'end', title: 'End', coordinates: { latitude: end.lat, longitude: end.lng } },
]

<MapViewWrapper polylines={polylines} markers={markers} />
```

Notes:
- All colors/spacing come from `useSemanticTheme()`; do not hardcode values.
- Wind overlays use `RouteSnapshot.overlays.wind.byLeg[].segments[]` to color sub-sections by level (`low/moderate/high`).***
