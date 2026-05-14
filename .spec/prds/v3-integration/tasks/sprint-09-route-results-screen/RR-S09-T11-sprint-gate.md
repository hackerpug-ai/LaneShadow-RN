# RR-S09-T11 — Sprint 09 gate verification

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z

> **Task ID:** RR-S09-T11
> **Sprint:** [Sprint 09 — Map View · Route Results State](./SPRINT.md)
> **Agent:** qa-engineer
> **Estimate:** 180 min
> **Type:** INFRA
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** Sprint 09 Human Testing Gate

## Background

Final sprint gate task: verify all 13 preceding tasks produce a passing gate per Sprint 09's Human Testing Gate definition. The gate has four evidence categories: (1) `pnpm design:review --screens route-results-screen` produces zero `high`-severity issues, (2) real-iPhone XCUITest evidence captured under `gate-evidence/`, (3) Android emulator walk evidence with MANUAL/BLOCKED markers for Android-specific real-device gaps, (4) project `design-review` skill passes against the new view. This task does NOT write iOS/Android/Convex code; it executes, records, and signs off on the evidence.

## Critical Constraints

**MUST:**
- MUST run `pnpm design:review --screens route-results-screen` end-to-end and capture the `report.json` + `report.html` to `gate-evidence/design-review-report.{json,html}`
- MUST execute the real-iPhone XCUITest from RR-S09-E2E-IOS-T01 on a physical iPhone and capture the `.xcresult` to `gate-evidence/route-results-real-iphone.xcresult/`
- MUST execute the Android emulator walk (alt-select + refine + dismiss/recall) and capture screenshots to `gate-evidence/android-emulator-walk/`
- MUST mark any Android-only steps that cannot be validated as MANUAL/BLOCKED per `RULES.md` §"Real Device E2E Testing"
- MUST verify the `design-review` skill (at `~/.claude/skills/design-review/SKILL.md`) reads the report and produces actionable findings; record skill output to `gate-evidence/design-review-skill-output.md`
- MUST produce a gate sign-off summary at `gate-evidence/SPRINT-09-GATE.md` listing: (a) all 13 preceding tasks marked `completed`, (b) zero high-severity design-review findings, (c) iPhone E2E pass with attachments, (d) Android emulator walk findings, (e) any open follow-ups or punted gaps

**NEVER:**
- NEVER mark the gate PASS while any subordinate task is incomplete or any high-severity design-review finding remains
- NEVER mark Android-only steps as PASS based solely on iOS evidence
- NEVER skip the Convex DB query confirming sessionId reuse from RR-S09-E2E-IOS-T01
- NEVER bypass `pnpm design:review` with stub data

**STRICTLY:**
- STRICTLY follow `RULES.md` §"Real Device E2E Testing" — real-device evidence is required for non-sandbox code
- STRICTLY follow the Sprint 08 gate task pattern (PLAN-S08-T11) for evidence directory layout and sign-off summary format
- STRICTLY honest: if a verification step fails, record the failure in the sign-off; do not retro-soften verdicts per project memory rule "Honest verdicts never softened"

## Specification

**Objective:** Execute the Sprint 09 Human Testing Gate verification: run design-review pipeline, real-iPhone E2E, Android emulator walk; record evidence; produce sign-off summary.

**Success State:** `gate-evidence/SPRINT-09-GATE.md` exists and records all evidence categories with explicit PASS / FAIL per category; design-review report shows zero high-severity issues; iPhone xcresult passes; Android emulator screenshots show alt-select / refine / dismiss/recall behaviors; project design-review skill confirms.

## Acceptance Criteria

### AC-1 — `pnpm design:review --screens route-results-screen` zero high-severity

**GIVEN** all preceding capture tasks (RR-S09-IOS-T05, RR-S09-AND-T05) are complete
**WHEN** `pnpm design:review --screens route-results-screen` runs
**THEN** `report.json` contains 7 variant entries (or 14 if per-platform) AND zero entries have `severity == 'high'`; report copied to `gate-evidence/design-review-report.{json,html}`
**Verify:** `pnpm design:review --screens route-results-screen && jq '[.findings[] | select(.severity == "high")] | length' ios/build/design-review/route-results-screen/report.json` returns 0

### AC-2 — Real-iPhone XCUITest pass with `.xcresult` evidence

