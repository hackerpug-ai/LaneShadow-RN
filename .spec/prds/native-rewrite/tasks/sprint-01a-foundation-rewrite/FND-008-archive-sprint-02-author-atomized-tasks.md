================================================================================
TASK: FND-008 - Archive sprint-02 + author ~412 atomized task files
================================================================================

TASK_TYPE: INFRA
STATUS: Backlog
PRIORITY: P0
EFFORT: XL
ESTIMATE: 720 min
AGENT: planner
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Archive the original 85-task Sprint 2 and replace it with ~412 atomized UI tasks plus N model translation tasks, each sized for single-context-window AI execution, with complete dependency documentation for parallel execution.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- sprint-02-ui-component-translation/_archived/*.md (NEW): Original 85 tasks archived
- sprint-02-ui-component-translation/UI-*.md (NEW): ~412 atomized UI tasks (one component × one platform)
- sprint-02-ui-component-translation/MDL-*.md (NEW): N model translation tasks
- sprint-02-ui-component-translation/SPRINT.md (MODIFY): Rewritten for atomized structure
- sprint-02-ui-component-translation/INDEX.md (NEW): Task dependency index

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] 85 original Sprint 2 tasks archived to _archived/ without modification
- [ ] ~412 atomized UI task files exist (one component × one platform)
- [ ] N MDL task files exist (one per MODEL-*.md from FND-006)
- [ ] Rewritten SPRINT.md documents atomized structure and parallel execution strategy
- [ ] INDEX.md lists all tasks with complete dependency graph
- [ ] All tasks follow TASK-TEMPLATE v5.0 structure
- [ ] No task exceeds M effort

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Modifying archived task files
- Writing native implementation code
- Creating or modifying matrix files
- Changing the PRD

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Archive all 85 existing Sprint 2 tasks to _archived/ without modification
- Atomize to one component × one platform per task (e.g., UI-007-android, UI-007-ios)
- Every task MUST follow TASK-TEMPLATE v5.0 with all required sections
- Reference specific matrix file (e.g., matrices/ui/atoms/UI-007.md) in every UI task
- Reference specific MODEL-*.md in every MDL task
- SPRINT.md MUST describe parallel execution strategy
- INDEX.md MUST list all tasks with dependencies

NEVER:
- Modify original 85 task files during archival
- Create tasks that span multiple components
- Create platform-agnostic UI tasks — separate Android and iOS
- Create L or XL effort tasks — all must be S or M

STRICTLY:
- Follow TASK-TEMPLATE v5.0 format for every task file
- Populate DEPENDENCIES section for every task
- Estimate effort at S or M only
- Reference matrix files by exact path in every UI task

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Replace the stalled 85-task Sprint 2 with a fully parallel-executable atomized task set that enables single-context-window AI implementation.

**Success looks like**: sprint-02/ contains _archived/ with 85 original tasks, ~412 UI tasks, N MDL tasks, rewritten SPRINT.md with parallel strategy, and INDEX.md with complete dependency graph. Random sample of 10 tasks scores >= 80/115 on quality rubric.

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

1. Create sprint-02/_archived/ and move all 85 existing task files into it.
2. Calculate atomized count: 42 atoms + 107 molecules + 24 organisms + 32 compositions = 205 × 2 platforms = 410 UI tasks.
3. For each atomic matrix (42), author UI-{id}-android.md and UI-{id}-ios.md referencing the matrix, targeting kotlin-implementer or swift-implementer.
4. For each molecular matrix (107), author UI-{id}-android.md and UI-{id}-ios.md.
5. For each organism matrix (24), author UI-{id}-android.md and UI-{id}-ios.md.
6. For each composition matrix (32), author UI-{id}-android.md and UI-{id}-ios.md.
7. For each MODEL-*.md from FND-006, author MDL-{id}.md referencing the translation plan.
8. Rewrite SPRINT.md with atomized structure, parallel strategy, and human testing gate.
9. Author INDEX.md listing all tasks with dependency graph.
10. Validate all tasks follow TASK-TEMPLATE v5.0 and sample scores >= 80/115.

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| # | Statement | Verify |
|---|-----------|--------|
| 1 | 85 original tasks archived | `ls sprint-02/_archived/*.md \| wc -l` returns 85 |
| 2 | ~412 atomized UI tasks exist | `ls sprint-02/UI-*.md \| wc -l` returns 410-415 |
| 3 | N MDL tasks exist | MDL count equals MODEL-*.md count from FND-006 |
| 4 | SPRINT.md mentions atomized and parallel | grep confirms both terms |
| 5 | INDEX.md lists tasks with dependencies | File exists with > 200 lines |
| 6 | All tasks follow v5.0 template | grep confirms GOAL, DELIVERABLE, DONE WHEN, AC sections |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. brain/docs/kanban/TASK-TEMPLATE.md — Lines 1-200, TASK-TEMPLATE v5.0 structure
2. matrices/ui/atoms/*.md — Atomic component matrices to reference
3. matrices/ui/molecules/*.md — Molecular component matrices to reference
4. matrices/ui/organisms/*.md — Organism component matrices to reference
5. matrices/models/MODEL-*.md — Model translation plans to reference

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- sprint-02-ui-component-translation/_archived/*.md (NEW — archived originals)
- sprint-02-ui-component-translation/UI-*.md (NEW)
- sprint-02-ui-component-translation/MDL-*.md (NEW)
- sprint-02-ui-component-translation/SPRINT.md (MODIFY)
- sprint-02-ui-component-translation/INDEX.md (NEW)

WRITE-PROHIBITED:
- matrices/** — read-only references
- _archived/*.md (MODIFY) — archived files must not be modified

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

**References**: TASK-TEMPLATE v5.0, 08f-translation-protocol, matrices/ui/**/*.md, matrices/models/**/*.md

