# Planning Notebook: LaneShadow RN Fork

> **This is the React Native + Convex fork.**
> Forked: 2026-06-08 from `hackerpug-ai/LaneShadow` main branch.
> Fork repo: `hackerpug-ai/LaneShadow-RN`

---

## Fork Context

This fork reverts to the React Native + Convex implementation. The main repo has a native iOS (Swift) + Android (Kotlin) rewrite; this fork uses the `react-native/` Expo app exclusively.

## Active Plans (Fork)

| Plan | Path | Status |
|------|------|--------|
| RN + Convex Fork Setup | `.spec/prds/rn-convex-fork/README.md` | Active |

## Reusable Plans from Main Branch

These plans contain backend (Convex) work that applies to both native and RN:

| Plan | Path | What's Reusable |
|------|------|-----------------|
| v3-integration | `.spec/prds/v3-integration/` | Convex schema, actions, queries, migrations |
| Curation | `.spec/prds/curation/` | Curation pipeline, curated routes |
| Curation Hardening | `.spec/prds/curation-hardening/` | Curation quality improvements |
| Waypoints Enrichment | `.spec/prds/waypoints/` | Waypoint data pipeline |
| Complete Local Routing | `.spec/prds/complete-local-routing/` | Local routing features |
| LLM Interaction Logging | `.spec/prds/llm-interaction-logging/` | AI chat logging |
| On-Device AI | `.spec/prds/on-device-ai/` | Local AI features |

## Historical Plans (Reference Only)

| Plan | Path | Notes |
|------|------|-------|
| v0 | `.spec/prds/v0/` | Original RN-era PRDs |
| v1 | `.spec/prds/v1/` | First rewrite |
| v2 | `.spec/prds/v2/` | Second iteration |
| Native Rewrite | `.spec/prds/native-rewrite/` | iOS/Android native — NOT applicable to fork |
| Sprint execution | `ai-specs/` | Sprint 02-08 artifacts — Convex tasks reusable |

## Convex Service Compatibility

The Convex backend has been upgraded through 8 sprints since the RN era. All changes are **additive**:
- Original tables preserved: `users`, `orgs`, `org_memberships`, `saved_routes`, `route_plans`, `planning_sessions`, `session_messages`
- New tables added: `favorite_roads`, `plan_usage`, `osm_nodes`, `osm_ways`, `osm_import_jobs`, `trip_plans`, `route_enrichments`, `waypoints`, `curated_routes`, `curated_route_enrichments`, `route_feedback`, `route_posts_raw`, `route_matches`, `community_waypoint_mentions`, `curation_artifact_releases`, `curation_artifact_shards`, `performance`
- No breaking changes to existing tables
- Fork connects to the same Convex deployment

---

# Historical: Planning Notebook: LaneShadow Epic 1

> PRD: .spec/prd/README.md
> PRD Version: 1.0.0
> Appetite: 6 weeks
> Started: 2026-03-04T00:00:00
> Last Updated: 2026-03-04T00:00:00
> Phase: 1
> Status: IN_PROGRESS

## Session Metadata

| Key | Value |
|-----|-------|
| PRD Path | .spec/prd/README.md |
| PRD Version | 1.0.0 |
| Appetite | 6 weeks |
| Output Mode | docs (file-based) |
| Flags | epic-1 |
| BD CLI | N/A (no .beads/ directory) |
| Docs Output Path | .spec/tasks/epic-1/ |

---

## Phase 0: Prerequisites

**Status**: COMPLETE
**Started**: 2026-03-04T00:00:00
**Completed**: 2026-03-04T00:00:00

### Checklist
- [x] Agent teams enabled (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
- [x] Beads CLI detected: NO (file-based mode)
- [x] .beads/ directory checked: NOT FOUND
- [x] Output mode determined: docs (file-based)

---

## Phase 1: PRD Analysis

**Status**: COMPLETE
**Started**: 2026-03-04T00:00:00
**Completed**: 2026-03-04T00:00:00

### PRD Version & Appetite

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Appetite | 6 weeks |
| Scope Level | Full feature |

### PRD Sections Indexed

| Section ID | Title | Stability |
|------------|-------|-----------|
| §00 | Overview | PRODUCT_CONTEXT |
| §01 | Scope | FEATURE_SPEC |
| §02 | Roles | PRODUCT_CONTEXT |
| §03 | Functional Groups | FEATURE_SPEC |
| §04 | UC-P1GAP | FEATURE_SPEC |
| §05 | UC-SR | FEATURE_SPEC |
| §06 | UC-PERS | FEATURE_SPEC |
| §07 | UC-POST | FEATURE_SPEC |
| §08 | Technical Requirements | CONSTITUTION |

### PRD Summary

LaneShadow motorcycle scenic route planner - completing Phase 1 gap closure (weather overlays), saved routes UI, personalization features (favorite roads, avoid areas, elevation), and post-ride experience (ratings, notes, history).

4 functional groups, 14 use cases, 6 week appetite.

---

## Phase 1.5: PRD Version Check

**Status**: COMPLETE
**Timestamp**: 2026-03-04T00:00:00

### Version Comparison

| Field | Value |
|-------|-------|
| Current PRD Version | 1.0.0 |
| Planned PRD Version | N/A (first run) |
| Version Match | N/A |

### Re-Plan Decision

First planning run - no prior version to compare.

---

## Phase 2.5: Deliberation

**Status**: PENDING
**Started**: pending
**Completed**: pending

### PRD Appetite

6 weeks (full feature scope)

### Deliberation Decisions

| UC ID | Decision | Rationale | Deferred Items |
|-------|----------|-----------|----------------|

### Deferred Items

(pending)

### Constraints (from CONSTITUTION)

(pending)

---

## Phase 2: Team Outputs

**Status**: PENDING
**Started**: pending
**Completed**: pending

### Product Manager Output

**Received**: PENDING

### Engineering Manager Output

**Received**: PENDING

### UI Designer Output

**Received**: PENDING

---

## Phase 3: Validation

**Status**: PENDING
**Started**: pending
**Completed**: pending

### Epic Validation

(pending)

### Task Quality Scores

(pending)

### Agent Roster Validation

Available agents for assignment:
- convex-implementer (backend)
- react-native-ui-implementer (frontend)

---

## Phase 4: User Approval

**Status**: PENDING
**Timestamp**: pending

### Presented Plan Summary

(pending)

### User Decision

(pending)

---

## Phase 5: Output Generation

**Status**: PENDING
**Started**: pending
**Completed**: pending

### Output Mode

docs (file-based)

### Created Artifacts

(pending)

---

## Final Epic Inventory (Canonical)

(pending - JSON will be written here after Phase 2)

---

## Error Log

| Timestamp | Phase | Error | Recovery |
|-----------|-------|-------|----------|

