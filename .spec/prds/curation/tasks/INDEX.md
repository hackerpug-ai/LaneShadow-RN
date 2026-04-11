# Curation — Implementation Plan Index

**Project**: LaneShadow Curation
**Feature**: Route Discovery & Autonomous Data Flywheel
**Generated**: 2026-04-10
**PRD**: `.spec/prds/curation/README.md`

## Overview

| Metric | Count |
|--------|-------|
| Epics | 5 |
| Tasks | 35 |
| Use Cases Covered | 16/16 |

## Epic Summary

### Epic 0: AI Provider Abstraction & Cerebras Migration (3 tasks)
**Scope**: Abstract provider/model selection behind `getAgentModel('low' | 'high')`, switch default to Cerebras
**Source**: `.spec/proposals/cerebras-provider-migration.md`
**Human Test**: Chat message → agent responds via Cerebras; swap model in one file → no other code changes needed
**Wall-clock**: ~0.5 day

| ID | Title | Agent | Priority | Est |
|----|-------|-------|----------|-----|
| [AI-001](./epic-0-ai-provider-abstraction/AI-001.md) | Create agent model registry (`lib/models.ts`) | convex-implementer | P0 | 75m |
| [AI-002](./epic-0-ai-provider-abstraction/AI-002.md) | Env migration: remove AI_PROVIDER/AI_MODEL, add CEREBRAS_API_KEY | convex-implementer | P0 | 30m |
| [AI-003](./epic-0-ai-provider-abstraction/AI-003.md) | Migrate 6 agent call sites + update tests | convex-implementer | P0 | 150m |

### Epic 1: Backend Foundation & Seed Pipeline (9 tasks)
**Scope**: Convex schema, admin ingestion endpoints, Python pipeline scaffold, FHWA seed data
**Human Test**: Run FHWA ingestion → routes appear in Convex with scores and archetypes
**Wall-clock**: ~2-3 days

| ID | Title | Agent | Priority | Est |
|----|-------|-------|----------|-----|
| [CONVEX-001](./epic-1-backend-seed-pipeline/CONVEX-001.md) | Create curated routes model validators | convex-implementer | P0 | 60m |
| [CONVEX-002](./epic-1-backend-seed-pipeline/CONVEX-002.md) | Add curation tables to schema with indexes | convex-implementer | P0 | 90m |
| [CONVEX-008](./epic-1-backend-seed-pipeline/CONVEX-008.md) | Environment variable for curation deploy key | convex-implementer | P0 | 15m |
| [CONVEX-003](./epic-1-backend-seed-pipeline/CONVEX-003.md) | Admin HTTP endpoints for ingestion | convex-implementer | P0 | 180m |
| [PIPE-001](./epic-1-backend-seed-pipeline/PIPE-001.md) | Python pipeline project setup | general-purpose | P0 | 90m |
| [PIPE-002](./epic-1-backend-seed-pipeline/PIPE-002.md) | FHWA CSV ingestion module | general-purpose | P0 | 180m |
| [PIPE-007](./epic-1-backend-seed-pipeline/PIPE-007.md) | Composite scoring engine | general-purpose | P0 | 180m |
| [PIPE-008](./epic-1-backend-seed-pipeline/PIPE-008.md) | Archetype classifier | general-purpose | P1 | 150m |
| [PIPE-005](./epic-1-backend-seed-pipeline/PIPE-005.md) | Convex batch upsert push module | general-purpose | P1 | 180m |

### Epic 2: Web Scraping, LLM Extraction & Public APIs (9 tasks)
**Scope**: Community scrapers, Haiku extraction, calibration gate, public sync/feedback/intent endpoints
**Human Test**: Scrape routes → extract via Haiku → sync to mobile → search by intent
**Wall-clock**: ~4-5 days

