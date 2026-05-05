# IDLE-S06-REM-QA-T01 — Canonical idle design-review captures
> Status: ✅ Completed
> Cycle: 2
> Commit: 366a128a4885a5b0475434ce32d20ac9cd38e720
> Reviewer: swift-reviewer
> Updated: 2026-05-05T09:07:08.503Z

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen -> ./SPRINT.md
PRD_REFS:   UC-FID-01, UC-MAP-01, UC-CHAT-01

RUNTIME_COMMANDS:
  capture:   xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReviewCaptureTests
  review:    pnpm design:review --screens idle-screen
  typecheck: xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
```

---

## OUTCOME

The iOS design-review capture suite emits the exact seven Sprint 06 idle-screen artifacts consumed by `pnpm design:review --screens idle-screen`, with no stale `test-screen` report confusion.

---

## CRITICAL CONSTRAINTS

- **MUST** emit canonical attachment names: `idle-screen.default.light`, `idle-screen.typing-send.light`, `idle-screen.default.dark`, `idle-screen.filter-sheet.light`, `idle-screen.no-location.light`, `idle-screen.first-ride.light`, `idle-screen.weather-advisory.light`.
- **MUST** remove opportunistic `XCTSkip` from the seven canonical idle captures; deterministic state setup is required.
- **MUST** make `.design-review/manifest.json` and `report.json` contain `idle-screen` entries after `pnpm design:review --screens idle-screen`.
- **NEVER** count unrelated `test-screen`, `auth-screen`, planning, route-results, or route-details captures toward this sprint gate.
- **STRICTLY** keep severity thresholds unchanged.

---

## DONE WHEN

- [x] AC-1: `DesignReviewCaptureTests` has exactly the seven canonical idle capture methods required by SPRINT.md (PRIMARY)
- [x] AC-2: Each canonical capture attaches with `idle-screen.<state>.<theme>`
- [x] AC-3: Canonical captures cannot silently skip due to live weather/location variance
- [x] AC-4: `pnpm design:review --screens idle-screen` produces manifest/report entries for `idle-screen`
- [x] AC-5: Current stale `test-screen` report cannot be mistaken for an idle gate pass
- [ ] Runtime commands above exit 0

---

## ACCEPTANCE CRITERIA

### AC-1: Canonical capture set [PRIMARY]
- **GIVEN** the Sprint 06 variant list in SPRINT.md
- **WHEN** `DesignReviewCaptureTests.swift` is searched for idle capture methods
- **THEN** exactly the seven canonical `(state, theme)` captures exist
- **VERIFY:** `rg -n "idle-screen\\.(default\\.light|typing-send\\.light|default\\.dark|filter-sheet\\.light|no-location\\.light|first-ride\\.light|weather-advisory\\.light)" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift`

### AC-2: Attachment names are schema-compliant
- **GIVEN** the capture tests run on the iOS Simulator
- **WHEN** attachments are exported
- **THEN** every idle attachment name matches `idle-screen.<state>.<theme>` and no `idle-screen.light.load` or `idle-screen.dark.load` remains
- **VERIFY:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReviewCaptureTests`

### AC-3: Variant state is deterministic
- **GIVEN** current weather is clear or location is unavailable on the simulator
- **WHEN** the weather-advisory, no-location, first-ride, and filter-sheet captures run
- **THEN** tests still produce screenshots through deterministic launch/state hooks instead of `XCTSkip`
- **VERIFY:** `rg -n "XCTSkip\\(\"(Weather advisory|Location unavailable|Location pill)" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` returns no matches

### AC-4: Pipeline report is about idle-screen
- **GIVEN** capture/export/manifest/eval/report run for `--screens idle-screen`
- **WHEN** `.design-review/report.json` is parsed
- **THEN** at least one issue or passed entry references `screen == "idle-screen"` and zero entries reference `test-screen`
- **VERIFY:** `pnpm design:review --screens idle-screen && jq '[.issues[]? | .screen] | unique' .design-review/report.json`

### AC-5: Stale report protection
- **GIVEN** `.design-review/report.json` already exists from any prior run
- **WHEN** `pnpm design:review --screens idle-screen` starts
- **THEN** stale captures/reports are cleared or overwritten before merge
- **VERIFY:** `pnpm design:review --screens idle-screen`

---

## TEST CRITERIA

