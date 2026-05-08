# CAPS-S07-T04 — Android LSMapControls organism (Compose vertical workbar — zoom/recenter/layers/save/mode-toggle)

> **Task ID:** CAPS-S07-T04 · **Sprint:** [Sprint 07](./SPRINT.md) · **Agent:** kotlin-implementer · **Estimate:** 180 min · **Type:** FEATURE · **Status:** Done · **Priority:** P0 · **Effort:** M
> **PRD Refs:** UC-FID-01, UC-MAP-01

## Background

Android parity to CAPS-S07-T03 (iOS). Compose composable `LSMapControls` mirrors the `org-map-controls` design contract and React Native production reference. Right-side vertical workbar with zoom +/- cluster, recenter, layers, optional save (with copper saved variant), and mode-toggle. Pure 40dp glass chips, no Mapbox SDK coupling — handlers emit intent for the consumer to wire.

## Critical Constraints

**MUST:**
- Drive ALL chip colors / borders / blur / radii / icon sizes via `LocalLaneShadowTheme.current` — zero `Color(0xFF…)` literals
- Visually mirror `org-topbar__chip` aesthetic (40dp square, 8dp blur, surface-overlay, hairline border-default, `theme.elevation` chrome) so perimeter chrome reads as one system
- Position when mounted in views: anchored to the **vertical middle of the right edge** of the map canvas (Compose: `Modifier.align(Alignment.CenterEnd).padding(end = theme.space.s4)`). NOT top-aligned. The host (idle/planning) drives this via the LSMapLayer trailing-overlay slot
- Wire Mapbox handlers (`onZoomIn/onZoomOut/onRecenter/onClear/onSaveRoute/onToggleView`) as nullable lambda params — when null, the chip is omitted (matches React Native production semantics)
- Register exactly 8 stories (4 modes × 2 themes) with canonical IDs `organisms.mapcontrols.{map-no-route|map-with-route|map-saved|chat-mode}.{light|dark}`

**NEVER:**
- Instantiate Mapbox SDK or hold MapView references inside this organism — it consumes pure handlers
- Hardcode hex colors or geometric pixel values
- Use Material 3 default-tinted FilledIconButton without theme overrides
- Re-implement the topbar chip geometry from scratch — extract the shared chip recipe if duplication is necessary (Rule of 2)

**STRICTLY:**
- Mode-toggle ALWAYS lives at the bottom of the workbar in BOTH modes (production semantic from `map-controls.tsx` lines 152-153)
- RenderEffect blur strategy gated by `Build.VERSION.SDK_INT` (mirror `LSGlassPanel.resolveGlassBlurStrategy`) — `RenderEffect` on SDK ≥ 31, `ModifierBlur` fallback otherwise

## Specification

**Objective:** Ship `LSMapControls` Compose organism rendering the right-side vertical workbar at parity with iOS `LSMapControls` and React Native `MapControls`, with all surfaces / chips / icons / save-active state driven from theme tokens, plus 8 sandbox stories.

**Success State:** `./gradlew :app:testDebugUnitTest` exits 0; `./gradlew :app:assembleDebug` builds clean; sandbox catalog contains 8 entries under `organisms.mapcontrols.*`; `scripts/tokens/enforce-native-compliance.sh` exit 0.

## Acceptance Criteria

### AC-1 — Map mode no-route renders zoom-cluster + recenter + layers + chat-toggle [PRIMARY]

**GIVEN** `LSMapControls(mode=MapControlsMode.Map, onZoomIn={}, onZoomOut={}, onRecenter={}, onClear={}, onToggleView={}, hasRouteToSave=false)`
**WHEN** Composable composes
**THEN** Compose tree contains: 1 zoom-cluster (Column with 2 buttons + 1dp Divider) + 1 recenter chip (CrosshairsGps glyph) + 1 layers chip (Layers glyph) + 1 mode-toggle chip (ChatBubbleOutline glyph); NO save chip; vertical layout uses `theme.space.s2` (4dp) gap between chips; alignment = End
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_no_route_renders_four_chip_groups'`

### AC-2 — Map mode with-route adds Save chip between Layers and Toggle

**GIVEN** Same as AC-1 but with `onSaveRoute={}` and `hasRouteToSave=true`, `isSavedRoute=false`
**WHEN** Composable composes
**THEN** Compose tree adds save chip with Bookmark glyph between layers and mode-toggle; save chip uses default chip surface (NOT copper); chip count = 5
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_with_route_renders_save_chip'`

### AC-3 — Saved route state paints save chip in copper signal

**GIVEN** Same as AC-2 but with `isSavedRoute=true`
**WHEN** Composable composes
**THEN** Save chip background = `theme.colors.signal.default`; border = `theme.colors.signal.default`; bookmark glyph color = `theme.colors.onSignal.default` (filled, fill=currentColor, stroke=none); semantics expose contentDescription = 'Saved route' (vs 'Save route' when `isSavedRoute=false`)
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.saved_route_paints_chip_copper'`

