<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-10-ios — Icon atom (`LSIcon`) — design-owned SVG catalog — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   240 min

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint:      swiftformat --lint ios/LaneShadow/

PRD_REFS:   UC-ATM-10, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-10-icon.html
DEPENDS_ON: UC-TOK-02, UC-TOK-03, UC-TOK-05 (SVG catalog generation), UC-SBX-00-ios
BLOCKS:     UC-ATM-02-ios (Button icon slot), UC-ATM-03-ios (Input icon slot), UC-ATM-07-ios (Badge weather icons + star), UC-MOL-*, UC-ORG-*, UC-SCR-*

PROGRESS: AC-1 none · 0/9 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSIcon(name: IconName, size: IconSize, color: ContentColor = .primary)` renders typed glyphs from the design-owned SVG catalog on iOS SwiftUI. Consumes the generated `IconName` enum (25 names: `send, expand, collapse, menu, plus, close, sliders, bookmark, bookmarkFill, star, starFill, pin, clock, sun, rain, wind, storm, therm, route, map, layers, share, heart, heartFill, sparkle, compass, edit, trash, bike, chevR, chevL`) produced by UC-TOK-05 in `tokens/platforms/swift/Sources/LaneShadowTheme/`. Stroke is a 1.5pt rounded line from `icon.stroke.width`. Sizes resolve through `sizing.icon.{xs,sm,md,lg,xl}`. Color drives through a typed `ContentColor` enum (`color.content.*` plus `.signal` accent).

This atom is the SOLE icon source in `ios/LaneShadow/`. SF Symbols (`Image(systemName:)`, `UIImage(systemName:)`) are forbidden everywhere.

Note: The 25-name list above contains the canonical names from UC-TOK-05; the resolved `IconName` enum may be larger but MUST contain at minimum these 25 cases.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use `Image(systemName:)` or `UIImage(systemName:)` anywhere in `ios/LaneShadow/` — zero tolerance.
- NEVER expose a raw `Color` parameter on `LSIcon` — only the `ContentColor` enum. Raw color must be rejected at compile-time.
- NEVER hardcode the 1.5pt stroke — resolve through `icon.stroke.width`.
- NEVER hardcode icon sizes — resolve through `sizing.icon.{xs,sm,md,lg,xl}`.
- NEVER hand-author additional SVGs in this task — catalog comes from UC-TOK-05; missing icons must be added upstream.
- MUST modify only files listed in SCOPE.writeAllowed.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSIcon` exists at `ios/LaneShadow/Views/Atoms/LSIcon.swift` accepting typed `name: IconName`, `size: IconSize`, `color: ContentColor = .primary` — maps to AC-1
- [ ] `compass` at `.md` resolves `sizing.icon.md` + `icon.stroke.width` — maps to AC-1
- [ ] `color: .signal` resolves `color.signal.default` — maps to AC-2
- [ ] All 25 canonical icons render without crash — maps to AC-3
- [ ] Raw `Color` parameter rejected at compile-time — maps to AC-4
- [ ] Zero `Image(systemName:` / `UIImage(systemName:` references across `ios/LaneShadow/` — maps to AC-5
- [ ] Catalog story + color-overrides story registered — maps to AC-6
- [ ] `pnpm icons:check` passes (catalog parity gate) — maps to AC-7
- [ ] No literal stroke width / icon size in source — maps to AC-8
- [ ] iOS typecheck/build green; XCTest green; swiftformat clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSIcon compass at .md resolves sizing.icon.md + icon.stroke.width [PRIMARY]
  GIVEN: An iOS SwiftUI view importing LaneShadowTheme
  WHEN:  Developer renders `LSIcon(name: .compass, size: .md)`
  THEN:  Rendered frame == `sizing.icon.md`, stroke width == `icon.stroke.width` (1.5pt), foreground == `color.content.primary`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSIconTests.swift
  TEST_FUNCTION: test_compass_md_resolves_size_and_stroke_tokens
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_compass_md_resolves_size_and_stroke_tokens

AC-2: LSIcon color: .signal resolves color.signal.default
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders `LSIcon(name: .star, size: .sm, color: .signal)`
  THEN:  Resolved foreground == `color.signal.default`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSIconTests.swift
  TEST_FUNCTION: test_color_signal_resolves_token
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_color_signal_resolves_token