| ID | Statement | Maps To | Type |
|----|-----------|---------|------|
| TC-1 | Seven canonical idle attachment-name strings exist in DesignReviewCaptureTests | AC-1 | contract |
| TC-2 | No `idle-screen.light.load` attachment name exists | AC-2 | error_case |
| TC-3 | No canonical idle capture throws `XCTSkip` for normal live-state variance | AC-3 | edge_case |
| TC-4 | Report screen list contains `idle-screen` after design review | AC-4 | happy_path |
| TC-5 | Report screen list excludes `test-screen` after idle design review | AC-5 | regression |

---

## Remediation Trail

| Cycle | FIX | Failed Reqs | Reviewer | At |
|---|---|---|---|---|
| 2 | FIX-IDLE-S06-REM-QA-T01-C1 | AC-2, AC-4, TC-4, TC-5 | swift-reviewer | 2026-05-05T08:46:14.288Z |

## SCOPE

**writeAllowed:**
- `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` (MODIFY)
- `ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift` (MODIFY if deterministic idle hooks are needed)
- `ios/LaneShadowUITests/Helpers/AppLauncher.swift` (MODIFY if launch arguments are needed)
- `scripts/design-review/run.ts` (MODIFY if stale output cleanup or screen filtering is broken)
- `scripts/design-review/export-from-xcresult.ts` (MODIFY if missing xcresult currently returns false success)
- `scripts/design-review/build-manifest.ts` (MODIFY if screen filtering is not enforced)
- `scripts/design-review/__tests__/**` (MODIFY/NEW for pipeline guards)

**writeProhibited:**
- `server/**`, `android/**`
- Production iOS idle implementation unless a deterministic UITest hook cannot be added elsewhere; ask first
- `.design-review/**` generated artifacts as authored source

---

## AGENT INSTRUCTIONS

First add tests or greps that fail on the current noncanonical attachment names and `XCTSkip` paths. Then normalize the capture methods and pipeline cleanup. The canonical seven-state list is the sprint gate; extra exploratory capture methods may stay only if they do not confuse `--screens idle-screen`.

---

## READING LIST

1. `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` - current capture methods and skipped variants
2. `ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift` - attachment naming helper
3. `scripts/design-review/run.ts` - pipeline sequencing and stale report behavior
4. `scripts/design-review/export-from-xcresult.ts` - xcresult handling and missing-result behavior
5. `.spec/design/system/refs/idle-screen/` - canonical reference names

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Canonical strings | `rg -n "idle-screen\\.(default\\.light|typing-send\\.light|default\\.dark|filter-sheet\\.light|no-location\\.light|first-ride\\.light|weather-advisory\\.light)" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | 7 matches |
| No stale names | `rg -n "idle-screen\\.(light|dark)\\.load" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | No matches |
| No opportunistic skips | `rg -n "XCTSkip\\(\"(Weather advisory|Location unavailable|Location pill)" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | No matches |
| XCUITest capture | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReviewCaptureTests` | Exit 0 |
| Design review | `pnpm design:review --screens idle-screen` | Exit 0; report is idle-screen scoped |

---

## OUT OF SCOPE

- Fixing visual high-severity issues found by the report; those go to iOS/Android implementers
- Real-device gate evidence archival
- Backend/mobile data contract repair

---

## REVIEW

Reviewer must inspect exported attachment names and `.design-review/manifest.json`. Passing XCUITest alone is insufficient if the manifest/report is not idle-screen scoped.

---

## DESIGN

**References:** `.spec/design/system/views/idle-screen/README.md`, `.spec/design/system/refs/idle-screen/`

**Pattern:** Deterministic UITest state setup produces the same canonical screenshot names as reference assets.

**Anti-pattern:** Letting current weather decide whether the weather-advisory screenshot exists.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-REM-IOS-T01
- **Blocks:** IDLE-S06-REM-GATE-T01

---

## CODING STANDARDS

