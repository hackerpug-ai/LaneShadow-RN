---
stability: FEATURE_SPEC
last_validated: 2026-04-06
prd_version: 1.0.0
functional_group: OL
---

# UC-OL: Offline Data Layer

---

## UC-OL-01: Compute offline route via Valhalla

**Description**: When the Rider requests a route while offline (or when on-device routing is preferred), the System computes the route using the Valhalla routing engine with locally stored OSM graph data. This replaces the Google Routes API call in the V1 cloud pipeline.

**Acceptance Criteria**:
- ☐ System can compute a motorcycle route between two points using the Valhalla native module
- ☐ System supports costing options: prefer scenic roads, avoid highways, avoid tolls, avoid unpaved
- ☐ System returns route geometry (GeoJSON), distance, duration, and turn-by-turn leg data
- ☐ System supports waypoints (intermediate stops) in route computation
- ☐ System returns results within 3 seconds for routes up to 200 miles
- ☐ System reports an error if the requested route falls outside the downloaded regional graph data
- ☐ Rider can see route polylines rendered on the map from Valhalla output (same visual as V1 cloud routes)

---

## UC-OL-02: Search for POIs via spatial database

**Description**: When the Rider queries for nearby points of interest (gas, food, viewpoints), the System queries the local Spatialite POI database using R-tree spatial indexing. No internet required.

**Acceptance Criteria**:
- ☐ System can execute radius queries ("within 20 miles of current position") against the Spatialite database
- ☐ System can execute along-route queries ("along my current route within 2 miles of the polyline")
- ☐ System returns POI name, category, distance, and direction relative to the rider's position/heading
- ☐ System supports POI categories: fuel, food (restaurant + cafe), lodging, viewpoint, camping, rest area
- ☐ System returns results within 100ms for regions with 500K+ POIs
- ☐ System reports "No results found within {radius}" if the query returns empty

---

## UC-OL-03: Query and report hazards

**Description**: The System maintains a local database of rider-reported road hazards. Riders can query for hazards ahead on their route, and new hazard reports are stored locally then synced to Convex when online.

**Acceptance Criteria**:
- ☐ System stores hazard reports locally with type, severity, GPS coordinates, timestamp, and auto-expiry time
- ☐ System can query hazards along the active route within a configurable buffer distance
- ☐ System assigns default expiry times by hazard type: debris (4 hours), construction (24 hours), pothole (7 days)
- ☐ System syncs unsynced hazard reports to Convex in the background when internet becomes available
- ☐ System downloads hazard reports from other riders via Convex reactive query when online
- ☐ System automatically removes expired hazard reports from the local database

---

## UC-OL-04: Query cached weather data

**Description**: The System caches weather data from the last online sync. During offline operation, weather queries return cached data with a "last updated" timestamp so the Rider knows how fresh the data is.

**Acceptance Criteria**:
- ☐ System caches Open-Meteo weather data (temperature, precipitation, wind) when online
- ☐ System can answer weather queries offline using cached data
- ☐ System includes "last updated" context in weather responses (e.g., "Clear ahead — data from 2 hours ago")
- ☐ System refreshes weather cache every 30 minutes when online
- ☐ System gracefully reports when cached weather is stale (>6 hours old): "Weather data may be outdated"

---

## UC-OL-05: Calculate fuel range

**Description**: The Rider asks "Can I make it to [destination]?" The System calculates fuel range using the bike's profile (tank size, consumption rate), remaining distance, and route elevation data. This is a deterministic calculation — the LLM only parses the question and formats the answer.

**Acceptance Criteria**:
- ☐ System calculates remaining range from bike profile: tank capacity, estimated consumption rate, current fuel level estimate
- ☐ System factors in elevation gain (climbing consumes more fuel) from route profile data
- ☐ System compares remaining range to distance-to-destination via current route
- ☐ System answers clearly: "Yes, 28 miles to Shell, you have 40 miles range" or "Might be tight — 35 miles to go, about 30 miles range"
- ☐ Rider can set bike profile (tank size, estimated mpg) in settings
- ☐ Rider can log fuel stops to help the system track remaining fuel

---

## UC-OL-06: Search saved routes with natural language

**Description**: The Rider searches their saved route library using natural language. The on-device LLM parses the search intent into structured filters, and the local saved routes database returns matching results.

**Acceptance Criteria**:
- ☐ Rider can search by description: "my coastal rides" --> filter by route tags/name containing "coastal"
- ☐ Rider can search by time: "rides from last fall" --> filter by date range Sep-Nov of previous year
- ☐ Rider can search by rating: "my favorite" or "five star" --> filter by rating >= 4
- ☐ Rider can combine filters: "favorite mountain rides from last year" --> rating + tags + date
- ☐ System returns matching saved routes sorted by relevance
- ☐ System works fully offline against locally cached saved route data
