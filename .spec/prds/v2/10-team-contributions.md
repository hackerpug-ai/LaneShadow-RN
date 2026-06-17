---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-20
prd_version: 2.0.0
---

# Team Contributions

This section records the phase-by-phase synthesis produced during PRD planning. Specialist perspectives were reasoned through by the PRD planner rather than run through full team orchestration (auto-mode execution), but the contributions below reflect what each role would own during planning and carry forward during execution.

## Phase 1 — User Personas (frontend-designer + product-manager)

**Who uses V2 directly?** Not end users — they never see a "design system." The direct consumers of V2 are the **AI agents and human reviewers** who build LaneShadow features against it. That shifts the persona modeling:

### Direct consumer personas
- **swift-implementer** building an iOS Navigator feature: needs typed token constants across three typography families, named motion recipes, a stable atom API including `LSGlassPanel` / `LSPill` / `LSIcon` (SVG-catalog), and a predictable sandbox registration slot per component.
- **kotlin-implementer** building an Android Navigator feature: same needs as iOS counterpart, expressed through Compose idioms (`@Composable`, `Modifier`, `MaterialTheme` extensions, `ImageVector` for icons).
- **frontend-designer** producing specs from `concepts/designs.html`: needs a single authoritative token file (no duplicate sources), a clear atom → molecule → organism contract for the Navigator, and a story pattern per variant.
- **Human operator (Justin)** reviewing a sprint: needs `/native-sandbox` to launch on both platforms and exercise every Navigator story at a tier in under a minute.

### Indirect persona (end user)
The LaneShadow rider (recreational cruiser / touring) never sees V2 as a system — they experience it as **consistency**: the Navigator's voice reads the same on iOS and Android; the route card they tap on iOS behaves and looks like the one they tap on Android; the warm-paper map feels continuous across platforms.

### Pains derived from personas
1. Each agent-pair currently re-derives component architecture → V2 fixes this with a rigid atomic stack, three typography families, token-only resolution, named motion recipes.
2. No isolated preview → V2 fixes this with `native-sandbox` at every tier, including all six Navigator screens.
3. Backend-coupling → V2 fixes this with mocked providers (Idle / Planning / RouteResults / RouteDetails / Sessions / Error).
4. Platform drift → V2 fixes this with a parity manifest + a single token source + a design-owned SVG icon catalog (no SF Symbols / Material Icons divergence).

## Phase 2 — Architecture (product-manager + swift-planner + kotlin-planner)

### System components identified

| Component | Owner | Role |
|-----------|-------|------|
| `tokens/semantic/semantic.tokens.json` | Shared (frontend-designer authors; both platforms consume) | Single source of truth for all design values. |
| `tokens/icons/*.svg` | Shared (frontend-designer authors) | 25 design-owned SVG icons (1.5px rounded stroke). |
| `tokens/fonts/fonts.manifest.json` | Shared | Declares Newsreader / Geist / JetBrains Mono families. |
| `tokens/scripts/generate.ts` | Shared tooling | Generates Swift / Kotlin / TS outputs deterministically (including `IconName` enums + font bundling scripts). |
| `tokens/scripts/icons-check.ts` | Shared tooling | Verifies SVG filename set matches platform `IconName` enums. |
| `tokens/platforms/swift/Sources/LaneShadowTheme/` | swift-planner/implementer | Generated Swift constants + hand-authored theme bridge for iOS (incl. icon assets). |
| `tokens/platforms/kotlin/.../generated/` | kotlin-planner/implementer | Generated Kotlin Compose extensions (incl. `ImageVector` icons). |
| `tokens/platforms/typescript/src/generated/` | Shared tooling | Generated TS exports (sync-gate target; no runtime consumer in V2). |
| `ios/LaneShadow/UI/{Atoms,Molecules,Organisms,Screens}/` | swift-* triad | Per-tier SwiftUI component modules. |
| `android/app/src/main/java/com/laneshadow/ui/{atoms,molecules,organisms,screens}/` | kotlin-* triad | Per-tier Compose component modules. |
| `ios/LaneShadow/Sandbox/` | swift-* triad | iOS sandbox entry, per-tier story aggregators, per-component story files. |
| `android/app/src/debug/java/com/laneshadow/sandbox/` | kotlin-* triad | Android sandbox entry and aggregators (debug build variant only). |
| `tokens/sandbox/fixtures/` | Shared | JSON fixture records per domain entity (Navigator-specific). |
| `tokens/sandbox/stories.parity.json` | Shared | Cross-platform parity manifest. |

### Data entities (mocked)
Navigator-domain: `User`, `Route` (shapes align with `convex/schema.ts` read types with Navigator extensions — `climb`, `scenicScore`, `via`, `variant`), `Session`, `NavigatorMessage`, `RouteAttachment`, `WeatherSummary`, `WeatherTimelineEntry`, `PlanningPhase`, `SuggestionChip`, `LocationContext`, `Greeting`, `FilterChip`, `NavigatorError`.

v1.x entities retired: `Ride`, `FeedItem`, `DiscoverSection`, `SettingsEntry`, `ProfileData`, `MenuEntry`, `Message`, `ActiveMessage`.