**GIVEN** RR-S09-E2E-IOS-T01 test method is complete
**WHEN** the E2E test runs on a physical iPhone via `xcodebuild test`
**THEN** the test exits 0 AND `.xcresult` is copied to `gate-evidence/route-results-real-iphone.xcresult/`; xcresulttool extracts ≥ 6 attachment PNGs
**Verify:** `ls gate-evidence/route-results-real-iphone.xcresult/ && xcrun xcresulttool get --path gate-evidence/route-results-real-iphone.xcresult --format json | jq '.actions._values[].actionResult.testFailureSummaries._values | length'` returns 0

### AC-3 — Android emulator walk evidence captured

**GIVEN** Android RR-S09-AND-* tasks are complete
**WHEN** a human runs the route-results flow on Android Emulator and captures screenshots through alt-select + refine + dismiss/recall
**THEN** screenshots are stored under `gate-evidence/android-emulator-walk/` (≥ 4 screenshots: results, altSelected, refining, dismissed); any Android-only real-device gap is recorded MANUAL/BLOCKED in `SPRINT-09-GATE.md`
**Verify:** `ls gate-evidence/android-emulator-walk/*.png | wc -l` ≥ 4 AND `grep -E 'MANUAL|BLOCKED' gate-evidence/SPRINT-09-GATE.md | wc -l` ≥ 0 (acceptable; presence is informational)

### AC-4 — Project `design-review` skill passes against the new view

**GIVEN** the gate-evidence design-review report exists
**WHEN** the `design-review` skill (or `/design-review` command) is invoked against `route-results-screen`
**THEN** the skill processes the report, produces actionable findings (or confirms zero findings), and writes output to `gate-evidence/design-review-skill-output.md`
**Verify:** `test -f gate-evidence/design-review-skill-output.md && wc -l gate-evidence/design-review-skill-output.md | awk '{print $1}'` ≥ 5 (skill produced non-trivial output)

### AC-5 — All 13 preceding tasks marked completed

**GIVEN** Sprint 09 task list
**WHEN** the gate runs
**THEN** all tasks RR-S09-DR-T01, RR-S09-CVX-T01, RR-S09-IOS-T01..T05, RR-S09-AND-T01..T05, RR-S09-E2E-IOS-T01 have status `Done` in their task file frontmatter; gate-evidence summary enumerates each task ID + completion commit SHA
**Verify:** `grep -l "^> Status:" .spec/prds/v3-integration/tasks/sprint-09-route-results-screen/RR-S09-*.md | xargs grep -L "Status: ✅ Done" | grep -v RR-S09-T11` returns empty (all tasks except this gate are Done)

### AC-6 — Sign-off summary published with PASS/FAIL per category

