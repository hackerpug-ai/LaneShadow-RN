# FID-S01-T05 — iOS Sessions drawer container fix + token corrections

**Sprint:** [SPRINT.md](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 240 min · **Type:** FEATURE · **Priority:** P0 · **Effort:** M · **Status:** Backlog

## BACKGROUND

iOS LSSessionsDrawer wraps in `LSGlassPanel(variant: .chrome, ...)` causing map content to bleed through; uses wrong elevation token (`level4`); active stripe is `.frame(width: 3)` literal; active row uses `signal.default.opacity(...)` raw alpha; LSTopBar hamburger hit target is fragile arithmetic that may not satisfy 44pt accessibility minimum.

## CRITICAL CONSTRAINTS

- MUST replace `LSGlassPanel(variant: .chrome, ...)` with plain VStack + `background(theme.colors.surface.card)` + directional shadow + 1pt border-right separator.
- MUST resolve active-row stripe width via `theme.strokeWidth.lg` (2pt) — NEVER `.frame(width: 3)` literal.
- MUST resolve active-row background via `theme.colors.signal.whisper` semantic token — NEVER `signal.default.opacity(...)` raw alpha.
- MUST give LSTopBar hamburger ≥44pt × 44pt tap target via `.contentShape(Rectangle()).frame(minWidth: 44, minHeight: 44)` while keeping visual chip at 40pt.
- STRICTLY do NOT modify `android/**`, `server/**`, `*.pbxproj`, `ios/project.yml`, or rename sandbox story IDs.

## SPECIFICATION

**Objective:** Eliminate the glass-panel container; switch to solid `surface.card` with the design's directional drawer shadow and 1pt border-right separator. Correct four token misuses (active stripe width, active row background, hamburger hit target, drawer shadow tier).

**Success state:** SessionsScreen drawer renders opaque (no map bleed-through) with solid `theme.colors.surface.card` background, `2px 0 16px rgba(34,24,16,0.14)` directional shadow on trailing edge, 1pt right-edge separator, active row stripe at `theme.strokeWidth.lg` in `theme.colors.signal.default`, active row background in `theme.colors.signal.whisper` (auto-resolves dark mode), LSTopBar hamburger has verified ≥44pt × 44pt accessibility hit target.

## ACCEPTANCE CRITERIA

- **AC-1** GIVEN `templates.sessions.default`, WHEN LSSessionsDrawer renders, THEN outermost container is VStack with `.background(theme.colors.surface.card)` + trailing-edge directional shadow (offset right 2pt, blur 16pt, rgba(34,24,16,0.14) light / rgba(0,0,0,0.60) dark) + 1pt right-edge border separator — and contains NO `LSGlassPanel` wrapper.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSSessionsDrawerSnapshotTests/test_container_isSolidSurfaceCardWithDrawerShadow`
- **AC-2** GIVEN active session row rendered, WHEN active stripe is drawn, THEN width equals `theme.strokeWidth.lg` (2pt) and color equals `theme.colors.signal.default`.
  - verify: `grep -nE 'theme\.strokeWidth\.lg' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift && ! grep -nE '\.frame\(width: 3\)' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift`
- **AC-3** GIVEN active session row rendered, WHEN row background fills, THEN background resolves via `theme.colors.signal.whisper` directly — not raw-alpha pattern.
  - verify: `grep -n 'signal.whisper' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift && ! grep -nE 'signal\.default\.opacity\(' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift`
- **AC-4** GIVEN any LSTopBar with hamburger rendered, WHEN inspected for accessibility, THEN tap target ≥44pt × 44pt via `.contentShape(Rectangle()).frame(minWidth: 44, minHeight: 44)` while visual chip remains 40pt.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSTopBarAccessibilityTests/test_hamburger_meets44ptHitTarget`
- **AC-5** GIVEN `templates.sessions.default` in dark mode, WHEN active row background drawn, THEN `signal.whisper` resolves to dark-mode value (rgba(238,124,43,0.12)) without code branching.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSSessionsDrawerSnapshotTests/test_activeRow_signalWhisperResolvesInDarkMode`
- **AC-6** GIVEN LSSessionsDrawer renders, WHEN file inspected, THEN no `theme.elevation.level4` reference remains; directional shadow applied as view-local recipe (since `--elev-drawer` is documented TOKEN_GAP).
  - verify: `! grep -nE 'theme\.elevation\.level4' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift`

## TEST CRITERIA

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | LSSessionsDrawer.swift no longer references LSGlassPanel for container | AC-1 | `! grep -nE 'LSGlassPanel\(variant: \.chrome' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift` |
| TC-2 | Container uses surface.card background | AC-1 | `grep -nE 'background\(theme\.colors\.surface\.card' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift` |
| TC-3 | Active stripe uses strokeWidth.lg | AC-2 | `grep -n 'strokeWidth.lg' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift` |
| TC-4 | Active row uses signal.whisper | AC-3,AC-5 | `grep -n 'signal.whisper' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift` |
| TC-5 | Hamburger applies 44pt min hit target via contentShape | AC-4 | `grep -nE 'contentShape\(Rectangle\(\)\).*frame\(minWidth: 44\|frame\(minWidth: 44.*contentShape' ios/LaneShadow/Views/Organisms/LSTopBar.swift` |
| TC-6 | Drawer shadow uses view-local directional recipe | AC-1,AC-6 | `grep -nE 'shadow\(.*x: 2.*y: 0.*radius: 16\|shadow\(.*radius: 16.*x: 2' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift` |
| TC-7 | All Sessions + TopBar snapshot tests pass on light + dark | AC-1..AC-5 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSSessionsDrawerSnapshotTests` |
| TC-8 | Token compliance passes | AC-2,AC-3,AC-6 | `scripts/tokens/enforce-native-compliance.sh` |
| TC-9 | Snapshot parity passes | AC-1..AC-3 | `pnpm snapshots:check` |

## READING LIST

- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/04-organisms-chrome.md` — Gaps C-01..C-04, B-06
- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/03-views-sessions-error.md` — Gaps C1-03, D1-04, D1-06
- `[PHASE: RED]` `.spec/design/system/organisms/sessions-drawer/sessions-drawer.html`
- `[PHASE: RED]` `.spec/design/system/organisms/sessions-drawer/README.md` — TOKEN_GAP `--elev-drawer`
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift` — lines 38, 67–72, 133, 157–160
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Organisms/LSTopBar.swift` — line 116 chipSize arithmetic
- `[PHASE: BOTH]` `ios/LaneShadow/Sandbox/Stories/Templates/SessionsScreenStory.swift` — story id parity key
- `[PHASE: BOTH]` `tokens/platforms/ios/` — confirm `signal.whisper`, `strokeWidth.lg`, `border.default` exist

## GUARDRAILS

**WRITE-ALLOWED:**
- `ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift`
- `ios/LaneShadow/Views/Organisms/LSTopBar.swift`
- `ios/LaneShadowTests/Snapshots/LSSessionsDrawerSnapshotTests.swift`
- `ios/LaneShadowTests/Snapshots/LSTopBarAccessibilityTests.swift`

**WRITE-PROHIBITED:** `android/**`, `server/**`, `react-native/**`, `web/**`, `tokens/**`, `**/*.pbxproj`, `ios/project.yml`, `SessionsScreenStory.swift`

## DESIGN

**References:**
- `.spec/prds/v3-integration/remediations/04-organisms-chrome.md` Gaps C-01..C-04, B-06
- `.spec/prds/v3-integration/remediations/03-views-sessions-error.md` Gaps C1-03, D1-04, D1-06
- `.spec/design/system/organisms/sessions-drawer/sessions-drawer.html`
- `.spec/design/system/organisms/sessions-drawer/README.md` (TOKEN_GAP `--elev-drawer`)

**Pattern:** Solid `surface-card` container + view-local directional shadow + semantic token (`signal.whisper`) for state-tinted backgrounds.
**Pattern source:** Design HTML at `.spec/design/system/organisms/sessions-drawer/sessions-drawer.html`.
**Anti-pattern:** Wrapping a drawer in `LSGlassPanel.chrome` (causes map bleed-through), or applying raw alpha to a brand color instead of using the dark-mode-aware semantic token.

## RED PHASE INSTRUCTIONS

Author snapshot tests covering: (a) container construction (no glass — image diff against design PNG `sessions-drawer.html` render in light + dark), (b) active row stripe width via image diff or ViewInspector frame inspection, (c) active row background color, (d) hamburger hit-target via XCUIApplication accessibility audit (frame ≥44×44). The first run MUST FAIL because: container wraps in glass and bleeds map through, stripe is 3pt, active row uses raw alpha, hamburger hit target is fragile arithmetic. Do not lower assertions.

## GREEN PHASE INSTRUCTIONS

Order: (1) In LSSessionsDrawer.swift, replace `LSGlassPanel(variant: .chrome, padding: .spacing4) { ... }` (line ~38) with `VStack(spacing: 0) { ... }.padding(theme.space.lg).background(theme.colors.surface.card).overlay(alignment: .trailing) { Rectangle().fill(theme.colors.border.default).frame(width: theme.strokeWidth.thin) }.shadow(color: Color(red: 0.13, green: 0.09, blue: 0.06).opacity(0.14), radius: 16, x: 2, y: 0)`. NOTE: rgba(34,24,16,0.14) is documented TOKEN_GAP in remediations/03; this view-local literal is spec-sanctioned interim. Cite TOKEN_GAP comment inline. (2) Delete `theme.elevation.level4` shadow at lines 67–72. (3) Change line 133 `.frame(width: 3)` → `.frame(width: theme.strokeWidth.lg)`. (4) Lines 157–160: change `signal.default.opacity(theme.opacity["5"]!)` → `theme.colors.signal.whisper`. (5) In LSTopBar.swift, replace line 116 `chipSize` arithmetic with single token (theme.space.xxl or 40pt), then add `.contentShape(Rectangle()).frame(minWidth: 44, minHeight: 44)` to hamburger button while keeping visual `Circle/Image` at 40pt. After: swiftformat, build, snapshot tests, token compliance, parity.

## REVIEW NOTES

- **Cross-platform parity:** Android task FID-S01-T06 makes the same container fix; ensure shadow recipe matches `2px 0 16px rgba(34,24,16,0.14)` exactly — drift fails the parity diff.
- **Accessibility regression:** run XCUITest accessibility audit on hamburger and report the actual frame. <44×44 fails per RULES.md#accessibility-standards.
- **Dark mode resolution:** open dark-mode story (after T01 lands) and confirm `signal.whisper` resolves correctly. If token returns hardcoded light value, escalate — do not patch with conditional code.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| swift-format | `swiftformat --quiet ios/**/*.swift` | exit 0 |
| ios-build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build` | BUILD SUCCEEDED |
| ios-tests | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | LSSessionsDrawer + LSTopBar tests pass on light + dark |
| token-compliance | `scripts/tokens/enforce-native-compliance.sh` | exit 0; rgba(34,24,16,0.14) literal allow-listed via inline TOKEN_GAP comment |
| snapshot-parity | `pnpm snapshots:check` | exit 0 |

## CODING STANDARDS

`RULES.md#accessibility-standards`, `RULES.md#cross-platform-component-parity`, `styles/RULES.md`

## DEPENDENCIES

- **depends_on:** []
- **blocks:** [FID-S01-T09]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"Container is solid surface.card with drawer shadow and border-right","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSSessionsDrawerSnapshotTests/test_container_isSolidSurfaceCardWithDrawerShadow","phase":"review"},{"id":"AC-2","type":"acceptance_criterion","description":"Active stripe uses strokeWidth.lg signal.default","verify":"grep -nE 'theme\\.strokeWidth\\.lg' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift && ! grep -nE '\\.frame\\(width: 3\\)' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift","phase":"green"},{"id":"AC-3","type":"acceptance_criterion","description":"Active row uses signal.whisper not raw-alpha","verify":"grep -n 'signal.whisper' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift && ! grep -nE 'signal\\.default\\.opacity\\(' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift","phase":"green"},{"id":"AC-4","type":"acceptance_criterion","description":"Hamburger ≥44pt hit target","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSTopBarAccessibilityTests/test_hamburger_meets44ptHitTarget","phase":"review"},{"id":"AC-5","type":"acceptance_criterion","description":"signal.whisper resolves in dark mode","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSSessionsDrawerSnapshotTests/test_activeRow_signalWhisperResolvesInDarkMode","phase":"review"},{"id":"AC-6","type":"acceptance_criterion","description":"No theme.elevation.level4 reference remains","verify":"! grep -nE 'theme\\.elevation\\.level4' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift","phase":"green"},{"id":"TC-1","type":"test_criterion","description":"No LSGlassPanel chrome wrapper","maps_to_ac":"AC-1","verify":"! grep -nE 'LSGlassPanel\\(variant: \\.chrome' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift","phase":"green"},{"id":"TC-2","type":"test_criterion","description":"Background surface.card","maps_to_ac":"AC-1","verify":"grep -nE 'background\\(theme\\.colors\\.surface\\.card' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift","phase":"green"},{"id":"TC-3","type":"test_criterion","description":"Stripe strokeWidth.lg","maps_to_ac":"AC-2","verify":"grep -n 'strokeWidth.lg' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift","phase":"green"},{"id":"TC-4","type":"test_criterion","description":"Active row signal.whisper","maps_to_ac":"AC-3","verify":"grep -n 'signal.whisper' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift","phase":"green"},{"id":"TC-5","type":"test_criterion","description":"Hamburger 44pt contentShape","maps_to_ac":"AC-4","verify":"grep -nE 'contentShape\\(Rectangle\\(\\)\\).*frame\\(minWidth: 44|frame\\(minWidth: 44.*contentShape' ios/LaneShadow/Views/Organisms/LSTopBar.swift","phase":"green"},{"id":"TC-6","type":"test_criterion","description":"Drawer shadow x:2 radius:16 recipe","maps_to_ac":"AC-1","verify":"grep -nE 'shadow\\(.*x: 2.*y: 0.*radius: 16|shadow\\(.*radius: 16.*x: 2' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift","phase":"green"},{"id":"TC-7","type":"test_criterion","description":"All Sessions + TopBar snapshot tests pass","maps_to_ac":"AC-1","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSSessionsDrawerSnapshotTests","phase":"review"},{"id":"TC-8","type":"test_criterion","description":"Token compliance","maps_to_ac":"AC-2","verify":"scripts/tokens/enforce-native-compliance.sh","phase":"green"},{"id":"TC-9","type":"test_criterion","description":"Snapshot parity","maps_to_ac":"AC-1","verify":"pnpm snapshots:check","phase":"green"}]}
-->
