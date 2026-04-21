# LaneShadow V2 (Copper · Navigator) — Sprint Plan

**Generated:** 2026-04-20 (re-planned 2026-04-21 for per-platform split + per-task design refs)
**PRD:** [`../README.md`](../README.md) (v2.0.0 · 45 UCs across 6 functional groups · 6-week appetite)
**Design source:** [`../concepts/designs.html`](../concepts/designs.html) (authoritative Copper Navigator visual source)
**Platforms:** iOS (Swift/SwiftUI) + Android (Kotlin/Compose) · parallel per-platform tasks per UC

## Overview

- **Sprints:** 7
- **UCs covered:** 45 (100% PRD coverage)
- **Task rows:** 90 (every UI UC expanded to paired iOS + Android tasks; shared token/contract/cleanup UCs remain single rows; Sprint 1 adds UC-SBX-00-ios/android for native-sandbox install + host wiring)

The sprint sequence mirrors the PRD's atomic-design dependency chain (TOK → ATM → MOL → ORG → SCR → SBX) with the UC-SBX-05 cleanup pass frontloaded in Sprint 1 and UC-SBX-04 RN retirement in Sprint 7. Atoms (ATM) are split across Sprint 2 (foundation primitives, 10 UCs → 20 paired tasks) and Sprint 3 (LSMap atom, 3 UCs already platform-split at the PRD level) because `LSMap` involves Mapbox SDK integration that is qualitatively different from pure-UI atom work. Sprint 3 and Sprint 4 are parallel-capable (molecules do not depend on LSMap).

### Package Boundaries (project-wide CONSTITUTION)

Two sibling local projects own the non-negotiable technical surface for this PRD:

- **Theme package** — `tokens/platforms/swift/Sources/LaneShadowTheme/` (iOS) and `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` + `LaneShadowTheme` Compose wrapper (Android). Path-references `~/Projects/native-theme` for primitives (`ColorSet`, `TypographyStyle`, `parseColorString`) and validates against `~/Projects/native-theme/schema/common.schema.json`. **No literals**: every color / typography / spacing / motion / icon value flows through this package.
- **Sandbox runtime** — `~/Projects/native-sandbox` consumed via SPM path ref (iOS) and Gradle composite build (Android). Stories register into `ios/LaneShadow/Sandbox/Stories/*Stories.swift` and `android/app/src/debug/java/com/laneshadow/sandbox/stories/*Stories.kt` via the native-sandbox API (`Story`, `SandboxRoot`, `ThemeController`, `ArgValues`, `SandboxLaunch`). Story IDs follow the dotted tier-first convention (`atoms.{component}.{variant}`, `molecules.*`, `organisms.*`, `templates.*` for screens, `infrastructure.*` for sandbox-infra tasks). The 6-tier `ComponentTier` enum is fixed — hosts may not extend it.

Every sprint's `SPRINT.md` carries a "Package Boundaries (CONSTITUTION)" section restating these constraints at the tier-appropriate granularity. Violations surface at `/kb-sprint-tasks-plan` (AC failures) and `/kb-run-sprint` (reviewer blockers).

### Sandbox Bootstrap (Sprint 1)

Sprint 1 adds **UC-SBX-00-ios / UC-SBX-00-android** — one-time host wiring that installs native-sandbox via `~/Projects/native-sandbox/bin/install` + `bin/scaffold` and authors the host integration pieces:

- **iOS**: `LaneShadowSandbox` SwiftUI view → `SandboxRoot(stories:, previewWrapper:, themeController:)`, `LaneShadowThemeController: ObservableObject, ThemeController`, `laneShadowPreviewWrapper` wrapping previews in `LaneShadowTheme`, `SandboxLaunch.configure(argFlags: ["-LaneShadowSandbox"], envKeys: ["LANESHADOW_LAUNCH_SANDBOX"])` inside `#if DEBUG`, shake-to-open.
- **Android**: `LaneShadowSandbox` composable → `SandboxRoot(stories, previewWrapper, themeController)`, `LaneShadowThemeBridge: com.nativesandbox.theming.ThemeController` (bridge pattern over existing app mode per RULES §8), `previewWrapper = { LaneShadowTheme { it() } }`, `SandboxLaunch.shouldOpen(intent, extraKey = "com.laneshadow.extra.OPEN_SANDBOX")` gated behind `BuildConfig.DEBUG`, long-press-to-open. Android sandbox code lives only in `src/debug/java/` — never in release.

All downstream UI tasks assume UC-SBX-00 is done; they only register stories against the already-wired `SandboxRoot`.

### Per-Platform Task Model

Every UI UC expands to two parallel tasks — one `-ios` assigned to `swift-implementer` and one `-android` assigned to `kotlin-implementer` — so both platforms are implemented concurrently rather than sequentially. Exceptions (single-row tasks):

- **Shared token pipeline (UC-TOK-01..05)** — one source, generates Swift, Kotlin, and TypeScript outputs in a single pass.
- **Shared contract (UC-ATM-11)** — cross-platform type contract for `LSMap`; implementations (UC-ATM-12 iOS, UC-ATM-13 Android) are already platform-split at the PRD level.
- **Shared cleanup task (UC-SBX-04-shared in Sprint 7)** — repo-wide `react-native/` deletion + config scrub runs once; per-platform verification then splits into `-ios` / `-android`.

### 10-Task-Per-Sprint Gate Waiver