### AC-4 — Chat mode collapses workbar to single map-toggle chip

**GIVEN** `LSMapControls(mode=MapControlsMode.Chat, onToggleView={})`
**WHEN** Composable composes
**THEN** Compose tree contains exactly one chip with MapOutlined glyph and contentDescription = 'Back to map'; zoom cluster, recenter, layers, save are NOT in the tree
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.chat_mode_collapses_to_single_map_toggle'`

### AC-5 — Handler taps invoke their nullable lambdas exactly once

**GIVEN** `LSMapControls` with all 6 handlers wrapped in counters
**WHEN** Test taps zoom-in, zoom-out, recenter, layers, save, mode-toggle in sequence
**THEN** Each counter increments exactly once; null handlers omit the chip entirely (no orphan empty containers); tap on omitted chip impossible
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.handler_taps_invoke_lambdas_once'`

### AC-6 — Theme toggle re-resolves chip surfaces + signal copper without remount

**GIVEN** `LSMapControls` in light theme with `isSavedRoute=true`
**WHEN** `LocalLaneShadowTheme` switches to dark via `LaneShadowThemeBridge`
**THEN** Chip surface re-resolves to dark surface-overlay; saved chip's copper signal-default tint identical brand color across themes; composable instance identity stable (no `key()` reset)
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.theme_toggle_reresolves_without_remount'`

### AC-7 — Sandbox catalog registers 8 canonical map-controls stories

