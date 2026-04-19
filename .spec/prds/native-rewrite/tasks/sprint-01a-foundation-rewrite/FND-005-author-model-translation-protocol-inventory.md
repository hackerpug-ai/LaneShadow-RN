================================================================================
TASK: FND-005 - Author model translation protocol + classify RN business logic files
================================================================================

TASK_TYPE: INFRA
STATUS: Backlog
PRIORITY: P0
EFFORT: M
ESTIMATE: 360 min
AGENT: engineering-manager
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Create a model translation protocol (08g) and classify every RN business logic file as SHARED-TS, PORT, or NATIVE-OWNED to enable parallel native translation in FND-006.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- .spec/prds/native-rewrite/08g-model-translation-protocol.md (NEW): Classification framework and translation patterns
- matrices/models/INVENTORY.md (NEW): Complete file inventory with classifications

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] 08g-model-translation-protocol.md exists with SHARED-TS/PORT/NATIVE-OWNED criteria
- [ ] INVENTORY.md classifies every .ts/.tsx file under react-native/lib/, stores/, types/
- [ ] Every classified file has documented rationale and dependencies
- [ ] No files are unclassified or multiply-classified

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Writing per-file MODEL-*.md translation plans (FND-006)
- Modifying react-native source files
- Creating native implementations

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Classify every TypeScript file under react-native/lib/, stores/, types/ exactly once
- Follow documented criteria: SHARED-TS = no RN deps, PORT = business logic RN depends on, NATIVE-OWNED = UI state/store
- Document classification rationale and dependencies for every file
- Include file path, classification, rationale, dependencies, and priority in INVENTORY.md

NEVER:
- Classify a file without documenting rationale
- Leave any file unclassified
- Classify Convex schema/function definitions as PORT — they are SHARED-TS by definition

STRICTLY:
- Mark files with external dependencies (convex, zustand) to inform translation strategy
- Document dependency graph between files to enable translation ordering

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Create a comprehensive model translation protocol and inventory that classifies all React Native business logic files by portability to enable parallel native translation.

**Success looks like**: 08g-model-translation-protocol.md documents the framework; INVENTORY.md lists every file with classification, rationale, dependencies, and priority — no unclassified files.

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

1. Author 08g-model-translation-protocol.md with classification criteria, patterns, and verification procedures.
2. Sweep react-native/lib/ — inventory all .ts/.tsx files with purpose, imports, and dependencies.
3. Sweep react-native/stores/ — inventory state management files with store patterns and state shape.
4. Sweep react-native/types/ — inventory type definitions with exported types and usage contexts.
5. Classify every file per 08g criteria, documenting rationale and dependencies.
6. Author matrices/models/INVENTORY.md with complete listing.

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| # | Statement | Verify |
|---|-----------|--------|
| 1 | 08g-model-translation-protocol.md exists with all three classifications | File exists, grep confirms SHARED-TS, PORT, NATIVE-OWNED |
| 2 | INVENTORY.md exists with comprehensive inventory | File exists with > 100 lines |
| 3 | Every .ts/.tsx file is classified exactly once | `find react-native/lib react-native/stores react-native/types -name '*.ts' -o -name '*.tsx' \| while read f; do grep -q "$f" matrices/models/INVENTORY.md \|\| echo "Unclassified: $f"; done` |
| 4 | Every classified file has documented rationale | grep -c 'Rationale:' equals classified file count |
| 5 | Dependencies documented for every file | grep 'Dependencies:' count matches file count |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/native-rewrite/08f-translation-protocol.md — Lines 1-200, UI translation protocol to adapt
2. .spec/prds/native-rewrite/17-state-convex-architecture.md — Lines 1-150, Convex architecture
3. react-native/lib/ — Business logic file organization
4. react-native/stores/ — State management patterns
5. react-native/types/ — Type definition organization

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- .spec/prds/native-rewrite/08g-model-translation-protocol.md (NEW)
- matrices/models/INVENTORY.md (NEW)

WRITE-PROHIBITED:
- react-native/lib/** — analysis only
- react-native/stores/** — analysis only
- react-native/types/** — analysis only
- matrices/models/MODEL-*.md — FND-006 scope

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

**References**: 08f-translation-protocol, 17-state-convex-architecture

**Pattern**: INVENTORY.md entry: `### lib/rideService.ts — Classification: PORT — Rationale: business rules UI depends on — Dependencies: types/Ride.ts, lib/routeCalculator.ts — Priority: P0`

**Anti-pattern**: Classifying files as SHARED-TS when they contain business logic UI depends on — these should be PORT to ensure cross-platform consistency.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: engineering-manager
**Rationale**: Requires architectural judgment to classify business logic by portability characteristics.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Protocol document exists
  Command: `test -f .spec/prds/native-rewrite/08g-model-translation-protocol.md && wc -l .spec/prds/native-rewrite/08g-model-translation-protocol.md`
  Expected: File exists with > 100 lines

Gate 2: Inventory document exists
  Command: `test -f matrices/models/INVENTORY.md && wc -l matrices/models/INVENTORY.md`
  Expected: File exists with > 100 lines

Gate 3: All files classified
  Command: `find react-native/lib react-native/stores react-native/types -name '*.ts' -o -name '*.tsx' | wc -l && grep -c '^###' matrices/models/INVENTORY.md`
  Expected: File count equals classified entry count

Gate 4: No unclassified files
  Command: `find react-native/lib react-native/stores react-native/types -name '*.ts' -o -name '*.tsx' | while read f; do grep -q "$f" matrices/models/INVENTORY.md || echo "Unclassified: $f"; done`
  Expected: No output

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On: (none — can start immediately)

Blocks:
- FND-006 — translation plans use this inventory
- FND-008 — atomized tasks reference model inventory

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Classification must account for Convex backend architecture (PRD section 17)
- Dependency graph informs FND-006 translation plan ordering
- Must coordinate with FND-006 (translation plans consume this inventory)
