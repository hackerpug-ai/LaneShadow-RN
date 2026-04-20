---
stability: CONSTITUTION
last_validated: 2026-04-20
prd_version: 2.0.0
---

# Technical Requirements

This section is a CONSTITUTION-layer artifact — it describes the load-bearing technical contracts that every downstream sprint, task, and implementation must honor. Changes here trigger architecture review.

## System Components

| Component                            | Location                                                                 | Role                                                                                 |
|--------------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| Token source                         | `tokens/semantic/semantic.tokens.json`                                   | Canonical DTCG-format token tree — three typography families, role-based colors, weather palette, route-variant colors, named motion recipes, spacing/sizing/stroke/radii, elevation (including `overlay`), opacity, gradients, Mapbox style URLs, icon stroke width. |
| Token schema                         | `tokens/semantic/semantic.tokens.schema.json`                            | JSON Schema validating `semantic.tokens.json` (uses `$ref` into `~/Projects/native-theme/schema/common.schema.json`). Includes schema fragments for `motion.recipe.*` entries. |
| Icon catalog source                  | `tokens/icons/*.svg`                                                     | 25 design-owned SVG icons, 1.5px rounded stroke baseline; basenames match the `IconName` enum on both platforms. |
| Font manifest                        | `tokens/fonts/fonts.manifest.json`                                       | Declares Newsreader (serif, opinion family), Geist (sans, UI family), JetBrains Mono (mono, instrument family) — licenses + source URLs + file hashes. |
| Token generator                      | `tokens/scripts/generate.ts`                                             | Deterministic converter of `semantic.tokens.json` + icon catalog + font manifest into per-platform outputs (typography constants, color constants, motion recipe declarations, `IconName` enum, font bundling scripts). |
| Sync-check                           | `tokens/scripts/sync-check.ts`                                           | CI-invoked drift verifier. Re-runs generation and diffs; exits non-zero on drift.     |
| Icon parity check                    | `tokens/scripts/icons-check.ts`                                          | Verifies `tokens/icons/*.svg` basename set matches the generated Swift + Kotlin `IconName` enums exactly. Run by `lefthook` pre-commit and CI. |
| Swift theme package                  | `tokens/platforms/swift/Sources/LaneShadowTheme/`                        | Generated `Tokens.swift` (colors + typography + motion recipes + icon enum) + hand-authored theme bridge + `ThemeProvider` + `@Environment` hooks. Bundles SVG icons as `Asset.xcassets` or native `Shape` wrappers (implementer's choice per UC-ATM-10). |
| Kotlin theme module                  | `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/`  | Generated `Tokens.kt` + hand-authored `LaneShadowTheme` Compose wrapper. Bundles icons as `ImageVector` constants or Compose resources. |
| TypeScript tokens package            | `tokens/platforms/typescript/src/generated/tokens.ts`                    | Generated TS exports (sync-gate target only in V2).                                  |
| iOS UI library                       | `ios/LaneShadow/UI/{Atoms,Molecules,Organisms,Screens}/`                 | SwiftUI components per tier; each component paired with tests and sandbox story.     |
| Android UI library                   | `android/app/src/main/java/com/laneshadow/ui/{atoms,molecules,organisms,screens}/` | Compose composables per tier; each component paired with tests and sandbox story. |
| iOS sandbox module                   | `ios/LaneShadow/Sandbox/{Entry, Stories/*Stories.swift}`                 | Entry + per-tier aggregators + per-component story files.                            |
| Android sandbox module               | `android/app/src/debug/java/com/laneshadow/sandbox/{Entry, stories/*Stories.kt}` | Entry + per-tier aggregators + per-component story files (debug variant only). |
| Sandbox fixtures                     | `tokens/sandbox/fixtures/*.fixtures.json`                                | Per-domain-entity fixture records.                                                   |
| Parity manifest                      | `tokens/sandbox/stories.parity.json`                                     | Canonical list of story IDs that must exist on both platforms; ios-only / android-only allow-lists. |
| Snapshot parity manifest             | `tokens/sandbox/snapshots.parity.json`                                   | Maps iOS snapshot names to Android snapshot names for cross-platform visual diff reporting. |
| iOS snapshot references              | `ios/LaneShadowTests/__Snapshots__/`                                     | Reference PNG images for iOS visual regression tests (`swift-snapshot-testing`). |
| Android snapshot references          | `android/app/src/androidTest/screenshots/`                               | Reference PNG images for Android visual regression tests (`dropshots`). |

## Data Schema (Mock-only in V2)

Navigator-domain entities. `Route` and `User` shapes mirror `server/convex/schema.ts` read types where they align; Navigator-specific entities are declared here. All schemas are used only by mock providers in V2 — no live Convex wiring.

### User
```
User {
  id: string
  name: string
  handle: string
  avatarUrl?: string
  bio?: string
}
```
(`followers` / `following` fields retained in the Convex read type but not consumed by V2 — the Navigator screens never render social stats.)

### Route
```
Route {
  id: string
  name: string                           // e.g. "The Skyline Spine"
  via: string                            // e.g. "280 → 92 → Skyline to Alice's"
  distance: number                       // meters
  estimatedTime: number                  // seconds
  climb: number                          // feet (iOS/Android format at render time)
  scenicScore: number                    // 0-10; UI meter shows ⌈scenicScore/2⌉ filled dots out of 5
  difficulty: 'easy' | 'moderate' | 'advanced'
  polyline: string                       // encoded polyline — decoded into [LatLng] for LSMap
  variant?: 'best' | 'alt1' | 'alt2'     // Navigator-assigned variant for this result set
}
```

### Session
```
Session {
  id: string
  title: string                          // e.g. "Santa Cruz loop"
  preview: string                        // last user prompt — e.g. "Scenic 2-hour ride, avoid highways"
  meta: string                           // e.g. "3 routes · Active"
  when: string                           // relative label ("Now", "Tue", "Apr 12") — UI formats client-side
  active: boolean                        // currently-focused session
  routeIds: string[]                     // pointer references into Route fixtures
  createdAt: string                      // ISO 8601
}
```

### NavigatorMessage
```
NavigatorMessage {
  id: string
  sessionId: string                      // references Session.id
  body: string                           // the Navigator's prose response
  timestamp: string                      // ISO 8601
  kind: 'prompt' | 'response' | 'error'  // prompt = user, response = agent, error = agent-with-error
  attachments?: RouteAttachment[]        // present when kind == 'response' with routes
  detail?: string                        // optional secondary text; used on error
  pinned: boolean                        // sticky response (auto-dismiss suppressed)
}
```

### RouteAttachment
```
RouteAttachment {
  routeId: string                        // pointer into Route fixtures
  variant: 'best' | 'alt1' | 'alt2'
  isBest: boolean                        // renders LSBestBadge
  weather: WeatherSummary                // route-level forecast summary
  scenic: 1 | 2 | 3 | 4 | 5              // 5-dot meter count
  includesFavorite?: boolean             // triggers the "INCLUDES SUNSET CLIMB" (or similar) call-out
  includesFavoriteLabel?: string         // text rendered next to the favorite icon
}
```

### WeatherSummary
```
WeatherSummary {
  condition: 'clear' | 'rain' | 'wind' | 'storm' | 'hot' | 'cold'
  label: string                          // e.g. "Clear", "Rain 3pm", "18mph NW", "92°F", "38°F"
}
```

### WeatherTimelineEntry
```
WeatherTimelineEntry {
  hour: string                           // "9", "10", "11", ...
  temperature: number                    // °F (render-side formats; fixtures in °F)
  condition: WeatherSummary['condition']
}
```

### PlanningPhase
```
PlanningPhase {
  id: 'reading' | 'sketching' | 'validating' | 'weather' | 'building'
  label: string                          // e.g. "Reading your ride", "Sketching roads", "Checking they connect", "Reading the sky", "Ranking your options"
  status: 'pending' | 'active' | 'done'
}
```

### SuggestionChip
```
SuggestionChip {
  id: string
  label: string                          // e.g. "Twisty back roads", "Coastal cruise", "Try inland", "End at Big Sur"
}
```

### LocationContext
```
LocationContext {
  label: string                          // e.g. "Near Santa Cruz, CA"
  mode: 'auto' | 'manual'                // drives the mode pill ("AUTO" / "MANUAL")
}
```

### Greeting (IdleScreen)
```
Greeting {
  meta: string                           // e.g. "FRIDAY · 68°F · CLEAR"
  headline: string                       // e.g. "Where are we riding today?"
  emphasis?: string                      // substring of headline to italicize (e.g. "today")
}
```

### FilterChip (retained)
```
FilterChip {
  id: string
  label: string
  selected: boolean
}
```

### NavigatorError (ErrorScreen)
```
NavigatorError {
  title: string = "THE NAVIGATOR"
  body: string                           // e.g. "Couldn't stitch that one together — the segment through Lucia looked broken."
  detail?: string                        // e.g. "Try a different end point, or let me route you inland via Carmel Valley Rd instead?"
}
```

### Retired (v1.x → removed in v2.0.0)

The following v1.x entities are **retired** and must not appear in any V2 fixture, type, or story:

- `Ride`, `FeedItem`, `DiscoverSection`, `SettingsEntry`, `ProfileData`, `MenuEntry`.
- `Message` (generic chat), `ActiveMessage` (queue-managed bubble lifecycle).

Where functionality overlaps (e.g., message rendering), the Navigator entities above replace them.

## API Design

### Story API (cross-platform contract — unchanged from v1.4.0)
```
Story(
  id: string,                      // "{tier}.{component}.{variant}"
  tier: .atom | .molecule | .organism | .template | .modifier | .infrastructure,
  component: string,               // "LSButton", "LSCard", etc.
  name: string,
  summary: string,
  argTypes?: [ArgType],
  initialArgs?: ArgValues
) { args in /* view */ }
```

### ThemeController API (unchanged)
```
protocol ThemeController {
  var themeMode: ThemeMode { get set }   // .auto | .alwaysLight | .alwaysDark
}
```

### MockProvider API (unchanged shape — new domain providers)
```
protocol MockProvider<T> {
  func value(variant: String = "default") -> T     // deterministic, sync, no I/O
  static var variants: [String] { get }
}
```

Navigator providers: `IdleMockProvider`, `PlanningMockProvider`, `RouteResultsMockProvider`, `RouteDetailsMockProvider`, `SessionsMockProvider`, `ErrorMockProvider`, `ChatInputMockProvider` (for molecule stories), `WeatherTimelineMockProvider`, `PlanningPhasesMockProvider`, `RouteAttachmentsMockProvider`.

### Atom / Molecule / Organism APIs
Typed per-component; see individual UCs for signatures (e.g., `LSButton(title:variant:state:onAction:)`, `LSGlassPanel(variant:padding:) { content }`, `LSChatInput(value:placeholder:suggestions:locationBadge:isThinking:onSend:onCollapse:onFilter:onSuggestionTap:)`, `LSMapLayer(map:scrim:topOverlays:bottomOverlays:leadingDrawer:bottomSheet:topBar:)`).

### `LSMap` contract summary (cross-platform — authored in UC-ATM-11)
```
LSMap(
  mode: MapMode,                         // .preview | .interactive
  camera: CameraPosition,
  cameraFit: CameraFit = .static,        // .static | .polyline(padding:) | .polylines(padding:)
  polylines: [PolylineData] = [],        // plural — each carries its own RouteVariant
  annotations: [Annotation] = [],        // kind: .start | .end | .waypoint
  showFavorites: Bool = false,
  onTap: ((LatLng) -> Void)? = nil
)

PolylineData {
  coordinates: [LatLng]
  variant: RouteVariant                  // .best | .alt1 | .alt2 | .custom(ColorToken)
  strokeWidth: StrokeSize = .md
}
```

## Architecture Diagram

```
                     ┌─────────────────────────────────────┐
                     │  concepts/designs.html               │  (authoritative visual source)
                     │  6 Navigator screens: idle, planning,│
                     │  route_results, route_details,       │
                     │  session_history, error              │
                     └───────────────┬─────────────────────┘
                                     │ frontend-designer reads
                                     ▼
                     ┌─────────────────────────────────┐
                     │ tokens/semantic/                │
                     │   semantic.tokens.json (DTCG)   │
                     │   semantic.tokens.schema.json   │ ◄── {native-theme/schema/common.schema.json}
                     └───────────────┬─────────────────┘
                                     │
                     ┌───────────────┼───────────────┐
                     │               │               │
                     ▼               ▼               ▼
           ┌──────────────┐  ┌────────────┐  ┌────────────────┐
           │ tokens/icons │  │ tokens/    │  │ tokens/scripts │
           │   25 SVG     │  │ fonts      │  │   generate.ts  │
           │              │  │ manifest   │  │   sync-check.ts│
           └──────┬───────┘  └─────┬──────┘  │   icons-check  │
                  └────────┬───────┘         └────────┬───────┘
                           │                          │
                           ▼                          ▼
                 ┌────────────────────┐     ┌────────────────────┐
                 │ tokens/scripts/    │     │                    │
                 │   generate.ts      │     │                    │
                 └─────────┬──────────┘     │                    │
            ┌──────────────┼──────────────┐ │                    │
            ▼              ▼              ▼ │                    │
   ┌────────────────┐ ┌──────────────┐ ┌────────────────────┐
   │ Swift          │ │ Kotlin       │ │ TypeScript         │
   │ LaneShadowTheme│ │ LaneShadow   │ │ tokens/generated   │
   │ (colors +      │ │ Theme        │ │   (sync-gate only) │
   │  typography +  │ │ (colors +    │ │                    │
   │  motion.recipe │ │  typography +│ │                    │
   │  + icons)      │ │  recipes +   │ │                    │
   │                │ │  icons)      │ │                    │
   └────────┬───────┘ └──────┬───────┘ └────────────────────┘
            │                │
            ▼                ▼
   ┌──────────────────────┐   ┌────────────────────────┐
   │ ios/LaneShadow/UI/   │   │ android/.../ui/        │
   │   Atoms → Molecules →│   │   atoms → molecules →  │
   │   Organisms → Screens│   │   organisms → screens  │
   └──────────┬───────────┘   └──────────┬─────────────┘
              │                          │
              ▼                          ▼
   ┌──────────────────────┐   ┌────────────────────────┐
   │ ios/…/Sandbox/       │   │ android/.../sandbox/   │
   │   Stories aggregated │   │   Stories aggregated   │
   │   by tier            │   │   by tier              │
   └──────────┬───────────┘   └──────────┬─────────────┘
              │                          │
              │     ┌─────────────────┐  │
              └────►│ tokens/sandbox/ │◄─┘
                    │ fixtures +      │
                    │ parity.json     │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ /native-sandbox │   (launches app in sandbox mode)
                    │   iOS or Android│
                    └─────────────────┘

{native-theme} primitives (ColorSet, TypographyStyle, parseColorString) — consumed by every platform's generated theme module.
{native-sandbox} runtime (Story, SandboxRoot, ThemeController, ArgValues) — consumed by both platforms' sandbox modules.
{server/convex/schema.ts} — read-only shape reference for mock fixture types (Route + User). Not a runtime dependency in V2.
```

## External Dependencies

### Component: Token pipeline
| Dependency | Documentation |
|------------|---------------|
| native-theme (path-referenced) | `~/Projects/native-theme/README.md` |
| JSON Schema $defs | `~/Projects/native-theme/schema/common.schema.json` |
| Sync bundled JSON helper | `~/Projects/native-theme/scripts/sync-bundled-json.js` |
| DTCG token format | https://tr.designtokens.org/format/ |

### Component: Fonts (design-owned)
| Dependency | Documentation |
|------------|---------------|
| Newsreader (serif; `typography.opinion.*`) | https://fonts.google.com/specimen/Newsreader |
| Geist (sans; `typography.ui.*`) | https://vercel.com/font |
| JetBrains Mono (mono; `typography.instrument.*`) | https://www.jetbrains.com/lp/mono/ |

All three families are bundled into `ios/LaneShadow/Resources/Fonts/` and `android/app/src/main/assets/fonts/` at generation time; registered via `Info.plist` (iOS) and `Resources` / `ResourcesCompat` (Android).

### Component: Icon catalog (design-owned SVG)
| Dependency | Documentation |
|------------|---------------|
| Design-owned SVG source | `tokens/icons/*.svg` (25 files) |
| `IconName` enum generator | `tokens/scripts/generate.ts` (emits Swift enum + Kotlin enum from filenames) |
| SVG-to-Compose conversion (optional tooling) | Implementer's choice during Sprint 2 — e.g., `svg-to-compose` or manual `ImageVector` hand-ports. Evaluated per-icon for fidelity vs. bundle-size. |

**Explicitly not used**: SF Symbols (iOS), Material Icons (Android). Neither symbol set is referenced anywhere in V2 code.

### Component: iOS UI + Sandbox
| Dependency | Documentation |
|------------|---------------|
| SwiftUI | https://developer.apple.com/documentation/swiftui |
| XCTest | https://developer.apple.com/documentation/xctest |
| NativeSandbox (SPM, path-referenced) | `~/Projects/native-sandbox/ios/` |
| Mapbox Maps SDK for iOS | https://docs.mapbox.com/ios/maps/guides/ |
| swift-snapshot-testing (test-scope, SPM) | https://github.com/pointfreeco/swift-snapshot-testing |

### Component: Android UI + Sandbox
| Dependency | Documentation |
|------------|---------------|
| Jetpack Compose | https://developer.android.com/jetpack/compose |
| Material 3 (token foundation only; no Material Icons) | https://m3.material.io/ |
| JUnit4 | https://junit.org/junit4/ |
| Compose UI testing | https://developer.android.com/jetpack/compose/testing |
| NativeSandbox (Gradle composite, path-referenced) | `~/Projects/native-sandbox/android/` |
| Mapbox Maps SDK for Android | https://docs.mapbox.com/android/maps/guides/ |
| dropshots (test-scope, Gradle plugin) | https://github.com/dropbox/dropshots |

### Component: Map styling
| Dependency | Documentation |
|------------|---------------|
| Mapbox Studio | https://studio.mapbox.com/ |
| Mapbox Style Spec | https://docs.mapbox.com/style-spec/guides/ |
| Published styles | `mapbox://styles/laneshadow/<copper-paper-light-id>`, `mapbox://styles/laneshadow/<copper-paper-dark-id>` — authored to render the warm-paper topographic aesthetic of `concepts/designs.html`. URLs stored in `tokens/semantic/semantic.tokens.json` under `map.style.{light,dark}`. |
| Access token | `MAPBOX_ACCESS_TOKEN` env var → iOS `Info.plist` key `MBXAccessToken` (build-time substitution), Android `res/values/secrets.xml` (generated pre-build from env). Never committed. |

### Component: Shared tooling
| Dependency | Documentation |
|------------|---------------|
| Node.js / TypeScript (for token generation + sync + icon scripts) | https://nodejs.org |
| Biome (lint/format) | https://biomejs.dev |
| lefthook | https://github.com/evilmartians/lefthook |
| Convex schema (read-only reference) | `server/convex/schema.ts` (local) |

### Component: Design source
| Dependency | Documentation |
|------------|---------------|
| V2 concepts HTML | `./concepts/designs.html` |

## UI Infrastructure

### Design libraries
- **SwiftUI** — iOS 17+ baseline targeted; uses `@Observable` for ViewModels where needed (sandbox stories remain stateless by default).
- **Jetpack Compose** — targets Compose 1.7+; Material 3 as the baseline for platform idioms (elevation, ripple, motion primitives).
- **NativeSandbox** — provides `Story` + `SandboxRoot` + `ThemeController` + `ArgValues` on both platforms.
- **NativeTheme** — provides `ColorSet` / `TypographyStyle` / `parseColorString` primitives.

### Style tokens (summary)
See UC-TOK-01 through UC-TOK-05 for exhaustive token lists. All tokens live in `tokens/semantic/semantic.tokens.json` and generate deterministically into platform outputs. Icons + fonts are part of the generated output surface.

### Component reuse posture
- **13 atom UCs** covering ~20 concrete atoms (typography; buttons; inputs; base-display trio; surface trio; pill; badge; phase dot; scrim; icon catalog; map contract + 2 map impls).
- **8 molecule UCs** covering ~14 concrete molecules (Card+ListRow, Toolbar+NavHeader, BottomSheet+Toast+Modal, FormField+TabItem+EmptyState, 4 pill semantics, ChatInput, 3 Navigator molecules, LocationContextBar + RouteAttachmentCard).
- **7 organism UCs** covering ~8 concrete organisms (TopBar+NavBar, MapLayer, NavigatorMessage + InlineErrorCallout, RouteSheet, SessionsDrawer, RouteCard, SectionHeader).
- **6 screen UCs** covering the 6 Navigator screens.
- **Zero literal values in any UI code** — all appearance flows through tokens. CONSTITUTION-level; cannot be violated without a PRD update.

### Build-time enforcement
- `lefthook` pre-commit:
  - `pnpm tokens:validate` when `tokens/semantic/**` is staged.
  - `pnpm tokens:sync-check` when `tokens/semantic/**`, `tokens/icons/**`, `tokens/fonts/**`, or `tokens/platforms/**` is staged.
  - `pnpm icons:check` when `tokens/icons/**` or any platform `IconName`-related file is staged.
  - `pnpm type-check:native` on any staged TS.
  - `biome check` on any staged file.
  - `swiftformat` when iOS files are staged.
  - `xcodebuild … build` when iOS files are staged.
  - `./gradlew :app:compileDebugKotlin` when Android files are staged.
- `lefthook` pre-push:
  - `pnpm sandbox:parity-check` (per UC-SBX-01).
  - `pnpm snapshots:check` (per UC-SBX-06 — verifies every story has light+dark snapshots on both platforms, no orphans).
