# TRD: Phase 3 - Post-Ride Experience

**Status**: 📋 Planned (Sprints 8-9)
**Depends On**: Phase 1 Core (complete), Phase 2 Personalization

---

## Overview

Phase 3 closes the ride loop by enabling riders to:
- Rate completed rides
- Add notes and observations
- Browse ride history
- Optimize departure time based on conditions

These features create engagement and provide data for future personalization.

---

## Goals

1. Enable riders to capture ride quality feedback
2. Provide a historical view of riding activity
3. Optimize route planning based on time-of-day conditions
4. Build foundation for future analytics

---

## Non-Goals (Phase 3)

- Live ride tracking/GPS recording
- Social sharing of rides
- Personal analytics dashboard (deferred to v2)
- Gamification/achievements

---

## 1. Data Model Extensions

### 1.1 Route Ratings Extension

Extend `saved_routes` table with rating fields:

```typescript
// Added to saved_routes schema
{
  // ... existing Phase 1 fields ...

  // Phase 3: Rating and notes
  rating: v.optional(v.object({
    stars: v.number(),           // 1-5
    ratedAt: v.number(),
    notes: v.optional(v.string()),
    tags: v.array(v.string()),   // ["scenic", "twisty", "traffic", etc.]
  })),

  // Phase 3: Ride completion tracking
  rideStatus: v.optional(v.union(
    v.literal("planned"),
    v.literal("completed"),
    v.literal("cancelled")
  )),
  completedAt: v.optional(v.number()),
}
```

**Constraints**:
- Stars: 1-5 (integer)
- Notes: Max 2000 characters
- Tags: Max 10 tags, each max 50 characters
- Predefined tag suggestions (aligned with S013 mockup):
  ```typescript
  const RATING_TAGS = [
    'Great scenery',
    'Smooth roads',
    'Light traffic',
    'Heavy traffic',
    'Weather issues',
    'Would repeat',
    'Challenging curves',
    'Well maintained',
  ] as const
  ```
- **Note**: Tags are user-selectable chips, not free-form text in POC

### 1.2 Ride History Table

**ride_history** (aggregation/analytics-ready)

```typescript
defineTable({
  userId: v.id("users"),
  savedRouteId: v.id("saved_routes"),

  // Ride metadata
  plannedDepartureTime: v.number(),
  actualDepartureTime: v.optional(v.number()),
  completedAt: v.optional(v.number()),

  // Route summary (denormalized for quick access)
  routeName: v.string(),
  distanceMeters: v.number(),
  durationSeconds: v.number(),

  // Conditions at ride time (snapshot)
  conditionsSnapshot: v.optional(v.object({
    windSummary: v.string(),
    rainForecast: v.optional(v.string()),
    temperatureRange: v.optional(v.object({
      min: v.number(),
      max: v.number(),
      unit: v.literal("celsius"),
    })),
  })),

  // User feedback
  rating: v.optional(v.number()),

  // Metadata
  createdAt: v.number(),
})
.index("by_user", ["userId"])
.index("by_user_date", ["userId", "completedAt"])
.index("by_route", ["savedRouteId"])
```

**Purpose**: Supports history browsing and future analytics without heavy joins.

---

## 2. API Extensions

### 2.1 Rating API

**db.savedRoutes.rateRoute** (mutation)

```typescript
Args: {
  routeId: Id<"saved_routes">
  stars: number           // 1-5
  notes?: string          // max 2000 chars
  tags?: string[]         // max 10 tags
}

Returns: null

Behavior:
- Sets rating on saved route
- Updates rideStatus to "completed" if not already
- Creates ride_history entry if not exists

Errors:
- NOT_FOUND: Route doesn't exist or unauthorized
- INVALID_RATING: Stars not 1-5
- CONTENT_TOO_LONG: Notes > 2000 chars
```

**db.savedRoutes.updateNotes** (mutation)

```typescript
Args: {
  routeId: Id<"saved_routes">
  notes: string
}

Returns: null

Errors:
- NOT_FOUND: Route doesn't exist or unauthorized
- NOT_RATED: Route hasn't been rated yet
- CONTENT_TOO_LONG: Notes > 2000 chars
```

**db.savedRoutes.markCompleted** (mutation)

