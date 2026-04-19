================================================================================
TASK: FND-001 - Author STYLE PROPERTIES MATRIX files for all 42 RN atoms
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

Create 42 per-atom STYLE PROPERTIES MATRIX files that serve as the single source of truth for native platform translation, enabling parallel Kotlin/Swift implementation with zero mid-task design decisions.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- matrices/ui/atoms/*.md (NEW): 42 matrix files, one per atomic component
- .spec/prds/native-rewrite/sprint-01a/DECISIONS.md (MODIFY): Token resolution decisions if needed

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] 42 matrix files exist under matrices/ui/atoms/*.md
- [ ] Every file has TRANSLATION SOURCES, STYLE PROPERTIES MATRIX, and NOTES sections
- [ ] Zero ESCALATE tokens remain (all resolved or reference FND-007 decisions)
- [ ] Every property maps to both Android Compose and iOS SwiftUI equivalents
- [ ] pnpm tokens:validate exits 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Modifying react-native/components/atoms/* source files
- Authoring molecule or organism matrices (FND-002, FND-003)
- Resolving ESCALATE tokens (FND-007 owns this — must complete first)

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Use EXACT UI-007 template format from tasks/sprint-02-ui-component-translation/UI-007-android-atoms-2-5-form-controls.md
- Resolve ALL visual properties to semantic tokens (no ESCALATE allowed post-FND-007)
- Map each property to BOTH Kotlin Compose AND SwiftUI equivalents
- Reference source RN component file path in TRANSLATION SOURCES
- Include variant-specific properties (pressed, focused, disabled, error states)

NEVER:
- Leave ESCALATE placeholders unresolved
- Omit spacing/padding/margin properties or state-specific styles
- Use hard-coded values instead of semantic token references
- Assume Android/iOS parity without verifying both platform mappings

STRICTLY:
- Follow Photocopy Translation Protocol (08f) matrix structure
- Include STYLE PROPERTIES MATRIX table with columns: Property, RN Source, Semantic Token, Android Compose, iOS SwiftUI
- Document platform-specific limitations in NOTES section

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Produce 42 per-atom design specifications enabling parallel native implementation without mid-task design decisions.

**Success looks like**: 42 matrix files at matrices/ui/atoms/{ComponentName}.md, each with zero ESCALATE tokens, every RN visual property mapped to semantic tokens, and both platform equivalents documented. Implementers can author components using ONLY the matrix + RN source file.

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

1. Read UI-007 gold-standard template to internalize required format and property granularity.
2. Read 08a-atomic-component-catalog.md to extract full list of 42 atoms with RN source paths.
3. For each atom: read RN source, extract ALL styled properties, map to semantic tokens, document unresolved ESCALATEs.
4. Map each semantic token to Android Compose (08b) and iOS SwiftUI (08c) equivalents.
5. Author matrix file at matrices/ui/atoms/{ComponentName}.md following UI-007 structure.
6. Validate: zero ESCALATE tokens, both platform mappings present, source paths cited.

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| # | Statement | Verify |
|---|-----------|--------|
| 1 | 42 matrix files exist at matrices/ui/atoms/*.md | `ls matrices/ui/atoms/*.md \| wc -l` returns 42 |
| 2 | Every file contains TRANSLATION SOURCES, STYLE PROPERTIES MATRIX, NOTES | grep all sections present in every file |
| 3 | Zero ESCALATE tokens remain | `grep -r 'ESCALATE' matrices/ui/atoms/` returns exit 1 |
| 4 | Every property includes both Android and iOS equivalents | grep confirms both platform columns populated |
| 5 | All RN source file paths are valid | Cited paths resolve to existing files |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-007-android-atoms-2-5-form-controls.md
   - Lines: ALL
   - Focus: Gold-standard matrix template structure

2. tokens/semantic/semantic.tokens.json
   - Lines: 1-500
   - Focus: Available semantic token names and value types

3. react-native/components/atoms/
   - Focus: Component prop interfaces to map in TRANSLATION SOURCES

4. .spec/prds/native-rewrite/08f-translation-protocol.md
   - Lines: ALL
   - Focus: Photocopy Translation Protocol rules

5. .spec/prds/native-rewrite/08a-atomic-component-catalog.md
   - Lines: 1-100
   - Focus: Atomic component classification and inventory

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- matrices/ui/atoms/*.md (NEW)
- .spec/prds/native-rewrite/sprint-01a/DECISIONS.md (MODIFY — token decisions only)

WRITE-PROHIBITED:
- react-native/components/atoms/** — source files for analysis only
- matrices/ui/molecules/** — FND-002 scope
- matrices/ui/organisms/** — FND-003 scope
- tokens/semantic/semantic.tokens.json — FND-007 scope

MUST:
- Follow existing code patterns from READING LIST
- Minimal implementation (no over-engineering)
- Tests verify behavior, not implementation

MUST NOT:
- Add features beyond requirements
- Modify unrelated files
- Skip any step

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

**References**: UI-007 template, 08f-translation-protocol, 08e-cross-platform-theme-module, 08b-android-component-map, 08c-ios-component-map

**Pattern**: Per-atom markdown matrix with three sections: (1) TRANSLATION SOURCES citing RN component paths, (2) STYLE PROPERTIES MATRIX table mapping every RN style property to semantic token and platform equivalents, (3) NOTES documenting platform gaps, state behavior, and variant-specific overrides.

**Anti-pattern**: Leaving properties unmapped with TODO comments; omitting state-specific styles; using hard-coded values instead of semantic tokens.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: frontend-designer
**Rationale**: Requires UI/UX system analysis, visual property extraction, semantic token mapping, and native platform equivalent specification — core frontend design system work.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Matrix file structure validation
  Command: `for f in matrices/ui/atoms/*.md; do grep -q 'TRANSLATION SOURCES' "$f" && grep -q 'STYLE PROPERTIES MATRIX' "$f" && grep -q 'NOTES' "$f" || echo "Missing section in $f"; done`
  Expected: No output

Gate 2: Zero unresolved ESCALATE tokens
  Command: `grep -r 'ESCALATE' matrices/ui/atoms/ | grep -v 'FND-007' | wc -l`
  Expected: 0

Gate 3: All 42 matrices present
  Command: `ls matrices/ui/atoms/*.md | wc -l`
  Expected: 42

Gate 4: Source path validity
  Command: `grep -h 'react-native/components/atoms/' matrices/ui/atoms/*.md | sort -u | while read path; do test -f "$path" || echo "Invalid: $path"; done`
  Expected: No output

Gate 5: Token validation
  Command: `pnpm tokens:validate`
  Expected: Exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- FND-007 — ESCALATE token resolution must complete first

Blocks:
- FND-002 — molecule matrices reference atom matrices
- FND-008 — atomized tasks reference atom matrix files

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Atoms have no internal state — focus on static properties and state variants
- Form control atoms (Button, Input, Checkbox) require exhaustive state documentation
- Typography atoms (Text, Heading) map directly to semantic typography tokens
- Spacing atoms (Spacer, Divider) are dimension-critical — include exact pixel values from tokens
