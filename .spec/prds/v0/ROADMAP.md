# LaneShadow - Epic Roadmap (Human-Testable)

> Generated: 2026-03-04
> PRD Version: 1.0.0
> Appetite: 6 weeks
> Principle: **Each epic ends with something a human can verify**

---

## Epic 1: Complete Weather Planning Experience

**Human Test Goal**: Plan a route and make an informed weather decision using all overlays.

### What You Can Test

1. Open the app and start planning a route (A to B)
2. See **rain probability badge** on each route option card
3. See **temperature range badge** on each route option card
4. Tap a route to select it
5. On the map, toggle to **rain overlay** - see precipitation risk colors on route segments
6. Toggle to **temperature overlay** - see thermal comfort colors
7. Go back to comparison view
8. See **weather strip** showing worst condition per route
9. Tap to expand and see segment-by-segment weather breakdown
10. Select the route with best weather conditions

### Tasks

| # | Task | Type |
|---|------|------|
| 1 | Wire rain-badge.tsx to RouteSnapshot.overlays.rain | FEATURE |
| 2 | Wire temperature-badge.tsx to RouteSnapshot.overlays.temperature | FEATURE |
| 3 | Add overlay toggle control (wind/rain/temp) to map view | FEATURE |
| 4 | Implement rain-based polyline coloring (light/moderate/heavy) | FEATURE |
| 5 | Implement temperature-based polyline coloring (cold/comfortable/hot) | FEATURE |
| 6 | Create compact weather-strip component with worst-condition highlight | FEATURE |
| 7 | Add expandable segment-by-segment overlay detail view | FEATURE |
| 8 | Add rain timing to route summary (e.g., "Rain expected 2-4pm") | FEATURE |
| 9 | Add high/low temperature to route summary | FEATURE |

**PRD Coverage**: UC-P1GAP-01, UC-P1GAP-02, UC-P1GAP-03

---

## Epic 2: Browse & View Saved Routes

**Human Test Goal**: Find a previously saved route and view it in full detail.

### What You Can Test

1. Navigate to **Saved Routes** tab
2. See a **scrollable list** of your saved routes (newest first)
3. On each card, see: route name, date saved, start/end locations, distance
4. See **route thumbnail** (mini map preview) on each card
5. If no routes saved, see **empty state** with "Plan your first route" CTA
6. Tap a route card
7. See **full detail view** with route on map
8. Toggle between wind/rain/temp overlays on the detail map
9. Scroll down to see **route timeline** with leg-by-leg breakdown
10. See the original **scenic rationale** and weather conditions
11. Press back - return to list **without losing scroll position**

### Tasks

| # | Task | Type |
|---|------|------|
| 1 | Replace stub saved-routes.tsx with FlatList implementation | FEATURE |
| 2 | Wire useSavedRoutes hook to list component | FEATURE |
| 3 | Add route thumbnail (static map preview) to saved-route-card | FEATURE |
| 4 | Show route metadata (name, date, locations, distance) on card | FEATURE |
| 5 | Build empty state component with planning CTA | DESIGN |
| 6 | Build route detail screen with full map view | FEATURE |
| 7 | Add overlay toggle to route detail map | FEATURE |
| 8 | Integrate route-timeline.tsx in detail view | FEATURE |
| 9 | Preserve list scroll position on navigation | FEATURE |

**PRD Coverage**: UC-SR-01, UC-SR-03

---

## Epic 3: Search, Filter & Organize Routes

**Human Test Goal**: Find a specific route quickly and organize your library.

### What You Can Test

1. Go to Saved Routes tab
2. Type in **search bar** - see routes filtered by name in real-time
3. Tap **date filter** - select "Last week" - see only recent routes
4. Tap **date filter** - select "Last month" - see more routes
5. Tap **clear filters** - see all routes again
6. Open a route detail view
7. Tap **rename** - enter new name - see updated name on card
8. Tap **delete** - see confirmation dialog
9. Confirm delete - see **undo toast** appear
10. Tap undo within 5 seconds - route reappears
11. Delete again and let undo expire - route permanently removed
12. Try **swipe-to-delete** on a route card from the list

### Tasks

| # | Task | Type |
|---|------|------|
| 1 | Create route-search-bar.tsx with debounced input | FEATURE |
| 2 | Add savedRoutes.search query to Convex backend | FEATURE |
| 3 | Create date-range-picker.tsx (presets + custom) | FEATURE |
| 4 | Add date range filtering to search query | FEATURE |
| 5 | Add "clear all filters" button | FEATURE |
| 6 | Add savedRoutes.update mutation for rename | FEATURE |
| 7 | Build rename dialog in route detail view | FEATURE |
| 8 | Add savedRoutes.delete mutation with soft delete | FEATURE |
| 9 | Build delete confirmation dialog | FEATURE |
| 10 | Implement undo toast with 5-second window | FEATURE |
| 11 | Add swipe-to-delete gesture on route cards | FEATURE |

