---
stability: FEATURE_SPEC
last_validated: 2026-04-17
prd_version: 2.0.0
functional_group: DESIGN
parent: 08-design-system.md
refines: UC-DESIGN-01, UC-DESIGN-02, UC-DESIGN-03, UC-DESIGN-05
---

# Cross-Platform Theme Module — Implementation Design

> **v2.0.0 pivot (2026-04-17, same-day):** Codegen was replaced by runtime JSON decoding. `tokens/semantic/semantic.tokens.json` is bundled into each platform package (Swift Package resource, Android asset, TS workspace import) and decoded at app init via Codable / `@Serializable` / `resolveJsonModule`. **Style Dictionary and the drift gate are gone.** A lightweight `tokens/scripts/sync-bundled-json.js` mirrors the canonical JSON into the per-platform bundle paths (lefthook-enforced). Everything in this spec about codegen now describes the earlier approach; the **Architecture** and **What's in the module** sections below have been rewritten to match what shipped on `main`.

## Overview

Single source of truth (`tokens/semantic/semantic.tokens.json`) is bundled into three sibling platform packages under `tokens/platforms/{swift,kotlin,typescript}/`. Each package decodes the JSON at app init into typed DTOs and exposes an ergonomic Theme API. The native rewrite apps (`ios/`, `android/`) and the React Native app (`react-native/`) consume the module via their native package managers (Swift Package Manager, Gradle subproject, pnpm workspace).

**Authoritative principle:** parsing and theming logic live *outside* `ios/` and `android/`. Consumer apps `import` the module — JSON is decoded once at init, Theme values are cached, no native app ever parses tokens directly or defines theme structures locally.

---

## Goals

1. Single source of truth for tokens (`tokens/semantic/semantic.tokens.json`) drives all three platforms.
2. Theming *logic* (Theme struct, light/dark resolution, environment/composition-local wiring) is centralized in `tokens/platforms/{swift,kotlin,typescript}/` — not duplicated per consumer.
3. Bootstrap iOS and Android apps consume the module end-to-end, proving the integration works.
4. Generated files are committed and validated for drift in CI.
5. Schema validation gate (`pnpm tokens:validate`) continues to pass.

## Non-Goals

- ❌ React Native cutover — `react-native/styles/theme.ts` stays as-is. The TS module is *importable* but no consumer is migrated. Cutover is a separate task to allow clean visual-regression diffing.
- ❌ Atomic component library (UC-DESIGN-04). Six components ship in a separate sprint task.
- ❌ Cross-platform snapshot test infrastructure.
- ❌ Token versioning, CHANGELOG, or external publishing.
- ❌ Style Dictionary advanced features (transforms, references, aliases) beyond what the current JSON shape demands.
- ❌ Dynamic Type / accessibility scaling beyond what tokens already encode.

---

## Architecture

```
                ┌──────────────────────────────────────────┐
                │  tokens/semantic/semantic.tokens.json     │   ← source (W3C DTCG)
                │  tokens/schema/laneshadow-tokens.schema   │   ← contract (pre-commit enforced)
                └────────────────────┬─────────────────────┘
                                     │
                        ┌────────────┴────────────┐
                        │ tokens:sync (copy file) │   ← pre-commit gate
                        └────────────┬────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
  tokens/platforms/swift/     tokens/platforms/kotlin/     tokens/platforms/typescript/
  Resources/semantic.tokens   src/main/assets/             (no copy — imports
                              semantic.tokens.json          JSON directly from
  Sources/.../ThemeSchema     src/main/kotlin/.../          tokens/semantic/)
    (Codable DTOs)              ThemeSchema.kt
  Sources/.../ThemeLoader       (@Serializable DTOs)       src/index.ts
    (Bundle.module decode)    src/main/kotlin/.../          (unwraps DTCG inline)
  Sources/.../Theme.swift       ThemeLoader.kt
    (public API)                (Context.assets decode)
                              src/main/kotlin/.../
                                LaneShadowTheme.kt
                                (public composable)
        │                            │                            │
        ▼                            ▼                            ▼
  ios/LaneShadow              android/app                  react-native/  (deferred)
  imports as SPM              includes as Gradle subproj    imports as pnpm workspace
```

**Boundary rule:** the JSON is decoded ONCE at app init per platform; the Theme cached value is immutable. No runtime tree-walking of the raw JSON from consumer code. The Codable / `@Serializable` / TS interface layers are the type contract; the JSON file is the value contract.

---

## Module APIs

### Swift — `import LaneShadowTheme`

```swift
import SwiftUI
import LaneShadowTheme

@main struct LaneShadowApp: App {
    var body: some Scene {
        WindowGroup { ContentView().laneShadowTheme() }
    }
}

struct ContentView: View {
    @Environment(\.theme) var theme
    var body: some View {
        Text("hi")
            .font(theme.type.body.md)
            .foregroundStyle(theme.colors.onSurface.default)
            .padding(theme.space.lg)
            .background(theme.colors.surface.default)
    }
}
```

