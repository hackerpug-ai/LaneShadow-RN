# Team Contributions

## Phase 1: User Personas (ui-designer + product-manager)

**Contributors:** ui-designer, product-manager

### User Personas Identified

1. **Adventure Rider** — Seeks remote, unpaved, challenging routes. Values remoteness, gravel surfaces, scenic drama. Pain point: Hard to find adventure-worthy routes without niche forums.

2. **Sport Rider** — Seeks technical, curvy roads. Values curvature score, pavement quality, elevation changes. Pain point: Existing apps don't prioritize technical challenge.

3. **Touring Rider** — Seeks scenic, relaxed routes for long-distance travel. Values scenery quality, points of interest, road condition. Pain point: Hard to find multi-day scenic routes avoiding boring highways.

4. **Local Explorer** — Wants to discover great rides within 100 miles of home. Values proximity, variety, time efficiency. Pain point: Already rode local favorites; needs fresh suggestions.

5. **Administrator** — Internal role managing curation pipeline. Values data quality, scrape success rates, cost management, ToS compliance.

### User Journeys Mapped

**Discovery Journey:**
1. Rider opens app → sees "Discover Routes" option
2. Taps discovery → map loads with nearby route pins
3. Filters by archetype (e.g., "twisties")
4. Taps high-scoring route pin → views details
5. Taps "Show on map" → visualizes route geometry
6. Decides to ride → saves route for navigation

**Curation Journey (Administrator):**
1. Runs scraping pipeline → monitors logs
2. Reviews extraction quality → calibrates scoring
3. Checks dashboard → views feedback trends
4. Identifies quality issues → flags routes for review
5. Re-runs pipeline → improves route database

### Pain Points Identified

- **Cold start problem:** 0 users, 0 routes → need seed data
- **Scattered sources:** Great rides hidden across forums, blogs, government data
- **Walled gardens:** Competing apps lock route data behind paywalls/accounts
- **No unified scoring:** Existing sources use incompatible rating systems
- **Manual curation doesn't scale:** Too many routes to manually review

---

## Phase 2: Architecture (product-manager + engineering-manager)

**Contributors:** product-manager, engineering-manager

### Functional Requirements

1. **Ingest routes from multiple sources** — FHWA CSV, web scraping, editorial sources
2. **Extract structured attributes** — LLM-based classification of route characteristics
3. **Enrich with geometric data** — OSM curvature, elevation, scenic designation
4. **Compute composite scores** — Deterministic formula across 8 dimensions
5. **Classify into archetypes** — Decision tree mapping features to ride types
6. **Serve via local discovery** — SQLite queries with bounding box and filters
7. **Collect user feedback** — Save, hide, ride completion, rating tracking

### System Components

1. **Python Aggregation Pipeline** — Local script or GitHub Actions for scraping and extraction
2. **LLM Extractor** — Claude Haiku + Instructor for structured extraction
3. **Geometric Enricher** — OSM curvature analysis, elevation API integration
4. **Scoring Engine** — Deterministic composite formula implementation
5. **Archetype Classifier** — Decision tree or k-means clustering
6. **Discovery Service** — Local op-sqlite database with query layer
7. **Data Flywheel** — Convex backend for feedback collection

### Data Entities

1. **curated_routes** — Canonical route storage in Convex (name, state, source, archetype, compositeScore, geometry, metadata)
2. **route_feedback** — User interaction tracking (route_id, user_id, action, rating, timestamp)
3. **discovery_sync** — Sync state for local SQLite (last_sync, routes_by_state)

### API Endpoints

1. **POST /api/ingest-routes** — Upsert routes to Convex (admin-only, internal)
2. **GET /api/routes/by-state** — Fetch routes by state for client sync
3. **POST /api/feedback** — Record user route interaction
4. **GET /api/dashboard/metrics** — Fetch pipeline health metrics (admin-only)

---

## Phase 3: UI Infrastructure (engineering-manager + ui-designer)

**Contributors:** engineering-manager, ui-designer

### Design Libraries

- React Native + Expo (existing platform)
- @rnmapbox/maps (existing from complete-local-routing)
- react-native-paper (existing component library)
- Existing copper-accented dark theme tokens

### Style Tokens

- Copper accent (#C96D3E) for route pins and primary actions
- Dark theme colors (existing palette)
- Typography: Existing font hierarchy
- Spacing: Existing spacing scale
- Map pin styles: Copper-accented with archetype badges

### Component Reuse

**Existing Components to Reuse:**
- MapboxMapView (from complete-local-routing)
- BottomSheet component (existing pattern)
- Filter chips (existing UI pattern)
- Loading indicators (existing)

**New Components Needed:**
- RouteDiscoveryScreen — Main discovery map view
- RouteDetailsSheet — Bottom sheet with route info
- ArchetypeFilter — Filter chips for ride types
- StateFilter — State/region selector
- CurationDashboard — Admin metrics view

### Technical Feasibility Notes

- Local SQLite queries performant for <50k routes
- Map pin clustering needed for dense urban areas
- Offline sync requires initial Convex fetch
- LLM extraction is cloud-only (Haiku API)
- Scraping pipeline is laptop-bound or GitHub Actions
- Feedback collection works offline with sync on reconnect

---

## Research Synthesis

This PRD synthesizes findings from four research documents:

1. **autonomous-curation-strategy.md** — Data flywheel patterns, LLM self-curation, RAG vs finetuning decisions
2. **motorcycle-ride-sources-and-scoring.md** — Route source tiers, scoring framework, archetype classification
3. **motorcycle-ride-aggregation-architecture.md** — Pipeline architecture, LLM extraction with Instructor, geometric enrichment
4. **route-discovery-architecture.md** — Local-first SQLite strategy, Convex integration. (Earlier versions of this document assumed on-device Qwen3.5 — removed in v1.3 per the 2026-04-10 environment-bias finding. The on-device LLM assumption was never valid for mobile hardware.)

**Key Architectural Decisions:**
- Local SQLite for discovery (not vector DB) — no on-device ML runtime at all (P0)
- Claude Haiku (server-side only) for extraction, never an on-device model — reliability, cost, and validated mobile latency
- Deterministic scoring (not LLM-based) — consistency and calibration
- FHWA seed first, web scraping second — bootstrapping strategy
- Data flywheel foundation now, full flywheel later — phased approach