### API design (sandbox + component APIs)
- **Story API**: `Story(id, tier, component, name, summary, argTypes?, initialArgs?) { args in /* view */ }` — identical contract on both platforms.
- **ThemeController API**: `ThemeController` protocol (iOS) / interface (Kotlin) with `themeMode: ThemeMode` gettable+settable + bridge to host theme mode.
- **MockProvider API**: `MockProvider<T>` returning a typed entity deterministically; providers are synchronous, stateless, enumerable by variant name. Navigator providers: `IdleMockProvider`, `PlanningMockProvider`, `RouteResultsMockProvider`, `RouteDetailsMockProvider`, `SessionsMockProvider`, `ErrorMockProvider`, plus molecule-tier providers for weather / phases / route-attachments / chat-input.
- **Atom APIs**: every atom takes a typed props struct or named parameters — no dynamic dictionaries. Key additions in v2: `LSGlassPanel(variant:)`, `LSPill(size:)`, `LSIcon(name:size:color:)`, `LSPhaseDot(state:)`, `LSScrim(opacity:)`, multi-polyline `LSMap`.

### External dependencies
- `~/Projects/native-theme/` — path-referenced SPM + Gradle composite + TS workspace. Provides `ColorSet`, `TypographyStyle`, `parseColorString`, and the schema fragments.
- `~/Projects/native-sandbox/` — path-referenced SPM + Gradle composite. Provides `Story`, `SandboxRoot`, `ThemeController`, `ArgValues`.
- Mapbox Maps SDK for iOS + Android.
- Newsreader + Geist + JetBrains Mono fonts (bundled).
- `/Users/justinrich/Projects/LaneShadow/convex/` — **read-only reference** for data shapes. No runtime dependency in V2.

## Phase 3 — UI Infrastructure (swift-planner + kotlin-planner + frontend-designer)

### Design libraries
- SwiftUI (iOS 17+).
- Jetpack Compose (Kotlin 2.x, Material 3 as baseline — Material Icons not consumed).
- No third-party UI libraries beyond Mapbox + native-sandbox + native-theme.

### Style tokens (already surfaced in Phase 2)
Three typography families, role-based colors (incl. weather palette + route variants), spacing/sizing/stroke/radii, named motion recipes, opacity, elevation (incl. `overlay` tier), gradients — all TOK-owned, all consumed via generated constants. Icons + fonts are part of the generated output surface.

### Component reuse analysis
- **100% reuse**: atoms, molecules, organisms (no per-screen re-implementation of typography, buttons, glass chrome, or pills).
- **Targeted counts per tier**: 13 atoms, 8 molecules, 7 organisms, 6 screens — all other UI patterns are compositions.
- **No cross-platform shared runtime code** beyond `native-theme` primitives.

### UI constraints (technical feasibility)
- Large-title navigation is iOS-native; Android gets a static large-title visual (no scroll collapse).
- Safe-area / window-inset handling differs between platforms — each platform's navigation organisms (and `LSMapLayer`) handle this idiomatically.
- Dynamic Type (iOS) and font-scale (Android) are both respected in `LSText` across all three typography families.
- Icons are a **design-owned SVG catalog** (25 named icons, 1.5px rounded stroke) shipped in the theme module. SF Symbols and Material Icons are not consumed.
- Backdrop blur for `LSGlassPanel` uses platform-idiomatic APIs (SwiftUI `.ultraThinMaterial` / `Material` overlay; Compose `Modifier.blur` or `RenderEffect.createBlurEffect`). Blur radius resolved from a token.

## Phase 4 — Holdout Scenarios (product-manager, condensed)

Rather than generating per-UC scenario files in `.spec/scenarios/`, this initiative encodes scenarios into each UC's acceptance criteria. Key holdout themes covered across ACs:

| Theme | Where covered |
|-------|---------------|
| Light/dark parity | Every atom/molecule/organism/screen UC asserts "toggle light/dark" produces correct rendering. |
| Platform parity | Every component UC requires paired iOS + Android with identical resolved values. |
| No token drift | UC-TOK-05 + UC-SBX-01 enforce that no UI consumes literals; verified at commit time. |
| No SF-Symbols / Material-Icons leakage | UC-ATM-10 adds a post-Sprint-2 grep assertion for zero matches. |
| Weather palette partition from status | UC-TOK-02 + UC-ATM-07 keep status and weather variants in separate namespaces. |
| Multi-polyline map contract | UC-ATM-11/12/13 require three concurrent polylines with per-variant colors in the Route Results story. |
| Glass chrome backdrop blur | UC-ATM-05 requires platform-idiomatic backdrop blur on every overlay chrome. |
| Motion recipes referenced by name | UC-TOK-04 + every organism UC requires recipe references, not raw duration/easing pairs. |
| Overflow / long copy | UC-ORG-02/03 + UC-SCR-03/04/06 include `Long Body` / `Long Title` stories. |
| Missing data | UC-ORG-06 + UC-SCR-05 include `Empty State` / `Missing Optional Data` stories. |
| Touch-target accessibility | UC-ATM-02 + UC-MOL-05 require automated touch-target-size tests on both platforms. |
| Legacy contamination | UC-SBX-04 + UC-SBX-05 assert deletion completeness via `ls` and build-green post-cleanup, plus a grep sweep for retired v1.x social-app component names. |

Complex scenario files are deferred to a follow-up accessibility / QA initiative.

## Synthesis

The PRD is scoped to a **six-sprint** budget with clear downward dependencies (TOK → ATM → MOL → ORG → SCR → SBX), each sprint gated by a single human testing gate verifiable in `/native-sandbox`. The architecture relies on existing infrastructure (`native-theme`, `native-sandbox`, Storywright pattern, Mapbox) plus three new design-owned assets (SVG icon catalog, three bundled fonts, Copper Studio map styles). V2 does not invent new tooling, only applies established patterns consistently across LaneShadow's two native platforms — now framed around the Navigator product, not the prior social-ride-app concept.
