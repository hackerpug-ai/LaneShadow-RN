# Epic 1: Backend Foundation & Seed Pipeline

**Sequence**: 1
**Status**: Backlog

## Overview
Establish the Convex backend schema, admin ingestion endpoints, and the Python pipeline scaffold with FHWA seed data. This is the foundation that all subsequent epics build on — without curated routes in Convex, nothing else works.

## Human Test Steps
1. Run `npx convex deploy` and verify `curated_routes` and `curated_route_enrichments` tables appear in dashboard
2. Run `python -m scripts.curation.pipeline.sources.fhwa` and verify 184 routes appear in Convex
3. Check routes have `compositeScore`, `primaryArchetype`, and `contentVersion` fields populated
4. Verify upsert behavior by running ingestion twice — route count stays the same

## PRD Sections Covered
- S2.1 (Phase 1: Seed Data)
- S3-INGEST (Route Ingestion functional group)
- S3-QUALITY (Quality Scoring functional group)
- S8 (Technical Requirements: Data Schema)
- S9-TRD-1 (Python Aggregation Pipeline)
- S9-TRD-4 (Deterministic Scoring Engine)
- S9-TRD-5 (Archetype Classifier)
- S9-TRD-7 (Convex Backend)

## Dependencies
- **Blocks**: Epic 2, Epic 3

## Task List

| ID | Title | Agent | Priority | Effort | Est (min) | Depends On |
|----|-------|-------|----------|--------|-----------|------------|
| CONVEX-001 | Create curated routes model validators | convex-implementer | P0 | S | 60 | — |
| CONVEX-002 | Add curation tables to Convex schema with indexes | convex-implementer | P0 | S | 90 | CONVEX-001 |
| CONVEX-008 | Environment variable for curation deploy key | convex-implementer | P0 | XS | 15 | — |
| CONVEX-003 | Admin HTTP endpoints for route/enrichment ingestion | convex-implementer | P0 | M | 180 | CONVEX-002, CONVEX-008 |
| PIPE-001 | Python pipeline project setup + directory scaffold | general-purpose | P0 | S | 90 | — |
| PIPE-002 | FHWA CSV ingestion module | general-purpose | P0 | M | 180 | PIPE-001 |
| PIPE-007 | Composite scoring engine | general-purpose | P0 | M | 180 | PIPE-001 |
| PIPE-008 | Archetype classifier | general-purpose | P1 | M | 150 | PIPE-001, PIPE-007 |
| PIPE-005 | Convex batch upsert push module | general-purpose | P1 | M | 180 | PIPE-001, PIPE-007 |

## Wall-clock Estimate
~2-3 days (CONVEX-001/002/008 can run in parallel with PIPE-001; PIPE tasks have sequential dependencies)

## Definition of Done
- [ ] All 3 Convex tables deployed with indexes
- [ ] Admin ingestion endpoints respond to authenticated requests
- [ ] FHWA CSV ingestion produces 184 routes in Convex
- [ ] Routes have valid compositeScore (0-1) and primaryArchetype
- [ ] All Python tests pass: `cd scripts/curation && python -m pytest`
- [ ] Convex typecheck passes: `npx convex typecheck`
