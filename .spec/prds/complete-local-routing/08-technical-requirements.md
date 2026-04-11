---
stability: CONSTITUTION
last_validated: 2026-04-10
prd_version: 1.4.0
---

# Technical Requirements

## System Components

| Component | Description | Dependencies |
|-----------|-------------|--------------|
| **MapboxMapView** | React wrapper for @rnmapbox/maps MapView component with theme support | @rnmapbox/maps, use-semantic-theme |
| **OfflineManager** | Manages offline region download and storage via Mapbox SDK | @rnmapbox/maps offlineManager |
| **RouteCalculator** | Calculates routes offline using Mapbox Directions API | @rnmapbox/maps requestUrl, Convex |
| **LegLabelDeriver** | Derives leg labels deterministically from waypoint names (pure code) | None (pure functions) |
| **WeatherEnrichmentJob** | Fetches weather data asynchronously as background job | Open-Meteo API, Convex Scheduler |
| **ProgressiveUI** | Displays routes with progressive loading states and animations | React Native Reanimated, Convex React Client |
| **CoordinateConverter** | Utilities for converting between coordinate formats | None (pure functions) |
| **PolylineRenderer** | Renders weather overlay polylines using Mapbox ShapeSource | @rnmapbox/maps, weather data |
| **RouteMiniMap** | Mini-map component for route attachment cards | MapboxMapView, route data |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    React Native (Expo)                   │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │   Mapbox SDK         │  │   LegLabelDeriver        │ │
│  │   (Offline Routing)  │  │   (Waypoint names → pure)│ │
│  └──────────┬───────────┘  └──────────────────────────┘ │
│             │                                            │
│  ┌──────────▼────────────────────────────────────────┐  │
│  │    Route Geometry + Deterministic Leg Labels      │  │
│  │    (Displayed immediately; commit requires online) │  │
│  └──────────┬────────────────────────────────────────┘  │
└─────────────┼──────────────────────────────────────────--┘
              │ (Requires connectivity — Convex mutation)
┌─────────────▼──────────────────────────────────────────────┐
│                    Convex Backend                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Haiku      │  │   Weather    │  │   Route      │    │
│  │ (Enrichment) │  │   Job        │  │   Storage    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────────┘
              │
      ┌───────▼──────────┐
      │  Progressive     │
      │  Enhancement     │
      │  (UI Updates)    │
      └──────────────────┘
```

## Data Schema

### routes (Convex Table)

**Schema Definition:**

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  routes: defineTable({
    ownerId: v.string(),           // Clerk user ID
    geometry: v.string(),          // Encoded polyline (Mapbox format)
    bounds: v.object({
      northeast: v.object({ lat: v.number(), lng: v.number() }),
      southwest: v.object({ lat: v.number(), lng: v.number() }),
    }),
    distance: v.number(),          // Route distance in meters
    duration: v.number(),          // Route duration in seconds
    waypoints: v.array(v.object({
      lat: v.number(),
      lng: v.number(),
      name: v.optional(v.string()),
    })),
    // Leg labels derived deterministically from waypoint names at creation time
    legLabels: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_owner', ['ownerId']),
  route_enrichments: defineTable({
    // ... see routeEnrichments section below
  }),
});
```

**Note:** `legLabels` are derived at route-creation time from waypoint names using pure code (`lib/routing/leg-labels.ts`) and stored directly on the route document. No model inference is required.

**Storage:**
- **All persistence:** Convex (server-side only)
- **No local database:** op-sqlite and on-device SQLite are not used

### route_plans (Convex Table - Updated)

```typescript
{
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  phase?: 'reading' | 'finding' | 'weather' | 'building'
  enrichmentStatus?: 'pending' | 'running' | 'completed' | 'failed'
  enrichmentPhase?: 'weather' | 'ai'
  result?: PlannedRouteOptionsView  // Includes overlaysPreview
}
```

### routeEnrichments (Convex Table - Updated)

```typescript
{
  routePlanId: string,
  planningSessionId: string,
  clerkUserId: string,
  contentFingerprint: string,

  // Phase: fast (local), weather (background), or extended (cloud)
  phase: 'fast' | 'weather' | 'extended',

  // Partial enrichment (weather background fetch)
  partial?: {
    weather?: {
      windSummary: 'calm' | 'moderate' | 'high'
      rainSummary: 'none' | 'light' | 'moderate' | 'heavy'
      temperatureSummary: 'cold' | 'mild' | 'hot'
      conditionsStatus: 'ok' | 'unavailable'
    }
    generatedAt: number,
  },

  // Complete enrichment (Haiku cloud)
  complete?: {
    label: string,
    rationale: string,
    highlights: string[],
    legLabels: string[],
    generatedAt: number,
    model: 'haiku',
  },

  // Error tracking
  error?: string,
  retryCount: number,
  lastRetryAt?: number,

  createdAt: number,
  updatedAt: number,
}
```

## API Design

### Convex Mutations

#### `saveRoute` (Route Persistence)

```typescript
mutation({
  args: {
    geometry: v.string(),
    bounds: v.object({
      northeast: v.object({ lat: v.number(), lng: v.number() }),
      southwest: v.object({ lat: v.number(), lng: v.number() }),
    }),
    distance: v.number(),
    duration: v.number(),
    waypoints: v.array(v.object({
      lat: v.number(),
      lng: v.number(),
      name: v.optional(v.string()),
    })),
    legLabels: v.array(v.string()),  // Derived from waypoints before mutation call
  },
  returns: v.id("routes"),
})
```

#### `scheduleWeatherEnrichment` (Background Job)

```typescript
mutation({
  args: {
    routeId: v.id("routes"),
  },
  returns: v.id("route_enrichments"),
})
```

