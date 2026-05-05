# IDLE-S06-IOS-T04 — iOS DesignReviewCaptureTests for IdleScreen 7 variants

```
TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen → ./SPRINT.md
PRD_REFS:   UC-FID-01

RUNTIME_COMMANDS:
  test:      xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReviewCaptureTests
  capture:   pnpm design:review --screens idle-screen
  manifest:  pnpm design:references
```

---

## OUTCOME

`LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` adds XCUITest methods covering every reachable idle-screen variant — 7 variants × {light, dark} themes — each capturing a screenshot via `DesignReviewHelpers.captureScreen(screen:state:action:app:)` and emitting a deterministic attachment named `idle-screen.<state>.<theme>`. The capture suite drives the production iOS app through real Clerk auth → idle state, exercises the variant entry point, and produces `.xcresult` attachments consumed by `pnpm design:review --screens idle-screen` to evaluate against `.spec/design/system/refs/idle-screen/` PNGs + annotations with **zero `high`-severity issues**.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** add `test_idleScreen_<state>_<theme>` methods for all 7 variants × 2 themes (S01 default light + dark; S02 chat-focused/typing-send light + dark; S04 suggestions-scrolled light + dark; V01 no-location; V02 first-ride; V03 weather-advisory)
- **MUST** authenticate via real Clerk test creds (`CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD` from `.env.local`) using `authenticateAndReachIdleScreen()` helper — no auth stubs
- **MUST** use `DesignReviewHelpers.setupDeterminismEnvironment(app:colorScheme:)` for dark variants (deterministic time, stable seeds)
- **MUST** emit attachment names matching `idle-screen.<state>.<theme>` exactly so `scripts/design-review/manifest.ts` discovers them; mismatched names silently drop from the report
- **MUST** add `.spec/design/system/refs/idle-screen/` PNGs + `annotations.json` for every variant via `pnpm design:references` BEFORE running the eval pass
- **NEVER** use mock data providers for capture — captures must reflect production code paths
- **NEVER** introduce flaky waits (`Thread.sleep`); use `XCUIElement.waitForExistence(timeout:)` and `Task.sleep(for:)` only when stabilising animations
- **STRICTLY** keep capture method bodies short and grep-friendly; helpers live in `DesignReviewHelpers.swift`

---

## DONE WHEN

- [x] AC-1: 14 capture methods land covering all 7 idle-screen variants × {light, dark} (PRIMARY)
- [x] AC-2: Each method emits attachment named `idle-screen.<state>.<theme>` (exact match)
- [x] AC-3: `pnpm design:references` produces `.spec/design/system/refs/idle-screen/*.png` + `annotations.json` for every variant
- [x] AC-4: `pnpm design:review --screens idle-screen` end-to-end pass produces `.design-review/report.json` with idle-screen entries
- [x] AC-5: Report shows **zero `high`-severity issues** across all variants on the gate run
- [x] `xcodebuild test -only-testing:LaneShadowUITests/DesignReviewCaptureTests` exit 0 (full XCUITest suite)

---

## ACCEPTANCE CRITERIA

### AC-1: 14 capture methods present [PRIMARY]
- **GIVEN** `DesignReviewCaptureTests.swift` source
- **WHEN** searched for `func test_idleScreen_`
- **THEN** at least 14 method declarations exist (7 variants × 2 themes)
- **VERIFY:** `grep -c "func test_idleScreen_" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` ≥ 14

