<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-05-ios — Surface trio (`LSCard` + `LSPanel` + `LSGlassPanel`) — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   180 min

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSCardTests
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint:      swiftformat --lint ios/LaneShadow/

PRD_REFS:   UC-ATM-05, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-05-surface.html
DEPENDS_ON: UC-TOK-01, UC-TOK-02, UC-TOK-03, UC-TOK-05
BLOCKS:     UC-MOL-* (every card-shaped molecule), UC-ORG-*, UC-SCR-* (any glass overlay HUD)

PROGRESS: AC-1 none · 0/9 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Three container atoms ship on iOS: `LSCard` (`color.surface.card`, `radius.lg`, `elevation.2`, `padding spacing.4`), `LSPanel` (`color.surface.primary`, `radius.md`, no shadow, `padding spacing.3`), and `LSGlassPanel` (`color.surface.glass`, `radius.xl`, `elevation.overlay`, `.ultraThinMaterial` backdrop blur 12-14pt). LSGlassPanel supports a `variant: GlassVariant` of `.chrome` or `.callout(accent: AccentColor)`; the callout variant adds a 3pt leading stripe in the accent color (`.signal` → `color.signal.default`, `.warning` → `color.status.warning.default`).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER reference `Color(...)`, hex strings, or any literal color in the three atom files. All colors MUST resolve through `LaneShadowTheme.color.*`.
- NEVER expose a raw `Color` parameter on `LSGlassPanel` callout — only the `AccentColor` enum (resolves through `color.signal.*` / `color.status.*`). Raw color must be rejected at compile-time.
- NEVER hardcode shadow radius, blur radius, padding, or radius — all visuals MUST resolve through `theme.elevation.*` / `theme.spacing.*` / `theme.radius.*`.
- NEVER write `#Preview { ... }` — sandbox stories ONLY.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**` or `~/Projects/native-sandbox/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSCard` exists at `ios/LaneShadow/Views/Atoms/LSCard.swift` resolving card tokens — maps to AC-1 (PRIMARY)
- [ ] `LSPanel` exists at `ios/LaneShadow/Views/Atoms/LSPanel.swift` resolving panel tokens — maps to AC-2
- [ ] `LSGlassPanel` `.chrome` variant uses `.ultraThinMaterial` backdrop blur — maps to AC-3
- [ ] `LSGlassPanel` `.callout(.signal)` adds 3pt leading stripe `color.signal.default` — maps to AC-4
- [ ] `LSGlassPanel` `.callout(.warning)` adds 3pt leading stripe `color.status.warning.default` — maps to AC-5
- [ ] Padding override resolves through `Spacing` enum (e.g., `.spacing(.spacing5)`) — maps to AC-6
- [ ] Raw `Color` rejected at compile-time on `AccentColor` API — maps to AC-7
- [ ] All 7 stories registered (Card Default, Card With Content, Panel Default, Panel Nested, GlassPanel Chrome, GlassPanel Callout signal, GlassPanel Callout warning) — maps to AC-8
- [ ] No literal Color references in three atom files — maps to AC-9
- [ ] iOS typecheck/build green; XCTest green; swiftformat clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSCard resolves color.surface.card / radius.lg / elevation.2 / padding spacing.4 [PRIMARY]
  GIVEN: An iOS SwiftUI view importing LaneShadowTheme
  WHEN:  Developer renders `LSCard { LSText("Hello") }`
  THEN:  Background == `theme.color.surface.card`, corner radius == `theme.radius.lg`, shadow == `theme.elevation.2` (radius+offset+opacity), inner padding == `theme.spacing.4`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSCardTests.swift
  TEST_FUNCTION: test_lscard_resolves_card_tokens
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSCardTests/test_lscard_resolves_card_tokens

AC-2: LSPanel resolves color.surface.primary / radius.md / no shadow / padding spacing.3
  GIVEN: An iOS SwiftUI view
  WHEN:  Developer renders `LSPanel { LSText("Inner") }`
  THEN:  Background == `theme.color.surface.primary`, corner radius == `theme.radius.md`, shadow == none (zero radius/opacity), inner padding == `theme.spacing.3`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSPanelTests.swift
  TEST_FUNCTION: test_lspanel_resolves_panel_tokens
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPanelTests/test_lspanel_resolves_panel_tokens

AC-3: LSGlassPanel .chrome variant uses .ultraThinMaterial backdrop blur 12-14pt
  GIVEN: `LSGlassPanel(variant: .chrome) { LSText("Chrome") }`
  WHEN:  Rendered
  THEN:  Background uses `Material.ultraThinMaterial` (resolved blur radius 12-14pt at standard reference), corner radius == `theme.radius.xl`, shadow == `theme.elevation.overlay`, foreground tint == `theme.color.surface.glass` overlay
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift
  TEST_FUNCTION: test_glasspanel_chrome_uses_ultrathinmaterial_backdrop
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSGlassPanelTests/test_glasspanel_chrome_uses_ultrathinmaterial_backdrop

AC-4: LSGlassPanel .callout(.signal) adds 3pt leading stripe color.signal.default
  GIVEN: `LSGlassPanel(variant: .callout(accent: .signal)) { LSText("Note") }`
  WHEN:  Rendered
  THEN:  Leading edge contains a 3pt-wide stripe colored `theme.color.signal.default`, ultraThinMaterial backdrop preserved, corner radius == `theme.radius.xl`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift
  TEST_FUNCTION: test_glasspanel_callout_signal_adds_3pt_stripe_signal_default
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSGlassPanelTests/test_glasspanel_callout_signal_adds_3pt_stripe_signal_default

AC-5: LSGlassPanel .callout(.warning) adds 3pt leading stripe color.status.warning.default
  GIVEN: `LSGlassPanel(variant: .callout(accent: .warning)) { LSText("Heads up") }`
  WHEN:  Rendered
  THEN:  Leading edge contains a 3pt-wide stripe colored `theme.color.status.warning.default`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift
  TEST_FUNCTION: test_glasspanel_callout_warning_adds_3pt_stripe_status_warning
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSGlassPanelTests/test_glasspanel_callout_warning_adds_3pt_stripe_status_warning

AC-6: Padding override resolves through Spacing enum (edge — composition)
  GIVEN: `LSCard(padding: .spacing5) { LSText("Roomy") }`
  WHEN:  Rendered
  THEN:  Inner padding == `theme.spacing.5` (override applied) and other tokens unchanged
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSCardTests.swift
  TEST_FUNCTION: test_padding_override_resolves_spacing_5
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSCardTests/test_padding_override_resolves_spacing_5

AC-7: Raw Color rejected at compile-time on AccentColor API (error gate — type-safety)
  GIVEN: LSGlassPanel callout API surface
  WHEN:  Developer attempts `LSGlassPanel(variant: .callout(accent: Color.red)) { ... }`
  THEN:  Swift compiler rejects — `accent` only accepts `AccentColor` enum
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSGlassPanelTypeSafetyTests.swift
  TEST_FUNCTION: test_accent_param_rejects_raw_Color
  VERIFY:        cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSGlassPanelTypeSafetyTests/test_accent_param_rejects_raw_Color

AC-8: All 7 surface stories registered with stable ids
  GIVEN: `ios/LaneShadow/Sandbox/Stories/LSSurfaceStories.swift`
  WHEN:  AtomStories.all is composed
  THEN:  Stories `atoms.card.default`, `atoms.card.with-content`, `atoms.panel.default`, `atoms.panel.nested`, `atoms.glasspanel.chrome`, `atoms.glasspanel.callout-signal`, `atoms.glasspanel.callout-warning` all exist with tier == `.atom`
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Stories/LSSurfaceStories.swift
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for s in atoms.card.default atoms.card.with-content atoms.panel.default atoms.panel.nested atoms.glasspanel.chrome atoms.glasspanel.callout-signal atoms.glasspanel.callout-warning; do grep -q "$s" ios/LaneShadow/Sandbox/Stories/LSSurfaceStories.swift || exit 1; done && grep -q 'LSSurfaceStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift

AC-9: No literal Color references in LSCard.swift / LSPanel.swift / LSGlassPanel.swift (error gate — boundary)
  GIVEN: The three atom files
  WHEN:  Reviewer greps
  THEN:  Zero matches for `Color(`, `Color\.[a-z]`, hex strings across all three files (AccentColor.swift internally maps enum→token but those resolutions happen via theme accessor)
  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Views/Atoms/
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\(|Color\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSCard.swift ios/LaneShadow/Views/Atoms/LSPanel.swift ios/LaneShadow/Views/Atoms/LSGlassPanel.swift

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | LSCard resolves surface.card / radius.lg / elevation.2 / spacing.4 padding | AC-1 | xcodebuild test …test_lscard_resolves_card_tokens |
| TC-2 | LSPanel resolves surface.primary / radius.md / no shadow / spacing.3 padding | AC-2 | xcodebuild test …test_lspanel_resolves_panel_tokens |
| TC-3 | LSGlassPanel .chrome uses ultraThinMaterial + radius.xl + elevation.overlay | AC-3 | xcodebuild test …test_glasspanel_chrome_uses_ultrathinmaterial_backdrop |
| TC-4 | LSGlassPanel .callout(.signal) leading 3pt stripe color.signal.default | AC-4 | xcodebuild test …test_glasspanel_callout_signal_adds_3pt_stripe_signal_default |
| TC-5 | LSGlassPanel .callout(.warning) leading 3pt stripe color.status.warning.default | AC-5 | xcodebuild test …test_glasspanel_callout_warning_adds_3pt_stripe_status_warning |
| TC-6 | LSCard padding override .spacing5 applied | AC-6 | xcodebuild test …test_padding_override_resolves_spacing_5 |
| TC-7 | Raw Color rejected on accent param at compile-time | AC-7 | xcodebuild test …test_accent_param_rejects_raw_Color |
| TC-8 | All 7 surface story ids registered + LSSurfaceStories aggregated | AC-8 | grep gate above |
| TC-9 | Zero literal Color references across 3 atom files | AC-9 | grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/LSCard.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSPanel.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSGlassPanel.swift (NEW)
- ios/LaneShadow/Views/Atoms/AccentColor.swift (NEW — typed enum .signal | .warning resolving via theme)
- ios/LaneShadow/Sandbox/Stories/LSSurfaceStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY — register LSSurfaceStories.all)
- ios/LaneShadowTests/Atoms/LSCardTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSPanelTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSGlassPanelTypeSafetyTests.swift (NEW)

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
- Use SwiftUI `.background(.ultraThinMaterial)` for the glass blur (do not hand-roll a `UIVisualEffectView` unless inspection requires it).
- Expose content via `@ViewBuilder` content closure for all three atoms.
- Use a typed `Spacing` enum (or generated equivalent) for padding overrides — never `CGFloat`.

⚠️ Ask First:
- Adding interactive (tappable) variants to any of the three atoms (belongs to a molecule wrapper).
- Adding additional callout accents beyond `.signal` / `.warning` (e.g., `.success`) — escalate to widen the AccentColor enum.
- Replacing `.ultraThinMaterial` with a custom blur if visual fidelity drifts.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Atoms/LSCard.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSPanel.swift (NEW)
- ios/LaneShadow/Views/Atoms/LSGlassPanel.swift (NEW)
- ios/LaneShadow/Views/Atoms/AccentColor.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/LSSurfaceStories.swift (NEW)
- ios/LaneShadow/Sandbox/LaneShadowStories.swift (MODIFY)
- ios/LaneShadowTests/Atoms/LSCardTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSPanelTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSGlassPanelTests.swift (NEW)
- ios/LaneShadowTests/Atoms/LSGlassPanelTypeSafetyTests.swift (NEW)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 9 ACs: dispatch swift-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-05-surface.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design source for card/panel/glass + callout stripe specifics

2. .spec/prds/v2/05-uc-atm.md
   - Lines: 171-220 (UC-ATM-05 section)
   - Focus: Canonical AC bullets; glass panel callout variant matrix

3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
   - Lines: all
   - Focus: Sibling task pattern — ContentColor enum design mirrors AccentColor approach (compile-time type safety)

4. tokens/platforms/swift/Sources/LaneShadowTheme/Theme.swift
   - Lines: all
   - Focus: ThemeProvider + generated `color.surface.*`, `color.signal.*`, `color.status.warning.*`, `radius.*`, `elevation.*`

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.atom

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence (TDD_STATE shows red before green per AC).
Gate 2: One test per behavioral AC (AC-1..AC-7 = test functions; AC-8..AC-9 = grep gates).
Gate 3: All XCTest pass — `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSCardTests` and `LSPanelTests` and `LSGlassPanelTests` and `LSGlassPanelTypeSafetyTests` exit 0.
Gate 4: Swift build green — `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build` exits 0.
Gate 5: swiftformat clean — `swiftformat --lint ios/LaneShadow/` exits 0.
Gate 6: No literal colors — grep gate above returns zero.
Gate 7: Stories registered — `grep -q 'LSSurfaceStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift` and 7 ids present.
Gate 8: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Android Compose implementation (UC-ATM-05-android — runs in parallel under kotlin-implementer).
- Tappable / interactive surface variants (belong to molecules).
- Additional callout accents (.success, .info) beyond .signal/.warning — escalate to widen AccentColor.
- Animated glass entry transitions — belongs to a molecule wrapper.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** No surface atoms exist on iOS. Cards, panels, and glass overlays would each be hand-rolled with `.background(Color.white).cornerRadius(12).shadow(...)`, defeating UC-TOK-02/03 and producing inconsistent elevation, blur, and corner geometry across the app.

**Gap:** Without the surface trio, every screen that needs a content container will inline `Color`, `cornerRadius`, and `shadow` parameters, making visual remediation and dark-mode parity fragile. Glass panels are particularly load-bearing for ride HUDs and overlay molecules planned for Sprint 4+.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; tests verify rendered token resolution + material backdrop semantics, not implementation strings.
- RED evidence present in TDD_STATE history.
- No literal Color references in any of the three atom files (grep gate).
- AccentColor enum compile-time rejection of raw Color verified.
- All 7 story ids registered + aggregated in LaneShadowStories.swift.

Should verify (≤5):
- API ergonomics — `LSCard { ... }`, `LSPanel { ... }`, `LSGlassPanel(variant:.chrome) { ... }` read naturally.
- Padding override consumes typed `Spacing` (no raw CGFloat leak).
- `.ultraThinMaterial` backdrop verified observably (snapshot or layer inspection).
- Callout stripe is exactly 3pt and leading-aligned (not 4pt or trailing).
- Light + dark mode both pass color resolution.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-01 (typography for inline content), UC-TOK-02 (color surface.* / signal.* / status.warning.*), UC-TOK-03 (spacing/radius/elevation), UC-TOK-05 (generated Swift theme)
Blocks:     UC-MOL-* (every card-shaped molecule), UC-ORG-*, UC-SCR-* (any glass overlay HUD)
Parallel:   UC-ATM-05-android (Android pair), UC-ATM-02-ios (button), UC-ATM-03-ios (input), UC-ATM-04-ios (display)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN iOS view WHEN LSCard rendered THEN bg=color.surface.card, radius=radius.lg, shadow=elevation.2, padding=spacing.4", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSCardTests/test_lscard_resolves_card_tokens" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN view WHEN LSPanel rendered THEN bg=color.surface.primary, radius=radius.md, no shadow, padding=spacing.3", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSPanelTests/test_lspanel_resolves_panel_tokens" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSGlassPanel(.chrome) WHEN rendered THEN background=.ultraThinMaterial, radius=radius.xl, shadow=elevation.overlay, glass tint=color.surface.glass", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSGlassPanelTests/test_glasspanel_chrome_uses_ultrathinmaterial_backdrop" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSGlassPanel(.callout(.signal)) WHEN rendered THEN 3pt leading stripe color.signal.default", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSGlassPanelTests/test_glasspanel_callout_signal_adds_3pt_stripe_signal_default" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSGlassPanel(.callout(.warning)) WHEN rendered THEN 3pt leading stripe color.status.warning.default", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSGlassPanelTests/test_glasspanel_callout_warning_adds_3pt_stripe_status_warning" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSCard(padding:.spacing5) WHEN rendered THEN inner padding=spacing.5 + other tokens unchanged", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSCardTests/test_padding_override_resolves_spacing_5" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN LSGlassPanel callout API WHEN raw Color passed as accent THEN compiler rejects (AccentColor enum only)", "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSGlassPanelTypeSafetyTests/test_accent_param_rejects_raw_Color" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN LSSurfaceStories.swift WHEN composed THEN 7 stories atoms.card.{default,with-content} + atoms.panel.{default,nested} + atoms.glasspanel.{chrome,callout-signal,callout-warning} registered + aggregated", "verify": "for s in atoms.card.default atoms.card.with-content atoms.panel.default atoms.panel.nested atoms.glasspanel.chrome atoms.glasspanel.callout-signal atoms.glasspanel.callout-warning; do grep -q \"$s\" ios/LaneShadow/Sandbox/Stories/LSSurfaceStories.swift || exit 1; done && grep -q 'LSSurfaceStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "GIVEN three atom files WHEN grep'd THEN zero literal Color references", "verify": "! grep -REn 'Color\\(|Color\\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSCard.swift ios/LaneShadow/Views/Atoms/LSPanel.swift ios/LaneShadow/Views/Atoms/LSGlassPanel.swift" },
    { "id": "TC-1", "type": "test_criterion", "description": "Card token resolution", "maps_to_ac": "AC-1", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSCardTests/test_lscard_resolves_card_tokens" },
    { "id": "TC-2", "type": "test_criterion", "description": "Panel token resolution", "maps_to_ac": "AC-2", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSPanelTests/test_lspanel_resolves_panel_tokens" },
    { "id": "TC-3", "type": "test_criterion", "description": "GlassPanel chrome ultraThinMaterial", "maps_to_ac": "AC-3", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSGlassPanelTests/test_glasspanel_chrome_uses_ultrathinmaterial_backdrop" },
    { "id": "TC-4", "type": "test_criterion", "description": "GlassPanel callout signal stripe", "maps_to_ac": "AC-4", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSGlassPanelTests/test_glasspanel_callout_signal_adds_3pt_stripe_signal_default" },
    { "id": "TC-5", "type": "test_criterion", "description": "GlassPanel callout warning stripe", "maps_to_ac": "AC-5", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSGlassPanelTests/test_glasspanel_callout_warning_adds_3pt_stripe_status_warning" },
    { "id": "TC-6", "type": "test_criterion", "description": "Padding override .spacing5", "maps_to_ac": "AC-6", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSCardTests/test_padding_override_resolves_spacing_5" },
    { "id": "TC-7", "type": "test_criterion", "description": "AccentColor rejects raw Color", "maps_to_ac": "AC-7", "verify": "cd ios && xcodebuild test -only-testing:LaneShadowTests/Atoms/LSGlassPanelTypeSafetyTests/test_accent_param_rejects_raw_Color" },
    { "id": "TC-8", "type": "test_criterion", "description": "All 7 surface story ids registered", "maps_to_ac": "AC-8", "verify": "for s in atoms.card.default atoms.card.with-content atoms.panel.default atoms.panel.nested atoms.glasspanel.chrome atoms.glasspanel.callout-signal atoms.glasspanel.callout-warning; do grep -q \"$s\" ios/LaneShadow/Sandbox/Stories/LSSurfaceStories.swift || exit 1; done" },
    { "id": "TC-9", "type": "test_criterion", "description": "Zero literal Color references in 3 surface atoms", "maps_to_ac": "AC-9", "verify": "! grep -REn 'Color\\(|Color\\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSCard.swift ios/LaneShadow/Views/Atoms/LSPanel.swift ios/LaneShadow/Views/Atoms/LSGlassPanel.swift" }
  ]
}
-->
