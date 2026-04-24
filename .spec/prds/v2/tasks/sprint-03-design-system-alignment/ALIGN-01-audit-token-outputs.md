<!-- Template Version: 5.1.0 | Sprint: sprint-03-design-system-alignment | Type: INFRA -->

================================================================================
TASK: ALIGN-01 — Legacy Theme + Token Drift Audit for Second-Theme Migration
================================================================================

TASK_TYPE:  INFRA
STATUS:     COMPLETE
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-planner + kotlin-planner | reviewer=swift-reviewer + kotlin-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   04-uc-tok.md, .spec/design/system/tokens/

RUNTIME_COMMANDS:
  test:      test -f .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md
  typecheck: (n/a — documentation task)
  lint:      (n/a)

PROGRESS: AC-1 none · 0/5 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

drift-report.md enumerates every token key in theme.light.json and theme.dark.json that is missing, wrong-valued, or naming-mismatched in Tokens.swift and Tokens.kt, plus the legacy-theme assumptions that would block a clean second-theme migration.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compare every key in theme.light.json and theme.dark.json against Tokens.swift AND Tokens.kt.
- MUST list every missing key by full dotted path with expected light/dark values.
- MUST produce drift-report.md at .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md.
- MUST call out any legacy-theme dependency that would prevent atoms from moving to Copper as a second theme.
- NEVER modify any generated token file, generate.ts, or semantic JSON — audit only.
- NEVER produce iOS or Android production code.
- STRICTLY: Report covers both platforms in separate columns.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] AC-1: drift-report.md covers surface.* and border.* gaps (scrim-soft, border.glass) (PRIMARY)
- [x] AC-2: Report covers all map.* keys including map.style.light/dark
- [x] AC-3: Report covers sizing.stroke.sm/md/lg
- [x] AC-4: Report covers signal.hover and status.*-tint keys
- [x] AC-5: Android column + naming-mismatch section present
- [x] No production Swift or Kotlin files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Surface/border gaps documented [PRIMARY]
  GIVEN: theme.light.json / theme.dark.json are authoritative
  WHEN:  agent reads both and compares Tokens.swift/Tokens.kt
  THEN:  drift-report.md contains MISSING rows for surface.scrim-soft and border.glass with expected light (rgba(34,24,16,0.18), rgba(255,255,255,0.55)) and dark (rgba(10,6,3,0.28), rgba(242,238,232,0.22)) values
  VERIFY: grep 'surface.scrim-soft\|border.glass' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md

AC-2: map.* gaps documented
  GIVEN: map.paper/contour/contour-faint in theme JSONs; map.style.light/dark in mapbox.tokens.json
  WHEN:  agent audits Tokens.swift and Tokens.kt
  THEN:  drift-report.md has MISSING rows for map.paper, map.contour, map.contour-faint, map.style.light, map.style.dark
  VERIFY: grep 'map.paper\|map.contour\|map.style' drift-report.md | wc -l (expect ≥5)

AC-3: sizing.stroke documented
  GIVEN: sizing.stroke.sm=1, md=2, lg=3 in dimensions.tokens.json
  WHEN:  agent audits Tokens.swift/Tokens.kt
  THEN:  drift-report.md has MISSING rows for sizing.stroke.sm, sizing.stroke.md, sizing.stroke.lg
  VERIFY: grep 'sizing.stroke' drift-report.md | wc -l (expect 3)

AC-4: signal/status-tint gaps documented
  GIVEN: signal.hover + status.*-tint in theme JSONs
  WHEN:  agent audits both platform files
  THEN:  drift-report.md has rows for signal.hover and all status.*-tint variants
  VERIFY: grep 'signal.hover\|status.*tint' drift-report.md

AC-5: Android column + naming-mismatch section
  GIVEN: Tokens.kt may differ from Tokens.swift naming
  WHEN:  agent audits both
  THEN:  drift-report.md has Android status column + naming-mismatch section documenting camelCase vs kebab-case divergences
  VERIFY: grep -i 'android\|kotlin\|naming.mismatch\|camelCase' drift-report.md

--------------------------------------------------------------------------------
TEST CRITERIA (boolean)
--------------------------------------------------------------------------------

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | drift-report.md exists at the specified path | AC-1 | test -f .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md |
| TC-2 | drift-report.md contains ≥12 distinct MISSING rows | AC-1 | grep -c 'MISSING' drift-report.md (≥12) |
| TC-3 | surface.scrim-soft row has expected light rgba(34,24,16,0.18) | AC-1 | grep 'scrim-soft' drift-report.md \| grep 'rgba(34,24,16,0.18)' |
| TC-4 | map.style.light and map.style.dark rows both present | AC-2 | grep 'map.style.light\|map.style.dark' drift-report.md \| wc -l = 2 |
| TC-5 | sizing.stroke.md row records expected value 2 | AC-3 | grep 'sizing.stroke.md' drift-report.md \| grep '\b2\b' |
| TC-6 | No production Swift or Kotlin files modified | AC-1 | git diff --name-only \| grep -vE 'drift-report\.md' \| grep -E '\.swift\|\.kt' \| wc -l = 0 |

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

