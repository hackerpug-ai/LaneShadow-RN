---
stability: CONSTITUTION
last_validated: 2026-03-04
prd_version: 1.0.0
---

# Technical Requirements

## System Components

| Component | Description | Status |
|-----------|-------------|--------|
| Convex Backend | Serverless backend with queries, mutations, actions | Existing |
| Planning Graph | LangGraph state machine for route generation | Existing |
| Weather Provider | OpenWeather API integration for overlays | Existing |
| Clerk Auth | User authentication and session management | Existing |
| MapBox | Map rendering and polyline display | Existing |
| Google Places | Location autocomplete | Existing |
| Google Elevation | Elevation data for routes | New |

## Schema Extensions

### `saved_routes` Table Extensions

```typescript
// Existing fields (no change)
_id, owner, name, route, createdAt, visibility

// New fields for POST group
rating: v.optional(v.number()),        // 1-5 stars
notes: v.optional(v.string()),         // User notes
ridden_at: v.optional(v.number()),     // Timestamp when ridden
status: v.optional(v.union(            // Route status
  v.literal("planned"),
  v.literal("ridden")
)),
```

### New `favorite_roads` Table

```typescript
export const favorite_roads = defineTable({
  owner: v.id("users"),
  name: v.string(),
  geometry: v.object({
    start: v.object({ lat: v.number(), lng: v.number() }),
    end: v.object({ lat: v.number(), lng: v.number() }),
    polyline: v.string(), // Encoded polyline
  }),
  location_label: v.string(),
  created_at: v.number(),
})
  .index("by_owner", ["owner"])
```

### New `avoid_areas` Table

```typescript
export const avoid_areas = defineTable({
  owner: v.id("users"),
  name: v.string(),
  geometry: v.union(
    v.object({
      type: v.literal("circle"),
      center: v.object({ lat: v.number(), lng: v.number() }),
      radius_meters: v.number(),
    }),
    v.object({
      type: v.literal("polygon"),
      points: v.array(v.object({ lat: v.number(), lng: v.number() })),
    })
  ),
  active: v.boolean(),
  created_at: v.number(),
})
  .index("by_owner", ["owner"])
  .index("by_owner_active", ["owner", "active"])
```

## API Design

### New Convex Functions

| Function | Type | Description |
|----------|------|-------------|
| `savedRoutes.update` | Mutation | Update name, rating, notes, status |
| `savedRoutes.delete` | Mutation | Soft delete with undo window |
| `savedRoutes.search` | Query | Search by name, date, location |
| `favoriteRoads.insert` | Mutation | Add favorite road segment |
| `favoriteRoads.list` | Query | List user's favorite roads |
| `favoriteRoads.delete` | Mutation | Remove favorite road |
| `avoidAreas.insert` | Mutation | Create avoid area |
| `avoidAreas.list` | Query | List user's avoid areas |
| `avoidAreas.update` | Mutation | Toggle active, rename |
| `avoidAreas.delete` | Mutation | Remove avoid area |

### Planning Graph Extensions

The planning graph (`planningGraph.ts`) needs extension to:
1. Accept favorite roads as input context
2. Accept avoid areas as exclusion zones
3. Pass these to the LLM route sketcher

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Home Map   │  │Saved Routes │  │  Settings   │              │
│  │   Screen    │  │   Screen    │  │   Screen    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │              React Native Paper UI            │              │
│  │  (Route Cards, Weather Badges, Overlays)      │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────┐              │
│  │                 MapBox View                    │              │
│  │  (Polylines, Overlays, Elevation Profile)     │              │
│  └──────────────────────┬────────────────────────┘              │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Convex Backend                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   saved_routes  │  │ favorite_roads  │  │   avoid_areas   │  │
│  │     (table)     │  │    (table)      │  │    (table)      │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │            │
│  ┌────────┴────────────────────┴────────────────────┴────────┐  │
│  │                    Planning Graph                          │  │
│  │  (LangGraph + OpenAI + Weather + Routing Providers)       │  │
│  └─────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    {OpenWeather}       {Google Maps}       {OpenAI}
    Wind/Rain/Temp      Places/Routes       Route Sketch
                        /Elevation
```

## External Dependencies

| Dependency | Used By | Documentation |
|------------|---------|---------------|
| OpenWeather API | Weather overlays | https://openweathermap.org/api |
| Google Maps API | Places, Routing | https://developers.google.com/maps |
| Google Elevation API | Elevation profiles | https://developers.google.com/maps/documentation/elevation |
| OpenAI API | Route sketching | https://platform.openai.com/docs |
| MapBox | Map rendering | https://docs.mapbox.com/ |
| Clerk | Authentication | https://clerk.com/docs |

## UI Components

### Existing Components to Extend

| Component | Extension Needed |
|-----------|------------------|
| `route-option-card.tsx` | Add rain/temp badges |
| `route-details-sheet.tsx` | Full detail view with overlays |
| `saved-route-card.tsx` | Add rating, notes indicator, ridden badge |
| `weather-pill.tsx` | Add rain/temp support |
| `map-view.tsx` | Support overlay toggle |
| `route-polyline.tsx` | Rain/temp color coding |

### New Components Needed

| Component | Purpose |
|-----------|---------|
| `saved-routes-list.tsx` | List view with search/filter |
| `route-search-bar.tsx` | Search input for routes |
| `date-range-picker.tsx` | Filter by date range |
| `rating-stars.tsx` | 1-5 star rating input |
| `ride-notes-input.tsx` | Text input for notes |
| `favorite-road-card.tsx` | Card for favorite road display |
| `avoid-area-picker.tsx` | Map-based area selection |
| `elevation-profile.tsx` | Elevation chart component |
