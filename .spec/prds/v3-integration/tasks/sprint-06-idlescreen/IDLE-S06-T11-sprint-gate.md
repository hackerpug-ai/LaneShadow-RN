# IDLE-S06-T11 — Sprint 6 Gate: `pnpm design:review --screens idle-screen` zero high + XCUITest evidence
> Status: 🟡 In Progress
> Cycle: 1
> Updated: 2026-05-05T05:58:08.164Z

```
TASK_TYPE:  FEATURE
STATUS:     In Progress
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=qa-engineer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen → ./SPRINT.md
PRD_REFS:   UC-FID-01, UC-MAP-01, UC-CHAT-01

RUNTIME_COMMANDS:
  capture:   xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReviewCaptureTests
  review:    pnpm design:review --screens idle-screen
  e2e:       xcodebuild test -scheme LaneShadow -destination 'platform=iOS,name=<physical iPhone>' -only-testing:LaneShadowUITests/DesignReviewCaptureTests
  android:   ./gradlew :app:connectedDebugAndroidTest
  manifest:  pnpm design:references
```

---

## OUTCOME

Sprint 06 closes when (1) `pnpm design:review --screens idle-screen` produces a `report.json` with **zero `high`-severity issues** across all 7 idle-screen variants, (2) the XCUITest capture suite ran on a real iPhone with `.xcresult` artifacts archived under `ios/build/`, (3) Android instrumented tests passed against a connected emulator/device, (4) a signed manual run-book confirms the cold-start human-testing-gate steps reproduce on iOS Simulator + Android Emulator + real iPhone, and (5) the gate evidence (report.json, report.html, xcresult bundles, screenshots, manual checklist) is archived in `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/`.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** archive gate evidence under `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/` — the SPRINT.md status cannot flip to "Done" until this folder exists with the required artifacts
- **MUST** include real-device evidence per `RULES.md` §Real Device E2E Testing: iOS XCUITest `.xcresult` from a physical iPhone (not just Simulator) for non-sandbox flows; Android observations recorded honestly as MANUAL/BLOCKED if no device harness available
- **MUST** drive `pnpm design:review --screens idle-screen` against the most recent `.xcresult` capture and confirm `jq '[.issues[] | select(.screen=="idle-screen" and .severity=="high")] | length' .design-review/report.json` == 0
- **MUST** record a signed-off run-book in `gate-evidence/manual-run.md` walking through the 7-step Human Test Deliverable from `SPRINT.md` with screenshot evidence per step
- **NEVER** flip Sprint 06 status to "Done" while any `high`-severity issue remains; remediation must dispatch back to the relevant implementer (CVX/IOS/AND) until the report is clean
- **NEVER** soften the gate by relaxing severity thresholds, deduplicating high-severity issues by hand, or marking an issue "won't fix" without a documented decision in `gate-evidence/decisions.md`
- **STRICTLY** verify Android-side testing posture: instrumented `connectedDebugAndroidTest` PASS + manual device steps; if Android device unavailable, the gate explicitly documents BLOCKED state and links the follow-on plan

---

## DONE WHEN

- [ ] AC-1: `pnpm design:review --screens idle-screen` produces a `report.json` with zero `high`-severity issues (PRIMARY)
- [ ] AC-2: Real iPhone XCUITest run produces `.xcresult` archived under `gate-evidence/ios-real-device/`
- [ ] AC-3: Android `connectedDebugAndroidTest` PASS or honest BLOCKED record in `gate-evidence/android-device.md`
- [ ] AC-4: 7-step Human Test Deliverable signed off in `gate-evidence/manual-run.md` with screenshots per step
- [ ] AC-5: SPRINT.md status flipped to "Done" only after AC-1..4 satisfied
- [ ] AC-6: ROADMAP.md Sprint 06 row updated to "Done" with link to gate evidence folder

---

## ACCEPTANCE CRITERIA

### AC-1: Design-review pipeline zero high-severity [PRIMARY]
- **GIVEN** XCUITest captures landed in `.xcresult`, references generated, manifest current
- **WHEN** `pnpm design:review --screens idle-screen` runs end-to-end
- **THEN** `.design-review/report.json` parses cleanly and `jq '[.issues[] | select(.screen=="idle-screen" and .severity=="high")] | length'` returns `0`
- **VERIFY:** `pnpm design:review --screens idle-screen && jq '[.issues[] | select(.screen=="idle-screen" and .severity=="high")] | length' .design-review/report.json`

