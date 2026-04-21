<!-- Task Template v5.1 | INFRA-adapted for sandbox/token foundation work -->

================================================================================
TASK: UC-TOK-04 - Motion — recipes + primitive duration/easing
================================================================================

TASK_TYPE:  INFRA
STATUS:     ✅ Completed
COMPLETED:  2026-04-21T10:25:00Z
COMMIT:     781890c1d75fc0096fa2aa21c838d4fa45c565c8
REVIEWER:   orchestrator-verified
PRIORITY:   P0
EFFORT:     L
SPRINT:     [sprint-01-foundation-tokens-and-v2-reset](./SPRINT.md)
AGENT:      implementer=shared-tooling (swift-planner + kotlin-planner) | reviewer=design-system-reviewer
ESTIMATE:   180 min

RUNTIME_COMMANDS:
  test:      pnpm test --filter tokens
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched tokens/

PRD_REFS:   UC-TOK-04, .spec/prds/v2/04-uc-tok.md
DEPENDS_ON: (none)
BLOCKS:     UC-TOK-05

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Motion tokens provide primitive durations + easings and 8 named recipes (chatOverlayEnter/Dismiss, sidebarSlideIn, sketchPolylineLoop, routeDrawOn, bestBadgeEnter, phaseDotPulse, mapTapDismiss).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER modify ~/Projects/native-theme/** or ~/Projects/native-sandbox/**.
- MUST define primitives (duration.*, easing.*) before recipes — recipes reference primitives only.
- MUST include all 8 named recipes verbatim as scoped in SPRINT.md.
- MUST specify duration + easing + iteration per recipe.
- STRICTLY no inline Animation literals downstream — LaneShadowTheme motion surface is the only consumer.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

[ ] tokens/semantic/motion.tokens.json defines duration + easing primitives + 8 recipes — maps to AC-1 (PRIMARY)
[ ] pnpm tokens:validate passes
[ ] Every recipe references primitives by token path (not raw numbers)
[ ] Only tokens/** files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: All 8 recipes + primitives defined and schema-valid [PRIMARY]
  GIVEN: tokens/semantic/motion.tokens.json
  WHEN:  pnpm tokens:validate runs
  THEN:  duration.*, easing.*, and 8 recipes (chatOverlayEnter, chatOverlayDismiss, sidebarSlideIn, sketchPolylineLoop, routeDrawOn, bestBadgeEnter, phaseDotPulse, mapTapDismiss) validate

  TDD_STATE:     none
  TEST_FILE:     tokens/semantic/motion.tokens.json
  TEST_FUNCTION: n/a
  VERIFY:        pnpm tokens:validate && jq -e '.motion.chatOverlayEnter and .motion.chatOverlayDismiss and .motion.sidebarSlideIn and .motion.sketchPolylineLoop and .motion.routeDrawOn and .motion.bestBadgeEnter and .motion.phaseDotPulse and .motion.mapTapDismiss' tokens/semantic/motion.tokens.json

AC-2: Recipes reference primitives via token path
  GIVEN: motion.tokens.json
  WHEN:  check-motion-refs.ts runs
  THEN:  every recipe's duration and easing fields are primitive token references ({duration.base} style), not raw numbers

  TDD_STATE:     none
  TEST_FILE:     tokens/scripts/check-motion-refs.ts
  TEST_FUNCTION: n/a
  VERIFY:        node tokens/scripts/check-motion-refs.ts tokens/semantic/motion.tokens.json

AC-3: Iteration specified per recipe (edge)
  GIVEN: motion.tokens.json
  WHEN:  jq queries recipes
  THEN:  each recipe includes an `iteration` field (once | loop | reverse)

  TDD_STATE:     none
  TEST_FILE:     tokens/semantic/motion.tokens.json
  TEST_FUNCTION: n/a
  VERIFY:        jq -e '[.motion | to_entries[] | select(.value | type=="object") | .value.iteration] | all(. != null)' tokens/semantic/motion.tokens.json

AC-4: Missing easing rejected (error path)
  GIVEN: fixture with recipe missing easing
  WHEN:  validator runs
  THEN:  exits non-zero

  TDD_STATE:     none
  TEST_FILE:     tokens/__fixtures__/invalid-missing-easing.json
  TEST_FUNCTION: n/a
  VERIFY:        node tokens/scripts/validate.ts --fixture tokens/__fixtures__/invalid-missing-easing.json || test $? -ne 0


--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- tokens/semantic/motion.tokens.json (NEW) — primitives + 8 recipes
- tokens/scripts/check-motion-refs.ts (NEW) — primitive-reference enforcement
- tokens/__fixtures__/invalid-missing-easing.json (NEW) — negative fixture

writeProhibited:
- ~/Projects/native-sandbox/** (never modify sibling projects)
- ~/Projects/native-theme/** (never modify sibling projects)
- ios/**, android/app/src/** — generated downstream by TOK-05
- server/**, react-native/** — out of scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Recipes reference primitives via token path — never raw numbers
- Name recipes exactly per SPRINT.md scope

⚠️ Ask First:
- Adding a 9th recipe
- Deviating from once/loop/reverse iteration vocabulary

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- tokens/semantic/motion.tokens.json (NEW): primitives + 8 recipes
- tokens/scripts/check-motion-refs.ts (NEW): primitive-reference enforcer

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-04-motion.html [PRIMARY]
   - Lines: all
   - Focus: REQUIRED READING — motion system visual source + recipe behavior
2. .spec/prds/v2/04-uc-tok.md
   - Lines: UC-TOK-04
   - Focus: recipe definitions + iteration semantics
3. ~/Projects/native-theme/schema/common.schema.json
   - Lines: motion section
   - Focus: schema contract
4. ~/Projects/native-theme/README.md
   - Lines: motion section
   - Focus: Animation primitive shapes

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References:
- /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-04-motion.html

Interaction notes:
- REQUIRED READING: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/uc-tok-04-motion.html

Pattern (to imitate):
```
{ "motion": { "duration":{"base":200}, "easing":{"standard":"cubicBezier(0.2,0,0,1)"}, "chatOverlayEnter":{"duration":"{duration.base}","easing":"{easing.standard}","iteration":"once"} } }
```

Pattern source: ~/Projects/native-theme/README.md

Anti-pattern (to avoid):
Hardcoding duration/easing numbers inside recipes; inventing new recipe names outside the 8 scoped.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

INFRA token-authoring task — draft primitives, then recipes referencing primitives, validate, commit.

### IMPLEMENTATION STEPS (INFRA — run in order)

1. 1. Read uc-tok-04-motion.html for recipe behaviors
2. 2. Draft duration + easing primitives
3. 3. Draft 8 recipes referencing primitives by token path
4. 4. Implement check-motion-refs.ts
5. 5. Author negative fixture
6. 6. pnpm tokens:validate + check-motion-refs
7. 7. Commit

### VERIFICATION CHECKLIST

- [ ] schema valid
    - Command: `pnpm tokens:validate`
    - Expected: Exit 0
- [ ] 8 recipes present
    - Command: `jq '.motion | to_entries | map(select(.value | type == "object")) | length' tokens/semantic/motion.tokens.json`
    - Expected: 8
- [ ] primitive refs only
    - Command: `node tokens/scripts/check-motion-refs.ts tokens/semantic/motion.tokens.json`
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
Rationale: Motion recipes must generate both Swift Animation and Kotlin Compose Animation specs via TOK-05 — shared authoring layer.
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

TOK-05 will emit Swift Animation + Kotlin Animation specs from these recipes.
