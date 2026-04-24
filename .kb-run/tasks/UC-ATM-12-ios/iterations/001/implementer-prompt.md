You are the implementer for kb-run execution unit `UC-ATM-12-ios` in an isolated worktree.

Rules:
- Do not edit `.kb-run/state.json` or any `.kb-run` scheduler state files.
- Work only inside the allowed write scope from the task file.
- Follow RED -> GREEN -> REFACTOR against the reopened acceptance gaps.
- Use the existing partial LSMap implementation on this branch as the remediation starting point; do not restart from scratch unless required.
- Preserve unrelated user changes and do not revert anything outside your scope.
- Write these evidence artifacts to the canonical run directory in the main repo, using absolute paths:
  - `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-12-ios/iterations/001/evidence.md`
  - `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-12-ios/iterations/001/evidence-manifest.json`
- Your final response must satisfy `.kb-run/implementer-completion.schema.json`.
- Set `task_id` to `UC-ATM-12-ios` in the final JSON and point `evidence_path` / `evidence_manifest_path` at the absolute paths above.

Execution context:
- Sprint: `sprint-03-design-system-alignment`
- Start commit: `f94e4711210c77e2449aad98b5b4660d69e9b623`
- Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-ATM-12-ios`
- Runtime commands:
  - `swiftformat --lint ios/LaneShadow/`
  - `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
  - `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`

Normalized requirements to track:
- AC-1: Mapbox SPM added [PRIMARY]
- AC-2: Preview mode with Copper Light, gestures disabled
- AC-3: Theme toggle reloads in-place
- AC-4: Multi-polyline rendering
- AC-5: Annotations with status colors
- AC-6: CameraFit.polylines union bounds
- AC-7: Missing token → fallback, no crash
- AC-8: Scroll isolation inside ScrollView
- AC-9: Nine sandbox stories compile
- TC-1: MapboxMaps/mapbox-maps-ios appears in ios/project.yml packages section
- TC-2: xcodebuild build exits BUILD SUCCEEDED after Mapbox SPM added
- TC-3: test_preview_mode_disables_gestures passes
- TC-4: test_theme_change_reloads_style_without_unmounting passes
- TC-5: test_three_polylines_render_with_variant_colors passes
- TC-6: test_annotations_render_with_status_colors passes
- TC-7: test_camera_fit_polylines_frames_union_bounds passes
- TC-8: test_missing_token_renders_error_fallback_without_crash passes
- TC-9: test_scroll_isolation_does_not_hijack_outer_scroll passes
- TC-10: No literal Mapbox access token (pk. prefix) in staged files
- TC-11: Full xcodebuild test exits TEST SUCCEEDED with all LSMapTests passing

Reopen findings to fix:
- `LSMapUIViewRepresentable.updateUIView` is effectively a no-op.
- Style URI is hardcoded instead of using `LaneShadowTheme.map.style.light` and `.dark`.
- Polyline rendering, annotation rendering, camera fit, and scroll isolation are still unimplemented.
- `LSMapTests.swift` only covers data-shape initialization and enums.
- Sandbox stories compile, but the real map behavior is incomplete.

Task file follows below. Read it fully and execute against it.

--- TASK FILE START ---
<!-- Template Version: 5.1.0 | Sprint: sprint-03-design-system-alignment | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ATM-12-ios — LSMap iOS Implementation on the Copper Theme
================================================================================

TASK_TYPE:  FEATURE
STATUS:     🔄 NEEDS_REMEDIATION
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   360 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   05-uc-atm.md (UC-ATM-12)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1, AC-7 complete · 2/9 complete · reopened 2026-04-24 after red-hat review

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSMap iOS renders production Mapbox maps on the Copper theme with Copper Studio styles, multi-polyline route variants, typed annotations, camera auto-fit, scroll isolation, and graceful fallback — zero SDK types in public signature, zero literal access token committed.

--------------------------------------------------------------------------------
REOPEN NOTES — 2026-04-24
--------------------------------------------------------------------------------

Red-hat review re-opened this task because the current implementation is only partially wired:

