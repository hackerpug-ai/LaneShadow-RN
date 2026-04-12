# Open Source US Roadway Datasets and Road Trip Data Sources

**Research Date:** 2026-04-12  
**Method:** Deep Research (4 iterations, 28 sources consulted)  
**Confidence:** HIGH  
**Source:** holocron article `fc22af62-614b-4b1f-abf1-c14ca4848279`

---

## Executive Summary

Comprehensive ecosystem of publicly available datasets for US roadways. Major national networks include OpenStreetMap via Geofabrik, US Census TIGER/Line shapefiles, FHWA's Highway Performance Monitoring System, and the Overture Maps Foundation dataset. For road trip recommendations, no single authoritative open dataset exists — recommend combining FHWA's 184 scenic byways, the 799-route US Scenic Byways GIS layer, Geotab's scored road trip ratings, and NPS/USFS recreation data.

---

## Primary Datasets

### Comprehensive Road Networks

| Dataset | Source | Records/Size | Format | License | Update Freq |
|---------|--------|-------------|--------|---------|-------------|
| **OpenStreetMap** | Geofabrik | ~11 GB US extract | PBF/Shapefile | ODbL 1.0 | Daily |
| **TIGER/Line Shapefiles** | US Census Bureau | Full US coverage | Shapefile | Public Domain | Annual |
| **FHWA HPMS** | FHWA | Traffic counts, pavement conditions | GeoJSON/GeoPackage | Public | Annual |
| **USGS National Transportation Dataset** | USGS | National coverage | File Geodatabase/Shapefile | Public | Periodic |
| **BTS North American Roads** | Bureau of Transportation Statistics | 720,055 records | — | Public Domain | — |
| **Overture Maps Transportation** | Overture Maps Foundation (Microsoft/Meta/TomTom) | 86 million km globally | GeoParquet | ODbL | December 2024 GA |
| **National Highway Planning Network** | FHWA | Major highway system | — | Public | — |

### Scenic Routes & Road Trip Data

| Dataset | Source | Coverage | Format | Notes |
|---------|--------|----------|--------|-------|
| **FHWA America's Byways** | FHWA | 184 designated routes + 37 All-American Roads | — | Federally designated |
| **US Scenic Byways GIS Layer** | Koordinates | 799 features | Shapefile/GeoJSON/KML/CSV | 2018 baseline for some layers |
| **Scenic America Byway Maps** | Scenic America | State-by-state | PDF | — |
| **Geotab Road Trip Ratings** | Geotab | 50 ranked routes | — | Top-rated: Monument Valley Trails (92.0) |

### Recreation & Supplementary Data

| Dataset | Source | Access | Notes |
|---------|--------|--------|-------|
| **National Park Service Open Data** | NPS | ArcGIS hub + API | Roads, trails, boundaries |
| **USDA Forest Service Enterprise Data** | USFS | Data.gov | Forest roads, trails, Motor Vehicle Use Maps |
| **BLM Recreation & Roads** | BLM | Data.gov | Motorized trails |

### Traffic & Safety

| Dataset | Source | Records | License | Notes |
|---------|--------|---------|---------|-------|
| **US Accidents Dataset** | Kaggle | 7.7M records (2016-2023) | CC BY-NC-SA 4.0 | 49 states |
| **FHWA Monthly Traffic Volume Trends** | FHWA | VMT by state | Public | — |
| **NGSIM/TGSIM Vehicle Trajectory Data** | FHWA | Detailed trajectory records | Public | — |
| **Freight Analysis Framework** | BTS/FHWA | State-to-state freight movement | Public | — |

---

## Open-Source Routing Engines

| Engine | Language | Strengths |
|--------|----------|-----------|
| **OSRM** | C++ | Fastest OSM routing |
| **Valhalla** | C++ | Turn-by-turn, flexible costing models |
| **GraphHopper** | Java | Custom profiles |
| **OpenRouteService** | Java | Isochrones, elevation, POI support |

---

## Recommendations for Route Discovery

1. **Base network**: Overture Maps or Geofabrik OSM
2. **Curated scenic routes**: 799-route US Scenic Byways layer
3. **Nationally vetted routes**: FHWA's 184 America's Byways
4. **Destination context**: NPS trails/roads
5. **Low-traffic corridor identification**: HPMS traffic data (AADT)
6. **Safety scoring**: Kaggle accidents dataset

---

## Identified Gaps

- No single curated "recommended road trips" open dataset
- State scenic byway designation freshness varies (2018 baseline for some layers)
- No bulk open-source real-time road closure data
- Elevation profile overlays needed (USGS 3DEP data for scenic route scoring)
