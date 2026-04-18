# UI-002B: Enforce theme token schema in Android

**Task ID:** UI-002B
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** kotlin-implementer
**Reviewer:** kotlin-reviewer
**Estimate:** 360 min
**Type:** [FEATURE] [INFRA]
**Status:** Planned
**Phase:** Foundation — Token Enforcement
**Quality Score:** 115/115

---

## BACKGROUND

UI-001 defines `tokens/theme.schema.json` and `tokens/theme.json` as the single semantic token contract. This task makes that contract **enforced in the Android app**: tokens are parsed from `tokens/theme.json`, validated against the schema at build time, and exposed to Jetpack Compose as a strongly-typed `Theme` API. Any drift between `tokens/theme.json` and the Android `Theme` surface fails the Android build before any component task can begin.

**Objective:** Make the JSON schema authoritative on Android — at build time, at type-check time, and at runtime.

**Success State:** A reviewer can mutate `tokens/theme.json` (add/remove/rename a token) and the Android Gradle build either updates automatically or fails with a clear schema-drift error; Compose screens consume tokens exclusively through the generated `LaneShadowTheme` API.

## CRITICAL CONSTRAINTS

### MUST
- Add a Gradle task (`validateThemeTokens`) that runs `pnpm tokens:validate` and is wired into `preBuild`; failing validation fails the Android build.
- Generate a Kotlin `LaneShadowTheme` object from `tokens/theme.json` (color, spacing, typography, radius, elevation, motion, opacity), wired to `MaterialTheme` light/dark via `isSystemInDarkTheme()`.
- Reject hardcoded UI primitives via a Detekt custom rule (or `ktlint` rule) covering `Color(0x…)` literals, magic `dp`/`sp` numbers, and hex string constructors outside the generated `Theme` file.
- Provide a Compose unit test that asserts every key in `tokens/theme.json` is reachable through the `LaneShadowTheme` API.

### NEVER
- Hand-edit generated theme Kotlin files — they must be regenerated from `tokens/theme.json`.
- Define Android-only token names that diverge from the JSON contract.
- Skip the build-time schema validation Gradle task.

### STRICTLY
- Any platform-specific value (e.g., Material elevation overlay shim) must be expressed as an explicit waiver inside a `LaneShadowTheme` extension file, not as a divergent token name.

## DELIVERABLES

- `android/app/src/main/java/com/laneshadow/ui/theme/Theme.generated.kt`
- `android/app/src/main/java/com/laneshadow/ui/theme/LaneShadowTheme.kt` (Compose wrapper)
- `android/buildSrc/src/main/kotlin/GenerateThemeTask.kt` — Gradle task
- `android/buildSrc/src/main/kotlin/ValidateThemeTokensTask.kt` — wraps `pnpm tokens:validate`
- `android/config/detekt/theme-rules.yml` — custom Detekt config forbidding raw color/dp literals in non-Theme files
- `android/app/src/test/java/com/laneshadow/ui/theme/ThemeContractTest.kt`

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** UI-001 produced `tokens/theme.json` and `tokens/theme.schema.json`.
**WHEN** `./android/gradlew assembleDebug` runs.
**THEN** The `validateThemeTokens` task runs as part of `preBuild` and fails the build on validation error.
**Verify:** `cd android && ./gradlew tasks --all | rg "validateThemeTokens"`

