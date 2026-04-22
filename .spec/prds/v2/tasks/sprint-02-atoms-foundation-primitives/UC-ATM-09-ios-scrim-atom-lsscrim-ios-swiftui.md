<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-09-ios — Scrim atom (`LSScrim`) — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   60 min

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSScrimTests
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint:      swiftformat --lint ios/LaneShadow/

PRD_REFS:   UC-ATM-09, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-09-scrim.html
DEPENDS_ON: UC-TOK-02, UC-TOK-03, UC-TOK-05, UC-SBX-00-ios
BLOCKS:     UC-MOL-* (sheets, modals, overlays), UC-ORG-*, UC-SCR-*

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSScrim(opacity: Double = 0.35, blocking: Bool = false, onTap: (() -> Void)? = nil)` renders a full-parent overlay using `color.surface.scrim` on iOS SwiftUI. Default opacity (`0.35`) resolves through `opacity.scrim`. Touches pass through by default (`blocking: false`). When `blocking: true`, the scrim captures touches and fires `onTap` once per tap.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use literal `Color.black.opacity(...)` — surface MUST be `color.surface.scrim`.
- NEVER hardcode the default `0.35` — resolve through `opacity.scrim` token.
- NEVER expose a raw `Color` parameter on `LSScrim`.
- NEVER block touches by default — `blocking: false` means `.allowsHitTesting(false)`.
- MUST modify only files listed in SCOPE.writeAllowed.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSScrim` exists at `ios/LaneShadow/Views/Atoms/LSScrim.swift` accepting `opacity`, `blocking`, optional `onTap` — maps to AC-1
- [ ] Default opacity resolves through `opacity.scrim` token — maps to AC-1
- [ ] Override opacity resolves through an `opacity.*` token — maps to AC-2
- [ ] Default passes touches through — maps to AC-3
- [ ] `blocking: true` captures touches and fires `onTap` once — maps to AC-4
- [ ] Three stories registered (Default / Opacity 0.6 / Blocking) — maps to AC-5
- [ ] Zero `Color\\.` literals in source — maps to AC-6
- [ ] iOS typecheck/build green; XCTest green; swiftformat clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSScrim default renders color.surface.scrim at opacity.scrim [PRIMARY]
  GIVEN: An iOS SwiftUI view importing LaneShadowTheme
  WHEN:  Developer renders `LSScrim()`
  THEN:  Background fill == `color.surface.scrim`, alpha == `opacity.scrim` (0.35)
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSScrimTests.swift
  TEST_FUNCTION: test_default_resolves_surface_and_opacity_tokens
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_default_resolves_surface_and_opacity_tokens

AC-2: LSScrim override opacity resolves an opacity.* token (edge)
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders `LSScrim(opacity: theme.opacity.scrimHeavy)`
  THEN:  Alpha resolves the supplied token value (e.g. 0.6) and tokens-only path is honored
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSScrimTests.swift
  TEST_FUNCTION: test_override_opacity_resolves_token
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_override_opacity_resolves_token

AC-3: LSScrim default passes touches through to underlying content
  GIVEN: A host view with a button beneath `LSScrim()`
  WHEN:  User taps the screen at the button's location
  THEN:  Underlying button receives the tap (scrim does not intercept)
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSScrimTests.swift
  TEST_FUNCTION: test_default_passes_touches_through
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_default_passes_touches_through

AC-4: LSScrim blocking: true captures touches and fires onTap once
  GIVEN: `LSScrim(blocking: true, onTap: { tapCount += 1 })`
  WHEN:  User taps the scrim
  THEN:  `onTap` fires exactly once per tap; underlying content does NOT receive the tap
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSScrimTests.swift
  TEST_FUNCTION: test_blocking_captures_touch_and_fires_onTap_once
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_blocking_captures_touch_and_fires_onTap_once