### AC-2: Attachment names match canonical schema
- **GIVEN** every `test_idleScreen_*` method
- **WHEN** the test runs and emits attachment via `DesignReviewHelpers.captureScreen`
- **THEN** `attachment.name` exactly equals `idle-screen.<state>.<theme>` (e.g. `idle-screen.chat-focused.light`)
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowUITests/DesignReviewCaptureTests` and inspect `.xcresult` attachment names match the schema

### AC-3: Reference assets generated for every variant
- **GIVEN** `pnpm design:references` runs against `.spec/design/system/views/idle-screen/idle-screen.html`
- **WHEN** the script completes
- **THEN** `.spec/design/system/refs/idle-screen/` contains a PNG + an `annotations.json` for every variant (S01.light/dark, S02.light/dark, S04.light/dark, V01, V02, V03)
- **VERIFY:** `ls .spec/design/system/refs/idle-screen/*.png | wc -l` ≥ 14

### AC-4: Pipeline produces report with idle-screen coverage
- **GIVEN** captures landed in `.xcresult` and references are present
- **WHEN** `pnpm design:review --screens idle-screen` runs end-to-end
- **THEN** `.design-review/report.json` contains entries with `screen == "idle-screen"` for every variant
- **VERIFY:** `pnpm design:review --screens idle-screen && jq '[.issues[] | select(.screen == "idle-screen")] | length' .design-review/report.json` > 0

### AC-5: Zero high-severity issues on gate run
- **GIVEN** `pnpm design:review --screens idle-screen` completes
- **WHEN** the report is parsed
- **THEN** zero entries have `severity == "high"`
- **VERIFY:** `jq '[.issues[] | select(.screen == "idle-screen" and .severity == "high")] | length' .design-review/report.json` == 0

---

## TEST CRITERIA

| ID    | Statement                                                                   | Maps To | Type        |
|-------|-----------------------------------------------------------------------------|---------|-------------|
| TC-1  | DesignReviewCaptureTests.swift contains ≥14 `func test_idleScreen_` methods  | AC-1    | happy_path  |
| TC-2  | Attachment names match `idle-screen.<state>.<theme>` schema                  | AC-2    | happy_path  |
| TC-3  | `.spec/design/system/refs/idle-screen/*.png` count ≥14                       | AC-3    | happy_path  |
| TC-4  | `report.json` includes `screen == "idle-screen"` entries                     | AC-4    | happy_path  |
| TC-5  | Zero entries with `severity == "high"` for `idle-screen` on gate run         | AC-5    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` (MODIFY — add `test_idleScreen_*` methods)
- `ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift` (MODIFY — `authenticateAndReachIdleScreen` if not present)
- `.spec/design/system/refs/idle-screen/*.png` (NEW — generated by `pnpm design:references`)
- `.spec/design/system/refs/idle-screen/annotations.json` (NEW)
- `scripts/design-review/manifest.ts` (MODIFY — extend manifest discovery for new states if needed)

**writeProhibited:**
- `ios/LaneShadow/**` — production code untouched by this task (the variants must already exist)
- `android/**`, `server/**`, `react-native/**`, `tokens/**`
- `.design-review/report.json` — generated; do not hand-edit

---

## BOUNDARIES

✅ **Always:**
- Use real Clerk test creds for authentication
- Use canonical attachment naming
- Capture both light and dark themes for every applicable variant

⚠️ **Ask First:**
- Adding new states beyond the 7 variants documented in `idle-screen/README.md`
- Changing the `manifest.ts` schema (affects existing screens)
- Lowering the high-severity threshold

---

## DELIVERABLE

- `DesignReviewCaptureTests.swift` (MODIFY): 14 new `test_idleScreen_*` methods (chat-focused.light, chat-focused.dark, suggestions-scrolled.light, suggestions-scrolled.dark, light.load, dark.load, no-location, first-ride, weather-advisory.light, weather-advisory.dark, etc.)
- `DesignReviewHelpers.swift` (MODIFY): `authenticateAndReachIdleScreen()`, `setupDeterminismEnvironment(app:colorScheme:)`
- `.spec/design/system/refs/idle-screen/*.png` (NEW): per-variant PNGs
- `.spec/design/system/refs/idle-screen/annotations.json` (NEW): per-variant token recipes + bounding boxes

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: drive the production app through real flows, do NOT introduce mock data providers in capture tests. Run `pnpm design:review --screens idle-screen` after the XCUITest suite passes; iterate until report has zero high-severity issues.

---

## READING LIST

1. `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift:279-450` **[PRIMARY PATTERN]** — final implementation; idle-screen capture method shape
2. `ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift` — capture, attachment naming, determinism helpers
3. `.spec/design/system/views/idle-screen/idle-screen.html` — visual ground truth for all variants
4. `.spec/design/system/views/idle-screen/README.md` — variant catalogue (S01–V03) with token recipes
5. `scripts/design-review/manifest.ts` — auto-discovery rules for capture attachments

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| XCUITest capture suite | `xcodebuild test -only-testing:LaneShadowUITests/DesignReviewCaptureTests` | Exit 0; 14 new `idle-screen` captures attached |
| Reference generation | `pnpm design:references` | Exit 0; refs PNGs ≥14 |
| Pipeline pass | `pnpm design:review --screens idle-screen` | Exit 0; zero `high` severity in report.json |
| Report inspection | `jq '[.issues[] | select(.screen=="idle-screen" and .severity=="high")] | length' .design-review/report.json` | `0` |

---

## OUT OF SCOPE

- Vision-LLM eval engine improvements (Sprint 05 territory)
- Auth-screen / planning-screen / route-results coverage (other sprints)
- Skill-level orchestration of fix-and-re-eval loop (Sprint 09 / future)

---

## CONTEXT

**Current state:** Sprint 05 shipped the design-review pipeline scoped to auth-screen only. `DesignReviewCaptureTests.swift` already has auth-screen capture methods following a stable pattern. Idle-screen variants ship code-complete in IDLE-S06-IOS-T01..T03; references are NOT yet generated.

**Gap:** Without per-variant capture methods + reference PNGs, the design-review pipeline cannot evaluate idle-screen, and the Sprint 06 human testing gate (zero high-severity issues) cannot be measured.

---

## REVIEW (for swift-reviewer)

**Must pass:**
- 14 `test_idleScreen_*` methods present and functional against real Clerk auth
- Attachment names exactly match `idle-screen.<state>.<theme>` schema (no typos)
- Reference PNGs + annotations exist for every variant
- `pnpm design:review --screens idle-screen` end-to-end pass produces a populated report

**Should verify:**
- Determinism: dark theme captures use `setupDeterminismEnvironment` (no time-based variance)
- Helpers consolidate boilerplate (`authenticateAndReachIdleScreen`)
- Manifest auto-discovery doesn't require manual list updates per state

**Verdict:** APPROVED

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html`
- `.spec/design/system/views/idle-screen/README.md` — variant catalogue (S01 default, S02 typing/send, S03 default dark, S04 filter sheet, V01 no-location, V02 first-ride, V03 weather-advisory)

**Pattern:** XCUITest capture → `DesignReviewHelpers.captureScreen(...)` → `.xcresult` attachment with deterministic name → manifest discovery → vision-LLM eval against PNG/annotations references → `report.json` issues array with severity.

**Pattern source:** `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift:72-262` (auth-screen captures)

**Anti-pattern:** Capturing from sandbox stories instead of production flow — the pipeline is supposed to evaluate the real app, not the sandbox.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-IOS-T01, IDLE-S06-IOS-T02, IDLE-S06-IOS-T03 (production variants must render correctly first), Sprint 05 design-review pipeline
- **Blocks:** IDLE-S06-T11 (sprint gate consumes the pipeline report)
- **Parallel:** IDLE-S06-AND-T04 (Android instrumented coverage)

---

## CODING STANDARDS

- `RULES.md` §Design Review Pipeline — view snapshot testing contract
- `RULES.md` §Real Device E2E Testing — capture suite is iOS Simulator + must produce `.xcresult` + screenshots
- `brain/docs/ANTI-STUB-REVIEW.md` — no mock data providers in capture tests

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN DesignReviewCaptureTests.swift WHEN searched THEN ≥14 test_idleScreen_ methods exist","verify":"grep -c 'func test_idleScreen_' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN each capture method WHEN executed THEN attachment.name matches idle-screen.<state>.<theme>","verify":"xcodebuild test -only-testing:LaneShadowUITests/DesignReviewCaptureTests"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN pnpm design:references run WHEN complete THEN refs/idle-screen/*.png count ≥14","verify":"ls .spec/design/system/refs/idle-screen/*.png | wc -l"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN captures + refs WHEN pnpm design:review --screens idle-screen runs THEN report.json includes idle-screen entries","verify":"pnpm design:review --screens idle-screen && jq '[.issues[] | select(.screen==\"idle-screen\")] | length' .design-review/report.json"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN gate run report WHEN inspected THEN zero high-severity idle-screen issues","verify":"jq '[.issues[] | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json"},
    {"id":"TC-1","type":"test_criterion","description":"≥14 test_idleScreen_ methods","maps_to_ac":"AC-1","verify":"grep -c 'func test_idleScreen_' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift"},
    {"id":"TC-2","type":"test_criterion","description":"Attachment names match canonical schema","maps_to_ac":"AC-2","verify":"xcodebuild test -only-testing:LaneShadowUITests/DesignReviewCaptureTests"},
    {"id":"TC-3","type":"test_criterion","description":"Reference PNGs ≥14","maps_to_ac":"AC-3","verify":"ls .spec/design/system/refs/idle-screen/*.png | wc -l"},
    {"id":"TC-4","type":"test_criterion","description":"report.json includes idle-screen entries","maps_to_ac":"AC-4","verify":"jq '[.issues[] | select(.screen==\"idle-screen\")] | length' .design-review/report.json"},
    {"id":"TC-5","type":"test_criterion","description":"Zero high-severity idle-screen issues","maps_to_ac":"AC-5","verify":"jq '[.issues[] | select(.screen==\"idle-screen\" and .severity==\"high\")] | length' .design-review/report.json"}
  ]
}
-->