```typescript
Args: {
  routeId: Id<"saved_routes">
  completedAt?: number    // defaults to now
}

Returns: null

Behavior:
- Sets rideStatus to "completed"
- Records completedAt timestamp
- Creates ride_history entry

Errors:
- NOT_FOUND: Route doesn't exist or unauthorized
- ALREADY_COMPLETED: Route already marked completed
```

**db.savedRoutes.markCancelled** (mutation)

```typescript
Args: {
  routeId: Id<"saved_routes">
  reason?: string
}

Returns: null

Errors:
- NOT_FOUND: Route doesn't exist or unauthorized
```

### 2.2 Ride History API

**db.rideHistory.list** (query)

```typescript
Args: {
  limit?: number       // default 20, max 50
  cursor?: string      // pagination
  year?: number        // filter by year
  month?: number       // filter by month (1-12)
}

Returns: {
  rides: RideHistoryListItem[]
  nextCursor?: string
  summary: {
    totalRides: number
    totalDistanceMeters: number
    averageRating?: number
  }
}

type RideHistoryListItem = {
  id: Id<"ride_history">
  savedRouteId: Id<"saved_routes">
  routeName: string
  distanceMeters: number
  completedAt: number
  rating?: number
}
```

**db.rideHistory.getDetail** (query)

```typescript
Args: {
  historyId: Id<"ride_history">
}

Returns: RideHistoryDetailView
{
  id: Id<"ride_history">
  savedRouteId: Id<"saved_routes">
  routeName: string
  distanceMeters: number
  durationSeconds: number
  plannedDepartureTime: number
  completedAt?: number
  conditionsSnapshot?: ConditionsSnapshot
  rating?: number
  notes?: string
  tags?: string[]
}

Errors:
- NOT_FOUND: History entry doesn't exist or unauthorized
```

---

## 3. Time-of-Day Optimization

### 3.1 Concept

When planning a route, suggest optimal departure windows based on:
- Weather forecast (avoid rain, extreme temps)
- Wind patterns (calm morning vs gusty afternoon)
- Daylight hours (sunrise/sunset)

### 3.2 Optimization Response

**Extended PlanInitView**

```typescript
type PlanInitViewV3 = {
  // Existing fields
  defaults: PlanPreferences
  constraints: PlanConstraints

  // NEW Phase 3
  departureOptimization?: {
    enabled: boolean
    windows: OptimalWindow[]
  }
}

type OptimalWindow = {
  startTime: number         // unix timestamp
  endTime: number           // unix timestamp
  score: number             // 0-100
  reasons: string[]         // ["Low wind", "No rain", "Comfortable temp"]
  warnings?: string[]       // ["After sunset", "High UV"]
}
```

### 3.3 Optimization Logic

```typescript
// Pseudocode for departure optimization
function computeOptimalWindows(
  route: RouteSnapshot,
  forecastDate: Date,
  location: LatLng
): OptimalWindow[] {
  const windows: OptimalWindow[] = []

  // Check 6am to 8pm in 2-hour windows
  for (let hour = 6; hour <= 18; hour += 2) {
    const windowStart = setHours(forecastDate, hour)
    const windowEnd = addHours(windowStart, 2)

    const forecast = getForecast(location, windowStart)
    const sun = getSunTimes(location, forecastDate)

    const score = computeScore({
      wind: forecast.windSpeed,
      rain: forecast.precipitationProbability,
      temp: forecast.temperature,
      isDaylight: windowStart >= sun.rise && windowEnd <= sun.set,
    })

    windows.push({
      startTime: windowStart.getTime(),
      endTime: windowEnd.getTime(),
      score,
      reasons: generateReasons(forecast, sun),
      warnings: generateWarnings(forecast, sun),
    })
  }

  return windows.sort((a, b) => b.score - a.score)
}
```

### 3.4 Provider Integration

Use existing **Open-Meteo** forecast API with hourly granularity:

```
GET https://api.open-meteo.com/v1/forecast
?latitude=...
&longitude=...
&hourly=temperature_2m,precipitation_probability,wind_speed_10m
&forecast_days=3
```

---

## 4. UI Requirements (Phase 3)

### 4.1 New Screens/Sheets

