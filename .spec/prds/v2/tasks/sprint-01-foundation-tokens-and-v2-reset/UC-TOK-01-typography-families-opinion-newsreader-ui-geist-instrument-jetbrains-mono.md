<!-- Task Template v5.1 | INFRA-adapted for sandbox/token foundation work -->

================================================================================
TASK: UC-TOK-01 - Typography families — opinion (Newsreader) / ui (Geist) / instrument (JetBrains Mono)
================================================================================

TASK_TYPE:  INFRA
STATUS:     ✅ Completed
COMPLETED:  2026-04-21T10:25:00Z
COMMIT:     16b2c60d12028983a8a5c2c178ed4a77258e4b2d
REVIEWER:   orchestrator-verified
PRIORITY:   P0
EFFORT:     L
SPRINT:     [sprint-01-foundation-tokens-and-v2-reset](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   180 min

RUNTIME_COMMANDS:
  test:      pnpm test --filter tokens
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched tokens/

PRD_REFS:   UC-TOK-01, .spec/prds/v2/04-uc-tok.md, .spec/prds/v2/11-technical-requirements.md
DEPENDS_ON: (none)
BLOCKS:     UC-TOK-05

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Semantic typography tokens defined for three families (opinion/ui/instrument) with schema-validated styles for headline, title, body, caption, label, instrument.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER modify ~/Projects/native-theme/** — consume its schema via $ref only.
- NEVER modify ~/Projects/native-sandbox/**.
- MUST validate against ~/Projects/native-theme/schema/common.schema.json — no custom extensions.
- MUST define families: opinion (Newsreader serif), ui (Geist sans), instrument (JetBrains Mono).
- STRICTLY no font literals outside tokens/ — LaneShadowTheme will consume generated tokens.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

[ ] tokens/semantic/typography.tokens.json defines opinion/ui/instrument families with weight+size+lineHeight+letterSpacing — maps to AC-1 (PRIMARY)
[ ] Styles cover headline (3 sizes), title (3 sizes), body (2 sizes), caption, label, instrument
[ ] pnpm tokens:validate passes against common.schema.json
[ ] Font manifest lists Newsreader, Geist, JetBrains Mono with required weights
[ ] Only tokens/** files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Three families defined + schema-valid [PRIMARY]
  GIVEN: tokens/semantic/typography.tokens.json
  WHEN:  pnpm tokens:validate runs
  THEN:  all three families (opinion/ui/instrument) + all role styles validate against common.schema.json

  TDD_STATE:     none
  TEST_FILE:     tokens/semantic/typography.tokens.json
  TEST_FUNCTION: n/a (INFRA)
  VERIFY:        pnpm tokens:validate

AC-2: Role coverage complete
  GIVEN: typography.tokens.json
  WHEN:  jq queries role keys
  THEN:  headline.{large,medium,small}, title.{large,medium,small}, body.{large,small}, caption, label, instrument all present

  TDD_STATE:     none
  TEST_FILE:     tokens/semantic/typography.tokens.json
  TEST_FUNCTION: n/a
  VERIFY:        jq -e '.typography.headline.large and .typography.title.large and .typography.body.large and .typography.caption and .typography.label and .typography.instrument' tokens/semantic/typography.tokens.json

AC-3: Font manifest complete (edge)
  GIVEN: tokens/fonts/manifest.json
  WHEN:  pnpm tokens:validate runs
  THEN:  Newsreader, Geist, JetBrains Mono all listed with weights 400/500/600/700

  TDD_STATE:     none
  TEST_FILE:     tokens/fonts/manifest.json
  TEST_FUNCTION: n/a
  VERIFY:        jq -e '.fonts | map(.family) | contains(["Newsreader","Geist","JetBrains Mono"])' tokens/fonts/manifest.json

AC-4: Invalid family rejected (error path)
  GIVEN: a family entry with missing lineHeight
  WHEN:  pnpm tokens:validate runs
  THEN:  validator exits non-zero with descriptive error

  TDD_STATE:     none
  TEST_FILE:     tokens/semantic/typography.tokens.json
  TEST_FUNCTION: n/a
  VERIFY:        node tokens/scripts/validate.ts --fixture tokens/__fixtures__/invalid-missing-lineheight.json || test $? -ne 0


--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- tokens/semantic/typography.tokens.json (NEW) — three-family semantic typography
- tokens/fonts/manifest.json (NEW) — font family + weights + files
- tokens/__fixtures__/invalid-missing-lineheight.json (NEW) — negative test fixture
- tokens/scripts/validate.ts (NEW|MODIFY) — validator wired to common.schema.json

writeProhibited:
- ~/Projects/native-sandbox/** (never modify sibling projects)
- ~/Projects/native-theme/** (never modify sibling projects)
- ios/LaneShadow/** — generated downstream by TOK-05
- android/app/src/** — generated downstream by TOK-05
- server/**, react-native/** — out of scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use $ref to native-theme common.schema.json — never duplicate schema
- Keep all typography semantics in tokens/semantic/
- Document any naming decision in the JSON via $comment

⚠️ Ask First:
- Adding any new font family beyond opinion/ui/instrument
- Changing schema — schema lives in native-theme and is out of scope

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- tokens/semantic/typography.tokens.json (NEW): semantic typography definitions
- tokens/fonts/manifest.json (NEW): font family manifest
- tokens/scripts/validate.ts (NEW|MODIFY): AJV validator wired to common.schema.json

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-01-typography.html [PRIMARY]
   - Lines: all
   - Focus: REQUIRED READING — typography system visual source
2. .spec/prds/v2/04-uc-tok.md
   - Lines: UC-TOK-01
   - Focus: family + role definitions
3. ~/Projects/native-theme/README.md
   - Lines: TypographyStyle section
   - Focus: primitive shape
4. ~/Projects/native-theme/schema/common.schema.json
   - Lines: typography section
   - Focus: schema contract
5. .spec/prds/v2/11-technical-requirements.md
   - Lines: theme package
   - Focus: pipeline expectations

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References:
- /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-01-typography.html

Interaction notes:
- REQUIRED READING: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-01-typography.html

Pattern (to imitate):
```
{ "typography": { "headline": { "large": { "family": "opinion", "size": 32, "lineHeight": 40, "weight": 600 } } } }
```

Pattern source: ~/Projects/native-theme/schema/common.schema.json

Anti-pattern (to avoid):
Hardcoding family names (e.g., 'Newsreader') inline instead of referencing the `opinion` family token.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

INFRA token-authoring task — draft JSON, validate, commit. No RED-GREEN.

### IMPLEMENTATION STEPS (INFRA — run in order)

1. 1. Read uc-tok-01-typography.html to extract family/role definitions
2. 2. Draft tokens/semantic/typography.tokens.json with opinion/ui/instrument families
3. 3. Author tokens/fonts/manifest.json with Newsreader, Geist, JetBrains Mono
4. 4. Wire tokens/scripts/validate.ts to AJV + common.schema.json $ref
5. 5. Author negative fixture for error-path AC
6. 6. Run pnpm tokens:validate + pnpm type-check:native + biome
7. 7. Commit

### VERIFICATION CHECKLIST

- [ ] tokens validate
    - Command: `pnpm tokens:validate`
    - Expected: Exit 0
- [ ] role coverage
    - Command: `jq 'paths(scalars) | select(.[0]=="typography")' tokens/semantic/typography.tokens.json | wc -l`
    - Expected: >= 10 role entries
- [ ] negative fixture rejected
    - Command: `node tokens/scripts/validate.ts --fixture tokens/__fixtures__/invalid-missing-lineheight.json || true`
    - Expected: Exit != 0

--------------------------------------------------------------------------------
VERIFICATION GATES (run before declaring DONE)
--------------------------------------------------------------------------------

- **Tokens validate** — `pnpm tokens:validate` → Exit 0
- **Typecheck** — `pnpm type-check:native` → Exit 0
- **Lint** — `pnpm exec biome check --no-errors-on-unmatched tokens/` → no errors

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

Implementer: **swift-planner + kotlin-planner (shared tooling)**
Rationale: Typography tokens must emit both Swift TypographyStyle and Kotlin Compose Typography — requires planner-level coordination across both platforms. Implementation executes under tokens/** shared tooling.
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

Downstream TOK-05 will emit Swift TypographyStyle + Kotlin Compose Typography from this semantic layer.