### AC-2: Real iPhone XCUITest evidence archived
- **GIVEN** access to a physical iPhone with provisioning configured
- **WHEN** `xcodebuild test ... -destination 'platform=iOS,name=<iPhone>'` runs the `DesignReviewCaptureTests`
- **THEN** `.xcresult` bundles + screenshots archived under `gate-evidence/ios-real-device/` with file listing in `gate-evidence/ios-real-device/README.md`
- **VERIFY:** `ls .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-real-device/*.xcresult` returns ≥1 bundle

### AC-3: Android instrumented evidence
- **GIVEN** an emulator/device connected (or absent — explicit BLOCKED record)
- **WHEN** `./gradlew :app:connectedDebugAndroidTest` runs
- **THEN** Exit 0 with passing tests OR `gate-evidence/android-device.md` records BLOCKED + reason + planned follow-up
- **VERIFY:** Inspect `gate-evidence/android-device.md` and run history

### AC-4: Manual run-book signed off
- **GIVEN** the 7-step Human Test Deliverable from `SPRINT.md`
- **WHEN** a reviewer walks it on iOS Simulator + Android Emulator + real iPhone
- **THEN** `gate-evidence/manual-run.md` documents pass/fail per step with timestamped screenshots and reviewer initials
- **VERIFY:** `grep -c "^- \[x\] Step " .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/manual-run.md` ≥ 7

### AC-5: SPRINT.md status flip
- **GIVEN** AC-1..4 satisfied
- **WHEN** the orchestrator updates SPRINT.md
- **THEN** SPRINT.md frontmatter `status` reads `Done` and the body lists T11 as Done
- **VERIFY:** `grep -E '^status:' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md`

### AC-6: ROADMAP.md status update
- **GIVEN** SPRINT.md flipped to Done
- **WHEN** ROADMAP.md is updated
- **THEN** the Sprint Sequence table row for Sprint 6 reads "Done" with a link to `gate-evidence/`
- **VERIFY:** `grep -A 1 'Sprint 06: Map View — Idle State' .spec/prds/v3-integration/ROADMAP.md`

---

## TEST CRITERIA