- Light/dark resolution: automatic via `UIColor(dynamicProvider:)` inside `Color` accessors.
- Domain tokens: `theme.domain.waypointOnRoute.default`, `theme.domain.enrichmentFast.default`.
- State variants: `.default` is required, `.hover/.pressed/.disabled/.focus` are optional and present only where the source JSON defines them.

### Kotlin — `import com.laneshadow.theme.*`

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LaneShadowTheme {  // wraps MaterialTheme; picks light/dark via isSystemInDarkTheme()
                val theme = LocalLaneShadowTheme.current
                Surface(color = theme.colors.surface.default) {
                    Text("hi", color = theme.colors.onSurface.default)
                }
            }
        }
    }
}
```

- `LaneShadowTheme { ... }` provides `LocalLaneShadowTheme` *and* wraps Material3 `MaterialTheme(colorScheme = ...)` so M3 components inherit the resolved palette.
- Domain tokens: `theme.domain.waypointOnRoute.default`.
- State variants exposed identically to Swift.

### TypeScript — `import { useTheme } from '@laneshadow/theme'`

```ts
import { useTheme } from '@laneshadow/theme'

const Component = () => {
  const { colors, space } = useTheme()
  return <View style={{ padding: space.lg, backgroundColor: colors.surface.default }} />
}
```

- Light/dark resolved via React Native `useColorScheme()`.
- Module is *importable* by `react-native/` and `server/` workspaces but no migration occurs in this work.

---

## Codegen Pipeline

**Tool:** Style Dictionary v4 (per parent PRD `08-design-system.md`, industry standard for DTCG → native).

**Layout:**
```
tokens/
├── config/
│   ├── style-dictionary.config.js        ← single config, three platform targets
│   └── formats/
│       ├── swift-tokens.js               ← custom Swift formatter
│       ├── kotlin-tokens.js              ← custom Kotlin formatter
│       └── typescript-tokens.js          ← custom TS formatter
├── scripts/
│   ├── build.js                          ← thin wrapper invoking SD
│   ├── check-drift.js                    ← regenerate to tmp + diff
│   └── validate-contract.js              ← exists, unchanged
└── platforms/
    ├── swift/
    │   ├── Package.swift
    │   └── Sources/LaneShadowTheme/
    │       ├── Generated/Tokens.swift   ← @generated, committed
    │       ├── Theme.swift
    │       ├── ThemeEnvironment.swift
    │       └── DomainColors.swift
    ├── kotlin/
    │   ├── build.gradle.kts
    │   └── src/main/kotlin/com/laneshadow/theme/
    │       ├── generated/Tokens.kt      ← @generated, committed
    │       ├── LaneShadowTheme.kt
    │       ├── LaneShadowColors.kt
    │       └── DomainColors.kt
    └── typescript/
        ├── package.json                  ← name: "@laneshadow/theme"
        ├── tsconfig.json
        └── src/
            ├── generated/tokens.ts       ← @generated, committed
            ├── index.ts                  ← useTheme hook + exports
            └── types.ts
```

**Codegen output shape** (per platform):

| Platform | Generated form |
|---|---|
| Swift | `enum Tokens { enum Color { enum Light { enum Primary { static let `default`: Color = ... } } } }` (zero-allocation namespace tree) |
| Kotlin | `object Tokens { object Color { object Light { object Primary { val default: Color = Color(0xFFB87333) } } } }` |
| TypeScript | `export const tokens = { color: { light: { primary: { default: '#B87333' } } } } as const` |

**All generated files:**
- Live under `Generated/` (Swift) or `generated/` (Kotlin/TS) directories.
- Begin with a `// @generated by tokens/scripts/build.js — do not edit` header.
- Are **committed to the repo**. CI fails on drift via `pnpm tokens:check-drift`.

**Build commands** (added to root `package.json`):
- `pnpm build:tokens` — regenerate all three platform outputs.
- `pnpm tokens:validate` — schema gate (exists, unchanged).
- `pnpm tokens:check-drift` — regenerate to `/tmp` and `git diff` against committed.

---

## Hand-Written Theming Layer

### Swift — `tokens/platforms/swift/Sources/LaneShadowTheme/`

