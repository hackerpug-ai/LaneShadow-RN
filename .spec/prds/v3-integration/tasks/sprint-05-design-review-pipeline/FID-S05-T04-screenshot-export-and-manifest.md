================================================================================
TASK: FID-S05-T04 - Screenshot export from .xcresult + manifest builder
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer
SPRINT:     [sprint-05-design-review-pipeline](./SPRINT.md)
ESTIMATE:   240 min

RUNTIME_COMMANDS:
  test:      pnpm tsx scripts/design-review/__tests__/<file>
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched scripts/design-review/

PROGRESS: AC-1 not started · 0/5 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Export iOS XCUITest captures from .xcresult and join them with references + annotations into a single design-review manifest with non-zero exit on missing pairings.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST parse XCTAttachment names of form `{screen}.{state}.{action}` (article §2.1)
- MUST resolve theme from `.xcresult` device metadata `UIUserInterfaceStyle`
- MUST exit non-zero on any missing capture↔reference pairing
- NEVER commit `.design-review/` or `build/xcresults/` output to git
- STRICTLY conform capture-metadata JSON to article §2.1 schema

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: `export-from-xcresult.ts` extracts attachments + theme metadata into `.design-review/captures/` [PRIMARY]
- [ ] AC-2: `build-manifest.ts` joins captures + references + annotations into `.design-review/manifest.json`
- [ ] AC-3: Missing-pairing case exits non-zero with diagnostic message
- [ ] AC-4: `.gitignore` excludes `.design-review/` and `build/xcresults/`
- [ ] AC-5: `pnpm design:export` and `pnpm design:manifest` scripts registered

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD beads)
--------------------------------------------------------------------------------

AC-1: export-from-xcresult.ts extracts attachments + theme metadata [PRIMARY]
  GIVEN: An .xcresult bundle from T03 capture run exists at build/xcresults/design-review.xcresult
  WHEN:  pnpm design:export runs
  THEN:  .design-review/captures/{screen}.{state}.{theme}.png + sibling .json (test_id, screen, state, theme, device, scale_factor, dark_mode, captured_at) exist for every attachment
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/export-from-xcresult.test.ts
  TEST_FUNCTION: test_export_produces_capture_pairs
  VERIFY:        pnpm design:export && find .design-review/captures -name '*.png' | wc -l | awk '{ if ($1 < 1) exit 1 }'

AC-2: build-manifest.ts joins captures + references + annotations
  GIVEN: Captures and references exist
  WHEN:  pnpm design:manifest runs
  THEN:  .design-review/manifest.json contains entries {id, screen, state, theme, captured, captured_metadata, reference, annotations}; exits non-zero if any pairing missing
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/build-manifest.test.ts
  TEST_FUNCTION: test_manifest_joins_correctly
  VERIFY:        pnpm design:manifest && node -e 'const m=require(".design-review/manifest.json"); if(!Array.isArray(m.entries)||m.entries.length===0) process.exit(1)'

AC-3: Missing-pairing case fails fast
  GIVEN: A reference PNG exists but no matching capture (or vice-versa)
  WHEN:  build-manifest runs
  THEN:  Process exits non-zero with a message identifying the unpaired (screen,state,theme)
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/build-manifest.test.ts
  TEST_FUNCTION: test_missing_pairing_fails
  VERIFY:        pnpm tsx scripts/design-review/__tests__/build-manifest.test.ts --case=missing-pair

AC-4: Output directories git-ignored
  GIVEN: Repo .gitignore
  WHEN:  Inspected
  THEN:  .design-review/ and build/xcresults/ are ignored
  TDD_STATE:     none
  TEST_FILE:     .gitignore
  TEST_FUNCTION: grep verification
  VERIFY:        grep -q '^\.design-review/' .gitignore && grep -q '^build/xcresults/' .gitignore

