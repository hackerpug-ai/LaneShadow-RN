<!-- Task Template v5.1 | INFRA-adapted for sandbox/token foundation work -->

================================================================================
TASK: UC-SBX-00-ios - Native-sandbox install + host wiring — iOS
================================================================================

TASK_TYPE:  INFRA
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
SPRINT:     [sprint-01-foundation-tokens-and-v2-reset](./SPRINT.md)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   180 min

RUNTIME_COMMANDS:
  test:      xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --quiet ios/LaneShadow/Sandbox ios/LaneShadow/Launch

PRD_REFS:   UC-SBX-00, .spec/prds/v2/09-uc-sbx.md, .spec/prds/v2/11-technical-requirements.md
DEPENDS_ON: (none)
BLOCKS:     UC-SBX-05-ios

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Shake on iOS simulator boots an empty LaneShadowSandbox with LaneShadowTheme applied via NativeSandbox ThemeController.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER modify ~/Projects/native-sandbox/** or ~/Projects/native-theme/** — iOS integrates via SPM path references only.
- MUST use NativeSandbox APIs verbatim — LaneShadowThemeController conforms to NativeSandbox.ThemeController; previewWrapper uses SandboxRoot.previewWrapper as documented in native-sandbox RULES.md §§6–8.
- MUST gate all sandbox entry points with #if DEBUG — no sandbox code in release builds.
- MUST register stories with dotted tier-first IDs using the FIXED 6-tier ComponentTier enum ({atom|molecule|organism|template|infrastructure|screen}) — never extend the enum.
- STRICTLY no hardcoded colors/spacing/typography — LaneShadowTheme is the only token source.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

[ ] `~/Projects/native-sandbox/bin/install --platform ios --path $(pwd) --yes` is idempotent (second run is a no-op) — maps to AC-1 (PRIMARY)
[ ] LaneShadowSandbox.swift, LaneShadowThemeController.swift, LaneShadowPreviewWrapper.swift, SandboxLaunchConfig.swift all compile clean
[ ] `xcrun simctl io booted shake` boots the empty LaneShadowSandbox in the iOS simulator
[ ] `xcodebuild ... build` + `xcodebuild test` both pass; swiftformat clean
[ ] Only SCOPE.write_allowed files modified (git diff --name-only)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Sandbox installer idempotent + scaffold emits host files [PRIMARY]
  GIVEN: a clean LaneShadow checkout on main
  WHEN:  `bin/install --platform ios` then `bin/scaffold --platform ios` are run twice
  THEN:  second run is a no-op and LaneShadowSandbox/Theme/Launch host files exist

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Entry/LaneShadowSandbox.swift
  TEST_FUNCTION: n/a (INFRA — verified by file existence + build)
  VERIFY:        test -f ios/LaneShadow/Sandbox/Entry/LaneShadowSandbox.swift && test -f ios/LaneShadow/Sandbox/Theme/LaneShadowThemeController.swift && test -f ios/LaneShadow/Sandbox/Theme/LaneShadowPreviewWrapper.swift && test -f ios/LaneShadow/Launch/SandboxLaunchConfig.swift

AC-2: ThemeController conformance
  GIVEN: LaneShadowThemeController.swift compiled against NativeSandbox SPM
  WHEN:  xcodebuild build runs
  THEN:  LaneShadowThemeController is verified to conform to NativeSandbox.ThemeController

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Theme/LaneShadowThemeController.swift
  TEST_FUNCTION: n/a
  VERIFY:        xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build

AC-3: Shake-to-open launches sandbox (edge: DEBUG only)
  GIVEN: app installed in iOS simulator, DEBUG configuration
  WHEN:  `xcrun simctl io booted shake` is triggered
  THEN:  LaneShadowSandbox root presents within 1s with the empty-story placeholder

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Launch/SandboxLaunchConfig.swift
  TEST_FUNCTION: n/a
  VERIFY:        xcrun simctl io booted shake && sleep 2 && xcrun simctl listapps booted | grep -q com.laneshadow

AC-4: Release build excludes sandbox (error path)
  GIVEN: Release configuration
  WHEN:  xcodebuild -configuration Release builds
  THEN:  SandboxLaunch.configure is compiled out and LaneShadowSandbox symbols are not present

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Launch/SandboxLaunchConfig.swift
  TEST_FUNCTION: n/a
  VERIFY:        xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -configuration Release -destination 'generic/platform=iOS' -quiet ONLY_ACTIVE_ARCH=YES build

AC-5: Preview wrapper applies LaneShadowTheme
  GIVEN: a Story wrapped with laneShadowPreviewWrapper
  WHEN:  the story renders in LaneShadowSandbox
  THEN:  LaneShadowTheme.current environment value is populated and colors resolve via theme

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadow/Sandbox/Theme/LaneShadowPreviewWrapper.swift
  TEST_FUNCTION: n/a
  VERIFY:        xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/PreviewWrapperTests


--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Sandbox/Entry/LaneShadowSandbox.swift (NEW) — SwiftUI root that embeds NativeSandbox.SandboxRoot
- ios/LaneShadow/Sandbox/Theme/LaneShadowThemeController.swift (NEW) — conforms to NativeSandbox.ThemeController; exposes LaneShadowTheme
- ios/LaneShadow/Sandbox/Theme/LaneShadowPreviewWrapper.swift (NEW) — laneShadowPreviewWrapper { content } ViewModifier
- ios/LaneShadow/Launch/SandboxLaunchConfig.swift (NEW) — DEBUG-only SandboxLaunch.configure wiring
- ios/LaneShadow.xcodeproj/project.pbxproj (MODIFY) — add Sandbox/Launch groups + NativeSandbox SPM package dependency via xcodeproj gem

writeProhibited:
- ~/Projects/native-sandbox/** (never modify sibling projects)
- ~/Projects/native-theme/** (never modify sibling projects)
- android/** — wrong platform
- server/**, react-native/** — out of scope
- ios/LaneShadow/** outside listed paths — keep blast radius minimal

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Apply PostCommit review: swiftformat + xcodebuild build clean before commit
- Use NativeSandbox APIs verbatim — do not re-implement ThemeController or SandboxRoot
- Gate all sandbox entry points with #if DEBUG

⚠️ Ask First:
- Adding any new SPM package beyond native-sandbox + native-theme
- Modifying xcodeproj settings beyond Sandbox/Launch group + SPM dep
- Any change that would require touching native-sandbox source

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Sandbox/Entry/LaneShadowSandbox.swift (NEW): SwiftUI root hosting NativeSandbox.SandboxRoot with LaneShadowThemeController
- ios/LaneShadow/Sandbox/Theme/LaneShadowThemeController.swift (NEW): ThemeController conformance bridging LaneShadowTheme to NativeSandbox
- ios/LaneShadow/Sandbox/Theme/LaneShadowPreviewWrapper.swift (NEW): laneShadowPreviewWrapper ViewModifier for stories
- ios/LaneShadow/Launch/SandboxLaunchConfig.swift (NEW): DEBUG-only SandboxLaunch.configure call wired from AppDelegate/SceneDelegate
- ios/LaneShadow.xcodeproj/project.pbxproj (MODIFY): NativeSandbox SPM package + Sandbox/Launch groups

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ~/Projects/native-sandbox/RULES.md [PRIMARY]
   - Lines: §§4–9
   - Focus: install/scaffold, SandboxRoot, previewWrapper, ThemeController, SandboxLaunch, Story contract — PRIMARY pattern source
2. .spec/prds/v2/concepts/designs.html
   - Lines: all
   - Focus: REQUIRED READING — visual design source for sandbox host shell
3. .spec/prds/v2/09-uc-sbx.md
   - Lines: UC-SBX-00 section
   - Focus: acceptance criteria for iOS host wiring
4. .spec/prds/v2/11-technical-requirements.md
   - Lines: sandbox runtime section
   - Focus: SPM path-ref policy
5. ~/Projects/native-theme/README.md
   - Lines: Swift section
   - Focus: LaneShadowTheme primitives used by ThemeController

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References:
- /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/designs.html
- ~/Projects/native-sandbox/RULES.md §§4–9

Interaction notes:
- REQUIRED READING: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/designs.html
- Shake-to-open gesture documented in native-sandbox RULES.md §9

Pattern (to imitate):
```
struct LaneShadowSandbox: View { var body: some View { SandboxRoot(theme: LaneShadowThemeController()) } }
```

Pattern source: ~/Projects/native-sandbox/RULES.md §6

Anti-pattern (to avoid):
Reimplementing SandboxRoot in-app; hardcoding colors inside LaneShadowThemeController; adding #Preview {} outside Story wrappers.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

INFRA task — execute implementation_steps in order; run verification_checklist; no RED-GREEN-REFACTOR. Commit once verification_gates all pass.

### IMPLEMENTATION STEPS (INFRA — run in order)

1. 1. Run `~/Projects/native-sandbox/bin/install --platform ios --path $(pwd) --yes` to add SPM path dependency
2. 2. Run `~/Projects/native-sandbox/bin/scaffold --platform ios --path $(pwd) --yes` to generate host file stubs
3. 3. Flesh out LaneShadowSandbox.swift to embed NativeSandbox.SandboxRoot with theme injection
4. 4. Implement LaneShadowThemeController conforming to NativeSandbox.ThemeController — map LaneShadowTheme colors/typography
5. 5. Implement LaneShadowPreviewWrapper as a View extension laneShadowPreviewWrapper { content }
6. 6. Wire SandboxLaunchConfig.configure() from App entry inside #if DEBUG
7. 7. Boot simulator, run shake, verify sandbox opens
8. 8. Run swiftformat + xcodebuild build + xcodebuild test; commit

### VERIFICATION CHECKLIST

- [ ] install idempotent
    - Command: `~/Projects/native-sandbox/bin/install --platform ios --path $(pwd) --yes && ~/Projects/native-sandbox/bin/install --platform ios --path $(pwd) --yes`
    - Expected: second run reports no changes
- [ ] host files exist
    - Command: `ls ios/LaneShadow/Sandbox/Entry/LaneShadowSandbox.swift ios/LaneShadow/Sandbox/Theme/LaneShadowThemeController.swift ios/LaneShadow/Sandbox/Theme/LaneShadowPreviewWrapper.swift ios/LaneShadow/Launch/SandboxLaunchConfig.swift`
    - Expected: all 4 present
- [ ] shake opens sandbox
    - Command: `xcrun simctl io booted shake`
    - Expected: LaneShadowSandbox visible in booted simulator
- [ ] DEBUG-only gating
    - Command: `grep -R "#if DEBUG" ios/LaneShadow/Launch/SandboxLaunchConfig.swift`
    - Expected: at least 1 match

--------------------------------------------------------------------------------
VERIFICATION GATES (run before declaring DONE)
--------------------------------------------------------------------------------

- **Build clean** — `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build` → Exit 0
- **Tests pass** — `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` → Exit 0
- **Lint clean** — `swiftformat --quiet ios/LaneShadow/Sandbox ios/LaneShadow/Launch` → no changes

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

Implementer: **swift-implementer**
Rationale: iOS host wiring requires SwiftUI, SPM integration, xcodeproj manipulation, and LaneShadowTheme bridging — swift-implementer owns the iOS surface.
Reviewer: **swift-reviewer**

--------------------------------------------------------------------------------
CODING STANDARDS
--------------------------------------------------------------------------------

- /Users/justinrich/Projects/LaneShadow/CLAUDE.md
- /Users/justinrich/Projects/LaneShadow/RULES.md
- ~/Projects/native-sandbox/RULES.md
- ~/Projects/native-theme/README.md
- ~/.claude/CLAUDE.md (commit discipline)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

This task unblocks UC-SBX-05-ios. LaneShadowTheme will initially reference the UC-TOK-05-generated Swift tokens — until TOK-05 lands, it may reference placeholder literals but these MUST be replaced before sprint gate.
