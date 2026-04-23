# Sprint 2: Atoms — Foundation Primitives

**Sequence:** 2
**Timeline:** Phase 2 · Week 2
**Status:** Completed

---

## Overview

This sprint delivers the ten non-map atom UCs — the smallest typed UI primitives that every molecule, organism, and screen downstream will compose from. Each atom ships as paired iOS (SwiftUI) + Android (Compose) implementations with identical public APIs and identical sandbox stories, consumes only TOK-generated constants (no literal colors, no literal spacing), and registers in the Atoms tier aggregator on both platforms. This set includes the four Navigator-specific primitives that are new in V2 — `LSPill`, `LSGlassPanel`, `LSPhaseDot`, `LSScrim` — plus the design-owned SVG `LSIcon` catalog that retires SF Symbols and Material Icons.

Per-platform split: every UC expands to a paired `-ios` + `-android` task so `swift-implementer` and `kotlin-implementer` work in parallel without shared-tree contention. The 10-task-per-sprint gate is intentionally exceeded (20 paired tasks) to surface parallel execution at the planning layer; the sprint's human testing gate still operates at UC granularity.

## Current Progress

Last updated: 2026-04-23

Completed on `main`:
- `UC-ATM-01-ios` — `LSText` iOS (`66a1dfc4`)
- `UC-ATM-01-android` — `LSText` Android (`8af7fcdb`)
- `UC-ATM-02-ios` — `LSButton` iOS (`ed78fd69`)
- `UC-ATM-02-android` — `LSButton` Android (`f75e595d`)
- `UC-ATM-03-android` — `LSTextField` / `LSTextArea` Android (`a4f2180b`)
- `UC-ATM-03-ios` — `LSTextField` / `LSTextArea` iOS (`3bb88b69`)
- `UC-ATM-05-ios` — `LSCard` / `LSPanel` / `LSGlassPanel` iOS (`c92a9f0a`, includes callout stripe feedback fix)
- `UC-ATM-05-android` — `LSCard` / `LSPanel` / `LSGlassPanel` Android (`a75922cf`)
- `UC-ATM-04-ios` — Display atoms iOS (`9fc775d9`)
- `UC-ATM-04-android` — Display atoms Android (`7f005be9`)
- `UC-ATM-06-ios` — `LSPill` iOS (`7b44a079`)
- `UC-ATM-06-android` — `LSPill` Android (`e7ad40f5`)
- `UC-ATM-07-ios` — `LSBadge` / `LSBestBadge` iOS (`ede9a185`)
- `UC-ATM-07-android` — `LSBadge` / `LSBestBadge` Android (`7f8e2b56`)
- `UC-ATM-08-android` — `LSPhaseDot` Android (`626a1cf0`)
- `UC-ATM-08-ios` — `LSPhaseDot` iOS (`3dcfd89f`, follow-up project fix `58ebebd3`)
- `UC-ATM-09-android` — `LSScrim` Android (`e594fa1e`)
- `UC-ATM-09-ios` — `LSScrim` iOS (`8a0ea752`)
- `UC-ATM-10-ios` — `LSIcon` iOS (`13fb315a`)
- `UC-ATM-10-android` — `LSIcon` Android (`9147d8b7`; includes `1675113a` and `1d4721fc` remediation)

Remaining Sprint 2 implementation work:
- None. Sprint 2 is drained on `main`.

Tracking notes:
- `.kb-run/state.json` is the execution state for this sprint and currently treats the commits above as the source of truth for completed-on-main work.
- `UC-ATM-04-android` was repaired directly on `main` as `7f005be9` after the original child commit drifted out of scope.
- `android/:app:lintDebug` passes again after declaring `ACCESS_NETWORK_STATE` and clearing pre-existing Compose/runtime lint blockers.
- Earlier off-history evidence remains recorded for historical traceability, but Sprint 2 completion is keyed only to the commits now landed on `main`.
- The generated icon catalog currently covers 31 names; older human-test wording below still says 25 names. Treat the generated catalog and its tests as authoritative unless the design source explicitly reduces the set.

---

## Package Boundaries (CONSTITUTION)

Inherited from Sprint 1; restated for enforcement at reviewer time.

- **Theme package is the ONLY token source.** Every atom imports colors, typography, spacing, motion recipes, and icon names from the project-local theme package:
  - iOS → `tokens/platforms/swift/Sources/LaneShadowTheme/` (generated `Tokens.swift` + `ThemeProvider` + `@Environment` hooks).
  - Android → `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` + `LaneShadowTheme` Compose wrapper.
  - The theme package path-references `~/Projects/native-theme` for `ColorSet` / `TypographyStyle` / `parseColorString` primitives. No `Color(red:...)`, no `Color(0xFF...)`, no `systemFont(ofSize:)`, no `FontFamily.Serif`, no SF Symbols, no Material Icons anywhere in atom code.
