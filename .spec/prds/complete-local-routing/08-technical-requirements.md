---
stability: CONSTITUTION
last_validated: 2026-04-10
prd_version: 1.3.0
---

# Technical Requirements

> **v1.3 rollback note:** This document previously defined `LocalEnrichment` (Qwen3.5 0.8B via mlx-local) and `HybridEnrichment` (local + remote orchestrator) as core system components. Both are **removed** in v1.3. Leg labels are now deterministic, derived from waypoint names by pure code. Creative enrichment is Haiku-only, server-side, and backgrounded. See README v1.3 rollback section for full rationale.

## System Components

| Component | Description | Dependencies |
|-----------|-------------|--------------|
| **MapboxMapView** | React wrapper for @rnmapbox/maps MapView component with theme support | @rnmapbox/maps, use-semantic-theme |
| **OfflineManager** | Manages offline region download and storage via Mapbox SDK | @rnmapbox/maps offlineManager |
| **RouteCalculator** | Calculates routes offline using Mapbox Directions API | @rnmapbox/maps requestUrl, Convex |
| **LegLabelDeriver** | Pure-code derivation of `"FromName → ToName"` leg labels from an ordered waypoint list. Synchronous, offline-capable, no model, no async, no inference. Falls back to reverse geocoding (when online) or coordinate placeholders (offline) when a waypoint has no name. | None (pure functions) |
| **ServerEnrichment** | Convex scheduled actions that generate creative enrichment (label, rationale, highlights) via Claude Haiku at `temperature=0`, backgrounded after route insert. Merges results into `route_enrichments` as they arrive. | Convex Scheduler, pi-ai, Anthropic SDK |
| **WeatherEnrichmentJob** | Fetches weather data asynchronously as background job | Open-Meteo API, Convex Scheduler |
| **ProgressiveUI** | Displays routes with progressive loading states and animations | React Native Reanimated, Convex React Client |
| **DraftRouteStore** | Zustand store with AsyncStorage for local draft persistence (no Convex sync) | zustand, @react-native-async-storage/async-storage |
| **ReplicateCollection** | Local-first sync engine via @trestleinc/replicate (Yjs CRDTs + op-sqlite) | @trestleinc/replicate, @op-engineering/op-sqlite, Convex |
| **CoordinateConverter** | Utilities for converting between coordinate formats | None (pure functions) |
| **PolylineRenderer** | Renders weather overlay polylines using Mapbox ShapeSource | @rnmapbox/maps, weather data |
| **RouteMiniMap** | Mini-map component for route attachment cards | MapboxMapView, route data |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native (Expo)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  LegLabel    │  │   Mapbox     │  │   Replicate  │       │
│  │   Deriver    │  │   (Routing)  │  │ (Yjs+SQLite) │       │
│  │ (pure code)  │  │              │  │              │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐      │
│  │      Immediate UX (Offline-Capable)                │      │
│  │  Deterministic Leg Labels (<10ms) + Geometry       │      │
│  │  (Mapbox offline) + Instant Route Editing (CRDT)   │      │
│  └──────┬──────────────────────────────────────────────┘      │
│         │                                                    │
│         │  NO on-device LLM runtime.                          │
│         │  NO model bundle, NO mlx-local, NO Core ML/ONNX.    │
└─────────┼──────────────────────────────────────────────────────┘
          │ (When Online — CRDT Delta Sync + Background Jobs)