- `LSMapUIViewRepresentable.updateUIView` is effectively a no-op, so theme-toggle reload, polyline updates, annotation updates, and scroll-isolation behavior are still missing.
- The style URI is hardcoded instead of loading from `LaneShadowTheme.map.style.light` / `.dark`.
- Polyline rendering, annotation rendering, and `CameraFit.polylines` are still marked or left as follow-up behavior in code.
- The current `LSMapTests.swift` only covers data-shape initialization and enums; it does not prove the UC-ATM-12 behavioral acceptance criteria.
- Sprint 03 cannot claim LSMap parity until AC-2 through AC-6 and AC-8 are implemented and AC-9 is revalidated against the real map implementation.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST add Mapbox Maps SDK as SPM dependency in ios/project.yml and regenerate via scripts/ios/generate-project.sh (never hand-edit .pbxproj).
- MUST never commit a literal MAPBOX_ACCESS_TOKEN — loaded at build time via xcconfig into Info.plist MBXAccessToken.
- MUST preserve MapView instance across theme toggle — call mapView.mapboxMap.loadStyle() on existing instance in updateUIView.
- MUST consume the Sprint 03 Copper theme surface and must not delete legacy-theme infrastructure in this sprint.
- NEVER import MapboxMaps in public LSMap SwiftUI struct signature — only in LSMapUIViewRepresentable.swift internal file.
- NEVER use force-unwrap or fatalError on missing token — missing token renders LSGlassPanel fallback.
- STRICTLY: swiftformat --lint passes; xcodebuild test exits TEST SUCCEEDED; no .foregroundColor deprecations in new files.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] AC-1: Mapbox SPM dependency added; project regenerated (PRIMARY)
- [ ] AC-2: Preview mode loads Copper Light, gestures disabled — FAIL: LSMap style loads via hardcoded URI and does not reference `LaneShadowTheme.map.style.light` (ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift:85)
- [ ] AC-3: Theme toggle reloads style without unmounting MapView — FAIL: `updateUIView` is effectively a no-op; no in-place style reload on theme change (ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift:46)
- [ ] AC-4: Three polylines render with per-variant colors + token stroke width — FAIL: polyline rendering is not implemented (ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift:9)
- [ ] AC-5: Annotations render as Mapbox circles with color.status fills — FAIL: annotation rendering is not implemented (ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift:9)
- [ ] AC-6: CameraFit.polylines frames union bounds with spacing padding — FAIL: camera fitting is explicitly unimplemented (ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift:75)
- [x] AC-7: Missing token renders LSGlassPanel fallback, no crash
- [ ] AC-8: Scroll isolation inside SwiftUI ScrollView — FAIL: no scroll isolation behavior implemented or tested (ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift:46)
- [ ] AC-9: All 9 sandbox stories compile — PARTIAL: stories exist, but the implementation remains incomplete/stubbed (ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift:9)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Mapbox SPM added [PRIMARY]
  GIVEN: ios/project.yml has no MapboxMaps entry
  WHEN:  MapboxMaps SPM package added to ios/project.yml pinned to a minor version; scripts/ios/generate-project.sh runs
  THEN:  xcodebuild build -scheme LaneShadow exits BUILD SUCCEEDED; grep finds MapboxMaps in ios/project.yml
  VERIFY: grep 'MapboxMaps\|mapbox-maps-ios' ios/project.yml && cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Atoms/LSMapTests.swift
  TEST_FUNCTION: (build-time verification)

AC-2: Preview mode with Copper Light, gestures disabled
  GIVEN: MAPBOX_ACCESS_TOKEN is set and Info.plist has MBXAccessToken
  WHEN:  LSMap(mode: .preview, camera: CameraPosition(center: LatLng(lat: 37.7749, lon: -122.4194), zoom: 11)) renders
  THEN:  Mapbox MapView appears via UIViewRepresentable; Copper Light style URL from LaneShadowTheme.map.style.light loaded; all gesture recognizers disabled
  VERIFY: cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_preview_mode_disables_gestures 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Atoms/LSMapTests.swift
  TEST_FUNCTION: test_preview_mode_disables_gestures

AC-3: Theme toggle reloads in-place
  GIVEN: LSMap rendered with mode: .interactive and sandbox theme toggle available
  WHEN:  theme toggles to dark
  THEN:  Coordinator calls mapView.mapboxMap.loadStyle(LaneShadowTheme.map.style.dark) on existing MapView in updateUIView; MapView identity unchanged
  VERIFY: xcodebuild test ... -only-testing:LaneShadowTests/LSMapTests/test_theme_change_reloads_style_without_unmounting | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Atoms/LSMapTests.swift
  TEST_FUNCTION: test_theme_change_reloads_style_without_unmounting

