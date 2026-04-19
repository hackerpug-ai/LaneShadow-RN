================================================================================
TASK: FND-004 - Author matrix files for 11 templates + 10 screens + 11 delta compositions
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

Create 32 per-composition STYLE PROPERTIES MATRIX files for templates (layout patterns), screens (navigation + data flow), and delta compositions (migration context), completing the full UI matrix layer.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- matrices/ui/templates/*.md (NEW): 11 template matrices
- matrices/ui/screens/*.md (NEW): 10 screen matrices
- matrices/ui/delta/*.md (NEW): 11 delta composition matrices

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] 32 matrix files exist across templates (11), screens (10), delta (11)
- [ ] Template matrices include LAYOUT COMPOSITION section
- [ ] Screen matrices include NAVIGATION & ROUTING and DATA FLOW sections
- [ ] Delta matrices include DELTA CONTEXT section
- [ ] Zero ESCALATE tokens remain
- [ ] pnpm tokens:validate exits 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Modifying react-native source files
- Authoring atom/molecule/organism matrices (FND-001/002/003)
- Resolving ESCALATE tokens (FND-007)

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Templates MUST include LAYOUT section documenting page-level structure
- Screens MUST include NAVIGATION & ROUTING documenting entry points, params, transitions
- Screens MUST include DATA FLOW section documenting props and data sources
- Delta compositions MUST include DELTA CONTEXT documenting what changed and why
- All 32 compositions MUST have corresponding matrix files

NEVER:
- Treat screens as static layouts — document routing, params, and transitions
- Omit page-level layout properties (padding, scroll, safe areas)
- Use hard-coded values — all properties derive from semantic tokens

STRICTLY:
- Reference organism/molecule/atom matrices in COMPOSITION sections
- Document navigation patterns using platform-specific APIs (NavHost, NavigationStack)
- Validate every token reference against semantic.tokens.json

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Produce 32 page-level design specifications with layout, navigation, and data flow documentation enabling parallel native page implementation.

**Success looks like**: 32 validated matrix files with page-level layout, navigation routing (screens), data flow props (templates/screens), migration context (deltas), zero unresolved tokens, and both platform equivalents.

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

1. Review completed atom/molecule/organism matrices from FND-001/002/003.
2. Audit react-native source for all 32 compositions, documenting layout, navigation, and organism usage.
3. Author 11 template matrices with LAYOUT, TRANSLATION SOURCES, STYLE PROPERTIES MATRIX.
4. Author 10 screen matrices with NAVIGATION & ROUTING, DATA FLOW, TRANSLATION SOURCES, STYLE PROPERTIES MATRIX.
5. Author 11 delta matrices with DELTA CONTEXT, TRANSLATION SOURCES, STYLE PROPERTIES MATRIX.
6. Validate all 32 files: zero ESCALATE tokens, required sections present.

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| # | Statement | Verify |
|---|-----------|--------|
| 1 | 32 matrix files exist | `ls matrices/ui/{templates,screens,delta}/*.md \| wc -l` returns 32 |
| 2 | Every template has LAYOUT section | grep confirms in all 11 template files |
| 3 | Every screen has NAVIGATION & ROUTING section | grep confirms in all 10 screen files |
| 4 | Every delta has DELTA CONTEXT section | grep confirms in all 11 delta files |
| 5 | Zero ESCALATE tokens remain | `grep -r 'ESCALATE' matrices/ui/{templates,screens,delta}/` returns exit 1 |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. matrices/ui/organisms/*.md — Completed organism matrices for composition references
2. react-native/components/templates/ — Template layout patterns
3. react-native/components/screens/ — Screen navigation patterns
4. .spec/prds/native-rewrite/08f-translation-protocol.md — Translation protocol
5. .spec/prds/native-rewrite/08a-atomic-component-catalog.md — Component inventory

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- matrices/ui/templates/*.md (NEW)
- matrices/ui/screens/*.md (NEW)
- matrices/ui/delta/*.md (NEW)

WRITE-PROHIBITED:
- react-native/components/{templates,screens,delta}/** — analysis only
- matrices/ui/{atoms,molecules,organisms}/** — FND-001/002/003 scope

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

**References**: UI-007 template, 08f-translation-protocol, organism/molecule/atom matrices

**Pattern**: NAVIGATION & ROUTING section: | Aspect | RN | Android (Compose) | iOS (SwiftUI) | — documents entry points, params, and transitions.

**Anti-pattern**: Treating screens as static layouts — screens are navigation-aware compositions that must document routing, params, and transitions.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: frontend-designer
**Rationale**: Requires page-level layout analysis and navigation structure understanding for native platform equivalent specification.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All 32 matrices present
  Command: `ls matrices/ui/{templates,screens,delta}/*.md | wc -l`
  Expected: 32

Gate 2: Template sections present
  Command: `for f in matrices/ui/templates/*.md; do grep -q 'LAYOUT' "$f" || echo "Missing LAYOUT: $f"; done`
  Expected: No output

Gate 3: Screen sections present
  Command: `for f in matrices/ui/screens/*.md; do grep -q 'NAVIGATION' "$f" && grep -q 'DATA FLOW' "$f" || echo "Missing: $f"; done`
  Expected: No output

Gate 4: Delta sections present
  Command: `for f in matrices/ui/delta/*.md; do grep -q 'DELTA CONTEXT' "$f" || echo "Missing: $f"; done`
  Expected: No output

Gate 5: Zero ESCALATE tokens
  Command: `grep -r 'ESCALATE' matrices/ui/{templates,screens,delta}/ | grep -v 'FND-007' | wc -l`
  Expected: 0

Gate 6: Token validation
  Command: `pnpm tokens:validate`
  Expected: Exit 0

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- FND-001 — atom matrices for composition references
- FND-002 — molecule matrices for composition references
- FND-003 — organism matrices for composition references
- FND-007 — ESCALATE token resolution

Blocks:
- FND-008 — atomized tasks reference all matrix files

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Templates are reusable page layouts (no data) — document composition and layout only
- Screens are full pages with data and navigation — document data flow props
- Delta compositions are transitional — document what they replace and migration path
- Page-level layout is critical — document padding, scroll, safe areas, keyboard avoidance
