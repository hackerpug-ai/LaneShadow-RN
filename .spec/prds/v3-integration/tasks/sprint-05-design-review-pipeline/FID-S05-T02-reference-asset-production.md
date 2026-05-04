================================================================================
TASK: FID-S05-T02 - Reference asset production: design HTML → per-state PNGs + annotations
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     [sprint-05-design-review-pipeline](./SPRINT.md)
ESTIMATE:   360 min

RUNTIME_COMMANDS:
  test:      pnpm tsx scripts/design-review/__tests__/<file>
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched scripts/design-review/

PROGRESS: AC-1 not started · 0/5 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Produce ~84 reference PNGs and ~42 annotation JSON files from design-system HTML, keyed by canonical screen/state/theme.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST render only the inner phone-frame element (not outer scaffolding)
- MUST use canonical lowercase kebab state names from each view's README Variants table
- MUST validate auth-screen render visually before processing the remaining 6 views
- NEVER modify visual appearance of design-system HTML (only add `data-*` attributes)
- NEVER hardcode chrome path; STRICTLY read from `manifest.json:render.chrome_path`

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Each `<section>` in 7 view HTMLs carries `data-screen` / `data-state` / `data-theme`; computed styles unchanged
- [ ] AC-2: `pnpm design:references` produces ≥80 PNGs at 390×844 viewport [PRIMARY]
- [ ] AC-3: ~42 `*.annotations.json` files exist with bounding_box + design_tokens resolved
- [ ] AC-4: All annotation files validate against article §2.2 zod schema
- [ ] AC-5: `pnpm design:references` script registered in package.json

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD beads)
--------------------------------------------------------------------------------

AC-1: HTML annotated with data-* attributes (no visual change)
  GIVEN: Each view HTML has multiple `<section>` states
  WHEN:  Annotation edit lands
  THEN:  Each `<section>` carries data-screen, data-state, data-theme attributes; computed styles unchanged
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/html-data-attrs.test.ts
  TEST_FUNCTION: test_all_html_sections_have_data_attrs
  VERIFY:        for f in .spec/design/system/views/*/*.html; do grep -q 'data-screen=' "$f" && grep -q 'data-state=' "$f" && grep -q 'data-theme=' "$f" || exit 1; done

AC-2: render-references.ts produces per-section PNGs at 390×844 [PRIMARY]
  GIVEN: scripts/design-review/render-references.ts is implemented
  WHEN:  pnpm design:references runs
  THEN:  .spec/design/system/refs/{screen}/{state}.{theme}.png exists for every (screen,state,theme) combo (~84 files), each clipped to phone-frame element bounds
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/render-references.test.ts
  TEST_FUNCTION: test_render_produces_expected_count
  VERIFY:        pnpm design:references && find .spec/design/system/refs -name '*.png' | wc -l | awk '{ if ($1 < 80) exit 1 }'

AC-3: extract-annotations.ts produces theme-agnostic annotation JSON
  GIVEN: Reference render completed
  WHEN:  Annotation extractor runs
  THEN:  .spec/design/system/refs/{screen}/{state}.annotations.json exists for each (screen,state) (~42 files) with bounding_box + design_tokens resolved against `--*` CSS custom properties
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/extract-annotations.test.ts
  TEST_FUNCTION: test_annotations_schema
  VERIFY:        find .spec/design/system/refs -name '*.annotations.json' | wc -l | awk '{ if ($1 < 40) exit 1 }' && node -e 'const j=require(".spec/design/system/refs/auth-screen/entry.annotations.json"); if(!j.components||!j.viewport) process.exit(1)'

AC-4: Annotation schema conforms to article §2.2
  GIVEN: Annotations are emitted
  WHEN:  Validation runs against zod schema
  THEN:  Each file has { screen, state, theme, viewport: {width,height}, components: [{name, selector, bounding_box: {x,y,w,h}, design_tokens: {...}}] }
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/validate-annotations.ts
  TEST_FUNCTION: test_all_annotation_files_validate
  VERIFY:        pnpm tsx scripts/design-review/__tests__/validate-annotations.ts

AC-5: pnpm design:references script registered
  GIVEN: Root package.json
  WHEN:  scripts block is inspected
  THEN:  design:references entry exists and resolves to scripts/design-review/render-references.ts via tsx
  TDD_STATE:     none
  TEST_FILE:     package.json
  TEST_FUNCTION: grep verification
  VERIFY:        grep -q '"design:references"' package.json

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | All 7 view HTMLs contain data-screen/data-state/data-theme on every section | AC-1 | `for f in .spec/design/system/views/*/*.html; do grep -q 'data-screen=' "$f" \|\| exit 1; done` |
| TC-2 | Auth-screen renders match expected state list | AC-2 | `ls .spec/design/system/refs/auth-screen/*.png \| wc -l \| awk '{ if ($1 < 7) exit 1 }'` |
| TC-3 | All reference PNGs are 390×844 (or scaled at devicePixelRatio) | AC-2 | `pnpm tsx scripts/design-review/__tests__/check-png-dimensions.ts` |
| TC-4 | Annotation files validate against zod schema | AC-4 | `pnpm tsx scripts/design-review/__tests__/validate-annotations.ts` |
| TC-5 | Each annotation file lists at least one component with resolved design_tokens | AC-3 | `pnpm tsx scripts/design-review/__tests__/check-tokens-resolved.ts` |
| TC-6 | Renderer reads chrome_path from manifest.json:render block | AC-2 | `grep -q 'manifest.json' scripts/design-review/render-references.ts && grep -q 'chrome_path' scripts/design-review/render-references.ts` |
| TC-7 | TS typecheck on new scripts passes | AC-2 | `pnpm type-check:native` |
| TC-8 | Phone-frame clipping does not include scaffolding chrome | AC-2 | `pnpm tsx scripts/design-review/__tests__/check-frame-clip.ts` |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- .spec/design/system/views/*/*.html (MODIFY — data-* attributes only, no style/structure changes)
- scripts/design-review/render-references.ts (NEW)
- scripts/design-review/extract-annotations.ts (NEW)
- scripts/design-review/__tests__/*.ts (NEW)
- .spec/design/system/refs/**/*.png (NEW — generated artifacts; commit them)
- .spec/design/system/refs/**/*.annotations.json (NEW)
- package.json (MODIFY — add design:references script entry)

