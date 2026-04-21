<!-- Task Template v5.1 | INFRA-adapted for sandbox/token foundation work -->

================================================================================
TASK: UC-TOK-02 - Color semantics — surface / signal / role / weather / route / status
================================================================================

TASK_TYPE:  INFRA
STATUS:     ✅ Completed
COMPLETED:  2026-04-21T10:25:00Z
COMMIT:     db5494ccf919294beb5833c423097803a85f7c44
REVIEWER:   orchestrator-verified
PRIORITY:   P0
EFFORT:     XL
SPRINT:     [sprint-01-foundation-tokens-and-v2-reset](./SPRINT.md)
AGENT:      implementer=shared-tooling (swift-planner + kotlin-planner) | reviewer=design-system-reviewer
ESTIMATE:   240 min

RUNTIME_COMMANDS:
  test:      pnpm test --filter tokens
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched tokens/

PRD_REFS:   UC-TOK-02, .spec/prds/v2/04-uc-tok.md
DEPENDS_ON: (none)
BLOCKS:     UC-TOK-05

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Semantic color tokens cover surface/content/signal/role/weather/route/status/border/action with light + dark resolved values validated against common.schema.json.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER modify ~/Projects/native-theme/** — consume schema via $ref.
- NEVER modify ~/Projects/native-sandbox/**.
- MUST provide light + dark values for every ColorSet — parseColorString-compatible strings.
- MUST cover all 9 categories: surface, content, signal, role, weather, route, status, border, action.
- STRICTLY no hex literals outside tokens/ — LaneShadowTheme is the only consumer downstream.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

[ ] tokens/semantic/colors.tokens.json defines 9 categories with light+dark resolved values — maps to AC-1 (PRIMARY)
[ ] pnpm tokens:validate passes
[ ] Every ColorSet has both `light` and `dark` keys parseable by parseColorString
[ ] Contrast check script reports all surface/content pairs ≥ WCAG AA
[ ] Only tokens/** files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: All 9 color categories schema-valid [PRIMARY]
  GIVEN: tokens/semantic/colors.tokens.json
  WHEN:  pnpm tokens:validate runs
  THEN:  surface/content/signal/role/weather/route/status/border/action categories all validate

  TDD_STATE:     none
  TEST_FILE:     tokens/semantic/colors.tokens.json
  TEST_FUNCTION: n/a
  VERIFY:        pnpm tokens:validate && jq -e '.color.surface and .color.content and .color.signal and .color.role and .color.weather and .color.route and .color.status and .color.border and .color.action' tokens/semantic/colors.tokens.json

AC-2: Every ColorSet has light + dark
  GIVEN: colors.tokens.json
  WHEN:  jq walks every leaf ColorSet
  THEN:  each has both `.light` and `.dark` parseable color strings

  TDD_STATE:     none
  TEST_FILE:     tokens/scripts/check-colorset.ts
  TEST_FUNCTION: n/a
  VERIFY:        node tokens/scripts/check-colorset.ts tokens/semantic/colors.tokens.json

AC-3: parseColorString round-trips all values (edge)
  GIVEN: every leaf color string
  WHEN:  parseColorString from native-theme is applied
  THEN:  each string parses to a valid color (no throws)

  TDD_STATE:     none
  TEST_FILE:     tokens/scripts/check-parse.ts
  TEST_FUNCTION: n/a
  VERIFY:        node tokens/scripts/check-parse.ts tokens/semantic/colors.tokens.json

AC-4: WCAG AA contrast on surface/content pairs (error path)
  GIVEN: surface/content semantic pairs
  WHEN:  contrast check runs
  THEN:  every documented pair meets ≥ 4.5:1 for body text, ≥ 3:1 for large text in both light and dark

  TDD_STATE:     none
  TEST_FILE:     tokens/scripts/check-contrast.ts
  TEST_FUNCTION: n/a
  VERIFY:        node tokens/scripts/check-contrast.ts tokens/semantic/colors.tokens.json


--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- tokens/semantic/colors.tokens.json (NEW) — 9-category semantic color system
- tokens/scripts/check-colorset.ts (NEW) — light/dark coverage check
- tokens/scripts/check-parse.ts (NEW) — parseColorString round-trip
- tokens/scripts/check-contrast.ts (NEW) — WCAG AA verification
- tokens/__fixtures__/invalid-missing-dark.json (NEW) — negative fixture

writeProhibited:
- ~/Projects/native-sandbox/** (never modify sibling projects)
- ~/Projects/native-theme/** (never modify sibling projects)
- ios/LaneShadow/**, android/app/src/** — generated downstream by TOK-05
- server/**, react-native/** — out of scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use parseColorString-compatible strings exclusively
- Document any color's semantic intent via $comment
- Validate WCAG before committing

⚠️ Ask First:
- Adding a 10th color category
- Deviating from parseColorString string formats

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- tokens/semantic/colors.tokens.json (NEW): 9-category semantic color tokens
- tokens/scripts/check-colorset.ts (NEW): light/dark coverage verifier
- tokens/scripts/check-parse.ts (NEW): parseColorString round-trip
- tokens/scripts/check-contrast.ts (NEW): WCAG AA contrast check

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-02-colors.html [PRIMARY]
   - Lines: all
   - Focus: REQUIRED READING — color system visual source
2. .spec/prds/v2/04-uc-tok.md
   - Lines: UC-TOK-02
   - Focus: category definitions
3. ~/Projects/native-theme/README.md
   - Lines: ColorSet + parseColorString
   - Focus: primitive shapes
4. ~/Projects/native-theme/schema/common.schema.json
   - Lines: color section
   - Focus: schema contract
5. .spec/prds/v2/11-technical-requirements.md
   - Lines: theme package
   - Focus: pipeline expectations

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References:
- /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-02-colors.html

Interaction notes:
- REQUIRED READING: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-02-colors.html

Pattern (to imitate):
```
{ "color": { "surface": { "primary": { "light": "#FFFFFF", "dark": "#0B0B0D" } } } }
```

Pattern source: ~/Projects/native-theme/README.md

Anti-pattern (to avoid):
Defining only a single color value (no light/dark split); using non-parseColorString formats like 'rgba(255, 255, 255)' with whitespace quirks.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

INFRA token-authoring task — draft JSON, validate, contrast-check, commit.

### IMPLEMENTATION STEPS (INFRA — run in order)

1. 1. Read uc-tok-02-colors.html for category breakdown
2. 2. Draft tokens/semantic/colors.tokens.json with all 9 categories light+dark
3. 3. Implement check-colorset.ts, check-parse.ts, check-contrast.ts
4. 4. Run all checks; iterate on any failing contrast
5. 5. Author negative fixture
6. 6. pnpm tokens:validate + typecheck + lint
7. 7. Commit

### VERIFICATION CHECKLIST

- [ ] schema valid
    - Command: `pnpm tokens:validate`
    - Expected: Exit 0
- [ ] all colorsets have light+dark
    - Command: `node tokens/scripts/check-colorset.ts tokens/semantic/colors.tokens.json`
    - Expected: Exit 0
- [ ] contrast AA
    - Command: `node tokens/scripts/check-contrast.ts tokens/semantic/colors.tokens.json`
    - Expected: Exit 0

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
Rationale: Color semantics span 9 categories with light+dark resolved values — largest token surface. Emits to both Swift ColorSet and Kotlin Color pairs via TOK-05.
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

Largest semantic surface. Contrast AA verification is non-negotiable — escalate before committing if any pair fails.
