================================================================================
TASK: FND-002 - Author STYLE PROPERTIES MATRIX files for all 107 RN molecules
================================================================================

TASK_TYPE: INFRA
STATUS: Complete
PRIORITY: P0
EFFORT: XL
ESTIMATE: 720 min
AGENT: frontend-designer
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Create 107 per-molecule STYLE PROPERTIES MATRIX files documenting composition patterns (which atoms each molecule uses) and serving as translation blueprints for parallel native implementation.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- matrices/ui/molecules/*.md (NEW): 107 matrix files, one per molecular component
- .spec/prds/native-rewrite/sprint-01a/DECISIONS.md (MODIFY): Token resolution decisions if needed

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] 107 matrix files exist under matrices/ui/molecules/*.md
- [ ] Every file has COMPOSITION, TRANSLATION SOURCES, STYLE PROPERTIES MATRIX, NOTES sections
- [ ] Every COMPOSITION section references existing atom matrix files
- [ ] Zero ESCALATE tokens remain
- [ ] Layout properties (flexDirection, justifyContent, alignItems, gap) captured
- [ ] pnpm tokens:validate exits 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Modifying react-native/components/molecules/* source files
- Authoring atom matrices (FND-001) or organism matrices (FND-003)
- Resolving ESCALATE tokens (FND-007)

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Use EXACT UI-007 template format adapted for molecular composition
- Document child atom composition (COMPOSITION section listing atoms used)
- Resolve ALL visual properties to semantic tokens
- Map each property to BOTH Kotlin Compose AND SwiftUI equivalents
- Document layout properties (flexDirection, justifyContent, alignItems, gap)
- Document interaction states (hover, active, disabled, error)

NEVER:
- Duplicate atom-level property mappings — reference atom matrix files instead
- Leave ESCALATE placeholders unresolved
- Omit layout/direction/alignment properties

STRICTLY:
- Reference atomic component matrix files in COMPOSITION section
- Follow Photocopy Translation Protocol (08f) structure
- Document platform-specific composition patterns (Row vs Column, LazyRow vs ScrollView)

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Produce 107 per-molecule design specifications with composition documentation that enables parallel native implementation without mid-task design decisions.

**Success looks like**: 107 matrix files at matrices/ui/molecules/{ComponentName}.md, each with COMPOSITION section referencing atom matrices, zero ESCALATE tokens, layout properties documented, and both platform equivalents. Implementers can author components using ONLY the matrix + RN source + referenced atom matrices.

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

1. Review completed atomic component matrices from FND-001 to understand established patterns.
2. Read 08a-atomic-component-catalog.md to extract full list of 107 molecules with RN source paths.
3. For each molecule: read RN source, extract properties + layout, identify child atoms, map to semantic tokens.
4. Map each token to Android Compose and iOS SwiftUI equivalents, documenting platform composition patterns.
5. Author matrix file with COMPOSITION, TRANSLATION SOURCES, STYLE PROPERTIES MATRIX, NOTES.
6. Validate: zero ESCALATE tokens, all atom references resolve, layout properties captured.

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| # | Statement | Verify |
|---|-----------|--------|
| 1 | 107 matrix files exist at matrices/ui/molecules/*.md | `ls matrices/ui/molecules/*.md \| wc -l` returns 107 |
| 2 | Every file contains COMPOSITION, TRANSLATION SOURCES, STYLE PROPERTIES MATRIX, NOTES | grep all sections in every file |
| 3 | All atom matrix references in COMPOSITION resolve to existing files | `grep -h 'matrices/ui/atoms/' matrices/ui/molecules/*.md \| while read ref; do [ -f "$ref" ] \|\| echo "Missing: $ref"; done` |
| 4 | Zero ESCALATE tokens remain | `grep -r 'ESCALATE' matrices/ui/molecules/` returns exit 1 |
| 5 | Layout properties (flex, gap, padding) are captured | grep confirms layout properties present |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-007-android-atoms-2-5-form-controls.md
   - Focus: Base template structure adapted for molecules

2. matrices/ui/atoms/*.md
   - Focus: Completed atom matrices to reference in COMPOSITION sections

3. react-native/components/molecules/
   - Focus: Molecular component composition patterns and prop interfaces

4. .spec/prds/native-rewrite/08a-atomic-component-catalog.md
   - Lines: 100-200
   - Focus: Molecular component classification

5. .spec/prds/native-rewrite/08f-translation-protocol.md
   - Focus: Translation protocol rules

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- matrices/ui/molecules/*.md (NEW)
- .spec/prds/native-rewrite/sprint-01a/DECISIONS.md (MODIFY — token decisions only)

WRITE-PROHIBITED:
- react-native/components/molecules/** — source files for analysis only
- matrices/ui/atoms/** — FND-001 scope
- matrices/ui/organisms/** — FND-003 scope
- tokens/semantic/semantic.tokens.json — FND-007 scope

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

**References**: UI-007 template, 08f-translation-protocol, 08a-atomic-component-catalog, 08b-android-component-map, 08c-ios-component-map, matrices/ui/atoms/*.md

**Pattern**: Per-molecule matrix with four sections: (1) TRANSLATION SOURCES, (2) COMPOSITION listing child atoms with matrix references, (3) STYLE PROPERTIES MATRIX, (4) NOTES.

**Anti-pattern**: Duplicating atom-level property mappings instead of referencing atom matrix files — creates maintenance burden and inconsistency.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: frontend-designer
**Rationale**: Requires composition design analysis (molecules combine atoms), layout system understanding, and native platform composition pattern documentation.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Matrix structure validation
  Command: `for f in matrices/ui/molecules/*.md; do grep -q 'TRANSLATION SOURCES' "$f" && grep -q 'COMPOSITION' "$f" && grep -q 'STYLE PROPERTIES MATRIX' "$f" || echo "Missing section in $f"; done`
  Expected: No output

Gate 2: Zero ESCALATE tokens
  Command: `grep -r 'ESCALATE' matrices/ui/molecules/ | grep -v 'FND-007' | wc -l`
  Expected: 0

Gate 3: All 107 matrices present
  Command: `ls matrices/ui/molecules/*.md | wc -l`
  Expected: 107

Gate 4: Atom references resolve
  Command: `grep -h 'matrices/ui/atoms/' matrices/ui/molecules/*.md | while read ref; do [ -f "$ref" ] || echo "Missing: $ref"; done`
  Expected: No output

Gate 5: Token validation
  Command: `pnpm tokens:validate`
  Expected: Exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- FND-001 — atom matrices must exist for composition references
- FND-007 — ESCALATE tokens must be resolved

Blocks:
- FND-003 — organism matrices reference molecule matrices
- FND-008 — atomized tasks reference molecule matrix files

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Molecules compose atoms — COMPOSITION section must list which atoms and how (props, variants)
- Layout is critical — document flexDirection, justifyContent, alignItems, gap, padding explicitly
- Stateful molecules (FormField, ListItem, Card) require exhaustive state documentation
- Touch interaction molecules (ButtonGroup, SegmentedControl) document active/pressed states
