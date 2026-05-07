# CAPS-S07-T03 — iOS LSMapControls organism (vertical workbar — zoom/recenter/layers/save/mode-toggle)

> **Task ID:** CAPS-S07-T03 · **Sprint:** [Sprint 07](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 180 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P0 · **Effort:** M
> **PRD Refs:** UC-FID-01, UC-MAP-01, Sprint 07 — Context Capsule + Map Controls (Map View Redesign 2026-05-06)

## Background

New SwiftUI organism mirroring `react-native/components/map/map-controls.tsx` and the design system `org-map-controls`. Right-aligned vertical workbar with zoom +/- cluster, recenter, layers, optional save (with `--saved` copper variant), and mode-toggle. Pure 40pt glass chips, no Mapbox SDK coupling — handlers emit intent for the consumer to wire to camera APIs.

## Critical Constraints

**MUST:**
- Implement `LSMapControls` at `ios/LaneShadow/Views/Organisms/LSMapControls.swift` accepting `mode: LSMapControlsMode (.map|.chat)` + optional callbacks `onZoomIn/Out/Recenter/Layers/SaveRoute/ToggleView` + `hasRouteToSave: Bool` + `isSavedRoute: Bool`
- Layout: `VStack(alignment: .trailing, spacing: theme.space.xs /* 4pt */)` containing zoom cluster card → recenter chip → layers chip → optional save chip → mode-toggle chip
- Position when mounted in views: anchored to the **vertical middle of the right edge** via `.frame(maxHeight: .infinity, alignment: .center)` plus `.padding(.trailing, theme.space.s4)` (NOT top-aligned). The consumer (idle/planning/etc.) drives this via the LSMapLayer trailing-overlay slot or absolute-positioned container with `top: 50%; transform: translateY(-50%)` semantics.
- Each chip: 40pt square, `surface.overlay` background, hairline `border.default` stroke, `radius.md` (6pt) corners, `elev.chrome` shadow, 8pt blur via `.background(.regularMaterial)` tinted with surface.overlay
- Zoom cluster: single rounded glass card with two 40pt buttons separated by `border.default` `borderWidth.thin` divider; total ≈80pt+1pt; `radius.md` outer + `.clipped()` to mask interior
- Icon strokes via `LSIcon` atoms or SF Symbols at `theme.borderWidth.medium` (~1.5pt), color `currentColor → content.primary`, size `icon.md` (18pt). Glyphs: plus, minus, location.crosshairs, square.stack.3d, bookmark, message, map
- When `mode == .map`: render zoom + recenter + layers; insert save chip when `hasRouteToSave == true`; mode-toggle ALWAYS at bottom (chat icon in map mode, map icon in chat mode)
- When `mode == .chat`: collapse to single mode-toggle chip showing map glyph
- When `isSavedRoute == true`: save chip flips to `signal.default` background, `content.onSignal` glyph, `signal.default` border
- Wire callbacks to consumer's Mapbox MapView APIs — NO Mapbox import in this file
- Register 8 sandbox stories (4 modes × 2 themes) via `LSMapControlsStory.swift` added to `OrganismStories.all`; story IDs `organisms.map-controls.{map,map-with-route,map-saved,chat}-{light,dark}`
- Provide accessibility labels per the design README

**NEVER:**
- Hardcode pixel values, hex colors, or numeric stroke widths
- Import `MapboxMaps` inside `LSMapControls.swift`
- Duplicate or modify the Sprint 06 LSMap host
- Omit the mode-toggle chip in either mode
- Use deprecated `.foregroundColor` — use `.foregroundStyle`

**STRICTLY:**
- Mirror chip dimensions to `LSTopBar` chip pattern (40pt square, blur(8), surface.overlay) so perimeter chrome reads as one system
- Mirror production handler semantics from `map-controls.tsx` — Layers handler is named `onLayers` (semantic) but production calls it `onClear`; document this in file header
- Pass token compliance and SwiftLint

## Specification

**Objective:** Ship `LSMapControls` matching `org-map-controls` design contract with parity to `react-native/components/map/map-controls.tsx`, plus 8 sandbox stories so design-review can capture each mode/state combination in light + dark.

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests` exits 0; sandbox catalog shows 8 `organisms.map-controls.*` stories; consumer view in CAPS-S07-T05 wires zoom/recenter callbacks to LSMap camera APIs producing +1/-1 zoom changes.

## Acceptance Criteria

### AC-1 — Default map mode renders 4 chips in correct order

**GIVEN** `LSMapControls(mode: .map, hasRouteToSave: false)` with zoom/recenter/layers/toggleview callbacks
**WHEN** the view renders
**THEN** the visible vertical stack contains exactly: zoom cluster card → recenter chip → layers chip → mode-toggle (chat glyph) chip; no save chip; spacing = `theme.space.xs` (4pt)
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_mapMode_rendersFourChipsInOrder`

### AC-2 — hasRouteToSave inserts save chip between layers and mode-toggle

**GIVEN** `LSMapControls(mode: .map, hasRouteToSave: true, isSavedRoute: false)`
**WHEN** the view renders
**THEN** stack order is zoom cluster → recenter → layers → save (bookmark glyph, default `surface.overlay` background) → mode-toggle; save chip uses `content.primary` icon stroke and `border.default` border
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_hasRouteToSave_insertsSaveChip`

### AC-3 — isSavedRoute flips save chip to copper signal fill

**GIVEN** `LSMapControls(mode: .map, hasRouteToSave: true, isSavedRoute: true)`
**WHEN** the view renders
**THEN** save chip background = `LaneShadowTheme.color.signal.default` (copper); border = `signal.default`; bookmark glyph foregroundStyle = `content.onSignal`; accessibility label = "Saved route"
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_isSavedRoute_flipsToCopperSignal`

### AC-4 — Chat mode collapses to single map-toggle chip

**GIVEN** `LSMapControls(mode: .chat, hasRouteToSave: true)`
**WHEN** the view renders
**THEN** only the mode-toggle chip is visible (map glyph); zoom cluster, recenter, layers, save all absent; accessibility label = "Back to map"
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_chatMode_collapsesToSingleToggle`

### AC-5 — Zoom cluster wiring produces +1/-1 zoom on Mapbox camera

**GIVEN** `LSMapControls` hosted by parent owning `LSMapHost` / Mapbox camera and binding `onZoomIn = { camera.zoom += 1 }`, `onZoomOut = { camera.zoom -= 1 }`
**WHEN** XCUITest taps `control-zoom-in` then `control-zoom-out`
**THEN** parent's recorded camera.zoom delta sequence is exactly +1 then -1 (final delta 0); test uses fake camera proxy
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne`

### AC-6 — Dark theme re-resolves all chip surfaces and signal fill

**GIVEN** same map-with-route + saved inputs as AC-2/AC-3 mounted under `colorScheme(.dark)`
**WHEN** the views render
**THEN** `surface.overlay` re-resolves to dark glass token; `border.default` and `content.primary` re-resolve; `signal.default` copper save chip remains identical brand color; chip dimensions and spacing unchanged
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_darkTheme_reResolvesChipSurfaces`

### AC-7 — Token purity (zero hex literals or hardcoded geometry)

**GIVEN** `ios/LaneShadow/Views/Organisms/LSMapControls.swift`
**WHEN** `scripts/tokens/enforce-native-compliance.sh` + grep for hex/RGB/numeric-size literals
**THEN** exit 0 with zero findings; file contains zero `Color(red:...)`, hex strings, numeric `frame(width: 40)`/`padding(8)` literals (all geometry via theme tokens)
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -cE 'Color\(red:|#[0-9A-Fa-f]{6}|frame\(width: ?[0-9]+|padding\([0-9]+' ios/LaneShadow/Views/Organisms/LSMapControls.swift`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Default map mode VStack hierarchy: zoom cluster, recenter, layers, mode-toggle | AC-1 | happy_path |
| TC-2 | hasRouteToSave=true inserts save chip in slot between layers and mode-toggle | AC-2 | edge |
| TC-3 | isSavedRoute=true sets save chip background to signal.default and onSignal glyph | AC-3 | edge |
| TC-4 | mode=.chat hides zoom cluster + recenter + layers + save; only mode-toggle visible | AC-4 | edge |
| TC-5 | Zoom in then zoom out callbacks invoked exactly once each producing +1/-1 deltas | AC-5 | happy_path |
| TC-6 | Dark theme re-resolves surface.overlay/border.default; signal.default unchanged; geometry stable | AC-6 | happy_path |
| TC-7 | enforce-native-compliance.sh + grep find zero hex/RGB/literal-px violations | AC-7 | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `.spec/design/system/organisms/map-controls/map-controls.html` | all | Visual contract — VStack alignment trailing, 40pt chip width, surface.overlay+blur(8), zoom cluster shape, save chip --saved variant |
| `.spec/design/system/organisms/map-controls/README.md` | all | Slot details, geometry table, accessibility labels, production handler mapping |
| `react-native/components/map/map-controls.tsx` | 1-180 | Production reference — handler ordering, mode-toggle bottom rule, hasRouteToSave conditional, isSavedRoute accent |
| `ios/LaneShadow/Views/Organisms/LSTopBar.swift` | 1-120 | Pattern source — 40pt chip with surface.overlay+blur, hairline border, theme.radius and shadow tokens |
| `ios/LaneShadow/Views/Atoms/LSIcon.swift` | all | Icon atom with stroke-width and color resolution |
| `ios/LaneShadow/Sandbox/Stories/Organisms/LSTopBarStory.swift` | all | Sandbox story registration pattern for organism tier |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` (NEW)
- `ios/LaneShadow/Sandbox/Stories/Organisms/LSMapControlsStory.swift` (NEW)
- `ios/LaneShadow/Sandbox/Stories/Organisms/OrganismStories.swift` (MODIFY — add LSMapControlsStory.all)
- `ios/LaneShadowTests/Organisms/LSMapControlsTests.swift` (NEW)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 map host
- `ios/LaneShadow/AppFlow/MapView/**` — Sprint 06 host
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` — owned by CAPS-S07-T05
- `ios/LaneShadow/Views/Molecules/MapControls.swift` — pre-existing molecule (unrelated; do not delete or repurpose)
- `android/**`, `server/**`, `react-native/**`, `tokens/**`

## Design

**References:** `org-map-controls` HTML + README + `react-native/components/map/map-controls.tsx`

**Interaction Notes:** All chips are interactive Buttons with 40pt hit targets. Provide hitSlop matching `theme.space.xs`. Mode-toggle ALWAYS lives in the bottom slot for both modes — when rider switches between map and chat, toggle stays visually anchored. Save chip conditional on `hasRouteToSave`; the slot does not show empty placeholder when absent.

**Pattern:** `ios/LaneShadow/Views/Organisms/LSTopBar.swift:1-120` — token-driven chip strip using `theme.color.surface.overlay` + `theme.radius.md` + `theme.borderWidth.thin` stroke + `theme.elev/shadow`

**Pattern Source:** Sprint 05 LSTopBar — 40pt chip dimensions, blur(8), hairline border are intentionally identical so perimeter chrome reads as one system

**Anti-Pattern:** Importing MapboxMaps inside LSMapControls (camera-API coupling); duplicating Sprint 06 LSMap host; rendering placeholder in save slot when `hasRouteToSave` false; using the existing molecule-tier `MapControls.swift` (which is unrelated production legacy)

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_mapMode_rendersFourChipsInOrder` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_hasRouteToSave_insertsSaveChip` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_isSavedRoute_flipsToCopperSignal` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_chatMode_collapsesToSingleToggle` |
| AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne` |
| AC-6 | `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_darkTheme_reResolvesChipSurfaces` |
| AC-7 | `scripts/tokens/enforce-native-compliance.sh` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Views/Organisms/LSMapControls.swift ios/LaneShadow/Sandbox/Stories/Organisms/LSMapControlsStory.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** New SwiftUI organism mirroring `react-native/components/map/map-controls.tsx`. Pure SwiftUI/Mapbox camera surface area + token-driven 40pt chip chrome + sandbox stories — natural swift-implementer scope.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `brain/docs/mobile-architecture/performance-optimization.md`
- `RULES.md` (LaneShadow §Cross-Platform Component Parity, §Accessibility Standards iOS)

## Dependencies

**Depends on:** _(none)_
**Blocks:** CAPS-S07-T05 (idle retrofit), CAPS-S07-T07 (capture tests), CAPS-S07-T09 (sprint gate)
**Parallel:** CAPS-S07-T01 (iOS capsule), CAPS-S07-T04 (Android twin)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN .map mode no route WHEN renders THEN VStack: zoom cluster, recenter, layers, mode-toggle (chat) at theme.space.xs gap","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_mapMode_rendersFourChipsInOrder","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN .map + hasRouteToSave=true WHEN renders THEN save chip inserted between layers and mode-toggle","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_hasRouteToSave_insertsSaveChip","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN isSavedRoute=true WHEN renders THEN save chip uses signal.default fill + content.onSignal glyph + Saved route a11y","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_isSavedRoute_flipsToCopperSignal","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN .chat mode WHEN renders THEN only mode-toggle (map glyph) visible; all others hidden","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_chatMode_collapsesToSingleToggle","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN bound onZoomIn/Out callbacks WHEN tap zoom-in then zoom-out THEN fake camera records +1 then -1 deltas","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN dark colorScheme WHEN renders THEN surface.overlay/border.default re-resolve; signal.default unchanged","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_darkTheme_reResolvesChipSurfaces","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"GIVEN file LSMapControls.swift WHEN compliance.sh + grep run THEN zero hex/RGB/literal-px findings","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"VStack layout matches design HTML order","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_mapMode_rendersFourChipsInOrder","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Save chip slot insertion conditional on hasRouteToSave","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_hasRouteToSave_insertsSaveChip","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Save chip copper-fill variant + a11y label","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_isSavedRoute_flipsToCopperSignal","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Chat mode hides all map-specific chips except mode-toggle","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_chatMode_collapsesToSingleToggle","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Zoom callbacks fire exactly once with +1/-1 deltas","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Dark theme tokens re-resolve; geometry stable","verify":"xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_darkTheme_reResolvesChipSurfaces","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Token compliance shell + grep clean","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
