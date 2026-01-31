# TRD: Phase 2 - Personalization

**Status**: 📋 Planned (Sprints 6-7)
**Depends On**: Phase 1 Core (complete)

---

## Overview

Phase 2 adds personalization capabilities that influence route generation and enhance decision-making:
- Favorite roads library
- Avoid areas/roads preferences
- Elevation profile visualization
- Enhanced overlay comparison

These features build on the Phase 1 foundation without modifying existing contracts.

---

## Goals

1. Enable riders to save and reuse favorite road segments
2. Allow exclusion of specific areas from route generation
3. Provide elevation context for route evaluation
4. Improve multi-route comparison UX

---

## Non-Goals (Phase 2)

- Real-time traffic integration
- Road surface quality (data source TBD)
- Social sharing of favorites
- Route editing/modification

---

## 1. Data Model Extensions

### 1.1 User Preferences Table

**user_preferences**

```typescript
defineTable({
  userId: v.id("users"),

  // Route generation preferences
  defaultScenicBias: v.union(v.literal("default"), v.literal("high")),
  defaultAvoidHighways: v.boolean(),
  defaultAvoidTolls: v.boolean(),

  // Avoid areas (geofenced regions)
  avoidAreas: v.array(v.object({
    id: v.string(),
    name: v.string(),
    bounds: v.object({
      north: v.number(),
      south: v.number(),
      east: v.number(),
      west: v.number(),
    }),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })),

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId"])
```

**Constraints**:
- Max 20 avoid areas per user
- Bounds must be valid (north > south, east > west)
- Area names max 100 characters

### 1.2 Favorite Roads Table

**favorite_roads**

```typescript
defineTable({
  userId: v.id("users"),

  // Road identification
  name: v.string(),
  description: v.optional(v.string()),

  // Geometry (encoded polyline representing the road segment)
  geometry: v.object({
    format: v.literal("polyline"),
    encoding: v.string(),
    precision: v.number(),
    value: v.string(),
  }),

  // Bounding box for quick spatial queries
  bounds: v.object({
    north: v.number(),
    south: v.number(),
    east: v.number(),
    west: v.number(),
  }),

  // Source tracking
  source: v.union(
    v.literal("manual"),      // User drew on map
    v.literal("from_route"),  // Extracted from saved route
    v.literal("import")       // Future: GPX import
  ),
  sourceRouteId: v.optional(v.id("saved_routes")),

  // Metadata
  tags: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId"])
.index("by_user_created", ["userId", "createdAt"])
```

**Constraints**:
- Max 100 favorite roads per user
- Road name max 200 characters
- Max 10 tags per road
- Geometry must be valid decodable polyline

---

## 2. API Extensions

### 2.1 User Preferences API

**db.userPreferences.get** (query)

```typescript
Args: none (uses authenticated user)

Returns: UserPreferencesView | null
{
  defaultScenicBias: "default" | "high"
  defaultAvoidHighways: boolean
  defaultAvoidTolls: boolean
  avoidAreas: AvoidAreaView[]
}

type AvoidAreaView = {
  id: string
  name: string
  bounds: Bounds
  reason?: string
}
```

**db.userPreferences.update** (mutation)

```typescript
Args: {
  defaultScenicBias?: "default" | "high"
  defaultAvoidHighways?: boolean
  defaultAvoidTolls?: boolean
}

Returns: null

Behavior: Upserts preferences (creates if not exists)
```

**db.userPreferences.addAvoidArea** (mutation)

```typescript
Args: {
  name: string
  bounds: Bounds
  reason?: string
}

Returns: { areaId: string }

Errors:
- LIMIT_EXCEEDED: Max 20 avoid areas
- INVALID_BOUNDS: Invalid coordinate bounds
```

**db.userPreferences.removeAvoidArea** (mutation)

```typescript
Args: { areaId: string }

Returns: null

Errors:
- NOT_FOUND: Area doesn't exist or unauthorized
```

### 2.2 Favorite Roads API

**db.favoriteRoads.list** (query)

```typescript
Args: {
  limit?: number  // default 50, max 100
  cursor?: string // pagination
}

Returns: {
  roads: FavoriteRoadListItem[]
  nextCursor?: string
}

type FavoriteRoadListItem = {
  id: Id<"favorite_roads">
  name: string
  description?: string
  bounds: Bounds
  tags: string[]
  createdAt: number
}
```

**db.favoriteRoads.getDetail** (query)

