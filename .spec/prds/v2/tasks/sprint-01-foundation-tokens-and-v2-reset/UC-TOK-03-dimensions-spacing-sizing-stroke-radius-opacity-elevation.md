<!-- Task Template v5.1 | INFRA-adapted for sandbox/token foundation work -->

================================================================================
TASK: UC-TOK-03 - Dimensions — spacing / sizing / stroke / radius / opacity / elevation
================================================================================

TASK_TYPE:  INFRA
STATUS:     ✅ Completed
COMPLETED:  2026-04-21T10:25:00Z
COMMIT:     db5494ccf919294beb5833c423097803a85f7c44
REVIEWER:   orchestrator-verified
PRIORITY:   P0
EFFORT:     M
SPRINT:     [sprint-01-foundation-tokens-and-v2-reset](./SPRINT.md)
AGENT:      implementer=shared-tooling (swift-planner + kotlin-planner) | reviewer=design-system-reviewer
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  test:      pnpm test --filter tokens
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched tokens/

PRD_REFS:   UC-TOK-03, .spec/prds/v2/04-uc-tok.md
DEPENDS_ON: (none)
BLOCKS:     UC-TOK-05

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Dimension tokens cover spacing.0..12, sizing.icon.{xs..xl}, stroke, radius, opacity, and elevation with schema-valid semantic entries.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER modify ~/Projects/native-theme/** or ~/Projects/native-sandbox/**.
- MUST follow native-theme primitive shapes for dimension, radius, opacity, elevation.
- MUST cover: spacing.0..12, sizing.icon.{xs, sm, md, lg, xl}, sizing.stroke.*, radius.*, opacity.*, elevation.{card, overlay}.
- STRICTLY no magic numbers in downstream code — LaneShadowTheme surfaces these via generated tokens.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

[ ] tokens/semantic/dimensions.tokens.json covers all six categories — maps to AC-1 (PRIMARY)
[ ] pnpm tokens:validate passes
[ ] Spacing uses a consistent scale (documented in $comment)
[ ] Only tokens/** files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: All six categories present + schema-valid [PRIMARY]
  GIVEN: tokens/semantic/dimensions.tokens.json
  WHEN:  pnpm tokens:validate runs
  THEN:  spacing, sizing, stroke, radius, opacity, elevation all validate

  TDD_STATE:     none
  TEST_FILE:     tokens/semantic/dimensions.tokens.json
  TEST_FUNCTION: n/a
  VERIFY:        pnpm tokens:validate && jq -e '.spacing and .sizing and .radius and .opacity and .elevation' tokens/semantic/dimensions.tokens.json

AC-2: Spacing scale 0..12 complete
  GIVEN: dimensions.tokens.json
  WHEN:  jq queries spacing keys
  THEN:  keys 0 through 12 all present with numeric values

  TDD_STATE:     none
  TEST_FILE:     tokens/semantic/dimensions.tokens.json
  TEST_FUNCTION: n/a
  VERIFY:        jq -e '[.spacing | keys[]] | sort == ["0","1","10","11","12","2","3","4","5","6","7","8","9"]' tokens/semantic/dimensions.tokens.json

AC-3: Icon sizing xs..xl present (edge)
  GIVEN: dimensions.tokens.json
  WHEN:  jq queries sizing.icon
  THEN:  xs, sm, md, lg, xl all present as numbers

  TDD_STATE:     none
  TEST_FILE:     tokens/semantic/dimensions.tokens.json
  TEST_FUNCTION: n/a
  VERIFY:        jq -e '.sizing.icon.xs and .sizing.icon.sm and .sizing.icon.md and .sizing.icon.lg and .sizing.icon.xl' tokens/semantic/dimensions.tokens.json

AC-4: Negative elevation rejected (error path)
  GIVEN: fixture with elevation.card = -1
  WHEN:  validator runs
  THEN:  exits non-zero

  TDD_STATE:     none
  TEST_FILE:     tokens/__fixtures__/invalid-negative-elevation.json
  TEST_FUNCTION: n/a
  VERIFY:        node tokens/scripts/validate.ts --fixture tokens/__fixtures__/invalid-negative-elevation.json || test $? -ne 0


--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- tokens/semantic/dimensions.tokens.json (NEW) — spacing/sizing/stroke/radius/opacity/elevation
- tokens/__fixtures__/invalid-negative-elevation.json (NEW) — negative fixture

writeProhibited:
- ~/Projects/native-sandbox/** (never modify sibling projects)
- ~/Projects/native-theme/** (never modify sibling projects)
- ios/**, android/app/src/** — generated downstream by TOK-05
- server/**, react-native/** — out of scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use consistent scale (document in $comment)
- Match native-theme primitive shapes exactly

⚠️ Ask First:
- Extending spacing beyond 12
- Adding a 7th dimension category

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- tokens/semantic/dimensions.tokens.json (NEW): six-category dimension tokens

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-03-dimensions.html [PRIMARY]
   - Lines: all
   - Focus: REQUIRED READING — dimension system visual source
2. .spec/prds/v2/04-uc-tok.md
   - Lines: UC-TOK-03
   - Focus: category definitions + scale
3. ~/Projects/native-theme/schema/common.schema.json
   - Lines: dimension/radius/opacity/elevation sections
   - Focus: schema contracts
4. ~/Projects/native-theme/README.md
   - Lines: dimension section
   - Focus: primitive shapes

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References:
- /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-03-dimensions.html

Interaction notes:
- REQUIRED READING: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-03-dimensions.html

Pattern (to imitate):
```
{ "spacing": { "0":0, "1":4, "2":8 }, "radius": { "sm":6, "md":12 }, "elevation": { "card":2, "overlay":16 } }
```

Pattern source: ~/Projects/native-theme/schema/common.schema.json

Anti-pattern (to avoid):
Introducing ad-hoc keys outside spacing/sizing/stroke/radius/opacity/elevation categories.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

INFRA token-authoring task — draft JSON, validate, commit.

### IMPLEMENTATION STEPS (INFRA — run in order)

1. 1. Read uc-tok-03-dimensions.html
2. 2. Draft dimensions.tokens.json with all six categories
3. 3. Author negative fixture
4. 4. pnpm tokens:validate
5. 5. Commit

### VERIFICATION CHECKLIST

- [ ] schema valid
    - Command: `pnpm tokens:validate`
    - Expected: Exit 0
- [ ] spacing 0..12
    - Command: `jq '.spacing | keys | length' tokens/semantic/dimensions.tokens.json`
    - Expected: 13

--------------------------------------------------------------------------------
VERIFICATION GATES (run before declaring DONE)
--------------------------------------------------------------------------------

- **Tokens validate** — `pnpm tokens:validate` → Exit 0
- **Typecheck** — `pnpm type-check:native` → Exit 0
- **Lint** — `pnpm exec biome check --no-errors-on-unmatched tokens/` → no errors

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

Implementer: **shared-tooling (swift-planner + kotlin-planner)**
Rationale: Dimension tokens are numeric scalars emitted identically across platforms via TOK-05 — fast, well-scoped.
Reviewer: **design-system-reviewer**

--------------------------------------------------------------------------------
CODING STANDARDS
--------------------------------------------------------------------------------

- /Users/justinrich/Projects/LaneShadow/CLAUDE.md
- /Users/justinrich/Projects/LaneShadow/RULES.md
- ~/Projects/native-sandbox/RULES.md
- ~/Projects/native-theme/README.md
- ~/.claude/CLAUDE.md (commit discipline)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

Scale decision documented in $comment — spacing should follow 4px-based progression.
