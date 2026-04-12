---
title: "Public Sources for Weather, Road Conditions & Traffic — Data Architecture for LaneShadow"
date: "2026-04-12"
category: "research"
tags: [weather, road-conditions, traffic, data-sources, API, data-modeling, curation-hardening]
status: "complete"
research_type: "deep_research"
iterations: 3
sources_consulted: 35
confidence: "HIGH"
method: "deep-research"
---

# Public Sources for Weather, Road Conditions & Traffic

## Executive Summary

Three distinct data domains — **weather**, **road conditions**, and **traffic** — each have mature public APIs and open datasets, but they are organized very differently: weather is grid-based (lat/lng → forecast), traffic is road-segment-based (road ID → speed/flow), and road conditions are event-based (incidents, closures, winter status). For LaneShadow's motorcycle route discovery, the best strategy is a **point-along-route sampling model** — sample weather/conditions at intervals along a route's polyline, then aggregate into per-route summary scores. This maps cleanly onto the existing `curated_routes` lean tier without requiring a separate spatial join layer.

---

## 1. WEATHER DATA SOURCES

### Tier 1: Free, Production-Ready

#### NWS/NOAA Weather API (api.weather.gov)
- **Cost:** Free, no API key required (User-Agent header only)
- **Coverage:** US only (all 50 states + territories)
- **Resolution:** 2.5km grid (one of the finest public grids available)
- **Data format:** JSON (GeoJSON for some endpoints)
- **Key endpoints:**
  - `GET /points/{lat},{lon}` → returns grid office + coordinates
  - `GET /gridpoints/{office}/{x},{y}/forecast/hourly` → hourly forecast (up to 156 hours)
  - `GET /gridpoints/{office}/{x},{y}` → raw gridpoint data (temperature, dewpoint, wind, precipitation probability, visibility, ice accumulation, snow, hazards, etc.)
  - `GET /alerts/active?point={lat},{lon}` → active weather alerts
- **Rate limit:** "Reasonable use" — no hard cap published, but 1 req/sec recommended
- **Segmentation:** Grid-based. You query a lat/lng point, get the grid cell it falls in, then retrieve forecast layers as time series. Each layer value has a `validTime` (ISO 8601 interval) and a numeric `value`.
- **Available layers (motorcycle-relevant):**
  - temperature, apparentTemperature (wind chill / heat index)
  - probabilityOfPrecipitation, quantitativePrecipitation
  - windSpeed, windGust, windDirection
  - visibility, skyCover
  - iceAccumulation, snowfallAmount
  - hazards (watches, warnings, advisories with P-VTEC codes)
- **Strengths:** Free, high-resolution, comprehensive, no key needed, GeoJSON
- **Weaknesses:** US-only, occasional 500 errors under load, no "along route" endpoint
- **Confidence:** HIGH (5+ sources)

#### Open-Meteo
- **Cost:** Free for non-commercial use, no API key required. Commercial: from $19/mo
- **Coverage:** Global
- **Resolution:** 1km (HRRR model for US), 11km (GFS global)
- **Data format:** JSON
- **Key endpoint:** `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,precipitation_probability,windspeed_10m,weathercode,...`
- **Rate limit:** 10,000 req/day free tier
- **Strengths:** Global coverage, open-source, extremely simple API, fast, multiple weather models
- **Weaknesses:** Commercial license required for production use, no alerts/warnings
- **Confidence:** HIGH (3+ sources)

### Tier 2: Paid, Feature-Rich

#### Google Weather API (weather.googleapis.com)
- **Cost:** Pay-per-use (Maps Platform billing). Pricing TBD as of Q2 2025 launch
- **Coverage:** Global
- **Resolution:** Point-based (returns forecast for exact lat/lng)
- **Data format:** JSON
- **Key endpoint:** `GET /v1/forecast/hours:lookup?location.latitude={lat}&location.longitude={lon}&hours={N}`
- **Response fields per hour:** weatherCondition (type + description + icon), temperature, feelsLikeTemperature, dewPoint, heatIndex, windChill, relativeHumidity, uvIndex, precipitation (probability + quantity + type), thunderstormProbability, airPressure, wind (direction + speed + gust), visibility, cloudCover, iceThickness
- **Strengths:** Already in LaneShadow's Maps Platform billing, rich structured response, up to 240 hours, AI-enhanced forecasts
- **Weaknesses:** New API (launched 2025), pricing not yet stable, requires API key
- **Confidence:** HIGH (3+ sources)

