# iOS Learnings: UC-ORG-06 — LSRouteCard

## Implementation Date
2026-04-24

## Edge Cases Discovered

1. **Instrument Typography Not Implemented**: The design spec calls for `typography.instrument.sm` (monospace JetBrains Mono) for distance/time displays, but this typography category doesn't exist in the current token system. Used `typography.body.sm` as a reasonable substitute. This is a token gap that should be addressed in a future sprint.

2. **Missing Surface Color Tokens**: Initially tried to use `LSSurfaceColorToken.inset` which doesn't exist. The correct token is `LSSurfaceColorToken.card` for card backgrounds and `LSSurfaceColorToken.primary` for primary surfaces.

3. **Status Color Token Structure**: The danger color is accessed via `theme.colors.danger.default`, not `LaneShadowTheme.color.status.danger.default`. The status colors (warning, recording, success, info) are under `LaneShadowTheme.color.status.*`, but danger is a top-level color.

4. **XcodeGen syncedFolder Behavior**: Files in `syncedFolder` directories are not immediately added to `project.pbxproj` by XcodeGen. Xcode 16 auto-discovers these files when the project is opened in Xcode IDE. The build succeeds because the compiler finds the files, but they won't appear in `grep` of `project.pbxproj` until Xcode IDE syncs them.

## API Contract Notes

The `LSRouteCard.Route` data model mirrors the Convex `routes` read type from `convex/schema.ts`:

- `id: String` — route identifier
- `title: String` — route name (e.g., "The Skyline Spine")
- `distance: Int` — distance in meters (converted to miles for display)
- `duration: Int` — estimated time in seconds (converted to Xh Ym format)
- `polyline: [LatLng]` — encoded polyline decoded to coordinate array
- `variant: RouteVariant` — `.best`, `.alt1`, or `.alt2`
- `difficulty: Difficulty?` — optional `.easy`, `.moderate`, or `.advanced`
- `isSaved: Bool` — saved state for heart icon display

## UI Decisions

- **Map Preview Height**: Fixed at 160pt per design spec, using `theme.radius.md` for corner radius
- **Title Truncation**: Single line with `.lineLimit(1)` to prevent overflow
- **Distance/Time Format**: Used String format with `"%.0f mi"` for distance and conditional `"%dh %dm"` / `"%dm"` for time
- **Fallback State**: When polyline is empty, shows placeholder with map icon and "Map preview" text
- **Difficulty Colors**: Mapped to route variant colors (easy=alt1 sage, moderate=warning amber, advanced=danger red)

## Platform-Specific Notes

1. **LSMap Atom Contract**: Successfully consumed the multi-polyline contract from UC-ATM-12. The `cameraFit: .polyline(padding: .spacing3)` automatically frames the route with 12pt padding.

2. **Annotation Auto-Generation**: Start/end annotations are automatically generated from the first and last polyline coordinates. This prevents crashes when polylines are empty.

3. **LSPill vs LSTagPill**: Used `LSPill` for difficulty tags as it's the lower-level primitive. `LSTagPill` (if it exists) would be a higher-level composition.

4. **SwiftFormat Configuration**: The project requires trailing commas in array declarations. The formatted code adds trailing commas to maintain consistency with the `.swiftformat` config.

## Files Created/Modified

### Created
- `ios/LaneShadow/Views/Organisms/LSRouteCard.swift` (266 lines) — Main organism implementation
- `ios/LaneShadowTests/Organisms/LSRouteCardTests.swift` (178 lines) — TDD test suite
- `ios/LaneShadow/Sandbox/Stories/Organisms/LSRouteCardStory.swift` (155 lines) — Six story variants

### Modified
- `ios/LaneShadow/Sandbox/Stories/Organisms/OrganismStories.swift` — Added `LSRouteCardStory.all` to organism story list

## Test Coverage

All 7 acceptance criteria verified:
- AC-1: Default best-variant full composition ✓
- AC-2: Alt variant resolves color.route.alt1 ✓
- AC-3: Saved shows heartFill accent ✓
- AC-4: Route prop mirrors Convex schema ✓
- AC-5: No data-layer imports (grep gate) ✓
- AC-6: Six stories registered ✓
- AC-7: Atom-composition gate (no banned primitives) ✓

## Quality Gates Passed

- `swiftformat --lint` ✓
- `xcodebuild test` ✓
- `xcodebuild build` ✓
- Grep gates (AC-5, AC-7) ✓

## TDD Evidence

| AC | Test Function | RED Evidence | GREEN Evidence |
|----|---------------|--------------|----------------|
| AC-1 | test_default_best_variant_full_composition | Cannot find 'LSRouteCard' in scope | TEST SUCCEEDED |
| AC-2 | test_alt_variant_resolves_color_route_alt1 | Cannot find 'LSRouteCard' in scope | TEST SUCCEEDED |
| AC-3 | test_saved_state_shows_heartfill_accent | Cannot find 'LSRouteCard' in scope | TEST SUCCEEDED |
| AC-4 | test_route_prop_mirrors_convex_routes_schema | Cannot find 'LSRouteCard' in scope | TEST SUCCEEDED |
| AC-5 | (grep gate) | N/A | 0 occurrences of banned imports |
| AC-6 | test_route_card_stories_registered | 0 RouteCard stories | 6 stories registered |
| AC-7 | (grep gate) | N/A | 0 occurrences of banned primitives |

## Visual Verification

Stories registered:
- `organisms.routecard.default` — Best variant with moderate difficulty
- `organisms.routecard.saved` — Shows heartFill icon
- `organisms.routecard.alt1` — Alt variant with sage-green polyline
- `organisms.routecard.longTitle` — Title truncation test
- `organisms.routecard.missingData` — Fallback placeholder
- `organisms.routecard.darkMode` — Dark mode rendering

All stories render successfully in the sandbox with proper token resolution.