### AC-2
**GIVEN** Tokens are the single source of truth.
**WHEN** `Theme.generated.kt` is produced.
**THEN** Every key in `tokens/theme.json` is reachable through the typed `LaneShadowTheme` API, with light/dark color variants resolved via `isSystemInDarkTheme()`.
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.theme.ThemeContractTest`

### AC-3
**GIVEN** Sprint 2 forbids hardcoded UI primitives.
**WHEN** Detekt runs against the Android source tree.
**THEN** `Color(0x…)` literals, hex string constructors, and magic `dp`/`sp` values are flagged outside the generated Theme files.
**Verify:** `cd android && ./gradlew detekt`

### AC-4
**GIVEN** The generator must be reproducible.
**WHEN** `tokens/theme.json` changes.
**THEN** Re-running the generator (`./gradlew generateTheme`) produces a deterministic `Theme.generated.kt` whose key set matches the JSON exactly (no orphan members, no missing members).
**Verify:** `cd android && ./gradlew generateTheme && git diff --exit-code app/src/main/java/com/laneshadow/ui/theme/Theme.generated.kt`

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | Gradle wires schema validation into preBuild and fails on drift. | `cd android && ./gradlew tasks --all \| rg "validateThemeTokens"` |
| TC-2 | AC-2 | Every JSON token key is reachable through the typed LaneShadowTheme API. | `cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.theme.ThemeContractTest` |
| TC-3 | AC-3 | Detekt forbids raw color/dp literals outside the Theme files. | `cd android && ./gradlew detekt` |
| TC-4 | AC-4 | Generator output is deterministic and matches the JSON key set. | `cd android && ./gradlew generateTheme && git diff --exit-code app/src/main/java/com/laneshadow/ui/theme/Theme.generated.kt` |
| TC-5 | ALL | Android build remains green after enforcement is wired up. | `cd android && ./gradlew assembleDebug` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/UI-001-define-theme-token-json-schema.md`
4. `.spec/prds/native-rewrite/08-design-system.md`
5. `.spec/prds/native-rewrite/08b-android-component-map.md`
6. `.spec/prds/native-rewrite/08d-component-parity-spec.md`

## GUARDRAILS

### WRITE-ALLOWED
- `android/**`
- `tokens/README.md` (Android section only)

### WRITE-PROHIBITED
- `tokens/theme.schema.json` (owned by UI-001)
- `tokens/theme.json` (owned by UI-001)
- `ios/**`
- `server/**`
- `react-native/**`

### MUST
- Wire `validateThemeTokens` into `preBuild` so token drift fails Android compilation, not just at runtime.
- Keep the generator deterministic — same JSON in, same Kotlin out.

### MUST NOT
- Do not introduce Android-only token names.
- Do not allow raw `Color(0x…)` or magic `dp`/`sp` literals in non-Theme files.

## CODE PATTERN

**Reference:** `.spec/prds/native-rewrite/08b-android-component-map.md`

**Pattern:** `tokens/theme.json` → `GenerateThemeTask` (buildSrc) → `Theme.generated.kt` exposing `object LaneShadowTheme { object Color { val surfaceBackground: @Composable () -> androidx.compose.ui.graphics.Color }; object Spacing { val scale4: Dp } ... }`. Compose consumers reference `LaneShadowTheme.Color.surfaceBackground()` inside `MaterialTheme`.

**Anti-pattern:** Per-feature theme objects, hex `Color(0xFFAABBCC)` literals scattered across composables, or duplicate dp constants.

## DESIGN NOTES

- Use `Color(red, green, blue, alpha)` from validated JSON values; never `Color(0x…)` outside the generated file.
- Resolve light/dark via `isSystemInDarkTheme()` in the `LaneShadowTheme` wrapper; do not branch inside individual composables.
- Keep the generator in `buildSrc` so it has full Gradle/Kotlin tooling without polluting the app module.

## VERIFICATION GATES

- `pnpm tokens:validate`
- `cd android && ./gradlew validateThemeTokens generateTheme`
- `cd android && ./gradlew detekt`
- `cd android && ./gradlew assembleDebug`
- `cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.theme.ThemeContractTest`

## DEPENDENCIES

- UI-001

## CODING STANDARDS

- `.spec/prds/native-rewrite/08d-component-parity-spec.md` — token consumption rules
- `.spec/prds/native-rewrite/08-design-system.md` — schema contract
- `~/Projects/brain/docs/TDD-METHODOLOGY.md` — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- iOS enforcement (UI-002).
- Component translation (Phase B onward).
- React Native consumption refactor.