- **Sandbox runtime is the ONLY preview surface.** Every atom ships a Story that consumes `Story`, `SandboxRoot`, `ThemeController`, `ArgValues` from `~/Projects/native-sandbox`:
  - iOS stories live at `ios/LaneShadow/Sandbox/Stories/*Stories.swift` (SPM path ref to `~/Projects/native-sandbox/ios/`).
  - Android stories live at `android/app/src/debug/java/com/laneshadow/sandbox/stories/*Stories.kt` (Gradle composite to `~/Projects/native-sandbox/android/`).
  - Atom previews outside the sandbox (e.g. `#Preview {}` without the `Story` wrapper, custom debug screens) are rejected at review.
- **Story contract (native-sandbox Tier 1 — `~/Projects/native-sandbox/RULES.md` §6).** Every atom ships one or more `Story` values conforming to:
  - `id` — dotted, tier-first, stable: `atoms.{component}.{variant}` (e.g. `atoms.button.primary`, `atoms.icon.catalog`, `atoms.glasspanel.callout-signal`).
  - `tier` — `ComponentTier.atom` (iOS) / `ComponentTier.Atom` (Android). Do NOT introduce new tiers; the enum is fixed at 6 values by native-sandbox.
  - `component` — PascalCase component name (e.g. `"LSButton"`, `"LSIcon"`).
  - `name` — short human-readable variant label ("Primary Button", "Catalog", "Callout Signal").
  - `summary` — one sentence describing what the story demonstrates.
  - Render closure — takes `ArgValues` (iOS) or no args (Android); returns the rendered component.
  - Stateless by default. Mutable state belongs in the ThemeController or fixture providers, not inside the story closure.
- **Tier aggregator composition.** Stories register via per-tier enums/objects (`AtomStories.all` on iOS — an `enum` with `static let all: [Story]`; `AtomStories.all` on Android — an `object` with `val all: List<Story>`). The host-level `LaneShadowSandbox` composes `AtomStories.all + MoleculeStories.all + …`. No global registry.
- **Debug-only on Android.** Every atom Story file lives under `android/app/src/debug/java/com/laneshadow/sandbox/stories/`. Release builds must not ship any sandbox code — `./gradlew :app:assembleRelease` followed by a grep of the resulting APK for `com.nativesandbox` returns zero matches.
- **ArgTypes discipline.** Native-sandbox Tier 1 does not render dynamic ArgType controls yet. Ship `argTypes` metadata where useful (iOS has scaffolding for `text`/`boolean`/`select`/`radio`/`range`/`color`/`object`) but do not build a competing inspector UI in the host — per `RULES.md` §10, the moment you need runtime controls, open a PR against native-sandbox instead. Stories without `argTypes` must still render from their `initialArgs`/stateless render closure.

---

## Human Test Deliverable

A reviewer can open every foundation atom story in the sandbox on iOS and Android, toggle light and dark, exercise the full `argTypes` inspector for each atom, and confirm that `LSGlassPanel` chrome + callout variants, `LSPill` at all sizes, `LSBadge` status + weather variants, `LSPhaseDot` active-state ring pulse, `LSScrim` tap-through vs. blocking modes, and every icon in the 25-name catalog render identically across platforms and match the Copper Navigator concepts.

