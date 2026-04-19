================================================================================
TASK: FND-003 - Author STYLE PROPERTIES MATRIX files for all 24 RN organisms
================================================================================

TASK_TYPE: INFRA
STATUS: Backlog
PRIORITY: P0
EFFORT: L
ESTIMATE: 480 min
AGENT: frontend-designer
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Create 24 per-organism STYLE PROPERTIES MATRIX files documenting complex composition hierarchies (molecules + atoms), state management, and business logic for translation.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- matrices/ui/organisms/*.md (NEW): 24 matrix files, one per organism component

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] 24 matrix files exist under matrices/ui/organisms/*.md
- [ ] Every file has COMPOSITION ANALYSIS, STATE & BEHAVIOR, TRANSLATION SOURCES, STYLE PROPERTIES MATRIX, NOTES
- [ ] All molecule and atom matrix references resolve to existing files
- [ ] Zero ESCALATE tokens remain
- [ ] Complex layout properties (overflow, position, zIndex) captured where applicable
- [ ] pnpm tokens:validate exits 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Modifying react-native/components/organisms/* source files
- Authoring atom or molecule matrices (FND-001, FND-002)
- Resolving ESCALATE tokens (FND-007)

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Document full child composition tree (molecules and atoms with matrix references)
- Include STATE & BEHAVIOR section documenting useState, useEffect, callbacks
- Resolve ALL visual properties to semantic tokens
- Map each property to BOTH Kotlin Compose AND SwiftUI equivalents
- Document responsive behavior and safe area handling where applicable

NEVER:
- Duplicate molecule/atom property mappings — reference their matrix files
- Treat organisms as simple containers — document complex composition explicitly
- Leave ESCALATE placeholders unresolved

STRICTLY:
- Document all state management and side effects in STATE & BEHAVIOR
- Reference molecule and atom matrix files in COMPOSITION ANALYSIS
- Validate every token reference against semantic.tokens.json

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Produce 24 per-organism design specifications documenting complex composition, state management, and business logic for native translation.

**Success looks like**: 24 matrix files at matrices/ui/organisms/{ComponentName}.md, each with COMPOSITION ANALYSIS referencing molecules/atoms, STATE & BEHAVIOR documentation, zero ESCALATE tokens, and both platform equivalents.

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

1. Review completed atom and molecule matrices from FND-001 and FND-002.
2. Audit react-native/components/organisms/ for all 24 organisms, documenting composition, state, and business logic.
3. For each organism: extract properties, document full composition tree, map to semantic tokens.
4. Map each token to Android Compose and iOS SwiftUI equivalents.
5. Author matrix file with COMPOSITION ANALYSIS, STATE & BEHAVIOR, TRANSLATION SOURCES, STYLE PROPERTIES MATRIX, NOTES.
6. Validate: zero ESCALATE tokens, all references resolve, state documented.

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| # | Statement | Verify |
|---|-----------|--------|
| 1 | 24 matrix files exist at matrices/ui/organisms/*.md | `ls matrices/ui/organisms/*.md \| wc -l` returns 24 |
| 2 | Every file has COMPOSITION ANALYSIS and STATE & BEHAVIOR | grep confirms sections present |
| 3 | All matrix references resolve to existing files | Reference check passes |
| 4 | Zero ESCALATE tokens remain | `grep -r 'ESCALATE' matrices/ui/organisms/` returns exit 1 |
| 5 | Complex layout properties captured | grep confirms overflow/position/zIndex where applicable |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. matrices/ui/atoms/*.md — Atom matrices for composition references
2. matrices/ui/molecules/*.md — Molecule matrices for composition references
3. react-native/components/organisms/ — Organism source files
4. .spec/prds/native-rewrite/08a-atomic-component-catalog.md — Lines 200-250, organism classification
5. .spec/prds/native-rewrite/08f-translation-protocol.md — Translation protocol

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- matrices/ui/organisms/*.md (NEW)

WRITE-PROHIBITED:
- react-native/components/organisms/** — analysis only
- matrices/ui/atoms/** — FND-001 scope
- matrices/ui/molecules/** — FND-002 scope

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

**References**: UI-007 template, 08f-translation-protocol, 08a-atomic-component-catalog, atom/molecule matrices

**Pattern**: STATE & BEHAVIOR section format: | State | Type | Source | Native Translation | — documents useState, useEffect, callbacks with Kotlin/Swift equivalents.

**Anti-pattern**: Treating organisms as purely visual components — organisms embed business logic that must be documented separately from UI concerns.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: frontend-designer
**Rationale**: Requires advanced visual system expertise to map complex organism-level components with business logic to platform-specific implementations.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All 24 matrices present
  Command: `ls matrices/ui/organisms/*.md | wc -l`
  Expected: 24

Gate 2: Required sections present
  Command: `for f in matrices/ui/organisms/*.md; do grep -q 'COMPOSITION ANALYSIS' "$f" && grep -q 'STATE & BEHAVIOR' "$f" || echo "Missing: $f"; done`
  Expected: No output

Gate 3: Zero ESCALATE tokens
  Command: `grep -r 'ESCALATE' matrices/ui/organisms/ | grep -v 'FND-007' | wc -l`
  Expected: 0

Gate 4: Token validation
  Command: `pnpm tokens:validate`
  Expected: Exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- FND-001 — atom matrices for composition references
- FND-002 — molecule matrices for composition references
- FND-007 — ESCALATE token resolution

Blocks:
- FND-004 — template/screen/delta matrices reference organism matrices
- FND-008 — atomized tasks reference organism matrix files

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Organisms compose molecules and atoms — document full composition hierarchy
- Complex layout is the norm — document overflow, position, zIndex, safe areas
- Screen-level organisms (Header, BottomNav, Modal) document safe area handling
- Stateful organisms (FormFieldGroup, CardList) document inter-child state communication
