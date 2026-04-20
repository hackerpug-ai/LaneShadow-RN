---
stability: FEATURE_SPEC
last_validated: 2026-04-20
prd_version: 2.0.0
appetite_weeks: 6
---

# Scope

**Appetite**: 6 weeks (full feature)

The appetite covers the full vertical: ship a usable V2 Navigator system — tokens, atoms, molecules, organisms, six screens, and sandbox — on both iOS and Android in tandem, with legacy UI deleted. If scope grows beyond this, items are deferred, not extended.

## In Scope

### Foundation
- Define a single canonical `semantic.tokens.json` (DTCG `{$type,$value}` format) covering:
  - **Typography families**: `typography.opinion.{md,lg,xl}` (Newsreader serif), `typography.ui.{title,label,body}.{sm,md,lg}` (Geist), `typography.instrument.{sm,md,lg}` (JetBrains Mono).
  - **Color semantics**: surface (primary / card / overlay / glass / scrim), content, signal (`default` / `on`), role (`agent` / `user` / `system` × `default` / `on` / `accent`), weather (`clear` / `rain` / `wind` / `storm` / `hot` / `cold` × `default` / `on` / `tint`), route (`best` / `alt1` / `alt2`), status (`info` / `success` / `warning` / `error` / `recording`), border, action.
  - **Spacing** (4px base, 13 rungs), **sizing** (touch target, icon sizes, component heights, polyline/icon stroke widths), **radius** (none → pill).
  - **Motion recipes** (`chatOverlayEnter`, `chatOverlayDismiss`, `sidebarSlideIn`, `sketchPolylineLoop`, `routeDrawOn`, `bestBadgeEnter`, `phaseDotPulse`, `mapTapDismiss`) plus primitive duration + easing tokens the recipes reference.
  - **Opacity scale**, **elevation tiers** (`0`–`3` plus `overlay`), **Copper-blend gradients**.
  - **Map Studio style URLs** (`map.style.{light,dark}` — warm-paper topographic styling).
  - **Icon catalog constant** (`icon.stroke.width` = 1.5px) + 25-name enumeration consumed by the `LSIcon` atom.
- Cross-platform token generation pipeline: `semantic.tokens.json` → Swift constants, Kotlin Compose extensions, TypeScript tokens module. Drift-check runs in `lefthook` pre-commit.
- Leverage `~/Projects/native-theme/` primitives (`ColorSet`, `TypographyStyle`, `parseColorString`) without modification.

### UI Layer — Full Atomic Rebuild
- **Atoms (13 UCs)**: typography; buttons; inputs; base-display (Avatar / Icon / Divider / Spinner); surface trio (Card / Panel / **GlassPanel**); **Pill** (shape primitive); **Badge** (with status + weather variants); **PhaseDot**; **Scrim**; **design-owned SVG Icon catalog**; `LSMap` shared contract (UC-ATM-11 — multi-polyline, route-variant colors); `LSMap` iOS impl (UC-ATM-12); `LSMap` Android impl (UC-ATM-13).
- **Molecules (8 UCs)**: Card+ListRow; Toolbar+NavHeader; BottomSheet+Toast+Modal; FormField+TabItem+EmptyState; **Pill semantics family** (TagPill / FilterChip / SuggestionChip / WeatherBadge); **ChatInput**; **Navigator molecules** (PhaseIndicator / WeatherTimeline / InstrumentReadout); **LocationContextBar + RouteAttachmentCard**.
- **Organisms (7 UCs)**: Navigation (TopBar + NavBar); MapLayer; **NavigatorMessage + InlineErrorCallout**; **RouteSheet**; **SessionsDrawer**; Domain card organisms (`LSRouteCard`); SectionHeader.
- **Screens (6 UCs)**: Idle, Planning, RouteResults, RouteDetails, Sessions, Error.
- Every UC ships **two implementations**: iOS (Swift/SwiftUI) and Android (Kotlin/Compose), with paired sandbox stories that expose the same variants and arg controls on both platforms.

### Sandbox & Infrastructure
- Story registry on both platforms, organized by tier (AtomStories / MoleculeStories / OrganismStories / TemplateStories) following the Storywright pattern.
- Light/dark/auto theme toggle inside the sandbox, wired to the native-theme bridge.
- `argTypes` controls for story variants (text, select, toggle, number, color-token).
- Mock data providers: hard-coded fixture JSON + typed provider structs/classes. Fixture shapes either mirror `server/convex/` read types (Route, User) or are declared in `11-technical-requirements.md` for Navigator-specific entities (Session, NavigatorMessage, RouteAttachment, WeatherSummary, WeatherTimelineEntry, PlanningPhase, SuggestionChip, LocationContext).
- Cross-platform parity manifest — a shared machine-readable list of story IDs that MUST exist on both iOS and Android, checked in CI.
- Launch via `/native-sandbox` on both platforms.