```typescript
Args: { roadId: Id<"favorite_roads"> }

Returns: FavoriteRoadDetailView
{
  id: Id<"favorite_roads">
  name: string
  description?: string
  geometry: PolylineGeometry
  bounds: Bounds
  source: "manual" | "from_route" | "import"
  sourceRouteId?: Id<"saved_routes">
  tags: string[]
  createdAt: number
  updatedAt: number
}

Errors:
- NOT_FOUND: Road doesn't exist or unauthorized
```

**db.favoriteRoads.add** (mutation)

```typescript
Args: {
  name: string
  description?: string
  geometry: PolylineGeometry
  source: "manual" | "from_route"
  sourceRouteId?: Id<"saved_routes">
  tags?: string[]
}

Returns: { roadId: Id<"favorite_roads"> }

Errors:
- LIMIT_EXCEEDED: Max 100 favorite roads
- INVALID_GEOMETRY: Cannot decode polyline
- ROUTE_NOT_FOUND: sourceRouteId invalid (if provided)
```

**db.favoriteRoads.update** (mutation)

```typescript
Args: {
  roadId: Id<"favorite_roads">
  name?: string
  description?: string
  tags?: string[]
}

Returns: null

Errors:
- NOT_FOUND: Road doesn't exist or unauthorized
```

**db.favoriteRoads.remove** (mutation)

```typescript
Args: { roadId: Id<"favorite_roads"> }

Returns: null

Errors:
- NOT_FOUND: Road doesn't exist or unauthorized
```

---

## 3. Planning Pipeline Extensions

### 3.1 Preferences Integration

The `planRide` action is extended to accept and apply user preferences:

**Extended PlanInput**

```typescript
type PlanInputV2 = {
  // Existing Phase 1 fields
  start: RouteStop
  end: RouteStop
  departureTime: number
  preferences: {
    scenicBias: "default" | "high"
    avoidHighways?: boolean
    avoidTolls?: boolean
  }

  // NEW Phase 2 fields
  applyUserPreferences?: boolean  // default: true
  includeFavoriteRoads?: boolean  // default: true
}
```

### 3.2 Favorite Roads Matching

When `includeFavoriteRoads: true`, the planning pipeline:

1. **Pre-Planning**: Fetch user's favorite roads
2. **LLM Context**: Include favorite road names in system prompt
3. **Route Scoring**: Boost routes that traverse favorite road segments
4. **Output**: Flag which favorites are included in each option

**Matching Algorithm**

```typescript
// Simplified pseudocode
function matchFavoriteRoads(
  routeGeometry: LatLng[],
  favoriteRoads: FavoriteRoad[]
): MatchedFavorite[] {
  const matches: MatchedFavorite[] = []

  for (const favorite of favoriteRoads) {
    const favoritePoints = decodePolyline(favorite.geometry)
    const overlapRatio = computeOverlap(routeGeometry, favoritePoints)

    if (overlapRatio > 0.7) { // 70% overlap threshold
      matches.push({
        roadId: favorite.id,
        name: favorite.name,
        overlapRatio,
      })
    }
  }

  return matches
}
```

**Performance Budget**: Max 100 favorites, matching must complete < 200ms

### 3.3 Avoid Areas Enforcement

When `applyUserPreferences: true`:

1. **Pre-Routing**: Fetch user's avoid areas
2. **Waypoint Injection**: Add avoidance waypoints around areas
3. **Route Validation**: Reject routes that cross avoid areas
4. **Fallback**: If no valid routes, warn user and offer override

---

## 4. Elevation Profile

### 4.1 Data Source

Use **Open-Meteo Elevation API** (free, no key required):

```
GET https://api.open-meteo.com/v1/elevation
?latitude=52.52,48.85
&longitude=13.41,2.35
```

**Constraints**:
- Max 100 points per request
- Sample route at ~1km intervals for elevation profile

### 4.2 Elevation Overlay Schema

**ElevationProfile** (added to RouteOverlays)

```typescript
type ElevationProfile = {
  generatedAt: number
  source: "open-meteo"

  // Sampled elevation points along route
  points: ElevationPoint[]

  // Summary statistics
  summary: {
    minElevationMeters: number
    maxElevationMeters: number
    totalAscentMeters: number
    totalDescentMeters: number
    averageGradePercent: number
    maxGradePercent: number
  }
}

type ElevationPoint = {
  distanceFromStartMeters: number
  elevationMeters: number
  gradePercent: number  // slope at this point
}
```

### 4.3 Elevation in Route Options

**Extended PlannedRouteOptionsView**

