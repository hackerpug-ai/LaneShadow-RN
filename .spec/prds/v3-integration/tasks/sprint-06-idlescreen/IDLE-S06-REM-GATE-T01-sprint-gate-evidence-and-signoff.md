# IDLE-S06-REM-GATE-T01 — Sprint gate evidence and signoff
> Status: 🔴 Needs Fixes
> Cycle: 2
> Commit: 38026fa883362923c4e25cb6cfb6ea50c2789220
> Reviewer: swift-reviewer
> Fix: FIX-IDLE-S06-REM-GATE-T01-C1
> Updated: 2026-05-05T09:27:29.710Z

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=qa-engineer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen -> ./SPRINT.md
PRD_REFS:   UC-FID-01, UC-MAP-01, UC-CHAT-01

RUNTIME_COMMANDS:
  review:    pnpm design:review --screens idle-screen
  ios-real:  xcodebuild test -scheme LaneShadow -destination 'platform=iOS,name=<physical iPhone>' -only-testing:LaneShadowUITests/DesignReviewCaptureTests
  android:   ./gradlew :app:connectedDebugAndroidTest
```

---

## OUTCOME

Sprint 06 closes only after the repaired build has idle-screen design-review zero-high evidence, iOS real-device XCUITest evidence, Android test evidence or an honest BLOCKED record, and a signed human run-book.

---

## CRITICAL CONSTRAINTS

- **MUST** run after all remediation tasks pass; this task does not write production fixes.
- **MUST** archive evidence under `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/`.
- **MUST** record real iPhone XCUITest evidence for the non-sandbox iOS flow.
- **NEVER** mark SPRINT.md or ROADMAP.md Done from stale `.design-review` output.
- **STRICTLY** document Android as PASS or BLOCKED with exact reason; no silent omission.

---

## DONE WHEN

- [x] AC-1: `pnpm design:review --screens idle-screen` report has zero high-severity `idle-screen` issues (PRIMARY)
- [ ] AC-2: iOS real-device `.xcresult` is archived under `gate-evidence/ios-real-device/` ← FAIL: `find .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-...
- [x] AC-3: Android connected test result is archived or `android-device.md` records BLOCKED with follow-up
- [ ] AC-4: `manual-run.md` signs off the seven SPRINT.md human test steps with screenshots/evidence ← FAIL: `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/manual-ru...
- [ ] AC-5: `SPRINT.md` and `ROADMAP.md` statuses change to Done only after AC-1..4 pass ← FAIL: `SPRINT.md` is missing at `.spec/prds/v3-integration/tasks/sprint-06-idlescre...
- [ ] Runtime commands above are recorded in gate evidence

---

## ACCEPTANCE CRITERIA

### AC-1: Idle design-review zero high [PRIMARY]
- **GIVEN** remediated captures and current references
- **WHEN** `pnpm design:review --screens idle-screen` runs
- **THEN** `.design-review/report.json` has zero high-severity issues where `screen == "idle-screen"`
- **VERIFY:** `pnpm design:review --screens idle-screen && jq '[.issues[]? | select(.screen=="idle-screen" and .severity=="high")] | length' .design-review/report.json`

### AC-2: iOS real-device evidence
- **GIVEN** a physical iPhone is available and provisioned
- **WHEN** `DesignReviewCaptureTests` run against that device
- **THEN** at least one `.xcresult` bundle is copied to `gate-evidence/ios-real-device/`
- **VERIFY:** `find .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-real-device -name '*.xcresult' | wc -l`

### AC-3: Android evidence or honest block
- **GIVEN** an Android emulator/device is available or unavailable
- **WHEN** Android gate testing is attempted
- **THEN** `connectedDebugAndroidTest` output is archived, or `android-device.md` says `BLOCKED` with reason and follow-up owner
- **VERIFY:** `test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/android-device.md`

### AC-4: Human run-book
- **GIVEN** SPRINT.md has seven Human Test Deliverable steps
- **WHEN** QA walks the repaired build
- **THEN** `manual-run.md` records pass/fail for all seven steps with timestamps and reviewer initials
- **VERIFY:** `rg -n "^- \\[[ x]\\] Step [1-7]:" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/manual-run.md`

### AC-5: Status flip after evidence
- **GIVEN** AC-1 through AC-4 pass
- **WHEN** the sprint is closed
- **THEN** SPRINT.md and ROADMAP.md list Sprint 06 as Done and link to `gate-evidence/`
- **VERIFY:** `rg -n "status: Done|Sprint 06.*Done|gate-evidence" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md .spec/prds/v3-integration/ROADMAP.md`