### Hard Replacement / Cleanup

Cleanup runs in two distinct passes — early (before atoms) and late (after screens):

**Early — Pre-Sprint-2 failed-port reset (UC-SBX-05)**:
- Audit and delete failed 1:1 RN-to-native port artifacts (Avatar, Badge, BottomSheetInput, Button + FIX-* iterations from the retired `sprint-02-ui-component-translation` effort) under `ios/LaneShadow/Views/`, `ios/LaneShadowTests/Components/UI/`, and Kotlin analogs under `android/app/src/main/java/com/laneshadow/ui/`.
- Reset sandbox entry + tier aggregator files on both platforms to empty-story shells.
- Emit a machine-readable `cleanup-manifest.md` distinguishing `delete` entries from `keep: non-UI` entries.
- Preserve all non-UI code: `server/convex/`, `tokens/platforms/*`, service/data layers, DI modules, domain models, bundled fonts, launch/icon asset catalogs, build scaffolding.
- Runs in **parallel with Sprint 1 (TOK)**.

**Late — Terminal React Native shell retirement (UC-SBX-04)**:
- Delete `react-native/` app-shell in its entirety after all Navigator screens reach functional parity in the sandbox.
- Strip RN-related references from `package.json`, `lefthook.yml`, `Makefile`, `tsconfig*.json`.
- Runs in **Sprint 6** as the closing gate.

### Map Rendering (Mapbox)
- Integrate Mapbox Maps SDK on both platforms (iOS: Swift Package; Android: Gradle Maven).
- Publish two Mapbox Studio styles under the `laneshadow` workspace: `LaneShadow Copper Light` and `LaneShadow Copper Dark`, authored to render the warm-paper topographic aesthetic of `concepts/designs.html`.
- Store Studio style URLs as TOK tokens (`map.style.light`, `map.style.dark`).
- Consume `MAPBOX_ACCESS_TOKEN` from environment via platform-idiomatic secret loading (iOS: `Info.plist` + env fallback; Android: `secrets.xml` generated from env). Never hardcode tokens.
- `LSMap` contract is multi-polyline: the map accepts an array of `PolylineData`, each carrying a `RouteVariant` (`.best | .alt1 | .alt2 | .custom(ColorToken)`). Annotation kinds are `.start | .end | .waypoint`, rendered in `color.status.*`.
- Graceful failure: missing token or no network falls back to a token-styled `LSGlassPanel` + helper text, never a crash or Mapbox default error UI.

### Icon Catalog (Design-owned)
- Ship 25 SVG icons (`send`, `expand`, `collapse`, `menu`, `plus`, `close`, `sliders`, `bookmark`, `bookmarkFill`, `star`, `starFill`, `pin`, `clock`, `sun`, `rain`, `wind`, `storm`, `therm`, `route`, `map`, `layers`, `share`, `heart`, `heartFill`, `sparkle`, `compass`, `edit`, `trash`, `bike`, `chevR`, `chevL`) as assets inside the theme modules (`tokens/icons/*.svg` → generated Swift `Shape`/`Image` + Compose `ImageVector` outputs).
- Stroke width consumes `icon.stroke.width` (1.5px) token; color resolves from `color.content.*` or `color.signal.*`.
- `pnpm icons:check` asserts the SVG catalog name set matches the `IconName` enum on both platforms.
- SF Symbols and Material Icons are **not used** — explicit acceptance criterion in UC-ATM-10 verifies no remaining references.

### Quality Gates
- Every atom/molecule/organism/screen has a paired **iOS test** (XCTest) and **Android test** (JUnit4 + Compose UI testing) verifying it renders in both light and dark theme modes.
- Every screen passes visual review in the sandbox with mock data — no live data required.
- Cross-platform parity check: the set of registered story IDs on iOS and Android is identical at the end of the initiative (modulo platform-only components explicitly marked `ios-only` or `android-only`).
- **Visual regression snapshot testing** (UC-SBX-06): every sandbox story has a paired snapshot test on both platforms capturing light and dark mode as reference PNGs (`swift-snapshot-testing` iOS, `dropshots` Android). Snapshot names follow `{tier}.{component}.{variant}.{theme}` convention. A cross-platform parity diff report (`pnpm snapshots:parity-report`) produces side-by-side iOS vs Android comparison for human review. `lefthook` pre-push runs `pnpm snapshots:check` to verify coverage completeness.

