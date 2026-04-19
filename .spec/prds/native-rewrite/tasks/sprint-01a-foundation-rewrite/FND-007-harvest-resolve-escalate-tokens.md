================================================================================
TASK: FND-007 - Harvest and resolve ~54 ESCALATE tokens
================================================================================

TASK_TYPE: FEATURE
STATUS: Complete
PRIORITY: P0
EFFORT: M
ESTIMATE: 240 min
AGENT: frontend-designer
SPRINT: sprint-01a-foundation-rewrite

--------------------------------------------------------------------------------
GOAL
--------------------------------------------------------------------------------

Eliminate all design ambiguity by resolving every ESCALATE token to a concrete semantic value, updating the token source of truth, and ensuring both Android and iOS platforms can access all tokens.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- .spec/prds/native-rewrite/sprint-01a/DECISIONS.md (NEW): Token resolution decisions with rationale
- tokens/semantic/semantic.tokens.json (MODIFY): New semantic tokens
- Android theme accessors (MODIFY): Including elevation gap fix
- iOS theme accessors (MODIFY): Missing token accessors

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] All ~54 ESCALATE tokens harvested with context
- [ ] DECISIONS.md documents every token resolution with rationale
- [ ] tokens/semantic/semantic.tokens.json updated with new tokens
- [ ] Android LaneShadowTheme.elevation accessor implemented
- [ ] iOS theme provides all documented tokens
- [ ] `pnpm tokens:validate` exits 0
- [ ] `pnpm tokens:sync` exits 0
- [ ] Zero ESCALATE tokens remain unresolved

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Authoring component matrices (FND-001 through FND-004)
- Modifying react-native component source files
- Writing native UI implementation code

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST:
- Harvest ALL ESCALATE tokens from RN source files with context (file, line, usage)
- Resolve each to a semantic token value or explicit design decision
- Document every resolution with rationale in DECISIONS.md
- Follow existing naming convention: $category-property-variant[-state]
- Add Android LaneShadowTheme.elevation accessor (known gap from Sprint 1)
- Add iOS theme accessors where missing
- Run pnpm tokens:validate and pnpm tokens:sync after all changes

NEVER:
- Leave ESCALATE tokens unresolved — FND-001 through FND-004 depend on complete resolution
- Use hard-coded values in components instead of semantic tokens
- Add semantic tokens without updating platform accessors
- Skip documenting design rationale

STRICTLY:
- Follow 08e-cross-platform-theme-module.md token pipeline
- Use semantic.tokens.json as single source of truth
- Add platform accessors following existing patterns (08b, 08c)

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective**: Resolve all outstanding ESCALATE token requests by defining new semantic tokens or documenting design decisions, then implement platform accessors including the missing Android elevation support.

**Success looks like**: Zero ESCALATE tokens remain, semantic.tokens.json is updated, platform accessors expose every token on both Android and iOS, and sprint DECISIONS.md documents all resolution rationale.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: ESCALATE tokens harvested
  GIVEN: The codebase contains ~54 ESCALATE token requests
  WHEN: The agent sweeps for ESCALATE tokens
  THEN: All tokens are harvested with file path, line number, and context
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-2: Token resolution decisions documented
  GIVEN: All ESCALATE tokens are harvested
  WHEN: The agent reviews each token and resolves it
  THEN: Every token has a resolution in DECISIONS.md with rationale
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-3: Semantic tokens added to schema
  GIVEN: Token resolutions are documented
  WHEN: The agent updates semantic.tokens.json
  THEN: All new tokens follow naming convention and validate successfully
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-4: Android elevation accessor implemented
  GIVEN: New semantic tokens are defined
  WHEN: The agent updates LaneShadowTheme
  THEN: Theme includes accessors for all tokens including elevation
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-5: iOS theme accessors implemented
  GIVEN: New semantic tokens are defined
  WHEN: The agent updates iOS theme extensions
  THEN: All semantic tokens are accessible via iOS theme extensions
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

AC-6: Token synchronization completes
  GIVEN: All changes are made
  WHEN: The agent runs pnpm tokens:sync
  THEN: Platform files update and no validation errors occur
  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| # | Statement | Maps to AC | Verify |
