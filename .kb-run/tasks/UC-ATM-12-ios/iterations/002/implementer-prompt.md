Implementer retry for `UC-ATM-12-ios`. The previous pass was interrupted because it kept exploring the repo without entering RED/GREEN. This retry is intentionally constrained.

Do this now:
1. Read only these source files unless you discover a concrete compile error that forces one more read:
   - `ios/LaneShadow/Views/Atoms/LSMap.swift`
   - `ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift`
   - `ios/LaneShadow/Sandbox/Stories/LSMapStories.swift`
   - `ios/LaneShadowTests/Atoms/LSMapTests.swift`
   - `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift` (map/style, route, status, spacing, sizing only)
2. Do not perform repo-wide searches, architecture-doc hunts, or broad pattern surveys. You already have enough context.
3. Replace the shallow LSMap tests with targeted RED tests for the reopened gaps, then implement the minimal production changes to pass them.
4. Stay inside the task write scope. Do not edit `.kb-run/state.json` or any `.kb-run` scheduler files.
5. Write evidence files to these absolute paths:
   - `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-12-ios/iterations/002/evidence.md`
   - `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-12-ios/iterations/002/evidence-manifest.json`
6. Final response must satisfy `.kb-run/implementer-completion.schema.json` with `task_id = UC-ATM-12-ios`.

Focus strictly on these reopened gaps:
- Use `LaneShadowTheme.map.style.light` / `.dark` instead of the hardcoded style URI.
- Make `updateUIView` actually react to theme, polyline, annotation, camera-fit, and gesture/scroll-isolation changes without recreating `MapView`.
- Render polylines with route token colors and stroke sizing token.
- Render annotations with status token colors.
- Implement `CameraFit.polylines` union-bounds behavior with spacing padding.
- Add scroll isolation behavior for the embedded map.
- Keep the public LSMap API free of Mapbox SDK types and keep missing-token fallback behavior intact.

Required validation before you finish:
- `swiftformat --lint ios/LaneShadow/Views/Atoms/LSMap*.swift ios/LaneShadowTests/Atoms/LSMapTests.swift ios/LaneShadow/Sandbox/Stories/LSMapStories.swift`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapTests`
If full-scope validation is blocked by an environment issue, document the exact command and failure in the completion JSON.

Normalized requirements:
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

Use the existing partial implementation as your base and start editing now.