**Test Steps:**
1. Launch `/native-sandbox --platform ios` and `/native-sandbox --platform android`; confirm the Atoms tier shows stories for Typography, Button, TextField, TextArea, Display (Avatar/Divider/Spinner), Surface (Card/Panel/GlassPanel), Pill, Badge, PhaseDot, Scrim, and Icon.
2. Open the Typography swatch story on both platforms and verify Newsreader/Geist/JetBrains Mono variants render at token-specified sizes and line heights; increase system font size and confirm Dynamic Type / font-scale scaling.
3. Open the Button family (one story per variant × state) and verify primary/secondary/ghost/accept/destructive/outline each resolve their default/pressed/disabled colors from `color.action.*`, meet minimum touch-target size, and render leading/trailing icon slots correctly.
4. Open the GlassPanel Chrome and Callout (signal/warning) stories on both platforms and verify the translucent backdrop blur, `elevation.overlay`, and 3px leading accent stripe resolve correctly in light and dark.
5. Open the Badge family and verify the six weather variants (`clear/rain/wind/storm/hot/cold`) each render with their correct tint background + solid foreground + leading weather icon; verify `LSBestBadge` renders in `color.signal.*` with a filled-star prefix.
6. Open the PhaseDot story and confirm the Pending/Active/Done states render per token; verify the Active state's concentric ring pulse animation references `motion.recipe.phaseDotPulse` (not a hardcoded duration).
7. Open the Icon swatch story and verify all 25 icons render at `sizing.icon.{xs,sm,md,lg,xl}` with 1.5px rounded stroke from `icon.stroke.width`; grep the repo for `UIImage(systemName:)` / `Image(systemName:)` / `Icons.Filled.*` / `Icons.Outlined.*` and confirm zero matches.
8. Toggle light/dark at every story; run `pnpm sandbox:parity-check` and confirm every Atoms story ID exists on both platforms.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| UC-ATM-01-ios | Typography atoms (`LSText`) — iOS SwiftUI | swift-implementer | 120 min |
| UC-ATM-01-android | Typography atoms (`LSText`) — Android Compose | kotlin-implementer | 120 min |
| UC-ATM-02-ios | Button atom (all variants + states) — iOS SwiftUI | swift-implementer | 240 min |
| UC-ATM-02-android | Button atom (all variants + states) — Android Compose | kotlin-implementer | 240 min |
| UC-ATM-03-ios | Input atoms (`LSTextField`, `LSTextArea`) — iOS SwiftUI | swift-implementer | 180 min |
| UC-ATM-03-android | Input atoms (`LSTextField`, `LSTextArea`) — Android Compose | kotlin-implementer | 180 min |
| UC-ATM-04-ios | Base display atoms (Avatar, Divider, Spinner) — iOS SwiftUI | swift-implementer | 120 min |
| UC-ATM-04-android | Base display atoms (Avatar, Divider, Spinner) — Android Compose | kotlin-implementer | 120 min |
| UC-ATM-05-ios | Surface trio (`LSCard`, `LSPanel`, `LSGlassPanel`) — iOS SwiftUI | swift-implementer | 180 min |
| UC-ATM-05-android | Surface trio (`LSCard`, `LSPanel`, `LSGlassPanel`) — Android Compose | kotlin-implementer | 180 min |
| UC-ATM-06-ios | Pill atom (`LSPill`) — iOS SwiftUI | swift-implementer | 60 min |
| UC-ATM-06-android | Pill atom (`LSPill`) — Android Compose | kotlin-implementer | 60 min |
| UC-ATM-07-ios | Badge atom (`LSBadge` + `LSBestBadge`) — iOS SwiftUI | swift-implementer | 120 min |
| UC-ATM-07-android | Badge atom (`LSBadge` + `LSBestBadge`) — Android Compose | kotlin-implementer | 120 min |
| UC-ATM-08-ios | PhaseDot atom (`LSPhaseDot`) — iOS SwiftUI | swift-implementer | 90 min |
| UC-ATM-08-android | PhaseDot atom (`LSPhaseDot`) — Android Compose | kotlin-implementer | 90 min |
| UC-ATM-09-ios | Scrim atom (`LSScrim`) — iOS SwiftUI | swift-implementer | 60 min |
| UC-ATM-09-android | Scrim atom (`LSScrim`) — Android Compose | kotlin-implementer | 60 min |
| UC-ATM-10-ios | Icon atom (`LSIcon`) — design-owned SVG catalog — iOS SwiftUI | swift-implementer | 240 min |
| UC-ATM-10-android | Icon atom (`LSIcon`) — design-owned SVG catalog — Android Compose | kotlin-implementer | 240 min |

---

## Human Testing Gate

**Gate:** Every foundation atom story renders in the sandbox on both iOS and Android — typography, buttons, inputs, avatar/divider/spinner, surface trio (including `LSGlassPanel` with its translucent blur + leading accent stripe), `LSPill`, `LSBadge` status + weather variants, `LSPhaseDot` with the `motion.recipe.phaseDotPulse` ring pulse, `LSScrim`, and the 25-icon design-owned catalog — identical across platforms and faithful to the Copper concepts, with zero SF Symbols / Material Icons references remaining in either native tree.

Automated verification for this sprint remains behavioral. Visual fidelity is reviewed manually in the sandbox rather than through hard style assertions or blocking snapshot diffs.

---

## Source Coverage

- `.spec/prds/v2/05-uc-atm.md` — UC-ATM-01 through UC-ATM-10 acceptance criteria
- `.spec/prds/v2/concepts/designs.html` — authoritative Copper Navigator composition
- `.spec/prds/v2/11-technical-requirements.md` — atom API surface, platform library contracts, icon generation pipeline
- `~/Projects/native-sandbox/` — Story/SandboxRoot/ThemeController runtime
- `~/Projects/native-theme/` — `ColorSet`, `TypographyStyle`, `parseColorString` primitives

### Per-Task Design Files