| ID | Name | Purpose | Design Mockup |
|----|------|---------|---------------|
| V014 | RideHistoryScreen | Browse completed rides | [ride_history_screen.mobile.html](../designs/mocks/ride_history_screen.mobile.html) |
| S013 | RateRouteSheet | Rate and add notes | [rate_route_sheet.mobile.html](../designs/mocks/rate_route_sheet.mobile.html) |
| S014 | DepartureOptimizerSheet | View optimal departure windows | [departure_optimizer_sheet.mobile.html](../designs/mocks/departure_optimizer_sheet.mobile.html) |
| S015 | RideDetailSheet | View historical ride details | [ride_detail_sheet.mobile.html](../designs/mocks/ride_detail_sheet.mobile.html) |

### 4.2 Modified Screens

| ID | Name | Changes |
|----|------|---------|
| V003 | SavedRouteDetail | Add "Mark Complete" action, show rating |
| S001 | PlanRideSheet | Add "Best Time" suggestion |
| V002 | SavedRoutesList | Show completion status, rating |

### 4.3 UI Component Specifications (Phase 3)

#### RateRouteSheet (S013) Components

```typescript
// Route summary card at top
type RouteSummaryCard = {
  thumbnail: MapSnapshot  // Mini route preview
  name: string
  stats: string  // "87 mi • 2h 15m"
}

// Star rating input
type StarRatingInput = {
  value: number  // 1-5
  size: 'lg'     // 40px stars
  interactive: true
}

// Notes textarea
type NotesInput = {
  placeholder: 'How did the ride go? Any highlights or issues?'
  maxLength: 2000
  height: 100
}

// Tag picker (chip selection)
type TagPicker = {
  options: typeof RATING_TAGS
  selected: string[]
  multiSelect: true
  maxSelections: 10
}
```

#### DepartureOptimizerSheet (S014) Components

```typescript
// Date selector (horizontal scroll)
type DateSelector = {
  dates: Array<{
    label: string   // "Today", "Tomorrow", "Thu", "Fri"
    date: string    // "Jan 29"
    isActive: boolean
  }>
  maxDays: 4
}

// Recommended time card (highlighted)
type RecommendedTimeCard = {
  badge: { icon: 'thumb_up', label: 'Recommended' }
  timeRange: string  // "6:00 AM - 9:00 AM"
  score: number      // 0-100
  reasons: Array<{
    icon: string
    text: string  // "Light winds (5-10 mph)"
  }>
}

// Alternative time window
type TimeWindowCard = {
  timeRange: string
  conditions: Array<{
    icon: string
    label: string  // "Moderate", "74°F"
  }>
  score: number
  scoreBadgeColor: 'good' | 'moderate' | 'poor'
}
```

#### RideDetailSheet (S015) Components

```typescript
// Conditions snapshot (at time of ride)
type ConditionsSnapshot = {
  wind: { icon: 'air', label: 'Wind', value: '10-15 mph' }
  temp: { icon: 'thermostat', label: 'Temp', value: '68-72°F' }
  weather: { icon: 'wb_sunny', label: 'Weather', value: 'Clear' }
}

// Rating display (read-only)
type RatingDisplay = {
  stars: number  // Filled stars
  maxStars: 5
  numericValue: string  // "4.0"
}

// Notes display
type NotesDisplay = {
  text: string
  style: 'body'  // 14px, secondary color
}

// Tags display
type TagsDisplay = {
  tags: string[]
  style: 'chip'  // Horizontal wrap
}
```

### 4.3 User Flows (Phase 3)

**Flow: Rate a Completed Ride**
1. User opens SavedRouteDetail (V003)
2. User taps "Mark as Completed"
3. RateRouteSheet (S013) opens
4. User selects 1-5 stars
5. User optionally adds notes and tags
6. Rating saved, ride added to history

**Flow: Browse Ride History**
1. User navigates to RideHistoryScreen (V014)
2. List shows completed rides grouped by month
3. User taps a ride → RideDetailSheet (S015)
4. Shows route snapshot, conditions at ride time, user notes

**Flow: Optimize Departure Time**
1. User opens PlanRideSheet (S001)
2. Sees "Best departure: 8am-10am" suggestion
3. User taps for details → DepartureOptimizerSheet (S014)
4. Shows weather windows with scores
5. User selects preferred window → updates departure time

---

## 5. View Models (Phase 3)

### 5.1 SavedRouteDetailView (Extended)