| ID | Title | Agent | Priority | Est |
|----|-------|-------|----------|-----|
| [PIPE-003](./epic-2-scraping-llm-apis/PIPE-003.md) | Community site scrapers | general-purpose | P0 | 360m |
| [PIPE-004](./epic-2-scraping-llm-apis/PIPE-004.md) | LLM extraction with Haiku + Instructor | general-purpose | P0 | 240m |
| [PIPE-009](./epic-2-scraping-llm-apis/PIPE-009.md) | Calibration gate | general-purpose | P0 | 180m |
| [PIPE-006](./epic-2-scraping-llm-apis/PIPE-006.md) | OSM curvature scoring | general-purpose | P1 | 300m |
| [CONVEX-004](./epic-2-scraping-llm-apis/CONVEX-004.md) | Public query endpoints for lean sync | convex-implementer | P0 | 180m |
| [CONVEX-005](./epic-2-scraping-llm-apis/CONVEX-005.md) | User feedback mutation endpoint | convex-implementer | P1 | 90m |
| [CONVEX-006](./epic-2-scraping-llm-apis/CONVEX-006.md) | Intent extraction HTTP endpoint | convex-implementer | P1 | 240m |
| [CONVEX-007](./epic-2-scraping-llm-apis/CONVEX-007.md) | Admin dashboard metrics endpoint | convex-implementer | P2 | 90m |
| [CONVEX-009](./epic-2-scraping-llm-apis/CONVEX-009.md) | HTTP route registration for all endpoints | convex-implementer | P0 | 60m |

### Epic 3: Local Discovery Layer & React Hooks (6 tasks)
**Scope**: op-sqlite discovery.db, SQL queries, React hooks, core design components
**Human Test**: Sync routes locally → query by bounds → intent cache hit <50ms
**Wall-clock**: ~3-4 days

| ID | Title | Agent | Priority | Est |
|----|-------|-------|----------|-----|
| [CUR-008](./epic-3-local-discovery-hooks/CUR-008.md) | Local discovery.db schema + sync | react-native-ui-implementer | P0 | 150m |
| [CUR-009](./epic-3-local-discovery-hooks/CUR-009.md) | Local discovery queries | react-native-ui-implementer | P0 | 90m |
| [CUR-010](./epic-3-local-discovery-hooks/CUR-010.md) | React hooks: discovery, enrichment, intent search | react-native-ui-implementer | P0 | 180m |
| [DESIGN-001](./epic-3-local-discovery-hooks/DESIGN-001.md) | RouteDiscoveryScreen layout | frontend-designer | P0 | 180m |
| [DESIGN-002](./epic-3-local-discovery-hooks/DESIGN-002.md) | RoutePin archetype-badged map pin | frontend-designer | P0 | 120m |
| [DESIGN-005](./epic-3-local-discovery-hooks/DESIGN-005.md) | IntentSearchInput with states | frontend-designer | P0 | 150m |

### Epic 4: Discovery UI & Data Flywheel (8 tasks)
**Scope**: Full discovery screen, filters, details sheet, route geometry, feedback actions
**Human Test**: Browse map → filter → tap pin → show route → save/hide → intent search
**Wall-clock**: ~3-4 days

| ID | Title | Agent | Priority | Est |
|----|-------|-------|----------|-----|
| [CUR-012](./epic-4-discovery-ui-flywheel/CUR-012.md) | Discovery UI: main screen | react-native-ui-implementer | P0 | 180m |
| [DESIGN-003](./epic-4-discovery-ui-flywheel/DESIGN-003.md) | CuratedRouteDetailsSheet | frontend-designer | P0 | 120m |
| [DESIGN-004](./epic-4-discovery-ui-flywheel/DESIGN-004.md) | ArchetypeFilter chips | frontend-designer | P1 | 60m |
| [DESIGN-006](./epic-4-discovery-ui-flywheel/DESIGN-006.md) | StateFilter selector | frontend-designer | P1 | 90m |
| [DESIGN-007](./epic-4-discovery-ui-flywheel/DESIGN-007.md) | Empty/loading state overlays | frontend-designer | P1 | 60m |
| [CUR-013](./epic-4-discovery-ui-flywheel/CUR-013.md) | Discovery UI: intent search bar | react-native-ui-implementer | P1 | 120m |
| [CUR-014](./epic-4-discovery-ui-flywheel/CUR-014.md) | Discovery UI: show on map + feedback | react-native-ui-implementer | P1 | 90m |
| [DESIGN-008](./epic-4-discovery-ui-flywheel/DESIGN-008.md) | Feedback action patterns | frontend-designer | P2 | 60m |