AC-5: Scripts registered in package.json
  GIVEN: package.json scripts block
  WHEN:  Inspected
  THEN:  design:export and design:manifest entries exist
  TDD_STATE:     none
  TEST_FILE:     package.json
  TEST_FUNCTION: grep verification
  VERIFY:        grep -q '"design:export"' package.json && grep -q '"design:manifest"' package.json

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Attachment name parser extracts screen/state/action triple | AC-1 | `pnpm tsx scripts/design-review/__tests__/parse-attachment-name.test.ts` |
| TC-2 | Theme inferred from UIUserInterfaceStyle metadata | AC-1 | `pnpm tsx scripts/design-review/__tests__/theme-from-metadata.test.ts` |
| TC-3 | Capture sidecar JSON conforms to article §2.1 keys | AC-1 | `pnpm tsx scripts/design-review/__tests__/validate-capture-metadata.ts` |
| TC-4 | Manifest entries contain all required fields | AC-2 | `pnpm tsx scripts/design-review/__tests__/validate-manifest.ts` |
| TC-5 | Missing capture causes non-zero exit | AC-3 | `pnpm tsx scripts/design-review/__tests__/build-manifest.test.ts --case=missing-pair` |
| TC-6 | .design-review and build/xcresults are git-ignored | AC-4 | `grep -q '^\.design-review/' .gitignore && grep -q '^build/xcresults/' .gitignore` |
| TC-7 | TS typecheck passes on new scripts | AC-1 | `pnpm type-check:native` |
| TC-8 | xcresulttool invocation passes correct flags | AC-1 | `grep -q 'xcresulttool export' scripts/design-review/export-from-xcresult.ts && grep -q 'type directory' scripts/design-review/export-from-xcresult.ts` |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- scripts/design-review/export-from-xcresult.ts (NEW)
- scripts/design-review/build-manifest.ts (NEW)
- scripts/design-review/__tests__/*.ts (NEW)
- package.json (MODIFY — add design:export + design:manifest scripts)
- .gitignore (MODIFY — append .design-review/ and build/xcresults/)

writeProhibited:
- ios/** — owned by T03
- .spec/design/system/refs/** — owned by T02
- scripts/design-review/visual-eval.ts — owned by T05

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use `xcrun xcresulttool` (not Ruby gems or third-party parsers)
- Validate capture metadata against article §2.1 keys
- Mirror filename helpers from T02's render-references.ts where reasonable

⚠️ Ask First:
- If `.xcresult` schema differs between local Xcode versions and CI Xcode versions

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- scripts/design-review/export-from-xcresult.ts (NEW): xcresult parser + capture writer
- scripts/design-review/build-manifest.ts (NEW): captures + refs + annotations joiner
- .gitignore (MODIFY): ignore .design-review/ + build/xcresults/
- package.json (MODIFY): design:export + design:manifest scripts

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Standard RED → GREEN → REFACTOR per AC. Strategy: AC-1 first (export), then AC-2 (manifest joiner), then AC-3 (missing-pair error path), then AC-4/AC-5 (config).

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/.claude/plans/plan-a-design-review-logical-clock.md [PRIMARY PATTERN]
   - Section: Phase 3 + Phase 4 + article §2.1
   - Focus: Capture metadata schema + export procedure

2. /Users/justinrich/Projects/LaneShadow/.spec/design/system/refs/ (after T02 lands)
   - Focus: Reference filename pattern to mirror in joining

3. /Users/justinrich/Projects/LaneShadow/scripts/design-review/render-references.ts (after T02)
   - Focus: Share filename helper with capture exporter

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Export produces captures
  Command:  pnpm design:export && find .design-review/captures -name '*.png' | wc -l
  Expected: >= 1

Gate 2: Manifest builds
  Command:  pnpm design:manifest
  Expected: exit 0

Gate 3: Missing-pair fails fast
  Command:  pnpm tsx scripts/design-review/__tests__/build-manifest.test.ts --case=missing-pair
  Expected: exit non-zero

Gate 4: TS typecheck
  Command:  pnpm type-check:native
  Expected: exit 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Running XCUITest captures (T03)
- Vision LLM evaluation (T05)
- Producing references or annotations (T02)
- HTML report generation (T07)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** T02 produces references + annotations; T03 produces .xcresult bundle with screen.state.action attachments and theme metadata; nothing joins them yet.

**Gap:** Vision-LLM evaluator (T05) needs a unified manifest pairing each capture with its reference + annotation JSON.

--------------------------------------------------------------------------------
REVIEW (for convex-reviewer)
--------------------------------------------------------------------------------

Must pass:
- Export produces exactly one capture per attachment
- Manifest fails fast on missing pairs (verified by error-case test)
- .gitignore correctly excludes outputs

Should verify:
- Capture metadata schema matches article §2.1
- Manifest entry id is stable `{screen}.{state}.{theme}`
- xcresulttool flags match documented format

Verdict: APPROVED | NEEDS_FIXES
Domain reviewer: convex-reviewer

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S05-T02, FID-S05-T03
Blocks:     FID-S05-T05, FID-S05-T07
Parallel:   (none)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"xcresult exporter produces capture PNGs + sidecar JSON","verify":"pnpm design:export && find .design-review/captures -name '*.png' | wc -l | awk '{ if ($1 < 1) exit 1 }'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-2","type":"acceptance_criterion","description":"Manifest joins captures + references + annotations","verify":"pnpm design:manifest && node -e 'const m=require(\".design-review/manifest.json\"); if(!Array.isArray(m.entries)||m.entries.length===0) process.exit(1)'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-3","type":"acceptance_criterion","description":"Missing pairing fails fast","verify":"pnpm tsx scripts/design-review/__tests__/build-manifest.test.ts --case=missing-pair","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-4","type":"acceptance_criterion","description":"Output directories git-ignored","verify":"grep -q '^\\.design-review/' .gitignore && grep -q '^build/xcresults/' .gitignore","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-5","type":"acceptance_criterion","description":"Scripts registered","verify":"grep -q '\"design:export\"' package.json && grep -q '\"design:manifest\"' package.json","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-1","type":"test_criterion","description":"Attachment name parser unit test","verify":"pnpm tsx scripts/design-review/__tests__/parse-attachment-name.test.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-2","type":"test_criterion","description":"Theme inference unit test","verify":"pnpm tsx scripts/design-review/__tests__/theme-from-metadata.test.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-3","type":"test_criterion","description":"Capture metadata schema valid","verify":"pnpm tsx scripts/design-review/__tests__/validate-capture-metadata.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-4","type":"test_criterion","description":"Manifest validation passes","verify":"pnpm tsx scripts/design-review/__tests__/validate-manifest.ts","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-5","type":"test_criterion","description":"Missing-pair error case","verify":"pnpm tsx scripts/design-review/__tests__/build-manifest.test.ts --case=missing-pair","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-6","type":"test_criterion","description":"gitignore covers both dirs","verify":"grep -q '^\\.design-review/' .gitignore && grep -q '^build/xcresults/' .gitignore","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-7","type":"test_criterion","description":"Native typecheck","verify":"pnpm type-check:native","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-8","type":"test_criterion","description":"xcresulttool flags correct","verify":"grep -q 'xcresulttool export' scripts/design-review/export-from-xcresult.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}]}
-->