| File | Purpose |
|---|---|
| `Generated/Tokens.swift` | codegen output; raw `enum Tokens` namespace |
| `Theme.swift` | `struct Theme { let colors, space, radius, type, elevation, motion, opacity, domain }`; resolves light/dark via `Color(uiColor: UIColor { trait in ... })` so SwiftUI auto-switches with system trait collection |
| `ThemeEnvironment.swift` | `EnvironmentValues.theme` extension + `View.laneShadowTheme()` modifier that injects the default `Theme.shared` |
| `DomainColors.swift` | `struct DomainColors { let waypointOnRoute, waypointOffRoute, waypointMixed, enrichmentFast, enrichmentExtended, enrichmentCached, deviationOriginalRoute, deviationDetourPath, deviationReconnectPoint }` |

### Kotlin — `tokens/platforms/kotlin/src/main/kotlin/com/laneshadow/theme/`

| File | Purpose |
|---|---|
| `generated/Tokens.kt` | codegen output |
| `LaneShadowTheme.kt` | `@Composable fun LaneShadowTheme(darkTheme: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit)` — provides `LocalLaneShadowTheme` *and* wraps `MaterialTheme(colorScheme = ..., typography = ..., content = content)` so M3 components inherit the palette |
| `LaneShadowColors.kt` | `data class LaneShadowColors(val primary: ColorSet, val secondary: ColorSet, ...)` with `data class ColorSet(val default: Color, val hover: Color?, val pressed: Color?, val disabled: Color?, val focus: Color?)` |
| `DomainColors.kt` | extended palette for waypoint / enrichment / deviation tokens |

### TypeScript — `tokens/platforms/typescript/src/`

| File | Purpose |
|---|---|
| `generated/tokens.ts` | codegen output |
| `index.ts` | `useTheme()` hook (resolves via `useColorScheme()` from `react-native`) + `useColors()`, `useSpace()` convenience hooks + type re-exports |
| `types.ts` | derived `Theme` type from token shape (`typeof tokens.color.light`, etc.) |

---

## Native App Integration

### iOS — replace `ios/LaneShadow/Theme.swift` placeholder

1. Edit `ios/LaneShadow.xcodeproj/project.pbxproj`:
   - Add `XCLocalSwiftPackageReference` block pointing at `relativePath = "../tokens/platforms/swift"`.
   - Add `XCSwiftPackageProductDependency` for product `LaneShadowTheme`.
   - Add the product to the `LaneShadow` target's `frameworksBuildPhase`.
2. **Delete** `ios/LaneShadow/Theme.swift` (placeholder enums `ThemeColor`, `ThemeSpacing`, `ThemeTypography`).
3. Update `ios/LaneShadow/ContentView.swift`: replace `ThemeColor.primaryText` etc. with `theme.colors.onSurface.default`, `ThemeSpacing.large` with `theme.space.xl`, etc.
4. Update `ios/LaneShadow/App.swift`: add `.laneShadowTheme()` modifier to the root `ContentView`.

### Android — add `:theme` Gradle subproject

1. Edit `android/settings.gradle.kts`:
   ```kotlin
   include(":theme")
   project(":theme").projectDir = file("../tokens/platforms/kotlin")
   ```
2. Edit `android/app/build.gradle.kts`: add `implementation(project(":theme"))`.
3. The new `tokens/platforms/kotlin/build.gradle.kts` declares itself as a `com.android.library`:
   - `compileSdk = 34`, `minSdk = 26` (matches `app`).
   - Compose enabled with `kotlinCompilerExtensionVersion = "1.5.14"` (matches `app`).
   - Kotlin 1.9.24, JVM 17 target (matches root project plugins block).
   - Depends on `androidx.compose.ui:ui` and `androidx.compose.material3:material3` from the same BOM `2024.06.00` as `app`.
4. Update `android/app/src/main/java/com/laneshadow/MainActivity.kt`:
   - Wrap `LaneShadowAppContent` in `LaneShadowTheme { ... }`.
   - Replace direct `MaterialTheme.colorScheme.*` accesses with `LocalLaneShadowTheme.current.colors.*` where semantic naming is preferred; M3 components keep working unchanged because `LaneShadowTheme` wraps `MaterialTheme` internally.

### React Native — workspace setup only (no cutover)

1. Add `tokens/platforms/typescript` to `pnpm-workspace.yaml` (alongside `server` and `react-native`).
2. Create `tokens/platforms/typescript/package.json` with `"name": "@laneshadow/theme"`, declared as workspace dep available to `react-native` and `server`.
3. Verify `pnpm install` resolves the workspace package without error.
4. **Do not** touch `react-native/styles/theme.ts`. RN cutover is a separate atomic task.

---

## Build Orchestration & Gates

**Root `package.json` script additions:**
```json
{
  "scripts": {
    "build:tokens": "node tokens/scripts/build.js",
    "tokens:check-drift": "node tokens/scripts/check-drift.js"
  }
}
```

**`lefthook.yml` additions** (existing `tokens:validate` job stays):
```yaml
- name: tokens:check-drift
  glob: "tokens/**/*"
  run: pnpm tokens:check-drift
```