---

## TEST CRITERIA

| ID | Statement | Maps To | Type |
|----|-----------|---------|------|
| TC-1 | High-severity idle-screen issue count equals 0 | AC-1 | happy_path |
| TC-2 | iOS real-device evidence folder contains at least one `.xcresult` | AC-2 | happy_path |
| TC-3 | Android device record exists | AC-3 | evidence |
| TC-4 | Manual run-book records seven numbered steps | AC-4 | evidence |
| TC-5 | SPRINT.md contains `status: Done` after evidence is complete | AC-5 | contract |
| TC-6 | ROADMAP.md references gate evidence after sprint close | AC-5 | contract |

---

## Remediation Trail

| Cycle | FIX | Failed Reqs | Reviewer | At |
|---|---|---|---|---|
| 2 | FIX-IDLE-S06-REM-GATE-T01-C1 | AC-2, AC-4, AC-5, TC-5, TC-6 | swift-reviewer | 2026-05-05T09:27:29.711Z |

## SCOPE

**writeAllowed:**
- `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/**` (NEW/MODIFY)
- `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` (MODIFY status and evidence link only after pass)
- `.spec/prds/v3-integration/ROADMAP.md` (MODIFY Sprint 06 status and evidence link only after pass)

**writeProhibited:**
- `server/**`, `ios/**`, `android/**`, `scripts/design-review/**` - remediation tasks own fixes
- `.design-review/**` as authored source; copy generated outputs into `gate-evidence/`
- Any future sprint task files

---

## AGENT INSTRUCTIONS

Do not start this task until IDLE-S06-REM-CVX-T01, IDLE-S06-REM-IOS-T01, IDLE-S06-REM-AND-T01, and IDLE-S06-REM-QA-T01 are complete. Capture exact commands, dates, device names, and artifact paths in the evidence folder.

---

## READING LIST

1. `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` - gate and seven human steps
2. `RULES.md` - Real Device E2E Testing
3. `docs/REAL_DEVICE_E2E.md` - iOS physical-device procedure
4. `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-T11-sprint-gate.md` - existing gate task
5. `.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/SPRINT.md` - pipeline operations

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Design review | `pnpm design:review --screens idle-screen` | Exit 0 |
| Zero high | `jq '[.issues[]? | select(.screen=="idle-screen" and .severity=="high")] | length' .design-review/report.json` | `0` |
| iOS real device | `find .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-real-device -name '*.xcresult' | wc -l` | `>= 1` |
| Android record | `test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/android-device.md` | Exit 0 |
| Manual run | `rg -n "^- \\[[ x]\\] Step [1-7]:" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/manual-run.md` | 7 entries |

---

## OUT OF SCOPE

- Fixing implementation or design-review pipeline defects found during gate run
- Waiving real-device evidence
- Starting Sprint 07

---

## REVIEW

Reviewer approves only when the evidence folder is self-contained enough for a future reader to reproduce the decision without relying on terminal scrollback.

---

## DESIGN

**References:** `.spec/design/system/views/idle-screen/README.md`, `.spec/design/system/refs/idle-screen/`

**Pattern:** Gate evidence is immutable sprint closure data, not a generated scratch directory.

**Anti-pattern:** Copying a stale `.design-review/report.json` for `test-screen` and calling the idle gate complete.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-REM-CVX-T01, IDLE-S06-REM-IOS-T01, IDLE-S06-REM-AND-T01, IDLE-S06-REM-QA-T01
- **Blocks:** Sprint 07 dispatch

---

## CODING STANDARDS

