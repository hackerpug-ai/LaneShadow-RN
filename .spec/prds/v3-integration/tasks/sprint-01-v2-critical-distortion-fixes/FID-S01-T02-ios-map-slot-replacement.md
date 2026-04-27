# FID-S01-T02 — iOS map slot replacement: IdleScreen / PlanningScreen / ErrorScreen

**Sprint:** [SPRINT.md](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 360 min · **Type:** FEATURE · **Priority:** P0 · **Effort:** L · **Status:** Backlog

## BACKGROUND

Three iOS templates (IdleScreen, PlanningScreen, ErrorScreen) use a `LinearGradient(colors: [theme.colors.surface.default, theme.colors.background.default])` placeholder where the design specifies a real Mapbox map (or a paper substrate Canvas + contour SVGs + favorite pin overlays). This is the most visible iOS distortion per remediations/00-summary theme #2.

## CRITICAL CONSTRAINTS

- MUST replace `LinearGradient(...)` placeholders in IdleScreen.swift, PlanningScreen.swift, and ErrorScreen.swift — NEVER leave a `Text("Map Layer")` stub.
- MUST resolve substrate via `theme.colors.map.paper` and contours via `theme.colors.map.contour` / `map.contourFaint` — NEVER hardcode hex.
- MUST keep iOS sandbox story IDs identical to Android per RULES.md#cross-platform-component-parity.
- STRICTLY do NOT modify `android/**`, `server/**`, `*.pbxproj`, or `ios/project.yml`.
- NEVER edit `Info.plist` Mapbox secrets; rely on existing LSMap configuration.

## SPECIFICATION

**Objective:** Replace LinearGradient placeholder map slots in three iOS templates with either a real LSMap (preferred) or a `theme.colors.map.paper` substrate Canvas with contour overlays and absolute-positioned favorite pin Circles, so the iOS sandbox visually matches the design system's paper topographic canvas.

**Success state:** On iPhone 16 Simulator, IdleScreen, PlanningScreen, and ErrorScreen each show a real Mapbox map (or paper substrate fallback) with favorite pin dot overlays at designed fractional positions, in both light and dark mode. ErrorScreen additionally renders a broken-segment dashed `status.error` polyline with origin/broken/destination pins. No `LinearGradient` placeholder remains.

## ACCEPTANCE CRITERIA

- **AC-1** GIVEN `templates.idle.default`, WHEN IdleScreen renders the map slot, THEN the slot resolves to LSMap (Mapbox) when available, else a ZStack of `Color(theme.colors.map.paper)` + Canvas drawing contour paths at `theme.colors.map.contour` (0.9pt) and `theme.colors.map.contourFaint` (0.7pt) + ≥4 absolute-positioned favorite pins using `theme.colors.signal.default` with `theme.colors.surface.card` border.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/IdleScreenSnapshotTests/test_mapSlot_isPaperSubstrateOrMapbox`
- **AC-2** GIVEN `templates.planning.default`, WHEN PlanningScreen renders the map slot, THEN it uses the same paper-substrate / LSMap pattern (no LinearGradient remains) and resolves to a dark ink substrate when `colorScheme == .dark`.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/PlanningScreenSnapshotTests/test_mapSlot_resolvesPaperInBothThemes`
- **AC-3** GIVEN `templates.error.default`, WHEN ErrorScreen renders the map slot, THEN it shows a static map preview with a dashed broken-segment polyline at `theme.colors.status.error` plus origin / broken / destination pin atoms — not a LinearGradient.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/ErrorScreenSnapshotTests/test_mapSlot_brokenPolylineWithPins`
- **AC-4** GIVEN any of the three templates rendered, WHEN favorite pin overlays are drawn, THEN each pin Circle has `theme.colors.signal.default` fill, `theme.colors.surface.card` border at `theme.strokeWidth.thin`, and `theme.shadows.chrome` shadow — no raw color or hardcoded radius.
  - verify: `scripts/tokens/enforce-native-compliance.sh`
- **AC-5** GIVEN the iOS app builds, WHEN any of the three templates is loaded, THEN no `LinearGradient(colors: [theme.colors.surface.default, theme.colors.background.default])` placeholder remains in the three files.
  - verify: `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build`

## TEST CRITERIA

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | IdleScreen.swift no longer contains LinearGradient as map view | AC-1,AC-5 | `! grep -nE 'LinearGradient.*surface\.default.*background\.default' ios/LaneShadow/Views/Templates/IdleScreen.swift` |
| TC-2 | PlanningScreen.swift no longer contains LinearGradient map placeholder | AC-2,AC-5 | `! grep -nE 'LinearGradient.*surface\.default.*background\.default' ios/LaneShadow/Views/Templates/PlanningScreen.swift` |
| TC-3 | ErrorScreen.swift no longer contains LinearGradient and references status.error | AC-3,AC-5 | `! grep -nE 'LinearGradient.*surface\.default.*background\.default' ios/LaneShadow/Views/Templates/ErrorScreen.swift && grep -n 'status.error' ios/LaneShadow/Views/Templates/ErrorScreen.swift` |
| TC-4 | All three templates reference theme.colors.map.paper at least once | AC-1,AC-2,AC-3 | `grep -l 'map.paper' ios/LaneShadow/Views/Templates/IdleScreen.swift ios/LaneShadow/Views/Templates/PlanningScreen.swift ios/LaneShadow/Views/Templates/ErrorScreen.swift` |
| TC-5 | Favorite pin overlays use signal.default fill | AC-4 | `grep -nE 'signal\.default' ios/LaneShadow/Views/Templates/IdleScreen.swift` |
| TC-6 | Token compliance gate passes | AC-4 | `scripts/tokens/enforce-native-compliance.sh` |
| TC-7 | Cross-platform parity unchanged | AC-1..AC-3 | `pnpm snapshots:check` |

## READING LIST

- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/01-views-idle-planning.md` — Gap B-01
- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/03-views-sessions-error.md` — Gap C2-08
- `[PHASE: RED]` `.spec/design/system/views/idle-screen/idle-screen.html` — lines 186–215
- `[PHASE: RED]` `.spec/design/system/views/error-screen/error-screen.html` — broken polyline + pins
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Templates/IdleScreen.swift` — lines 61–78
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Templates/PlanningScreen.swift` — map slot
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Templates/ErrorScreen.swift` — map slot + broken polyline overlay
- `[PHASE: BOTH]` `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` — slot contract reference
- `[PHASE: BOTH]` `ios/LaneShadow/Views/Organisms/LSMapLayerSlots.swift` — slot model
- `[PHASE: BOTH]` `tokens/platforms/ios/` — confirm `map.paper`, `map.contour`, `status.error`, `shadows.chrome`

## GUARDRAILS

**WRITE-ALLOWED:**
- `ios/LaneShadow/Views/Templates/IdleScreen.swift`
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift`
- `ios/LaneShadow/Views/Templates/ErrorScreen.swift`
- `ios/LaneShadow/Views/Templates/MapPaperSubstrate.swift` (NEW)
- `ios/LaneShadowTests/Snapshots/**/*.swift`

**WRITE-PROHIBITED:** `android/**`, `server/**`, `react-native/**`, `web/**`, `tokens/**`, `**/*.pbxproj`, `ios/project.yml`, `LSMapLayer.swift`, `LSMapLayerSlots.swift`

## DESIGN

**References:**
- `.spec/prds/v3-integration/remediations/01-views-idle-planning.md` Gap B-01
- `.spec/prds/v3-integration/remediations/03-views-sessions-error.md` Gap C2-08
- `.spec/design/system/views/idle-screen/idle-screen.html` lines 186–215
- `.spec/design/system/views/error-screen/error-screen.html`

**Pattern:** Substrate Canvas + absolute-positioned overlay atoms inside a ZStack inside the map slot of LSMapLayer.
**Pattern source:** Android IdleScreen.kt already uses real LSMap with overlays — mirror the structural approach.
**Anti-pattern:** Leaving a LinearGradient placeholder, hardcoding hex for the substrate, or instantiating a full interactive Mapbox map on every preview render.

## RED PHASE INSTRUCTIONS

Author snapshot tests for the three story IDs (`templates.idle.default`, `templates.planning.default`, `templates.error.default`) that diff against design PNG counterparts under `.spec/design/system/views/{view}/`. The first run MUST FAIL with the LinearGradient placeholder visible. Do not write a vanity test that asserts the LinearGradient itself — assert visual parity to the design PNG, OR (if PNG diff is too noisy) inspect view body for absence of LinearGradient and presence of LSMap or Canvas with `map.paper` background. For ErrorScreen, additionally add a structural assertion that the broken-polyline path uses dashed StrokeStyle and `status.error` color.

## GREEN PHASE INSTRUCTIONS

Pattern reference: `PlanningScreen.swift` sketch polyline animation already uses `theme.colors.route.*`. Strategy: (1) Try LSMap first if it accepts a static-snapshot mode. (2) Else build a private `MapPaperSubstrate` view: `ZStack { Color(theme.colors.map.paper); Canvas { context, size in /* draw contour paths */ }; ForEach(favoritePins) { pin in Circle().fill(theme.colors.signal.default).stroke(theme.colors.surface.card, lineWidth: theme.strokeWidth.thin).shadow(theme.shadows.chrome).position(x: pin.x * size.width, y: pin.y * size.height) } }`. Reuse across the three templates. (3) For ErrorScreen overlay a Path with dashed StrokeStyle in `status.error` plus three pin atoms. Run swiftformat then xcodebuild build.

## REVIEW NOTES

- **Cross-platform parity:** Android already uses real LSMap with favorite-pin overlays per Gap B-01; verify iOS pin positions match Android fractional coordinates.
- **Token compliance:** any raw `rgba(...)` or `#RGB` in substrate Canvas or pin overlays fails the gate.
- **Performance:** confirm Canvas redraws are not triggered every frame (no `@State` mutating per frame).

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| swift-format | `swiftformat --quiet ios/**/*.swift` | exit 0 |
| ios-build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build` | BUILD SUCCEEDED |
| ios-tests | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | AC-1..AC-5 pass |
| token-compliance | `scripts/tokens/enforce-native-compliance.sh` | exit 0 |
| snapshot-parity | `pnpm snapshots:check` | exit 0 |

## CODING STANDARDS

`RULES.md#accessibility-standards`, `RULES.md#cross-platform-component-parity`, `styles/RULES.md`

## DEPENDENCIES

- **depends_on:** []
- **blocks:** [FID-S01-T09]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"IdleScreen map slot is paper substrate or LSMap","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/IdleScreenSnapshotTests/test_mapSlot_isPaperSubstrateOrMapbox","phase":"review"},{"id":"AC-2","type":"acceptance_criterion","description":"PlanningScreen map slot resolves paper in both themes","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/PlanningScreenSnapshotTests/test_mapSlot_resolvesPaperInBothThemes","phase":"review"},{"id":"AC-3","type":"acceptance_criterion","description":"ErrorScreen broken polyline + pins","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/ErrorScreenSnapshotTests/test_mapSlot_brokenPolylineWithPins","phase":"review"},{"id":"AC-4","type":"acceptance_criterion","description":"Favorite pin overlays use semantic tokens only","verify":"scripts/tokens/enforce-native-compliance.sh","phase":"green"},{"id":"AC-5","type":"acceptance_criterion","description":"No LinearGradient placeholder remains","verify":"xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build","phase":"green"},{"id":"TC-1","type":"test_criterion","description":"IdleScreen.swift has no LinearGradient map placeholder","maps_to_ac":"AC-1","verify":"! grep -nE 'LinearGradient.*surface\\.default.*background\\.default' ios/LaneShadow/Views/Templates/IdleScreen.swift","phase":"green"},{"id":"TC-2","type":"test_criterion","description":"PlanningScreen.swift has no LinearGradient map placeholder","maps_to_ac":"AC-2","verify":"! grep -nE 'LinearGradient.*surface\\.default.*background\\.default' ios/LaneShadow/Views/Templates/PlanningScreen.swift","phase":"green"},{"id":"TC-3","type":"test_criterion","description":"ErrorScreen.swift no LinearGradient + references status.error","maps_to_ac":"AC-3","verify":"! grep -nE 'LinearGradient.*surface\\.default.*background\\.default' ios/LaneShadow/Views/Templates/ErrorScreen.swift && grep -n 'status.error' ios/LaneShadow/Views/Templates/ErrorScreen.swift","phase":"green"},{"id":"TC-4","type":"test_criterion","description":"All three templates reference map.paper","maps_to_ac":"AC-1","verify":"grep -l 'map.paper' ios/LaneShadow/Views/Templates/IdleScreen.swift ios/LaneShadow/Views/Templates/PlanningScreen.swift ios/LaneShadow/Views/Templates/ErrorScreen.swift","phase":"green"},{"id":"TC-5","type":"test_criterion","description":"Favorite pin overlays use signal.default","maps_to_ac":"AC-4","verify":"grep -nE 'signal\\.default' ios/LaneShadow/Views/Templates/IdleScreen.swift","phase":"green"},{"id":"TC-6","type":"test_criterion","description":"Token compliance passes","maps_to_ac":"AC-4","verify":"scripts/tokens/enforce-native-compliance.sh","phase":"green"},{"id":"TC-7","type":"test_criterion","description":"Snapshot parity passes","maps_to_ac":"AC-1","verify":"pnpm snapshots:check","phase":"green"}]}
-->
