# IDLE-S06-T11 — Sprint 6 Gate: design:review zero-high-severity + iPhone XCUITest evidence + sign-off

```
TASK_TYPE:  TESTING
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=qa-engineer | reviewer=qa-engineer
SPRINT:     sprint-06-idlescreen → ../SPRINT.md
PRD_REFS:   UC-FID-01, UC-CHAT-01, UC-MAP-01

RUNTIME_COMMANDS:
  ios_e2e:    xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadowUITests -destination 'platform=iOS,name={device}' -resultBundlePath ios/build/IdleScreenE2E.xcresult
  android_e2e: ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'
  gate:       pnpm design:review --screens idle-screen
```

---

## OUTCOME

Sprint 6 (IdleScreen) is closed: `pnpm design:review --screens idle-screen` reports **zero `high`-severity issues** across all 7 IdleScreen variants on iOS; a real-iPhone `.xcresult` is recorded as motion evidence; Android instrumented tests pass on emulator; and a sign-off note is appended to `SPRINT.md` confirming the human gate is satisfied.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** run `pnpm design:review --screens idle-screen` against the iOS build produced by `IDLE-S06-IOS-T04`'s real-iPhone capture run; report must show **zero `high`-severity issues** across S01–S04 and V01–V03 variants in both light and dark theme where applicable.
- **MUST** record the iPhone XCUITest `.xcresult` artifact at `ios/build/IdleScreenE2E.xcresult` as gate evidence; `git add` the path or include hashes in the sign-off note (artifact is large — do NOT commit raw file unless the project has Git LFS configured).
- **MUST** run `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'` on a connected emulator and confirm `tc1` through `tc10` pass (4 pre-existing + 6 new from `IDLE-S06-AND-T04`).
- **MUST** append a "Sprint 6 Gate Sign-off" section to `SPRINT.md` containing: timestamp, commit SHA, iOS xcresult path, Android `connectedDebugAndroidTest` result summary, design:review JSON path, and any `med`/`low` issues with deferral rationale.
- **MUST NOT** sign off if any `high`-severity issue remains — instead, file a remediation TASK against the responsible task owner (T01..T04 platform task) and re-run after fix.
- **NEVER** mark Android observations PASS based on iOS evidence (per `RULES.md` §Real Device E2E Testing).
- **STRICTLY** treat any `high`-severity design:review issue as a sprint-blocker; defer only `med`/`low` with explicit user approval recorded in the sign-off note.

---

## DONE WHEN

- [ ] AC-1: `pnpm design:review --screens idle-screen` exits with zero `high`-severity issues across all 7 variants (PRIMARY)
- [ ] AC-2: iPhone `xcresult` recorded at `ios/build/IdleScreenE2E.xcresult` and referenced in sign-off
- [ ] AC-3: Android `connectedDebugAndroidTest` passes for `IdleScreenInstrumentedTest` tc1..tc10
- [ ] AC-4: Sprint 6 Gate Sign-off section appended to `SPRINT.md`
- [ ] All 7 idle-screen entries in `.design-review/manifest.json` resolved with `captured` paths and reference comparisons

---

## ACCEPTANCE CRITERIA

### AC-1: design:review zero high-severity [PRIMARY]
- **GIVEN** All 7 idle-screen variant captures present in `.design-review/manifest.json` (from `IDLE-S06-IOS-T04`)
- **WHEN** `pnpm design:review --screens idle-screen` runs
- **THEN** Output JSON / HTML report shows **zero `high`-severity issues** across all variants; `med`/`low` issues are listed with deferral rationale or remediation plan
- **VERIFY:** `pnpm design:review --screens idle-screen --severity high --fail-on-issues` (exits 0 if zero high; non-zero otherwise)

### AC-2: iPhone xcresult evidence recorded
- **GIVEN** Real iPhone connected via Xcode
- **WHEN** `xcodebuild test -destination 'platform=iOS,name={device}' ... -resultBundlePath ios/build/IdleScreenE2E.xcresult` runs the 7 idle-screen capture methods
- **THEN** `.xcresult` bundle exists at `ios/build/IdleScreenE2E.xcresult` containing 7 XCTAttachments named `idle-screen.{variantId}.{theme}`
- **VERIFY:** `xcrun xcresulttool get --path ios/build/IdleScreenE2E.xcresult --format json | jq '.actions._values[].actionResult.testsRef.id._value' | xargs -I{} xcrun xcresulttool get --path ios/build/IdleScreenE2E.xcresult --id {} --format json | jq '.. | objects | select(.attachmentType==\"public.png\")' | wc -l` ≥ 7

