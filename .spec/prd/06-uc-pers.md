---
stability: FEATURE_SPEC
last_validated: 2026-03-04
prd_version: 1.0.0
functional_group: PERS
---

# Use Cases: Personalization (PERS)

Enable riders to customize route generation with preferences and favorites.

| ID | Title | Description |
|----|-------|-------------|
| UC-PERS-01 | Favorite Roads Library | Save and browse favorite road segments |
| UC-PERS-02 | Include Favorites in Routes | Influence route generation with favorite roads |
| UC-PERS-03 | Avoid Areas | Mark areas or roads to avoid in route planning |
| UC-PERS-04 | Elevation Profile | Visualize elevation changes along routes |

---

## UC-PERS-01: Favorite Roads Library

**Description**: Allow riders to save road segments they love and browse them in a dedicated library.

**New Infrastructure Needed**:
- `favorite_roads` table in Convex schema
- `convex/db/favoriteRoads.ts` - CRUD operations
- `components/favorites/favorite-road-card.tsx` - display component
- Settings tab section for favorites

**Acceptance Criteria**:
- [ ] Rider can save a road segment as a favorite from a completed route
- [ ] Rider can view all favorite roads in Settings > Favorite Roads
- [ ] Rider can see road name, location, and mini map preview for each favorite
- [ ] Rider can remove a road from favorites
- [ ] System stores road segment geometry for route inclusion

---

## UC-PERS-02: Include Favorites in Routes

**Description**: When planning a route, riders can request that favorite roads be included if geographically feasible.

**Acceptance Criteria**:
- [ ] Rider can toggle "Include favorite roads" preference in planning sheet
- [ ] System passes favorite roads to LLM route sketcher as preferred segments
- [ ] Rider can see which favorites were included in generated route
- [ ] System indicates when a favorite couldn't be included (too far from route)
- [ ] Rider can prioritize specific favorites over others

---

## UC-PERS-03: Avoid Areas

**Description**: Allow riders to mark areas or specific roads they want to avoid in route planning.

**New Infrastructure Needed**:
- `avoid_areas` table in Convex schema
- `convex/db/avoidAreas.ts` - CRUD operations
- Map-based area selection UI

**Acceptance Criteria**:
- [ ] Rider can draw an avoid area on the map (polygon or radius)
- [ ] Rider can name and save avoid areas
- [ ] Rider can toggle avoid areas on/off per planning session
- [ ] System excludes avoid areas from route generation
- [ ] Rider can see avoid areas displayed on planning map

---

## UC-PERS-04: Elevation Profile

**Description**: Display elevation changes along a route to help riders anticipate terrain.

**New Infrastructure Needed**:
- Elevation data fetching (Google Elevation API or similar)
- `components/planning/elevation-profile.tsx` - chart component

**Acceptance Criteria**:
- [ ] Rider can view an elevation profile chart for each route option
- [ ] Rider can see total elevation gain/loss in route summary
- [ ] Rider can see elevation profile in saved route detail view
- [ ] System highlights significant climbs or descents
- [ ] Rider can tap on elevation chart to see corresponding map location