- `RULES.md` section "Real Device E2E Testing"
- `.spec/prds/v3-integration/tasks/sprint-05-design-review-pipeline/SPRINT.md`
- `/Users/justinrich/Projects/brain/docs/ANTI-STUB-REVIEW.md`

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN Sprint 06 variant list WHEN DesignReviewCaptureTests searched THEN seven canonical idle captures exist",
      "verify": "rg -n \"idle-screen\\\\.(default\\\\.light|typing-send\\\\.light|default\\\\.dark|filter-sheet\\\\.light|no-location\\\\.light|first-ride\\\\.light|weather-advisory\\\\.light)\" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift:39,50,60,70,80,90,100 define the 7 canonical idle attachment names",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "366a128a4885a5b0475434ce32d20ac9cd38e720"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN capture tests run WHEN attachments exported THEN idle attachment names match idle-screen.<state>.<theme>",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReviewCaptureTests",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "Focused XCTest verification passed: `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowUITests/DesignReviewCaptureTests` executed 7 tests with 0 failures; `/tmp/idle-design-review-sequential.txt` exported 7 idle-screen captures with canonical names",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "366a128a4885a5b0475434ce32d20ac9cd38e720"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN live weather/location variance WHEN canonical captures run THEN screenshots are produced without XCTSkip",
      "verify": "rg -n \"XCTSkip\\\\(\\\"(Weather advisory|Location unavailable|Location pill)\" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "`rg -n \"XCTSkip\\(\\\"(Weather advisory|Location unavailable|Location pill)\" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` returned no matches; focused idle capture XCTest passed for weather/location variants",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "366a128a4885a5b0475434ce32d20ac9cd38e720"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN design review runs for idle-screen WHEN report parsed THEN report contains idle-screen scope",
      "verify": "pnpm design:review --screens idle-screen && jq '[.issues[]? | .screen] | unique' .design-review/report.json",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "Sequential `pnpm design:review --screens idle-screen` exited 0; `.design-review/report.json` was generated; `jq '[.issues[]? | .screen] | unique' .design-review/report.json` returned [\"idle-screen\"]",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "366a128a4885a5b0475434ce32d20ac9cd38e720"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN stale report exists WHEN idle design review starts THEN stale test-screen output cannot survive merge",
      "verify": "pnpm design:review --screens idle-screen",
      "maps_to_ac": null,
      "satisfied": true,
      "evidence": "`scripts/design-review/run.ts:156-167` clears stale `.design-review` outputs; sequential `pnpm design:review --screens idle-screen` exited 0; `jq '[.issues[]? | .screen] | unique | index(\"test-screen\")' .design-review/report.json` returned null; `pnpm tsx scripts/design-review/__tests__/run-cleanup.test.ts` passed",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "366a128a4885a5b0475434ce32d20ac9cd38e720"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Seven canonical idle attachment-name strings exist in DesignReviewCaptureTests",
      "maps_to_ac": "AC-1",
      "verify": "rg -n \"idle-screen\\\\.(default\\\\.light|typing-send\\\\.light|default\\\\.dark|filter-sheet\\\\.light|no-location\\\\.light|first-ride\\\\.light|weather-advisory\\\\.light)\" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift",
      "satisfied": true,
      "evidence": "`rg -n \"idle-screen\\.(default\\.light|typing-send\\.light|default\\.dark|filter-sheet\\.light|no-location\\.light|first-ride\\.light|weather-advisory\\.light)\" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` matched lines 39,50,60,70,80,90,100",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "366a128a4885a5b0475434ce32d20ac9cd38e720"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "No idle-screen.light.load attachment name exists",
      "maps_to_ac": "AC-2",
      "verify": "rg -n \"idle-screen\\\\.(light|dark)\\\\.load\" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift",
      "satisfied": true,
      "evidence": "`rg -n \"idle-screen\\.(light|dark)\\.load\" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` returned no matches",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "366a128a4885a5b0475434ce32d20ac9cd38e720"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "No canonical idle capture throws XCTSkip for normal live-state variance",
      "maps_to_ac": "AC-3",
      "verify": "rg -n \"XCTSkip\\\\(\\\"(Weather advisory|Location unavailable|Location pill)\" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift",
      "satisfied": true,
      "evidence": "`rg -n \"XCTSkip\\(\\\"(Weather advisory|Location unavailable|Location pill)\" ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` returned no matches",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "366a128a4885a5b0475434ce32d20ac9cd38e720"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Report screen list contains idle-screen after design review",
      "maps_to_ac": "AC-4",
      "verify": "pnpm design:review --screens idle-screen && jq '[.issues[]? | .screen] | unique' .design-review/report.json",
      "satisfied": true,
      "evidence": "Sequential `pnpm design:review --screens idle-screen` exited 0 and `.design-review/report.json` contains only screen `idle-screen`",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "366a128a4885a5b0475434ce32d20ac9cd38e720"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Report screen list excludes test-screen after idle design review",
      "maps_to_ac": "AC-5",
      "verify": "pnpm design:review --screens idle-screen",
      "satisfied": true,
      "evidence": "Sequential `pnpm design:review --screens idle-screen` exited 0 and `.design-review/report.json` excludes `test-screen` (`jq ... index(\"test-screen\")` => null)",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "366a128a4885a5b0475434ce32d20ac9cd38e720"
    }
  ]
}
-->
