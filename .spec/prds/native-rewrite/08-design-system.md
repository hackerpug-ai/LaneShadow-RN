---
stability: FEATURE_SPEC
last_validated: 2026-04-17
prd_version: 1.0.0
functional_group: DESIGN
---

# Design System — Cross-Platform Token Architecture

## Overview

LaneShadow's native rewrite requires a unified design system that works across React Native, Android (Kotlin/Compose), and iOS (Swift/SwiftUI). The current `styles/theme.ts` contains 40+ semantic color tokens, typography scale, spacing system, border radius scale, elevation system, and domain-specific tokens (waypoints, enrichment, deviations).

This PRD defines a three-layer architecture:

1. **Token Source** — W3C DTCG standard JSON at `tokens/semantic/semantic.tokens.json`
2. **Bundle Sync** — `pnpm tokens:sync` mirrors that canonical JSON into the Swift and Kotlin package resource paths using `../native-theme/scripts/sync-bundled-json.js --config tokens/sync.config.json`
3. **Platform-Native Theming** — React Native, SwiftUI, and Compose load the same semantic JSON at runtime while relying on `../native-theme` primitives for shared parsing and token-state semantics

### Atom-First Delivery Model (effective 2026-04-17)

Tokens are the foundation of a larger **atom-first** commitment: all 195 UI components defined in `08a-atomic-component-catalog.md`, `08b-android-component-map.md`, `08c-ios-component-map.md`, and `08d-component-parity-spec.md` are built **up-front in Sprint 2** before any feature wiring begins.

Every use case in files `09-` through `16-` declares its consumed components inline via a `UI Components (from Sprint 2)` block. Feature sprints 3–10 consume these components by exact name; they never build new UI components inline.

When a UC requires a composition not in the 195-component catalog (flagged under `New Compositions Needed:` in the UC file), the composition is added to `08a` (with parity spec in `08d`) and absorbed into Sprint 2 via `/kb-sprint-plan --delta-replan` before the consuming feature sprint begins. The delta flow preserves unchanged Sprint-2 tasks, regenerates only affected sprints, and appends new composition tasks with dual Android/iOS coverage.

### Key Mappings (LaneShadow → Native)

| Token Path (TypeScript) | SwiftUI | Compose |
|------------------------|---------|---------|
| `theme.semantic.color.primary.default` | `Theme.Colors.primary` | `MaterialTheme.colorScheme.primary` |
| `theme.semantic.space.md` | `Spacing.md` | `MaterialTheme.spacing.md` |
| `theme.semantic.type.body.md` | `Theme.Typography.bodyMd` | `MaterialTheme.typography.bodyMedium` |
| Domain tokens (waypoint colors, deviation paths, enrichment phases) | `@Immutable` data classes / Environment values | Extended `ColorScheme` with domain properties |

### What Already Exists in `styles/theme.ts`

- **40+ color tokens** across light/dark with state variants (default/hover/pressed/disabled)
- **Typography scale**: label/body/title/heading/display × sm/md/lg
- **Spacing system**: 4pt grid (xs/sm/md/lg/xl/2xl/3xl/4xl)
- **Border radius scale**: none/sm/md/lg/xl/2xl/full
- **Elevation system**: 0-5 with platform-specific shadows
- **Domain-specific tokens**:
  - Waypoint colors (onRoute/offRoute/mixed)
  - Enrichment phase colors (fast/extended/cached)
  - Deviation path colors (originalRoute/detourPath/reconnectPoint)
  - Location POI colors (fill/ring/muted/bg)

All defined in `SemanticTheme` TypeScript type in `styles/types.ts`.

---

## Use Cases

