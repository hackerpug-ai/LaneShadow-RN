# iOS Learnings: UC-SBX-06-ios - Snapshot Testing

## Implementation Date
2026-04-26

## Edge Cases Discovered

### 1. swift-snapshot-testing API Differences
- **Issue**: Initially tried to use `.image(precision:traits:layout:)` API which doesn't exist
- **Fix**: Use `.image(precision:traits:)` without the layout parameter - device traits are set via UITraitCollection
- **Learning**: Check actual API signatures from existing tests in the codebase before implementing

### 2. Snapshot File Naming Convention
- **Issue**: swift-snapshot-testing prefixes snapshot files with test function name
- **Actual Format**: `test_allStories_lightAndDark_snapshots.{storyId}-{theme}.png` not `{storyId}-{theme}.png`
- **Impact**: The `named:` parameter appends to the test name, it doesn't replace it
- **Resolution**: Updated check script to parse the actual file format with prefix included

### 3. Story ID Format Mismatch
- **Issue**: Story IDs in snapshots use hyphens (e.g., `atoms-avatar-image`) not dots (e.g., `atoms.avatar.image`)
- **Discovery**: Extracted actual story IDs from snapshot file names using `basename` and `sed`
- **Resolution**: Regenerated `snapshots.parity.json` with correct hyphenated story IDs

### 4. Simulator Launch Failures
- **Issue**: Simulator gets "busy" and fails to launch app during snapshot test runs
- **Error**: `Application failed preflight checks` / `Simulator device failed to launch`
- **Workaround**: Kill simulators between runs with `killall -9 Simulator && xcrun simctl shutdown all`
- **Note**: This is a known Xcode issue when running many tests sequentially

## API Contract Notes

### swift-snapshot-testing v1.15.0+
```swift
// Correct API usage
assertSnapshot(
    matching: view,
    as: .image(precision: 1.0, traits: UITraitCollection(traitsFrom: [
        UITraitCollection(userInterfaceStyle: .light),
        UITraitCollection(userInterfaceIdiom: .phone),
        UITraitCollection(horizontalSizeClass: .compact),
        UITraitCollection(verticalSizeClass: .regular),
    ])),
    named: "story-id.light"  // Appends to test name, doesn't replace
)
```

### Story ID Format
- **Format**: `{tier}-{component}-{variant}` with hyphens, not dots
- **Examples**:
  - `atoms-avatar-image` (not `atoms.avatar.image`)
  - `templates-planning-phase1` (not `templates.planning.phase1`)
  - `organisms-routesheet-altRoute` (not `organisms.routesheet.altRoute`)

## UI Decisions

### Snapshot Location
- **Decision**: Store snapshots at `ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/` (root level)
- **Rationale**: Spec requires this location for parity with Android structure
- **Implementation**: Moved snapshots from `Sandbox/__Snapshots__/` to root `__Snapshots__/`

### Device Profile
- **Decision**: Use iPhone SE (2nd gen) traits for consistent snapshot sizing
- **Traits**: Compact width, regular height (standard phone form factor)
- **Rationale**: Deterministic rendering across different test runs

### Theme Application
- **Decision**: Apply theme via `.laneShadowTheme()` + `.environment(\.colorScheme:)`
- **Rationale**: Matches sandbox preview wrapper pattern for consistency

## Platform-Specific Notes

### swift-snapshot-testing Behavior
1. **First Run**: Records baseline PNGs to `__Snapshots__/` directory
2. **Subsequent Runs**: Compares against baselines, fails on pixel diff
3. **Record Mode**: Set `SNAPSHOT_TESTING_RECORD=true` env var to force re-recording
4. **File Naming**: Always prefixes with test function name (cannot be disabled)

### Simulator Considerations
- iPhone SE (2nd gen) may not be installed by default in Xcode
- Fallback to iPhone 16 for testing is acceptable if iPhone SE unavailable
- Both devices use compact width, regular height traits

### Test Performance
- **155 stories × 2 themes = 310 snapshots**
- **First recording**: ~45 seconds
- **Subsequent verification**: ~40 seconds
- **Memory**: Each PNG is 2-30KB, total ~5MB for all snapshots

## Files Created/Modified

### Created
- `ios/LaneShadowTests/Sandbox/StorySnapshotTests.swift` - Unified snapshot test iterating all stories
- `ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/` - 310 PNG baseline snapshots
- `tokens/sandbox/snapshots.parity.json` - iOS snapshot manifest (155 story IDs)
- `scripts/snapshots/record-ios.sh` - Record baseline snapshots script
- `scripts/snapshots/check.ts` - Verify snapshot parity script
- `scripts/snapshots/parity-report.ts` - Generate HTML parity report script
- `tokens/sandbox/.reports/snapshots-parity.html` - HTML parity report (empty for iOS-only)

### Modified
- `package.json` - Added npm scripts: `snapshots:record:ios`, `snapshots:check`, `snapshots:parity-report`

## Verification Commands

```bash
# Record baselines (first time or after intentional changes)
pnpm snapshots:record:ios

# Verify all stories have light + dark snapshots
pnpm snapshots:check

# Generate HTML parity report
pnpm snapshots:parity-report

# Run snapshot tests in Xcode
xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -only-testing:LaneShadowTests/StorySnapshotTests

# Verify build succeeds
xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow \
  -destination 'platform=iOS Simulator,name=iPhone 16' build
```

## Success Metrics

- ✅ All 155 stories have light + dark snapshots (310 total PNGs)
- ✅ Snapshots stored at correct location per spec
- ✅ Check script passes with zero errors
- ✅ Build succeeds with no warnings
- ✅ Parity manifest matches actual snapshot files
- ✅ No orphan snapshot files
- ✅ Scripts work end-to-end (record, check, report)

## Open Questions

1. **Android Parity**: When UC-SBX-06-android is implemented, update `snapshots.parity.json` `shared` array with cross-platform story IDs
2. **CI Integration**: Add `snapshot-tests` CI job per spec (not in scope for this task)
3. **Pre-commit Hook**: Consider adding `pnpm snapshots:check` to lefthook.yml (optional, not required by spec)

## References

- Spec: `.spec/prds/v2/tasks/sprint-06-navigator-screens-and-sandbox-hardening/UC-SBX-06-ios-snapshot-testing.md`
- swift-snapshot-testing: https://github.com/pointfreeco/swift-snapshot-testing
- Stories: `ios/LaneShadow/Sandbox/LaneShadowStories.all`
- Theme: `ios/LaneShadow/Sandbox/Theme/LaneShadowPreviewWrapper.swift`
