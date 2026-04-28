================================================================================
TASK: FID-S01-T01 - iOS Newsreader Serif Typography Rollout
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  lint: swiftformat --lint {files}
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-6 not started

--------------------------------------------------------------------------------
OUTCOME (1 sentence, ≤30 words — observable success)
--------------------------------------------------------------------------------

All six designated iOS components render body/headline text in Newsreader serif typography (opinion-xl/lg/md, label-sm) instead of Geist sans proxies.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use Geist `heading.md` as a proxy for `opinion.md` — this IS the distortion
- NEVER hardcode font family names — use theme typography tokens (`.t-opinion-xl`, `.t-opinion-lg`, `.t-opinion-md`, `.t-label-sm`)
- MUST read each component's current typography implementation before changing
- MUST use the theme's type system: `theme.type.opinion.xl`, `theme.type.opinion.lg`, `theme.type.opinion.md`
- STRICTLY preserve existing layout, spacing, and color — only change font family/weight/style

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] IdleScreen greeting headline renders in Newsreader opinion-xl italic serif (AC-1 PRIMARY)
- [ ] SessionsDrawer "Rides" header renders in Newsreader opinion-lg italic (AC-2)
- [ ] LSInlineErrorCallout + LSNavigatorMessage body text renders in Newsreader opinion-md (AC-3)
- [ ] LSTopBar centered title renders in Newsreader opinion-md (AC-4)
- [ ] LSSectionHeader caps variant renders in label-sm (AC-5)
- [ ] Dark mode renders correctly with all serif changes (AC-6)
- [ ] `cd ios && xcodebuild build` passes + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified (git diff --name-only)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: IdleScreen greeting headline typography [PRIMARY]
  GIVEN: IdleScreen is displayed in sandbox on iOS Simulator
  WHEN:  The greeting headline ("Where are we riding today?") renders
  THEN:  Text uses Newsreader serif font family at opinion-xl size with italic style

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/TypographyTests.swift
  TEST_FUNCTION: testIdleScreenGreetingOpinionXL

AC-2: SessionsDrawer "Rides" header typography
  GIVEN: SessionsDrawer is displayed in sandbox on iOS Simulator
  WHEN:  The "Rides" header text renders
  THEN:  Text uses Newsreader serif font family at opinion-lg size with italic style

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/TypographyTests.swift
  TEST_FUNCTION: testSessionsDrawerRidesOpinionLGItalic

AC-3: Error callout + navigator message body typography
  GIVEN: LSInlineErrorCallout and LSNavigatorMessage are displayed in sandbox
  WHEN:  The body text paragraph renders in both components
  THEN:  Text uses Newsreader serif font family at opinion-md size

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/TypographyTests.swift
  TEST_FUNCTION: testCalloutBodyOpinionMD

AC-4: LSTopBar centered title typography
  GIVEN: LSTopBar is displayed with a centered title
  WHEN:  The title text renders
  THEN:  Text uses Newsreader serif font family at opinion-md size

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/TypographyTests.swift
  TEST_FUNCTION: testTopBarTitleOpinionMD

AC-5: LSSectionHeader caps variant typography
  GIVEN: LSSectionHeader is displayed with caps titleStyle variant
  WHEN:  The title text renders
  THEN:  Text uses label-sm typography with tertiary color (not title.md)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/TypographyTests.swift
  TEST_FUNCTION: testSectionHeaderCapsLabelSM

AC-6: Dark mode typography consistency
  GIVEN: Device is in dark mode and all six components are displayed
  WHEN:  Each component renders its text
  THEN:  All serif typography renders correctly with proper dark-mode color tokens

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/TypographyTests.swift
  TEST_FUNCTION: testDarkModeTypographyConsistency

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Screens/IdleScreen.swift (MODIFY)
- ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift (MODIFY)
- ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift (MODIFY)
- ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift (MODIFY)
- ios/LaneShadow/Views/Molecules/AppHeader.swift (MODIFY)
- ios/LaneShadow/Views/Organisms/LSSectionHeader.swift (MODIFY)
- ios/LaneShadowTests/Sandbox/TypographyTests.swift (NEW)