writeProhibited:
- .spec/design/system/views/**/*.css — visual styles must not change
- .spec/design/system/manifest.json — read-only input
- ios/** — iOS captures owned by T03
- scripts/design-review/visual-eval.ts — owned by T05

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Validate auth-screen render visually before processing remaining 6 views
- Use canonical state names from each view's README "Variants" table
- Resolve design_tokens against `--*` custom properties via getComputedStyle
- Skip dark-only states for light theme and vice versa (driven by HTML data-theme)

⚠️ Ask First:
- If a view's README Variants table conflicts with the state list in SPRINT.md
- If phone-frame element selector cannot be reliably identified across all 7 views

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- scripts/design-review/render-references.ts (NEW): Chrome-headless reference renderer
- scripts/design-review/extract-annotations.ts (NEW): DOM annotation extractor
- .spec/design/system/views/*/*.html (MODIFY): data-* attribute injection (×7 files)
- .spec/design/system/refs/{screen}/{state}.{theme}.png (NEW × ~84): reference PNGs
- .spec/design/system/refs/{screen}/{state}.annotations.json (NEW × ~42): annotation JSON
- package.json (MODIFY): design:references script

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ:   AC definition, existing manifest.json render block, view HTML structure
  WRITE:  ONE test that exercises GIVEN-WHEN-THEN
  RUN:    pnpm tsx scripts/design-review/__tests__/<file>
  VERIFY: Test FAILS
  RETURN: { phase: "RED", test_file, test_function, failure_output }

### GREEN PHASE
  READ:   Failing test, AC definition
  WRITE:  MINIMAL implementation to pass
  RUN:    pnpm tsx scripts/design-review/__tests__/<file>
  VERIFY: Test PASSES
  RETURN: { phase: "GREEN", files_changed, test_output }

### REFACTOR PHASE
  Optional cleanup; tests must stay green.

Strategy: Implement AC-1 (HTML annotation) first since AC-2/AC-3 depend on it. Then AC-2 renderer (start with auth-screen as pilot, validate visually, then expand). Then AC-3 annotation extractor. Then AC-4 schema validation. Finally AC-5 package.json wiring.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/Projects/LaneShadow/.spec/design/system/manifest.json [PRIMARY PATTERN]
   - Section: render block
   - Focus: chrome_path, viewport, trim_pass config

2. /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/auth-screen/README.md [PRIMARY PATTERN]
   - Sections: Variants + Token Recipe
   - Focus: canonical state names + token enrichment data

