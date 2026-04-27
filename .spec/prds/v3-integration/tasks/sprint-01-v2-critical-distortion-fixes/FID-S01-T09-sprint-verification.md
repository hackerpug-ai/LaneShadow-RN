# FID-S01-T09 — Sprint 01 verification

**Sprint:** [SPRINT.md](./SPRINT.md) · **Agent:** qa-engineer · **Estimate:** 60 min · **Type:** VERIFICATION · **Priority:** P0 · **Effort:** S · **Status:** Backlog

## BACKGROUND

Sibling tasks T01–T08 modify iOS and Android UI components to close UC-FID-01 HIGH-severity distortion gaps. This task is the sprint gate: capture sandbox screenshots on both platforms, visually compare against `.spec/design/system/` HTML/PNG references, verify cross-platform parity, and produce VERIFICATION.md with a verdict per component.

## CRITICAL CONSTRAINTS

- MUST capture iOS sandbox screenshots for EVERY component modified by FID-S01-T01..T08.
- MUST capture Android sandbox screenshots for EVERY component modified by FID-S01-T01..T08.
- MUST compare each captured screenshot side-by-side against the corresponding HTML/PNG mockup in `.spec/design/system/`.
- NEVER mark any sibling task or sprint complete without recorded visual evidence (PNG file path + verdict).
- STRICTLY require cross-platform story-id parity: iOS and Android stories MUST share identical lowercase/dot-separated/kebab-case id strings (RULES.md#cross-platform-component-parity).
- NEVER edit `ios/`, `android/`, `react-native/`, or `server/` source code — verification only; if a regression is found, file a remediation task and STOP.
- NEVER soften a verdict: a component that does not match the mockup is FAIL, even if the deviation is small.

## SPECIFICATION

**Objective:** Produce a sprint-level verification report at `.spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md` containing, for every component touched by FID-S01-T01..T08: (a) iOS sandbox screenshot path, (b) Android sandbox screenshot path, (c) reference mockup path under `.spec/design/system/`, (d) PASS/FAIL verdict, (e) one-sentence rationale tied to the originating task's gate sentence. Sprint cannot be declared Done until this report shows PASS for every component and `pnpm snapshots:check` is green.

**Success state:** VERIFICATION.md exists with one row per modified component, all rows show PASS, screenshots/ subdirectory contains all referenced PNGs for both platforms, `pnpm snapshots:check` exits 0, `pnpm snapshots:parity-coverage` shows no orphan stories, and every iOS story id has a matching Android story id.

## ACCEPTANCE CRITERIA

- **AC-1** GIVEN T09 picked up, WHEN qa-engineer inspects sprint task board, THEN all 8 sibling tasks (T01..T08) are status Done with completion artifacts committed; if any sibling not Done, T09 halts and reports the blocker.
  - verify: `grep -l 'status: Done' .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T0[1-8]*.md | wc -l` (expect 8)
- **AC-2** GIVEN iOS sandbox app is built and runnable, WHEN qa-engineer runs iOS snapshot capture flow for each modified component, THEN a PNG exists under sprint `screenshots/ios/` named after canonical story id.
  - verify: `ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/ios/*.png`
- **AC-3** GIVEN Android sandbox built and runnable, WHEN qa-engineer runs Android snapshot capture flow, THEN PNG exists under `screenshots/android/` named identically to iOS counterpart.
  - verify: `ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/android/*.png`
- **AC-4** GIVEN screenshots captured, WHEN qa-engineer compares each to corresponding reference under `.spec/design/system/`, THEN VERIFICATION.md is written to sprint folder with one table row per component containing component id, iOS screenshot path, Android screenshot path, mockup reference path, PASS/FAIL verdict, and rationale referencing originating task's gate sentence.
  - verify: `test -f .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md`
- **AC-5** GIVEN all screenshots captured and report written, WHEN qa-engineer runs `pnpm snapshots:check`, THEN command exits 0 (cross-platform parity holds, no orphan stories, no missing snapshots).
  - verify: `pnpm snapshots:check`
- **AC-6** GIVEN VERIFICATION.md complete, WHEN report reviewed, THEN every row shows PASS; if any row FAIL, sprint NOT Done and remediation task filed referencing failing component and originating task.
  - verify: `! grep -i 'FAIL' .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md`

## TEST CRITERIA

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | All 8 sibling task files show status: Done | AC-1 | `grep -l 'status: Done' .../FID-S01-T0[1-8]*.md \| wc -l  # expect 8` |
| TC-2 | iOS screenshots exist under sprint `screenshots/ios/` | AC-2 | `ls .../screenshots/ios/*.png` |
| TC-3 | Android screenshots exist under sprint `screenshots/android/` | AC-3 | `ls .../screenshots/android/*.png` |
| TC-4 | Every iOS screenshot filename has identical Android counterpart | AC-3 | `diff <(ls .../screenshots/ios/ \| sort) <(ls .../screenshots/android/ \| sort)` |
| TC-5 | VERIFICATION.md exists with one row per modified component | AC-4 | `test -f .../VERIFICATION.md` |
| TC-6 | Cross-platform snapshot parity check passes | AC-5 | `pnpm snapshots:check` |
| TC-7 | Snapshot coverage report shows no orphan stories | AC-5 | `pnpm snapshots:parity-coverage` |
| TC-8 | VERIFICATION.md contains zero FAIL verdicts | AC-6 | `! grep -i 'FAIL' .../VERIFICATION.md` |

## READING LIST

- `[PHASE: RED]` `.spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/SPRINT.md` — sprint scope, gate sentences
- `[PHASE: GREEN]` `.spec/design/system/` — source of truth for visual comparison
- `[PHASE: RED]` `.spec/prds/v3-integration/12-uc-fid.md` — UC-FID-01 user-visible outcome
- `[PHASE: BOTH]` `.../FID-S01-T01..T08.md` — sibling task gate sentences and completion artifacts
- `[PHASE: RED]` `RULES.md` — Cross-Platform Component Parity rule

## GUARDRAILS

**WRITE-ALLOWED:**
- `.spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md`
- `.spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/ios/*.png`
- `.spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/android/*.png`
- `.spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/REMEDIATION-*.md` (only if FAIL verdicts)

**WRITE-PROHIBITED:** `ios/**`, `android/**`, `server/**`, `react-native/**`, `.spec/design/system/**`, any FID-S01-T01..T08 task file

## DESIGN

**References:** `.spec/design/system/` HTML/PNG mockups for every component touched by FID-S01-T01..T08 (specific files identified during reading pass).

**Pattern:** Sprint summary doc at sprint root named `VERIFICATION.md`, with header describing scope, "Gate Commands" section showing exit codes, and verdict table. Mirrors prior sprint closure artifacts under `.spec/prds/v3-integration/tasks/`.

**Anti-pattern:** Rubber-stamping the sprint by running `pnpm snapshots:check` and declaring Done without producing screenshots or visual comparison. Snapshot parity proves iOS == Android; it does NOT prove either matches the design mockup. Visual diff against `.spec/design/system/` is the load-bearing step.

## RED PHASE INSTRUCTIONS

VERIFICATION tasks do not author new tests. The "red" phase here is verifying the existing snapshot harness is wired and all 8 sibling tasks are Done. Concretely: (1) confirm each sibling task file shows `status: Done`; (2) confirm `pnpm sandbox:ios:snapshot` and `pnpm sandbox:android:snapshot` scripts exist (check workspace `package.json`); (3) confirm `pnpm snapshots:check` exists. If any missing, halt and escalate — do not invent a workaround.

## GREEN PHASE INSTRUCTIONS

1. From repo root, run `pnpm sandbox:ios:snapshot` and direct PNGs into `.spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/ios/`.
2. Run `pnpm sandbox:android:snapshot` writing into parallel `screenshots/android/` directory. Filenames MUST be canonical story id with `.png` extension and byte-identical between platforms.
3. Open each iOS/Android pair next to the referenced HTML/PNG mockup under `.spec/design/system/` and record verdict.
4. Author `VERIFICATION.md` in sprint root with markdown table: `| Component (story id) | iOS PNG | Android PNG | Mockup Ref | Verdict | Rationale | Originating Task |`.
5. Run `pnpm snapshots:check` and `pnpm snapshots:parity-coverage`; paste exit codes into VERIFICATION.md "Gate Commands" section.
6. If everything passes, commit `screenshots/` and VERIFICATION.md with message `verify(sprint-01): visual parity report — all components PASS`. If any FAIL, do NOT mark sprint Done; file a remediation task and report.

## REVIEW NOTES

- Verify cross-platform story IDs match before declaring parity — diff iOS and Android screenshot directory listings; any asymmetry is a hard fail.
- Sprint summary must reference each gate sentence test step from the originating sibling task — do not write generic "looks good" rationales.
- Watch for subagent rationalization in sibling task notes ("pre-existing", "out of scope") — if a sibling task waved off a regression, T09 must catch it visually.
- Do NOT soften verdicts; a FAIL is a FAIL even if the deviation is one pixel. File remediation, do not paper over.
- If `snapshots:check` passes but visual review fails, the snapshot test is incomplete — note in VERIFICATION.md as follow-up to harden the harness.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| snapshots-check | `pnpm snapshots:check` | exit 0 |
| parity-coverage | `pnpm snapshots:parity-coverage` | no orphan or missing stories |
| story-id-diff | `diff <(ls screenshots/ios/) <(ls screenshots/android/)` | empty |
| no-fail-verdicts | `! grep -i 'FAIL' VERIFICATION.md` | exit 0 |

## CODING STANDARDS

`RULES.md#cross-platform-component-parity`

## DEPENDENCIES

- **depends_on:** [FID-S01-T01, FID-S01-T02, FID-S01-T03, FID-S01-T04, FID-S01-T05, FID-S01-T06, FID-S01-T07, FID-S01-T08]
- **blocks:** []

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"All 8 sibling tasks Done","verify":"grep -l 'status: Done' .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T0[1-8]*.md | wc -l","phase":"review"},{"id":"AC-2","type":"acceptance_criterion","description":"iOS screenshots captured","verify":"ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/ios/*.png","phase":"green"},{"id":"AC-3","type":"acceptance_criterion","description":"Android screenshots captured with matching ids","verify":"ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/android/*.png","phase":"green"},{"id":"AC-4","type":"acceptance_criterion","description":"VERIFICATION.md written with verdict per component","verify":"test -f .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md","phase":"green"},{"id":"AC-5","type":"acceptance_criterion","description":"snapshots:check passes","verify":"pnpm snapshots:check","phase":"green"},{"id":"AC-6","type":"acceptance_criterion","description":"Zero FAIL verdicts","verify":"! grep -i 'FAIL' .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md","phase":"review"},{"id":"TC-1","type":"test_criterion","description":"8 siblings status Done","maps_to_ac":"AC-1","verify":"grep -l 'status: Done' .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/FID-S01-T0[1-8]*.md | wc -l","phase":"review"},{"id":"TC-2","type":"test_criterion","description":"iOS PNGs exist","maps_to_ac":"AC-2","verify":"ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/ios/*.png","phase":"green"},{"id":"TC-3","type":"test_criterion","description":"Android PNGs exist","maps_to_ac":"AC-3","verify":"ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/android/*.png","phase":"green"},{"id":"TC-4","type":"test_criterion","description":"iOS+Android filename diff is empty","maps_to_ac":"AC-3","verify":"diff <(ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/ios/ | sort) <(ls .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/screenshots/android/ | sort)","phase":"green"},{"id":"TC-5","type":"test_criterion","description":"VERIFICATION.md exists","maps_to_ac":"AC-4","verify":"test -f .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md","phase":"green"},{"id":"TC-6","type":"test_criterion","description":"snapshots:check passes","maps_to_ac":"AC-5","verify":"pnpm snapshots:check","phase":"green"},{"id":"TC-7","type":"test_criterion","description":"parity-coverage no orphans","maps_to_ac":"AC-5","verify":"pnpm snapshots:parity-coverage","phase":"green"},{"id":"TC-8","type":"test_criterion","description":"Zero FAIL in report","maps_to_ac":"AC-6","verify":"! grep -i 'FAIL' .spec/prds/v3-integration/tasks/sprint-01-v2-critical-distortion-fixes/VERIFICATION.md","phase":"review"}]}
-->