- `RULES.md` section "Real Device E2E Testing"
- `RULES.md` section "Verification Standards by Platform"
- `/Users/justinrich/Projects/brain/docs/ANTI-STUB-REVIEW.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN remediated captures WHEN pnpm design:review --screens idle-screen runs THEN high-severity idle-screen issue count is 0",
      "verify": "pnpm design:review --screens idle-screen && jq '[.issues[]? | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "`pnpm design:review --screens idle-screen` completed successfully and `jq '[.issues[]? | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json` returned `0`; `.design-review/report.json:165-168`",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN physical iPhone WHEN DesignReviewCaptureTests run THEN .xcresult archived under gate-evidence/ios-real-device",
      "verify": "find .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-real-device -name '*.xcresult' | wc -l",
      "maps_to_ac": null,
      "satisfied": false,
      "evidence": "`find .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-real-device -name '*.xcresult' | wc -l` returned `2`, but `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-real-device/README.md:11-15,24-26` says the physical-device run was blocked because the phone was locked and `DesignReviewCaptureTests` did not execute on hardware",
      "remediation": "Unlock the physical iPhone, rerun `xcodebuild test ... -only-testing:LaneShadowUITests/DesignReviewCaptureTests` to actual hardware execution, and archive the successful `.xcresult` and logs under `gate-evidence/ios-real-device`.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN Android testing attempted WHEN complete or blocked THEN android-device.md records result",
      "verify": "test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/android-device.md",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "`.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/android-device.md:1-18` records the blocked Android attempt and next steps",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN seven human steps WHEN QA walks repaired build THEN manual-run.md records all seven steps",
      "verify": "rg -n \"^- \\\\[[ x]\\\\] Step [1-7]:\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/manual-run.md",
      "maps_to_ac": null,
      "satisfied": false,
      "evidence": "`.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/manual-run.md:4-15` shows `Reviewer initials: PENDING`, `Status: BLOCKED`, and all seven checklist items remain unchecked",
      "remediation": "Have human QA walk the repaired build, record reviewer initials, mark each of the seven steps with pass/fail state, and attach the referenced evidence in `manual-run.md`.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN evidence complete WHEN sprint closes THEN SPRINT.md and ROADMAP.md list Done with gate-evidence link",
      "verify": "rg -n \"status: Done|Sprint 06.*Done|gate-evidence\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md .spec/prds/v3-integration/ROADMAP.md",
      "maps_to_ac": null,
      "satisfied": false,
      "evidence": "`SPRINT.md` is missing at `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` (rg exit 2), `.spec/prds/v3-integration/ROADMAP.md:48,404` still show Sprint 06 `In Progress`, and `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/decisions.md:4-11` explicitly says not to flip Sprint 06 to `Done`",
      "remediation": "Add or restore the Sprint 06 `SPRINT.md`, update both `SPRINT.md` and `ROADMAP.md` to `Done` only after the gate evidence is complete, and include the required `gate-evidence` reference/link in the roadmap/sprint docs.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "High-severity idle-screen issue count equals 0",
      "maps_to_ac": "AC-1",
      "verify": "jq '[.issues[]? | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json",
      "satisfied": true,
      "evidence": "`jq '[.issues[]? | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json` returned `0`",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "iOS real-device evidence folder contains at least one .xcresult",
      "maps_to_ac": "AC-2",
      "verify": "find .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-real-device -name '*.xcresult' | wc -l",
      "satisfied": true,
      "evidence": "`find .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-real-device -name '*.xcresult' | wc -l` returned `2`",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Android device record exists",
      "maps_to_ac": "AC-3",
      "verify": "test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/android-device.md",
      "satisfied": true,
      "evidence": "`test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/android-device.md` exited `0`",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Manual run-book records seven numbered steps",
      "maps_to_ac": "AC-4",
      "verify": "rg -n \"^- \\\\[[ x]\\\\] Step [1-7]:\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/manual-run.md",
      "satisfied": true,
      "evidence": "`rg -n \"^- \\[[ x]\\] Step [1-7]:\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/manual-run.md` matched lines `9-15`",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "SPRINT.md contains status Done after evidence is complete",
      "maps_to_ac": "AC-5",
      "verify": "rg -n \"status: Done\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md",
      "satisfied": false,
      "evidence": "`rg -n \"status: Done\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` failed with `No such file or directory` and exit code `2`",
      "remediation": "Create or restore the Sprint 06 `SPRINT.md` at the required path and set its status to `Done` once the gate is actually complete.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "ROADMAP.md references gate evidence after sprint close",
      "maps_to_ac": "AC-5",
      "verify": "rg -n \"gate-evidence\" .spec/prds/v3-integration/ROADMAP.md",
      "satisfied": false,
      "evidence": "`rg -n \"gate-evidence\" .spec/prds/v3-integration/ROADMAP.md` returned exit code `1` with no matches",
      "remediation": "Add the required `gate-evidence` reference to Sprint 06 in `.spec/prds/v3-integration/ROADMAP.md` after the signoff artifacts are complete.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "38026fa883362923c4e25cb6cfb6ea50c2789220"
    }
  ]
}
-->
