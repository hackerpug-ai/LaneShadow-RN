# Epic 2: Web Scraping, LLM Extraction & Public APIs

**Sequence**: 2
**Status**: Backlog

## Overview
Build the community site scrapers, LLM extraction pipeline with calibration gate, and all public-facing Convex API endpoints. After this epic, the pipeline can produce 17k+ routes and the mobile app has endpoints to sync, search by intent, and submit feedback.

## Human Test Steps
1. Run motorcycleroads.com scraper for a single state, verify JSONL output
2. Run LLM extraction on 5 sample routes, verify structured attributes
3. Run calibration gate, verify fit report with top-10 recovery rate
4. `curl GET /api/routes/lean` from mobile and verify lean route data returns
5. `curl POST /api/intent/extract-params` with intent "twisty roads" and verify 10-key params

## PRD Sections Covered
- S2.2 (Phase 2: Web Scraping)
- S2.3 (Phase 3: LLM Extraction)
- S3-INGEST (UC-INGEST-02, UC-INGEST-03)
- S3-QUALITY (UC-QUALITY-01)
- S3-FLY (UC-FLY-01, UC-FLY-02)
- S4-UC-DISC-07 (Intent search API)
- S9-TRD-2 (LLM Extraction Layer)
- S9-TRD-3 (Geometric Enrichment)

## Dependencies
- **Depends on**: Epic 1
- **Blocks**: Epic 3, Epic 4

## Task List

| ID | Title | Agent | Priority | Effort | Est (min) | Depends On |
|----|-------|-------|----------|--------|-----------|------------|
| PIPE-003 | Community site scrapers | general-purpose | P0 | L | 360 | PIPE-001 |
| PIPE-004 | LLM extraction with Haiku + Instructor | general-purpose | P0 | M | 240 | PIPE-001, PIPE-002, PIPE-003 |
| PIPE-009 | Calibration gate | general-purpose | P0 | M | 180 | PIPE-001, PIPE-004 |
| PIPE-006 | OSM curvature scoring | general-purpose | P1 | L | 300 | PIPE-001, PIPE-004 |
| CONVEX-004 | Public query endpoints for lean sync + enrichment | convex-implementer | P0 | M | 180 | CONVEX-002 |
| CONVEX-005 | User feedback mutation endpoint | convex-implementer | P1 | S | 90 | CONVEX-002 |
| CONVEX-006 | Intent extraction HTTP endpoint (Haiku wrapper) | convex-implementer | P1 | L | 240 | CONVEX-002 |
| CONVEX-007 | Admin dashboard metrics endpoint | convex-implementer | P2 | S | 90 | CONVEX-002, CONVEX-003 |
| CONVEX-009 | HTTP route registration for all endpoints | convex-implementer | P0 | S | 60 | CONVEX-003-007 |

## Wall-clock Estimate
~4-5 days (scrapers and Convex endpoints can run in parallel)

## Definition of Done
- [ ] Community site scrapers produce JSONL with rate limiting
- [ ] LLM extraction produces validated route attributes at temperature=0
- [ ] Calibration gate passes with acceptable top-10 recovery rate
- [ ] Public lean sync endpoint returns route data
- [ ] Intent extraction endpoint returns validated params
- [ ] Feedback endpoint records user interactions
- [ ] All tests pass