```typescript
type SavedRouteDetailViewV3 = {
  // Existing Phase 1 fields
  savedRouteId: Id<"saved_routes">
  name: string
  planInput: PlanInput
  routeSnapshot: RouteSnapshot
  routeIndex: RouteIndex
  snapshotMeta: SnapshotMeta
  capabilities: SavedRouteCapabilities

  // Phase 3 additions
  rideStatus: "planned" | "completed" | "cancelled"
  completedAt?: number
  rating?: {
    stars: number
    notes?: string
    tags: string[]
    ratedAt: number
  }
}
```

### 5.2 SavedRouteListItemView (Extended)

```typescript
type SavedRouteListItemViewV3 = {
  // Existing Phase 1 fields
  savedRouteId: Id<"saved_routes">
  name: string
  createdAt: number
  updatedAt: number
  preview: RoutePreview
  capabilities: SavedRouteCapabilities

  // Phase 3 additions
  rideStatus: "planned" | "completed" | "cancelled"
  rating?: number  // 1-5 (stars only for list view)
}
```

---

## 6. Error Handling (Phase 3)

| Code | Trigger | User Message |
|------|---------|--------------|
| INVALID_RATING | Stars not 1-5 | "Rating must be 1-5 stars." |
| ALREADY_RATED | Re-rating without update | "This route has already been rated. Use edit to update." |
| NOT_RATED | Updating notes on unrated route | "Rate this route first to add notes." |
| FORECAST_UNAVAILABLE | Time optimization fails | "Departure optimization temporarily unavailable." |

---

## 7. Privacy & Data Retention

### 7.1 Ride History Retention

- Ride history retained indefinitely by default
- User can delete individual history entries
- Deleting saved route removes associated history

### 7.2 Rating Data

- Ratings are private to user (not shared)
- Notes may contain personal observations (private)
- Future: Anonymized aggregate ratings for route popularity

---

## 8. Migration Notes

### 8.1 Existing Saved Routes

- `rideStatus` defaults to `"planned"` for existing routes
- `rating` is null until user rates
- No backfill required

### 8.2 Ride History

- Created on first completion, not retroactively
- Existing saved routes can be marked complete going forward

---

## 9. Sprint 8-9 Task Breakdown

### Sprint 8: Rating + History Foundation

| Task | Effort | Dependencies |
|------|--------|--------------|
| Extend saved_routes schema with rating fields | S | None |
| Add ride_history table + validators | S | Schema |
| Implement rating mutations | M | Schema |
| Implement ride_history queries | M | Table |
| Build RateRouteSheet (S013) | M | Mutations |
| Build RideHistoryScreen (V014) | M | Queries |
| Update SavedRouteDetail with rating | S | Mutations |
| Update SavedRoutesList with status | S | Schema |

### Sprint 9: Time Optimization + Polish

| Task | Effort | Dependencies |
|------|--------|--------------|
| Add hourly forecast fetching to weather provider | M | Provider |
| Implement departure window computation | M | Forecast |
| Build DepartureOptimizerSheet (S014) | M | Computation |
| Integrate optimization into PlanRideSheet | M | Sheet |
| Build RideDetailSheet (S015) | S | History |
| E2E testing: rate → history → reopen | M | All above |
| Polish and edge case handling | M | All above |

---

## 10. RAID (Phase 3)

### Risks
- **R1**: Low rating completion rate → Mitigation: Prompt after ride, keep simple
- **R2**: Forecast accuracy for optimization → Mitigation: Show as "suggestion" not guarantee

### Assumptions
- A1: Users will mark rides as completed (not just leave them)
- A2: Time-of-day matters for ride quality
- A3: Notes provide value for future reference

### Issues
- I1: How to detect ride completion without GPS tracking
- I2: Optimal tag vocabulary (predefined vs. freeform)

### Dependencies
- D1: Phase 1 + Phase 2 completion
- D2: Open-Meteo hourly forecast availability

---

## 11. Future Extensions (v2+)

Features enabled by Phase 3 data:

| Feature | Data Required | Phase |
|---------|---------------|-------|
| Personal analytics dashboard | ride_history aggregations | v2 |
| Route recommendations based on ratings | rating data | v2 |
| "Best rated roads" discovery | aggregate ratings | v2 |
| Seasonal patterns | history + weather | v2 |
| Achievements/streaks | history counts | v2+ |
