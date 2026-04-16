---
stability: FEATURE_SPEC
last_validated: 2026-04-16
prd_version: 1.0.0
functional_group: DESIGN
---

# Design System — Cross-Platform Token Architecture

## Overview

LaneShadow's native rewrite requires a unified design system that works across React Native, Android (Kotlin/Compose), and iOS (Swift/SwiftUI). The current `styles/theme.ts` contains 40+ semantic color tokens, typography scale, spacing system, border radius scale, elevation system, and domain-specific tokens (waypoints, enrichment, deviations).

This PRD defines a three-layer architecture:

1. **Token Source** — W3C DTCG standard JSON (platform-agnostic, industry standard since Oct 2025)
2. **Build-Time Transformer** — Style Dictionary compiles tokens to Swift enums, Kotlin objects, TS constants
3. **Platform-Native Theming** — SwiftUI Environment + Compose MaterialTheme consume tokens idiomatically

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

Extract all existing `styles/theme.ts` semantic tokens to W3C DTCG JSON format and configure Style Dictionary to generate platform-specific token files.

### Acceptance Criteria

- ☐ `tokens/` directory exists at repo root with subdirectories: `color/`, `spacing/`, `typography/`, `radius/`, `elevation/`, `domain/`
- ☐ All 40+ color tokens from `theme.ts` extracted to `tokens/color/{semantic-name}.json` files
- ☐ Token names match TypeScript exactly: `color/primary.json`, `color/waypoint-on-route.json`, etc.
- ☐ Token values include all state variants: `{ "default": "#B87333", "hover": "#C58545", "pressed": "#8C5A2B", "disabled": "#E3C3A5" }`
- ☐ Style Dictionary configured at `config/style-dictionary.config.js` with custom format plugins for Swift and Kotlin
- ☐ `npm run build:tokens` generates:
  - `react-native/styles/generated/tokens.ts` — TypeScript constants
  - `ios/LaneShadow/Theme/Generated/` — Swift enums with ThemeColor, ThemeSpacing, ThemeTypography
  - `android/app/src/main/java/com/laneshadow/ui/theme/generated/` — Kotlin objects with ThemeColor, ThemeSpacing, ThemeTypography
- ☐ Generated files are read-only (gitignored or marked with `@generated` header)
- ☐ Token JSON validates against W3C DTCG schema in CI

### Technical Requirements

- **W3C DTCG Format Module 2025.10 compliance** — Use official `$meta` and `$type` fields
- **Token file naming**: `{category}/{semantic-name}.json` (kebab-case)
- **Token group naming**: PascalCase for generated code (e.g., `waypoint-on-route.json` → `WaypointOnRoute` enum case)
- **Style Dictionary v4+** with custom format plugins:
  - `swift/enum.swift` — Generates Swift enum cases
  - `kotlin/object.kt` — Generates Kotlin objects
  - `typescript/constants.ts` — Generates TypeScript const objects

---

## UC-DESIGN-02: SwiftUI Theme Integration

Create SwiftUI theme infrastructure that consumes generated Swift token files and provides automatic dark/light mode resolution.

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

Create Compose theme infrastructure that consumes generated Kotlin token files and extends MaterialTheme with domain-specific tokens.

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

- ☐ Pre-commit hook (`.husky/pre-commit`) runs `npm run validate:tokens` before commit
- ☐ `npm run validate:tokens` validates token JSON against W3C DTCG schema:
  ```bash
  ajv validate -s tokens/schema/dtcg-2025.10.json \
               -d tokens/**/*.json
  ```
- ☐ CI pipeline runs `npm run build:tokens` and verifies no drift:
  - Generated files match committed versions
  - If drift detected, CI fails with instructions to run `npm run build:tokens`
- ☐ Token changes trigger rebuild of all platform theme files:
  - `tokens/**/*.json` changes → CI runs `build:tokens` → commits generated files
- ☐ Pre-commit hook prevents committing invalid token JSON
- ☐ CI pipeline fails if generated files are not committed (ensures single source of truth)

---

## Directory Structure Addition

The `tokens/` directory joins the monorepo at root level:

```
LaneShadow/
├── tokens/                    # Design token source (W3C DTCG JSON)
│   ├── color/                 # Color tokens (40+ files)
│   │   ├── primary.json
│   │   ├── secondary.json
│   │   ├── waypoint-on-route.json
│   │   ├── enrichment-fast.json
│   │   ├── deviation-detour-path.json
│   │   └── ...
│   ├── spacing/               # Spacing scale (4pt grid)
│   │   ├── xs.json
│   │   ├── sm.json
│   │   └── ...
│   ├── typography/            # Typography scale
│   │   ├── label-sm.json
│   │   ├── body-md.json
│   │   └── ...
│   ├── radius/                # Border radius scale
│   ├── elevation/             # Elevation/shadow system
│   ├── domain/                # Domain-specific tokens
│   │   ├── waypoint/
│   │   ├── enrichment/
│   │   └── deviation/
│   └── schema/                # W3C DTCG schema files
│       └── dtcg-2025.10.json
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
- **Token naming convention** — kebab-case for filenames, PascalCase for generated code
- **Token structure** — All tokens include `$value`, `$type`, and optional `$extensions` for platform-specific overrides

### Style Dictionary Configuration

- **Version**: Style Dictionary v4+
- **Custom format plugins**:
  - `swift/enum.swift` — Generates Swift enums with cases
  - `kotlin/object.kt` — Generates Kotlin objects with const vals
  - `typescript/constants.ts` — Generates TypeScript const objects
- **Source**: `tokens/**/*.json`
- **Platforms**:
  - `ios` → Swift enums
  - `android` → Kotlin objects
  - `react-native` → TypeScript constants

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
npm run build:tokens    # Generate all platform token files
npm run validate:tokens # Validate token JSON against W3C DTCG schema
npm run watch:tokens    # Watch token files for changes and rebuild
```

---

## Migration Path

### Phase 1: Token Extraction (Before Native Code)

- Extract all `styles/theme.ts` values to `tokens/` directory
- Configure Style Dictionary
- Validate generated files match existing theme.ts exactly

### Phase 2: React Native Consumes Generated Tokens

- Replace hand-maintained `theme.ts` with generated `tokens.ts`
- Verify no visual regressions in React Native app
- Commit: React Native now consumes single source of truth

### Phase 3: iOS Theme Wrapper

- Create `ios/LaneShadow/Theme/AppTheme.swift`
- Consume generated Swift token files
- Build SwiftUI Environment infrastructure
- No UI code yet — theme foundation only

### Phase 4: Android Theme Wrapper

- Create `android/app/src/main/java/com/laneshadow/ui/theme/Theme.kt`
- Consume generated Kotlin token files
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
2. **Automated Generation** — Style Dictionary generates platform files from JSON
3. **Schema Validation** — CI prevents invalid token commits
4. **Snapshot Tests** — UI components verified visually across platforms
5. **Semantic Naming** — Components use token names, not values (prevents drift)

---

## Success Metrics

- ☐ Zero hardcoded colors in component code
- ☐ All tokens defined in W3C DTCG JSON
- ☐ Generated files committed (no runtime generation)
- ☐ CI validates token schema on every commit
- ☐ React Native app consumes generated tokens with zero visual regression
- ☐ iOS and Android theme wrappers ready for UI implementation
- ☐ First 6 atomic components built with snapshot tests passing
