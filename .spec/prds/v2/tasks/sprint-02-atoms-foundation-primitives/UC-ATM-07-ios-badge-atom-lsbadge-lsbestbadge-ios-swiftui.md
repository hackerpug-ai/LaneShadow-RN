<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-07-ios — Badge atoms (`LSBadge`, `LSBestBadge`) — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBadgeTests
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint:      swiftformat --lint ios/LaneShadow/

PRD_REFS:   UC-ATM-07, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-07-badge.html
DEPENDS_ON: UC-ATM-06-ios (Pill), UC-ATM-10-ios (Icon), UC-TOK-02, UC-TOK-03, UC-TOK-05, UC-SBX-00-ios
BLOCKS:     UC-MOL-* (badge consumers), UC-ORG-*, UC-SCR-*

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSBadge(count: Int? = nil, label: String? = nil, variant: BadgeVariant)` renders typed status/weather pills, composed atop `LSPill(.sm)`. `BadgeVariant` is a closed union of `status.{info,success,warning,error,recording}` + `weather.{clear,rain,wind,storm,hot,cold}`. Status variants resolve `color.status.*` (default + tint). Weather variants use `color.weather.*.tint` background, `color.weather.*.default` foreground+border (≈0.5pt @ 55% alpha), and a leading `LSIcon` at `sizing.icon.xs`.

`LSBestBadge` is a typed sub-variant rendering "BEST FOR TODAY" with a filled-star prefix in `color.signal.{default,on}`.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use SF Symbols (`Image(systemName:)` / `UIImage(systemName:)`) — weather/star icons MUST come from `LSIcon` (UC-ATM-10-ios).
- NEVER expose a raw `Color` parameter — only the `BadgeVariant` enum drives surface tokens.
- NEVER inline pill geometry — Badge MUST compose `LSPill(.sm)` from UC-ATM-06-ios.
- NEVER hardcode the 55% alpha — resolve through `opacity.weatherBorder` (or equivalent token from UC-TOK-02).
- NEVER write `#Preview` blocks for atoms — use the native-sandbox `Story` wrapper.
- MUST modify only files listed in SCOPE.writeAllowed.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSBadge` exists at `ios/LaneShadow/Views/Atoms/LSBadge.swift` accepting typed `BadgeVariant` — maps to AC-1
- [ ] Status variants resolve `color.status.*` tokens — maps to AC-1, AC-2
- [ ] Weather variants resolve `color.weather.*.tint` bg + `color.weather.*.default` fg/border + leading `LSIcon` at `sizing.icon.xs` — maps to AC-3, AC-4
- [ ] `LSBestBadge` renders "BEST FOR TODAY" + filled star with `color.signal.*` — maps to AC-5
- [ ] All 12 stories registered (5 status + 6 weather + 1 BestBadge) — maps to AC-6
- [ ] Composes `LSPill(.sm)` — no inlined pill geometry — maps to AC-7
- [ ] Zero SF Symbol references in Badge files — maps to AC-8
- [ ] iOS typecheck/build green; XCTest green; swiftformat clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSBadge renders status.recording with token-resolved color [PRIMARY]
  GIVEN: An iOS SwiftUI view importing LaneShadowTheme
  WHEN:  Developer renders `LSBadge(label: "REC", variant: .status(.recording))`
  THEN:  Background == `color.status.recording.tint`, foreground == `color.status.recording.default`, shape composed via `LSPill(.sm)`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSBadgeTests.swift
  TEST_FUNCTION: test_status_recording_resolves_tokens
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_status_recording_resolves_tokens

AC-2: LSBadge renders status.{info,success,warning,error} from color.status.* tokens
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders each non-recording status variant
  THEN:  Each resolves the matching `color.status.{name}.tint` bg + `color.status.{name}.default` fg
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSBadgeTests.swift
  TEST_FUNCTION: test_status_variants_resolve_color_tokens
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_status_variants_resolve_color_tokens

AC-3: LSBadge weather.rain resolves tokens + leading LSIcon at sizing.icon.xs
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders `LSBadge(label: "RAIN", variant: .weather(.rain))`
  THEN:  Background == `color.weather.rain.tint`, fg/border == `color.weather.rain.default`, border alpha == `opacity.weatherBorder`, leading `LSIcon(.rain, size: .xs)` present
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSBadgeTests.swift
  TEST_FUNCTION: test_weather_rain_resolves_tokens_and_icon
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_weather_rain_resolves_tokens_and_icon

AC-4: LSBadge weather.wind resolves tokens + leading LSIcon (edge — 2nd weather variant)
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders `LSBadge(label: "WIND", variant: .weather(.wind))`
  THEN:  Background == `color.weather.wind.tint`, fg/border == `color.weather.wind.default`, leading `LSIcon(.wind, size: .xs)` present
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSBadgeTests.swift
  TEST_FUNCTION: test_weather_wind_resolves_tokens_and_icon
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_weather_wind_resolves_tokens_and_icon

AC-5: LSBestBadge renders "BEST FOR TODAY" with filled star + color.signal tokens
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders `LSBestBadge()`
  THEN:  Label text == "BEST FOR TODAY", background == `color.signal.default`, foreground == `color.signal.on`, leading `LSIcon(.starFill, size: .xs)` present
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSBestBadgeTests.swift
  TEST_FUNCTION: test_best_badge_resolves_signal_tokens_and_filled_star
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBestBadgeTests/test_best_badge_resolves_signal_tokens_and_filled_star

AC-6: All 12 stories registered (status × 5 + weather × 6 + bestBadge)
  GIVEN: `ios/LaneShadow/Sandbox/Stories/LSBadgeStories.swift`
  WHEN:  AtomStories.all is composed
  THEN:  Story ids `atoms.badge.status.{info,success,warning,error,recording}` + `atoms.badge.weather.{clear,rain,wind,storm,hot,cold}` + `atoms.bestBadge.default` exist, tier = `.atom`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Stories/LSBadgeStories.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.badge.status.info atoms.badge.status.success atoms.badge.status.warning atoms.badge.status.error atoms.badge.status.recording atoms.badge.weather.clear atoms.badge.weather.rain atoms.badge.weather.wind atoms.badge.weather.storm atoms.badge.weather.hot atoms.badge.weather.cold atoms.bestBadge.default; do grep -q "$id" ios/LaneShadow/Sandbox/Stories/LSBadgeStories.swift || exit 1; done && grep -q 'LSBadgeStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift

AC-7: LSBadge composes LSPill(.sm) — no inlined pill geometry (error gate — boundary)
  GIVEN: ios/LaneShadow/Views/Atoms/LSBadge.swift
  WHEN:  Reviewer greps
  THEN:  Source contains `LSPill(` AND zero matches for literal `cornerRadius([0-9]` or `frame(height: [0-9]`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Views/Atoms/LSBadge.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        grep -q 'LSPill(' ios/LaneShadow/Views/Atoms/LSBadge.swift && ! grep -REn 'cornerRadius\([0-9]|frame\(height: [0-9]' ios/LaneShadow/Views/Atoms/LSBadge.swift

AC-8: Zero SF Symbol references in Badge files (error gate — icon source)
  GIVEN: Badge source files
  WHEN:  Reviewer greps
  THEN:  Zero matches for `Image(systemName:` or `UIImage(systemName:`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Views/Atoms/LSBadge.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Image\(systemName:|UIImage\(systemName:' ios/LaneShadow/Views/Atoms/LSBadge.swift ios/LaneShadow/Views/Atoms/LSBestBadge.swift

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | status.recording resolves color.status.recording.{tint,default} + composes LSPill(.sm) | AC-1 | xcodebuild test …test_status_recording_resolves_tokens |
| TC-2 | status.{info,success,warning,error} resolve color.status.*.{tint,default} | AC-2 | xcodebuild test …test_status_variants_resolve_color_tokens |
| TC-3 | weather.rain resolves bg/fg/border tokens + LSIcon(.rain,.xs) | AC-3 | xcodebuild test …test_weather_rain_resolves_tokens_and_icon |
| TC-4 | weather.wind resolves bg/fg/border tokens + LSIcon(.wind,.xs) | AC-4 | xcodebuild test …test_weather_wind_resolves_tokens_and_icon |
| TC-5 | LSBestBadge resolves color.signal.* + filled star + label "BEST FOR TODAY" | AC-5 | xcodebuild test …test_best_badge_resolves_signal_tokens_and_filled_star |
| TC-6 | All 12 stories registered + aggregator wired | AC-6 | grep gate above |
| TC-7 | LSBadge composes LSPill(.sm); no literal pill geometry | AC-7 | grep gate above |
| TC-8 | Zero SF Symbol references in Badge files | AC-8 | grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/LSBadge.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSBestBadge.swift (NEW)
- ios/LaneShadow/Views/Atoms/BadgeVariant.swift (NEW — typed variant union)
- ios/LaneShadow/Sandbox/Stories/LSBadgeStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY — register LSBadgeStories.all)
- ios/LaneShadowTests/Atoms/LSBadgeTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSBestBadgeTests.swift (NEW)

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
- Compose `LSPill(.sm)` for shape; never inline corner-radius or height.
- Use `LSIcon` (UC-ATM-10-ios) for any glyph; never SF Symbols.
- Resolve all surface colors via typed `BadgeVariant` → token.
- Stories tier = `.atom`; ids `atoms.badge.{namespace}.{name}` and `atoms.bestBadge.default`.

⚠️ Ask First:
- Adding a new status or weather variant beyond the canonical lists.
- Introducing interactive (tap) handling — Badges are display-only atoms.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Atoms/LSBadge.swift (NEW): typed status/weather badge
- ios/LaneShadow/Views/Atoms/LSBestBadge.swift (NEW): "BEST FOR TODAY" sub-variant
- ios/LaneShadow/Views/Atoms/BadgeVariant.swift (NEW): closed union variant enum
- ios/LaneShadow/Sandbox/Stories/LSBadgeStories.swift (NEW): 12 stories
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY): include `LSBadgeStories.all`
- ios/LaneShadowTests/Atoms/LSBadgeTests.swift (NEW): 4 behavior tests
- ios/LaneShadowTests/Atoms/LSBestBadgeTests.swift (NEW): 1 behavior test

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED → GREEN → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 8 ACs: dispatch swift-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-07-badge.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design for status/weather/best variants
2. .spec/prds/v2/05-uc-atm.md
   - Lines: 130-170
   - Focus: UC-ATM-07 canonical AC bullets
3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-06-ios-pill-atom-lspill-ios-swiftui.md
   - Lines: all
   - Focus: Direct dependency — Pill composition contract
4. tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
   - Lines: all
   - Focus: color.status.*, color.weather.*, color.signal.*, opacity.weatherBorder accessors
5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.atom

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence per behavioral AC.
Gate 2: One test per AC (AC-1..AC-5 = test fns; AC-6..AC-8 = grep gates).
Gate 3: All XCTest pass.
Gate 4: Swift build green.
Gate 5: swiftformat clean.
Gate 6: Composes LSPill — `grep -q 'LSPill(' ios/LaneShadow/Views/Atoms/LSBadge.swift`.
Gate 7: Zero SF Symbols in Badge files.
Gate 8: All 12 story ids registered.
Gate 9: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Interactive/tap behavior (Badges are display-only).
- Animated badge variants (live "REC" pulse — handled by future molecule).
- Android Compose pair (UC-ATM-07-android — parallel kotlin-implementer).

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-02/03 generate `color.status.*`, `color.weather.*`, `color.signal.*`, and `opacity.weatherBorder`. UC-ATM-06-ios provides `LSPill`, UC-ATM-10-ios provides `LSIcon`. iOS has no Badge atom — every prospective Card/Marker would inline pill+color+icon geometry.

**Gap:** No `LSBadge`/`LSBestBadge` atoms exist. Without them, downstream cards leak weather/status semantics into ad-hoc views, defeating UC-TOK-03's color contract.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; tests verify token resolution.
- RED evidence in TDD_STATE history.
- Composes `LSPill(.sm)` — zero inlined pill geometry.
- Zero SF Symbol references; uses `LSIcon` exclusively.
- All 12 story ids registered + aggregator wired.

Should verify (≤5):
- API ergonomics — `BadgeVariant.status(.recording)` and `.weather(.rain)` compile cleanly.
- Light + dark mode token resolution.
- LSBestBadge label is exact string "BEST FOR TODAY" (no localization yet).
- Border alpha resolves via `opacity.weatherBorder` token (no literal `0.55`).
- SCOPE respected.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ATM-06-ios (Pill composition), UC-ATM-10-ios (Icon source), UC-TOK-02 (sizing/opacity), UC-TOK-03 (color), UC-TOK-05 (generated theme), UC-SBX-00-ios (sandbox runtime)
Blocks:     UC-MOL-* (badge consumers), UC-ORG-*, UC-SCR-*
Parallel:   UC-ATM-07-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS view WHEN LSBadge status.recording rendered THEN bg=color.status.recording.tint, fg=color.status.recording.default, composes LSPill(.sm)", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_status_recording_resolves_tokens" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN view WHEN status.{info,success,warning,error} rendered THEN each resolves color.status.{name}.{tint,default}", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_status_variants_resolve_color_tokens" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN weather.rain WHEN rendered THEN bg=color.weather.rain.tint, fg/border=color.weather.rain.default, alpha=opacity.weatherBorder, leading LSIcon(.rain,.xs)", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_weather_rain_resolves_tokens_and_icon" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN weather.wind WHEN rendered THEN bg/fg/border resolve color.weather.wind.* + leading LSIcon(.wind,.xs)", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_weather_wind_resolves_tokens_and_icon" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSBestBadge() WHEN rendered THEN label='BEST FOR TODAY', bg=color.signal.default, fg=color.signal.on, leading LSIcon(.starFill,.xs)", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSBestBadgeTests/test_best_badge_resolves_signal_tokens_and_filled_star" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSBadgeStories.swift WHEN composed THEN 12 story ids registered (5 status + 6 weather + bestBadge.default)", "verify": "for id in atoms.badge.status.info atoms.badge.status.success atoms.badge.status.warning atoms.badge.status.error atoms.badge.status.recording atoms.badge.weather.clear atoms.badge.weather.rain atoms.badge.weather.wind atoms.badge.weather.storm atoms.badge.weather.hot atoms.badge.weather.cold atoms.bestBadge.default; do grep -q \"$id\" ios/LaneShadow/Sandbox/Stories/LSBadgeStories.swift || exit 1; done" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN LSBadge.swift WHEN grep'd THEN composes LSPill( and zero literal pill geometry", "verify": "grep -q 'LSPill(' ios/LaneShadow/Views/Atoms/LSBadge.swift && ! grep -REn 'cornerRadius\\([0-9]|frame\\(height: [0-9]' ios/LaneShadow/Views/Atoms/LSBadge.swift" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN Badge files WHEN grep'd THEN zero SF Symbol references", "verify": "! grep -REn 'Image\\(systemName:|UIImage\\(systemName:' ios/LaneShadow/Views/Atoms/LSBadge.swift ios/LaneShadow/Views/Atoms/LSBestBadge.swift" },
    { "id": "TC-1", "type": "test_criterion", "description": "status.recording token resolution + LSPill composition", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_status_recording_resolves_tokens" },
    { "id": "TC-2", "type": "test_criterion", "description": "status.{info,success,warning,error} token resolution", "maps_to_ac": "AC-2", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_status_variants_resolve_color_tokens" },
    { "id": "TC-3", "type": "test_criterion", "description": "weather.rain tokens + LSIcon", "maps_to_ac": "AC-3", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_weather_rain_resolves_tokens_and_icon" },
    { "id": "TC-4", "type": "test_criterion", "description": "weather.wind tokens + LSIcon", "maps_to_ac": "AC-4", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSBadgeTests/test_weather_wind_resolves_tokens_and_icon" },
    { "id": "TC-5", "type": "test_criterion", "description": "LSBestBadge signal tokens + filled star + label", "maps_to_ac": "AC-5", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSBestBadgeTests/test_best_badge_resolves_signal_tokens_and_filled_star" },
    { "id": "TC-6", "type": "test_criterion", "description": "12 stories registered", "maps_to_ac": "AC-6", "verify": "grep -q 'atoms.badge.status.recording' ios/LaneShadow/Sandbox/Stories/LSBadgeStories.swift" },
    { "id": "TC-7", "type": "test_criterion", "description": "LSBadge composes LSPill, no inlined geometry", "maps_to_ac": "AC-7", "verify": "grep -q 'LSPill(' ios/LaneShadow/Views/Atoms/LSBadge.swift" },
    { "id": "TC-8", "type": "test_criterion", "description": "No SF Symbols in Badge files", "maps_to_ac": "AC-8", "verify": "! grep -REn 'Image\\(systemName:' ios/LaneShadow/Views/Atoms/LSBadge.swift" }
  ]
}
-->