AC-4: Multi-polyline rendering
  GIVEN: polylines: [PolylineData(variant: .best), .alt1, .alt2]
  WHEN:  map renders
  THEN:  Three distinct LineLayer objects on map style; best lineColor = route.best; alt1 = route.alt1; alt2 = route.alt2; lineWidth = sizing.stroke.md
  VERIFY: xcodebuild test ... -only-testing:LaneShadowTests/LSMapTests/test_three_polylines_render_with_variant_colors | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Atoms/LSMapTests.swift
  TEST_FUNCTION: test_three_polylines_render_with_variant_colors

AC-5: Annotations with status colors
  GIVEN: annotations with kinds .start, .end, .waypoint
  WHEN:  annotations added to map
  THEN:  .start fill = status.success; .end = status.recording; .waypoint = status.info; each rendered as CircleAnnotation
  VERIFY: xcodebuild test ... -only-testing:LaneShadowTests/LSMapTests/test_annotations_render_with_status_colors | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Atoms/LSMapTests.swift
  TEST_FUNCTION: test_annotations_render_with_status_colors

AC-6: CameraFit.polylines union bounds
  GIVEN: cameraFit: .polylines(padding: .s4) with three polylines
  WHEN:  map renders
  THEN:  camera ease targets union bounding box with UIEdgeInsets = LaneShadowTheme.spacing.s4 (12pt) on all sides
  VERIFY: xcodebuild test ... -only-testing:LaneShadowTests/LSMapTests/test_camera_fit_polylines_frames_union_bounds | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Atoms/LSMapTests.swift
  TEST_FUNCTION: test_camera_fit_polylines_frames_union_bounds

AC-7: Missing token → fallback, no crash
  GIVEN: Info.plist MBXAccessToken empty or unexpanded placeholder
  WHEN:  LSMap attempts to initialize MapView
  THEN:  catches MapError.missingToken; renders LSGlassPanel(variant: .callout(accent: .warning)) with caption; no crash, no fatalError
  VERIFY: xcodebuild test ... -only-testing:LaneShadowTests/LSMapTests/test_missing_token_renders_error_fallback_without_crash | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Atoms/LSMapTests.swift
  TEST_FUNCTION: test_missing_token_renders_error_fallback_without_crash

AC-8: Scroll isolation inside ScrollView
  GIVEN: interactive LSMap placed inside SwiftUI ScrollView
  WHEN:  user initiates vertical drag beginning outside map bounds
  THEN:  ScrollView scrolls normally; map gestures do not consume vertical drag
  VERIFY: xcodebuild test ... -only-testing:LaneShadowTests/LSMapTests/test_scroll_isolation_does_not_hijack_outer_scroll | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Atoms/LSMapTests.swift
  TEST_FUNCTION: test_scroll_isolation_does_not_hijack_outer_scroll

AC-9: Nine sandbox stories compile
  GIVEN: LSMapStories.all from UC-ATM-11 has 9 stub story entries
  WHEN:  stubs replaced with production LSMap calls
  THEN:  Stories Preview, Interactive, With One Polyline, With Three Alt Polylines, With Start+End Markers, Auto-fit Multi-polyline, Dark Style, Error (no token), Error (no network) all compile; first 7 render real map; last 2 render fallback; xcodebuild build succeeds
  VERIFY: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadow/Sandbox/Stories/LSMapStories.swift
  TEST_FUNCTION: (compile-time verification)

