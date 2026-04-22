<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-04-ios — Base display atoms (`LSAvatar` + `LSDivider` + `LSSpinner`) — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     🔄 NEEDS_REMEDIATION
PRIORITY:   P0
EFFORT:     M
REVIEWED:   2026-04-22
COMMIT:     89adf155
REVIEWER:   swift-reviewer
VERDICT:    NEEDS_FIXES
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSAvatarTests
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint:      swiftformat --lint ios/LaneShadow/

PRD_REFS:   UC-ATM-04, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-04-display.html
DEPENDS_ON: UC-TOK-01, UC-TOK-02, UC-TOK-03, UC-TOK-05, UC-ATM-01-ios (LSText for initials)
BLOCKS:     UC-MOL-* (profile chips, lists, loading states), UC-ORG-*, UC-SCR-*

PROGRESS: 3 PASS · 3 FAIL · 1 PARTIAL · 7/7 AC evaluated · 🔄 REMEDIATION CYCLE 1

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Three small but ubiquitous display atoms ship on iOS: `LSAvatar` (image OR initials, sizes xs/sm/md/lg/xl from `sizing.icon.*`), `LSDivider` (1pt rule, `color.border.subtle`), `LSSpinner` (platform `UIActivityIndicator` tinted via `color.signal.default`). All visuals resolve exclusively through LaneShadowTheme tokens.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER reference `Color(...)`, hex strings, or any literal color in the three atom files. All colors MUST resolve through `LaneShadowTheme.color.*`.
- NEVER hardcode size, padding, or radius — all visuals MUST resolve through `theme.sizing.*` / `theme.spacing.*` / `theme.radius.*`.
- NEVER use `Image(systemName:)` for fallback icons inside LSAvatar — initials fallback uses LSText.
- NEVER write `#Preview { ... }` — sandbox stories ONLY.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**` or `~/Projects/native-sandbox/**`.

Note on legacy file: `ios/LaneShadow/Avatar.swift` exists today as legacy. This task DELETES it (or moves its surviving call sites onto LSAvatar). Deletion is in writeAllowed.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSAvatar` exists at `ios/LaneShadow/Views/Atoms/LSAvatar.swift` (image variant) — maps to AC-1 (PRIMARY)
- [ ] `LSAvatar` initials fallback variant resolves typography + surface tokens — maps to AC-2
- [ ] `LSDivider` exists at `ios/LaneShadow/Views/Atoms/LSDivider.swift`, 1pt `color.border.subtle` — maps to AC-3
- [ ] `LSSpinner` exists at `ios/LaneShadow/Views/Atoms/LSSpinner.swift`, tint `color.signal.default` — maps to AC-4
- [ ] Stories grouped "Atoms / Display" registered for each atom — maps to AC-5
- [ ] Legacy `ios/LaneShadow/Avatar.swift` removed and call sites migrated — maps to AC-6
- [ ] No literal Color references in any of the three atom files — maps to AC-7
- [ ] iOS typecheck/build green; XCTest green; swiftformat clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSAvatar image variant renders at sizing.icon.md by default [PRIMARY]
  GIVEN: An iOS SwiftUI view importing LaneShadowTheme
  WHEN:  Developer renders `LSAvatar(image: someUIImage)` (default size .md)
  THEN:  Frame width and height == `theme.sizing.icon.md`, image is clipped to a circle, content mode == .scaledToFill
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSAvatarTests.swift
  TEST_FUNCTION: test_image_variant_renders_at_sizing_icon_md_default
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSAvatarTests/test_image_variant_renders_at_sizing_icon_md_default

AC-2: LSAvatar initials fallback uses typography.ui.label.md on color.surface.card
  GIVEN: `LSAvatar(initials: "JR", size: .md)`
  WHEN:  Rendered (no image)
  THEN:  Background == `theme.color.surface.card`, initials rendered via LSText with variant `.ui.label.md`, foreground == `theme.color.content.primary`, clipped to circle
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSAvatarTests.swift
  TEST_FUNCTION: test_initials_fallback_uses_label_md_on_surface_card
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSAvatarTests/test_initials_fallback_uses_label_md_on_surface_card

AC-3: LSDivider renders 1pt height with color.border.subtle
  GIVEN: `LSDivider()` placed in a VStack
  WHEN:  Rendered
  THEN:  Height == 1pt, fill color == `theme.color.border.subtle`, frame stretches to parent width (maxWidth: .infinity)
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSDividerTests.swift
  TEST_FUNCTION: test_divider_renders_1pt_color_border_subtle
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSDividerTests/test_divider_renders_1pt_color_border_subtle

AC-4: LSSpinner uses platform-native UIActivityIndicator tinted color.signal.default
  GIVEN: `LSSpinner()` rendered
  WHEN:  Inspected
  THEN:  Underlying view is `UIActivityIndicatorView` (or SwiftUI ProgressView with `.circular` style backed by UIActivity), tint color == `theme.color.signal.default`, isAnimating == true
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSSpinnerTests.swift
  TEST_FUNCTION: test_spinner_is_uiactivityindicator_tinted_signal_default
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSSpinnerTests/test_spinner_is_uiactivityindicator_tinted_signal_default

AC-5: "Atoms / Display" stories registered per atom
  GIVEN: `ios/LaneShadow/Sandbox/Stories/LSDisplayStories.swift`
  WHEN:  AtomStories.all is composed
  THEN:  Stories `atoms.avatar.image`, `atoms.avatar.initials`, `atoms.avatar.size-matrix`, `atoms.divider.default`, `atoms.spinner.default` all exist with tier == `.atom` and group label "Atoms / Display"
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Stories/LSDisplayStories.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for s in atoms.avatar.image atoms.avatar.initials atoms.avatar.size-matrix atoms.divider.default atoms.spinner.default; do grep -q "$s" ios/LaneShadow/Sandbox/Stories/LSDisplayStories.swift || exit 1; done && grep -q 'LSDisplayStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift

AC-6: Legacy ios/LaneShadow/Avatar.swift removed; call sites migrated to LSAvatar (cleanup — boundary)
  GIVEN: Repo contains legacy `ios/LaneShadow/Avatar.swift`
  WHEN:  Task completes
  THEN:  File no longer exists AND no remaining `import` or call references to legacy `Avatar` symbol exist outside of LSAvatar.swift
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Avatar.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! test -f ios/LaneShadow/Avatar.swift && ! grep -REn '\bAvatar\s*\(' ios/LaneShadow/ --include='*.swift' | grep -v 'LSAvatar'

AC-7: No literal Color references in three atom files (error gate — boundary)
  GIVEN: LSAvatar.swift, LSDivider.swift, LSSpinner.swift
  WHEN:  Reviewer greps
  THEN:  Zero matches for `Color(`, `Color\.[a-z]`, hex strings, or rgba literals across all three files
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Views/Atoms/
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\(|Color\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSAvatar.swift ios/LaneShadow/Views/Atoms/LSDivider.swift ios/LaneShadow/Views/Atoms/LSSpinner.swift

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | LSAvatar image variant renders at sizing.icon.md, circular, .scaledToFill | AC-1 | xcodebuild test …test_image_variant_renders_at_sizing_icon_md_default |
| TC-2 | LSAvatar initials fallback uses LSText .ui.label.md on color.surface.card | AC-2 | xcodebuild test …test_initials_fallback_uses_label_md_on_surface_card |
| TC-3 | LSDivider renders 1pt color.border.subtle full-width | AC-3 | xcodebuild test …test_divider_renders_1pt_color_border_subtle |
| TC-4 | LSSpinner is UIActivityIndicator tinted color.signal.default | AC-4 | xcodebuild test …test_spinner_is_uiactivityindicator_tinted_signal_default |
| TC-5 | All 5 Atoms/Display story ids registered + LSDisplayStories aggregated | AC-5 | grep gate above |
| TC-6 | Legacy Avatar.swift removed; no stale call sites | AC-6 | grep gate above |
| TC-7 | Zero literal Color references in 3 atom files | AC-7 | grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/LSAvatar.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSDivider.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSSpinner.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/LSDisplayStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY — register LSDisplayStories.all)
- ios/LaneShadow/Avatar.swift (DELETE — legacy file)
- Any iOS file that imports / calls legacy `Avatar(...)` (MODIFY — migrate to LSAvatar)
- ios/LaneShadowTests/Atoms/LSAvatarTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSDividerTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSSpinnerTests.swift (NEW)

writeProhibited:
- ~/Projects/native-theme/** — schema upstream
- ~/Projects/native-sandbox/** — runtime upstream
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/** — UC-TOK-05 owns
- android/** — kotlin-implementer scope
- ios/LaneShadow.xcodeproj/** — human-only per RULES.md
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Resolve every visual property via `@Environment(\.theme)` accessors.
- Use LSText for initials (do not inline raw `Text`).
- Use SwiftUI `ProgressView(value:nil)` with `.tint(...)` OR a `UIViewRepresentable` wrapping `UIActivityIndicatorView` — pick the one that yields verifiable platform-native rendering.

⚠️ Ask First:
- Adding badge/online-indicator overlays to LSAvatar (belongs to a molecule).
- Adding determinate/progress variant to LSSpinner (separate atom).

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Atoms/LSAvatar.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSDivider.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSSpinner.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/LSDisplayStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY)
- ios/LaneShadow/Avatar.swift (DELETED)
- ios/LaneShadowTests/Atoms/LSAvatarTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSDividerTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSSpinnerTests.swift (NEW)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 7 ACs: dispatch swift-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-04-display.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design source for avatar/divider/spinner

2. .spec/prds/v2/05-uc-atm.md
   - Lines: 131-170 (UC-ATM-04 section)
   - Focus: Canonical AC bullets

3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
   - Lines: all
   - Focus: Sibling task pattern — LSText is consumed for initials

4. tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
   - Lines: all
   - Focus: ThemeProvider + generated `sizing.icon.*`, `color.border.subtle`, `color.signal.default`

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.atom, group labels

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence (TDD_STATE shows red before green per AC).
Gate 2: One test per behavioral AC (AC-1..AC-4 = test functions; AC-5..AC-7 = grep gates).
Gate 3: All XCTest pass — `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSAvatarTests` and `LSDividerTests` and `LSSpinnerTests` exit 0.
Gate 4: Swift build green — `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build` exits 0.
Gate 5: swiftformat clean — `swiftformat --lint ios/LaneShadow/` exits 0.
Gate 6: Legacy removed — `! test -f ios/LaneShadow/Avatar.swift`.
Gate 7: No literal colors — grep gate above returns zero.
Gate 8: Stories registered — `grep -q 'LSDisplayStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift` and 5 ids present.
Gate 9: Scope compliance — `git diff --name-only` ⊆ writeAllowed (allowing legacy delete + migration).

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Android Compose implementation (UC-ATM-04-android — runs in parallel under kotlin-implementer).
- Avatar online-indicator badge — belongs to a molecule.
- Determinate progress spinner — separate atom.
- LSIcon catalog — UC-ATM-10.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** Legacy `ios/LaneShadow/Avatar.swift` exists with hand-rolled sizing and color. No LSDivider or LSSpinner exists. Lists, profile chips, and loading states each hand-roll their own thin grey lines and `ProgressView`s with arbitrary tints.

**Gap:** Without the display trio, every list/loading molecule will inline `Color.gray`, `Color.orange`, and arbitrary frame sizes, defeating UC-TOK-02/03 and producing visual inconsistency at scale.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; tests verify rendered token resolution.
- RED evidence present in TDD_STATE history.
- No literal Color references in any of the three atom files (grep gate).
- Legacy Avatar.swift deleted AND no stale call sites.
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed).

Should verify (≤5):
- Avatar size matrix (xs/sm/md/lg/xl) all resolve through `sizing.icon.*` enums.
- Initials atom uses LSText (not raw `Text`).
- Spinner is observably platform-native (UIActivityIndicator behavior under inspection).
- Divider stretches full width by default.
- API ergonomics — sensible defaults so call sites can write `LSAvatar(initials:"JR")` and `LSDivider()` without parameters.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-01 (typography), UC-TOK-02 (color border.subtle / signal.default / surface.card / content.primary), UC-TOK-03 (sizing.icon.*), UC-TOK-05 (generated Swift theme), UC-ATM-01-ios (LSText for initials)
Blocks:     UC-MOL-* (profile chips, lists, loading wrappers), UC-ORG-*, UC-SCR-*
Parallel:   UC-ATM-04-android (Android pair), UC-ATM-02-ios (button), UC-ATM-03-ios (input), UC-ATM-05-ios (surfaces)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS view WHEN LSAvatar(image:) default rendered THEN frame=sizing.icon.md, circular clip, scaledToFill", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSAvatarTests/test_image_variant_renders_at_sizing_icon_md_default" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSAvatar(initials:JR size:.md) WHEN rendered THEN bg=color.surface.card, initials via LSText .ui.label.md, fg=color.content.primary, circular", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSAvatarTests/test_initials_fallback_uses_label_md_on_surface_card" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSDivider() WHEN rendered THEN height=1pt, fill=color.border.subtle, maxWidth=.infinity", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSDividerTests/test_divider_renders_1pt_color_border_subtle" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSSpinner() WHEN rendered THEN backed by UIActivityIndicator, tint=color.signal.default, animating", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSSpinnerTests/test_spinner_is_uiactivityindicator_tinted_signal_default" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSDisplayStories.swift WHEN composed THEN 5 stories atoms.avatar.{image,initials,size-matrix} + atoms.divider.default + atoms.spinner.default registered + aggregated", "verify": "for s in atoms.avatar.image atoms.avatar.initials atoms.avatar.size-matrix atoms.divider.default atoms.spinner.default; do grep -q \"$s\" ios/LaneShadow/Sandbox/Stories/LSDisplayStories.swift || exit 1; done && grep -q 'LSDisplayStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN legacy ios/LaneShadow/Avatar.swift WHEN task complete THEN file removed AND no stale Avatar( call sites outside LSAvatar.swift", "verify": "! test -f ios/LaneShadow/Avatar.swift && ! grep -REn '\\bAvatar\\s*\\(' ios/LaneShadow/ --include='*.swift' | grep -v 'LSAvatar'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN three atom files WHEN grep'd THEN zero literal Color references", "verify": "! grep -REn 'Color\\(|Color\\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSAvatar.swift ios/LaneShadow/Views/Atoms/LSDivider.swift ios/LaneShadow/Views/Atoms/LSSpinner.swift" },
    { "id": "TC-1", "type": "test_criterion", "description": "Avatar image variant size + clip", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSAvatarTests/test_image_variant_renders_at_sizing_icon_md_default" },
    { "id": "TC-2", "type": "test_criterion", "description": "Avatar initials fallback tokens", "maps_to_ac": "AC-2", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSAvatarTests/test_initials_fallback_uses_label_md_on_surface_card" },
    { "id": "TC-3", "type": "test_criterion", "description": "Divider 1pt color.border.subtle", "maps_to_ac": "AC-3", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSDividerTests/test_divider_renders_1pt_color_border_subtle" },
    { "id": "TC-4", "type": "test_criterion", "description": "Spinner UIActivityIndicator + tint", "maps_to_ac": "AC-4", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSSpinnerTests/test_spinner_is_uiactivityindicator_tinted_signal_default" },
    { "id": "TC-5", "type": "test_criterion", "description": "5 Atoms/Display story ids registered", "maps_to_ac": "AC-5", "verify": "for s in atoms.avatar.image atoms.avatar.initials atoms.avatar.size-matrix atoms.divider.default atoms.spinner.default; do grep -q \"$s\" ios/LaneShadow/Sandbox/Stories/LSDisplayStories.swift || exit 1; done" },
    { "id": "TC-6", "type": "test_criterion", "description": "Legacy Avatar.swift removed + no stale calls", "maps_to_ac": "AC-6", "verify": "! test -f ios/LaneShadow/Avatar.swift" },
    { "id": "TC-7", "type": "test_criterion", "description": "No literal colors across 3 atom files", "maps_to_ac": "AC-7", "verify": "! grep -REn 'Color\\(|Color\\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSAvatar.swift ios/LaneShadow/Views/Atoms/LSDivider.swift ios/LaneShadow/Views/Atoms/LSSpinner.swift" }
  ]
}
-->