1. Read theme.light.json + theme.dark.json — enumerate every key path.
2. Read Tokens.swift — map each key to its generated Swift constant; note MISSING, WRONG_VALUE, NAMING_MISMATCH.
3. Read Tokens.kt — same audit for Android.
4. Write drift-report.md with table: | Key Path | Expected Light | Expected Dark | iOS Status | Android Status |
5. Add naming-mismatch section documenting camelCase↔kebab-case gaps.
6. Verify no Swift/Kotlin files modified in git diff.

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md (NEW)

writeProhibited:
- tokens/platforms/** — audit only, no code changes
- tokens/scripts/generate.ts
- tokens/semantic/**
- ios/**, android/**

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use theme JSON key path as canonical name in report rows
- Document every gap as a discrete table row

⚠️ Ask First:
- If a token appears in Tokens.swift/Tokens.kt but not in theme JSONs (unexpected — flag for discussion)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md (NEW)

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/tokens/theme.light.json [PRIMARY PATTERN]
   - Lines: 1-162
   - Focus: Canonical source for light-mode values

2. .spec/design/system/tokens/theme.dark.json [PRIMARY PATTERN]
   - Lines: 1-162
   - Focus: Canonical source for dark-mode values

3. tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
   - Lines: 284-544
   - Focus: Current iOS output — check for missing groups

4. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt
   - Lines: 1-293
   - Focus: Current Android output for cross-platform comparison

5. tokens/semantic/mapbox.tokens.json
   - Lines: 1-21
   - Focus: Confirm map.style URLs not emitted to Tokens.swift/Kt

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/tokens/theme.light.json, theme.dark.json

Interaction notes:
- REQUIRED READING: Both theme JSONs must be read in their entirety
- Rows use theme JSON key path as canonical name (surface.scrim-soft), not Swift camelCase

Pattern: Table — | Key Path | Expected Light | Expected Dark | iOS Status | Android Status |
Pattern source: .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/SPRINT.md
Anti-pattern: Do not flatten missing keys into prose — every gap is a discrete row.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (Report exists): `test -f drift-report.md` exits 0.
Gate 2 (Coverage): `grep -c 'MISSING' drift-report.md` ≥ 12.
Gate 3 (No code modified): `git diff --name-only | grep -E '\.swift|\.kt' | wc -l` = 0.
Gate 4 (Android column present): `grep -i 'android\|kotlin' drift-report.md` returns hits.
Gate 5 (Naming-mismatch section): `grep -i 'naming.mismatch\|camelCase' drift-report.md` returns hits.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     ALIGN-02-ios, ALIGN-02-android (both consume drift-report.md as second-theme migration source of truth)
Parallel:   (none — root of dependency tree)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN theme.light.json and theme.dark.json WHEN agent reads both and compares Tokens.swift/Tokens.kt THEN drift-report.md has MISSING rows for surface.scrim-soft and border.glass with correct expected values", "verify": "grep 'surface.scrim-soft\\|border.glass' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN map.paper/contour/contour-faint and map.style.light/dark WHEN agent audits Tokens.swift/Kt THEN drift-report.md has MISSING rows for all five map.* keys", "verify": "grep 'map.paper\\|map.contour\\|map.style' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | wc -l | awk '{if($1>=5) print \"PASS\"; else print \"FAIL\"}'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN sizing.stroke.sm/md/lg in dimensions.tokens.json WHEN agent audits THEN drift-report.md has MISSING rows for all three sizing.stroke keys", "verify": "grep 'sizing.stroke' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | wc -l | grep '^3$'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN signal.hover + status.*-tint WHEN agent audits THEN drift-report.md has rows for signal.hover and all status tint variants", "verify": "grep 'signal.hover\\|status.*tint' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN Tokens.kt may differ from Tokens.swift WHEN agent reads both THEN drift-report.md has Android column and naming-mismatch section", "verify": "grep -i 'android\\|kotlin\\|naming.mismatch\\|camelCase' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md" },
    { "id": "TC-1", "type": "test_criterion", "description": "drift-report.md exists at the specified path", "maps_to_ac": "AC-1", "verify": "test -f .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md" },
    { "id": "TC-2", "type": "test_criterion", "description": "drift-report.md contains at least 12 distinct MISSING rows", "maps_to_ac": "AC-1", "verify": "grep -c 'MISSING' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md" },
    { "id": "TC-3", "type": "test_criterion", "description": "surface.scrim-soft row has expected light rgba(34,24,16,0.18)", "maps_to_ac": "AC-1", "verify": "grep 'scrim-soft' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | grep 'rgba(34,24,16,0.18)'" },
    { "id": "TC-4", "type": "test_criterion", "description": "map.style.light and map.style.dark rows both present in drift-report.md", "maps_to_ac": "AC-2", "verify": "grep 'map.style.light\\|map.style.dark' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | wc -l | grep '^2$'" },
    { "id": "TC-5", "type": "test_criterion", "description": "sizing.stroke.md row records expected value 2", "maps_to_ac": "AC-3", "verify": "grep 'sizing.stroke.md' .spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md | grep '\\b2\\b'" },
    { "id": "TC-6", "type": "test_criterion", "description": "No production Swift or Kotlin files modified by this task", "maps_to_ac": "AC-1", "verify": "git diff --name-only | grep -vE 'drift-report\\.md' | grep -E '\\.swift|\\.kt' | wc -l | grep '^0$'" }
  ]
}
-->