--------------------------------------------------------------------------------
TEST CRITERIA (boolean)
--------------------------------------------------------------------------------

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | MapboxMaps/mapbox-maps-ios appears in ios/project.yml packages section | AC-1 | grep 'MapboxMaps\|mapbox-maps-ios' ios/project.yml |
| TC-2 | xcodebuild build exits BUILD SUCCEEDED after Mapbox SPM added | AC-1 | xcodebuild build ... \| grep 'BUILD SUCCEEDED' |
| TC-3 | test_preview_mode_disables_gestures passes | AC-2 | xcodebuild test ... -only-testing:.../test_preview_mode_disables_gestures |
| TC-4 | test_theme_change_reloads_style_without_unmounting passes | AC-3 | xcodebuild test ... -only-testing:.../test_theme_change_reloads_style_without_unmounting |
| TC-5 | test_three_polylines_render_with_variant_colors passes | AC-4 | xcodebuild test ... -only-testing:.../test_three_polylines_render_with_variant_colors |
| TC-6 | test_annotations_render_with_status_colors passes | AC-5 | xcodebuild test ... -only-testing:.../test_annotations_render_with_status_colors |
| TC-7 | test_camera_fit_polylines_frames_union_bounds passes | AC-6 | xcodebuild test ... |
| TC-8 | test_missing_token_renders_error_fallback_without_crash passes | AC-7 | xcodebuild test ... |
| TC-9 | test_scroll_isolation_does_not_hijack_outer_scroll passes | AC-8 | xcodebuild test ... |
| TC-10 | No literal Mapbox access token (pk. prefix) in staged files | AC-7 | git diff --cached --name-only \| xargs grep -l 'pk\.' 2>/dev/null \| wc -l = 0 |
| TC-11 | Full xcodebuild test exits TEST SUCCEEDED with all LSMapTests passing | AC-9 | xcodebuild test ... \| grep 'TEST SUCCEEDED' |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/project.yml (MODIFY) — add MapboxMaps SPM package
- ios/LaneShadow/Views/Atoms/LSMap.swift (MODIFY) — replace stub with production wrapper
- ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift (NEW) — MapboxMaps import lives here only
- ios/LaneShadow/Sandbox/Stories/LSMapStories.swift (MODIFY) — replace stubs with production calls
- ios/LaneShadowTests/Atoms/LSMapTests.swift (NEW) — all test functions
- ios/LaneShadow.xcodeproj/ (MODIFY via scripts/ios/generate-project.sh only)