AC-5: Three stories registered (Default / Opacity 0.6 / Blocking)
  GIVEN: `ios/LaneShadow/Sandbox/Stories/LSScrimStories.swift`
  WHEN:  AtomStories.all is composed
  THEN:  Story ids `atoms.scrim.default`, `atoms.scrim.opacityHeavy`, `atoms.scrim.blocking` exist, tier = `.atom`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Stories/LSScrimStories.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.scrim.default atoms.scrim.opacityHeavy atoms.scrim.blocking; do grep -q "$id" ios/LaneShadow/Sandbox/Stories/LSScrimStories.swift || exit 1; done && grep -q 'LSScrimStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift

AC-6: No Color literal in LSScrim.swift (error gate — boundary)
  GIVEN: ios/LaneShadow/Views/Atoms/LSScrim.swift
  WHEN:  Reviewer greps
  THEN:  Zero matches for `Color\\.(red|green|blue|black|white|gray|orange|yellow|purple|pink)` or `Color(red:`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Views/Atoms/LSScrim.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\.(red|green|blue|black|white|gray|orange|yellow|purple|pink)|Color\(red:' ios/LaneShadow/Views/Atoms/LSScrim.swift

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | Default fill=color.surface.scrim, alpha=opacity.scrim | AC-1 | xcodebuild test …test_default_resolves_surface_and_opacity_tokens |
| TC-2 | Override opacity resolves opacity.* token | AC-2 | xcodebuild test …test_override_opacity_resolves_token |
| TC-3 | Default passes touches through | AC-3 | xcodebuild test …test_default_passes_touches_through |
| TC-4 | Blocking captures + fires onTap exactly once | AC-4 | xcodebuild test …test_blocking_captures_touch_and_fires_onTap_once |
| TC-5 | 3 story ids registered + aggregator wired | AC-5 | grep gate above |
| TC-6 | Zero Color literal in LSScrim.swift | AC-6 | grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/LSScrim.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/LSScrimStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY — register LSScrimStories.all)
- ios/LaneShadowTests/Atoms/LSScrimTests.swift (NEW)