### AC-3: Android instrumented tests pass on emulator
- **GIVEN** API 30+ AVD with Google Play Services + Mapbox token + Convex deployment
- **WHEN** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'` runs
- **THEN** All 10 tests pass (`tc1` through `tc10`); test report at `android/app/build/reports/androidTests/connected/index.html` shows zero failures
- **VERIFY:** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'` exits 0

### AC-4: Sprint 6 Gate Sign-off appended to SPRINT.md
- **GIVEN** AC-1, AC-2, AC-3 all pass
- **WHEN** QA closes the sprint
- **THEN** `SPRINT.md` has an appended `## Sprint 6 Gate Sign-off` section containing: ISO timestamp, commit SHA (`git rev-parse HEAD`), iOS xcresult path, Android test result summary, design:review report path, and any deferred `med`/`low` issues with explicit user approval
- **VERIFY:** `grep -q "## Sprint 6 Gate Sign-off" .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md`

---

## TEST CRITERIA

| ID    | Statement                                                                          | Maps To | Type        |
|-------|------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | design:review report contains zero entries where severity == 'high'                | AC-1    | happy_path  |
| TC-2  | All 7 idle-screen variants captured in `.design-review/manifest.json` and present in report | AC-1    | happy_path  |
| TC-3  | iOS xcresult bundle contains ≥7 PNG attachments named `idle-screen.*`              | AC-2    | happy_path  |
| TC-4  | Android `connectedDebugAndroidTest` produces test report with 10 passes, 0 failures | AC-3    | happy_path  |
| TC-5  | SPRINT.md contains '## Sprint 6 Gate Sign-off' header followed by metadata         | AC-4    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` (MODIFY — append Gate Sign-off section)
- `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/GATE-EVIDENCE.md` (NEW, optional — sign-off detail with diff hashes if SPRINT.md becomes too long)

**writeProhibited:**
- All production code in `ios/**`, `android/**`, `server/**`, `react-native/**`, `tokens/**` — gate task does NOT change implementation
- Existing test files — gate task only RUNS tests, does not modify them

---

## BOUNDARIES

✅ **Always:**
- File a remediation task (TASK or TodoWrite) for any `high`-severity issue rather than overriding the gate
- Cross-check both iOS xcresult AND Android test report before claiming sprint closed

⚠️ **Ask First:**
- Deferring any `high`-severity issue (gate-blocking by default; user must explicitly approve any exception)
- Skipping AC-3 because Android emulator unavailable (per RULES.md §Cut Authority Reminder)

---

## DELIVERABLE

- `SPRINT.md` (MODIFY): appended `## Sprint 6 Gate Sign-off` section with the detail described in AC-4
- `ios/build/IdleScreenE2E.xcresult` (artifact, not committed unless Git LFS): real-iPhone evidence
- `.design-review/reports/idle-screen-{timestamp}.json` (artifact): pipeline output

---

## AGENT INSTRUCTIONS

1. **Pre-check:** confirm IDLE-S06-IOS-T01..T04 and IDLE-S06-AND-T01..T04 are all DONE (review their gate evidence).
2. **iOS gate run:** invoke real-iPhone xcodebuild test for the 7 capture methods (per IDLE-S06-IOS-T04 AC-1..AC-7). Confirm `.xcresult` produced.
3. **design:review pipeline:** run `pnpm design:review --screens idle-screen` (Sprint 05 T08+T09 pipeline). Read the JSON report.
4. **Triage:** for every issue:
   - `high` → file remediation task; gate FAILS until resolved.
   - `med` / `low` → record in sign-off; ask user for explicit approval to defer.
5. **Android gate run:** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'` on connected emulator. If emulator absent, escalate to user (per RULES.md §Cut Authority).
6. **Sign-off:** if AC-1..AC-3 all pass, append the sign-off section to SPRINT.md, commit, mark sprint Done.

---

## READING LIST

1. `.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/FID-S05-T08-design-review-skill.md` — design:review CLI / skill umbrella spec
2. `.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/FID-S05-T09-re-eval-loop.md` — re-eval loop with 3-iteration cap
3. `.design-review/manifest.json` — entry shape; verify 7 idle-screen entries before running pipeline
4. `RULES.md` §Real Device E2E Testing — iOS xcresult is gate evidence; Android emulator acceptable
5. `RULES.md` §Cut Authority Reminder — escalation path if Android lags

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| design:review zero high | `pnpm design:review --screens idle-screen --severity high --fail-on-issues` | Exit 0 |
| iOS xcresult artifact present | `[ -d ios/build/IdleScreenE2E.xcresult ]` | Exit 0 |
| Android instrumented tests | `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'` | Exit 0 |
| SPRINT.md sign-off appended | `grep -q '## Sprint 6 Gate Sign-off' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md` | Exit 0 |

---

## OUT OF SCOPE

- Sprint 7 task expansion (only after Sprint 6 closes cleanly)
- Closing any `med`/`low` issues from design:review (those are tracked separately or absorbed into Sprint 7+)
- Backporting Android device automation (deferred per RULES.md)

---

## CONTEXT

**Current state:** Sprint 6 task expansion complete (T01–T10 written). Sprint 5 design:review pipeline is in progress (some tasks still pending). Sprint 6 cannot close until Sprint 5 T08+T09+T10 land.

**Gap:** A QA gate task is needed to formally close the sprint and provide auditable evidence that the human testing gate was satisfied.

---

## REVIEW (for qa-engineer self-review)

**Must pass:**
- All 4 ACs satisfied with command output evidence
- Zero `high`-severity issues from design:review (or explicit user-approved exception for any)
- Sign-off section in SPRINT.md is complete and timestamped

**Should verify:**
- Cross-platform parity: iOS variants and Android variants render comparably (no `_only` arrays without justification)
- design:review report archived for future regression baseline
- No stub data anywhere in the gate evidence (per project SUPREME RULE)

**Verdict:** APPROVED | NEEDS_FIXES (file remediation tasks if any AC fails)

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html` — visual ground truth evaluated by design:review
- `.spec/design/system/views/idle-screen/README.md` — Variants table; severity rubric

**Pattern:** Sprint gate as final QA artifact — runs the design-review pipeline + cross-platform instrumented tests + records evidence + appends sign-off note. Mirrors Sprint 05 T10 smoke-test pattern.

**Pattern source:** `.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/FID-S05-T10-smoke-test-and-docs.md`

**Anti-pattern:** Signing off without verification; copying iOS evidence to claim Android pass.

---

## DEPENDENCIES

- **Depends on:** All Sprint 6 tasks (CVX-T01, CVX-T02, IOS-T01..T04, AND-T01..T04)
- **Depends on (cross-sprint):** Sprint 5 T08 (design:review skill umbrella), T09 (re-eval loop), T10 (smoke test docs)
- **Blocks:** Sprint 7 (PlanningScreen) task expansion

---

## CODING STANDARDS

- `RULES.md` §Real Device E2E Testing — gate evidence is real-device xcresult on iOS, emulator instrumented on Android
- `RULES.md` §Cut Authority Reminder — escalate if Android pair lags
- Global `CLAUDE.md` §Honest Verdicts — never fabricate sign-off; flag failure, file remediation

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN 7 idle-screen variant captures WHEN pnpm design:review --screens idle-screen runs THEN zero high-severity issues","verify":"pnpm design:review --screens idle-screen --severity high --fail-on-issues"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN real iPhone connected WHEN xcodebuild test runs the 7 capture methods THEN ios/build/IdleScreenE2E.xcresult exists with ≥7 PNG attachments","verify":"[ -d ios/build/IdleScreenE2E.xcresult ] && xcrun xcresulttool get --path ios/build/IdleScreenE2E.xcresult --format json | grep -c idle-screen | awk '$1>=7'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN API 30+ AVD WHEN ./gradlew connectedDebugAndroidTest runs IdleScreenInstrumentedTest THEN 10 tests pass","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN AC-1..AC-3 pass WHEN QA closes sprint THEN SPRINT.md has '## Sprint 6 Gate Sign-off' section with metadata","verify":"grep -q '## Sprint 6 Gate Sign-off' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md"},
    {"id":"TC-1","type":"test_criterion","description":"design:review report contains zero entries where severity=='high'","maps_to_ac":"AC-1","verify":"pnpm design:review --screens idle-screen --severity high --fail-on-issues"},
    {"id":"TC-2","type":"test_criterion","description":"7 idle-screen variants present in manifest and report","maps_to_ac":"AC-1","verify":"node -e \"const m=require('./.design-review/manifest.json'); const idle=m.entries.filter(e=>e.screen==='idle-screen'); if(idle.length<7) process.exit(1)\""},
    {"id":"TC-3","type":"test_criterion","description":"iOS xcresult contains ≥7 PNG attachments named idle-screen.*","maps_to_ac":"AC-2","verify":"xcrun xcresulttool get --path ios/build/IdleScreenE2E.xcresult --format json | grep -c idle-screen"},
    {"id":"TC-4","type":"test_criterion","description":"Android connectedDebugAndroidTest 10 passes 0 failures","maps_to_ac":"AC-3","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'"},
    {"id":"TC-5","type":"test_criterion","description":"SPRINT.md has Gate Sign-off section","maps_to_ac":"AC-4","verify":"grep -q '## Sprint 6 Gate Sign-off' .spec/prds/v3-integration/tasks/sprint-06-idlescreen/SPRINT.md"}
  ]
}
-->