**PRD Coverage**: UC-SR-02, UC-SR-04

---

## Epic 4: Save & Reuse Favorite Roads

**Human Test Goal**: Save a great road segment and have it influence your next route.

### What You Can Test

1. Complete a route plan (or view a saved route)
2. Long-press on a road segment on the map
3. Tap **"Save as Favorite"** - enter a name
4. Go to **Settings > Favorite Roads**
5. See your favorite road with name, location, and **mini map preview**
6. Tap to remove - road is deleted from favorites
7. Start a new route plan
8. Enable **"Include favorite roads"** toggle in planning sheet
9. Generate routes
10. See indicator showing **which favorites were included**
11. See message if a favorite couldn't be included (too far from route)

### Tasks

| # | Task | Type |
|---|------|------|
| 1 | Add favorite_roads table to Convex schema | INFRA |
| 2 | Create favoriteRoads.ts with insert/list/delete | FEATURE |
| 3 | Add long-press handler to route polyline for segment selection | FEATURE |
| 4 | Build "Save as Favorite" action sheet | FEATURE |
| 5 | Build favorite-road-card.tsx with mini map | DESIGN |
| 6 | Build Favorite Roads settings section | FEATURE |
| 7 | Add "Include favorite roads" toggle to plan-ride-sheet | FEATURE |
| 8 | Pass favorites to planning graph as preferred segments | FEATURE |
| 9 | Show favorite inclusion indicator on generated routes | FEATURE |
| 10 | Show "couldn't include" message when favorite too far | FEATURE |

**PRD Coverage**: UC-PERS-01, UC-PERS-02

---

## Epic 5: Mark Areas to Avoid

**Human Test Goal**: Mark a dangerous intersection to avoid and verify routes go around it.

### What You Can Test

1. Go to **Settings > Avoid Areas** (or access from planning map)
2. Tap **"Add Avoid Area"**
3. **Draw a circle** around an intersection you want to avoid
4. Name it (e.g., "Dangerous intersection on Hwy 9")
5. Save - see it listed in Avoid Areas
6. Start a new route plan
7. See your **avoid areas displayed** on the planning map (shaded)
8. **Toggle** an avoid area off - it turns gray
9. Generate routes
10. Verify the route **does not pass through** any active avoid areas
11. Toggle the avoid area back on and regenerate - route should change

### Tasks

| # | Task | Type |
|---|------|------|
| 1 | Add avoid_areas table to Convex schema | INFRA |
| 2 | Create avoidAreas.ts with CRUD operations | FEATURE |
| 3 | Build avoid-area-picker.tsx with circle drawing | DESIGN |
| 4 | Add polygon drawing mode for complex shapes | FEATURE |
| 5 | Build Avoid Areas settings section | FEATURE |
| 6 | Display avoid areas as shaded overlays on planning map | FEATURE |
| 7 | Add per-area active/inactive toggle | FEATURE |
| 8 | Pass avoid areas to planning graph as exclusion zones | FEATURE |
| 9 | Verify route validation rejects paths through avoid areas | FEATURE |

**PRD Coverage**: UC-PERS-03

---

## Epic 6: Elevation Profile Visualization

**Human Test Goal**: Understand the terrain of a route before you ride.

### What You Can Test

1. Plan a route (or view a saved route)
2. See **elevation profile chart** below the route summary
3. See **total elevation gain** (e.g., "+2,400 ft")
4. See **total elevation loss** (e.g., "-1,800 ft")
5. Notice **significant climbs highlighted** on the chart
6. **Tap on the chart** at a steep section
7. See corresponding **location highlighted on the map**
8. Drag along the chart - map marker follows
9. View elevation profile in saved route detail view

### Tasks

| # | Task | Type |
|---|------|------|
| 1 | Add Google Elevation API integration to route generation | INFRA |
| 2 | Store elevation data in RouteSnapshot | FEATURE |
| 3 | Build elevation-profile.tsx chart component | DESIGN |
| 4 | Add elevation gain/loss to route summary stats | FEATURE |
| 5 | Highlight significant climbs (>500ft) on chart | FEATURE |
| 6 | Implement chart tap → map location sync | FEATURE |
| 7 | Implement chart drag → map marker follows | FEATURE |
| 8 | Add elevation profile to saved route detail view | FEATURE |

**PRD Coverage**: UC-PERS-04

---

## Epic 7: Rate Routes & Add Notes

**Human Test Goal**: Rate a completed ride and add notes for future reference.

### What You Can Test