### Convex Queries

#### `getEnrichmentStatus`

```typescript
query({
  args: {
    routeId: v.id("routes"),
  },
  returns: v.object({
    enrichmentStatus: v.string(),
    enrichmentPhase: v.optional(v.string()),
    enrichments: v.optional(v.array(v.any())),
  }),
})
```

### Convex Actions

#### `runWeatherEnrichmentJob`

```typescript
action({
  args: {
    routeId: v.id("routes"),
  },
  returns: v.null(),  // Results merged into route_enrichments reactively
})
```

## External Dependencies

| Dependency | Version | Purpose | Documentation |
|------------|---------|---------|---------------|
| @rnmapbox/maps | ^10.1.0 | Mapbox React Native SDK | https://github.com/rnmapbox/maps |
| Convex | ^1.x | Backend storage and queries (all persistence) | https://docs.convex.dev |
| Expo | ~50.x | Platform runtime | https://docs.expo.dev |
| React Native Reanimated | ^3.x | Progressive loading animations | https://docs.swmansion.com/react-native-reanimated |

### Mapbox Services

| Service | Purpose | Rate Limits |
|---------|---------|-------------|
| Offline Downloads | Download map tiles for offline use | 50k directions/month free |
| Directions API | Calculate routes (offline when cached) | $0.50/1000 offline routes |

### Weather Services

| Service | Purpose | Rate Limits |
|---------|---------|-------------|
| Open-Meteo API | Weather data (wind, rain, temperature) | Free, no key required |

## UI Infrastructure

### Design Libraries

- **@rnmapbox/maps** - Map rendering and offline management
- **react-native-paper** - UI components (existing)
- **react-native-vector-icons** - Icons (existing)

### Style Tokens

Mapbox style URLs map to semantic theme:

```typescript
const mapStyles = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/streets-v12',
}
```

Weather overlay colors (existing semantic theme):

```typescript
const weatherColors = {
  wind: {
    low: semantic.color.success.default,    // Green
    medium: semantic.color.warning.default,  // Yellow
    high: semantic.color.error.default,      // Red
  },
  rain: {
    light: '#4FC3F7',
    moderate: '#29B6F6',
    heavy: '#0288D1',
  },
}
```

Progressive loading animation tokens:

```typescript
// Loading states
semantic.color.primary.default        // Copper pulse
semantic.color.enrichmentFast         // #2C9F9B (fast phase)
semantic.color.enrichmentExtended    // #8B5CF6 (extended phase)
semantic.color.surfaceVariant.default // Skeleton background

// Animations
FadeIn.duration(200)  // Weather badges
FadeIn.duration(300)  // Route labels
FadeIn.duration(400)  // Highlights
```

### Component Reuse

**Reusable Components:**
- `MapboxMapView` - Used in main map view and mini-maps
- `CoordinateConverter` - Used by all rendering components

**New Components:**
- `OfflineRegionDownloader` - Region download interface using Mapbox SDK
- `DownloadProgressIndicator` - Progress tracking UI
- `MapboxMapView` - MapView wrapper (`components/map/mapbox-map-view.tsx`)
- `OfflineModeBanner` - Connection status (`components/routing/offline-mode-banner.tsx`)
- `ProgressiveEnhancementToast` - Enrichment progress (`components/routing/progressive-enhancement-toast.tsx`)
- `OfflinePackManager` - Offline maps settings (`components/settings/offline-pack-manager.tsx`)
- `EnrichmentStatusIndicator` - Enrichment state badge (`components/routing/enrichment-status-indicator.tsx`)
- `WeatherBadgeSkeleton` - Weather badge loading state (`components/weather/weather-badge-skeleton.tsx`)
- `useEnrichmentStatus` - Hook for enrichment subscription (`hooks/use-enrichment-status.ts`)

**Route Utilities:**
- `lib/routing/leg-labels.ts` - Deterministic leg label derivation from waypoint names

## Implementation Notes

### Coordinate System

**Google Maps:** [latitude, longitude]
**Mapbox:** [longitude, latitude]

All polyline and marker data must be converted when rendering with Mapbox.

### Offline Region Size

Typical region sizes:
- City-level: ~50-100MB
- Metro-level: ~200-500MB
- State-level: ~1-2GB

Implement storage warnings for regions > 500MB.

### Performance Targets

- **Time to first route display after commit:** <1 second
- **Convex route mutation latency:** <500ms (p95, online)
- **Weather enrichment:** <20 seconds (background job)
- **Remote full enrichment (Haiku):** <5s (target: 3.9s)
- **Progressive UI update:** <100ms
- **Queue drain rate:** >10 jobs/min
- **Route geometry calculation:** <2 seconds offline (Mapbox SDK)
- **Map rendering:** 60fps during pan/zoom
- **Region download:** 5-10 minutes for city-level region
- **App size increase:** <50MB (base SDK, no on-device model)

### Error Handling

**Offline Region Download:**
- Network error: Retry with exponential backoff
- Storage full: Warn user, suggest deleting regions
- Invalid bounds: Validate before download

**Route Calculation:**
- Region not downloaded: Prompt user to download
- Invalid coordinates: Validate before calculation
- Timeout: Fallback to online API if available

### Testing Strategy

**Unit Tests:**
- Coordinate conversion utilities
- Bounds calculations
- Progressive loading state management

**Integration Tests:**
- Offline region download flow
- Route calculation with cached data
- Progressive enrichment flow

**E2E Tests:**
- Complete offline routing workflow
- Weather overlay rendering
- Mini-map display in attachment cards

**Performance Tests:**
- Route calculation benchmarks
- Memory profiling for large routes
- Battery impact analysis