writeProhibited:
- ~/Projects/native-theme/**
- ~/Projects/native-sandbox/**
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/**
- android/**
- ios/LaneShadow.xcodeproj/**
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Resolve background via `theme.color.surface.scrim`.
- Default opacity from `theme.opacity.scrim`.
- Use `.allowsHitTesting(false)` when `blocking == false`.
- Stories tier = `.atom`; ids `atoms.scrim.{variant}`.

⚠️ Ask First:
- Adding blur or material backdrop (would belong on a higher-tier overlay molecule).
- Adding tap-outside-to-dismiss as default (consumer molecule should opt in).

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Atoms/LSScrim.swift (NEW): the scrim primitive
- ios/LaneShadow/Sandbox/Stories/LSScrimStories.swift (NEW): 3 stories
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY): include `LSScrimStories.all`
- ios/LaneShadowTests/Atoms/LSScrimTests.swift (NEW): 4 behavior tests

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED → GREEN → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 6 ACs: dispatch swift-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-09-scrim.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual contract + interaction matrix
2. .spec/prds/v2/05-uc-atm.md
   - Lines: 200-225
   - Focus: UC-ATM-09 canonical AC bullets
3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-06-ios-pill-atom-lspill-ios-swiftui.md
   - Lines: all
   - Focus: Sibling iOS atom pattern
4. tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
   - Lines: all
   - Focus: color.surface.scrim, opacity.scrim accessors
5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract)
   - Focus: ComponentTier.atom, story id format

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per behavioral AC.
Gate 2: Tests assert token-resolved fill + alpha, not literals.
Gate 3: All XCTest pass.
Gate 4: Swift build green.
Gate 5: swiftformat clean.
Gate 6: No `Color\\.` literal in LSScrim.swift (grep).
Gate 7: 3 story ids registered + aggregator wired.
Gate 8: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Blur / material backdrops (UC-MOL-* overlay molecules).
- Animated fade-in/out lifecycle (consumer-level, not atom).
- Android Compose pair (UC-ATM-09-android — parallel kotlin-implementer).

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-03 generates `color.surface.scrim`; UC-TOK-02 generates `opacity.scrim` (0.35) and `opacity.scrimHeavy` (0.6). iOS has no scrim primitive — sheets and modals would each inline `Color.black.opacity(0.35)`.

**Gap:** Without `LSScrim`, every overlay molecule duplicates the surface+opacity contract and breaks dark-mode neutrality (literal black ≠ `color.surface.scrim`).

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; tests verify token resolution and hit-testing behavior.
- RED evidence in TDD_STATE history.
- Default `blocking == false` uses `.allowsHitTesting(false)`.
- `onTap` fires exactly once per tap when `blocking == true` (no double-fire).
- Zero `Color\\.` literal in source.

Should verify (≤5):
- Default opacity resolves `opacity.scrim` token (not hardcoded `0.35`).
- API ergonomics — defaults compose cleanly (`LSScrim()` with no args).
- Stories cover all three behaviors (default, override opacity, blocking+onTap).
- Test naming follows `test_{condition}_{expected}`.
- SCOPE respected.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (opacity tokens), UC-TOK-03 (color.surface.scrim), UC-TOK-05 (generated theme), UC-SBX-00-ios (sandbox runtime)
Blocks:     UC-MOL-* (sheets, modals, overlays), UC-ORG-*, UC-SCR-*
Parallel:   UC-ATM-09-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS view WHEN LSScrim() rendered THEN bg=color.surface.scrim, alpha=opacity.scrim", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_default_resolves_surface_and_opacity_tokens" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN override opacity from opacity.* WHEN rendered THEN alpha resolves to token value", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_override_opacity_resolves_token" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN default scrim over button WHEN tap THEN underlying button receives tap", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_default_passes_touches_through" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN blocking:true with onTap WHEN tap THEN onTap fires exactly once and underlying does not receive tap", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_blocking_captures_touch_and_fires_onTap_once" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSScrimStories.swift WHEN composed THEN 3 story ids registered", "verify": "for id in atoms.scrim.default atoms.scrim.opacityHeavy atoms.scrim.blocking; do grep -q \"$id\" ios/LaneShadow/Sandbox/Stories/LSScrimStories.swift || exit 1; done" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSScrim.swift WHEN grep'd THEN zero Color literal", "verify": "! grep -REn 'Color\\.(red|green|blue|black|white|gray|orange|yellow|purple|pink)|Color\\(red:' ios/LaneShadow/Views/Atoms/LSScrim.swift" },
    { "id": "TC-1", "type": "test_criterion", "description": "Default token resolution", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_default_resolves_surface_and_opacity_tokens" },
    { "id": "TC-2", "type": "test_criterion", "description": "Override opacity token resolution", "maps_to_ac": "AC-2", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_override_opacity_resolves_token" },
    { "id": "TC-3", "type": "test_criterion", "description": "Default passes touches through", "maps_to_ac": "AC-3", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_default_passes_touches_through" },
    { "id": "TC-4", "type": "test_criterion", "description": "Blocking captures + onTap once", "maps_to_ac": "AC-4", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSScrimTests/test_blocking_captures_touch_and_fires_onTap_once" },
    { "id": "TC-5", "type": "test_criterion", "description": "3 stories registered", "maps_to_ac": "AC-5", "verify": "grep -q 'atoms.scrim.blocking' ios/LaneShadow/Sandbox/Stories/LSScrimStories.swift" },
    { "id": "TC-6", "type": "test_criterion", "description": "No Color literal", "maps_to_ac": "AC-6", "verify": "! grep -REn 'Color\\.(red|green|blue|black|white)' ios/LaneShadow/Views/Atoms/LSScrim.swift" }
  ]
}
-->