The skill's default `<= 10 tasks per sprint` gate is intentionally exceeded on Sprints 2, 4, 5, and 6 because the user explicitly required paired iOS + Android task rows for parallel execution. The human testing gate for each sprint still operates at UC granularity, so gate-observability is preserved. The per-platform task rows exist to expose parallelism to `/kb-run-sprint` dispatch, not to fragment the human review.

## Sprint Sequence

| # | Sprint | Tasks | Human Testing Gate |
|---|--------|-------|---------------------|
| 1 | [sprint-01-foundation-tokens-and-v2-reset](sprint-01-foundation-tokens-and-v2-reset/SPRINT.md) | 9 | Native-sandbox installed and host-wired (SandboxRoot + LaneShadowTheme previewWrapper + ThemeController bridge + SandboxLaunch), failed-port UI is gone, sandbox launches with zero stories on both platforms, token swatch story renders every semantic color/typography/spacing/motion recipe faithful to concepts. |
| 2 | [sprint-02-atoms-foundation-primitives](sprint-02-atoms-foundation-primitives/SPRINT.md) | 20 | Every foundation atom story (typography, buttons, inputs, avatar/divider/spinner, surface trio incl. LSGlassPanel, LSPill, LSBadge weather, LSPhaseDot, LSScrim, 25-icon SVG catalog) renders identically across platforms. |
| 3 | [sprint-03-atoms-lsmap](sprint-03-atoms-lsmap/SPRINT.md) | 3 | `LSMap` renders multi-polyline best/alt1/alt2 + annotations + error fallback on both platforms via Mapbox Copper Studio styles with no SDK symbols in the shared contract. |
| 4 | [sprint-04-molecules](sprint-04-molecules/SPRINT.md) | 16 | Every molecule story composes over atoms (no inlined primitives) — ChatInput, PhaseIndicator, WeatherTimeline, InstrumentReadout, RouteAttachmentCard, and the Pill semantics family all correct per variant. |
| 5 | [sprint-05-organisms](sprint-05-organisms/SPRINT.md) | 14 | Every organism story renders with mock data — MapLayer z-ordering, NavigatorMessage signal-stripe, InlineErrorCallout warn-stripe, RouteSheet, SessionsDrawer — parity across platforms. |
| 6 | [sprint-06-navigator-screens-and-sandbox-hardening](sprint-06-navigator-screens-and-sandbox-hardening/SPRINT.md) | 20 | Every Navigator screen (Idle/Planning/RouteResults/RouteDetails/Sessions/Error) renders end-to-end; parity manifest passes; `pnpm snapshots:parity-report` shows green side-by-side iOS vs. Android for every variant. |
| 7 | [sprint-07-react-native-shell-retirement](sprint-07-react-native-shell-retirement/SPRINT.md) | 3 | `react-native/` is gone, config scrubbed, both platforms build green, `/native-sandbox` launches with every V2 story intact, pre-commit + pre-push gates pass. |

## Dependency Graph

```
sprint-01-foundation-tokens-and-v2-reset
        │
        ├──► sprint-02-atoms-foundation-primitives
        │           │
        │           ├──► sprint-03-atoms-lsmap ─────────────┐
        │           │                                       │
        │           └──► sprint-04-molecules ───────────────┤
        │                                                   │
        │                                                   ▼
        │                                       sprint-05-organisms
        │                                                   │
        │                                                   ▼
        │                           sprint-06-navigator-screens-and-sandbox-hardening
        │                                                   │
        │                                                   ▼
        └───────────────────►  sprint-07-react-native-shell-retirement
```

Within each sprint, `-ios` and `-android` tasks for the same UC are parallel-capable — they do not share files and can be dispatched concurrently to `swift-implementer` and `kotlin-implementer`.

## Specialist Assignments

Per project `RULES.md` Local Domain Experts:

- **iOS implementation** (`-ios` task rows): `swift-planner` / `swift-implementer` / `swift-reviewer`
- **Android implementation** (`-android` task rows): `kotlin-planner` / `kotlin-implementer` / `kotlin-reviewer`
- **Cross-platform tooling** (token pipeline, shared contracts, repo-wide cleanup): shared by both platform pairs
- **Design exploration** (from `concepts/designs.html`): `frontend-designer` (standalone visual exploration only — not assigned to sprint execution per `RULES.md`)

## Design File Association

Every task row is associated with a specific design reference:

- **UI UCs** (TOK, ATM, MOL, ORG, SCR) → corresponding `concepts/uc-*.html` file
- **Infrastructure UCs** (SBX) → `concepts/designs.html` overview (no per-UC spec; infrastructure tasks)

See the `### Per-Task Design Files` subsection inside each `SPRINT.md` for the full task → design file table.

## Next Steps

1. **Expand tasks for the first sprint before execution:**
   ```
   /kb-sprint-tasks-plan .spec/prds/v2/tasks/sprint-01-foundation-tokens-and-v2-reset/
   ```
   This will generate one `TASK-*.md` per row in the SPRINT's Tasks table (including per-platform rows) with full acceptance criteria, constraints, test criteria, verification gates, and design references.

2. **Run the sprint:**
   ```
   /kb-run-sprint sprint-01-foundation-tokens-and-v2-reset
   ```
   Executes tasks in dependency order with specialist dispatch (per-platform parallel where possible), reviewer verification, and commit enforcement.

3. **Re-plan after PRD edits (preserves unchanged sprints):**
   ```
   /kb-sprint-plan .spec/prds/v2 --delta-replan
   ```

4. **Verify visually after each sprint's human testing gate:**
   ```
   /native-sandbox --platform ios
   /native-sandbox --platform android
   ```
