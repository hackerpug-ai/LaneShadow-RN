# Sprint 1: Foundation Tokens & V2 Reset

**Sequence:** 1
**Timeline:** Phase 1 · Week 1
**Status:** Planned

---

## Overview

This sprint establishes the single canonical token surface for V2 Copper (three typography families, role-based colors including weather + route variants, named motion recipes, spacing/sizing/stroke/radii, elevation including the `overlay` tier, Mapbox Studio style URLs, and the design-owned 25-icon catalog constant). It simultaneously executes a hard cleanup pass that deletes the retired 1:1 RN-to-native port artifacts from `ios/LaneShadow/Views/` and `android/app/src/main/.../ui/` and resets sandbox entry/aggregator files to empty-story shells so Sprint 2 atoms land on clean ground. Cleanup runs in parallel with token work because their file scopes are disjoint. No downstream UC may introduce new primitive values after this sprint closes.

Per-platform split: cleanup is separately tracked on iOS and Android so `swift-implementer` and `kotlin-implementer` can execute in parallel without blocking each other. TOK tasks remain shared because the token pipeline is a single source that generates Swift, Kotlin, and TypeScript outputs in one pass; the iOS and Android sides are reviewed by their respective reviewers at the verification gate.

**Sandbox bootstrap (UC-SBX-00).** Before cleanup, both platforms must have native-sandbox installed and host-wired. The install is idempotent — `~/Projects/native-sandbox/bin/install` + `bin/scaffold` can be re-run safely and print `noop:` when already scaffolded. This sprint owns the one-time host wiring: `LaneShadowSandbox` entrypoint, `LaneShadowThemeController` (iOS) / `LaneShadowThemeBridge` (Android), `previewWrapper` applying `LaneShadowTheme`, and `SandboxLaunch` configuration. Without this, no downstream sprint has a surface to register stories against.

---

## Package Boundaries (CONSTITUTION)

These boundaries are binding for every task in this sprint and every sprint below. Violating them is a planning error, not a judgment call.

- **Theme package is the ONLY token source.** All color / typography / motion / spacing / radius / elevation / icon consumption flows through the project-local theme package:
  - iOS → `tokens/platforms/swift/Sources/LaneShadowTheme/` (generated `Tokens.swift` + hand-authored `ThemeProvider` + `@Environment` hooks).
  - Android → `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` (generated `Tokens.kt`) + the hand-authored `LaneShadowTheme` Compose wrapper.
  - This package path-references `~/Projects/native-theme` for primitives (`ColorSet`, `TypographyStyle`, `parseColorString`) and validates `tokens/semantic/semantic.tokens.json` against `~/Projects/native-theme/schema/common.schema.json` (via `$ref`). Use `~/Projects/native-theme/scripts/sync-bundled-json.js` for any bundled-JSON sync.
  - No component, story, test, or fixture may import color / typography / motion / spacing values from anywhere else — no literals, no SF Symbols, no Material Icons, no ad-hoc `Color(...)` / `Color(0xFF...)` calls.
- **Sandbox work is the ONLY preview surface.** Every story, argTypes inspector, theme toggle, and parity-manifest entry goes through `~/Projects/native-sandbox`:
  - iOS consumes it as an SPM path-referenced package (`~/Projects/native-sandbox/ios/`); stories register into `ios/LaneShadow/Sandbox/Stories/*Stories.swift` via `Story`, `SandboxRoot`, `ThemeController`, `ArgValues`.
  - Android consumes it as a Gradle composite build (`~/Projects/native-sandbox/android/`); stories register into `android/app/src/debug/java/com/laneshadow/sandbox/stories/*Stories.kt` via the same four APIs.
  - No hand-rolled preview scaffolding, no raw `#Preview {}` without the native-sandbox `Story` wrapper, no custom theme toggles — the `ThemeController` from native-sandbox owns light/dark switching.

Violations surface at `/kb-sprint-tasks-plan` (as AC failures) and at `/kb-run-sprint` (as reviewer blockers). Escalate, do not work around.

---

## Human Test Deliverable

A reviewer can verify (a) the failed-port UI is completely gone from both native trees and the sandbox still launches with zero stories on both platforms building green, then (b) a token swatch story renders every semantic color, every typography family variant, every spacing rung, and every motion recipe on both platforms, matching the Copper Navigator concepts at `concepts/designs.html`.

