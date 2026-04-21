<!-- Task Template v5.1 | INFRA-adapted for sandbox/token foundation work -->

================================================================================
TASK: UC-SBX-00-android - Native-sandbox install + host wiring — Android
================================================================================

TASK_TYPE:  INFRA
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
SPRINT:     [sprint-01-foundation-tokens-and-v2-reset](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   180 min

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PRD_REFS:   UC-SBX-00, .spec/prds/v2/09-uc-sbx.md, .spec/prds/v2/11-technical-requirements.md
DEPENDS_ON: (none)
BLOCKS:     UC-SBX-05-android

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Long-press on Android debug boots an empty LaneShadowSandbox composable with LaneShadowTheme applied via NativeSandbox bridge.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER modify ~/Projects/native-sandbox/** or ~/Projects/native-theme/** — Android integrates via Gradle composite build only.
- MUST place all sandbox code in android/app/src/debug/java/** — release builds must NOT ship sandbox code.
- MUST use NativeSandbox APIs verbatim — LaneShadowThemeBridge implements com.nativesandbox.theming.ThemeController per RULES.md §6.
- MUST register stories with dotted tier-first IDs using FIXED ComponentTier enum — never extend.
- STRICTLY no hardcoded tokens — LaneShadowTheme Compose wrapper is the only token source.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

[ ] `~/Projects/native-sandbox/bin/install --platform android --path $(pwd)/android --yes` is idempotent — maps to AC-1 (PRIMARY)
[ ] LaneShadowSandbox.kt, LaneShadowThemeBridge.kt, SandboxEntry.kt exist in src/debug/ and compile clean
[ ] `adb shell am start -n com.laneshadow/.MainActivity --es com.laneshadow.extra.OPEN_SANDBOX true` boots sandbox on debug build
[ ] `./gradlew :app:compileDebugKotlin` + `./gradlew test` + detekt all pass
[ ] Only SCOPE.write_allowed files modified (git diff --name-only); nothing in src/main/

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Sandbox installer idempotent + composite build wired [PRIMARY]
  GIVEN: a clean LaneShadow checkout on main
  WHEN:  `bin/install --platform android` + `bin/scaffold --platform android` are each run twice
  THEN:  second runs are no-ops; settings.gradle.kts has includeBuild, app/build.gradle.kts has debugImplementation

  TDD_STATE:     none
  TEST_FILE:     android/settings.gradle.kts
  TEST_FUNCTION: n/a (INFRA)
  VERIFY:        grep -q "includeBuild" android/settings.gradle.kts && grep -q "debugImplementation.*native-sandbox" android/app/build.gradle.kts

AC-2: ThemeBridge implementation compiles
  GIVEN: LaneShadowThemeBridge.kt in src/debug/
  WHEN:  `./gradlew :app:compileDebugKotlin` runs
  THEN:  LaneShadowThemeBridge compiles and implements com.nativesandbox.theming.ThemeController

  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/theme/LaneShadowThemeBridge.kt
  TEST_FUNCTION: n/a
  VERIFY:        cd android && ./gradlew :app:compileDebugKotlin

AC-3: Long-press-to-open launches sandbox (edge: DEBUG only)
  GIVEN: debug APK installed on connected device/emulator
  WHEN:  launch intent with OPEN_SANDBOX=true fires
  THEN:  LaneShadowSandbox Activity/composable renders within 1s

  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/launch/SandboxEntry.kt
  TEST_FUNCTION: n/a
  VERIFY:        adb shell am start -n com.laneshadow/.MainActivity --es com.laneshadow.extra.OPEN_SANDBOX true && sleep 2 && adb shell dumpsys activity activities | grep -q LaneShadowSandbox

AC-4: Release build excludes sandbox symbols (error path)
  GIVEN: release variant
  WHEN:  `./gradlew :app:assembleRelease` runs
  THEN:  no com.laneshadow.sandbox.* classes appear in the release APK

  TDD_STATE:     none
  TEST_FILE:     android/app/build.gradle.kts
  TEST_FUNCTION: n/a
  VERIFY:        cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release-unsigned.apk | grep -c 'laneshadow/sandbox' | grep -qx 0

AC-5: Preview wrapper applies LaneShadowTheme (happy)
  GIVEN: a Story composable wrapped via previewWrapper
  WHEN:  rendered in LaneShadowSandbox
  THEN:  LocalLaneShadowTheme provides resolved ColorSet and TypographyStyle values

  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandbox.kt
  TEST_FUNCTION: n/a
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests '*PreviewWrapperTest*'


--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandbox.kt (NEW) — Compose root hosting NativeSandbox
- android/app/src/debug/java/com/laneshadow/sandbox/theme/LaneShadowThemeBridge.kt (NEW) — ThemeController implementation
- android/app/src/debug/java/com/laneshadow/sandbox/launch/SandboxEntry.kt (NEW) — intent + long-press launch
- android/settings.gradle.kts (MODIFY) — includeBuild("~/Projects/native-sandbox")
- android/app/build.gradle.kts (MODIFY) — debugImplementation dependency

writeProhibited:
- ~/Projects/native-sandbox/** (never modify sibling projects)
- ~/Projects/native-theme/** (never modify sibling projects)
- ios/** — wrong platform
- android/app/src/main/** — sandbox code is debug-only
- server/**, react-native/** — out of scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Apply PostCommit review: detekt + compileDebugKotlin + test clean before commit
- Use NativeSandbox APIs verbatim
- Keep sandbox code in src/debug/ — never src/main/

⚠️ Ask First:
- Adding any new Gradle dependency beyond native-sandbox composite
- Any change that would require modifying native-sandbox source
- Installing detekt (lefthook entry currently commented — confirm gate expectations)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandbox.kt (NEW): Compose entry hosting NativeSandbox
- android/app/src/debug/java/com/laneshadow/sandbox/theme/LaneShadowThemeBridge.kt (NEW): ThemeController bridge to LaneShadowTheme
- android/app/src/debug/java/com/laneshadow/sandbox/launch/SandboxEntry.kt (NEW): intent + long-press launch logic
- android/settings.gradle.kts (MODIFY): includeBuild for native-sandbox
- android/app/build.gradle.kts (MODIFY): debugImplementation dependency

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ~/Projects/native-sandbox/RULES.md [PRIMARY]
   - Lines: §§4–9
   - Focus: install/scaffold, SandboxRoot, ThemeController bridge pattern, SandboxLaunch — PRIMARY pattern source
2. .spec/prds/v2/concepts/designs.html
   - Lines: all
   - Focus: REQUIRED READING — visual design source for sandbox host shell
3. .spec/prds/v2/09-uc-sbx.md
   - Lines: UC-SBX-00 section
   - Focus: Android acceptance criteria
4. .spec/prds/v2/11-technical-requirements.md
   - Lines: sandbox runtime section
   - Focus: Gradle composite policy
5. ~/Projects/native-theme/README.md
   - Lines: Kotlin section
   - Focus: LaneShadowTheme Compose wrapper primitives

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References:
- /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/designs.html
- ~/Projects/native-sandbox/RULES.md §§4–9

Interaction notes:
- REQUIRED READING: /Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/designs.html
- Long-press shortcut documented in native-sandbox RULES.md §9

Pattern (to imitate):
```
@Composable fun LaneShadowSandbox() { SandboxRoot(theme = LaneShadowThemeBridge(LocalLaneShadowTheme.current)) }
```

Pattern source: ~/Projects/native-sandbox/RULES.md §6 (Kotlin section)

Anti-pattern (to avoid):
Placing sandbox code in src/main/; hardcoding colors inside LaneShadowThemeBridge; shipping #Preview composables outside Story wrappers.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS
--------------------------------------------------------------------------------

INFRA task — execute implementation_steps in order; run verification_checklist; no RED-GREEN-REFACTOR. Commit once verification_gates all pass.

### IMPLEMENTATION STEPS (INFRA — run in order)

1. 1. Run `~/Projects/native-sandbox/bin/install --platform android --path $(pwd)/android --yes` to wire composite build
2. 2. Run `~/Projects/native-sandbox/bin/scaffold --platform android --path $(pwd)/android --yes`
3. 3. Implement LaneShadowThemeBridge as com.nativesandbox.theming.ThemeController, mapping LaneShadowTheme tokens
4. 4. Implement LaneShadowSandbox composable embedding SandboxRoot with the bridge
5. 5. Wire SandboxEntry for long-press + OPEN_SANDBOX intent in MainActivity (debug only)
6. 6. Boot emulator, fire launch intent, verify sandbox renders
7. 7. Run detekt + compileDebugKotlin + test + assembleRelease (verify no sandbox classes in release APK); commit

### VERIFICATION CHECKLIST

- [ ] install idempotent
    - Command: `~/Projects/native-sandbox/bin/install --platform android --path $(pwd)/android --yes && ~/Projects/native-sandbox/bin/install --platform android --path $(pwd)/android --yes`
    - Expected: second run no-op
- [ ] composite wiring
    - Command: `grep -q includeBuild android/settings.gradle.kts && grep -q debugImplementation android/app/build.gradle.kts`
    - Expected: both match
- [ ] debug files exist, main clean
    - Command: `ls android/app/src/debug/java/com/laneshadow/sandbox && ! ls android/app/src/main/java/com/laneshadow/sandbox 2>/dev/null`
    - Expected: debug present, main absent
- [ ] launch intent opens sandbox
    - Command: `adb shell am start -n com.laneshadow/.MainActivity --es com.laneshadow.extra.OPEN_SANDBOX true`
    - Expected: sandbox Activity visible

--------------------------------------------------------------------------------
VERIFICATION GATES (run before declaring DONE)
--------------------------------------------------------------------------------

- **Typecheck clean** — `cd android && ./gradlew :app:compileDebugKotlin` → Exit 0
- **Tests pass** — `cd android && ./gradlew test` → Exit 0
- **Lint clean** — `cd android && ./gradlew detekt` → no errors (install detekt first if missing)
- **Release excludes sandbox** — `cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release-unsigned.apk | grep -c 'laneshadow/sandbox'` → 0

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

Implementer: **kotlin-implementer**
Rationale: Android wiring requires Gradle composite build, debug-source-set gating, and Compose bridging — kotlin-implementer owns the Android surface.
Reviewer: **kotlin-reviewer**

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

lefthook currently has detekt commented; confirm with user whether to uncomment as part of this task. If detekt is not installed, install and wire it.
