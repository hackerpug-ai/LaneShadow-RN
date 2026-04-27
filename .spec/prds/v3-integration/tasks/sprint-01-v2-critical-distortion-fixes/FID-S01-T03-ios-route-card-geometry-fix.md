# FID-S01-T03 — iOS LSRouteCard geometry fix

**Sprint:** [SPRINT.md](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 90 min · **Type:** FEATURE · **Priority:** P0 · **Effort:** S · **Status:** Backlog

## BACKGROUND

`LSCard(padding: .spacing4)` insets the map preview from the card edge, an inner `clipShape(RoundedRectangle(cornerRadius: theme.radius.md))` creates a double-rounded artifact, and `.frame(height: 160)` doesn't scale with card width. The subtitle pipe also uses literal `10` instead of `theme.space.md`.

## CRITICAL CONSTRAINTS

- MUST change `LSCard(padding: .spacing4)` to `LSCard(padding: .zero)` and re-apply `theme.space.md` padding inside `routeInfo` only.
- MUST remove the inner `.clipShape(RoundedRectangle(cornerRadius: theme.radius.md))` on the map preview.
- MUST replace `.frame(height: 160)` with `.aspectRatio(9.0/4.0, contentMode: .fill)`.
- STRICTLY do NOT modify `android/**`, `server/**`, `*.pbxproj`, `ios/project.yml`.
- MUST keep the 6 existing iOS LSRouteCard story IDs byte-identical to Android per RULES.md#cross-platform-component-parity.

## SPECIFICATION

**Objective:** Correct iOS LSRouteCard geometry so the map preview is edge-to-edge with the card's outer corner radius, the aspect ratio scales with card width, and the subtitle separator pipe uses `theme.space.md`.

**Success state:** All 6 LSRouteCard stories render with: (a) map preview filling card width with no inner padding gap, (b) corners clipped by outer LSCard radius only, (c) map preview scaling at 9:4 aspect ratio when card resizes, (d) subtitle pipe at `theme.strokeWidth.thin × theme.space.md`.

## ACCEPTANCE CRITERIA

- **AC-1** GIVEN `organisms.route-card.default`, WHEN LSRouteCard renders, THEN the LSCard wrapper is constructed with `padding: .zero` and the `routeInfo` HStack/VStack inside applies `.padding(theme.space.md)` for text content insets.
  - verify: `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteCardSnapshotTests/test_default_mapEdgeToEdge`
- **AC-2** GIVEN LSRouteCard renders the map preview, WHEN the view body is inspected, THEN no `clipShape(RoundedRectangle(cornerRadius: theme.radius.md))` is applied to the map preview view.
  - verify: `! grep -nE 'clipShape\(RoundedRectangle\(cornerRadius: theme\.radius\.md\)\)' ios/LaneShadow/Views/Organisms/LSRouteCard.swift`
- **AC-3** GIVEN LSRouteCard renders the map preview, WHEN sized at any width, THEN map uses `.aspectRatio(9.0/4.0, contentMode: .fill)` and `.frame(height: 160)` is gone.
  - verify: `grep -nE 'aspectRatio\(9\.0/4\.0' ios/LaneShadow/Views/Organisms/LSRouteCard.swift && ! grep -nE 'frame\(height: 160\)' ios/LaneShadow/Views/Organisms/LSRouteCard.swift`
- **AC-4** GIVEN LSRouteCard renders the subtitle row, WHEN the separator pipe is drawn, THEN it uses `.frame(width: theme.strokeWidth.thin, height: theme.space.md)` — no raw `10`.
  - verify: `grep -nE 'theme\.space\.md' ios/LaneShadow/Views/Organisms/LSRouteCard.swift && ! grep -nE 'frame\(width: theme\.strokeWidth\.thin, height: 10\)' ios/LaneShadow/Views/Organisms/LSRouteCard.swift`

## TEST CRITERIA

| ID | Statement | Maps to | Verify |
|---|---|---|---|
| TC-1 | LSRouteCard.swift uses LSCard(padding: .zero) | AC-1 | `grep -nE 'LSCard\(padding: \.zero' ios/LaneShadow/Views/Organisms/LSRouteCard.swift` |
| TC-2 | Inner clipShape on map preview removed | AC-2 | `! grep -nE 'clipShape\(RoundedRectangle' ios/LaneShadow/Views/Organisms/LSRouteCard.swift` |
| TC-3 | Map preview uses aspectRatio(9/4) | AC-3 | `grep -n 'aspectRatio(9.0/4.0' ios/LaneShadow/Views/Organisms/LSRouteCard.swift` |
| TC-4 | Subtitle pipe uses theme.space.md | AC-4 | `grep -nE 'strokeWidth\.thin.*space\.md\|space\.md.*strokeWidth\.thin' ios/LaneShadow/Views/Organisms/LSRouteCard.swift` |
| TC-5 | All 6 LSRouteCard stories pass snapshot diff | AC-1..AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteCardSnapshotTests` |
| TC-6 | Token compliance passes | AC-4 | `scripts/tokens/enforce-native-compliance.sh` |
| TC-7 | Snapshot parity passes | AC-1..AC-3 | `pnpm snapshots:check` |

## READING LIST

- `[PHASE: RED]` `.spec/prds/v3-integration/remediations/05-organisms-content.md` — Gaps E3-01..E3-06
- `[PHASE: RED]` `.spec/design/system/organisms/route-card/route-card.html` — lines 32–35 (--space-0 padding, aspect-ratio 9/4)
- `[PHASE: RED]` `.spec/design/system/organisms/route-card/README.md` — token references and aspect-ratio rationale
- `[PHASE: GREEN]` `ios/LaneShadow/Views/Organisms/LSRouteCard.swift` — lines 26 (LSCard padding), 57 (clipShape), 148 (subtitle pipe literal 10)
- `[PHASE: BOTH]` `ios/LaneShadow/Sandbox/Stories/Organisms/LSRouteCardStory.swift` — 6 story IDs are parity keys

## GUARDRAILS

**WRITE-ALLOWED:** `ios/LaneShadow/Views/Organisms/LSRouteCard.swift`, `ios/LaneShadowTests/Snapshots/LSRouteCardSnapshotTests.swift`

**WRITE-PROHIBITED:** `android/**`, `server/**`, `react-native/**`, `web/**`, `tokens/**`, `**/*.pbxproj`, `ios/project.yml`, `ios/LaneShadow/Sandbox/Stories/Organisms/LSRouteCardStory.swift`

## DESIGN

**References:**
- `.spec/prds/v3-integration/remediations/05-organisms-content.md` Gap E3-01..E3-06
- `.spec/design/system/organisms/route-card/route-card.html` lines 32–35, 254–258
- `.spec/design/system/organisms/route-card/README.md`

**Pattern:** `LSCard(padding: .zero)` wrapping edge-to-edge content with per-subview padding tokens.
**Pattern source:** Design HTML at `.spec/design/system/organisms/route-card/route-card.html` lines 32–35.
**Anti-pattern:** Applying inner `clipShape` on a child of LSCard or hardcoding map height literals.

## RED PHASE INSTRUCTIONS

Author or extend snapshot tests at `ios/LaneShadowTests/Snapshots/LSRouteCardSnapshotTests.swift` covering the 6 story IDs. Tests MUST compare against design PNG counterparts in `.spec/design/system/organisms/route-card/`. The first run MUST FAIL with the visible double-clip artifact and inset map. Do NOT write a vanity test asserting the literal `LSCard(padding: .spacing4)` exists. Assert image differs from current baseline AND matches the design reference after fix.

## GREEN PHASE INSTRUCTIONS

Make exactly four edits in `ios/LaneShadow/Views/Organisms/LSRouteCard.swift`:
1. Line ~26: change `LSCard(padding: .spacing4)` → `LSCard(padding: .zero)`.
2. Inside `routeInfo`, wrap content in `.padding(theme.space.md)`.
3. Line ~57: delete the `.clipShape(RoundedRectangle(cornerRadius: theme.radius.md))` modifier on map preview.
4. Replace `.frame(height: 160)` with `.aspectRatio(9.0/4.0, contentMode: .fill)`.
5. Line ~148: change `.frame(width: theme.strokeWidth.thin, height: 10)` → `.frame(width: theme.strokeWidth.thin, height: theme.space.md)`.

Then swiftformat, build, re-run snapshot tests.

## REVIEW NOTES

- **Visual artifact:** open `route-card.long-title-overflow` story specifically — card resize behavior surfaces aspectRatio bugs there.
- **Cross-platform parity:** Android task FID-S01-T08 also fixes `aspectRatio(9f/4f)`; confirm both land for parity.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| swift-format | `swiftformat --quiet ios/**/*.swift` | exit 0 |
| ios-build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build` | BUILD SUCCEEDED |
| ios-tests | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | LSRouteCard snapshot tests pass |
| token-compliance | `scripts/tokens/enforce-native-compliance.sh` | exit 0 |
| snapshot-parity | `pnpm snapshots:check` | exit 0 |

## CODING STANDARDS

`RULES.md#accessibility-standards`, `RULES.md#cross-platform-component-parity`, `styles/RULES.md`

## DEPENDENCIES

- **depends_on:** []
- **blocks:** [FID-S01-T09]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[{"id":"AC-1","type":"acceptance_criterion","description":"LSCard padding zero, routeInfo padding space.md","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteCardSnapshotTests/test_default_mapEdgeToEdge","phase":"review"},{"id":"AC-2","type":"acceptance_criterion","description":"Inner clipShape removed","verify":"! grep -nE 'clipShape\\(RoundedRectangle\\(cornerRadius: theme\\.radius\\.md\\)\\)' ios/LaneShadow/Views/Organisms/LSRouteCard.swift","phase":"green"},{"id":"AC-3","type":"acceptance_criterion","description":"Map uses aspectRatio(9/4)","verify":"grep -nE 'aspectRatio\\(9\\.0/4\\.0' ios/LaneShadow/Views/Organisms/LSRouteCard.swift && ! grep -nE 'frame\\(height: 160\\)' ios/LaneShadow/Views/Organisms/LSRouteCard.swift","phase":"green"},{"id":"AC-4","type":"acceptance_criterion","description":"Subtitle pipe uses theme.space.md","verify":"grep -nE 'theme\\.space\\.md' ios/LaneShadow/Views/Organisms/LSRouteCard.swift && ! grep -nE 'frame\\(width: theme\\.strokeWidth\\.thin, height: 10\\)' ios/LaneShadow/Views/Organisms/LSRouteCard.swift","phase":"green"},{"id":"TC-1","type":"test_criterion","description":"LSCard(padding: .zero)","maps_to_ac":"AC-1","verify":"grep -nE 'LSCard\\(padding: \\.zero' ios/LaneShadow/Views/Organisms/LSRouteCard.swift","phase":"green"},{"id":"TC-2","type":"test_criterion","description":"clipShape removed","maps_to_ac":"AC-2","verify":"! grep -nE 'clipShape\\(RoundedRectangle' ios/LaneShadow/Views/Organisms/LSRouteCard.swift","phase":"green"},{"id":"TC-3","type":"test_criterion","description":"aspectRatio 9/4","maps_to_ac":"AC-3","verify":"grep -n 'aspectRatio(9.0/4.0' ios/LaneShadow/Views/Organisms/LSRouteCard.swift","phase":"green"},{"id":"TC-4","type":"test_criterion","description":"Pipe uses space.md","maps_to_ac":"AC-4","verify":"grep -nE 'strokeWidth\\.thin.*space\\.md|space\\.md.*strokeWidth\\.thin' ios/LaneShadow/Views/Organisms/LSRouteCard.swift","phase":"green"},{"id":"TC-5","type":"test_criterion","description":"All 6 LSRouteCard stories pass","maps_to_ac":"AC-1","verify":"xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowSnapshotTests/LSRouteCardSnapshotTests","phase":"review"},{"id":"TC-6","type":"test_criterion","description":"Token compliance passes","maps_to_ac":"AC-4","verify":"scripts/tokens/enforce-native-compliance.sh","phase":"green"},{"id":"TC-7","type":"test_criterion","description":"Snapshot parity passes","maps_to_ac":"AC-1","verify":"pnpm snapshots:check","phase":"green"}]}
-->