#### OpenWeatherMap Road Risk API
- **Cost:** Professional plan ($40/mo) for Road Risk API specifically
- **Coverage:** Global
- **Data format:** JSON
- **Key feature:** "Along route" weather — you POST an array of `{lat, lon, dt}` waypoints and get weather + national alerts for each point at the specified arrival time
- **Response per point:** temp, feels_like, wind_speed/gust/deg, precipitation, visibility, dew_point, weather alerts
- **Strengths:** Purpose-built for route weather, handles time-of-arrival forecasting, alerts included
- **Weaknesses:** Paid, $40/mo minimum for this endpoint
- **Confidence:** HIGH (4+ sources)

#### Xweather (formerly Vaisala)
- **Cost:** Flex subscription (pricing on request)
- **Coverage:** Global (strongest in US/EU)
- **Key endpoints:**
  - `roadweather/conditions` → Green/Yellow/Red road safety index
  - `roadweather` → road surface condition (dry, wet, slushy, snowy, icy)
  - `roadweather/analytics` → surface temperature, friction, water/snow/ice thickness
  - Compatible with Xweather `route` action for along-route queries
- **Strengths:** Purpose-built road weather, surface condition modeling, friction estimates, MapsGL visualization layers
- **Weaknesses:** Enterprise pricing, overkill for motorcycle route scoring
- **Confidence:** MEDIUM (2 sources)

### Weather Source Recommendation for LaneShadow