3. /Users/justinrich/.claude/plans/plan-a-design-review-logical-clock.md
   - Section: Phase 1 + article §2.2
   - Focus: annotations.json schema

4. /Users/justinrich/Projects/LaneShadow/.spec/design/system/views/auth-screen/auth-screen.html
   - Lines: phone-frame outer + section markup
   - Focus: phone-frame selector identification

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: PNG count
  Command:  find .spec/design/system/refs -name '*.png' | wc -l
  Expected: >= 80

Gate 2: Annotation count
  Command:  find .spec/design/system/refs -name '*.annotations.json' | wc -l
  Expected: >= 40

Gate 3: Schema validation
  Command:  pnpm tsx scripts/design-review/__tests__/validate-annotations.ts
  Expected: exit 0

Gate 4: TS typecheck
  Command:  pnpm type-check:native
  Expected: exit 0

Gate 5: Phone-frame clip correctness
  Command:  pnpm tsx scripts/design-review/__tests__/check-frame-clip.ts
  Expected: exit 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS XCUITest captures (T03)
- Vision LLM evaluation (T05)
- Behavioral fidelity axis from article §3.2
- Android equivalents

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Design system HTML exists at `.spec/design/system/views/{view}/` with `manifest.json` describing chrome render config; no machine-readable token annotations or reference PNGs.

**Gap:** Vision LLM evaluator (T05) needs (a) per-state reference PNGs and (b) theme-agnostic annotation JSON describing component bounding boxes and resolved design tokens.

--------------------------------------------------------------------------------
REVIEW (for convex-reviewer)
--------------------------------------------------------------------------------

Must pass:
- All ~84 PNG references generated and clipped to phone-frame
- All ~42 annotation files validate against zod schema
- data-* attribute injection produces no visual diff in HTML
- Renderer reads chrome_path from manifest.json (not hardcoded)
- TS typecheck clean

Should verify:
- Token recipe fields from view README are reflected in design_tokens
- State names match canonical sprint-spec list exactly
- Phone-frame clip is consistent across all 7 views

Verdict: APPROVED | NEEDS_FIXES
Domain reviewer: convex-reviewer

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S05-T01
Blocks:     FID-S05-T04, FID-S05-T05
Parallel:   FID-S05-T03

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"HTML annotated with data-* attributes preserving visual output","verify":"for f in .spec/design/system/views/*/*.html; do grep -q 'data-screen=' \"$f\" || exit 1; done","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-2","type":"acceptance_criterion","description":"Reference PNGs produced at 390×844 per phone-frame clip","verify":"pnpm design:references && find .spec/design/system/refs -name '*.png' | wc -l | awk '{ if ($1 < 80) exit 1 }'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-3","type":"acceptance_criterion","description":"Annotation JSON produced theme-agnostically","verify":"find .spec/design/system/refs -name '*.annotations.json' | wc -l | awk '{ if ($1 < 40) exit 1 }'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-4","type":"acceptance_criterion","description":"Annotation schema conforms to article §2.2","verify":"pnpm tsx scripts/design-review/__tests__/validate-annotations.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-5","type":"acceptance_criterion","description":"pnpm design:references script registered","verify":"grep -q '\"design:references\"' package.json","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-1","type":"test_criterion","description":"All HTMLs contain data-* attributes","verify":"for f in .spec/design/system/views/*/*.html; do grep -q 'data-screen=' \"$f\" || exit 1; done","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-2","type":"test_criterion","description":"Auth-screen state count >= 7","verify":"ls .spec/design/system/refs/auth-screen/*.png | wc -l | awk '{ if ($1 < 7) exit 1 }'","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-3","type":"test_criterion","description":"PNG dimensions match viewport","verify":"pnpm tsx scripts/design-review/__tests__/check-png-dimensions.ts","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-4","type":"test_criterion","description":"Annotation files validate","verify":"pnpm tsx scripts/design-review/__tests__/validate-annotations.ts","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-5","type":"test_criterion","description":"design_tokens resolved in every annotation","verify":"pnpm tsx scripts/design-review/__tests__/check-tokens-resolved.ts","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-6","type":"test_criterion","description":"Renderer uses manifest chrome_path","verify":"grep -q 'chrome_path' scripts/design-review/render-references.ts","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-7","type":"test_criterion","description":"TS typecheck passes","verify":"pnpm type-check:native","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-8","type":"test_criterion","description":"Phone-frame clip is inner-frame only","verify":"pnpm tsx scripts/design-review/__tests__/check-frame-clip.ts","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}]}
-->
