# UC-ATM-03-android Evidence

## RED phase

### Unit tests before implementation

Command:

```bash
source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextFieldTest.default_state_resolves_border_radius_padding_tokens"
```

Observed failure excerpt:

```text
e: .../LSTextFieldTest.kt:19:94 Unresolved reference 'InputState'.
e: .../LSTextFieldTest.kt:17:23 Unresolved reference 'resolveLSInputPadding'.
e: .../LSTextAreaTest.kt:12:25 Unresolved reference 'resolveLSTextAreaVisibleRows'.
```

This was the intended RED state: the new input atom types and token-resolution helpers did not exist yet.

### Instrumentation tests before implementation

Command:

```bash
source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:compileDebugAndroidTestKotlin
```

Observed failure excerpt:

```text
e: .../LSTextFieldInstrumentationTest.kt:25:17 Unresolved reference 'LSTextField'.
e: .../LSTextAreaInstrumentationTest.kt:26:17 Unresolved reference 'LSTextArea'.
e: .../LSTextAreaInstrumentationTest.kt:36:50 Unresolved reference 'LSTextAreaVisibleRowsKey'.
```

This established RED coverage for the missing Compose atoms and their instrumentation semantics.

## GREEN / verification

### Unit tests

Command:

```bash
source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:testDebugUnitTest --tests "com.laneshadow.ui.atoms.LSTextFieldTest" --tests "com.laneshadow.ui.atoms.LSTextAreaTest"
```

Result: `BUILD SUCCESSFUL`

Covered:
- AC-1 / TC-1
- AC-2 / TC-2
- AC-3 / TC-3
- AC-5 / TC-5
- AC-6 helper coverage

### Android test compile

Command:

```bash
source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:compileDebugAndroidTestKotlin
```

Result: `BUILD SUCCESSFUL`

### Instrumentation tests

AVD boot:

```bash
emulator @Pixel_7_API_34 -no-snapshot -no-window -no-boot-anim -port 5554
adb -s emulator-5554 wait-for-device shell 'while [[ "$(getprop sys.boot_completed)" != "1" ]]; do sleep 1; done; echo booted'
```

Focused + textarea overflow tests:

```bash
source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.ui.atoms.LSTextFieldInstrumentationTest,com.laneshadow.ui.atoms.LSTextAreaInstrumentationTest
```

Result excerpt:

```text
> Task :app:connectedDebugAndroidTest
Starting 2 tests on Pixel_7_API_34(AVD) - 14
Finished 2 tests on Pixel_7_API_34(AVD) - 14
BUILD SUCCESSFUL
```

Covered:
- AC-4 / TC-4
- AC-6 / TC-6

### Compile

Command:

```bash
source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:compileDebugKotlin
```

Result: `BUILD SUCCESSFUL`

### Story registration gate

Command:

```bash
for s in default focused error disabled; do grep -q "atoms.textfield.$s" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt || exit 1; grep -q "atoms.textarea.$s" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSInputStories.kt || exit 1; done
```

Result: pass

Covered:
- AC-7 / TC-7

### Forbidden literal gate

Command:

```bash
! grep -REn 'Color\(0x|androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)|FontFamily\.(Serif|SansSerif|Monospace|Default)' android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSTextArea.kt
```

Result: pass

Covered:
- AC-8 / TC-8

### Release APK sandbox gate

Command:

```bash
source scripts/agent-worktree-env.sh && cd android && ./gradlew :app:assembleRelease
[ "$(unzip -l android/app/build/outputs/apk/release/app-release-unsigned.apk | grep -c com.nativesandbox)" = "0" ]
```

Result: pass

Notes:
- This repo currently emits `app-release-unsigned.apk`, not `app-release.apk`.
- The sandbox symbol count was `0`.

Covered:
- AC-9 / TC-9

## Verification gap

Command:

```bash
source scripts/agent-worktree-env.sh && cd android && ./gradlew tasks --all | rg -i detekt
```

Result: no matches; the documented `detekt` task does not exist in this Android build.

Assessment:
- This is a pre-existing repo/task-doc mismatch, not introduced by this change.
