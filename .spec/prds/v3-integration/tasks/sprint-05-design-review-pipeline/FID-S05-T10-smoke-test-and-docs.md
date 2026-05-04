================================================================================
TASK: FID-S05-T10 - End-to-end smoke test + REAL_DEVICE_E2E.md docs + scope flag
================================================================================

TASK_TYPE:  INFRA
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=qa-engineer | reviewer=code-reviewer
SPRINT:     [sprint-05-design-review-pipeline](./SPRINT.md)
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  test:      pnpm tsx scripts/design-review/__tests__/<file>
  pipeline:  pnpm design:review --screens auth-screen
  typecheck: pnpm type-check:native

PROGRESS: AC-1 not started · 0/5 complete · AUTH-SCREEN-ONLY SCOPE (v0 validation)

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Run a deliberate-regression smoke test on auth-screen only, document the pipeline in REAL_DEVICE_E2E.md, capture a sanitized sample report, and flag all screens beyond auth-screen as deferred to their respective sprints.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST inject a deliberate `var(--space-4)` → `12.0` regression on iOS AuthScreen for the smoke test
- MUST observe severity ≥ med with a token-level `fix_hint`, then revert and confirm zero med+ issues
- MUST update REAL_DEVICE_E2E.md to reference strategy article, plan, sprint folder, skill location, and four pnpm commands
- NEVER commit the deliberate regression to main (use temp branch or stash, revert before merging anything)
- NEVER misrepresent unreachable screens as covered; STRICTLY the Coverage scope subsection must call out ALL screens beyond auth-screen as deferred (idle-screen → Sprint 06, planning-screen → Sprint 07, route-results-screen → Sprint 08, route-details-screen → Sprint 09, sessions-screen → Sprint 10)

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Deliberate regression detected at severity ≥ med with token-level fix_hint [PRIMARY]
- [ ] AC-2: Reverted state produces zero med+ issues on auth-screen
- [ ] AC-3: REAL_DEVICE_E2E.md "Design Review Capture Pipeline" subsection added
- [ ] AC-4: Sample sanitized `report.html` committed to `.spec/design/calibration/sample-report.html`
- [ ] AC-5: "Coverage scope" subsection flags ALL screens beyond auth-screen as deferred to their respective sprints (Sprints 06–10)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (verification gates — INFRA, not TDD)
--------------------------------------------------------------------------------

AC-1: Deliberate regression detected at severity ≥ med [PRIMARY]
  GIVEN: var(--space-4) replaced with 12.0 on iOS AuthScreen padding token (temp branch only)
  WHEN:  pnpm design:review --screens auth-screen runs
  THEN:  report.json contains at least one issue on auth-screen.entry with severity ∈ {med, high} and a token-level fix_hint referencing --space-4
  TDD_STATE: none
  TEST_FILE: scripts/design-review/__tests__/smoke-regression.test.ts
  VERIFY:    pnpm tsx scripts/design-review/__tests__/smoke-regression.test.ts

AC-2: Reverted state produces zero med+ issues on auth-screen
  GIVEN: Regression reverted on iOS AuthScreen
  WHEN:  pnpm design:review --screens auth-screen reruns
  THEN:  report.json shows zero issues on auth-screen with severity ≥ med
  TDD_STATE: none
  TEST_FILE: scripts/design-review/__tests__/smoke-clean.test.ts
  VERIFY:    pnpm tsx scripts/design-review/__tests__/smoke-clean.test.ts

AC-3: REAL_DEVICE_E2E.md documents the pipeline
  GIVEN: docs/REAL_DEVICE_E2E.md exists
  WHEN:  Sprint 05 docs land
  THEN:  A 'Design Review Capture Pipeline' subsection exists referencing the strategy article URL, plan path, sprint folder, skill path, and the four pnpm commands (design:references, design:export, design:eval, design:review)
  TDD_STATE: none
  TEST_FILE: docs/REAL_DEVICE_E2E.md
  VERIFY:    grep -q 'Design Review Capture Pipeline' docs/REAL_DEVICE_E2E.md && grep -q 'pnpm design:review' docs/REAL_DEVICE_E2E.md && grep -q 'sprint-05-design-review-pipeline' docs/REAL_DEVICE_E2E.md