```typescript
type RouteOptionV2 = {
  // Existing Phase 1 fields
  routeOptionId: string
  label: string
  rationale: string
  stats: RouteStats
  map: RouteMapData
  overlaysPreview: {
    windSummary: WindSummary
    conditionsStatus: ConditionsStatus
  }

  // NEW Phase 2 fields
  elevationPreview?: {
    totalAscentMeters: number
    totalDescentMeters: number
    maxGradePercent: number
  }
  matchedFavorites?: {
    roadId: string
    name: string
  }[]
}
```

---

## 5. UI Requirements (Phase 2)

### 5.1 New Screens/Sheets

| ID | Name | Purpose | Design Mockup |
|----|------|---------|---------------|
| V011 | PreferencesScreen | Manage default preferences | [preferences_screen.mobile.html](../designs/mocks/preferences_screen.mobile.html) |
| V012 | AvoidAreasScreen | Manage avoid areas with map | [avoid_areas_screen.mobile.html](../designs/mocks/avoid_areas_screen.mobile.html) |
| V013 | FavoriteRoadsScreen | Browse/manage favorite roads | [favorite_roads_screen.mobile.html](../designs/mocks/favorite_roads_screen.mobile.html) |
| S010 | AddAvoidAreaSheet | Draw/define avoid area | [add_avoid_area_sheet.mobile.html](../designs/mocks/add_avoid_area_sheet.mobile.html) |
| S011 | AddFavoriteRoadSheet | Save road from route | [add_favorite_road_sheet.mobile.html](../designs/mocks/add_favorite_road_sheet.mobile.html) |
| S012 | ElevationProfileSheet | View elevation chart | [elevation_profile_sheet.mobile.html](../designs/mocks/elevation_profile_sheet.mobile.html) |

### 5.2 Modified Screens

| ID | Name | Changes |
|----|------|---------|
| S002 | RouteOptionsSheet | Add elevation preview, favorite road badges |
| S003 | RouteOverviewSheet | Add elevation chart, "Save as Favorite" action |
| S001 | PlanRideSheet | Show active preferences, quick toggle |

### 5.3 UI Component Specifications (Phase 2)

#### PreferencesScreen (V011) Components

```typescript
// Default Route Style segmented control
type RouteStyleSelector = {
  options: ['Direct', 'Balanced', 'Scenic']
  selectedValue: string
  // Maps to defaultScenicBias: "default" (Direct/Balanced) | "high" (Scenic)
}

// Avoid by Default section
type AvoidSettings = {
  highways: { icon: 'remove_road', label: 'Highways', toggle: boolean }
  tolls: { icon: 'toll', label: 'Toll Roads', toggle: boolean }
}

// Personalization nav rows
type PersonalizationNavRow = {
  icon: string
  label: string
  subtitle: string  // "3 areas defined", "7 saved segments"
  onPress: () => void
}
```

#### AvoidAreasScreen (V012) Components

```typescript
// Map with avoid area overlays
type AvoidAreaMap = {
  areas: Array<{
    id: string
    bounds: Bounds
    fillColor: 'rgba(248,113,113,0.2)'  // Red overlay
    strokeColor: '#f87171'
  }>
  onAreaTap: (areaId: string) => void
}

// Area list item
type AvoidAreaListItem = {
  name: string
  reason?: string
  bounds: Bounds  // For "Near [city]" display
  onDelete: () => void
}
```

#### FavoriteRoadsScreen (V013) Components

```typescript
// Search/filter bar
type FavoriteRoadsFilter = {
  searchQuery: string
  sortBy: 'recent' | 'name' | 'distance'
}

// Road segment card
type FavoriteRoadCard = {
  name: string
  description?: string
  tags: string[]
  preview: PolylineGeometry  // Mini map preview
  source: 'manual' | 'from_route'
  onTap: () => void
  onDelete: () => void
}
```

#### AddAvoidAreaSheet (S010) Components

```typescript
// Map with rectangle drawing
type AvoidAreaDrawer = {
  mode: 'draw' | 'adjust'
  currentBounds?: Bounds
  onBoundsChange: (bounds: Bounds) => void
}

// Area naming
type AvoidAreaForm = {
  name: { placeholder: 'Name this area', maxLength: 100 }
  reason: { placeholder: 'Why avoid? (optional)', maxLength: 200 }
}
```

#### AddFavoriteRoadSheet (S011) Components