┌─────────▼──────────────────────────────────────────────────┐
│                    Convex Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Haiku      │  │   Weather    │  │   Replicate  │      │
│  │  (Creative   │  │  (Open-Meteo │  │  Component   │      │
│  │  enrichment, │  │  background  │  │              │      │
│  │  backgrounded│  │  job)        │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └──────────┬───────┴───────────────┘               │
│                    ▼                                        │
│           ┌─────────────────┐                               │
│           │  route_         │                               │
│           │  enrichments    │                               │
│           │  (progressive   │                               │
│           │  merge by job)  │                               │
│           └─────────────────┘                               │
└─────────────────────┼────────────────────────────────────────┘
                      │
              ┌────────▼─────────┐
              │  Progressive     │
              │  Enhancement     │
              │  (UI Updates     │
              │  via CRDT sync)  │
              └──────────────────┘
```

## Data Schema

### routes (Convex Table - Replicate-Backed)

**Schema Definition:**

```typescript
// convex/schema/routes.ts
import { schema } from '@trestleinc/replicate/server';
import { v } from 'convex/values';

export const routeSchema = schema.define({
  version: 1,
  shape: v.object({
    id: v.string(),
    geometry: v.string(),        // Encoded polyline (Mapbox format)
    bounds: v.object({
      northeast: v.object({ lat: v.number(), lng: v.number() }),
      southwest: v.object({ lat: v.number(), lng: v.number() }),
    }),
    distance: v.number(),        // Route distance in meters
    duration: v.number(),        // Route duration in seconds
    waypoints: v.array(v.object({
      lat: v.number(),
      lng: v.number(),
      name: v.optional(v.string()),
    })),
    // Deterministic leg labels derived at route-creation time from waypoint names.
    // Pure code, no model. Available instantly, offline-capable.
    legLabels: v.optional(v.array(v.string())),
  }),
  indexes: (t) => t.index('by_distance', ['distance']),
  defaults: {
    legLabels: [],
  },
});

// Auto-generates: timestamp, by_doc_id, by_timestamp indexes
```

**Convex Table:**

```typescript
// convex/schema.ts
export default defineSchema({
  routes: routeSchema.table(),
  route_enrichments: enrichmentSchema.table(),
});
```

**Storage:**
- **Local:** SQLite via `op-sqlite` with Yjs CRDT state
- **Cloud:** Convex table with materialized documents
- **Sync:** Automatic bidirectional delta sync via Replicate component

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

  // Phase: weather (background) or creative (background).
  // "fast" / local phase was removed in v1.3 — deterministic leg labels
  // live on the route document itself, not in route_enrichments.
  phase: 'weather' | 'creative' | 'complete',

  // Weather enrichment (Open-Meteo background job)
  weather?: {
    windSummary: 'calm' | 'moderate' | 'high'
    rainSummary: 'none' | 'light' | 'moderate' | 'heavy'
    temperatureSummary: 'cold' | 'mild' | 'hot'
    conditionsStatus: 'ok' | 'unavailable'
    generatedAt: number,
  },

  // Creative enrichment (Haiku server-side, backgrounded)
  creative?: {
    label: string,
    rationale: string,
    highlights: string[],
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

**Note:** the v1.1 schema had a `partial` block with `model: 'qwen3.5-0.8b'` that stored on-device leg-label output. That block is removed in v1.3. Leg labels now live on the route document itself (derived deterministically at creation time), and `route_enrichments` only carries async server-generated enrichment (weather + creative). A one-time migration should drop `partial.model === 'qwen3.5-0.8b'` rows and re-derive leg labels deterministically from waypoint names.

## API Design

### Replicate Collection Functions

#### Server-Side (`convex/routes.ts`)

```typescript
import { collection } from '@trestleinc/replicate/server';
import { components } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import { routeSchema } from './schema/routes';

export const { material, delta, replicate, presence, session } =
  collection.create<Doc<'routes'>>(
    components.replicate,
    'routes',
    {
      schema: routeSchema,
      hooks: {
        // Authorization: users can only edit their own routes
        evalWrite: async (ctx, route) => {
          const identity = await ctx.auth.getUserIdentity();
          if (!identity || route.ownerId !== identity.subject) {
            throw new Error('Unauthorized');
          }
        },
        evalRemove: async (ctx, routeId) => {
          const identity = await ctx.auth.getUserIdentity();
          if (!identity) throw new Error('Unauthorized');
        },
        // Side-effect: trigger enrichment when route is created
        onInsert: async (ctx, route) => {
          await ctx.scheduler.runAfter(
            0,
            api.routes.enrich,
            { routeId: route._id }
          );
        },
      },
    }
  );
```

**Generated Endpoints:**

| Endpoint | Type | Purpose |
|----------|------|---------|
| `material` | Query | Paginated materialized routes (SSR seeding) |
| `delta` | Query | Real-time CRDT stream (reactive subscription) |
| `replicate` | Mutation | Unified insert/update/delete with CRDT sync |
| `presence` | Mutation | Session management (join/leave/mark/signal) |
| `session` | Query | Query connected sessions for collaboration |

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
| Convex | ^1.x | Backend storage and queries | https://docs.convex.dev |
| @trestleinc/replicate | ^1.x | Local-first sync engine (Yjs + op-sqlite) | https://github.com/trestleinc/replicate |
| @op-engineering/op-sqlite | ^7.x | SQLite database for React Native | https://github.com/op-engineering/op-sqlite |
| Expo | ~50.x | Platform runtime | https://docs.expo.dev |
| React Native Reanimated | ^3.x | Progressive loading animations | https://docs.swmansion.com/react-native-reanimated |
| react-native-get-random-values | ^1.x | Crypto polyfill for Replicate RN | https://github.com/LinusU/react-native-get-random-values |
| react-native-random-uuid | ^0.x | UUID polyfill for Replicate RN | https://github.com/practicalwave/react-native-random-uuid |

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

**Replicate Client Collection:**
- `useRoutes` - Replicate collection with op-sqlite persistence (`collections/use-routes.ts`)

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

- **Time to first response:** <10 seconds (local routing only)
- **Weather enrichment:** <20 seconds (server-side background job)
- **Deterministic leg label derivation:** <10ms (synchronous, pure code, offline)
- **Creative (Haiku) enrichment:** <5s (server-side background job, target: 3.9s)
- **Progressive UI update:** <100ms
- **Queue drain rate:** >10 jobs/min
- **Route calculation:** < 2 seconds offline
- **Map rendering:** 60fps during pan/zoom
- **Region download:** 5-10 minutes for city-level region
- **App size increase:** < 50MB (base SDK only — no model bundle)

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