AC-4: Sample report committed to .spec/design/calibration/
  GIVEN: Live report.html exists post-smoke
  WHEN:  Sanitized snapshot is captured (no API keys, no absolute home paths)
  THEN:  .spec/design/calibration/sample-report.html is committed
  TDD_STATE: none
  TEST_FILE: .spec/design/calibration/sample-report.html
  VERIFY:    test -f .spec/design/calibration/sample-report.html

AC-5: Coverage scope subsection flags deferred screens by sprint
  GIVEN: Sprint 05 ships with auth-screen-only pipeline validation
  WHEN:  REAL_DEVICE_E2E.md is updated
  THEN:  'Coverage scope' subsection enumerates ALL screens beyond auth-screen as deferred: idle-screen (Sprint 06), planning-screen (Sprint 07), route-results-screen (Sprint 08), route-details-screen (Sprint 09), sessions-screen (Sprint 10)
  TDD_STATE: none
  TEST_FILE: docs/REAL_DEVICE_E2E.md
  VERIFY:    grep -q 'Coverage scope' docs/REAL_DEVICE_E2E.md && grep -q 'sessions-screen' docs/REAL_DEVICE_E2E.md && grep -q 'Sprint 06' docs/REAL_DEVICE_E2E.md && grep -q 'Sprint 07' docs/REAL_DEVICE_E2E.md

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Regression flagged at severity ≥ med | AC-1 | `pnpm tsx scripts/design-review/__tests__/smoke-regression.test.ts` |
| TC-2 | fix_hint references --space-4 token | AC-1 | `grep -q -- '--space-4' .spec/design/calibration/sample-report.html \|\| grep -q -- '--space-4' .design-review/report.json` |
| TC-3 | Clean run produces zero med+ issues | AC-2 | `pnpm tsx scripts/design-review/__tests__/smoke-clean.test.ts` |
| TC-4 | Pipeline subsection mentions skill path | AC-3 | `grep -q '~/.claude/skills/design-review' docs/REAL_DEVICE_E2E.md` |
| TC-5 | Pipeline subsection lists all four pnpm commands | AC-3 | grep all four: design:references, design:export, design:eval, design:review |
| TC-6 | Sample report committed | AC-4 | `test -f .spec/design/calibration/sample-report.html` |
| TC-7 | Coverage scope flags Sprint 06 + Sprint 07 dependencies | AC-5 | `grep -q 'Sprint 06' docs/REAL_DEVICE_E2E.md && grep -q 'Sprint 07' docs/REAL_DEVICE_E2E.md` |
| TC-8 | Deliberate regression NOT committed to main | AC-1 | `! git log -p main -- ios \| grep -q 'padding.*12\\.0'` |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- docs/REAL_DEVICE_E2E.md (MODIFY — add Pipeline + Coverage scope subsections)
- .spec/design/calibration/sample-report.html (NEW — sanitized artifact)
- scripts/design-review/__tests__/smoke-regression.test.ts (NEW)
- scripts/design-review/__tests__/smoke-clean.test.ts (NEW)

