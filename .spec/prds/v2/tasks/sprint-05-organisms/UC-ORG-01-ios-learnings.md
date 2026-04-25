# iOS Learnings: UC-ORG-01 — LSTopBar + LSNavBar Organisms

## Implementation Date
2026-04-24

## Edge Cases Discovered

### 1. Missing LSToolbar in project.yml
**Issue**: LSToolbar.swift and LSToolbarStory.swift were not registered in project.yml, causing "cannot find type" errors when LSNavBar tried to compose LSToolbarLeading/LSToolbarTrailing.

**Resolution**: Added both files to project.yml:
- `LaneShadow/Views/Molecules/LSToolbar.swift`
- `LaneShadow/Sandbox/Stories/Molecules/LSToolbarStory.swift`
- `LaneShadowTests/Molecules/LSToolbarTests.swift`

**Learning**: Always check if dependencies are registered in project.yml before composing them. syncedFolder works for Atoms but Molecules need explicit registration.

### 2. Missing story files referenced in MoleculesStories.swift
**Issue**: MoleculesStories.swift referenced story files that don't exist yet (LSContentCardStory, LSListRowStory, etc.), causing build failures.

**Resolution**: Temporarily commented out missing story references in MoleculesStories.swift using a closure-based approach to avoid array concatenation syntax errors.

**Learning**: Sprint 05 is building on top of incomplete Sprint 04 work. Some molecule stories are still pending. Use closure-based array building to make conditional story inclusion easier.

### 3. LaneShadowTheme.color namespace structure
**Issue**: Initially tried to access recording color as `Tokens.color.status.recording` but the correct path is `LaneShadowTheme.color.status.recording`.

**Resolution**: Checked Generated/Tokens.swift to find the correct namespace. The enum is nested under `LaneShadowTheme.color.status.recording`.

**Learning**: Always verify the exact namespace path in generated token files. The Tokens enum is under LaneShadowTheme, not a top-level Tokens module.

## API Contract Notes

### LSGlassPanel(.chrome) usage
- **Variant**: `.chrome` provides glass surface with ultraThinMaterial
- **Elevation**: Uses theme.elevation.level8 (not level1 as initially assumed from spec)
- **Corner radius**: Uses theme.radius.xl (not theme.radius.md)
- **Pattern**: All chrome chips MUST use LSGlassPanel(.chrome) — no raw Rectangle backgrounds

### LSIcon glyph availability
- `.menu` — 18pt hamburger icon (3 horizontal lines)
- `.plus` — 14pt plus icon for NEW chip
- `.chevL` — back chevron for LSNavBar
- `.close` — close X icon for LSNavBar

### Typography token paths
- `typography.ui.title.md` — 14px 600 -0.005em for TopBar/NavBar titles
- `typography.ui.label.md` — 9.5px 600 0.12em uppercase for NEW/REC labels

### LSToolbar composition pattern
- **Leading slot**: `.none` or `.back(action:)`
- **Trailing slot**: `.none`, `.action(icon:action:)`, or `.actions([LSToolbarAction])`
- **Title**: Always required String
- **Pattern**: LSNavBar is a thin wrapper — no custom chrome, just passes through to LSToolbar

## UI Decisions

### 40pt chip size
**Decision**: Hardcoded chipSize = 40 (not from theme tokens)
**Rationale**: Spec calls out 40×40pt explicitly for hamburger target. Theme spacing tokens don't have a 40pt value (xs=4, sm=8, md=12, lg=16, xl=24, xxl=32, xxxl=48).

### Recording dot size
**Decision**: Hardcoded recordingDotSize = 6
**Rationale**: Spec specifies 6px diameter for recording indicator dot. Not a token value.

### Safe area handling
**Decision**: Use `.safeAreaInset(edge: .top, spacing: 0) { Color.clear.frame(height: 0) }` pattern
**Rationale**: This pushes content down by the status bar height while allowing the bar to float at top. Alternative was `.padding(.top)` but safeAreaInset is more semantic.

### Title centering with Spacer
**Decision**: Use `Spacer() + title + Spacer()` when title present, single `Spacer()` when absent
**Rationale**: Keeps chips anchored to edges regardless of title presence. Absolute positioning would break dynamic title widths.

## Platform-Specific Notes

### SwiftUI @Observable not needed
**Decision**: Organisms are data-agnostic views — no @Observable ViewModels required
**Rationale**: These are pure presentational components. State management is owned by parent screens (Navigator, modals).

### Canvas-based LSIcon
**Pattern**: LSIcon uses Canvas API for stroke-based icon rendering
**Benefit**: Consistent stroke widths across all icon sizes, no SF Symbol dependencies
**Tradeoff**: More complex than Image(systemName:) but gives design system control

### GlassPanel material
**Pattern**: LSGlassPanel(.chrome) uses `.ultraThinMaterial` + surface fill
**Benefit**: Native iOS blur behavior with semantic color overlay
**Note**: Spec mentions blur(8px) but ultraThinMaterial is the iOS semantic equivalent

## Files Created/Modified

### Created (Organisms)
- `ios/LaneShadow/Views/Organisms/LSTopBar.swift` — Top chrome organism with hamburger + title + trailing slots
- `ios/LaneShadow/Views/Organisms/LSNavBar.swift` — Modal toolbar organism (LSToolbar wrapper)

### Created (Tests)
- `ios/LaneShadowTests/Organisms/LSTopBarTests.swift` — 5 tests covering all ACs
- `ios/LaneShadowTests/Organisms/LSNavBarTests.swift` — 1 test for molecule composition

### Created (Stories)
- `ios/LaneShadow/Sandbox/Stories/Organisms/LSTopBarStory.swift` — 4 stories (Default, With Title, Hamburger Only, Record Highlight)
- `ios/LaneShadow/Sandbox/Stories/Organisms/LSNavBarStory.swift` — 1 story (Default)
- `ios/LaneShadow/Sandbox/Stories/Organisms/OrganismStories.swift` — Registry for all organism stories

### Modified (Project)
- `ios/project.yml` — Added Organisms syncedFolder, LSToolbar files, organism story files
- `ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift` — Commented out missing story references
- `ios/LaneShadow/Sandbox/LaneShadowStories.swift` — Added OrganismStories.all to story list

## Android Learnings Applied
None — UC-ORG-01-android is parallel work, no learnings file existed yet.

## Verification Gates Passed
- ✅ swiftformat --lint exits 0 (all organism + test files)
- ✅ xcodebuild build BUILD SUCCEEDED
- ✅ grep -n 'Font.system|Color(hex:|Color(red:|\.monospenced(' returns 0 lines (AC-6)
- ✅ All 5 LSTopBar tests compile
- ✅ LSNavBar test compiles
- ✅ Stories registered in OrganismStories.all
- ✅ LSGlassPanel(.chrome) used for all chips (no Rectangle backgrounds)
- ✅ LSIcon(.menu), LSIcon(.plus) used (no SF Symbol literals)
- ✅ LSText(typography.ui.*) used for all labels (no Font.system)

## Open Questions
1. Should chipSize (40pt) become a theme token? Currently hardcoded.
2. Should recordingDotSize (6pt) become a theme token? Currently hardcoded.
3. Missing molecule stories (LSContentCardStory, LSListRowStory, etc.) — when will these be implemented?

## Next Steps
- UC-ORG-02-ios: MapLayer organism (next in Sprint 05)
- UC-ORG-03-ios: Navigator message/error callout organism
- UC-ORG-04-ios: Route sheet organism
- UC-ORG-05-ios: Sessions drawer organism
- UC-ORG-06-ios: Route card organism
- UC-ORG-07-ios: Section header organism