**GIVEN** the four evidence categories are gathered
**WHEN** the gate is signed off
**THEN** `gate-evidence/SPRINT-09-GATE.md` exists with sections: Overview, Task Completion, Design Review Verdict (PASS/FAIL), iPhone E2E Verdict, Android Walk Verdict, Skill Verdict, Overall Verdict, Open Follow-ups; each verdict is one of PASS / FAIL / MANUAL / BLOCKED
**Verify:** `test -f gate-evidence/SPRINT-09-GATE.md && grep -c '^## ' gate-evidence/SPRINT-09-GATE.md` ≥ 7

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Design-review pipeline zero high-severity | AC-1 | `jq '[.findings[] \| select(.severity == "high")] \| length' report.json` returns 0 | happy_path |
| TC-2 | Real-iPhone xcresult exists with passing tests | AC-2 | `xcrun xcresulttool` test failure count is 0 | happy_path |
| TC-3 | Android emulator walk evidence captured | AC-3 | `ls gate-evidence/android-emulator-walk/*.png \| wc -l` ≥ 4 | happy_path |
| TC-4 | Skill output recorded with non-trivial content | AC-4 | `wc -l gate-evidence/design-review-skill-output.md` ≥ 5 | happy_path |
| TC-5 | All 13 preceding tasks marked Done | AC-5 | grep filter on task frontmatter | edge |
| TC-6 | Sign-off summary published with all sections | AC-6 | `grep -c '^## ' gate-evidence/SPRINT-09-GATE.md` ≥ 7 | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `RULES.md` | "Real Device E2E Testing", "Design Review Pipeline" | Gate requirements |
| `docs/REAL_DEVICE_E2E.md` | all | iPhone E2E setup + evidence pattern |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-T11-sprint-gate.md` | all | [PRIMARY PATTERN] Sprint 08 gate task — evidence layout + sign-off summary format |
| `.spec/prds/v3-integration/ROADMAP.md` | Sprint 09 section | Gate test steps |
| `~/.claude/skills/design-review/SKILL.md` | all | Design-review skill API |
| `scripts/design-review/` | all | Pipeline scripts |

## Guardrails

**Write-Allowed:**
- `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/gate-evidence/**` (NEW — all evidence files)
- `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/SPRINT-09-GATE.md` (NEW — sign-off summary)

**Write-Prohibited:**
- All other Sprint 09 task files — execution only, not edit
- `ios/**`, `android/**`, `server/**` — no code changes from this task
- `scripts/design-review/**` — pipeline scripts owned by Sprint 05

## Design

**References:**
- Sprint 08 PLAN-S08-T11 (gate task pattern)
- `RULES.md` §"Real Device E2E Testing" + §"Design Review Pipeline"
- `docs/REAL_DEVICE_E2E.md`

**Interaction Notes:** This task is execution-only. The qa-engineer agent runs the pipeline, captures evidence, and produces the sign-off summary. If any verification fails, the gate FAILs and the qa-engineer files follow-up tasks rather than retro-softening verdicts (per project memory rule).

**Pattern:** Sprint 08 PLAN-S08-T11 evidence layout + sign-off summary format. Mirror exactly; swap the screen name in evidence paths.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-T11-sprint-gate.md`

**Anti-Pattern:** Marking gate PASS while finds remain; softening verdicts; merging iOS evidence into Android steps; bypassing the design-review pipeline with stub data.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `pnpm design:review --screens route-results-screen && jq '[.findings[] \| select(.severity == "high")] \| length' ios/build/design-review/route-results-screen/report.json` returns 0 |
| AC-2 | `xcrun xcresulttool get --path gate-evidence/route-results-real-iphone.xcresult --format json \| jq '.actions._values[].actionResult.testFailureSummaries._values \| length'` returns 0 |
| AC-3 | `ls gate-evidence/android-emulator-walk/*.png \| wc -l` ≥ 4 |
| AC-4 | `test -f gate-evidence/design-review-skill-output.md && wc -l gate-evidence/design-review-skill-output.md` ≥ 5 |
| AC-5 | Manual verification via grep on task frontmatter Status |
| AC-6 | `grep -c '^## ' gate-evidence/SPRINT-09-GATE.md` ≥ 7 |

## Agent Assignment

**Agent:** qa-engineer
**Rationale:** Gate verification task — running pipelines, capturing evidence, producing sign-off summary. No code changes. Matches `qa-engineer` mandate per RULES.md.

## Coding Standards

- `RULES.md` §"Real Device E2E Testing", §"Design Review Pipeline — View Snapshot Testing"
- Sprint 08 PLAN-S08-T11 evidence pattern

## Dependencies

**Depends on:**
- RR-S09-DR-T01, RR-S09-CVX-T01, RR-S09-IOS-T01..T05, RR-S09-AND-T01..T05, RR-S09-E2E-IOS-T01 (ALL 13 preceding tasks)

**Blocks:**
- Sprint 10 (RouteDetails bottom sheet — cannot start until Sprint 09 gate passes)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"pnpm design:review --screens route-results-screen produces zero high-severity findings; report copied to gate-evidence/","verify":"jq '[.findings[] | select(.severity == \"high\")] | length' report.json returns 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Real-iPhone XCUITest passes; .xcresult copied to gate-evidence with >= 6 attachments","verify":"xcrun xcresulttool test failure count == 0 + attachment count >= 6","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Android emulator walk evidence captured with >= 4 screenshots; Android-only gaps marked MANUAL/BLOCKED","verify":"ls gate-evidence/android-emulator-walk/*.png | wc -l >= 4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"design-review skill output recorded with non-trivial findings","verify":"wc -l gate-evidence/design-review-skill-output.md >= 5","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"All 13 preceding tasks marked Done","verify":"grep-based check on task frontmatter Status","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"gate-evidence/SPRINT-09-GATE.md exists with all sections and per-category PASS/FAIL verdicts","verify":"grep -c '^## ' gate-evidence/SPRINT-09-GATE.md >= 7","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Zero high-severity findings in design-review report","verify":"jq filter on report.json","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"xcresult tests pass + attachment count","verify":"xcrun xcresulttool","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Android emulator walk has >= 4 screenshots","verify":"ls *.png | wc -l >= 4","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Skill output >= 5 lines","verify":"wc -l","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"All 13 tasks Done","verify":"grep filter","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Gate summary has >= 7 sections","verify":"grep -c '^## '","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"}
  ]
}
-->
