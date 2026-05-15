# IDLE-S06-REM-GATE-T02 — Autocomplete gate evidence and signoff

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=qa-engineer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen -> ./SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-MAP-01, UC-FID-01

RUNTIME_COMMANDS:
  review:    pnpm design:review --screens idle-screen
  ios:       xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdlePlaceAutocompleteTests
  android:   ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdlePlaceAutocompleteTest'
```

---

## OUTCOME

Sprint 06 autocomplete closes only after backend, iOS, Android, and human evidence prove idle typing shows up to three Mapbox place recommendations without routing.

---

## CRITICAL CONSTRAINTS

- **MUST** run after IDLE-S06-REM-CVX-T02, IDLE-S06-REM-IOS-T02, and IDLE-S06-REM-AND-T02 pass.
- **MUST** archive evidence under `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/`.
- **MUST** verify max-three visible recommendations on both iOS and Android production idle input paths.
- **NEVER** count manual PlanRideSheet autocomplete as satisfying this idle-input gate.
- **STRICTLY** document Android device status as PASS or BLOCKED with exact evidence and follow-up owner.

---

## DONE WHEN

- [ ] AC-1: Backend autocomplete contract tests pass and evidence is archived (PRIMARY)
- [ ] AC-2: iOS idle autocomplete tests pass and simulator or real-device walkthrough evidence is archived
- [ ] AC-3: Android idle autocomplete tests pass and emulator/device status is archived
- [ ] AC-4: Manual run-book confirms max-three recommendations and no-routing-on-select on both platforms
- [ ] AC-5: `pnpm design:review --screens idle-screen` remains zero high after autocomplete UI changes
- [ ] Runtime commands above are recorded in gate evidence

---

## ACCEPTANCE CRITERIA

### AC-1: Backend contract evidence [PRIMARY]
- **GIVEN** Convex autocomplete actions are implemented
- **WHEN** backend autocomplete tests run
- **THEN** `gate-evidence/autocomplete/backend.md` records passing output for max-three suggest and retrieve behavior
- **VERIFY:** `test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/backend.md && rg -n "PASS|Exit 0|max-three|retrieve" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/backend.md`

### AC-2: iOS evidence
- **GIVEN** iOS autocomplete implementation is complete
- **WHEN** `IdlePlaceAutocompleteTests` run and QA walks the production idle input
- **THEN** `gate-evidence/autocomplete/ios.md` records typed query, max-three recommendations, selection, and no planning before Send
- **VERIFY:** `test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/ios.md && rg -n "max-three|no planning|IdlePlaceAutocompleteTests" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/ios.md`

### AC-3: Android evidence
- **GIVEN** Android autocomplete implementation is complete
- **WHEN** unit tests and available emulator/device checks run
- **THEN** `gate-evidence/autocomplete/android.md` records PASS or BLOCKED with exact reason and follow-up owner
- **VERIFY:** `test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/android.md && rg -n "PASS|BLOCKED|IdlePlaceAutocompleteTest" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/android.md`

### AC-4: Manual no-routing run-book
- **GIVEN** the rider types `Big Sur` in the idle input
- **WHEN** a recommendation is selected on iOS and Android
- **THEN** `manual-run.md` confirms at most three rows were visible and the app did not enter planning until Send
- **VERIFY:** `rg -n "iOS.*Big Sur|Android.*Big Sur|max 3|no routing|Send" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/manual-run.md`

### AC-5: Design review still passes
- **GIVEN** autocomplete UI changes are present
- **WHEN** design review runs for idle-screen
- **THEN** the report contains zero high-severity idle-screen issues and the report is linked from autocomplete evidence
- **VERIFY:** `pnpm design:review --screens idle-screen && jq '[.issues[]? | select(.screen=="idle-screen" and .severity=="high")] | length' .design-review/report.json`

---

## TEST CRITERIA

| ID | Statement | Maps To | Type |
|----|-----------|---------|------|
| TC-1 | Backend autocomplete evidence file exists after backend tests run | AC-1 | evidence |
| TC-2 | Backend evidence contains `max-three` after backend tests run | AC-1 | contract |
| TC-3 | iOS evidence contains `IdlePlaceAutocompleteTests` after iOS verification | AC-2 | evidence |
| TC-4 | iOS evidence contains `no planning` after recommendation selection | AC-2 | guardrail |
| TC-5 | Android evidence contains PASS or BLOCKED after Android verification | AC-3 | evidence |
| TC-6 | Manual run-book contains both iOS and Android Big Sur walkthroughs | AC-4 | manual |
| TC-7 | Manual run-book contains `max 3` after autocomplete walkthrough | AC-4 | manual |
| TC-8 | Idle-screen high-severity issue count equals 0 after design review | AC-5 | design_gate |

---

## SCOPE

**writeAllowed:**
- `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/**` (NEW/MODIFY)
- `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` (MODIFY only to link autocomplete evidence after pass)

**writeProhibited:**
- `server/**`, `ios/**`, `android/**` - implementation tasks own fixes
- `.design-review/**` as authored source; copy or summarize generated outputs into gate evidence
- Sprint 07 task files or planning-state implementation

---

## BOUNDARIES

✅ **Always:**
- Record exact commands, dates, platform, device/emulator, and artifact paths.
- Treat Android physical-device automation as BLOCKED if not available.
- Preserve existing Sprint 06 gate evidence rather than replacing it.

⚠️ **Ask First:**
- Marking Sprint 06 Done.
- Waiving design review because autocomplete is "small."
- Reclassifying autocomplete as manual-sheet-only.

---

## DELIVERABLE

- `gate-evidence/autocomplete/backend.md` (NEW): backend command output and contract summary.
- `gate-evidence/autocomplete/ios.md` (NEW): iOS tests and walkthrough evidence.
- `gate-evidence/autocomplete/android.md` (NEW): Android tests and emulator/device status.
- `gate-evidence/autocomplete/manual-run.md` (NEW): human walkthrough for max-three and no-routing-on-select behavior.

---

## AGENT INSTRUCTIONS

Do not start this task until the backend and platform autocomplete remediation tasks are complete. This is an evidence task only; if verification fails, record the failure and route fixes back to the owning platform task.

---

## READING LIST

1. `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` - sprint gate and human deliverable
2. `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-REM-CVX-T02-mapbox-searchbox-autocomplete-actions.md` - backend contract
3. `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-REM-IOS-T02-idle-input-place-autocomplete.md` - iOS behavior
4. `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/IDLE-S06-REM-AND-T02-idle-input-place-autocomplete.md` - Android behavior
5. `RULES.md` - real-device and verification standards
6. `docs/REAL_DEVICE_E2E.md` - iOS physical-device evidence pattern

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Backend evidence | `test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/backend.md` | Exit 0 |
| iOS evidence | `test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/ios.md` | Exit 0 |
| Android evidence | `test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/android.md` | Exit 0 |
| Manual evidence | `rg -n "iOS.*Big Sur|Android.*Big Sur|max 3|no routing|Send" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/manual-run.md` | Matches all required phrases |
| Design review | `pnpm design:review --screens idle-screen` | Exit 0 and zero high-severity idle-screen issues |

---

## OUT OF SCOPE

- Fixing backend or platform implementation defects
- Running Sprint 07 planning/routing flows
- Waiving Android evidence without a BLOCKED record

---

## REVIEW

Reviewer approves only when evidence proves the new idle autocomplete behavior on both platforms and shows no planning/routing starts until explicit Send.

---

## DESIGN

**References:** `.spec/design/system/views/mapapp/idle/README.md`, `.spec/design/system/views/mapapp/idle/idle-screen.html`

**Pattern:** Gate evidence is durable sprint closure data under the sprint folder.

**Pattern source:** `IDLE-S06-REM-GATE-T01-sprint-gate-evidence-and-signoff.md`.

**Anti-pattern:** Treating unit-test success alone as enough for a user-visible autocomplete gate.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-REM-CVX-T02, IDLE-S06-REM-IOS-T02, IDLE-S06-REM-AND-T02
- **Blocks:** Sprint 06 final signoff and Sprint 07 dispatch

---

## CODING STANDARDS

- `RULES.md` section "Real Device E2E Testing"
- `RULES.md` section "Verification Standards by Platform"
- `/Users/justinrich/Projects/brain/docs/REQUIREMENT-TRACKING.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN Convex autocomplete actions are implemented WHEN backend tests run THEN backend.md records passing max-three suggest and retrieve evidence",
      "verify": "test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/backend.md && rg -n \"PASS|Exit 0|max-three|retrieve\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/backend.md",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN iOS autocomplete is complete WHEN tests and walkthrough run THEN ios.md records max-three recommendations, selection, and no planning before Send",
      "verify": "test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/ios.md && rg -n \"max-three|no planning|IdlePlaceAutocompleteTests\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/ios.md",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN Android autocomplete is complete WHEN unit tests and available device checks run THEN android.md records PASS or BLOCKED with reason",
      "verify": "test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/android.md && rg -n \"PASS|BLOCKED|IdlePlaceAutocompleteTest\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/android.md",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN rider types Big Sur in idle input WHEN recommendation selected on both platforms THEN manual-run.md confirms max-three and no routing until Send",
      "verify": "rg -n \"iOS.*Big Sur|Android.*Big Sur|max 3|no routing|Send\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/manual-run.md",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN autocomplete UI changes are present WHEN design review runs THEN idle-screen high-severity issue count is zero",
      "verify": "pnpm design:review --screens idle-screen && jq '[.issues[]? | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Backend autocomplete evidence file exists after backend tests run",
      "maps_to_ac": "AC-1",
      "verify": "test -f .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/backend.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Backend evidence contains max-three after backend tests run",
      "maps_to_ac": "AC-1",
      "verify": "rg -n \"max-three\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/backend.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "iOS evidence contains IdlePlaceAutocompleteTests after iOS verification",
      "maps_to_ac": "AC-2",
      "verify": "rg -n \"IdlePlaceAutocompleteTests\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/ios.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "iOS evidence contains no planning after recommendation selection",
      "maps_to_ac": "AC-2",
      "verify": "rg -n \"no planning\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/ios.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Android evidence contains PASS or BLOCKED after Android verification",
      "maps_to_ac": "AC-3",
      "verify": "rg -n \"PASS|BLOCKED\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/android.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Manual run-book contains both iOS and Android Big Sur walkthroughs",
      "maps_to_ac": "AC-4",
      "verify": "rg -n \"iOS.*Big Sur|Android.*Big Sur\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/manual-run.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Manual run-book contains max 3 after autocomplete walkthrough",
      "maps_to_ac": "AC-4",
      "verify": "rg -n \"max 3\" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/autocomplete/manual-run.md",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Idle-screen high-severity issue count equals 0 after design review",
      "maps_to_ac": "AC-5",
      "verify": "pnpm design:review --screens idle-screen && jq '[.issues[]? | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    }
  ]
}
-->
