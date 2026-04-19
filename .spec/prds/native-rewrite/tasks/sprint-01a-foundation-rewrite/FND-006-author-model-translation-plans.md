================================================================================
TASK: FND-006 - Author per-file MODEL-*.md translation plans for PORT files
================================================================================

TASK_TYPE: INFRA
STATUS: Complete
PRIORITY: P0
EFFORT: L
ESTIMATE: 480 min
AGENT: engineering-manager
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Create detailed translation plans for every PORT-classified business logic file that guide implementers in preserving behavioral parity while moving to native platforms.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- matrices/models/MODEL-*.md (NEW): One translation plan per PORT-classified file

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Every PORT file from INVENTORY.md has a MODEL-*.md translation plan
- [ ] Each plan includes SOURCE ANALYSIS, TRANSLATION STRATEGY, PARITY CONTRACT, DEPENDENCIES
- [ ] Type definition plans document all exported types
- [ ] State machine plans document all states and transitions
- [ ] Dependency ordering is consistent (no circular dependencies)

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Creating plans for SHARED-TS files (remain in TypeScript)
- Creating plans for NATIVE-OWNED files (rewritten from scratch)
- Writing native implementation code

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Create a translation plan for every PORT-classified file from INVENTORY.md
- Include SOURCE ANALYSIS (purpose, exports, dependencies), TRANSLATION STRATEGY (platform-specific), PARITY CONTRACT (invariants), DEPENDENCIES (translation ordering)
- Distinguish between file types: type definitions, state machines, API services, business rules
- Reference 08g-model-translation-protocol.md for pattern guidance

NEVER:
- Create plans for SHARED-TS or NATIVE-OWNED files
- Leave a PORT file without a translation plan
- Omit the parity contract — implementers need explicit invariants

STRICTLY:
- Document the parity contract for every file — what invariants MUST be preserved
- Reference dependencies to enable ordered translation

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Create detailed translation plans for every PORT-classified file that guide implementers in preserving behavioral parity.

**Success looks like**: Every PORT file has a MODEL-*.md with SOURCE ANALYSIS, TRANSLATION STRATEGY (Kotlin/Swift code), PARITY CONTRACT (behavioral invariants), and DEPENDENCIES — dependency graph is acyclic.

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

1. Read INVENTORY.md to identify all PORT-classified files and their dependencies.
2. Read 08g-model-translation-protocol.md for translation patterns by file type.
3. Author MODEL-*.md for type definition files (Kotlin data classes / Swift structs).
4. Author MODEL-*.md for state machine files (Kotlin StateFlow / Swift Combine).
5. Author MODEL-*.md for API service files (endpoints, request/response shapes).
6. Author MODEL-*.md for business rule files (rules, validation logic).
7. Validate: all PORT files have plans, dependency graph is acyclic.

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| # | Statement | Verify |
|---|-----------|--------|
| 1 | Every PORT file has a MODEL-*.md translation plan | PORT count in INVENTORY.md equals MODEL-*.md file count |
| 2 | Each plan has SOURCE ANALYSIS, TRANSLATION STRATEGY, PARITY CONTRACT, DEPENDENCIES | grep confirms all sections in every plan |
| 3 | Type plans document exported types | grep confirms in type-related plans |
| 4 | State machine plans document states and transitions | grep confirms in state-machine plans |
| 5 | Dependency graph is acyclic | Manual or script-based analysis confirms no cycles |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. matrices/models/INVENTORY.md — Lines 1-200, PORT file classifications and dependencies
2. .spec/prds/native-rewrite/08g-model-translation-protocol.md — Translation patterns
3. react-native/lib/ — Business logic source files
4. react-native/stores/ — State management source files
5. react-native/types/ — Type definition source files

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- matrices/models/MODEL-*.md (NEW)

WRITE-PROHIBITED:
- react-native/lib/** — analysis only
- react-native/stores/** — analysis only
- react-native/types/** — analysis only
- matrices/models/INVENTORY.md — read-only reference

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

**References**: INVENTORY.md, 08g-model-translation-protocol, 08f-translation-protocol

**Pattern**: TRANSLATION STRATEGY includes Kotlin data class and Swift struct code snippets for type files; StateFlow/Combine patterns for state machines.

**Anti-pattern**: Writing translation plans without specifying the parity contract — without explicit invariants, implementers will introduce subtle behavioral differences.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: engineering-manager
**Rationale**: Requires deep understanding of both RN business logic patterns and native platform state management to design translation strategies.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All PORT files have plans
  Command: `grep 'PORT' matrices/models/INVENTORY.md | wc -l && ls -1 matrices/models/MODEL-*.md | wc -l`
  Expected: Both counts equal

Gate 2: Required sections present
  Command: `for f in matrices/models/MODEL-*.md; do grep -q 'SOURCE ANALYSIS' "$f" && grep -q 'TRANSLATION STRATEGY' "$f" && grep -q 'PARITY CONTRACT' "$f" && grep -q 'DEPENDENCIES' "$f" || echo "Missing: $f"; done`
  Expected: No output

Gate 3: No circular dependencies
  Command: Manual verification of dependency graph
  Expected: No cycles detected

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- FND-005 — inventory and protocol must exist first

Blocks:
- FND-008 — atomized tasks reference MODEL-*.md files

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Translation plans must align with UI matrices — if a UI component uses a store, the MODEL-*.md must reference that component's matrix
- Store architecture patterns (Zustand selectors, context providers) must map to platform equivalents (Kotlin StateFlow, Swift ObservableObject)
- Convex query types affect UI data flow — document which queries each model uses