1. Open a saved route you've ridden
2. Tap the **star rating** - select 5 stars
3. See rating confirmed and displayed
4. **Change rating** to 4 stars - updates immediately
5. Tap **"Add Note"** - type "Beautiful views at mile 15, stop at Joe's Diner"
6. Save note - see it displayed in route detail
7. **Edit note** - add more text - save
8. Go back to saved routes list
9. See **rating stars** displayed on the route card
10. See **note indicator** icon on routes with notes
11. Use **rating filter** - select "4+ stars" - see only highly-rated routes
12. **Search** for "Joe's Diner" - find the route by note content

### Tasks

| # | Task | Type |
|---|------|------|
| 1 | Add rating, notes fields to saved_routes schema | INFRA |
| 2 | Build rating-stars.tsx interactive component | DESIGN |
| 3 | Add rating mutation to savedRoutes.update | FEATURE |
| 4 | Display rating on saved-route-card | FEATURE |
| 5 | Build ride-notes-input.tsx with edit/delete | DESIGN |
| 6 | Add notes mutations to savedRoutes | FEATURE |
| 7 | Display notes in route detail view | FEATURE |
| 8 | Add note indicator icon to saved-route-card | FEATURE |
| 9 | Add rating filter to search (4+ stars, etc.) | FEATURE |
| 10 | Add note content to search index | FEATURE |

**PRD Coverage**: UC-POST-01, UC-POST-02

---

## Epic 8: Track Ride History

**Human Test Goal**: Mark rides as completed and see your riding stats.

### What You Can Test

1. Open a saved route
2. Tap **"Mark as Ridden"**
3. Select **date** you rode it (defaults to today)
4. Confirm - see **"Ridden" badge** appear
5. Go back to saved routes list
6. See **"Ridden" badge** on the route card
7. Tap **"Ride History"** filter/tab
8. See **only completed rides** (not planned routes)
9. At the top, see **ride stats**: total rides, total distance
10. Open a ridden route
11. Tap **"Unmark as Ridden"** - changes back to planned status
12. Check Ride History - route no longer appears

### Tasks

| # | Task | Type |
|---|------|------|
| 1 | Add ridden_at, status fields to saved_routes schema | INFRA |
| 2 | Build "Mark as Ridden" action with date picker | FEATURE |
| 3 | Add status toggle mutation to savedRoutes | FEATURE |
| 4 | Add "Ridden" badge to saved-route-card | FEATURE |
| 5 | Create Ride History filter/tab in saved routes | FEATURE |
| 6 | Build ride stats component (count, total distance) | FEATURE |
| 7 | Calculate total distance from all ridden routes | FEATURE |
| 8 | Add "Unmark as Ridden" action | FEATURE |

**PRD Coverage**: UC-POST-03

---

## Epic Dependency Graph

```
Epic 1: Weather Planning
    │
    ▼
Epic 2: Browse & View Routes ──────┐
    │                              │
    ▼                              │
Epic 3: Search & Organize    ──────┤
    │                              │
    ├──────────────┬───────────────┤
    │              │               │
    ▼              ▼               ▼
Epic 4:       Epic 5:         Epic 6:
Favorites     Avoid Areas     Elevation
    │              │               │
    └──────────────┴───────────────┘
                   │
    ┌──────────────┴───────────────┐
    │                              │
    ▼                              ▼
Epic 7:                       Epic 8:
Rate & Notes                  Ride History
```

---

## Summary

| Epic | Human Test Goal | Tasks | PRD |
|------|-----------------|-------|-----|
| 1 | Make weather-informed route decisions | 9 | UC-P1GAP-01,02,03 |
| 2 | Find and view saved routes | 9 | UC-SR-01,03 |
| 3 | Search, filter, rename, delete routes | 11 | UC-SR-02,04 |
| 4 | Save favorite roads and reuse them | 10 | UC-PERS-01,02 |
| 5 | Mark avoid areas and verify routes skip them | 9 | UC-PERS-03 |
| 6 | See elevation profile before riding | 8 | UC-PERS-04 |
| 7 | Rate routes and add notes | 10 | UC-POST-01,02 |
| 8 | Track completed rides and view stats | 8 | UC-POST-03 |
| **Total** | | **74 tasks** | **14 UCs** |

---

## Recommended Order

**Phase A: Foundation (Epics 1-3)**
- Epic 1: Weather Planning - closes Phase 1 gaps
- Epic 2: Browse & View - replaces stub screen
- Epic 3: Search & Organize - completes route management

**Phase B: Personalization (Epics 4-6) - can parallelize**
- Epic 4: Favorite Roads
- Epic 5: Avoid Areas
- Epic 6: Elevation Profile

**Phase C: Post-Ride (Epics 7-8) - can parallelize**
- Epic 7: Rate & Notes
- Epic 8: Ride History

---

## Next Steps

```bash
# Generate full task files with acceptance criteria
/kb-project-plan .spec/prd/README.md

# Start with Epic 1
# Human test: "Can I see rain and temp info when planning a route?"
```
