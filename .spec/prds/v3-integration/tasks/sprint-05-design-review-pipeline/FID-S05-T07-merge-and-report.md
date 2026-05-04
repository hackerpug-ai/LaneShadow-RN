================================================================================
TASK: FID-S05-T07 - Merge per-entry evals into machine + human report
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

Aggregate per-entry evals into report.json + report.html, enriched with severity filtering, fix_hint, design_token, and code_search_hint per article §5.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST filter by severity threshold (default `med`, env `DESIGN_REVIEW_SEVERITY` override)
- MUST emit issues with all article §5 keys: issue_id, screen, state, theme, component, issue_type, severity, confidence, observed, expected, location.bounding_box, fix_hint, design_token, code_search_hint
- MUST drive `code_search_hint` from `scripts/design-review/component-code-map.json` (curated)
- NEVER emit issues with severity below the active threshold
- NEVER hardcode component-to-symbol mappings inside `merge-report.ts`; STRICTLY render report.html with no external CDN dependencies (offline-friendly)

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: `merge-report.ts` aggregates per-entry evals into `report.json` with article §5 fields [PRIMARY]
- [ ] AC-2: Severity filter respected (default med, env override)
- [ ] AC-3: `code_search_hint` resolved via `component-code-map.json`; unmapped fallback to selector with warning
- [ ] AC-4: `report.html` renders side-by-side reference vs captured per (screen, state, theme) with severity-color-coded issues
- [ ] AC-5: `pnpm design:report` script registered

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD beads)
--------------------------------------------------------------------------------

