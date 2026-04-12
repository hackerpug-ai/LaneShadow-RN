# Open Source US Roadway Datasets and Road Trip Data Sources

> Deep research conducted 2026-04-12 | Holocron ID: `js7017h2wbyy6gtxrdmnvb03js84pvrc`
> Confidence: HIGH | 4 iterations | 18 sources consulted

## Executive Summary

There is a rich ecosystem of open-source and public-domain datasets covering US roadways, ranging from comprehensive national road networks (TIGER/Line, HPMS, OpenStreetMap, Overture Maps) down to specialized scenic byway and recreation route datasets (FHWA America's Byways, NPS trails/roads, USDA Forest Service). For road trip recommendations specifically, no single authoritative open dataset exists, but the combination of FHWA's 184 designated scenic byways (with GIS data), the Koordinates US Scenic Byways layer (799 routes), Geotab's scored road trip ratings, NPS trail/road data, and OpenStreetMap's tagged scenic routes provides a strong foundation for building road trip recommendation features.

---

## 1. Comprehensive National Road Network Datasets

### OpenStreetMap (OSM) via Geofabrik
- **Size**: ~11 GB full US extract (PBF), per-state shapefiles available
- **Content**: Road classification, speed limits, surface type, one-way info, bus stops, traffic lights, stop signs
- **Updates**: Daily
- **History**: All US roads originally seeded from TIGER data in 2008, continuously improved by community
- **Download**: https://download.geofabrik.de/north-america/us.html
- **License**: ODbL 1.0 (open, share-alike)
- **Format**: PBF, Shapefile per state

### US Census TIGER/Line Shapefiles
- **Content**: Official US road geometry — primary, secondary, and local roads nationally
- **Updates**: Annual
- **Note**: Foundational dataset that seeded OSM, Waze, and MapQuest. Also provides geocoding via US Census Geocoder.
- **Download**: https://catalog.data.gov/dataset/tiger-line-shapefile-2023-nation-u-s-primary-roads
- **License**: Public domain
- **Format**: Shapefile

### FHWA Highway Performance Monitoring System (HPMS)
- **Content**: The most detailed federal dataset — extent, condition, performance, traffic counts (AADT), lane counts, surface type, speed limits, pavement condition (IRI). Covers ALL public roads.
- **Updates**: Annual (2024 data available)
- **Filtered views**: Interstate, NHS, Federal-Aid, Arterials, Collectors, Local Roads, Ramps
- **Download**: https://data.transportation.gov/stories/s/Data-Access-for-Highway-Performance-Monitoring-Sys/3uu4-47sa
- **License**: Public domain
- **Format**: GeoJSON, GeoPackage, CSV

### Overture Maps Foundation Transportation Dataset
- **Size**: 86 million km of roads worldwide (substantial US coverage)
- **Content**: Normalized attributes from OSM + unique GERS identifiers for attaching external data (accidents, closures, traffic). Backed by Microsoft, Meta, TomTom, Amazon.
- **Released**: GA December 2024
- **Download**: https://overturemaps.org/ (via AWS Open Data, Azure, GCP)
- **License**: ODbL + CDLA Permissive 2.0
- **Format**: GeoParquet

### USGS National Transportation Dataset (NTD)
- **Content**: Roads, railroads, trails, airports. Part of The National Map. Based on TIGER/Line supplemented with additional sources.
- **Download**: https://data.usgs.gov/datacatalog/data/USGS:ad3d631d-f51f-4b6a-91a3-e617d6a58b4e
- **License**: Public domain
- **Format**: File Geodatabase, Shapefile

### BTS North American Roads (NTAD)
- **Size**: 720,055 road records
- **Content**: US, Canada, and Mexico. Consistent definitions for road class, jurisdiction, lane counts, speed limits, surface type.
- **Download**: https://geodata.bts.gov/datasets/usdot::north-american-roads/about
- **License**: Public domain
- **Format**: GeoJSON, Shapefile, API

### National Highway Planning Network (NHPN)
- **Content**: Nation's major highway system — Rural Arterials, Urban Principal Arterials, all NHS routes
- **Download**: https://data-usdot.opendata.arcgis.com/datasets/usdot::national-highway-planning-network/about
- **License**: Public domain

---

## 2. Scenic Routes & Road Trip Recommendation Data

### FHWA America's Byways
- **Content**: 184 nationally designated scenic byways + 37 All-American Roads
- **Designation criteria**: Scenic, natural, historic, recreational, archaeological, or cultural qualities
- **Info**: https://www.fhwa.dot.gov/byways
- **GIS Data**: Available through HEPGIS hub: https://hepgis-usdot.hub.arcgis.com/datasets/scenic-byways-and-federal-lands-map

### US Scenic Byways GIS Layer (Koordinates / NPS)
- **Size**: 799 line features
- **Attributes**: Byway name, state, designation type (national/state/tribal/USFS/BLM/NPS), byway ID
- **Source**: NPS ArcGIS MapServer
- **Download**: https://koordinates.com/layer/38757-us-scenic-byways
- **Export formats**: Shapefile, GeoJSON, KML, CSV
- **License**: Public domain (NPS source)
- **Note**: Represents ~1,300 state-designated + 184 national scenic byways

### Scenic America Byway Maps
- **Content**: The only comprehensive nationwide scenic byways database. Maps by state showing All-American Roads, national, state, tribal, and federal agency byways.
- **Format**: Downloadable PDFs per state
- **Browse**: https://www.scenic.org/byway-maps-by-state

### Geotab Road Trip Ratings
- **Content**: 50 classic US road trips scored using TripAdvisor ratings (attractions, accommodation, food), AADT traffic data, and nationwide survey
- **Data points**: Route name, duration (days), category, attraction/accommodation/food ratings, traffic (AADT), composite score
- **Top routes**: Monument Valley Trails (92.0), Yellowstone & Tetons (90.6), Mesa Verde (89.9), Along the Missouri River (88.3), Blue Ridge Parkway (88.0)
- **Browse**: https://www.geotab.com/road-trip-ratings
- **Note**: Not a downloadable dataset but structured data on-page

---

## 3. Supplementary Recreation & Trail Datasets

### National Park Service Open Data
- **Content**: Roads, trails, boundaries, buildings across all national parks
- **Download**: https://public-nps.opendata.arcgis.com/
- **API**: https://developer.nps.gov/api/v1/

### USDA Forest Service Enterprise Data
- **Content**: Forest roads, trails, recreation sites, Wild & Scenic Rivers, Motor Vehicle Use Maps, National Forest Scenic Byways
- **Download**: https://data.fs.usda.gov/geodata/edw/datasets.php?dsetCategory=transportation
- **Format**: Shapefile, File Geodatabase

### BLM Recreation & Roads
- **Content**: Public motorized trails and roads on Bureau of Land Management land
- **Access**: Via Data.gov catalog

---

## 4. Traffic & Safety Datasets

### US Accidents Dataset (Kaggle)
- **Size**: ~7.7 million accident records (2016-2023)
- **Coverage**: 49 states
- **Content**: Location, severity, weather conditions, road features, time of occurrence
- **Use case**: Safety scoring for route segments, identifying dangerous stretches to avoid
- **Download**: https://www.kaggle.com/datasets/sobhanmoosavi/us-accidents
- **License**: CC BY-NC-SA 4.0

### FHWA Monthly Traffic Volume Trends
- **Content**: Monthly VMT data by state for all roadways
- **Use case**: Identifying low-traffic scenic periods for road trips
- **Download**: https://catalog.data.gov/dataset?publisher=Federal%20Highway%20Administration

### NGSIM/TGSIM Vehicle Trajectory Data
- **Content**: Detailed vehicle trajectory data (position, speed, acceleration) for specific road segments
- **Use case**: Research-grade driving behavior analysis
- **Download**: Data.gov FHWA datasets

### Freight Analysis Framework (FAF)
- **Content**: Freight movement data between states and major metro areas
- **Use case**: Identifying truck-heavy corridors to avoid on leisure trips
- **Download**: Data.gov FHWA datasets

---

## 5. Open Source Routing Engines

These engines consume the datasets above to provide actual route computation:

| Engine | Language | Best for |
|--------|----------|----------|
| **OSRM** | C++ | Fastest routing on OSM data |
| **Valhalla** | C++ | Turn-by-turn with flexible costing models |
| **GraphHopper** | Java | Custom vehicle profiles, elevation |
| **OpenRouteService** | Java | Rich API: isochrones, elevation, POI |

---

## 6. Recommendations for LaneShadow

For building route discovery / road trip recommendation features, the most actionable stack:

1. **US Scenic Byways GIS layer** (799 pre-curated scenic routes with metadata) — ready-made "recommended drives"
2. **HPMS traffic data (AADT)** — score routes by traffic level (low traffic = better scenic drive)
3. **NPS/USFS recreation data** — destination POIs and park roads
4. **Overture Maps or OSM** — base routing network for custom route computation
5. **US Accidents data** — safety scoring per route segment
6. **Geotab ratings** — reference data for top 50 road trips with composite scores

The scenic byways dataset from NPS/Koordinates is the most directly useful starting point — 799 routes already designated as scenic, historic, or recreational with GIS geometries ready to import.

---

## Confidence Assessment

| Finding | Confidence | Sources |
|---------|------------|---------|
| OSM/Geofabrik US roads | HIGH | 5+ |
| TIGER/Line road network | HIGH | 4+ |
| HPMS road inventory | HIGH | 6+ |
| Overture Maps transportation | HIGH | 4+ |
| US Scenic Byways GIS | HIGH | 3+ |
| NPS/USFS recreation data | HIGH | 3+ |
| Geotab road trip ratings | MEDIUM | 1 |
| Kaggle US Accidents | HIGH | 5+ |

## Gaps & Open Questions

- No single "recommended road trips" open dataset exists with curated routes + ratings — this would need to be assembled from scenic byways + POI data + user ratings
- Scenic byways GIS data from Koordinates dates to 2018; freshness of state-level designations varies
- Real-time road conditions/closures are not available as bulk open data (APIs only, from state DOTs)
- Elevation profile data along routes (useful for "scenic drive" scoring) would need DEM data overlay (USGS 3DEP)
- Weather/seasonal data for route recommendations would need NOAA integration

## Sources

1. Geofabrik US Downloads - https://download.geofabrik.de/north-america/us.html
2. TIGER/Line 2023 Primary Roads - https://catalog.data.gov/dataset/tiger-line-shapefile-2023-nation-u-s-primary-roads
3. HPMS Data Access - https://data.transportation.gov/stories/s/Data-Access-for-Highway-Performance-Monitoring-Sys/3uu4-47sa
4. USGS NTD - https://data.usgs.gov/datacatalog/data/USGS:ad3d631d-f51f-4b6a-91a3-e617d6a58b4e
5. BTS North American Roads - https://geodata.bts.gov/datasets/usdot::north-american-roads/about
6. Overture Maps Transportation GA - https://overturemaps.org/announcements/2024/overture-general-availability-of-transportation-dataset
7. GIS Geography Roads List - https://gisgeography.com/highways-roads-gis-data
8. FHWA America's Byways - https://www.fhwa.dot.gov/byways
9. Scenic America Byway Maps - https://www.scenic.org/byway-maps-by-state
10. Koordinates US Scenic Byways - https://koordinates.com/layer/38757-us-scenic-byways
11. Geotab Road Trip Ratings - https://www.geotab.com/road-trip-ratings
12. NPS GIS Tools & Data - https://www.nps.gov/subjects/gisandmapping/tools-and-data.htm
13. USDA Forest Service Transportation - https://data.fs.usda.gov/geodata/edw/datasets.php?dsetCategory=transportation
14. US Accidents Kaggle - https://www.kaggle.com/datasets/sobhanmoosavi/us-accidents
15. Data.gov FHWA Datasets - https://catalog.data.gov/dataset?publisher=Federal%20Highway%20Administration
16. NHPN - https://data-usdot.opendata.arcgis.com/datasets/usdot::national-highway-planning-network/about
17. Overture Maps Docs - https://docs.overturemaps.org/guides/transportation
18. NPS Open Data Hub - https://public-nps.opendata.arcgis.com/