## Out of Scope

### Deferred for Later Initiatives
- `[DEFERRED: integration-initiative]` Live Convex wiring — queries, mutations, subscriptions, offline sync, optimistic updates. Mock-only in V2.
- `[DEFERRED: navigator-runtime]` Real Navigator AI runtime — LLM orchestration, route-finding, weather API integration, Mapbox Directions, geocoding, constraint solving, multi-turn refinement. Every Navigator response in V2 is a fixture.
- `[DEFERRED: mapbox-advanced]` Mapbox offline packs / downloaded tile regions, turn-by-turn navigation SDK, geocoding/search, 3D terrain, traffic layers, custom raster sources.
- `[DEFERRED: integration-initiative]` Authentication (login, signup, session restore). V2 has no auth surface at all in the Navigator roster.
- `[DEFERRED: integration-initiative]` Push notifications, deep links, background sync.
- `[DEFERRED: social-product]` Feed / Discover / Profile / Settings / Onboarding / social Chat — the entire prior v1.x social-ride-app surface is retired from V2. It is neither in scope nor deferred to this initiative's follow-ups; if a social product is reintroduced, it will be a separate PRD.
- `[DEFERRED: web-rebuild]` Web platform — V2 targets iOS + Android only. A separate web-rebuild initiative will apply the same token pipeline once `tokens/platforms/typescript/` is stable.
- `[DEFERRED: platform-specific]` Desktop.
- `[DEFERRED: accessibility-initiative]` Full WCAG 2.1 AA audit. V2 ships accessibility basics (touch-target sizes, semantic labels on interactive atoms, Dynamic Type / font-scale respect). A dedicated accessibility initiative will follow.

### Not Part of This Initiative
- Visual design exploration beyond `concepts/designs.html`. The concepts file is authoritative — if something isn't there, we extend the Copper palette via product-manager + frontend-designer collaboration, not via individual agent judgment.
- Backend / Convex schema changes. Mock fixtures mirror existing `server/convex/` read types where they align; any gap is shaped in the fixture, not the backend.
- New animations or motion primitives beyond the declared motion recipes. Complex gesture-driven transitions are deferred.
- Platform version uplifts. V2 targets current minimum-OS versions set by `ios/LaneShadow.xcodeproj` and `android/app/build.gradle.kts`.
- Internationalization / localization string externalization. Copy in sandbox stories may be hard-coded English.
- Analytics instrumentation hooks in UI components.
- Legacy UI reading or migration. Legacy files are deleted — never migrated, refactored, or referenced.

## Appetite Fit Check

**Six weeks budget**, worked by two AI-agent pairs (iOS: swift-planner + swift-implementer + swift-reviewer; Android: kotlin-planner + kotlin-implementer + kotlin-reviewer) plus a shared foundation pair (frontend-designer producing specs, product-manager validating behavior):

- **Week 1**: TOK sprint (5 UCs) **in parallel with UC-SBX-05 failed-port cleanup**. Tokens land first; sandbox story-registry skeleton also lands so atoms can register immediately. Cleanup runs alongside TOK (disjoint files) and clears the ground for Sprint 2.
- **Week 2**: ATM sprint (13 UCs — denser, but the split contract/impl pattern plus the pill/badge/phase-dot/scrim/icon/glass-panel atoms are each small). Atoms land on both platforms.
- **Week 3**: MOL sprint (8 UCs). Molecules built from atoms.
- **Week 4**: ORG sprint (7 UCs).
- **Week 5**: SCR sprint (6 UCs) **+ SBX-01/02/03 hardening**.
- **Week 6**: UC-SBX-04 terminal retirement.

Each sprint ends with a **human testing gate**: "open the sandbox on iOS and Android, toggle light/dark, exercise every story at this tier — does it look right and match the Navigator concepts in `concepts/designs.html`?" No integration tests in V2, no real-data gates.

If any UC spills its week, it is deferred to an overflow sprint inside the 6-week appetite by **dropping**, not by **extending** — preferring to cut the lowest-priority organism or the lowest-priority screen (Error before Sessions before Planning) rather than slip the whole timeline.
