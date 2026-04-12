# Team Contributions

## Phase 1: Technical Architecture (engineering-manager)

**Deliverable:** Complete technical architecture for pipeline hardening — 17 new components, 10 modified components, 8 data entities, dedup algorithm, NLP pipeline, calibration system, data quality report format, 8 new dependencies, 9 architecture decisions.

**Key Findings:**
- Three-stage cascading dedup (exact → fuzzy → geospatial) with Convex Native Geospatial is the right approach — ML record linkage rejected due to lack of training data
- Keyword + regex NLP pipeline first, with upgrade path to sentence-transformer if accuracy < 0.75
- adamfranco/curvature should be consumed as pre-computed data (multi-hour batch run on US OSM PBF), not run per-pipeline-execution
- Quality floor as hard gate (reject routes) rather than soft scoring penalty — routes with no description/rating/designation produce extraction garbage
- Convex schema evolution via nullable columns (non-breaking for existing mobile app)
- Pipeline orchestrator needed as single entry point replacing ad-hoc script execution
- Source addition should be incremental: Scenic Byways GIS (lowest risk) → Reddit (stable API) → ADVRider (HTTP scraping, highest risk)

**Contributors:** engineering-manager

## Phase 2: Use Case Definition (product-manager)

**Deliverable:** 19 structured use cases across 4 functional groups, all with acceptance criteria in ☐ {WHO} can {ACTION} {CONTEXT} format.

**Key Findings:**
- Job statement: "When I need confidence that my route catalog is comprehensive, accurate, and diverse enough to serve riders across all US regions and ride styles..."
- Four Forces analysis identified key anxiety: NLP extraction from forums is noisy; calibration gate could block pipeline if threshold is too strict
- Scope boundaries validated against existing curation PRD — no duplication with UC-INGEST-01 through 04, UC-QUALITY-01 through 03, UC-FLY-01 through 02
- UC-SRC-01 (Scenic Byways GIS) supersedes existing UC-INGEST-01 (FHWA CSV) for routes with geometry overlap
- All RIDER UCs are net-new scope (forums were explicitly deferred in existing scope as "NLP forum mining")

**Contributors:** product-manager

## Phase 3: Synthesis (team-lead)

**Deliverable:** PRD folder structure at `.spec/prds/curation-hardening/` with 10 section files, stability layer frontmatter, and README index.

**Key Decisions During Synthesis:**
- Chose `.spec/prds/curation-hardening/` path to match project convention (`.spec/prds/{name}/`)
- Weight realignment uses research formula as starting point, calibration gate validates before deployment
- Sentiment modifier in UC-RIDER-04 capped at ±0.05 (not ±0.5 as initially proposed by product-manager) to prevent community sentiment from dominating composite score
- Quality floor criteria are OR-based (pass if ANY of 4 criteria met) not AND-based — conservative to avoid over-rejecting government data sources that may lack descriptions

**Contributors:** team-lead (orchestrator)
