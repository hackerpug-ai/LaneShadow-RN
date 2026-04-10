---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-10
prd_version: 1.0.0
---

# Roles

## User Roles

| Role | Description |
|------|-------------|
| **Adventure Rider** | Seeks remote, unpaved, challenging routes. Values: remoteness, gravel/dirt surfaces, scenic drama, low traffic. Rides: BDR routes, mountain passes, desert expanses. Pain point: Hard to find adventure-worthy routes without joining niche forums. |
| **Sport Rider** | Seeks technical, curvy roads. Values: curvature score, pavement quality, elevation changes, challenge level. Rides: Tail of the Dragon, Deals Gap, Blue Ridge Parkway. Pain point: Existing apps don't prioritize technical challenge; too many "scenic but straight" routes. |
| **Touring Rider** | Seeks scenic, relaxed routes for long-distance travel. Values: scenery quality, points of interest, road condition, amenities. Rides: Pacific Coast Highway, National Scenic Byways. Pain point: Hard to find multi-day scenic routes that avoid boring highways. |
| **Local Explorer** | Wants to discover great rides within 100 miles of home. Values: proximity, variety, time-efficient loops. Rides: Weekend day trips, after-work rides. Pain point: Already rode local favorites; needs fresh suggestions nearby. |
| **Administrator** | Internal role for managing curation pipeline. Values: data quality, scrape success rates, cost management, ToS compliance. Responsibilities: Run aggregation scripts, monitor pipeline health, calibrate scoring, review ToS compliance. |

## System Roles

| Role | Description |
|------|-------------|
| **Aggregation Pipeline** | Python script (local or GitHub Actions) that scrapes, extracts, enriches, and scores routes. Runs on-demand or scheduled. |
| **LLM Extractor** | Claude Haiku via API with Instructor for structured extraction from route descriptions. Cost: ~$34 for 17k routes. |
| **Geometric Enricher** | OSM curvature analysis via adamfranco/curvature, elevation via SRTM/Mapbox API. |
| **Scoring Engine** | Deterministic composite formula over extracted + geometric features. Calibrated against editorial ground truth. |
| **Archetype Classifier** | Decision tree or k-means clustering mapping features to ride archetypes. |
| **Discovery Service** | Local op-sqlite database serving route queries via SQL with bounding box, archetype, and scoring filters. |
| **Data Flywheel** | Convex backend collecting user interactions and auto-annotating routes for continuous improvement. |