| ID | Title | Description |
|----|-------|-------------|
| UC-DESIGN-01 | Token Extraction Pipeline | Extract `styles/theme.ts` to W3C DTCG JSON + Style Dictionary build |
| UC-DESIGN-02 | SwiftUI Theme Integration | Generated Swift tokens consumed by SwiftUI Environment |
| UC-DESIGN-03 | Compose Theme Integration | Generated Kotlin tokens consumed by MaterialTheme |
| UC-DESIGN-04 | Atomic Component Library — Foundation | Define atom hierarchy + create first 6 platform-agnostic components |
| UC-DESIGN-05 | Design Token CI/CD | Pre-commit + CI validation for token schema integrity |

---

## UC-DESIGN-01: Token Extraction Pipeline

Extract all existing `styles/theme.ts` semantic tokens to W3C DTCG JSON format and lock the no-build delivery contract: one canonical JSON source, synchronized bundled copies for native packages, and runtime theme loaders built on `../native-theme` primitives.

### Acceptance Criteria

- ☐ `tokens/semantic/semantic.tokens.json` exists and is the single source-of-truth token tree (W3C DTCG-shaped JSON)
- ☐ Token contract is derived from `react-native/styles/types.ts` + `react-native/styles/theme.ts` as the authoritative shape-of-record (do not edit RN files to satisfy token tooling)
- ☐ Token contract covers: `color`, `space`, `type`, `radius`, `elevation`, `motion`, `opacity`
- ☐ Light/dark mode is modeled explicitly as:
  - `semantic.color.light.*` and `semantic.color.dark.*`
  - `semantic.elevation.light.*` and `semantic.elevation.dark.*`
- ☐ State variants exist where applicable: `default` (required), plus `hover`, `pressed`, `disabled`, `focus` (optional)
- ☐ `tokens/sync.config.json` defines the canonical mirror contract for bundled copies consumed by the Swift and Kotlin theme packages
- ☐ `pnpm tokens:sync` mirrors `tokens/semantic/semantic.tokens.json` into:
  - `tokens/platforms/swift/Sources/LaneShadowTheme/Resources/semantic.tokens.json`
  - `tokens/platforms/kotlin/src/main/assets/semantic.tokens.json`
  - `tokens/platforms/kotlin/src/test/resources/semantic.tokens.json`
- ☐ React Native consumes the canonical JSON directly through `tokens/platforms/typescript/src/index.ts` with no generated `react-native/styles/generated/tokens.ts` dependency
- ☐ `../native-theme` is the shared primitives dependency for Swift, Kotlin, and TypeScript; LaneShadow does not require a Style Dictionary codegen step or `build:tokens` command for the locked Sprint 2 contract
- ☐ Token JSON validates against W3C DTCG schema in CI

### Technical Requirements

- **W3C DTCG Format Module 2025.10 compliance** — Use official `$meta` and `$type` fields
- **Token file naming**: `{category}/{semantic-name}.json` (kebab-case)
- **Token group naming**: PascalCase for public component and theme APIs across RN, Swift, and Kotlin
- **Shared primitives dependency**: `../native-theme` provides `ColorSet`, `TypographyStyle`, `ElevationStyle`, color parsing, and sync tooling
- **Legacy note**: the repo still contains early Style Dictionary experiments under `config/style-dictionary*`, but they are not the canonical Sprint 2 delivery path and should not be used to redefine the token contract

---

## UC-DESIGN-02: SwiftUI Theme Integration

Create SwiftUI theme infrastructure that consumes bundled semantic JSON through the LaneShadow theme package and provides automatic dark/light mode resolution.

### Acceptance Criteria

- ☐ `ios/LaneShadow/Theme/AppTheme.swift` defines `AppTheme` struct with all token categories:
  ```swift
  struct AppTheme {
      let colors: ThemeColors
      let spacing: ThemeSpacing
      let typography: ThemeTypography
      let radius: ThemeRadius
      let elevation: ThemeElevation
      let domain: ThemeDomain // Waypoint, enrichment, deviation colors
  }
  ```