| ID    | Statement                                                                       | Maps To | Type        |
|-------|---------------------------------------------------------------------------------|---------|-------------|
| TC-1  | Zero `high`-severity entries with `screen == "idle-screen"` in report.json       | AC-1    | happy_path  |
| TC-2  | ≥1 `.xcresult` bundle archived under `gate-evidence/ios-real-device/`            | AC-2    | happy_path  |
| TC-3  | `connectedDebugAndroidTest` Exit 0 OR `gate-evidence/android-device.md` BLOCKED  | AC-3    | edge_case   |
| TC-4  | `gate-evidence/manual-run.md` checks ≥7 steps                                    | AC-4    | happy_path  |
| TC-5  | SPRINT.md frontmatter `status: Done`                                              | AC-5    | happy_path  |
| TC-6  | ROADMAP.md Sprint 06 row reads "Done" with gate-evidence link                    | AC-6    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/**/*` (NEW — folder + artifacts)
- `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` (MODIFY — status flip on completion)
- `.spec/prds/v3-integration/ROADMAP.md` (MODIFY — Sprint 06 status update on completion)

**writeProhibited:**
- `ios/**`, `android/**`, `server/**`, `react-native/**`, `tokens/**` — gate task does not write production code
- `.design-review/report.json` — generated artifact, treat as read-only inside this task (capture, don't author)
- Any other sprint folder (`sprint-01..05`, `sprint-07..10`)

---

## BOUNDARIES

✅ **Always:**
- Archive evidence with timestamps and reviewer initials
- Re-run pipeline after every remediation cycle (do not trust stale reports)
- Document any `won't fix` decisions in `gate-evidence/decisions.md`

⚠️ **Ask First:**
- Lowering severity thresholds or excluding variants
- Marking Sprint 06 Done without real-iPhone XCUITest evidence (rare exception)
- Deferring Android evidence longer than one release cycle

---

## DELIVERABLE

- `gate-evidence/report.json` (NEW — pipeline output snapshot)
- `gate-evidence/report.html` (NEW — pipeline output snapshot)
- `gate-evidence/ios-real-device/` (NEW — xcresult bundles + screenshots + README.md)
- `gate-evidence/android-device.md` (NEW — connectedDebugAndroidTest log + manual observations OR BLOCKED record)
- `gate-evidence/manual-run.md` (NEW — 7-step run-book with screenshots + initials)
- `gate-evidence/decisions.md` (NEW — any `won't fix` justifications)
- SPRINT.md and ROADMAP.md status updates (last step)

---

## AGENT INSTRUCTIONS

1. Confirm prerequisites: T01–T10 all `Done`; design-review pipeline (Sprint 05 deliverables) functional.
2. Run `pnpm design:references` to refresh idle-screen reference assets.
3. Run XCUITest capture suite on iOS Simulator first; inspect attachment names match canonical schema.
4. Run `pnpm design:review --screens idle-screen`; copy `.design-review/report.json` and `report.html` into `gate-evidence/`.
5. If any `high`-severity issue is found, dispatch a remediation cycle to the responsible implementer (CVX/IOS/AND). Re-run pipeline. Repeat until zero `high` remain.
6. Acquire physical iPhone access; run `DesignReviewCaptureTests` on hardware; archive `.xcresult` to `gate-evidence/ios-real-device/`.
7. Run `./gradlew :app:connectedDebugAndroidTest` against an emulator/device; archive log. If hardware unavailable, write `gate-evidence/android-device.md` with BLOCKED record + planned follow-up.
8. Walk the 7-step Human Test Deliverable on iOS Simulator + Android Emulator + real iPhone; record into `gate-evidence/manual-run.md` with screenshots + initials.
9. Flip `SPRINT.md` status to `Done`; update `ROADMAP.md` Sprint 06 row.
10. Commit gate evidence + status updates as a single atomic change with a descriptive message.

---

## READING LIST

1. `RULES.md` §Design Review Pipeline — view snapshot testing contract
2. `RULES.md` §Real Device E2E Testing — iOS XCUITest pattern, Android device-harness exception
3. `docs/REAL_DEVICE_E2E.md` — physical-device setup + result artifacts
4. `.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/SPRINT.md` — pipeline operations docs
5. `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` — Human Test Deliverable steps

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Design review pass | `pnpm design:review --screens idle-screen` | Exit 0; report.json populated |
| Zero high-severity | `jq '[.issues[] | select(.screen=="idle-screen" and .severity=="high")] | length' .design-review/report.json` | `0` |
| iOS real-device xcresult | `ls .spec/.../gate-evidence/ios-real-device/*.xcresult` | ≥1 entry |
| Android instrumented | `./gradlew :app:connectedDebugAndroidTest` | Exit 0 OR documented BLOCKED |
| Manual run-book | `grep -c '^- \[x\] Step ' gate-evidence/manual-run.md` | ≥7 |
| SPRINT status flip | `grep -E '^status:' SPRINT.md` | `status: Done` |

---

## OUT OF SCOPE

- Adding new variants beyond the 7 documented in `idle-screen/README.md`
- Changing the design-review pipeline's severity thresholds (Sprint 05 ownership)
- Sprint 07–10 planning gates (separate sprint files)

---

## CONTEXT

**Current state:** All implementation tasks (T01–T10) are `Done`. The Sprint 06 gate has not yet been signed off; gate evidence folder does not exist; SPRINT.md status reads `In Progress`; ROADMAP.md still lists Sprint 06 as `In Progress`.

**Gap:** Without sign-off the sprint is incomplete and Sprint 07 (Planning State) cannot dispatch — Sprint 07 depends on Sprint 06 closure plus the persistent map host establishing a clean baseline.

---

## REVIEW (for swift-reviewer + qa-engineer pairing)

**Must pass:**
- `report.json` zero `high`-severity for `idle-screen` (auto-verifiable via `jq`)
- Real-iPhone `.xcresult` archived (not Simulator-only)
- Android instrumented status either PASS or honest BLOCKED record
- Manual run-book covers all 7 steps with timestamped screenshots
- SPRINT.md + ROADMAP.md updated atomically with the gate evidence commit

**Should verify:**
- All `won't fix` justifications make sense and link to follow-on tickets
- `gate-evidence/manual-run.md` was reviewed by someone other than the implementer
- Evidence folder is committed (not gitignored)

**Verdict:** APPROVED → flip SPRINT.md to `Done`. NEEDS_FIXES → block status flip; dispatch remediation to responsible implementer (CVX/IOS/AND).

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html`
- `.spec/design/system/views/idle-screen/README.md`
- `.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/SPRINT.md` (pipeline operations)

**Pattern:** Sprint-gate task acts as a deterministic closure check — pipeline output + real-device evidence + signed manual run-book are the only inputs to the status flip. Aggregate verdict is mechanical, not judgmental.

**Pattern source:** Sprint 05 closure pattern (auth-screen pipeline gate)

**Anti-pattern:** Marking the sprint Done based on Simulator-only evidence; deferring Android sign-off indefinitely without a follow-up plan; quietly relaxing severity thresholds.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-CVX-T01, T02; IDLE-S06-IOS-T01..T04; IDLE-S06-AND-T01..T04 (all must be Done)
- **Blocks:** Sprint 07 dispatch
- **Parallel:** none — this is the closure step

---

## CODING STANDARDS

- `RULES.md` §Real Device E2E Testing — non-sandbox flows require real-device evidence
- `RULES.md` §Design Review Pipeline — gate contract
- `RULES.md` §Agent / Subagent Commit Policy — gate evidence must be committed

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN captures + refs WHEN pnpm design:review --screens idle-screen runs THEN report.json has 0 high-severity idle-screen entries","verify":"pnpm design:review --screens idle-screen && jq '[.issues[] | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN physical iPhone WHEN XCUITest run THEN .xcresult archived under gate-evidence/ios-real-device/","verify":"ls .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-real-device/*.xcresult"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN emulator/device WHEN connectedDebugAndroidTest runs THEN Exit 0 OR BLOCKED record","verify":"./gradlew :app:connectedDebugAndroidTest"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN reviewer walks 7-step Human Test Deliverable WHEN documented THEN gate-evidence/manual-run.md ≥7 [x] steps","verify":"grep -c '^- \\[x\\] Step ' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/manual-run.md"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN AC-1..4 satisfied WHEN SPRINT.md updated THEN status:Done","verify":"grep -E '^status:' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN SPRINT.md Done WHEN ROADMAP.md updated THEN Sprint 06 row reads Done with gate-evidence link","verify":"grep -A 1 'Sprint 06: Map View — Idle State' .spec/prds/v3-integration/ROADMAP.md"},
    {"id":"TC-1","type":"test_criterion","description":"0 high-severity idle-screen entries in report.json","maps_to_ac":"AC-1","verify":"jq '[.issues[] | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json"},
    {"id":"TC-2","type":"test_criterion","description":"≥1 .xcresult under gate-evidence/ios-real-device/","maps_to_ac":"AC-2","verify":"ls .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/ios-real-device/*.xcresult | wc -l"},
    {"id":"TC-3","type":"test_criterion","description":"connectedDebugAndroidTest Exit 0 OR documented BLOCKED","maps_to_ac":"AC-3","verify":"./gradlew :app:connectedDebugAndroidTest"},
    {"id":"TC-4","type":"test_criterion","description":"manual-run.md has ≥7 checked Step entries","maps_to_ac":"AC-4","verify":"grep -c '^- \\[x\\] Step ' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/gate-evidence/manual-run.md"},
    {"id":"TC-5","type":"test_criterion","description":"SPRINT.md frontmatter status: Done","maps_to_ac":"AC-5","verify":"grep -E '^status:' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md"},
    {"id":"TC-6","type":"test_criterion","description":"ROADMAP.md Sprint 06 row reads Done with gate-evidence link","maps_to_ac":"AC-6","verify":"grep -A 1 'Sprint 06: Map View — Idle State' .spec/prds/v3-integration/ROADMAP.md"}
  ]
}
-->