AC-3: All 25 canonical icons render without crash (catalog smoke)
  GIVEN: An iOS SwiftUI view
  WHEN:  Each of the 25 canonical names is rendered at `.md`
  THEN:  No crash; resolved drawable is non-nil for every name
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSIconTests.swift
  TEST_FUNCTION: test_all_canonical_icons_render_without_crash
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_all_canonical_icons_render_without_crash

AC-4: Raw Color parameter rejected at compile-time (error gate — type-safety)
  GIVEN: LSIcon API surface
  WHEN:  Developer attempts `LSIcon(name: .star, size: .sm, color: Color.red)`
  THEN:  Swift compiler rejects — `color` parameter only accepts `ContentColor` enum
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSIconTypeSafetyTests.swift
  TEST_FUNCTION: test_color_param_rejects_raw_Color
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTypeSafetyTests/test_color_param_rejects_raw_Color

AC-5: Zero SF Symbol references across ios/LaneShadow/ (error gate — boundary)
  GIVEN: All Swift source under ios/LaneShadow/
  WHEN:  Reviewer greps
  THEN:  Zero matches for `Image(systemName:` or `UIImage(systemName:`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Image\(systemName:|UIImage\(systemName:' ios/LaneShadow/

AC-6: Catalog story + color-overrides story registered
  GIVEN: `ios/LaneShadow/Sandbox/Stories/LSIconStories.swift`
  WHEN:  AtomStories.all is composed
  THEN:  Story ids `atoms.icon.catalog` and `atoms.icon.colorOverrides` exist, tier = `.atom`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Stories/LSIconStories.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.icon.catalog atoms.icon.colorOverrides; do grep -q "$id" ios/LaneShadow/Sandbox/Stories/LSIconStories.swift || exit 1; done && grep -q 'LSIconStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift

AC-7: pnpm icons:check passes (catalog parity)
  GIVEN: Generated `IconName` enum + bundled SVG assets
  WHEN:  Developer runs `pnpm icons:check`
  THEN:  Exit 0 — every enum case has a backing asset, no orphan assets
  TDD_STATE:     none
  TEST_FILE:     n/a (catalog gate)
  TEST_FUNCTION: n/a (CLI gate)
  VERIFY:        pnpm icons:check

AC-8: No literal stroke width or icon size in LSIcon.swift (error gate — boundary)
  GIVEN: ios/LaneShadow/Views/Atoms/LSIcon.swift
  WHEN:  Reviewer greps
  THEN:  Zero matches for `lineWidth: 1.5`, `frame(width: [0-9]`, or `Color\\.` literals
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Views/Atoms/LSIcon.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'lineWidth: 1\.5|frame\(width: [0-9]|Color\.(red|green|blue|black|white|gray|orange|yellow|purple|pink)' ios/LaneShadow/Views/Atoms/LSIcon.swift

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | compass .md resolves sizing.icon.md + icon.stroke.width | AC-1 | xcodebuild test …test_compass_md_resolves_size_and_stroke_tokens |
| TC-2 | color: .signal resolves color.signal.default | AC-2 | xcodebuild test …test_color_signal_resolves_token |
| TC-3 | All 25 canonical icons render without crash | AC-3 | xcodebuild test …test_all_canonical_icons_render_without_crash |
| TC-4 | Raw Color.red rejected by Swift compiler | AC-4 | xcodebuild test …test_color_param_rejects_raw_Color |
| TC-5 | Zero SF Symbol references across ios/LaneShadow/ | AC-5 | grep gate above |
| TC-6 | Catalog + colorOverrides stories registered + aggregator wired | AC-6 | grep gate above |
| TC-7 | pnpm icons:check passes | AC-7 | pnpm icons:check |
| TC-8 | No literal stroke width / icon size / Color in LSIcon.swift | AC-8 | grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/LSIcon.swift (NEW)
- ios/LaneShadow/Views/Atoms/IconSize.swift (NEW — typed size enum)
- ios/LaneShadow/Sandbox/Stories/LSIconStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY — register LSIconStories.all)
- ios/LaneShadowTests/Atoms/LSIconTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSIconTypeSafetyTests.swift (NEW)

writeProhibited:
- ~/Projects/native-theme/**
- ~/Projects/native-sandbox/**
- tokens/platforms/swift/Sources/LaneShadowTheme/Generated/** — UC-TOK-05 owns IconName + SVG bundle
- tokens/icons/** — design-owned SVG source
- android/**
- ios/LaneShadow.xcodeproj/**
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Resolve glyphs through the generated `IconName` enum.
- Resolve stroke via `theme.icon.stroke.width`; size via `theme.sizing.icon.{size}`; color via `ContentColor` → `theme.color.content.*` or `.signal`.
- Stories tier = `.atom`; ids `atoms.icon.{variant}`.

⚠️ Ask First:
- Adding a NEW icon name (must originate in UC-TOK-05 design source — never hand-author here).
- Adding a NEW `IconSize` beyond xs/sm/md/lg/xl.
- Adding a NEW `ContentColor` case beyond what UC-TOK-03 exposes.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Atoms/LSIcon.swift (NEW): the typed icon atom
- ios/LaneShadow/Views/Atoms/IconSize.swift (NEW): size enum (xs/sm/md/lg/xl)
- ios/LaneShadow/Sandbox/Stories/LSIconStories.swift (NEW): catalog + colorOverrides stories
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY): include `LSIconStories.all`
- ios/LaneShadowTests/Atoms/LSIconTests.swift (NEW): 3 behavior tests
- ios/LaneShadowTests/Atoms/LSIconTypeSafetyTests.swift (NEW): compile-time rejection test

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED → GREEN → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

Special: AC-5 is a global grep gate. Before declaring done, run `grep -REn 'Image\(systemName:|UIImage\(systemName:' ios/LaneShadow/` and remove any pre-existing references — Boy Scout Rule. Replacement uses LSIcon.

After all 8 ACs: dispatch swift-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-10-icon.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual catalog + size matrix + stroke contract
2. .spec/prds/v2/05-uc-atm.md
   - Lines: 225-260
   - Focus: UC-ATM-10 canonical AC bullets
3. .spec/prds/v2/tasks/sprint-01-foundation-tokens-and-v2-reset/UC-TOK-05-generate-swift-theme-and-icon-catalog.md
   - Lines: all
   - Focus: Direct upstream — IconName generation + SVG bundle layout
4. tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
   - Lines: all
   - Focus: sizing.icon.*, icon.stroke.width, color.signal.default, color.content.* accessors
5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: ComponentTier.atom, story id format

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per behavioral AC.
Gate 2: One test per AC (AC-1..AC-4 = test fns; AC-5..AC-8 = grep/CLI gates).
Gate 3: All XCTest pass.
Gate 4: Swift build green.
Gate 5: swiftformat clean.
Gate 6: Zero SF Symbol references — `! grep -REn 'Image\(systemName:|UIImage\(systemName:' ios/LaneShadow/`.
Gate 7: `pnpm icons:check` exits 0.
Gate 8: No literal stroke/size/Color in LSIcon.swift (grep).
Gate 9: Catalog + colorOverrides stories registered.
Gate 10: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Adding new icon names (escalate to UC-TOK-05 design source).
- Adding new IconSize / ContentColor cases (escalate to UC-TOK-02/03).
- Animated/morphing icons.
- Android Compose pair (UC-ATM-10-android — parallel kotlin-implementer).

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-05 generates the `IconName` enum and bundles the 25-icon SVG catalog into `tokens/platforms/swift/Sources/LaneShadowTheme/`. UC-TOK-02 exposes `sizing.icon.{xs,sm,md,lg,xl}` and `icon.stroke.width` (1.5pt). UC-TOK-03 exposes `color.content.*` and `color.signal.default`. iOS currently relies on SF Symbols throughout.

**Gap:** No `LSIcon` atom exists. Without it, downstream atoms (Button, Input, Badge) and molecules continue depending on SF Symbols, which violates the design-owned catalog contract and prevents brand-consistent stroke/weight.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; tests verify token-resolved size, stroke, color.
- RED evidence in TDD_STATE history.
- Zero SF Symbol references across ios/LaneShadow/.
- Raw `Color` parameter rejected at compile-time.
- `pnpm icons:check` exits 0.

Should verify (≤5):
- All 25 canonical icons resolve to non-nil drawables.
- API ergonomics — `LSIcon(name: .compass, size: .md)` compiles cleanly.
- Catalog story renders all icons in a deterministic grid.
- Test naming follows `test_{condition}_{expected}`.
- SCOPE respected — no edits to `tokens/platforms/swift/.../Generated/` or `tokens/icons/`.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (sizing/stroke), UC-TOK-03 (content/signal color), UC-TOK-05 (IconName + SVG catalog generation), UC-SBX-00-ios (sandbox runtime)
Blocks:     UC-ATM-02-ios (Button icon slot), UC-ATM-03-ios (Input icon slot), UC-ATM-07-ios (Badge weather icons + star), UC-MOL-*, UC-ORG-*, UC-SCR-*
Parallel:   UC-ATM-10-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS view WHEN LSIcon(.compass,.md) rendered THEN frame=sizing.icon.md, stroke=icon.stroke.width, fg=color.content.primary", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_compass_md_resolves_size_and_stroke_tokens" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN color: .signal WHEN rendered THEN foreground=color.signal.default", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_color_signal_resolves_token" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN all 25 canonical icons WHEN rendered at .md THEN no crash, drawable non-nil", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTests/test_all_canonical_icons_render_without_crash" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSIcon API WHEN raw Color passed THEN compiler rejects", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSIconTypeSafetyTests/test_color_param_rejects_raw_Color" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN ios/LaneShadow/ WHEN grep'd THEN zero SF Symbol references", "verify": "! grep -REn 'Image\\(systemName:|UIImage\\(systemName:' ios/LaneShadow/" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSIconStories.swift WHEN composed THEN catalog + colorOverrides stories registered", "verify": "for id in atoms.icon.catalog atoms.icon.colorOverrides; do grep -q \"$id\" ios/LaneShadow/Sandbox/Stories/LSIconStories.swift || exit 1; done && grep -q 'LSIconStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN generated IconName + SVG bundle WHEN pnpm icons:check run THEN exit 0", "verify": "pnpm icons:check" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN LSIcon.swift WHEN grep'd THEN zero literal stroke width / icon size / Color", "verify": "! grep -REn 'lineWidth: 1\\.5|frame\\(width: [0-9]|Color\\.(red|green|blue|black|white|gray|orange|yellow|purple|pink)' ios/LaneShadow/Views/Atoms/LSIcon.swift" },
    { "id": "TC-1", "type": "test_criterion", "description": "compass .md size+stroke token resolution", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSIconTests/test_compass_md_resolves_size_and_stroke_tokens" },
    { "id": "TC-2", "type": "test_criterion", "description": "color .signal token resolution", "maps_to_ac": "AC-2", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSIconTests/test_color_signal_resolves_token" },
    { "id": "TC-3", "type": "test_criterion", "description": "All 25 canonical icons render", "maps_to_ac": "AC-3", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSIconTests/test_all_canonical_icons_render_without_crash" },
    { "id": "TC-4", "type": "test_criterion", "description": "Raw Color rejected at compile", "maps_to_ac": "AC-4", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSIconTypeSafetyTests/test_color_param_rejects_raw_Color" },
    { "id": "TC-5", "type": "test_criterion", "description": "Zero SF Symbols across ios/LaneShadow/", "maps_to_ac": "AC-5", "verify": "! grep -REn 'Image\\(systemName:' ios/LaneShadow/" },
    { "id": "TC-6", "type": "test_criterion", "description": "Catalog + colorOverrides stories registered", "maps_to_ac": "AC-6", "verify": "grep -q 'atoms.icon.catalog' ios/LaneShadow/Sandbox/Stories/LSIconStories.swift" },
    { "id": "TC-7", "type": "test_criterion", "description": "pnpm icons:check passes", "maps_to_ac": "AC-7", "verify": "pnpm icons:check" },
    { "id": "TC-8", "type": "test_criterion", "description": "No literal stroke/size/Color in LSIcon.swift", "maps_to_ac": "AC-8", "verify": "! grep -REn 'lineWidth: 1\\.5' ios/LaneShadow/Views/Atoms/LSIcon.swift" }
  ]
}
-->