AC-1: merge-report.ts aggregates per-entry evals into report.json [PRIMARY]
  GIVEN: .design-review/evals/visual/*.json populated
  WHEN:  pnpm design:report runs
  THEN:  .design-review/report.json contains a flat issues[] array enriched with all article §5 fields and a summary block
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/merge-report.test.ts
  TEST_FUNCTION: test_report_shape
  VERIFY:        pnpm design:report && node -e 'const r=require(".design-review/report.json"); if(!Array.isArray(r.issues)||!r.summary) process.exit(1)'

AC-2: Severity filter respected (default med, env override)
  GIVEN: Mixed-severity issues in eval inputs
  WHEN:  merge-report runs with default and DESIGN_REVIEW_SEVERITY=low
  THEN:  Default mode emits only severity ∈ {med, high}; low override emits all severities; high override emits only high
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/severity-filter.test.ts
  TEST_FUNCTION: test_default_and_overrides
  VERIFY:        pnpm tsx scripts/design-review/__tests__/severity-filter.test.ts

AC-3: code_search_hint resolved via component-code-map.json
  GIVEN: scripts/design-review/component-code-map.json maps selectors to symbol hints
  WHEN:  Issue carries selector .mol-form-field
  THEN:  Output issue's code_search_hint resolves to MolFormField (or curated mapping); unmapped selectors fall back to selector string with a warning logged
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/code-search-hint.test.ts
  TEST_FUNCTION: test_mapping_lookup
  VERIFY:        pnpm tsx scripts/design-review/__tests__/code-search-hint.test.ts

AC-4: report.html renders side-by-side per (screen, state, theme)
  GIVEN: Aggregated issues
  WHEN:  merge-report writes HTML
  THEN:  .design-review/report.html contains, for each (screen,state,theme), reference image + captured image side-by-side with a severity-color-coded issue list (red=high, amber=med, gray=low); no external CDN deps
  TDD_STATE:     none
  TEST_FILE:     scripts/design-review/__tests__/report-html.test.ts
  TEST_FUNCTION: test_html_structure
  VERIFY:        pnpm tsx scripts/design-review/__tests__/report-html.test.ts

AC-5: pnpm design:report script registered
  GIVEN: package.json
  WHEN:  Inspected
  THEN:  design:report entry resolves to scripts/design-review/merge-report.ts
  TDD_STATE:     none
  TEST_FILE:     package.json
  TEST_FUNCTION: grep verification
  VERIFY:        grep -q '"design:report"' package.json

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | report.json issues[] all carry article §5 keys | AC-1 | `pnpm tsx scripts/design-review/__tests__/issue-shape.test.ts` |
| TC-2 | summary block aggregates totals + per-severity counts + screens_passed/failed | AC-1 | `pnpm tsx scripts/design-review/__tests__/summary.test.ts` |
| TC-3 | Default severity threshold is med | AC-2 | `pnpm tsx scripts/design-review/__tests__/severity-filter.test.ts --case=default` |
| TC-4 | DESIGN_REVIEW_SEVERITY=high suppresses med and low | AC-2 | `DESIGN_REVIEW_SEVERITY=high pnpm tsx scripts/design-review/__tests__/severity-filter.test.ts --case=high` |
| TC-5 | Mapped selector resolves to curated symbol | AC-3 | `pnpm tsx scripts/design-review/__tests__/code-search-hint.test.ts --case=mapped` |
| TC-6 | Unmapped selector falls back to selector with warning | AC-3 | `pnpm tsx scripts/design-review/__tests__/code-search-hint.test.ts --case=unmapped` |
| TC-7 | report.html groups by (screen,state,theme) and is offline-self-contained | AC-4 | `pnpm tsx scripts/design-review/__tests__/report-html.test.ts --case=grouping` |
| TC-8 | TS typecheck passes | AC-1 | `pnpm type-check:native` |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- scripts/design-review/merge-report.ts (NEW)
- scripts/design-review/component-code-map.json (NEW — curated; grows over time via PR)
- scripts/design-review/__tests__/*.ts (NEW)
- package.json (MODIFY — add design:report script)

writeProhibited:
- scripts/design-review/visual-eval.ts — owned by T05
- scripts/design-review/calibrate.ts — owned by T06
- .design-review/report.json — generated artifact, never committed
- .design-review/report.html — generated artifact, never committed

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Drive `code_search_hint` via curated JSON map; document new entries via PR review
- Render report.html with no external CDN dependencies (inline CSS/JS)
- Keep severity color encoding consistent with article §8 (red=high, amber=med, gray=low)

⚠️ Ask First:
- If `component-code-map.json` grows beyond 50 entries (consider source generation)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- scripts/design-review/component-code-map.json (NEW): curated selector→symbol map
- scripts/design-review/merge-report.ts (NEW): aggregator + HTML renderer
- package.json (MODIFY): design:report script

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

Standard RED → GREEN → REFACTOR per AC. Strategy: AC-1 (aggregator + report.json shape) first. Then AC-2 (severity filter — env-driven). Then AC-3 (code_search_hint mapping with unmapped fallback). Then AC-4 (HTML rendering — keep it tiny + self-contained). Finally AC-5 (package wiring).

For AC-4: load reference + captured images from manifest paths and embed `<img src="...">` with relative paths from `.design-review/`. Severity-color-coded issue list uses inline `<style>` for offline-self-containment.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/.claude/plans/plan-a-design-review-logical-clock.md [PRIMARY PATTERN]
   - Sections: Phase 7 + article §5 + §8
   - Focus: Issue schema + report layout

2. /Users/justinrich/Projects/LaneShadow/scripts/design-review/schemas/visual-issue.zod.ts (after T05)
   - Lines: full
   - Focus: Input shape from T05

3. /Users/justinrich/Projects/LaneShadow/.design-review/manifest.json (after T04)
   - Lines: entries[]
   - Focus: Reference + capture path resolution for HTML

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Report builds
  Command:  pnpm design:report
  Expected: exit 0; .design-review/report.json + report.html written

Gate 2: Severity filter test
  Command:  pnpm tsx scripts/design-review/__tests__/severity-filter.test.ts
  Expected: exit 0

Gate 3: code_search_hint test
  Command:  pnpm tsx scripts/design-review/__tests__/code-search-hint.test.ts
  Expected: exit 0

Gate 4: HTML structure test
  Command:  pnpm tsx scripts/design-review/__tests__/report-html.test.ts
  Expected: exit 0

Gate 5: TS typecheck
  Command:  pnpm type-check:native
  Expected: exit 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Skill orchestration (T08)
- Re-eval loop (T09)
- Smoke test + docs (T10)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** T05/T06 produce per-entry eval JSON; nothing aggregates them, applies severity filtering, or renders human-readable output.

**Gap:** Fix agents and human reviewers need a single machine-readable `report.json` (with `code_search_hint` and `fix_hint`) and a human-readable `report.html` (side-by-side per screen) per the sprint gate.

--------------------------------------------------------------------------------
REVIEW (for convex-reviewer)
--------------------------------------------------------------------------------

Must pass:
- All issues in report.json carry article §5 fields
- Severity filter default is `med`; env override behaves as documented
- report.html groups correctly by (screen,state,theme)

Should verify:
- Curated `component-code-map.json` covers all selectors emitted by T02 annotations
- report.html is self-contained (no external CDN; opens offline)
- Unmapped selector logs a warning rather than crashing

Verdict: APPROVED | NEEDS_FIXES
Domain reviewer: convex-reviewer

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S05-T05, FID-S05-T06
Blocks:     FID-S05-T08, FID-S05-T10
Parallel:   (none)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"Aggregator produces report.json with article §5 fields","verify":"pnpm design:report && node -e 'const r=require(\".design-review/report.json\"); if(!Array.isArray(r.issues)||!r.summary) process.exit(1)'","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-2","type":"acceptance_criterion","description":"Severity filter respected","verify":"pnpm tsx scripts/design-review/__tests__/severity-filter.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-3","type":"acceptance_criterion","description":"code_search_hint resolved via curated map","verify":"pnpm tsx scripts/design-review/__tests__/code-search-hint.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-4","type":"acceptance_criterion","description":"report.html side-by-side rendering","verify":"pnpm tsx scripts/design-review/__tests__/report-html.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-5","type":"acceptance_criterion","description":"design:report script registered","verify":"grep -q '\"design:report\"' package.json","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-1","type":"test_criterion","description":"Issue shape contains §5 keys","verify":"pnpm tsx scripts/design-review/__tests__/issue-shape.test.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-2","type":"test_criterion","description":"Summary block aggregates correctly","verify":"pnpm tsx scripts/design-review/__tests__/summary.test.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-3","type":"test_criterion","description":"Default threshold is med","verify":"pnpm tsx scripts/design-review/__tests__/severity-filter.test.ts --case=default","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-4","type":"test_criterion","description":"high override suppresses lower severities","verify":"DESIGN_REVIEW_SEVERITY=high pnpm tsx scripts/design-review/__tests__/severity-filter.test.ts --case=high","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-5","type":"test_criterion","description":"Mapped selector resolves","verify":"pnpm tsx scripts/design-review/__tests__/code-search-hint.test.ts --case=mapped","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-6","type":"test_criterion","description":"Unmapped selector falls back","verify":"pnpm tsx scripts/design-review/__tests__/code-search-hint.test.ts --case=unmapped","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-7","type":"test_criterion","description":"Report HTML grouping correct","verify":"pnpm tsx scripts/design-review/__tests__/report-html.test.ts --case=grouping","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-8","type":"test_criterion","description":"Native typecheck","verify":"pnpm type-check:native","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}]}
-->
