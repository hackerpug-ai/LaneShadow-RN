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

## Theme → Map Style Mapping

`MapViewWrapper` always applies Google `customMapStyle` automatically:
- The base palette is **hardcoded hex** in `components/map/map-style.ts` (no `rgba()` / no alpha).
- The only theme-driven color is the **highway stroke accent**, which uses `semantic.color.primary.default`.

### Base map palette source

See `buildMapStyleFromTheme()` in `components/map/map-style.ts` for the exact values:

- **Light mode**
  - land: `#EFEAE3`
  - poiSurface: `#F3EFE8`
  - roadBase: `#DCD4CB`
  - roadLocal: `#E7E1DA`
  - roadArterial: `#BEB5AB`
  - border: `#C6BDB3`
  - text: `#1C1B1A`
  - textMuted: `#6E6A64`
  - water: `#C9CED3`

- **Dark mode**
  - land: `#141210`
  - poiSurface: `#1B1816`
  - roadBase: `#26221F`
  - roadLocal: `#1A1715`
  - roadArterial: `#3A3430`
  - border: `#3A3531`
  - text: `#EDEDED`
  - textMuted: `#A3A3A3`
  - water: `#1A2026`

### Component usage

- Map style selection is automatic from theme; overlays/markers/polylines still use whatever colors you pass in.
- When choosing polyline/marker colors, prefer theme tokens:
  - Selected route: `semantic.color.routeSelected.default`
  - Alternate route: `semantic.color.routeAlternate.default`
  - Borders/outline: `semantic.color.border.default`

### Extending or tweaking map styles

- Update `components/map/map-style.ts` to adjust per-role colors.
- Keep values **hex-only** (no `rgba()`), since Google map styling doesn’t reliably support `rgba()`.