**Pattern**: Atomized task naming: UI-{component-id}-android.md for Kotlin, UI-{component-id}-ios.md for Swift. Example: UI-007-android.md, UI-007-ios.md.

**Anti-pattern**: Creating platform-agnostic UI tasks (no -android/-ios suffix) — forces implementers to work across both platforms, exceeding token limits.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: planner
**Rationale**: Requires planning expertise to atomize tasks, write specs per TASK-TEMPLATE v5.0, and structure documentation for parallel AI execution.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Original tasks archived
  Command: `ls sprint-02-ui-component-translation/_archived/*.md | wc -l`
  Expected: 85

Gate 2: Atomized UI tasks created
  Command: `ls sprint-02-ui-component-translation/UI-*.md | wc -l`
  Expected: 410-415

Gate 3: MDL tasks created
  Command: `ls sprint-02-ui-component-translation/MDL-*.md | wc -l`
  Expected: Equals MODEL-*.md count

Gate 4: SPRINT.md rewritten
  Command: `grep -q 'atomized' sprint-02-ui-component-translation/SPRINT.md && grep -q 'parallel' sprint-02-ui-component-translation/SPRINT.md`
  Expected: Both terms present

Gate 5: INDEX.md present
  Command: `test -f sprint-02-ui-component-translation/INDEX.md && wc -l sprint-02-ui-component-translation/INDEX.md`
  Expected: File exists with > 200 lines

Gate 6: Task template compliance
  Command: `for f in sprint-02-ui-component-translation/{UI,MDL}-*.md; do grep -q 'GOAL' "$f" && grep -q 'DELIVERABLE' "$f" || echo "Non-compliant: $f"; done`
  Expected: No output

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- FND-001 — atom matrices for UI task authoring
- FND-002 — molecule matrices for UI task authoring
- FND-003 — organism matrices for UI task authoring
- FND-004 — composition matrices for UI task authoring
- FND-005 — model inventory for MDL task authoring
- FND-006 — MODEL-*.md files for MDL task authoring

Blocks: (none — this is the final task in the sprint)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- This is the final task — all FND-001 through FND-006 must complete first
- Task pre-fills TRANSLATION SOURCES from matrix files (no mid-task file lookup)
- Each UI task maps to exactly one component matrix file
- Estimates assume zero mid-task escalations (all decisions in matrices/DECISIONS.md)
- SPRINT.md must reference design readiness: all matrices complete, tokens resolved
