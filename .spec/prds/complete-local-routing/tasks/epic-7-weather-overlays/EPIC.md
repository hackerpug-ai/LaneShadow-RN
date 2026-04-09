# Epic 7: Weather Overlays

**Epic ID:** CLR-E007
**Status:** Pending
**Timeline:** Week 7
**PRD Coverage:** UC-WUI-01 through UC-WUI-04

---

## Human Test Deliverable

User sees weather data rendered on route polylines

**Test Steps:**
1. Open route with weather data
2. See wind levels on route (green/yellow/red)
3. See rain segments (light blue to dark blue)
4. See temperature colors (cold blue to hot red)
5. Zoom in/out and verify weather accuracy
6. Open route attachment card
7. See mini-map with weather overlay

**Gate:** Weather render < 100ms

---

## Theme

"See the Conditions" - Weather overlay rendering on Mapbox

---

## Tasks

### CLR-019: Polyline Coordinate Conversion

**Assigned To:** react-native-ui-implementer
**Estimate:** 480 min
**Type:** [FEATURE]

**Specification:**
Update polyline utilities for Mapbox coordinate system:
- Convert Google [lat, lng] to Mapbox [lng, lat]
- Encode/decode polyline6 format
- Preserve existing weather segment logic
- Add unit tests for conversion

**Prerequisites:**
- Epic 2 complete (MapboxMapView working)
- Epic 4 complete (Route geometry available)

**Examples:**
```typescript
// lib/polyline.ts
export const convertToMapbox = (polyline: string): string => {
  const coords = decodeGoogle(polyline) // [lat, lng]
  const mapboxCoords = coords.map(([lat, lng]) => [lng, lat])
  return encodeMapbox(mapboxCoords)
}

export const decodeMapbox = (polyline: string): [number, number][] => {
  // Returns [lng, lat] for Mapbox
}
```

**Constraints:**
- Must preserve weather segment data
- Must handle edge cases (poles, date line)
- Must validate coordinate ranges
- Must maintain backward compatibility

**Acceptance Criteria:**
- System converts polyline coordinates correctly
- System preserves weather segment data
- System handles edge cases gracefully
- Unit tests cover conversion logic

---

### CLR-020: Weather ShapeSource Rendering

**Assigned To:** react-native-ui-implementer
**Estimate:** 1200 min
**Type:** [FEATURE]

**Specification:**
Implement weather overlay rendering using Mapbox ShapeSource:
- ShapeSource for weather polylines
- LineLayer for wind levels (green/yellow/red)
- LineLayer for rain intensity (light blue to dark blue)
- LineLayer for temperature (cold blue to hot red)
- Layer ordering (weather above route)

**Prerequisites:**
- CLR-019 complete (Coordinate conversion working)
- Epic 2 complete (MapboxMapView working)

**Examples:**
```typescript
// components/map/WeatherOverlay.tsx
export const WeatherOverlay: React.FC<{ route: Route }> = ({ route }) => (
  <MapboxMapView.ShapeSource
    id="weather-source"
    shape={formatWeatherGeoJSON(route.weather)}
  >
    <MapboxMapView.LineLayer
      id="wind-layer"
      style={windLayerStyle}
    />
    <MapboxMapView.LineLayer
      id="rain-layer"
      style={rainLayerStyle}
    />
    <MapboxMapView.LineLayer
      id="temp-layer"
      style={tempLayerStyle}
    />
  </MapboxMapView.ShapeSource>
)
```

**Constraints:**
- Must render weather above route geometry
- Must support zoom-based styling
- Must handle missing weather data
- Must perform at 60fps

**Acceptance Criteria:**
- User sees wind levels on route
- User sees rain segments on route
- User sees temperature colors on route
- Weather renders above route geometry
- Rendering performs at 60fps

---

### CLR-021: Theme Color Mapping

**Assigned To:** frontend-designer
**Estimate:** 240 min
**Type:** [DESIGN] [FEATURE]

**Specification:**
Design weather color mappings for dark/light themes:
- Wind levels: low (green) → medium (yellow) → high (red)
- Rain intensity: light (light blue) → heavy (dark blue)
- Temperature: cold (blue) → moderate (copper) → hot (red)
- Dark theme adjustments (higher contrast)
- Light theme adjustments (lower saturation)

**Prerequisites:**
- CLR-020 complete (Weather rendering working)

**Design Requirements:**
- Dark theme with copper accents (see styles/RULES.md)
- Semantic color mappings for weather severity
- Consistent with existing weather UI
- WCAG AA compliance for contrast

**Examples:**
```typescript
// styles/weather.ts
export const weatherColors = {
  wind: {
    low: colors.green500,
    medium: colors.yellow500,
    high: colors.red500
  },
  rain: {
    light: colors.blue300,
    moderate: colors.blue500,
    heavy: colors.blue700
  },
  temperature: {
    cold: colors.blue500,
    moderate: colors.copper500,
    hot: colors.red500
  }
}
```

**Constraints:**
- Must follow LaneShadow UI/UX patterns
- Must work in dark and light themes
- Must maintain semantic meaning
- Must pass contrast requirements

**Acceptance Criteria:**
- Wind colors map to severity levels
- Rain colors map to intensity levels
- Temperature colors map to comfort levels
- Colors work in dark theme
- Colors work in light theme
- UI follows copper-accented dark theme
- Contrast meets WCAG AA

---

### CLR-022: Batch Rendering Optimization

**Assigned To:** react-native-ui-implementer
**Estimate:** 480 min
**Type:** [FEATURE]

**Specification:**
Optimize weather polyline rendering for performance:
- Batch polylines by weather type
- Implement level-of-detail (LOD) for zoom levels
- Reduce ShapeSource/LineLayer count
- Profile memory usage
- Test on long routes (500+ points)

**Prerequisites:**
- CLR-020 complete (Weather rendering working)

**Examples:**
```typescript
// lib/mapbox/weather-optimization.ts
export const batchWeatherPolylines = (
  weather: WeatherData[],
  zoom: number
): GeoJSON.FeatureCollection => {
  const lod = calculateLOD(zoom)
  const batched = groupByWeatherType(weather)
  
  return {
    type: "FeatureCollection",
    features: batched.map(segment => simplify(segment, lod))
  }
}
```

**Constraints:**
- Must maintain visual accuracy
- Must reduce render time
- Must handle long routes
- Must adapt to zoom level

**Acceptance Criteria:**
- Rendering completes in < 100ms
- Memory usage stable on long routes
- Visual accuracy maintained
- LOD adapts to zoom level

---

## Dependencies

**Blocks:** Epic 8 (Testing & Launch)
**Blocked By:** Epic 2 (Map Foundation), Epic 4 (Local Routing)

**Parallel Track:** Can run parallel to Epic 6 (Progressive)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Performance regression | Benchmark before/after, optimize batching |
| Coordinate bugs | Comprehensive unit tests |
| Visual artifacts | Test across zoom levels |

---

## Definition of Done

- [ ] All tasks completed
- [ ] Human test steps pass
- [ ] Weather render < 100ms gate met
- [ ] Unit tests for coordinate conversion
- [ ] Integration tests for weather rendering
- [ ] Performance benchmarks documented
- [ ] Design review approved