## Dependency Graph

```
Epic 0 (AI Provider Abstraction)
  ├── AI-001 ─┐
  ├── AI-002 ─┴→ AI-003
         │
         ▼ (blocks Epic 2 LLM extraction)
Epic 1 (Backend + Seed)
  ├── CONVEX-001 → CONVEX-002 → CONVEX-003
  ├── CONVEX-008 ──────────── → CONVEX-003
  ├── PIPE-001 → PIPE-002
  ├── PIPE-001 → PIPE-007 → PIPE-008
  └── PIPE-001 → PIPE-005
         │
         ▼
Epic 2 (Scraping + LLM + APIs)
  ├── PIPE-003 → PIPE-004 → PIPE-009
  ├── PIPE-004 → PIPE-006
  ├── CONVEX-002 → CONVEX-004
  ├── CONVEX-002 → CONVEX-005
  ├── CONVEX-002 → CONVEX-006
  └── CONVEX-003-007 → CONVEX-009
         │
         ▼
Epic 3 (Local Layer + Hooks)
  ├── CONVEX-002 → CUR-008 → CUR-009 → CUR-010
  ├── DESIGN-001 → DESIGN-002
  └── DESIGN-001 → DESIGN-005
         │
         ▼
Epic 4 (Discovery UI + Flywheel)
  ├── CUR-010 + DESIGN-001 → CUR-012
  ├── DESIGN-001 → DESIGN-003/004/006/007
  ├── CUR-010 + CUR-012 → CUR-013
  ├── CONVEX-005 + CUR-012 → CUR-014
  └── DESIGN-003 → DESIGN-008
```

## Parallelization Opportunities

- **Epic 0**: AI-001 (new registry file) ∥ AI-002 (env.ts + .env.example) — different files, no shared state
- **Epic 1**: CONVEX-001/008 (backend) ∥ PIPE-001 (Python) — no shared state
- **Epic 1**: PIPE-002 (FHWA) ∥ PIPE-007 (scoring) — different concerns
- **Epic 2**: PIPE-003 (scrapers) ∥ CONVEX-004/005 (endpoints) — no dependencies
- **Epic 3**: CUR-008 (SQLite) ∥ DESIGN-001 (screen layout) — different layers
- **Epic 4**: DESIGN-003/004/006/007 all depend only on DESIGN-001 — parallel after DESIGN-001

## Quality Metrics

| Section | Points | Tasks Compliant |
|---------|--------|----------------|
| CRITICAL CONSTRAINTS | 15 | 32/32 (100%) |
| SPECIFICATION | 10 | 32/32 (100%) |
| ACCEPTANCE CRITERIA | 25 | 30/32 (94%) |
| TEST CRITERIA | 15 | 30/32 (94%) |
| GUARDRAILS | 10 | 32/32 (100%) |
| DESIGN | 10 | 28/32 (88%) |
| VERIFICATION GATES | 15 | 32/32 (100%) |
| AGENT ASSIGNMENT | 5 | 32/32 (100%) |
| ESTIMATE | 5 | 32/32 (100%) |
| CODING STANDARDS | 5 | 28/32 (88%) |
| **Average** | **/115** | **~88** |

## Usage

```bash
# Browse task files
ls .spec/prds/curation/tasks/

# View this index
cat .spec/prds/curation/tasks/INDEX.md

# Execute first epic
/kb-run-epic epic-1-backend-seed-pipeline
```