writeProhibited:
- ios/LaneShadow.xcodeproj/project.pbxproj — global protect-xcode-project.py hook blocks
- tokens/semantic/*.json — ALIGN-02-ios scope
- .spec/design/system/atoms/map/ — read-only
- ios/LaneShadow/Views/Atoms/LSGlassPanel.swift — reuse, do not modify

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Keep all Mapbox SDK types inside LSMapUIViewRepresentable.swift
- Diff polylines by layer ID in updateUIView to avoid flicker
- Use Coordinator pattern for onTap delegation

⚠️ Ask First:
- Mapbox SDK version pin (request explicit confirmation)
- Adding any story beyond the canonical 9

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/project.yml (MODIFY): MapboxMaps SPM entry
- ios/LaneShadow/Views/Atoms/LSMap.swift (MODIFY): production wrapper
- ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/LSMapStories.swift (MODIFY): production story bodies
- ios/LaneShadowTests/Atoms/LSMapTests.swift (NEW)

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/05-uc-atm.md [PRIMARY PATTERN]
   - Lines: 249-292
   - Focus: UC-ATM-12 acceptance criteria — all 9 story names and XCTest coverage expectations

2. ios/LaneShadow/Views/Atoms/LSGlassPanel.swift
   - Lines: 1-60
   - Focus: LSGlassPanel API for error fallback rendering

3. ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift
   - Lines: 1-59
   - Focus: TDD pattern — static helper methods exposing token resolution for assertion

4. ios/project.yml
   - Lines: 1-25
   - Focus: SPM packages block — add MapboxMaps here

5. tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift
   - Lines: 284-365 (after ALIGN-02-ios)
   - Focus: LaneShadowTheme.color.route.*, .color.status.*, .sizing.stroke.*, .map.style.*

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/atoms/map/map.html, .spec/design/system/atoms/map/README.md

Interaction notes:
- REQUIRED READING: .spec/design/system/atoms/map/ before implementing
- UIViewRepresentable pattern: makeUIView creates MapView, configures gestures; updateUIView handles style URL changes + polyline/annotation diffs; Coordinator handles onTap

Pattern: UIViewRepresentable Coordinator — makeCoordinator returns a class holding MapView reference + annotation manager; updateUIView diffs polylines by layer ID (polyline-0, polyline-1, ...)
Pattern source: ios/project.yml:16-22
Anti-pattern: Do not remove and re-add all LineLayers on every updateUIView — diff current vs new and only update changed layers to prevent map style flicker.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.
RED: Write test function (xcodebuild test ... -only-testing fails initially). Confirm RED.
GREEN: Implement minimal UIViewRepresentable logic to pass the test. Run `xcodebuild test`. Confirm PASS.
REFACTOR: Extract helpers (PolylineLayerDiffer, AnnotationManager); tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No Mapbox in public API): `grep -r 'import MapboxMaps' ios/LaneShadow/Views/Atoms/LSMap.swift | wc -l` = 0.
Gate 2 (No literal token): `grep -rn 'pk\.' ios/LaneShadow/Info.plist ios/project.yml | wc -l` = 0.
Gate 3 (swiftformat): `swiftformat --lint ios/LaneShadow/Views/Atoms/LSMap*.swift` exit 0.
Gate 4 (iOS build): `xcodebuild build` BUILD SUCCEEDED.
Gate 5 (All tests): `xcodebuild test` TEST SUCCEEDED.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ATM-11 (contract + fixtures + stub), ALIGN-02-ios (Copper map/style tokens)
Blocks:     ALIGN-04-ios (sandbox story reconciliation on the new theme)
Parallel:   UC-ATM-12-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN ios/project.yml has no Mapbox WHEN MapboxMaps SPM added and project regenerated THEN xcodebuild build exits BUILD SUCCEEDED", "verify": "grep 'MapboxMaps' ios/project.yml && cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN MAPBOX_ACCESS_TOKEN set WHEN LSMap(.preview) renders THEN MapView appears with Copper Light style and gestures disabled", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_preview_mode_disables_gestures 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN theme toggle WHEN theme changes to dark THEN map loads dark style URL on existing MapView without unmounting", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_theme_change_reloads_style_without_unmounting 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN three polylines with variants best/alt1/alt2 WHEN map renders THEN three LineLayers with per-variant colors and sizing.stroke.md width", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_three_polylines_render_with_variant_colors 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN typed annotations WHEN added to map THEN CircleAnnotations with color.status.success/recording/info fills", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_annotations_render_with_status_colors 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN cameraFit: .polylines(padding: .s4) WHEN map renders THEN camera ease targets union bounding box with spacing.s4 insets", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_camera_fit_polylines_frames_union_bounds 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN missing MAPBOX_ACCESS_TOKEN WHEN LSMap initializes THEN LSGlassPanel error fallback renders, no crash", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_missing_token_renders_error_fallback_without_crash 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN interactive LSMap in ScrollView WHEN vertical drag outside map bounds THEN ScrollView scrolls normally", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_scroll_isolation_does_not_hijack_outer_scroll 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "GIVEN 9 LSMap stories WHEN all compile THEN xcodebuild build exits BUILD SUCCEEDED", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "MapboxMaps appears in ios/project.yml packages section", "maps_to_ac": "AC-1", "verify": "grep 'MapboxMaps\\|mapbox-maps-ios' ios/project.yml" },
    { "id": "TC-2", "type": "test_criterion", "description": "xcodebuild build exits BUILD SUCCEEDED after Mapbox SPM added", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" },
    { "id": "TC-3", "type": "test_criterion", "description": "test_preview_mode_disables_gestures passes", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_preview_mode_disables_gestures 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-4", "type": "test_criterion", "description": "test_theme_change_reloads_style_without_unmounting passes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_theme_change_reloads_style_without_unmounting 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-5", "type": "test_criterion", "description": "test_three_polylines_render_with_variant_colors passes", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_three_polylines_render_with_variant_colors 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-6", "type": "test_criterion", "description": "test_annotations_render_with_status_colors passes", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_annotations_render_with_status_colors 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-7", "type": "test_criterion", "description": "test_camera_fit_polylines_frames_union_bounds passes", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_camera_fit_polylines_frames_union_bounds 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-8", "type": "test_criterion", "description": "test_missing_token_renders_error_fallback_without_crash passes", "maps_to_ac": "AC-7", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_missing_token_renders_error_fallback_without_crash 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-9", "type": "test_criterion", "description": "test_scroll_isolation_does_not_hijack_outer_scroll passes", "maps_to_ac": "AC-8", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests/test_scroll_isolation_does_not_hijack_outer_scroll 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-10", "type": "test_criterion", "description": "No literal Mapbox access token (pk. prefix) in staged files", "maps_to_ac": "AC-7", "verify": "git diff --cached --name-only | xargs grep -l 'pk\\.' 2>/dev/null | wc -l | xargs -I{} test {} -eq 0" },
    { "id": "TC-11", "type": "test_criterion", "description": "Full xcodebuild test run exits TEST SUCCEEDED", "maps_to_ac": "AC-9", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'TEST SUCCEEDED'" }
  ]
}
-->

--- TASK FILE END ---

When finished, ensure the output JSON references concrete evidence for each AC/TC you actually satisfied, and clearly call out any remaining blockers.