- ☐ `ThemeShapeStyle` pattern for automatic dark/light resolution:
  ```swift
  struct PrimaryStyle: ShapeStyle {
      @Environment(\.colorScheme) var colorScheme
      func resolve(in environment: EnvironmentValues) -> some ShapeStyle {
          colorScheme == .dark ? Color(.theme.primary.dark) : Color(.theme.primary.light)
      }
  }
  ```
- ☐ SwiftUI Environment values inject theme: `@Environment(\.theme) var theme`
- ☐ Runtime theme switching support via `@Environment(\.colorScheme)` observation
- ☐ Domain-specific tokens accessible via `theme.domain.waypointOnRoute`, `theme.domain.enrichmentFast`, etc.
- ☐ All tokens use semantic names — no hardcoded colors in SwiftUI views
- ☐ Typography tokens include platform-specific font family: SF Pro for iOS

---

## UC-DESIGN-03: Compose Theme Integration

Create Compose theme infrastructure that consumes bundled semantic JSON through the LaneShadow theme package and extends MaterialTheme with domain-specific tokens.

### Acceptance Criteria

- ☐ `android/app/src/main/java/com/laneshadow/ui/theme/Theme.kt` defines `LaneShadowTheme` composable:
  ```kotlin
  @Composable
  fun LaneShadowTheme(
      darkTheme: Boolean = isSystemInDarkTheme(),
      content: @Composable () -> Unit
  ) {
      val colors = if (darkTheme) DarkThemeColors else LightThemeColors
      val extendedColors = remember { DomainColors(darkTheme) }
      val theme = remember(darkTheme) { LaneShadowThemeColors(colors, extendedColors) }

      CompositionLocalProvider(
          LocalLaneShadowTheme provides theme,
          LocalDomainColors provides extendedColors
      ) {
          MaterialTheme(
              colorScheme = colors.toMaterialColorScheme(),
              typography = Typography,
              content = content
          )
      }
  }
  ```
- ☐ Extended ColorScheme for domain-specific tokens:
  ```kotlin
  data class DomainColors(
      val waypointOnRoute: Color,
      val waypointOffRoute: Color,
      val waypointMixed: Color,
      val enrichmentFast: Color,
      val enrichmentExtended: Color,
      val enrichmentCached: Color,
      val deviationOriginalRoute: Color,
      val deviationDetourPath: Color,
      val deviationReconnectPoint: Color
  )
  ```
- ☐ `isSystemInDarkTheme()` integration for automatic theme resolution
- ☐ All tokens use semantic names — no hardcoded colors in Compose code
- ☐ Typography tokens include platform-specific font family: Roboto/system font for Android
- ☐ Runtime theme switching via `LocalLaneShadowTheme.current` CompositionLocal

---

## UC-DESIGN-04: Atomic Component Library — Foundation

Define the atomic component hierarchy and create the first 6 platform-agnostic atomic components that consume ONLY semantic tokens.

### Acceptance Criteria

- ☐ Atomic component hierarchy documented in `.spec/prds/native-rewrite/08-design-system.md`:
  ```
  Tokens → Atoms → Molecules → Organisms → Templates → Screens
  ```
- ☐ Platform-specific atom directory structures created:
  - `ios/LaneShadow/Views/Components/Atoms/`
  - `android/app/src/main/java/com/laneshadow/ui/components/atoms/`
- ☐ **First 6 atoms created with cross-platform parity**:
  1. **ThemeButton** — Primary/secondary/tertiary variants, state-aware colors
  2. **ThemeText** — All typography variants (label/body/title/heading/display × sm/md/lg)
  3. **ThemeCard** — Elevation 0-5, border radius, surface colors
  4. **ThemeChip** — Waypoint status, enrichment phase chips
  5. **ThemeInput** — Text input with border/ring states
  6. **ThemeBadge** — Status indicators (success/warning/danger/info)