**GIVEN** `AppStories.all` assembled at debug build time
**WHEN** Filtered for ids matching `organisms.mapcontrols.*`
**THEN** Result contains exactly 8 entries with canonical IDs `organisms.mapcontrols.{map-no-route|map-with-route|map-saved|chat-mode}.{light|dark}`; each `Story.tier = ComponentTier.Organism` and `component = 'LSMapControls'`
**Verify:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest.map_controls_registers_eight_canonical_stories'`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Map-no-route tree: 4 chip groups (zoom-cluster + 3 chips), no save | AC-1 | happy_path |
| TC-2 | Map-with-route tree adds bookmark save chip in default styling | AC-2 | happy_path |
| TC-3 | isSavedRoute=true → copper signal-default chip + filled bookmark + 'Saved route' description | AC-3 | edge_case |
| TC-4 | Chat mode → exactly 1 chip with MapOutlined glyph + 'Back to map' description | AC-4 | happy_path |
| TC-5 | Each handler invoked exactly once on tap; null handlers omit chip | AC-5 | happy_path |
| TC-6 | Dark theme switch keeps composable identity + brand copper unchanged | AC-6 | happy_path |
| TC-7 | AppStoriesRegistryTest counts 8 ids matching `organisms.mapcontrols.*` | AC-7 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `react-native/components/map/map-controls.tsx` | 1-270 | **PRIMARY PATTERN** — production reference: handler null-check semantics, mode-toggle position rule, save chip accent state, chip dimensions |
| `android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt` | 1-150 | Closest precedent — 40dp + 8dp blur + surface-overlay + hairline border |
| `android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt` | 1-200 | Glyph rendering with stroke-md sizing; verify Glyphs catalog for needed entries |
| `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSTopBarStory.kt` | 1-90 | Story registration shape with canonical id `organisms.{component}.{variant}` |
| `.spec/design/system/organisms/map-controls/map-controls.html` | 1-445 | Visual ground truth — 40dp chip geometry, 8dp blur, mode-swap glyphs, copper saved chip recipe |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControls.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapControlsTypes.kt` (NEW — `MapControlsMode` enum + handler shape)
- `android/app/src/main/java/com/laneshadow/ui/atoms/Glyphs.kt` (MODIFY — extend catalog with any missing glyphs: Plus, Minus, CrosshairsGps, Layers, Bookmark, ChatBubbleOutline, MapOutlined)
- `android/app/src/test/java/com/laneshadow/ui/organisms/LSMapControlsTest.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/sandbox/AppStoriesRegistryTest.kt` (MODIFY — add map-controls assertion)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSMapControlsStory.kt` (NEW)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt` (MODIFY — addAll(LSMapControlsStory.all))

**Write-Prohibited:**
- `ios/**`, `server/**`, `react-native/**`, `tokens/**`
- `android/app/src/main/java/com/laneshadow/ui/idle/**` — wiring lives in CAPS-S07-T06
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` — retrofit lives in T06
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — Mapbox SDK belongs to LSMap
- `android/app/src/androidTest/**` — instrumented updates live in T08

## Design

**Token Recipe:**
- Chip size: 40.dp × 40.dp (`theme.space.s9` or `theme.sizing.touchTarget`)
- Chip radius: `theme.radius.md` (6dp)
- Chip background: `theme.colors.surfaceVariant.default` OR equivalent surface.overlay (mirror LSTopBar)
- Chip border: `theme.colors.border.default` at `theme.stroke.sm`
- Chip blur: 8.dp (RenderEffect on SDK ≥ 31, ModifierBlur fallback)
- Chip shadow: `theme.elevation.light.level3` / dark equivalent
- Icon color: `theme.content.primary`; stroke 1.5dp; size `theme.icon.md` (18dp)
- Saved chip: background + border = `theme.colors.signal.default`; icon = `theme.colors.onSignal.default` (fill=currentColor, stroke=none)
- Zoom cluster divider: `theme.colors.border.default` at `theme.stroke.sm` with horizontal margin `theme.space.md` (12dp)
- Stack gap: `theme.space.s2` (4.dp); alignment: `Alignment.End`

**Pattern:** `LSTopBar.kt` chip recipe — extract to atoms as `MapControlChip` if Rule of 2 met during implementation; otherwise replicate inline and flag for follow-up DRY task.

**Pattern Source:** Sprint 05 LSTopBar — same visual language

**Anti-Pattern:** Hex literals; embedding MapView/Mapbox SDK; Material 3 FilledIconButton without theme overrides; hardcoded 40.dp / 4.dp / 8.dp; placeholder in save slot when `hasRouteToSave=false`

**Compose Considerations:** Handlers nullable; chip rendering conditional via `if (handler != null) MapControlChip(...)` — no orphan empty Boxes. Mode-toggle ALWAYS bottom in both modes. Pressable feedback uses `theme.colors.surface.card` on press.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_no_route_renders_four_chip_groups'` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_with_route_renders_save_chip'` |
| AC-3 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.saved_route_paints_chip_copper'` |
| AC-4 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.chat_mode_collapses_to_single_map_toggle'` |
| AC-5 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.handler_taps_invoke_lambdas_once'` |
| AC-6 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.theme_toggle_reresolves_without_remount'` |
| AC-7 | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest.map_controls_registers_eight_canonical_stories'` |
| build | `./gradlew :app:assembleDebug` |
| compile | `./gradlew :app:compileDebugKotlin` |
| lint | `./gradlew detekt` |
| tokens | `scripts/tokens/enforce-native-compliance.sh` |
| scope | `git diff --name-only` ⊆ writeAllowed |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Pure Compose organism with Mapbox handler wiring + theme-driven chip aesthetic + sandbox story registration. Ports directly from React Native production reference and iOS T03 twin.

## Coding Standards

- `RULES.md` §Cross-Platform Component Parity — story IDs match canonical lowercase.dot-separated.kebab-case spec; iOS T03 uses identical IDs
- `RULES.md` §Accessibility Standards (Android) — every chip has `Modifier.semantics { contentDescription = ... }`; touch target ≥ 48dp via hitSlop
- `RULES.md` §Verification Standards — exact gradle commands above
- `brain/docs/mobile-architecture/android-principles.md` — UDF stateless composable; nullable handlers as Compose idiom

## Dependencies

**Depends on:** _(none)_
**Blocks:** CAPS-S07-T06 (idle retrofit consumes LSMapControls)
**Parallel:** CAPS-S07-T03 (iOS twin), CAPS-S07-T02 (Android capsule)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN map mode no route handlers WHEN composed THEN zoom-cluster + recenter + layers + toggle, no save","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_no_route_renders_four_chip_groups'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN hasRouteToSave=true WHEN composed THEN save chip in default styling","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_with_route_renders_save_chip'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN isSavedRoute=true WHEN composed THEN copper signal chip + filled bookmark","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.saved_route_paints_chip_copper'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN chat mode WHEN composed THEN single map-toggle chip","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.chat_mode_collapses_to_single_map_toggle'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN handler counters WHEN tapped THEN each invoked exactly once","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.handler_taps_invoke_lambdas_once'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN light then dark theme WHEN switching THEN tokens re-resolve no remount","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.theme_toggle_reresolves_without_remount'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"AppStories.all contains 8 map-controls stories","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest.map_controls_registers_eight_canonical_stories'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Map-no-route 4 chip groups","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_no_route_renders_four_chip_groups'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Save chip default styling","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.map_mode_with_route_renders_save_chip'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Copper signal save chip","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.saved_route_paints_chip_copper'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Chat mode single chip","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.chat_mode_collapses_to_single_map_toggle'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Handler invocation counts","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.handler_taps_invoke_lambdas_once'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Theme switch composable identity","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapControlsTest.theme_toggle_reresolves_without_remount'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"8 map-controls IDs","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.sandbox.AppStoriesRegistryTest.map_controls_registers_eight_canonical_stories'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