**Pipeline (offline scoring):** NWS API for historical/seasonal weather patterns per route centroid. Free, high-resolution, US-focused (matches LaneShadow's scope).

**Real-time (ride planning):** Google Weather API — already on Maps Platform billing, 240-hour forecast, rich structured data. Sample at route start, midpoint, end to show "weather along route."

**Fallback:** Open-Meteo for global expansion or if Google pricing is unfavorable.

---

## 2. ROAD CONDITIONS DATA SOURCES

Road conditions data is fundamentally **event-based** — closures, construction, winter conditions, incidents. It is NOT a continuous coverage layer like weather.

### 511 Traveler Information Systems (State-by-State)

- **Coverage:** ~40 states operate 511 systems, each independently
- **Data format:** JSON/XML/CSV/GeoJSON (varies by state)
- **Data model:** Events with location (lat/lng or road segment), type, severity, description
- **Event types:** road closures, construction, weather-related conditions, incidents, commercial vehicle restrictions
- **Access patterns:**
  - **REST APIs:** Many states offer REST APIs (Iowa, Wisconsin, New York, North Carolina, Minnesota)
  - **Data.gov:** Some states publish to Data.gov as downloadable datasets (Iowa `_511_Event_Extents`)
  - **ArcGIS Open Data:** Some states (Iowa, Minnesota) publish via ArcGIS
- **Examples:**
  - Wisconsin: `511wi.gov/developers/doc` — REST API for cameras, message signs, winter road conditions, events
  - New York: `511ny.org/developers/help` — REST API for traffic speeds, incidents, roadwork, cameras
  - Iowa: `data.iowa.gov` — JSON/CSV/XML of 511 events with line extents
  - North Carolina: `nc.prod.traveliq.co/developers/doc` — Snow & Ice, cameras, rest areas
  - San Francisco Bay Area: `511.org/open-data` — free with token
- **Standards:**
  - **Open511 Protocol** — standardized JSON exchange format for 511 events (v1.0 spec exists)
  - **TMDD** (Traffic Management Data Dictionary) — FHWA standard for event exchange
- **Strengths:** Free, authoritative (state DOT operated), covers closures/construction/winter conditions
- **Weaknesses:** Fragmented (40+ separate systems), inconsistent APIs, some require registration, no single national endpoint
- **Confidence:** HIGH (6+ sources)

### FHWA Real-Time Traveler Information Program
- **URL:** ops.fhwa.dot.gov/travelinfo
- **Coverage:** National coordination, but data is still state-level
- **Role:** Sets standards (TMDD, NTCIP) and provides guidance; does NOT operate a national API
- **Confidence:** HIGH (2 sources)

### National Weather Service Road Conditions Page
- **URL:** weather.gov/cys/unitedstatesroadconditions
- **Content:** Links to every state's road condition website/phone number
- **Format:** Directory only — no API
- **Confidence:** HIGH (1 source)

### Road Conditions Recommendation for LaneShadow

**For curation pipeline (offline):** Not directly useful. Road conditions are real-time events, not static attributes. The pipeline should focus on *seasonal accessibility* (which months a road is typically open) rather than real-time conditions.

**For ride planning (real-time):** State 511 APIs are the authoritative source. Build a state-aware adapter that queries the relevant 511 system along a planned route. Priority states: top motorcycle riding states (CA, CO, NC, TN, VA, UT, WV, OR, WY, MT).

**For the scoring model:** Use *seasonal closure patterns* as a static attribute. USFS MVUM data already includes seasonal closure dates. Mountain pass closure data is available from state DOTs (e.g., CDOT, WSDOT publish pass status pages with historical open/close dates).

---

## 3. TRAFFIC DATA SOURCES

### Tier 1: Free/Public Static Data (AADT)

#### FHWA Highway Performance Monitoring System (HPMS)
- **Cost:** Free, public domain
- **Coverage:** ALL public roads in US
- **Data:** AADT (Annual Average Daily Traffic), lane counts, surface type, speed limits, pavement condition (IRI), functional classification
- **Format:** GeoJSON, GeoPackage, Shapefile (2024 data available)
- **Download:** data.transportation.gov HPMS portal
- **Segmentation:** Road segments with geometry (polylines). Each segment has attributes including AADT
- **Schema (key fields):**
  - `route_id` — road segment identifier
  - `begin_point` / `end_point` — linear reference
  - `aadt` — Annual Average Daily Traffic count
  - `aadt_single_unit` — single-unit truck AADT
  - `aadt_combination` — combination truck AADT
  - `speed_limit`
  - `number_of_lanes`
  - `surface_type`
  - `iri` (International Roughness Index — pavement condition)
  - Geometry: polyline in WGS84
- **Strengths:** Comprehensive, covers every public road, free, includes pavement condition
- **Weaknesses:** Annual updates only, AADT is an average (no time-of-day granularity), some rural roads have estimated rather than measured counts
- **Confidence:** HIGH (6+ sources)

#### State DOT Traffic Count Portals
- **Examples:**
  - Maryland: `data.imap.maryland.gov` — AADT as ArcGIS layers
  - California: `dot.ca.gov/programs/research-innovation-system-information/highway-performance-monitoring-system`
  - District of Columbia: `catalog.data.gov/dataset/2024-traffic-volume`
- **Format:** Varies (ArcGIS, Shapefile, CSV, API)
- **Strengths:** Sometimes more current than federal HPMS, may include time-of-day patterns
- **Weaknesses:** Per-state collection effort, inconsistent formats
- **Confidence:** HIGH (4+ sources)

#### FHWA Monthly Traffic Volume Trends
- **URL:** fhwa.dot.gov/policyinformation/travel_monitoring/tvt.cfm
- **Data:** Monthly VMT (Vehicle Miles Traveled) by state, rural vs urban
- **Use for LaneShadow:** Seasonal traffic patterns (which months have lowest traffic on rural roads)
- **Confidence:** HIGH (2 sources)

### Tier 2: Real-Time Traffic (Paid APIs)

#### TomTom Traffic API
- **Cost:** 2,500 free daily requests; Pay-as-you-grow beyond
- **Coverage:** Global
- **Key endpoint:** Flow Segment Data — `GET /traffic/services/{version}/flowSegmentData/{style}/{zoom}/{format}?point={lat},{lon}`
- **Response:** `currentSpeed`, `freeFlowSpeed`, `currentTravelTime`, `freeFlowTravelTime`, `confidence`, `roadClosure` boolean, `frc` (Functional Road Class 0-6), road coordinates
- **Segmentation:** Point-based query → returns nearest road segment with speeds
- **Strengths:** 2,500 free/day is generous for development, global, includes road closure detection, OpenLR encoding
- **Weaknesses:** Paid at scale, real-time only (no historical/typical patterns on free tier)
- **Confidence:** HIGH (5+ sources)

#### Mapbox Traffic Data
- **Cost:** Part of Mapbox pricing (already used by LaneShadow for maps)
- **Coverage:** Global (700M+ monthly active users as data source)
- **Data types:**
  - **Live speeds:** Directly observed in last 15 minutes
  - **Typical speeds:** Expected traffic by time-of-week
- **Access:** Via `driving-traffic` profile in Directions API, or raw via Traffic Data product
- **Tilesets:** `mapbox-traffic-v1` vector tileset for map visualization (congestion levels: low/moderate/heavy/severe)
- **Strengths:** Already in LaneShadow's stack, powers traffic-aware routing, 300M+ miles/day of data
- **Weaknesses:** Raw Traffic Data product may require enterprise agreement, tileset is visualization-only (not raw speeds)
- **Confidence:** HIGH (4+ sources)

#### HERE Traffic
- **Cost:** Freemium (250K free transactions/month)
- **Data:** Real-time speeds, incidents, historical speed patterns
- **Strengths:** Strong historical data, speed analytics
- **Weaknesses:** Separate integration from existing Mapbox stack
- **Confidence:** MEDIUM (3 sources)

### Traffic Data Recommendation for LaneShadow

**For curation pipeline (static scoring):** HPMS AADT data is the clear winner. Free, comprehensive, covers every US public road, and AADT maps directly to the existing `trafficScore` field. The curation-hardening PRD already identified this need (traffic weight at 10%).

**For ride planning (real-time):** Mapbox Traffic Data — already in the stack. Use `driving-traffic` profile for ETA calculation. TomTom's 2,500 free/day is a good development fallback.

**For visualization:** Mapbox Traffic v1 tileset — already compatible with @rnmapbox/maps.

---

## 4. DATA ORGANIZATION & SEGMENTATION PATTERNS

### How Each Domain Segments Data

| Domain | Primary Key | Spatial Unit | Temporal Unit | Update Cadence |
|--------|------------|--------------|---------------|----------------|
| **Weather** | Grid cell (lat/lng → 2.5km grid) | Point → grid interpolation | Hourly forecast intervals | Hourly |
| **Road Conditions** | Event ID | Point or line extent on road | Event duration (start → end) | Real-time (minutes) |
| **Traffic (Static)** | Road segment ID (HPMS) | Polyline segment | Annual average | Annual |
| **Traffic (Real-time)** | Road segment ID | Point → nearest segment | 15-minute windows | Every 15 min |

### Key Insight: Spatial Join Problem

LaneShadow's atomic unit is the **ride segment** (5-50 miles). Weather, conditions, and traffic data are organized by different spatial units:

- Weather: **grid cells** (2.5km squares)
- Traffic: **road segments** (variable length polylines with HPMS IDs)
- Conditions: **events** (point or line on road network)

To map these onto ride segments, you need a **spatial aggregation strategy**.

---

## 5. DATA MODELING RECOMMENDATIONS

### Strategy: Point-Along-Route Sampling

Rather than building complex spatial joins, sample external data at **N evenly-spaced points along the route polyline** and aggregate:

```
Route polyline (5-50 miles)
    │
    ├── Sample point 1 (start)
    │   ├── Weather: query NWS/Google at (lat1, lng1)
    │   ├── Traffic: AADT from nearest HPMS segment
    │   └── Conditions: 511 events within 5mi radius
    │
    ├── Sample point 2 (1/4 mark)
    │   └── ... same queries ...
    │
    ├── Sample point 3 (midpoint)
    │   └── ... same queries ...
    │
    ├── Sample point 4 (3/4 mark)
    │   └── ... same queries ...
    │
    └── Sample point 5 (end)
        └── ... same queries ...
```

**Aggregation rules:**
- **Weather:** worst-case across points (e.g., max precip probability, min visibility)
- **Traffic (AADT):** weighted average across segments, with min (quietest stretch) for the `trafficScore`
- **Conditions:** union of all active events within buffer

### Schema Extensions for `curated_routes` (Lean Tier)

These fields fit naturally into the existing schema and are computed at pipeline time:

```typescript
// --- Traffic (static, from HPMS AADT) ---
aadtMedian: number | null,          // median AADT across sampled segments
aadtMax: number | null,             // highest AADT segment (congestion hotspot)
trafficScore: number,               // EXISTING field — recompute from AADT (inverted: 1.0 = low traffic)

// --- Seasonal Weather (from NWS historical / climate normals) ---
seasonalRainDays: number | null,    // avg rain days/month in peak riding season
seasonalTempHighF: number | null,   // avg high temp in peak season
seasonalWindMph: number | null,     // avg wind speed
weatherSuitability: number | null,  // 0.0-1.0 composite (dry + warm + calm = 1.0)

// --- Road Surface (from HPMS IRI + OSM tags) ---
pavementCondition: number | null,   // from HPMS IRI (International Roughness Index), normalized 0-1
surfaceType: string | null,         // from OSM surface tags: "paved" | "gravel" | "dirt" | "mixed"
```

### Schema Extensions for `curated_route_enrichments` (Rich Tier)

These are fetched on-demand for the detail view:

```typescript
// --- Detailed Weather Context ---
weatherSummary: string | null,       // "Hot, dry summers. Winter snow possible above 6000ft."
bestMonths: string[] | null,         // ["May", "Jun", "Sep", "Oct"]
weatherHazards: string[] | null,     // ["Flash floods Jul-Aug", "Ice Nov-Mar above 5000ft"]

// --- Traffic Detail ---
trafficNotes: string | null,         // "Low traffic except summer weekends near trailhead"
peakAvoidance: string | null,        // "Avoid Saturday mornings Jun-Aug"

// --- Road Condition Detail ---
pavementNotes: string | null,        // "Freshly repaved 2024. Some gravel on shoulders."
closureHistory: string | null,       // "Typically closed Nov 15 - May 1"
lastKnownStatus: string | null,      // "Open as of April 2026"

// --- Sample Points (for along-route weather queries) ---
samplePoints: Array<{               // 3-5 points along route for weather queries
  lat: number,
  lng: number,
  mileMarker: number,
  label: string,                     // "Start - Gatlinburg", "Midpoint - Deals Gap"
}> | null,
```

### Pipeline Integration

#### Static Pipeline (curation-hardening scope)

1. **HPMS AADT Integration** — Download HPMS GeoJSON for target states → spatial join AADT to route polylines via nearest-segment matching → compute `trafficScore` from AADT percentile rank (low AADT = high score)
2. **Pavement Condition (IRI)** — From same HPMS dataset → normalize IRI to 0-1 `pavementCondition`
3. **Seasonal Weather** — Query NWS Climate Normals (free dataset from NCEI) or PRISM climate data for route centroid → compute `weatherSuitability` from monthly precip/temp/wind averages
4. **Seasonal Closure** — From USFS MVUM (already in curation-hardening scope) + mountain pass databases → set `season` field and `closureHistory`

#### Real-Time Layer (future initiative, NOT curation-hardening scope)

1. **Along-Route Weather** — At ride-planning time, sample Google Weather API at `samplePoints` → show hour-by-hour weather overlay on route
2. **Active Conditions** — Query relevant state 511 API along route → show closures/construction on map
3. **Live Traffic** — Use Mapbox `driving-traffic` profile → show congestion on route

### Scoring Formula Impact

The curation-hardening PRD already defines the weight distribution. The new data sources map directly:

| Score Component | Weight | Current Source | New/Improved Source |
|----------------|--------|---------------|-------------------|
| curviness | 20% | OSM curvature | No change |
| scenery | 15% | Haiku extraction | No change |
| **traffic** | **10%** | **Haiku extraction (text-based)** | **HPMS AADT (measured data)** |
| **road_condition** | **10%** | **Haiku extraction (text-based)** | **HPMS IRI (measured data) + OSM surface tags** |
| elevation_drama | 10% | SRTM/Mapbox | No change |
| fhwa_designation | 5% | FHWA dataset | No change |
| community_rating | 15% | Scraped ratings | No change |
| mention_frequency | 10% | NLP extraction | No change |
| remoteness | 5% | Computed | No change |

**Key improvement:** `traffic` and `road_condition` move from LLM-extracted text signals (Haiku reading blog descriptions) to **measured data** (HPMS instrument readings). This is a significant quality upgrade — objective telemetry vs. subjective prose.

---

## 6. IMPLEMENTATION PRIORITY

### P1 — Add to Curation-Hardening (Low Effort, High Impact)

1. **HPMS AADT → trafficScore** — Download HPMS GeoJSON (free), spatial join to routes, replace text-based traffic scoring with measured AADT. Effort: ~2 days. Impact: Objective traffic data for every scored route.

2. **HPMS IRI → pavementCondition** — Same dataset, different field. Normalize IRI to road_condition score. Effort: ~0.5 days (piggybacks on AADT work). Impact: Objective road surface quality.

3. **NCEI Climate Normals → weatherSuitability** — Download climate normals for US (free NOAA dataset), compute monthly riding suitability per route centroid. Effort: ~1 day. Impact: Seasonal recommendations, `bestMonths` field.

### P2 — Future Initiative (Ride Planning Weather)

4. **Google Weather API → along-route forecast** — At ride-planning time, sample hourly forecast at route sample points. Show weather overlay. Effort: ~3 days. Impact: Core differentiator (see weather-differentiator research).

5. **State 511 API → route conditions** — Build adapters for top 10 motorcycle states. Show closures/construction on planned route. Effort: ~1 week. Impact: Safety feature, trust signal.

### P3 — Nice to Have

6. **Mapbox Traffic Tiles → live congestion on discovery map** — Already available in the stack. Toggle layer. Effort: ~0.5 days. Impact: Visual polish.

7. **TomTom Flow Segment → real-time traffic scoring** — Upgrade static AADT with live speeds during ride planning. Effort: ~2 days. Impact: Marginal (motorcyclists often ride off-peak).

---

## Confidence Assessment

| Finding | Confidence | Sources |
|---------|------------|---------|
| NWS API is best free weather source for US | HIGH | 5+ |
| HPMS AADT is best free traffic data for static scoring | HIGH | 6+ |
| 511 systems are fragmented per-state | HIGH | 6+ |
| Google Weather API best for real-time along-route | HIGH | 3+ |
| Point-along-route sampling is viable aggregation strategy | HIGH | 4+ (proven by OpenWeatherMap Road Risk, Drive Weather, Weather On The Way) |
| Mapbox Traffic already in stack | HIGH | 4+ |
| HPMS IRI usable for road surface scoring | MEDIUM | 3 |
| Xweather road weather is production-grade but expensive | MEDIUM | 2 |

## Sources

[1] NWS API Documentation — https://www.weather.gov/documentation/services-web-api
[2] NWS API General FAQs — https://weather-gov.github.io/api/general-faqs
[3] NWS Gridpoint FAQ — https://weather-gov.github.io/api/gridpoints
[4] Open-Meteo — https://open-meteo.com/
[5] Google Weather API Hourly Forecast — https://developers.google.com/maps/documentation/weather/hourly-forecast
[6] OpenWeatherMap Road Risk API — https://openweathermap.org/api/road-risk
[7] Xweather Road Weather API — https://www.xweather.com/blog/vaisala-xweather-cutting-edge-road-weather-api
[8] FHWA HPMS Data Access — https://data.transportation.gov/stories/s/Data-Access-for-Highway-Performance-Monitoring-Sys/3uu4-47sa
[9] FHWA HPMS Shapefiles — https://www.fhwa.dot.gov/policyinformation/hpms/shapefiles.cfm
[10] FHWA Traffic Volume Trends — https://www.fhwa.dot.gov/policyinformation/travel_monitoring/tvt.cfm
[11] Iowa 511 Event Extents (Data.gov) — https://catalog.data.gov/dataset/-511-event-extents-6f436
[12] Wisconsin 511 API — http://511wi.gov/developers/doc
[13] New York 511 API — http://511ny.org/developers/help
[14] North Carolina DriveNC API — http://nc.prod.traveliq.co/developers/doc
[15] 511 Open Data (SF Bay) — https://511.org/open-data
[16] Open511 Data Exchange Spec — https://511.org/sites/default/files/pdfs/Open_511_Data_Exchange_Specification_v1.0_Overview.pdf
[17] TomTom Traffic Flow Segment Data — https://developer.tomtom.com/traffic-api/documentation/tomtom-maps/traffic-flow/flow-segment-data
[18] TomTom Pricing — https://developer.tomtom.com/pricing
[19] Mapbox Traffic Data Guide — https://docs.mapbox.com/data/traffic/guides
[20] Mapbox Traffic v1 Tileset — https://docs.mapbox.com/data/tilesets/reference/mapbox-traffic-v1
[21] Maryland AADT Open Data — https://data.imap.maryland.gov
[22] Meteomatics Weather API Comparison — https://www.meteomatics.com/en/weather-api/best-weather-apis
[23] StormGlass Weather API Comparison — https://stormglass.io/best-weather-api-2025
[24] FHWA Real-Time Traveler Information — https://ops.fhwa.dot.gov/travelinfo/about/aboutus.htm
[25] NWS Road Conditions Directory — https://www.weather.gov/cys/unitedstatesroadconditions
[26] Google Maps Platform Weather — https://mapsplatform.google.com/maps-products/weather
[27] Drive Weather App — https://driveweatherapp.com/
[28] Weather On The Way App — https://weatherontheway.app/
[29] HPMS Overview (FHWA) — https://www.fhwa.dot.gov/policyinformation/hpms.cfm
[30] BTS North American Roads — https://geodata.bts.gov/datasets/usdot::north-american-roads/about
[31] HPMS ArcGIS Living Atlas — https://www.esri.com/arcgis-blog/products/arcgis-living-atlas/transportation/highway-performance-monitoring-system-layer-now-available-in-arcgis-living-atlas
[32] Reddit: TomTom free API — https://www.reddit.com/r/selfhosted/comments/1bzkmzg/
[33] Reddit: Best weather source — https://www.reddit.com/r/weather/comments/16xz3qm/
[34] Data.gov FHWA datasets — https://catalog.data.gov/dataset?publisher=Federal%20Highway%20Administration
[35] Holocron: LaneShadow prior research — Weather Differentiator Deep Dive, US Roadway Datasets, Motorcycle Ride Sources

## Gaps & Open Questions

- **Google Weather API pricing** — New product (2025), pricing may change. Need to confirm per-call cost at LaneShadow's expected volume (~1000 route-weather lookups/day at scale).
- **HPMS spatial join accuracy** — HPMS segments may not perfectly align with curated route polylines. Need to validate the nearest-segment matching produces reasonable AADT values, especially for rural secondary roads.
- **511 API coverage map** — No comprehensive list of which states have REST APIs vs. only websites. Need to survey the top 10 motorcycle states individually.
- **Climate Normals granularity** — NCEI Climate Normals are station-based. For routes far from weather stations, interpolation quality may vary.
- **Mountain pass closure dates** — No single national dataset. CDOT (Colorado), WSDOT (Washington), and a few others publish structured data; most states only have web pages. May need manual curation for initial set.