- ☐ Each atom consumes ONLY semantic tokens (no hardcoded values)
- ☐ Cross-platform consistency validated via snapshot tests:
  - iOS: `swift snapshot test` captures SwiftUI renders
  - Android: `ComposeTestRule.captureToImage()` + `assertEquals`
- ☐ State-aware tokens map to platform interactive states:
  - SwiftUI: `.buttonStyle(.bordered)` + `.hoverEffect()` + `.disabled()`
  - Compose: `InteractionSource` + `ButtonDefaults.buttonColors`
- ☐ Component API uses prop-driven variants (not duplicate components):
  ```swift
  // Good: Single component with variant enum
  ThemeButton(variant: .primary, size: .lg) { "Submit" }

  // Bad: Duplicate components
  PrimaryButton()
  SecondaryButton()
  ```

---

## UC-DESIGN-05: Design Token CI/CD

Create CI/CD pipeline that validates token schema integrity and prevents drift between platforms.

### Acceptance Criteria

- ☐ Pre-commit hook (`lefthook.yml`) runs `pnpm tokens:validate` when `tokens/**/*` changes
- ☐ `pnpm tokens:validate` validates `tokens/semantic/semantic.tokens.json` against the repo contract schema: `tokens/schema/laneshadow-tokens.schema.json`
- ☐ `pnpm tokens:validate` also runs a deliberate mutation check to prove contract violations fail with a named field path in the error output
- ☐ CI pipeline runs `pnpm tokens:sync-check` and verifies no drift:
  - Bundled JSON copies match committed versions
  - If drift detected, CI fails with instructions to run `pnpm tokens:sync`
- ☐ Token changes trigger refresh of all platform theme bundles:
  - `tokens/semantic/**/*.json` changes → CI runs `pnpm tokens:sync-check`
- ☐ Pre-commit hook prevents committing invalid token JSON
- ☐ CI pipeline fails if bundled JSON copies are not committed (ensures single source of truth)

---

## Directory Structure Addition

The `tokens/` directory joins the monorepo at root level:

```
LaneShadow/
├── tokens/                    # Design token source (W3C DTCG JSON)
│   ├── semantic/
│   │   └── semantic.tokens.json
│   ├── schema/
│   │   └── laneshadow-tokens.schema.json
│   ├── sync.config.json       # native-theme mirror contract
│   └── platforms/
│       ├── swift/             # SPM package resources / wrappers
│       ├── kotlin/            # Android asset-backed theme package
│       └── typescript/        # RN/web runtime loader package
├── android/                   # Native Android app
├── ios/                       # Native iOS app
├── react-native/              # React Native app
├── server/                    # Convex backend
├── config/                    # Build configuration
│   └── style-dictionary.config.js
└── Makefile
```

---

## Technical Requirements

### Token Format Compliance

- **W3C DTCG Format Module 2025.10** — Use official schema with `$meta` and `$type` fields
- **Token naming convention** — kebab-case for filenames, PascalCase for public theme and component APIs
- **Token structure** — All tokens include `$value`, `$type`, and optional `$extensions` for platform-specific overrides

### Runtime Delivery Configuration

- **Canonical source**: `tokens/semantic/**/*.json`
- **Mirror tooling**: `../native-theme/scripts/sync-bundled-json.js --config tokens/sync.config.json`
- **Platforms**:
  - `tokens/platforms/swift/**` → decodes bundled JSON and maps through `NativeTheme`
  - `tokens/platforms/kotlin/**` → decodes bundled JSON and maps through `dev.nativetheme.primitives`
  - `tokens/platforms/typescript/**` → imports canonical JSON directly and exposes a typed `buildTheme()` / `useTheme()` API

### Token Consumption Rules

- **All tokens use semantic names** — Never raw values in components
- **State-aware tokens map to platform interactive states**:
  - SwiftUI: `.buttonStyle(.bordered)` + `.hoverEffect()` + `.disabled()`
  - Compose: `InteractionSource` + `ButtonDefaults.buttonColors`
