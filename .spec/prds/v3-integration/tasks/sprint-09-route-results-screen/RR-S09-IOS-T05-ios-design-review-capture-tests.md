# RR-S09-IOS-T05 — iOS DesignReviewCaptureTests for MapApp route-results variants

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z (retrofitted for MAPAPP-DOCTRINE 2026-05-14)

> **Task ID:** RR-S09-IOS-T05
> **Sprint:** [Sprint 09 — MapApp · Route Results State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 180 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-FID-01 (route-results variants), Sprint 09 — Design Review Gate

## Background

**Doctrine:** Per `RULES.md` § Design Rules › One View, Many States, capture tests target `MapApp` with `MapAppState == .routeResults(...)` injected via sandbox stories, NOT a sibling `RouteResultsScreen` template. Capture filenames remain anchored to the canonical reference set in `.spec/design/system/refs/route-results-screen/` (a sunk-cost folder name), but the sandbox story IDs that drive the captures are namespaced under `templates.map-app.route-results-{variant}-{theme}`.

Add XCUITest capture methods to `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` that drive `MapApp` to each of the 7 canonical route-results variants (from RR-S09-DR-T01's `VARIANTS.md`) by opening the corresponding sandbox story and capture a PNG per `(variant, theme)` tuple. Each capture is fed into the `pnpm design:review` pipeline for vision-LLM evaluation against the reference assets in `.spec/design/system/refs/route-results-screen/`. The capture pipeline must produce 7 captures matching the canonical filenames.

## Critical Constraints

**MUST:**
- MUST add 7 new test methods to `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift`: `test_mapApp_routeResults_default_best_pre_selected_light`, `test_mapApp_routeResults_alt1_tapped_sage_promoted_light`, `test_mapApp_routeResults_default_dark`, `test_mapApp_routeResults_refining_light`, `test_mapApp_routeResults_two_candidates_light`, `test_mapApp_routeResults_weather_divergent_light`, `test_mapApp_routeResults_message_dismissed_light`
- MUST drive each test by opening the canonical sandbox story `templates.map-app.route-results-{variant}-{theme}` registered in RR-S09-IOS-T02
- MUST capture each PNG with the canonical filename matching `.spec/design/system/refs/route-results-screen/{canonical-stem}.{light|dark}.png`
- MUST write captures to `ios/build/design-review/captures/route-results-screen/` (the existing capture output directory keyed on the design-system folder name)
- MUST register the new captures in `.design-review/manifest.json` (or trigger the existing manifest generator)
- MUST verify `pnpm design:review --screens route-results-screen` runs end-to-end against the new captures and produces a `report.json` entry per variant

**NEVER:**
- NEVER hand-author PNG files; all captures are programmatic XCUITest output
- NEVER target `templates.route-results-screen.*` story IDs — those are the pre-doctrine sibling-screen story IDs and DO NOT exist post-retrofit; the canonical IDs are `templates.map-app.route-results-*` per RR-S09-IOS-T02
- NEVER skip the alt1-tapped variant's interaction step (the test MUST drive the alt-card tap on `mapapp-routeresults-card-1` to trigger the S02 promotion before capturing)
- NEVER skip the refining variant's interaction (chat input must be focused with the refine primer overlay rendered)
- NEVER skip the message-dismissed variant's interaction (dismiss chevron must be tapped to reach V03)

**STRICTLY:**
- STRICTLY align each test method's capture filename to the canonical stem from RR-S09-DR-T01's `VARIANTS.md`
- STRICTLY follow `RULES.md` §"Design Review Pipeline — View Snapshot Testing" — every variant must have a `data-variant` or accessibility identifier that the test can target via the `mapapp-routeresults-*` namespace established in RR-S09-IOS-T02 / T04
- STRICTLY follow the existing capture pattern in `DesignReviewCaptureTests.swift` from prior sprints (Sprint 05 / 06 / 07 / 08); do not roll a new capture utility

## Specification

**Objective:** Add 7 XCUITest capture methods to `DesignReviewCaptureTests.swift` covering every canonical route-results variant of `MapApp`; each test drives the `templates.map-app.route-results-*` sandbox story to the appropriate state, captures a PNG, and writes it to the design-review capture output directory matching the canonical filenames.

**Success State:** `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests -only-test-class-method test_mapApp_routeResults_*` produces 7 PNGs under `ios/build/design-review/captures/route-results-screen/`; `pnpm design:review --screens route-results-screen` runs end-to-end against these captures and produces a `report.json` with one entry per variant; zero `high`-severity issues across all 7 variants (gate-blocker per Sprint 09 Design Review Gate).

## Acceptance Criteria

### AC-1 — Seven test methods exist with canonical names targeting MapApp routeResults stories

**GIVEN** RR-S09-DR-T01 has published the canonical 7-variant matrix and RR-S09-IOS-T02 has registered `templates.map-app.route-results-*` stories
**WHEN** `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` is parsed
**THEN** the file contains all 7 test method declarations with canonical names prefixed `test_mapApp_routeResults_`
**Verify:** `grep -c '^[[:space:]]*func test_mapApp_routeResults' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` returns 7

### AC-2 — Each test produces a PNG matching the canonical filename

**GIVEN** the 7 test methods exist
**WHEN** `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests` runs the 7 routeResults tests
**THEN** 7 PNG files exist under the design-review capture output directory matching canonical filenames (`default--best-pre-selected.light.png`, `alt1-tapped--sage-promoted.light.png`, `default--dark.dark.png`, `refining.light.png`, `two-candidates.light.png`, `weather-divergent.light.png`, `message-dismissed.light.png`)
**Verify:** `ls ios/build/design-review/captures/route-results-screen/ | grep -c '\.png$'` returns 7

### AC-3 — Alt-tapped variant captures post-selection state

**GIVEN** the `test_mapApp_routeResults_alt1_tapped_sage_promoted_light` test method
**WHEN** the test executes
**THEN** the test taps `mapapp-routeresults-card-1` BEFORE capturing the PNG; the captured PNG shows the sage polyline as solid-bold on MapApp's LSMap and the alt1 card with sage stripe + compass chip
**Verify:** Visual diff `ios/build/design-review/captures/route-results-screen/alt1-tapped--sage-promoted.light.png` vs `.spec/design/system/refs/route-results-screen/alt1-tapped--sage-promoted.light.png` ≤ pipeline threshold; verified via `pnpm design:review --screens route-results-screen` returning `severity == 'low' OR 'medium'` for this variant (no `high`)

### AC-4 — Refining variant captures unlocked chat input + scrim

**GIVEN** the `test_mapApp_routeResults_refining_light` test method
**WHEN** the test executes
**THEN** the test focuses `mapapp-routeresults-chat-input` AND ensures the refine primer chips are visible BEFORE capturing
**Verify:** Visual diff vs reference ≤ pipeline threshold; verified via `pnpm design:review --screens route-results-screen`

### AC-5 — Message-dismissed variant captures Recall chip state

**GIVEN** the `test_mapApp_routeResults_message_dismissed_light` test method
**WHEN** the test executes
**THEN** the test taps the dismiss chevron on `mapapp-routeresults-navigator-message` BEFORE capturing; the captured PNG shows the `mapapp-routeresults-recall-chip` bottom-anchored in copper (rendered via MapApp's `bottomOverlays`)
**Verify:** Visual diff vs reference ≤ pipeline threshold

### AC-6 — `pnpm design:review --screens route-results-screen` produces zero high-severity issues

**GIVEN** all 7 captures are written
**WHEN** `pnpm design:review --screens route-results-screen` runs end-to-end (capture → eval → report)
**THEN** `report.json` contains 7 variant entries AND zero entries have `severity == 'high'`; `report.html` renders the 7 variants side-by-side with reference
**Verify:** `pnpm design:review --screens route-results-screen && jq '[.findings[] | select(.severity == "high")] | length' ios/build/design-review/route-results-screen/report.json` returns 0

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Seven test methods with canonical names declared in DesignReviewCaptureTests.swift | AC-1 | `grep -c '^[[:space:]]*func test_mapApp_routeResults' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` returns 7 | happy_path |
| TC-2 | Seven PNG captures exist with canonical filenames | AC-2 | `ls ios/build/design-review/captures/route-results-screen/ \| grep -c '\.png$'` returns 7 | happy_path |
| TC-3 | Alt-tapped variant capture matches reference (no high-severity diff) | AC-3 | `pnpm design:review --screens route-results-screen` + jq filter for alt1 variant | happy_path |
| TC-4 | Refining variant capture matches reference | AC-4 | Same pipeline | happy_path |
| TC-5 | Message-dismissed capture matches reference | AC-5 | Same pipeline | happy_path |
| TC-6 | Zero high-severity issues across all 7 variants | AC-6 | `jq '[.findings[] \| select(.severity == "high")] \| length' ios/build/design-review/route-results-screen/report.json` returns 0 | edge |
| TC-7 | Build + lint clean across modified files | all | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` | all | [PRIMARY PATTERN] Existing capture-test architecture from Sprint 05 / 06 / 07 / 08 |
| `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` | all | Canonical 7-variant matrix from RR-S09-DR-T01 + canonical `templates.map-app.route-results-*` story ID convention |
| `.spec/design/system/refs/route-results-screen/` | all | Reference PNG set; capture filenames must match these stems |
| `scripts/design-review/` | all | `pnpm design:review` pipeline; manifest generator |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-IOS-T05-ios-design-review-capture-tests.md` | all | Sprint 08 sibling — same architecture, different content; Sprint 08 also targets `templates.map-app.planning-*` stories per the doctrine |
| `ios/LaneShadow/Sandbox/Stories/Templates/MapAppRouteResultsStories.swift` | all (NEW from RR-S09-IOS-T02) | Sandbox stories the capture tests drive |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` (MODIFY — add 7 test methods)
- `.design-review/manifest.json` (MODIFY only via the existing manifest generator, not hand-edit)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `.spec/design/system/refs/route-results-screen/**` — reference assets owned by RR-S09-DR-T01
- `scripts/design-review/**` — pipeline scripts owned by Sprint 05
- `ios/LaneShadow/**` — non-test code paths
- `android/**`, `server/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `.spec/prds/v3-integration/tasks/sprint-09-route-results-screen/VARIANTS.md` (canonical 7-variant matrix + `templates.map-app.route-results-*` story ID convention)
- `.spec/design/system/refs/route-results-screen/*.png` (reference assets — visual diff target)
- Sprint 08 PLAN-S08-IOS-T05 (capture architecture)
- `scripts/design-review/prompts/visual-eval.md` (vision LLM eval prompt)

**Interaction Notes:** Each variant requires specific XCUITest interactions to reach the captured state: S01 just opens the sandbox story (default `.routeResults` state); S02 requires tapping `mapapp-routeresults-card-1`; S03 toggles dark mode before capture; S04 focuses `mapapp-routeresults-chat-input`; V01 uses a 2-option fixture (story injects truncated `MapAppState.routeResults` data); V02 uses a 3-option fixture with mixed weather; V03 taps the dismiss chevron on `mapapp-routeresults-navigator-message`. All interactions happen via `XCUIElement.tap()` against accessibility identifiers established in RR-S09-IOS-T02 and RR-S09-IOS-T04.

**Pattern:** Sprint 08 PLAN-S08-IOS-T05 — same test architecture, swap story IDs from `templates.map-app.planning-*` to `templates.map-app.route-results-*` and update interactions.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-IOS-T05-ios-design-review-capture-tests.md`

**Anti-Pattern:** Hand-authoring PNGs; targeting pre-doctrine `templates.route-results-screen.*` story IDs (those do not exist post-retrofit); capturing pre-interaction state for interaction-required variants (S02, S04, V03); writing captures outside the canonical output directory; skipping the manifest registration.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -c '^[[:space:]]*func test_mapApp_routeResults' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` returns 7 |
| AC-2 | `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests` (filtered to mapApp routeResults) + `ls ios/build/design-review/captures/route-results-screen/ \| grep -c '\.png$'` returns 7 |
| AC-3 | Pipeline run + jq filter for alt1-tapped variant severity |
| AC-4 | Pipeline run + jq filter for refining variant severity |
| AC-5 | Pipeline run + jq filter for message-dismissed variant severity |
| AC-6 | `pnpm design:review --screens route-results-screen && jq '[.findings[] \| select(.severity == "high")] \| length' ios/build/design-review/route-results-screen/report.json` returns 0 |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** XCUITest authoring in `ios/LaneShadowUITests/DesignReview/`. Matches swift-implementer mandate. Reviewer: `swift-reviewer`.

## Coding Standards

- `RULES.md` § Design Rules › One View, Many States, §"Design Review Pipeline — View Snapshot Testing"
- `brain/docs/mobile-architecture/testing-strategy.md` (XCUITest patterns)
- `docs/REAL_DEVICE_E2E.md` (for the E2E flavor when run on device)

## Dependencies

**Depends on:**
- RR-S09-DR-T01 (canonical variant matrix in VARIANTS.md + `templates.map-app.route-results-*` story ID convention)
- RR-S09-IOS-T02 (sandbox stories registered with canonical IDs + accessibility identifiers under `mapapp-routeresults-*`)
- RR-S09-IOS-T03 (polyline rendering must be working for capture diffs)
- RR-S09-IOS-T04 (refine / dismiss / Recall must be wired for S04, V03 captures)

**Blocks:**
- RR-S09-T11 (Sprint 09 gate requires `pnpm design:review --screens route-results-screen` zero-high)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Seven test_mapApp_routeResults_* methods exist with canonical names matching VARIANTS.md","verify":"grep -c '^[[:space:]]*func test_mapApp_routeResults' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift returns 7","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Seven PNG captures exist in capture output directory with canonical filenames","verify":"ls ios/build/design-review/captures/route-results-screen/ | grep -c '\\.png$' returns 7","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Alt-tapped variant capture reflects post-selection state (sage promotion) — test taps mapapp-routeresults-card-1 before capture","verify":"pnpm design:review --screens route-results-screen + jq filter alt1-tapped severity != high","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Refining variant capture reflects unlocked chat input + scrim state","verify":"pnpm design:review --screens route-results-screen + jq filter refining severity != high","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Message-dismissed variant capture shows mapapp-routeresults-recall-chip bottom-anchored","verify":"pnpm design:review --screens route-results-screen + jq filter message-dismissed severity != high","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"pnpm design:review --screens route-results-screen returns report with zero high-severity findings across all 7 variants","verify":"jq '[.findings[] | select(.severity == \"high\")] | length' ios/build/design-review/route-results-screen/report.json returns 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Seven test method declarations grepable","verify":"grep -c '^[[:space:]]*func test_mapApp_routeResults' ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Seven .png captures present","verify":"ls ios/build/design-review/captures/route-results-screen/ | grep -c '\\.png$'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"alt1-tapped variant diff severity != high","verify":"pnpm design:review + jq filter","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"refining variant diff severity != high","verify":"pnpm design:review + jq filter","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"message-dismissed variant diff severity != high","verify":"pnpm design:review + jq filter","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Zero high-severity findings across all 7 variants in report.json","verify":"jq '[.findings[] | select(.severity == \"high\")] | length' ios/build/design-review/route-results-screen/report.json","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Build + lint clean across modified test file","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
