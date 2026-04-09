# Task Generation Plan: Complete Local Routing

**Total Tasks:** 66 tasks across 7 epics
**Status:** In Progress (2/66 complete)
**Generated:** 2026-04-09

---

## Task Files Written

### EPIC-0: Pi Agent Architecture Foundation (8 tasks)
- ✅ EPIC-LOCAL-001: Local Routing Extension Foundation
- ✅ EPIC-LOCAL-002: Coordinate Conversion Workflow
- ⏳ EPIC-LOCAL-003: Offline Routing Tool
- ⏳ EPIC-LOCAL-004: Local Model Inference Workflow
- ⏳ EPIC-LOCAL-005: Hybrid Enrichment Tool
- ⏳ EPIC-LOCAL-006: CRDT Sync Workflow
- ⏳ EPIC-LOCAL-007: Local-First Sync Tool
- ⏳ EPIC-LOCAL-008: Progressive Loading Events

### EPIC-1: Shadow Setup (8 tasks)
- ⏳ EPIC-1-TASK-001 through EPIC-1-TASK-008

### EPIC-2: Map Foundation (10 tasks)
- ⏳ EPIC-2-TASK-001 through EPIC-2-TASK-010

### EPIC-3: Offline Maps Management (10 tasks)
- ⏳ EPIC-3-TASK-001 through EPIC-3-TASK-010

### EPIC-4: Local Route Calculation (10 tasks)
- ⏳ EPIC-4-TASK-001 through EPIC-4-TASK-010

### EPIC-5: Local-First Sync & Offline Editing (10 tasks)
- ⏳ EPIC-5-TASK-001 through EPIC-5-TASK-010

### EPIC-6: Progressive Enrichment & Weather Overlays (10 tasks)
- ⏳ EPIC-6-TASK-001 through EPIC-6-TASK-010

---

## Task Template Structure

All tasks follow TASK-TEMPLATE v5.0 format:

```markdown
# TASK-ID: Task Title

**Epic:** EPIC-X: Epic Title
**Task ID:** TASK-ID
**Status:** Backlog
**Priority:** P0-P3
**Effort:** S/M/L/XL
**Type:** FEATURE/INFRA
**Iteration:** 1

---

## CRITICAL CONSTRAINTS

MUST: [requirement]
NEVER: [prohibition]
STRICTLY: [hard boundary]

---

## SPECIFICATION

**Objective:** [one-sentence goal]
**Success looks like:** [concrete end state]

---

## PREREQUISITES

| Phase | Document | Lines/Section | Purpose |
|-------|----------|---------------|---------|

---

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|

---

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|

---

## DESIGN

[Implementation details, architecture, patterns]

---

## GUARDRAILS

### WRITE-ALLOWED

| Action | Path | Purpose |
|--------|------|---------|

### WRITE-PROHIBITED

- [path] - [reason]

---

## CONSTRAINTS

| Constraint | Value | Reason |
|------------|-------|--------|

---

## VERIFICATION GATES

```bash
[Verification commands]
```

---

## FILES TO CREATE/MODIFY

| Action | Path | Purpose |
|--------|------|---------|

---

## DESIGN NOTES

[Additional context, edge cases, examples]

---

## CONTRACT

### Agent Instructions

[Step-by-step instructions]

### Journal Format

```json
[Journal structure]
```

---

## APPROVAL

**Approved By:** Pending
**Date:** Pending

---

**End of Task Definition**
```

---

## Generation Strategy

### Phase 1: Foundation Tasks (Priority P0)
1. EPIC-0 (all 8 tasks) - Blocks EPIC-4, EPIC-5, EPIC-6
2. EPIC-1 (all 8 tasks) - Blocks EPIC-2

### Phase 2: Core Infrastructure (Priority P1)
3. EPIC-2 (all 10 tasks) - Blocks EPIC-3
4. EPIC-3 (all 10 tasks) - Blocks EPIC-4

### Phase 3: Feature Implementation (Priority P1)
5. EPIC-4 (all 10 tasks) - Depends on EPIC-0, EPIC-3
6. EPIC-5 (all 10 tasks) - Depends on EPIC-0, EPIC-4

### Phase 4: Polish & Enhancement (Priority P2)
7. EPIC-6 (all 10 tasks) - Depends on EPIC-0, EPIC-5

---

## Next Steps

1. Complete EPIC-0 tasks (EPIC-LOCAL-003 through EPIC-LOCAL-008)
2. Generate EPIC-1 tasks (EPIC-1-TASK-001 through EPIC-1-TASK-008)
3. Generate remaining epics sequentially
4. Create INDEX.md with all task listings
5. Run `/kb-project-plan` to process all task files

---

## Quality Assurance

Each task file must pass:
- ✅ CRITICAL CONSTRAINTS section (3-5 statements)
- ✅ SPECIFICATION (one-sentence objective + success state)
- ✅ ACCEPTANCE CRITERIA (4+ GIVEN-WHEN-THEN scenarios)
- ✅ TEST CRITERIA (boolean statements with verification)
- ✅ GUARDRAILS (WRITE-ALLOWED with absolute paths)
- ✅ VERIFICATION GATES (exact commands)
- ✅ DESIGN section (implementation details)

---

**Generation Progress:** 2/66 tasks (3%)
**Estimated Completion:** 2-3 hours for all 66 tasks