**Test Steps:**
1. Open `.spec/prds/v2/cleanup-manifest.md` and confirm every failed-port UI file is listed under `delete`, every non-UI artifact (services, Convex wrappers, fonts, icons) is listed under `keep`, and the v1.x social-app grep sweep returns zero matches.
2. Run `ls ios/LaneShadow/Views/` and `ls android/app/src/main/java/com/laneshadow/ui/` and confirm both are empty or contain only reusable non-UI scaffolding per the manifest.
3. Run `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow build` and `cd android && ./gradlew :app:compileDebugKotlin` and confirm both platforms compile green with zero warnings introduced by the deletion.
4. Launch `/native-sandbox --platform ios` and `/native-sandbox --platform android` and confirm the sandbox boots cleanly with zero stories listed — no crash, no missing-file errors. On iOS, also verify shake-to-open via `xcrun simctl io booted shake` opens `LaneShadowSandbox`; on Android, verify long-press-to-open launches the sandbox via `SandboxLaunch.shouldOpen` gated behind `BuildConfig.DEBUG`. Toggle the Addons Appearance control and confirm the preview canvas re-themes via the `LaneShadowThemeController` / `LaneShadowThemeBridge` without re-theming the native-sandbox chrome.
5. Run `pnpm tokens:validate`, `pnpm tokens:sync-check`, and `pnpm icons:check` at the repo root and confirm all three exit 0.
6. Open the token swatch story on both platforms and verify every semantic color (surface, content, signal, role, weather, route, status, border, action) renders in light and dark; every typography family (Newsreader opinion, Geist ui, JetBrains Mono instrument) renders across all declared size variants; every spacing rung from `spacing.0` through `spacing.12` renders; and every motion recipe from `motion.recipe.chatOverlayEnter` through `motion.recipe.mapTapDismiss` animates per its token-declared duration/easing.
7. Stage a deliberate edit inside `tokens/semantic/`, `tokens/icons/`, or `tokens/fonts/` and confirm `lefthook` pre-commit runs `pnpm tokens:validate`, `pnpm tokens:sync-check`, and `pnpm icons:check` before allowing the commit.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-SBX-00-ios | Native-sandbox install + host wiring — iOS (run `~/Projects/native-sandbox/bin/install --platform ios --path {repo}` + `bin/scaffold --platform ios --path {repo}`; author `LaneShadowSandbox` SwiftUI view wrapping `SandboxRoot(stories:, previewWrapper:, themeController:)`; implement `LaneShadowThemeController: ObservableObject, ThemeController`; implement `laneShadowPreviewWrapper` applying `LaneShadowTheme` inside `previewWrapper`; wire `SandboxLaunch.configure(argFlags: ["-LaneShadowSandbox"], envKeys: ["LANESHADOW_LAUNCH_SANDBOX"])` inside `#if DEBUG`; verify shake-to-open works on iOS simulator via `xcrun simctl io booted shake`) | swift-implementer | 180 min |
| UC-SBX-00-android | Native-sandbox install + host wiring — Android (run `~/Projects/native-sandbox/bin/install --platform android --path {repo}/android` + `bin/scaffold --platform android --path {repo}/android`; author `LaneShadowSandbox` composable wrapping `SandboxRoot(stories, previewWrapper, themeController)`; implement `LaneShadowThemeBridge: com.nativesandbox.theming.ThemeController` (bridge pattern over existing app mode); set `previewWrapper = { content -> LaneShadowTheme { content() } }`; wire `SandboxLaunch.shouldOpen(intent, extraKey = "com.laneshadow.extra.OPEN_SANDBOX")` gated behind `BuildConfig.DEBUG`; verify long-press-to-open works on Android emulator) | kotlin-implementer | 180 min |
| UC-SBX-05-ios | Pre-V2 failed-port cleanup — iOS (delete `ios/LaneShadow/Views/` + reset iOS sandbox aggregators in `ios/LaneShadow/Sandbox/Stories/` to empty-story shells that still compose via `AtomStories.all + MoleculeStories.all + OrganismStories.all + TemplateStories.all + InfrastructureStories.all`; v1.x grep sweep on iOS tree) | swift-implementer | 120 min |
| UC-SBX-05-android | Pre-V2 failed-port cleanup — Android (delete `android/app/src/main/.../ui/` + reset Android sandbox aggregators in `android/app/src/debug/java/com/laneshadow/sandbox/stories/` to empty-story shells that still compose via `AtomStories.all + MoleculeStories.all + OrganismStories.all + TemplateStories.all + InfrastructureStories.all`; v1.x grep sweep on Android tree) | kotlin-implementer | 120 min |
| UC-TOK-01 | Typography families (opinion / ui / instrument) — shared token definition + Swift + Kotlin output | swift-planner + kotlin-planner (shared-tooling) | 180 min |
| UC-TOK-02 | Color semantics (surface / signal / role / weather / route / status) — shared token definition + Swift + Kotlin output | swift-planner + kotlin-planner (shared-tooling) | 240 min |
| UC-TOK-03 | Spacing / sizing / stroke / radius / opacity / elevation tokens — shared token definition + Swift + Kotlin output | swift-planner + kotlin-planner (shared-tooling) | 120 min |
| UC-TOK-04 | Motion recipes + primitive duration/easing — shared token definition + Swift + Kotlin output | swift-planner + kotlin-planner (shared-tooling) | 180 min |
| UC-TOK-05 | Cross-platform token generation pipeline + icon catalog + Mapbox style URLs — shared tooling (generates Swift, Kotlin, TypeScript outputs in one pass) | swift-planner + kotlin-planner (shared-tooling) | 480 min |