```typescript
// Road segment display
type RoadSegmentPreview = {
  geometry: PolylineGeometry
  startLabel: string
  endLabel: string
  distanceMeters: number
}

// Road naming and tagging
type FavoriteRoadForm = {
  name: { placeholder: 'Name this road', maxLength: 200 }
  description: { placeholder: 'Notes (optional)', maxLength: 500 }
  tags: {
    suggestions: ['Scenic', 'Twisty', 'Mountain', 'Coastal', 'Smooth', 'Challenging']
    selected: string[]
    maxTags: 10
  }
}
```

#### ElevationProfileSheet (S012) Components

```typescript
// Stats row
type ElevationStats = {
  totalAscent: { icon: 'trending_up', value: string, label: 'Total Ascent' }
  totalDescent: { icon: 'trending_down', value: string, label: 'Total Descent' }
  maxGrade: { icon: 'show_chart', value: string, label: 'Max Grade' }
}

// Elevation chart
type ElevationChart = {
  type: 'area'
  data: Array<{ distance: number, elevation: number }>
  xAxis: { labels: ['0 mi', '{mid} mi', '{end} mi'] }
  fillGradient: ['rgba(184,115,51,0.4)', 'rgba(184,115,51,0)']
  strokeColor: '#B87333'
}

// Legend
type ElevationLegend = {
  items: [
    { color: '#4ade80', label: 'Ascent' },
    { color: '#f87171', label: 'Descent' }
  ]
}
```

### 5.3 User Flows (Phase 2)

**Flow: Save Road as Favorite**
1. User views RouteOverviewSheet
2. User long-presses a road segment on map
3. AddFavoriteRoadSheet opens with segment highlighted
4. User names the road and adds optional tags
5. Road saved to favorites

**Flow: Manage Avoid Areas**
1. User opens PreferencesScreen
2. User taps "Manage Avoid Areas"
3. AvoidAreasScreen shows map with existing areas
4. User taps "Add Area" → draws rectangle
5. User names area and saves

**Flow: View Elevation Profile**
1. User compares routes in RouteOptionsSheet
2. User sees elevation preview (ascent/descent)
3. User taps "View Elevation" → ElevationProfileSheet
4. Chart shows elevation over distance

---

## 6. Error Handling (Phase 2)

| Code | Trigger | User Message |
|------|---------|--------------|
| PREFERENCES_LIMIT | >20 avoid areas | "Maximum avoid areas reached. Remove one to add another." |
| FAVORITES_LIMIT | >100 favorite roads | "Maximum favorites reached. Remove one to add another." |
| NO_VALID_ROUTE | All routes cross avoid areas | "No routes found avoiding your excluded areas. Try adjusting your preferences." |
| ELEVATION_UNAVAILABLE | Open-Meteo failure | "Elevation data temporarily unavailable." |

---

## 7. Migration Notes

### 7.1 Existing Users

- `user_preferences` created on first access (lazy initialization)
- Existing saved routes unaffected
- No backfill required

### 7.2 Backward Compatibility

- `planRide` continues to work without Phase 2 parameters
- `applyUserPreferences` defaults to `true` but gracefully handles missing preferences
- UI gracefully hides Phase 2 features until preferences exist

---

## 8. Sprint 6-7 Task Breakdown

### Sprint 6: Preferences + Favorites Foundation

| Task | Effort | Dependencies |
|------|--------|--------------|
| Add `user_preferences` table + validators | S | Schema |
| Add `favorite_roads` table + validators | S | Schema |
| Implement preferences CRUD mutations | M | Tables |
| Implement favorite roads CRUD mutations | M | Tables |
| Build PreferencesScreen (V011) | M | Mutations |
| Build FavoriteRoadsScreen (V013) | M | Mutations |
| Integrate preferences into planRide | L | All above |

### Sprint 7: Elevation + Comparison

| Task | Effort | Dependencies |
|------|--------|--------------|
| Add Open-Meteo elevation provider | M | None |
| Add elevation overlay to route processing | M | Provider |
| Build ElevationProfileSheet (S012) | M | Overlay |
| Update RouteOptionsSheet with elevation | S | Overlay |
| Update RouteOverviewSheet with favorites action | M | Favorites |
| Favorite road matching in planning | L | All above |

---

## 9. RAID (Phase 2)

### Risks
- **R1**: Favorite road matching may be slow with many favorites → Mitigation: Limit to 100, spatial indexing
- **R2**: Avoid areas may make all routes invalid → Mitigation: Clear feedback, override option

### Assumptions
- A1: Users will have <20 avoid areas typically
- A2: Favorite roads are used for "include" not "must include"

### Issues
- I1: How to draw avoid areas on mobile (rectangle vs polygon)

### Dependencies
- D1: Open-Meteo elevation API availability
- D2: Phase 1 core completion