| Task | Design Reference |
|------|-----------------|
| UC-ATM-01-ios | [`concepts/uc-atm-01-text.html`](../../concepts/uc-atm-01-text.html) |
| UC-ATM-01-android | [`concepts/uc-atm-01-text.html`](../../concepts/uc-atm-01-text.html) |
| UC-ATM-02-ios | [`concepts/uc-atm-02-button.html`](../../concepts/uc-atm-02-button.html) |
| UC-ATM-02-android | [`concepts/uc-atm-02-button.html`](../../concepts/uc-atm-02-button.html) |
| UC-ATM-03-ios | [`concepts/uc-atm-03-input.html`](../../concepts/uc-atm-03-input.html) |
| UC-ATM-03-android | [`concepts/uc-atm-03-input.html`](../../concepts/uc-atm-03-input.html) |
| UC-ATM-04-ios | [`concepts/uc-atm-04-display.html`](../../concepts/uc-atm-04-display.html) |
| UC-ATM-04-android | [`concepts/uc-atm-04-display.html`](../../concepts/uc-atm-04-display.html) |
| UC-ATM-05-ios | [`concepts/uc-atm-05-surfaces.html`](../../concepts/uc-atm-05-surfaces.html) |
| UC-ATM-05-android | [`concepts/uc-atm-05-surfaces.html`](../../concepts/uc-atm-05-surfaces.html) |
| UC-ATM-06-ios | [`concepts/uc-atm-06-pill.html`](../../concepts/uc-atm-06-pill.html) |
| UC-ATM-06-android | [`concepts/uc-atm-06-pill.html`](../../concepts/uc-atm-06-pill.html) |
| UC-ATM-07-ios | [`concepts/uc-atm-07-badge.html`](../../concepts/uc-atm-07-badge.html) |
| UC-ATM-07-android | [`concepts/uc-atm-07-badge.html`](../../concepts/uc-atm-07-badge.html) |
| UC-ATM-08-ios | [`concepts/uc-atm-08-phasedot.html`](../../concepts/uc-atm-08-phasedot.html) |
| UC-ATM-08-android | [`concepts/uc-atm-08-phasedot.html`](../../concepts/uc-atm-08-phasedot.html) |
| UC-ATM-09-ios | [`concepts/uc-atm-09-scrim.html`](../../concepts/uc-atm-09-scrim.html) |
| UC-ATM-09-android | [`concepts/uc-atm-09-scrim.html`](../../concepts/uc-atm-09-scrim.html) |
| UC-ATM-10-ios | [`concepts/uc-atm-10-icon.html`](../../concepts/uc-atm-10-icon.html) |
| UC-ATM-10-android | [`concepts/uc-atm-10-icon.html`](../../concepts/uc-atm-10-icon.html) |

---

## Blocks

- Sprint 3 (Atoms: LSMap) — `LSGlassPanel` from UC-ATM-05 is consumed by LSMap's error-fallback surface.
- Sprint 4 (Molecules) — every molecule composes from UC-ATM-01 through UC-ATM-10 atoms; no molecule may inline a raw `Text`/`Box` with literal colors.
- Sprints 5, 6, 7 — indirectly, through the molecule + organism + screen dependency chain.

---

## Task Detail Files

Generated by `/kb-sprint-tasks-plan` on 2026-04-21T20:30:00Z

- UC-ATM-01-ios-typography-atoms-lstext-ios-swiftui.md
- UC-ATM-01-android-typography-atoms-lstext-android-compose.md
- UC-ATM-02-ios-button-atom-all-variants-states-ios-swiftui.md
- UC-ATM-02-android-button-atom-all-variants-states-android-compose.md
- UC-ATM-03-ios-input-atoms-lstextfield-lstextarea-ios-swiftui.md
- UC-ATM-03-android-input-atoms-lstextfield-lstextarea-android-compose.md
- UC-ATM-04-ios-base-display-atoms-avatar-divider-spinner-ios-swiftui.md
- UC-ATM-04-android-base-display-atoms-avatar-divider-spinner-android-compose.md
- UC-ATM-05-ios-surface-trio-lscard-lspanel-lsglasspanel-ios-swiftui.md
- UC-ATM-05-android-surface-trio-lscard-lspanel-lsglasspanel-android-compose.md
- UC-ATM-06-ios-pill-atom-lspill-ios-swiftui.md
- UC-ATM-06-android-pill-atom-lspill-android-compose.md
- UC-ATM-07-ios-badge-atom-lsbadge-lsbestbadge-ios-swiftui.md
- UC-ATM-07-android-badge-atom-lsbadge-lsbestbadge-android-compose.md
- UC-ATM-08-ios-phasedot-atom-lsphasedot-ios-swiftui.md
- UC-ATM-08-android-phasedot-atom-lsphasedot-android-compose.md
- UC-ATM-09-ios-scrim-atom-lsscrim-ios-swiftui.md
- UC-ATM-09-android-scrim-atom-lsscrim-android-compose.md
- UC-ATM-10-ios-icon-atom-lsicon-design-owned-svg-catalog-ios-swiftui.md
- UC-ATM-10-android-icon-atom-lsicon-design-owned-svg-catalog-android-compose.md