writeProhibited:
- ios/** — deliberate regression must NOT be committed to main (use temp branch or stash only; revert before any merge)
- scripts/design-review/visual-eval.ts — owned by T05
- scripts/design-review/merge-report.ts — owned by T07

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Run smoke on a temp branch or stash; revert before docs work begins
- Sanitize sample-report.html (no API keys, no absolute `/Users/justinrich/...` paths)
- Cite specific Sprint 06–10 task IDs in coverage scope notes (idle-screen: Sprint 06, planning-screen: Sprint 07, route-results: Sprint 08, route-details: Sprint 09, sessions: Sprint 10)

⚠️ Ask First:
- If smoke test fails to reproduce expected severity ≥ med (may indicate calibration regression — escalate to T06 owner)
- If `--space-4` token is not used in iOS AuthScreen as currently shipped (find an alternative spacing token regression)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- docs/REAL_DEVICE_E2E.md (MODIFY): "Design Review Capture Pipeline" + "Coverage scope" subsections
- .spec/design/calibration/sample-report.html (NEW): sanitized reference artifact
- scripts/design-review/__tests__/smoke-regression.test.ts (NEW): regression smoke verification
- scripts/design-review/__tests__/smoke-clean.test.ts (NEW): clean-run verification

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (verification checklist — INFRA)
--------------------------------------------------------------------------------

1. Pre-flight: confirm working tree clean (`git status --porcelain` empty); verify Sprint 05 T01-T09 are complete and merged to main.
2. Create temp branch: `git checkout -b temp/sprint-05-smoke`.
3. Inject regression: locate iOS AuthScreen padding using `var(--space-4)` (likely in a token-driven SwiftUI modifier or LSFormField helper). Replace one usage with hardcoded `12.0`.
4. Build iOS: `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 15 Pro' build`.
5. Run pipeline: `pnpm design:review --screens auth-screen`.
6. Verify AC-1: read `.design-review/report.json`; confirm at least one auth-screen issue with severity ≥ med and `fix_hint` mentioning `--space-4`. If not, escalate (calibration regression).
7. Capture sample: copy `.design-review/report.html` to `.spec/design/calibration/sample-report.html`. Sanitize: replace any `/Users/justinrich/...` paths with `~/.../...`; redact any API keys; verify no PII.
8. Revert regression: `git checkout main -- ios/`. Confirm `git status` shows no production-code changes.
9. Re-run pipeline: `pnpm design:review --screens auth-screen`.
10. Verify AC-2: read `.design-review/report.json`; confirm zero auth-screen issues at severity ≥ med.
11. Edit `docs/REAL_DEVICE_E2E.md`: append "## Design Review Capture Pipeline" subsection referencing the strategy article URL, plan path (`~/.claude/plans/plan-a-design-review-logical-clock.md`), sprint folder (`.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/`), skill path (`~/.claude/skills/design-review/`), and the four `pnpm design:*` commands.
12. Edit `docs/REAL_DEVICE_E2E.md`: append "## Coverage scope" subsection enumerating ALL screens beyond auth-screen as deferred to their respective sprints: idle-screen (Sprint 06), planning-screen (Sprint 07), route-results-screen (Sprint 08), route-details-screen (Sprint 09), sessions-screen (Sprint 10).
13. Run AC-3, AC-5 grep checks. Run AC-1, AC-2 smoke tests against current main + sample report.
14. Switch back to main; merge sanitized sample report + docs + tests; delete temp branch.
15. Commit: `chore(sprint-05): smoke test + design-review docs (FID-S05-T10)`.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. /Users/justinrich/.claude/plans/plan-a-design-review-logical-clock.md [PRIMARY PATTERN]
   - Section: Phase 7 smoke test
   - Focus: exact regression specification (--space-4 → 12.0)

2. /Users/justinrich/Projects/LaneShadow/docs/REAL_DEVICE_E2E.md
   - Lines: current structure
   - Focus: subsection insertion points + tone

3. /Users/justinrich/Projects/LaneShadow/.spec/prds/v3-integration/ROADMAP.md
   - Sections: Sprint 06 + Sprint 07
   - Focus: confirm which screens those sprints unlock (for accurate Coverage scope)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Smoke regression detected
  Command:  pnpm tsx scripts/design-review/__tests__/smoke-regression.test.ts
  Expected: exit 0

Gate 2: Clean run
  Command:  pnpm tsx scripts/design-review/__tests__/smoke-clean.test.ts
  Expected: exit 0

Gate 3: Docs updated
  Command:  grep -q 'Design Review Capture Pipeline' docs/REAL_DEVICE_E2E.md && grep -q 'Coverage scope' docs/REAL_DEVICE_E2E.md
  Expected: exit 0

Gate 4: Sample report present
  Command:  test -f .spec/design/calibration/sample-report.html
  Expected: exit 0

Gate 5: Regression not on main
  Command:  ! git log -p main -- ios | grep -q 'padding.*12\.0'
  Expected: exit 0

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Building Sprint 06 sessions wiring
- Building Sprint 07 map/offline wiring
- Tuning the calibration prompt (T06)
- Adding new states to the capture suite

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** All design-review components exist (T01–T09) but have not been validated end-to-end against a known regression, and `docs/REAL_DEVICE_E2E.md` does not yet describe the pipeline or coverage limits.

**Gap:** Sprint gate requires verifiable proof the pipeline catches a real token regression with token-level `fix_hint`, plus honest documentation of which screens are not yet reachable for capture.

--------------------------------------------------------------------------------
REVIEW (for code-reviewer)
--------------------------------------------------------------------------------

Must pass:
- Smoke regression detected at severity ≥ med with token-level `fix_hint`
- Reverted state shows zero med+ issues
- REAL_DEVICE_E2E.md has both Pipeline and Coverage scope subsections
- No `12.0` regression in main branch git history (verify with `! git log -p main -- ios | grep 12.0`)

Should verify:
- Sample report HTML loads in a browser without missing assets (offline-self-contained per T07 contract)
- Coverage callouts match actual Sprint 06/07 scope from ROADMAP.md
- Sample report sanitization complete (no absolute home paths, no API keys)

Verdict: APPROVED | NEEDS_FIXES
Domain reviewer: code-reviewer

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: FID-S05-T07, FID-S05-T08
NOTE: T09 (re-eval loop) was descoped; this task no longer depends on it
Blocks:     (sprint closure)
Parallel:   (none)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"Smoke regression flagged at severity ≥ med with token-level hint","verify":"pnpm tsx scripts/design-review/__tests__/smoke-regression.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-2","type":"acceptance_criterion","description":"Reverted state produces zero med+ issues","verify":"pnpm tsx scripts/design-review/__tests__/smoke-clean.test.ts","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-3","type":"acceptance_criterion","description":"Pipeline documented in REAL_DEVICE_E2E.md","verify":"grep -q 'Design Review Capture Pipeline' docs/REAL_DEVICE_E2E.md && grep -q 'pnpm design:review' docs/REAL_DEVICE_E2E.md","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-4","type":"acceptance_criterion","description":"Sample report committed","verify":"test -f .spec/design/calibration/sample-report.html","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"AC-5","type":"acceptance_criterion","description":"Coverage scope flags unreachable screens by sprint","verify":"grep -q 'Coverage scope' docs/REAL_DEVICE_E2E.md && grep -q 'Sprint 06' docs/REAL_DEVICE_E2E.md && grep -q 'Sprint 07' docs/REAL_DEVICE_E2E.md","maps_to_ac":null,"satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-1","type":"test_criterion","description":"Regression detected","verify":"pnpm tsx scripts/design-review/__tests__/smoke-regression.test.ts","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-2","type":"test_criterion","description":"fix_hint references --space-4","verify":"grep -q -- '--space-4' .design-review/report.json || grep -q -- '--space-4' .spec/design/calibration/sample-report.html","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-3","type":"test_criterion","description":"Clean run zero med+","verify":"pnpm tsx scripts/design-review/__tests__/smoke-clean.test.ts","maps_to_ac":"AC-2","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-4","type":"test_criterion","description":"Skill path mentioned","verify":"grep -q '~/.claude/skills/design-review' docs/REAL_DEVICE_E2E.md","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-5","type":"test_criterion","description":"All four pnpm commands listed","verify":"grep -q 'pnpm design:references' docs/REAL_DEVICE_E2E.md && grep -q 'pnpm design:export' docs/REAL_DEVICE_E2E.md && grep -q 'pnpm design:eval' docs/REAL_DEVICE_E2E.md && grep -q 'pnpm design:review' docs/REAL_DEVICE_E2E.md","maps_to_ac":"AC-3","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-6","type":"test_criterion","description":"Sample report committed","verify":"test -f .spec/design/calibration/sample-report.html","maps_to_ac":"AC-4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-7","type":"test_criterion","description":"Sprint 06+07 callouts present","verify":"grep -q 'Sprint 06' docs/REAL_DEVICE_E2E.md && grep -q 'Sprint 07' docs/REAL_DEVICE_E2E.md","maps_to_ac":"AC-5","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null},{"id":"TC-8","type":"test_criterion","description":"Regression not committed to main","verify":"! git log -p main -- ios | grep -q 'padding.*12\\.0'","maps_to_ac":"AC-1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null}]}
-->