writeProhibited:
- android/** — this is iOS-specific work
- server/** — no backend changes in this sprint
- react-native/** — read-only reference
- Any file not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First) — Never tier lives at CRITICAL CONSTRAINTS above
--------------------------------------------------------------------------------

✅ Always:
- Use theme typography tokens for all font changes
- Verify each component renders in sandbox after changes
- Preserve existing layout constraints and spacing

⚠️ Ask First:
- Adding new theme token definitions if opinion tokens don't exist yet
- Changing any color tokens (this task is typography-only)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Screens/IdleScreen.swift (MODIFY): Replace heading.md proxy with opinion-xl serif for greeting
- ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift (MODIFY): Replace title.lg with opinion-lg italic for "Rides"
- ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift (MODIFY): Replace heading.md proxy with opinion-md serif
- ios/LaneShadow/Views/Organisms/LSNavigatorMessage.swift (MODIFY): Replace heading.md proxy with opinion-md serif
- ios/LaneShadow/Views/Molecules/AppHeader.swift (MODIFY): Replace title.md with opinion-md serif for centered title
- ios/LaneShadow/Views/Organisms/LSSectionHeader.swift (MODIFY): Add titleStyle enum, use label-sm for caps variant
- ios/LaneShadowTests/Sandbox/TypographyTests.swift (NEW): Typography verification tests

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ:   Current AC definition, existing typography usage in target file, theme type system
  WRITE:  ONE test that verifies the component uses the correct typography token
  RUN:    xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  VERIFY: Test FAILS (component currently uses wrong font)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

  Always: Show actual test failure output.
  Never:  Write ANY implementation code in RED phase.

### GREEN PHASE
  READ:   Failing test, AC definition, theme type definitions
  WRITE:  MINIMAL code to swap the typography token (e.g., .font(theme.type.opinion.xl))
  RUN:    xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  VERIFY: Test PASSES
  RETURN: { phase: "GREEN", files_changed, test_output }

  Always: Write the smallest change that turns the test green.
  Never:  Add features beyond the current AC.

### REFACTOR PHASE
  READ:   Implementation just written
  WRITE:  Improved code (if needed — e.g., extract shared serif helper if patterns repeat)
  RUN:    xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  VERIFY: Tests still pass
  RETURN: { phase: "REFACTOR", files_changed, still_passing }

  Always: Keep tests green throughout.
  Never:  Introduce new behavior in REFACTOR.

## AFTER ALL ACs COMPLETE:
  Run full iOS build: xcodebuild build
  Run native compliance: scripts/tokens/enforce-native-compliance.sh
  Verify in sandbox: open each modified component story and confirm serif renders

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. ios/LaneShadow/Theme/LSTypography.swift [PRIMARY PATTERN]
   - Lines: all
   - Focus: How theme.type tokens are defined — look for opinion-xl/lg/md and label-sm

2. ios/LaneShadow/Views/Screens/IdleScreen.swift
   - Lines: all
   - Focus: Current greeting headline typography (likely using heading.md)

3. ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift
   - Lines: all
   - Focus: Current "Rides" header typography (likely using title.lg)

4. .spec/design/system/views/idle-screen/idle-screen.html
   - Sections: greeting headline, meta row
   - Focus: Newsreader serif reference for opinion-xl

5. .spec/prds/v3-integration/remediations/01-views-idle-planning.md
   - Sections: Gap E-01 (typography), Gap D-01 (meta color)
   - Focus: Detailed description of what's wrong and what to fix

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first — fail fast)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: TypographyTests.swift contains one test per AC.

Gate 3: All tests pass
  Command: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  Expected: Exit 0.

Gate 4: Type check / build
  Command: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet build
  Expected: Exit 0.

Gate 5: Native compliance
  Command: scripts/tokens/enforce-native-compliance.sh
  Expected: Exit 0, no hardcoded tokens.

Gate 6: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Changing any color tokens (meta row copper is T05 scope)
- Map slot replacement (T02)
- Android typography (separate sprint tasks)
- Adding new theme tokens if opinion tokens already exist

--------------------------------------------------------------------------------
CONTEXT (read if unclear)
--------------------------------------------------------------------------------

**Current state:** iOS uses Geist `heading.md` / `title.md` / `title.lg` as proxies for Newsreader serif opinion variants across 6 components. Comments in code say "Use heading.md as proxy for opinion.md."

**Gap:** The design system defines Newsreader serif at opinion-xl/lg/md sizes for these elements, but iOS native implementations substitute Geist sans equivalents, producing the most visible typographic distortion in the sandbox.

--------------------------------------------------------------------------------
REVIEW (for swift-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5, evidence-gate-backed):
- One test per AC; tests verify font-family token usage not implementation details
- RED evidence present in TDD_STATE history
- Minimal implementation; only typography tokens changed
- Pattern consistent with READING LIST theme type system
- SCOPE respected (git diff --name-only ⊆ writeAllowed)

Should verify (≤5, judgment):
- No layout regressions from font family change (serif is wider than sans)
- Dark mode renders correctly with new fonts
- Accessibility: Dynamic Type still works with opinion tokens

Verdict: [APPROVED | NEEDS_FIXES]
Feedback (required if NEEDS_FIXES):
```
[Specific, actionable issues — reference file:line where possible]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: None
Blocks:     FID-S01-T09 (verification needs serif rendering confirmed)
Parallel:   FID-S01-T02, FID-S01-T03, FID-S01-T04, FID-S01-T05, FID-S01-T06, FID-S01-T07

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN IdleScreen is displayed WHEN greeting headline renders THEN text uses Newsreader serif opinion-xl italic", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN SessionsDrawer is displayed WHEN Rides header renders THEN text uses Newsreader serif opinion-lg italic", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSInlineErrorCallout and LSNavigatorMessage display WHEN body text renders THEN text uses Newsreader serif opinion-md", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSTopBar displays centered title WHEN title renders THEN text uses Newsreader serif opinion-md", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSSectionHeader displays caps variant WHEN title renders THEN text uses label-sm with tertiary color", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN device in dark mode and all six components displayed WHEN text renders THEN all serif typography renders correctly with dark-mode color tokens", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "TC-1", "type": "test_criterion", "description": "IdleScreen greeting font family is Newsreader at opinion-xl size", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/TypographyTests/testIdleScreenGreetingOpinionXL" },
    { "id": "TC-2", "type": "test_criterion", "description": "SessionsDrawer Rides header font family is Newsreader at opinion-lg italic", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/TypographyTests/testSessionsDrawerRidesOpinionLGItalic" },
    { "id": "TC-3", "type": "test_criterion", "description": "Error callout body font family is Newsreader at opinion-md", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/TypographyTests/testCalloutBodyOpinionMD" },
    { "id": "TC-4", "type": "test_criterion", "description": "TopBar title font family is Newsreader at opinion-md", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/TypographyTests/testTopBarTitleOpinionMD" },
    { "id": "TC-5", "type": "test_criterion", "description": "SectionHeader caps title uses label-sm token with tertiary color", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/TypographyTests/testSectionHeaderCapsLabelSM" },
    { "id": "TC-6", "type": "test_criterion", "description": "Dark mode renders all serif typography without layout breakage", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/TypographyTests/testDarkModeTypographyConsistency" }
  ]
}
-->