`tokens:check-drift` exits non-zero if any generated file under `tokens/platforms/` differs from a fresh codegen run, with a message instructing the developer to run `pnpm build:tokens && git add tokens/platforms`.

**Verification gates per `RULES.md`:**

| Layer | Check |
|---|---|
| Tokens | `pnpm tokens:validate && pnpm tokens:check-drift` |
| iOS | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| Android | `./gradlew :app:assembleDebug` (verifies `:theme` builds + `:app` consumes it) |
| Server / RN | `pnpm type-check:native` (must pass with new workspace package present) |

A successful end-to-end check is: tokens validate clean, both native builds succeed, both bootstrap apps render text using theme-resolved colors, and `pnpm tokens:check-drift` confirms generated files match.

---

## Verification Plan

| Acceptance Criterion | How verified |
|---|---|
| `tokens/platforms/swift/Package.swift` declares a `LaneShadowTheme` library product | File exists, `swift package describe` succeeds in `tokens/platforms/swift/` |
| `tokens/platforms/kotlin/build.gradle.kts` is a buildable Android library | `./gradlew :theme:assembleRelease` succeeds from `android/` |
| `tokens/platforms/typescript/package.json` declares `@laneshadow/theme` | `pnpm install` succeeds; `pnpm --filter @laneshadow/theme exec tsc --noEmit` passes |
| All three generated token files have `@generated` header and pass schema | `pnpm build:tokens && pnpm tokens:check-drift` exits 0 |
| iOS bootstrap app renders using `theme.colors.onSurface.default` | `xcodebuild build` succeeds; `ios/LaneShadow/ContentView.swift` no longer references `ThemeColor.*` from the deleted placeholder |
| Android bootstrap app renders inside `LaneShadowTheme { }` | `./gradlew :app:assembleDebug` succeeds; `MainActivity.kt` uses `LocalLaneShadowTheme.current` |
| RN app continues to build unchanged | `pnpm type-check:native` passes; `react-native/styles/theme.ts` untouched |
| Light/dark resolution works on both native platforms | iOS: toggle `Environment(\.colorScheme)` in `#Preview`, observe color change; Android: toggle `darkTheme` parameter in `@Preview`, observe change |
| Lefthook drift gate fires on token edits | Edit `semantic.tokens.json`, attempt commit without rebuilding, observe `tokens:check-drift` failure |

---

## Decisions Made (Locked)

| Decision | Choice | Rationale |
|---|---|---|
| Module shape | Three sibling packages under `tokens/platforms/{swift,kotlin,typescript}/` | Each platform follows its native packaging idiom; honors "centralize logic outside ios/android" |
| Codegen tool | Style Dictionary v4 | Parent PRD locks this; industry standard for DTCG → native |
| Generated file fate | Committed to repo with `@generated` header; CI drift gate enforces freshness | Reviewers see diffs; no install step before `xcodebuild` / `gradle`; matches parent PRD |
| Swift codegen output shape | Nested `enum` namespaces with `static let` | Zero-allocation, type-safe, idiomatic constant containers |
| Kotlin codegen output shape | Nested `object` declarations with `val` | Idiomatic Kotlin singleton/namespace pattern |
| TypeScript codegen output shape | Deeply nested `as const` object | Preserves literal types for autocomplete; works with React Native |
| Light/dark resolution (iOS) | `Color(uiColor: UIColor(dynamicProvider:))` inside hand-written `Theme` accessors | Native iOS pattern; auto-switches with system trait |
| Light/dark resolution (Android) | `LaneShadowTheme(darkTheme = isSystemInDarkTheme())` selects which `LaneShadowColors` is provided to `LocalLaneShadowTheme` | Idiomatic Compose pattern; matches Material3 convention |
| Light/dark resolution (TypeScript) | `useColorScheme()` from `react-native` inside `useTheme()` hook | Idiomatic React Native pattern |
| Material3 wrapping (Android) | `LaneShadowTheme` internally wraps `MaterialTheme(...)` | M3 components (`Surface`, `Button`, etc.) inherit the resolved palette without explicit consumer wiring |
| RN cutover scope | Deferred to separate task | 40+ tokens in production code; visual regression risk; merits atomic commit |

---

## References

- Parent PRD: [`08-design-system.md`](./08-design-system.md)
- Token schema: [`tokens/schema/laneshadow-tokens.schema.json`](../../../tokens/schema/laneshadow-tokens.schema.json)
- Token source: [`tokens/semantic/semantic.tokens.json`](../../../tokens/semantic/semantic.tokens.json)
- Schema validator: [`tokens/scripts/validate-contract.js`](../../../tokens/scripts/validate-contract.js)
- W3C DTCG spec: <https://www.designtokens.org/tr/drafts/format/>
- Style Dictionary v4 docs: <https://styledictionary.com/>
