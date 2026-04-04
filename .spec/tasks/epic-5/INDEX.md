# Task Index: LaneShadow Epic 5

> Generated: 2026-04-02
> PRD: .spec/prd/ROADMAP.md
> Total Epics: 1
> Total Tasks: 5

## Epic Structure

## Epic 5: Scenic Routing Rearchitecture

**Folder:** `epic-5/`

**Human Test:**
1. Plan a route — generation completes in under 15 seconds
2. Route labels and rationale reference real named landmarks (not invented road names)
3. 2–3 distinct route options are shown with different scenic waypoints
4. Overpass fallback works: if no scenic nodes found, 1 direct route is returned
5. `pnpm test` passes with no agent session mocks

**Tasks:**
- [US-050](epic-5/US-050.md): Add Overpass API scenic waypoint discovery tool
- [US-051](epic-5/US-051.md): Refactor planRide to deterministic orchestrator
- [US-052](epic-5/US-052.md): Add lightweight route enrichment LLM call
- [US-053](epic-5/US-053.md): Enhance routing provider with motorcycle options
- [US-054](epic-5/US-054.md): Update test suite for deterministic pipeline

## Usage

These task files are designed for execution with `/kb-run-epic`.

Each task file contains:
- Complete task specification following TASK-TEMPLATE.md v4.0
- All required sections for agent execution
- TDD workflow for FEATURE tasks
- Verification checklist for INFRA/REFACTOR tasks

To execute:
1. `/kb-run-epic epic-5` to run the epic
2. Tasks are dispatched to assigned agents in dependency order
3. Reviewers verify each completion before marking done

## PRD Coverage

100% of Epic 5 acceptance criteria covered.

**User Stories Covered:**
- Routing quality: real scenic landmarks, deterministic pipeline
- Performance: ≤15s generation latency
- Extensibility: architecture ready for road conditions, curvature, elevation tools

## Task Summary

| Task ID | Title | Type | Priority | Estimate |
|---------|-------|------|----------|----------|
| US-050 | Add Overpass API scenic waypoint discovery tool | FEATURE | P0 | 90 min |
| US-051 | Refactor planRide to deterministic orchestrator | REFACTOR | P0 | 120 min |
| US-052 | Add lightweight route enrichment LLM call | FEATURE | P1 | 90 min |
| US-053 | Enhance routing provider with motorcycle options | FEATURE | P0 | 60 min |
| US-054 | Update test suite for deterministic pipeline | TEST | P1 | 90 min |

**Total Estimated Effort:** 7.5 hours

## Dependencies

```
US-050 (Overpass waypoint discovery)
  └── US-051 (deterministic orchestrator)
        └── US-052 (enrichment LLM call)
        └── US-054 (test suite)

US-053 (motorcycle routing options)
  └── US-051 (deterministic orchestrator)
```