---

## Human Testing Gate

**Gate:** Pre-Sprint-2 reset is complete: the failed-port UI is gone from both native trees, the sandbox launches with zero stories on both platforms building green, and the token swatch story renders every semantic color, every typography family variant, every spacing rung, and every motion recipe on both platforms — matching the Copper Navigator concepts at `concepts/designs.html`.

---

## Source Coverage

- `.spec/prds/v2/04-uc-tok.md` — UC-TOK-01 through UC-TOK-05
- `.spec/prds/v2/09-uc-sbx.md` — UC-SBX-05
- `.spec/prds/v2/11-technical-requirements.md` — Token pipeline, icon catalog, font manifest, Mapbox Studio style URLs
- `.spec/prds/v2/concepts/designs.html` — authoritative visual source for Copper palette, typography, motion
- `~/Projects/native-theme/schema/common.schema.json` — `$ref` target for token validation
- `tokens/semantic/semantic.tokens.json` (emitted), `tokens/icons/*.svg` (emitted), `tokens/fonts/fonts.manifest.json` (emitted), `tokens/scripts/generate.ts` (emitted)

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-SBX-00-ios | [`concepts/designs.html`](../../concepts/designs.html) + `~/Projects/native-sandbox/RULES.md` §§4–9 (install/scaffold, SandboxRoot contract, previewWrapper, ThemeController, SandboxLaunch) |
| UC-SBX-00-android | [`concepts/designs.html`](../../concepts/designs.html) + `~/Projects/native-sandbox/RULES.md` §§4–9 (install/scaffold, SandboxRoot contract, previewWrapper, ThemeController bridge pattern, SandboxLaunch) |
| UC-SBX-05-ios | [`concepts/designs.html`](../../concepts/designs.html) (overview — no per-UC spec; cleanup task) |
| UC-SBX-05-android | [`concepts/designs.html`](../../concepts/designs.html) (overview — no per-UC spec; cleanup task) |
| UC-TOK-01 | [`concepts/uc-tok-01-typography.html`](../../concepts/uc-tok-01-typography.html) |
| UC-TOK-02 | [`concepts/uc-tok-02-colors.html`](../../concepts/uc-tok-02-colors.html) |
| UC-TOK-03 | [`concepts/uc-tok-03-dimensions.html`](../../concepts/uc-tok-03-dimensions.html) |
| UC-TOK-04 | [`concepts/uc-tok-04-motion.html`](../../concepts/uc-tok-04-motion.html) |
| UC-TOK-05 | [`concepts/uc-tok-05-pipeline.html`](../../concepts/uc-tok-05-pipeline.html) |

---

## Blocks

- Sprint 2 (Atoms: Foundation Primitives) — every atom consumes TOK-generated constants at type-check time; foundation atoms land on the clean ground cleared by UC-SBX-05.
- Sprint 3 (Atoms: LSMap) — map atom consumes `map.style.light/dark` + `color.route.*` + `sizing.stroke.*` tokens.
- Sprint 4 (Molecules) — indirectly, through atoms.
- All downstream sprints — the no-literals CONSTITUTION begins here; no UI tier below may reintroduce primitive values.

---

## Task Detail Files

Generated by `/kb-sprint-tasks-plan` on 2026-04-21. All 9 tasks scored 115/115 on the rubric.

- [UC-SBX-00-ios-native-sandbox-install-host-wiring-ios.md](UC-SBX-00-ios-native-sandbox-install-host-wiring-ios.md)
- [UC-SBX-00-android-native-sandbox-install-host-wiring-android.md](UC-SBX-00-android-native-sandbox-install-host-wiring-android.md)
- [UC-SBX-05-ios-pre-v2-failed-port-cleanup-ios.md](UC-SBX-05-ios-pre-v2-failed-port-cleanup-ios.md)
- [UC-SBX-05-android-pre-v2-failed-port-cleanup-android.md](UC-SBX-05-android-pre-v2-failed-port-cleanup-android.md)
- [UC-TOK-01-typography-families-opinion-newsreader-ui-geist-instrument-jetbrains-mono.md](UC-TOK-01-typography-families-opinion-newsreader-ui-geist-instrument-jetbrains-mono.md)
- [UC-TOK-02-color-semantics-surface-signal-role-weather-route-status.md](UC-TOK-02-color-semantics-surface-signal-role-weather-route-status.md)
- [UC-TOK-03-dimensions-spacing-sizing-stroke-radius-opacity-elevation.md](UC-TOK-03-dimensions-spacing-sizing-stroke-radius-opacity-elevation.md)
- [UC-TOK-04-motion-recipes-primitive-duration-easing.md](UC-TOK-04-motion-recipes-primitive-duration-easing.md)
- [UC-TOK-05-cross-platform-token-generation-pipeline-icon-catalog-mapbox-style-urls.md](UC-TOK-05-cross-platform-token-generation-pipeline-icon-catalog-mapbox-style-urls.md)