- **Typography tokens include platform-specific font family overrides**:
  - iOS: SF Pro
  - Android: Roboto/system font

### Build Commands

```bash
pnpm tokens:validate    # Validate tokens against LaneShadow contract
pnpm tokens:sync        # Mirror canonical JSON into bundled platform resources
pnpm tokens:sync-check  # Verify bundled resources have no drift
```

---

## Migration Path

### Phase 1: Token Extraction (Before Native Code)

- Extract all `styles/theme.ts` values to `tokens/` directory
- Lock `tokens/semantic/semantic.tokens.json` as the only source of truth
- Validate canonical JSON matches existing theme semantics exactly

### Phase 2: React Native Consumes Canonical JSON

- Replace hand-maintained literals with `tokens/platforms/typescript` runtime accessors backed by canonical JSON
- Verify no visual regressions in React Native app
- Commit: React Native now consumes single source of truth

### Phase 3: iOS Theme Wrapper

- Create `ios/LaneShadow/Theme/AppTheme.swift`
- Consume bundled JSON from `tokens/platforms/swift/Sources/LaneShadowTheme/Resources/semantic.tokens.json`
- Build SwiftUI Environment infrastructure
- No UI code yet — theme foundation only

### Phase 4: Android Theme Wrapper

- Create `android/app/src/main/java/com/laneshadow/ui/theme/Theme.kt`
- Consume bundled JSON from `tokens/platforms/kotlin/src/main/assets/semantic.tokens.json`
- Extend MaterialTheme with domain tokens
- No UI code yet — theme foundation only

### Phase 5: Atomic Components Built Per-Epic

- As screens are implemented in epics, build atoms incrementally
- First 6 atoms (UC-DESIGN-04) built early as foundation
- Additional atoms added as needed per epic requirements
- Each atom validated via snapshot tests

---

## Design Token Examples

### Color Token (W3C DTCG JSON)

```json
{
  "primary": {
    "$type": "color",
    "$value": "#B87333",
    "$extensions": {
      "com.laneshadow.states": {
        "hover": "#C58545",
        "pressed": "#8C5A2B",
        "disabled": "#E3C3A5"
      }
    }
  }
}
```

### Domain Token (Waypoint On-Route)

```json
{
  "waypointOnRoute": {
    "$type": "color",
    "$value": "#31A362",
    "$extensions": {
      "com.laneshadow.states": {
        "hover": "#4FBD7F",
        "pressed": "#268A4D",
        "disabled": "#A0DDB8"
      }
    }
  }
}
```

### Generated Swift Enum

```swift
enum ThemeColor {
    case primary
    case waypointOnRoute
    case enrichmentFast
    // ... 40+ cases
}
```

### Generated Kotlin Object

```kotlin
object ThemeColor {
    const val primary: Color = Color(0xFFB87333)
    const val waypointOnRoute: Color = Color(0xFF31A362)
    const val enrichmentFast: Color = Color(0xFF2C9F9B)
    // ... 40+ cases
}
```

---

## Cross-Platform Consistency Guarantees

1. **Single Source of Truth** — All tokens defined once in `tokens/` directory
2. **Automated Sync** — one canonical JSON file is mirrored into platform bundle locations
3. **Schema Validation** — CI prevents invalid token commits
4. **Snapshot Tests** — UI components verified visually across platforms
5. **Semantic Naming** — Components use token names, not values (prevents drift)

---

## Success Metrics

- ☐ Zero hardcoded colors in component code
- ☐ All tokens defined in W3C DTCG JSON
- ☐ Bundled JSON copies committed and in sync with the canonical source
- ☐ CI validates token schema on every commit
- ☐ React Native app consumes canonical semantic JSON through the runtime theme package with zero visual regression
- ☐ iOS and Android theme wrappers ready for UI implementation
- ☐ First 6 atomic components built with snapshot tests passing