|---|-----------|:----------:|--------|
| 1 | Zero ESCALATE tokens remain in codebase | AC-1 | `grep -r 'ESCALATE' react-native/components/ \| grep -v 'FND-007' \| wc -l` returns 0 |
| 2 | DECISIONS.md documents all token resolutions | AC-2 | File exists with > 50 token entries |
| 3 | semantic.tokens.json validates | AC-3 | `pnpm tokens:validate` exits 0 |
| 4 | Android elevation accessor exists | AC-4 | `grep -r 'val elevation' android/.../LaneShadowTheme.kt` returns match |
| 5 | Token sync succeeds | AC-6 | `pnpm tokens:sync` exits 0 |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. tokens/semantic/semantic.tokens.json — Lines 1-500, existing token structure and naming
2. .spec/prds/native-rewrite/08e-cross-platform-theme-module.md — Token architecture
3. .spec/prds/native-rewrite/08b-android-component-map.md — Android theme patterns
4. .spec/prds/native-rewrite/08c-ios-component-map.md — iOS theme patterns
5. react-native/components/** — ESCALATE token locations (grep for discovery)

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED:
- tokens/semantic/semantic.tokens.json (MODIFY) — Add new semantic tokens
- android/app/src/main/java/com/laneshadow/theme/LaneShadowTheme.kt (MODIFY) — Add accessors
- ios/LaneShadow/Theme/** (MODIFY) — Add accessors
- .spec/prds/native-rewrite/sprint-01a/DECISIONS.md (NEW) — Document decisions
- tokens/android/*.tokens.json (MODIFY via pnpm tokens:sync)
- tokens/ios/*.tokens.json (MODIFY via pnpm tokens:sync)

WRITE-PROHIBITED:
- react-native/lib/components/** — Do not modify component source files
- matrices/ui/** — Do not modify matrices

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

**References**: 08e-cross-platform-theme-module, 08b-android-component-map, 08c-ios-component-map, semantic.tokens.json

**Pattern**: Harvest-resolve-document-update: (1) grep all ESCALATEs with context, (2) resolve to semantic values, (3) document in DECISIONS.md with rationale, (4) update semantic.tokens.json, (5) add missing platform accessors, (6) validate.

**Anti-pattern**: Resolving ESCALATE to hard-coded values; forgetting platform accessors (tokens exist but unreachable from Kotlin/Swift); documenting without rationale.

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: frontend-designer
**Rationale**: Requires design system expertise to make token naming/value decisions and implement theme accessors across both platforms.

**Review Agent**: react-native-ui-reviewer — validates theme accessor patterns

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Zero ESCALATE tokens
  Command: `grep -r 'ESCALATE' react-native/components/ | grep -v 'FND-007' | wc -l`
  Expected: 0

Gate 2: Token validation
  Command: `pnpm tokens:validate`
  Expected: Exit 0

Gate 3: Token sync
  Command: `pnpm tokens:sync`
  Expected: Exit 0

Gate 4: Android elevation accessor
  Command: `grep -r 'val elevation' android/app/src/main/java/com/laneshadow/theme/`
  Expected: Match found

Gate 5: DECISIONS.md present
  Command: `test -f .spec/prds/native-rewrite/sprint-01a/DECISIONS.md && wc -l .spec/prds/native-rewrite/sprint-01a/DECISIONS.md`
  Expected: File exists with > 50 lines

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On: (none — should run first to unblock FND-001 through FND-004)

Blocks:
- FND-001 — matrix authoring requires resolved tokens
- FND-002 — molecule matrices require resolved tokens
- FND-003 — organism matrices require resolved tokens
- FND-004 — composition matrices require resolved tokens
- FND-008 — atomized tasks require resolved tokens

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- ESCALATE tokens represent design gaps — resolution requires design judgment
- Elevation tokens are the largest category (known Android gap)
- Platform-specific differences (Android elevation vs iOS shadow) documented in DECISIONS.md
- Token resolution should prioritize semantic meaning over pixel values
- This task is the critical path — all matrix authoring tasks depend on it
