# FID-S01-T01 — iOS Newsreader serif typography rollout

**Sprint:** [SPRINT.md](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 240 min · **Type:** FEATURE · **Priority:** P0 · **Effort:** M · **Status:** Backlog

## BACKGROUND

Six iOS surfaces (IdleScreen greeting, Sessions "Rides" header, ErrorScreen callout body, NavigatorMessage body, TopBar centered title, SectionHeader caps variant) currently render in Geist sans (heading.md / title.lg / etc.) used as a "proxy" for the Newsreader serif `opinion.*` family. This is the most visible distortion in the iOS sandbox — the Navigator voice is mute. Replace every misuse with the correct token.

## CRITICAL CONSTRAINTS

- MUST resolve typography exclusively via `theme.type.opinion.{xl|lg|md}` / `theme.type.label.sm` — NEVER hardcode font names, sizes, or italic toggles outside `tokens/platforms/ios/`.
- MUST keep iOS sandbox story `id` strings byte-identical to Android counterparts per RULES.md#cross-platform-component-parity.
- STRICTLY do NOT modify `android/**`, `server/**`, `react-native/**`, `web/**`, or any `*.pbxproj` file.
- MUST remove the `// Use heading.md as proxy for opinion.md` comment in LSInlineErrorCallout.swift and LSNavigatorMessage.swift — the proxy is the bug.
- NEVER weaken assertions or skip snapshot tests; if a test reveals a token gap, fix the production code or escalate.

## SPECIFICATION

**Objective:** Replace every misused Geist-sans typography variant on the six designated iOS surfaces with the correct Newsreader serif `opinion.*` (or `label.sm`) variant so the iOS sandbox renders the Navigator voice consistently with `.spec/design/system/` HTML.

**Success state:** On iPhone 16 Simulator, IdleScreen greeting headline reads in Newsreader italic at opinion-xl; LSSessionsDrawer "Rides" header is opinion-lg italic; LSInlineErrorCallout body is opinion-md serif (no proxy comment remains); LSNavigatorMessage body is opinion-md serif and collocated inside the headerRow VStack; LSTopBar centered title is opinion-md serif; LSSectionHeader honors a new `titleStyle` enum with `.caps` rendering label-sm tertiary. All six snapshot tests pass against re-recorded baselines.

## ACCEPTANCE CRITERIA

- **AC-1** GIVEN the iOS sandbox is running and the user taps `templates.idle.default`, WHEN IdleScreen renders, THEN the greeting headline `Text` uses `theme.type.opinion.xl.font` (Newsreader italic) and the emphasis word renders in `theme.colors.signal.default` via AttributedString — not `theme.type.heading.md.font`.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/IdleScreenSnapshotTests/test_default_matchesDesign`
- **AC-2** GIVEN `templates.sessions.default`, WHEN LSSessionsDrawer renders, THEN the "Rides" header LSText uses `theme.type.opinion.lg.font` italic — not `theme.type.title.lg.font`.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSSessionsDrawerSnapshotTests/test_ridesHeader_isOpinionLgItalic`
- **AC-3** GIVEN `templates.error.default`, WHEN LSInlineErrorCallout renders, THEN the callout body resolves to `theme.type.opinion.md.font` and the file no longer contains "Use heading.md as proxy for opinion.md".
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSInlineErrorCalloutSnapshotTests/test_body_usesOpinionMd`
- **AC-4** GIVEN `organisms.navigator-message.default`, WHEN LSNavigatorMessage renders, THEN the body LSText is collocated inside the headerRow inner VStack alongside "THE NAVIGATOR" and uses `theme.type.opinion.md.font`.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSNavigatorMessageSnapshotTests/test_body_collocatedAndOpinionMd`
- **AC-5** GIVEN `organisms.topbar.default`, WHEN LSTopBar renders with a centered title, THEN the title LSText uses `theme.type.opinion.md.font` — not `theme.type.title.md.font`.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSTopBarSnapshotTests/test_centeredTitle_isOpinionMd`
- **AC-6** GIVEN `organisms.section-header.caps`, WHEN LSSectionHeader receives `titleStyle: .caps`, THEN the title renders in `theme.type.label.sm.font` with `theme.colors.content.tertiary`; default `titleStyle` keeps `theme.type.title.md.font`.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSSectionHeaderSnapshotTests/test_capsVariant_isLabelSmTertiary`

## TEST CRITERIA

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | IdleScreen.swift greeting references `opinion.xl` and not `heading.md` | AC-1 | `grep -n 'opinion.xl' ios/LaneShadow/Views/Templates/IdleScreen.swift && ! grep -n 'heading.md' ios/LaneShadow/Views/Templates/IdleScreen.swift` |
| TC-2 | LSSessionsDrawer.swift "Rides" LSText uses `opinion.lg` italic | AC-2 | `grep -nE 'opinion\.lg' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift` |
| TC-3 | LSInlineErrorCallout.swift body uses `opinion.md` and proxy comment removed | AC-3 | `grep -n 'opinion.md' ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift && ! grep -n 'proxy for opinion' ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift` |
| TC-4 | LSNavigatorMessage.swift body inside headerRow VStack and uses `opinion.md` | AC-4 | `grep -n 'opinion.md' ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` |
| TC-5 | LSTopBar.swift centered title uses `opinion.md` | AC-5 | `grep -n 'opinion.md' ios/LaneShadow/Views/Organisms/LSTopBar.swift` |
| TC-6 | LSSectionHeader.swift exposes `TitleStyle` enum and renders label.sm + content.tertiary on `.caps` | AC-6 | `grep -nE 'TitleStyle\|titleStyle' ios/LaneShadow/Views/Organisms/LSSectionHeader.swift` |
| TC-7 | Token compliance script passes | AC-1..AC-6 | `scripts/tokens/enforce-native-compliance.sh` |
| TC-8 | Cross-platform parity check passes | AC-1..AC-6 | `pnpm snapshots:check` |

## READING LIST

- `[PHASE: RED]` `.spec/prds/v3-integration/12-uc-fid.md` — authoritative AC list
- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/01-views-idle-planning.md` — Gap E-01 / D-01
- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/03-views-sessions-error.md` — Gap E1-02 / E2-01
- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/04-organisms-chrome.md` — Gap B-01 TopBar
- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/05-organisms-content.md` — Gaps E1-01 / E4-01
- `[PHASE: RED]` `.spec/design/system/views/idle-screen/idle-screen.html` — line 548 `.t-opinion-xl`
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Templates/IdleScreen.swift` — line 111 greeting headline
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift` — line 77 Rides header
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift` — line 54 body
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift` — line 35 body
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Organisms/LSTopBar.swift` — line 39 centered title
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Organisms/LSSectionHeader.swift` — add TitleStyle enum
- `[PHASE: BOTH]` `tokens/platforms/ios/` — confirm `theme.type.opinion.{xl,lg,md}` and `theme.type.label.sm` exist
- `[PHASE: BOTH]` `ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenStory.swift` — story id is parity key

## GUARDRAILS

**WRITE-ALLOWED:**
- `ios/LaneShadow/Views/Templates/IdleScreen.swift`
- `ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift`
- `ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift`
- `ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift`
- `ios/LaneShadow/Views/Organisms/LSTopBar.swift`
- `ios/LaneShadow/Views/Organisms/LSSectionHeader.swift`
- `ios/LaneShadowTests/Snapshots/**/*.swift`

**WRITE-PROHIBITED:** `android/**`, `server/**`, `react-native/**`, `web/**`, `tokens/**`, `**/*.pbxproj`, `ios/project.yml`

## DESIGN

**References:**
- `.spec/prds/v3-integration/12-uc-fid.md` (UC-FID-01 IdleScreen / Sessions / Error / Navigator / TopBar / SectionHeader)
- `.spec/prds/v3-integration/remediations/01-views-idle-planning.md` Gap E-01
- `.spec/prds/v3-integration/remediations/03-views-sessions-error.md` Gaps E1-02, E2-01
- `.spec/prds/v3-integration/remediations/04-organisms-chrome.md` Gap B-01, C-02
- `.spec/prds/v3-integration/remediations/05-organisms-content.md` Gaps E1-01, E1-07, E4-01
- `.spec/design/system/views/idle-screen/idle-screen.html` (line 548)
- `.spec/design/system/organisms/sessions-drawer/sessions-drawer.html`

**Pattern:** Theme-token-only typography lookup via `theme.type.{family}.{size}.font` and `theme.colors.{semantic}`.
**Pattern source:** `PlanningScreen.swift` already correctly references `theme.type.opinion.sm` for the phase indicator header.
**Anti-pattern:** Hardcoding `Font(name: 'Newsreader-Italic', size: 28)` or applying `.italic()` to a non-serif variant as a "proxy" for opinion.md.

## RED PHASE INSTRUCTIONS

Author or update XCTest snapshot tests under `ios/LaneShadowTests/Snapshots/` (pattern: `*SnapshotTests.swift`) for each AC. Use `swift-snapshot-testing`'s `assertSnapshot(of:as:.image(layout: .device(config: .iPhone16)))` against design PNG baselines under `.spec/design/system/views/{view}/` where present, else record-then-compare. The first run MUST FAIL because the production typography is currently wrong — this is the red signal. NEVER write a snapshot test that compares output to itself (vanity test); diff against the design PNG or a freshly-recorded baseline an implementer reviewed visually. If a test passes on first run before any production change, the test is broken — discard and re-author with stronger assertions (e.g., view inspection asserting `font.fontName == "Newsreader-Italic"` rather than image-only diff).

## GREEN PHASE INSTRUCTIONS

For each file in the GREEN reading list, change the typography variant token reference. Pattern reference: `PlanningScreen.swift` already passes `header: phaseHeader` with opinion-sm italic correctly — mirror its `theme.type.opinion.*` lookup. For the AttributedString emphasis-word fix in `IdleScreen.swift`, replace the HStack-of-Text word-split with a single `Text(attributedGreeting)` where `attributedGreeting` is an AttributedString built once and cached; range-style the emphasis word with `.foregroundColor = theme.colors.signal.default` and `.font = theme.type.opinion.xl.italic`. For LSSectionHeader, introduce `enum TitleStyle { case regular, caps }` defaulting to `.regular`; only the `.caps` branch swaps to label.sm + content.tertiary. After edits: swiftformat, xcodebuild build, re-run snapshot tests — they must now pass.

## REVIEW NOTES

- **Cross-platform parity:** confirm the 6 affected story IDs exist on Android with byte-identical strings. Run `pnpm snapshots:check` and inspect parity-coverage report — any drift fails the gate.
- **Token compliance:** run `scripts/tokens/enforce-native-compliance.sh` and confirm zero hardcoded font literals introduced. Grep diff for `Font(` and `.system(` — both must be absent.
- **Accessibility regressions:** verify Dynamic Type still scales (no `.fixedSize()` added). Newsreader at opinion-xl must not clip at AX1 — visual confirm in Simulator.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| swift-format | `swiftformat --quiet ios/**/*.swift` | exit 0, no diffs |
| ios-build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build` | BUILD SUCCEEDED |
| ios-tests | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | AC-1..AC-6 snapshot tests pass |
| token-compliance | `scripts/tokens/enforce-native-compliance.sh` | exit 0 |
| snapshot-parity | `pnpm snapshots:check` | exit 0 |

## CODING STANDARDS

- `RULES.md#accessibility-standards`
- `RULES.md#cross-platform-component-parity`
- `styles/RULES.md`

## DEPENDENCIES

- **depends_on:** []
- **blocks:** [FID-S01-T09]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"IdleScreen greeting uses opinion.xl Newsreader italic","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/IdleScreenSnapshotTests/test_default_matchesDesign","phase":"review"},{"id":"AC-2","type":"acceptance_criterion","description":"LSSessionsDrawer Rides header uses opinion.lg italic","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSSessionsDrawerSnapshotTests/test_ridesHeader_isOpinionLgItalic","phase":"review"},{"id":"AC-3","type":"acceptance_criterion","description":"LSInlineErrorCallout body uses opinion.md, proxy comment removed","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSInlineErrorCalloutSnapshotTests/test_body_usesOpinionMd","phase":"review"},{"id":"AC-4","type":"acceptance_criterion","description":"LSNavigatorMessage body collocated inside headerRow and uses opinion.md","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSNavigatorMessageSnapshotTests/test_body_collocatedAndOpinionMd","phase":"review"},{"id":"AC-5","type":"acceptance_criterion","description":"LSTopBar centered title uses opinion.md","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSTopBarSnapshotTests/test_centeredTitle_isOpinionMd","phase":"review"},{"id":"AC-6","type":"acceptance_criterion","description":"LSSectionHeader caps variant uses label.sm + content.tertiary","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSSectionHeaderSnapshotTests/test_capsVariant_isLabelSmTertiary","phase":"review"},{"id":"TC-1","type":"test_criterion","description":"IdleScreen.swift greeting references opinion.xl not heading.md","maps_to_ac":"AC-1","verify":"grep -n 'opinion.xl' ios/LaneShadow/Views/Templates/IdleScreen.swift && ! grep -n 'heading.md' ios/LaneShadow/Views/Templates/IdleScreen.swift","phase":"green"},{"id":"TC-2","type":"test_criterion","description":"LSSessionsDrawer.swift Rides LSText uses opinion.lg","maps_to_ac":"AC-2","verify":"grep -nE 'opinion\\.lg' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift","phase":"green"},{"id":"TC-3","type":"test_criterion","description":"LSInlineErrorCallout.swift body uses opinion.md and proxy comment removed","maps_to_ac":"AC-3","verify":"grep -n 'opinion.md' ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift && ! grep -n 'proxy for opinion' ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift","phase":"green"},{"id":"TC-4","type":"test_criterion","description":"LSNavigatorMessage.swift body uses opinion.md","maps_to_ac":"AC-4","verify":"grep -n 'opinion.md' ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift","phase":"green"},{"id":"TC-5","type":"test_criterion","description":"LSTopBar.swift centered title uses opinion.md","maps_to_ac":"AC-5","verify":"grep -n 'opinion.md' ios/LaneShadow/Views/Organisms/LSTopBar.swift","phase":"green"},{"id":"TC-6","type":"test_criterion","description":"LSSectionHeader.swift exposes TitleStyle enum","maps_to_ac":"AC-6","verify":"grep -nE 'TitleStyle|titleStyle' ios/LaneShadow/Views/Organisms/LSSectionHeader.swift","phase":"green"},{"id":"TC-7","type":"test_criterion","description":"Token compliance passes","maps_to_ac":"AC-1","verify":"scripts/tokens/enforce-native-compliance.sh","phase":"green"},{"id":"TC-8","type":"test_criterion","description":"Snapshot parity passes","maps_to_ac":"AC-1","verify":"pnpm snapshots:check","phase":"green"}]}
-->
