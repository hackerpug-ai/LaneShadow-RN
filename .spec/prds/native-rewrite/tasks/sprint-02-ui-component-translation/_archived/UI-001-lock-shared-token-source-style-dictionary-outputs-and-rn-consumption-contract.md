# UI-001: Lock shared token source, Style Dictionary outputs, and RN consumption contract

**Task ID:** UI-001
**Sprint:** Sprint 2 - UI Component Translation and Fidelity Sandbox
**Assigned To:** frontend-designer
**Reviewer:** frontend-designer
**Estimate:** 480 min
**Type:** [FEATURE] [INFRA]
**Status:** Planned
**Phase:** Design / Sandbox Planning
**Quality Score:** 115/115

---

## BACKGROUND

Sprint 2 translates the React Native baseline into native platform components and sandbox scenarios before rider-facing feature sprints resume. This task covers the `design` slice for `Lock shared token source, Style Dictionary outputs, and RN consumption contract`.

**Objective:** Lock the cross-platform semantic token contract so RN, Android, and iOS all consume the same generated values before component translation begins. The same generated token outputs feed the installed native-sandbox library's `previewWrapper` theme call paths — iOS `themedPreview { $0.laneShadowTheme() }` (the `.laneShadowTheme()` SwiftUI view extension) and Android `themedPreview { content -> LaneShadowTheme { content() } }` (the `LaneShadowTheme` composable) — so every `Story` canvas renders with identical token values on both platforms.

**Success State:** Generated token outputs, naming rules, and RN consumption expectations are fixed and can be referenced without ambiguity across all Sprint 2 tasks, including the native-sandbox `previewWrapper` theme wiring used by `LaneShadowStories.all` (iOS) and `AppStories.all` (Android).

## CRITICAL CONSTRAINTS

### MUST
- Define one semantic token source of truth and fixed generated output paths for TypeScript, Swift, and Kotlin.
- Preserve the RN `theme.semantic.*` consumption contract while moving underlying values to generated tokens.
- Require token-only styling for all Sprint 2 UI work.
- Ensure the same generated token artifacts are consumed by the iOS `.laneShadowTheme()` extension and the Android `LaneShadowTheme` composable, which are the native-sandbox `previewWrapper` entry points.

### NEVER
- Allow hardcoded UI primitives in native components.
- Rename semantic tokens differently across platforms.
- Allow the native-sandbox preview canvas theme to diverge from the token artifacts RN consumes.

### STRICTLY
- Any platform-specific deviation must be documented as an explicit waiver.

## DELIVERABLES

- tokens/**
- config/**
- react-native/styles/generated/**
- .spec/prds/native-rewrite/08-design-system.md
- Documented contract that the Android `LaneShadowTheme` composable and iOS `.laneShadowTheme()` view extension (the `previewWrapper` consumers in `AppStories.all` / `LaneShadowStories.all`) consume the same generated token artifacts as RN.

## ACCEPTANCE CRITERIA

### AC-1
**GIVEN** The current semantic theme lives in `react-native/styles/theme.ts` and the token architecture is described in `08-design-system.md`.
**WHEN** The source-of-truth token schema, naming transforms, and output locations are locked.
**THEN** A documented contract exists for token categories, naming, generation, and cross-platform consumption.
**Verify:** `rg -n "DTCG|Style Dictionary|build:tokens|tokens/" .spec/prds/native-rewrite/08-design-system.md`

### AC-2
**GIVEN** RN currently consumes `theme.semantic.*`.
**WHEN** The RN migration contract is defined.
**THEN** RN can swap underlying literal values for generated tokens without breaking the current semantic API surface.
**Verify:** `rg -n "theme\.semantic|migration|generated" .spec/prds/native-rewrite/08-design-system.md react-native/styles/theme.ts`

### AC-3
**GIVEN** Sprint 2 requires token-only styling across Android and iOS.
**WHEN** Token enforcement rules are documented.
**THEN** The parity contract explicitly forbids hardcoded UI primitives and identifies verification gates for drift.
**Verify:** `rg -n "Token consumption|hardcoded|drift|validate:tokens" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md`

### AC-4
**GIVEN** All three UI stacks must remain aligned through Sprint 2, including the native-sandbox `previewWrapper` theme call paths (`.laneShadowTheme()` on iOS, `LaneShadowTheme { }` on Android).
**WHEN** Public token APIs and naming rules are frozen.
**THEN** Android, iOS, and RN can reference the same semantic token names without platform-specific renames or ambiguity, and the native-sandbox preview canvases consume the identical token artifacts.
**Verify:** `rg -n "PascalCase|semantic|Theme|ColorScheme" .spec/prds/native-rewrite/08-design-system.md .spec/prds/native-rewrite/08b-android-component-map.md .spec/prds/native-rewrite/08c-ios-component-map.md`

## TEST CRITERIA

| ID | Maps To | Boolean Statement | Verify |
|---|---|---|---|
| TC-1 | AC-1 | A documented contract exists for token categories, naming, generation, and cross-platform consumption. | `rg -n "DTCG\|Style Dictionary\|build:tokens\|tokens/" .spec/prds/native-rewrite/08-design-system.md` |
| TC-2 | AC-2 | RN can swap underlying literal values for generated tokens without breaking the current semantic API surface. | `rg -n "theme\.semantic\|migration\|generated" .spec/prds/native-rewrite/08-design-system.md react-native/styles/theme.ts` |
| TC-3 | AC-3 | The parity contract explicitly forbids hardcoded UI primitives and identifies verification gates for drift. | `rg -n "Token consumption\|hardcoded\|drift\|validate:tokens" .spec/prds/native-rewrite/08d-component-parity-spec.md .spec/prds/native-rewrite/08-design-system.md` |
| TC-4 | AC-4 | Android, iOS, and RN can reference the same semantic token names without platform-specific renames or ambiguity. | `rg -n "PascalCase\|semantic\|Theme\|ColorScheme" .spec/prds/native-rewrite/08-design-system.md .spec/prds/native-rewrite/08b-android-component-map.md .spec/prds/native-rewrite/08c-ios-component-map.md` |
| TC-5 | ALL | Repo validation gates remain green for the touched workspace when this task is complete. | `pnpm typecheck && pnpm lint` |

## READING LIST

1. `.spec/prds/native-rewrite/README.md`
2. `.spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/SPRINT.md`
3. `.spec/prds/native-rewrite/08a-atomic-component-catalog.md`
4. `.spec/prds/native-rewrite/08d-component-parity-spec.md`
5. `RULES.md`
6. `react-native/styles/theme.ts`

## GUARDRAILS

### WRITE-ALLOWED
- tokens/**
- config/**
- react-native/styles/generated/**
- .spec/prds/native-rewrite/08-design-system.md
- .spec/prds/native-rewrite/08d-component-parity-spec.md
- package.json

### WRITE-PROHIBITED
- server/**
- convex/**
- Any unrelated sprint folders outside .spec/prds/native-rewrite/tasks/sprint-02-ui-component-translation/**

### MUST
- Follow the parity contract in `.spec/prds/native-rewrite/08d-component-parity-spec.md`.
- Keep sandbox scenarios deterministic and labeled with RN reference paths.
- Limit changes to the component family or sandbox or reporting surface owned by this task.

### MUST NOT
- Do not add backend or auth dependencies just to render scenarios.
- Do not modify unrelated platform directories or downstream sprint artifacts.

## CODE PATTERN

**Reference:** `react-native/styles/theme.ts`

**Pattern:** Preserve a stable semantic token surface while moving underlying values to generated token artifacts for all three platforms. The same generated artifacts back the native-sandbox `previewWrapper` entry points: iOS `themedPreview { $0.laneShadowTheme() }` and Android `themedPreview { content -> LaneShadowTheme { content() } }`.

**Anti-pattern:** Fork semantic token names or introduce platform-only hardcoded values; theme the native-sandbox preview canvas from a source other than the shared generated tokens.

## TRANSLATION SOURCES

> This task is infrastructure/setup and does not require per-component translation mapping.

## DESIGN NOTES

- Lock semantic token naming, generation outputs, and state variant conventions before platform implementation starts.
- Require token-only styling and explicit waivers for any unavoidable platform variance.
- Preserve RN semantic token consumption while moving underlying values to generated artifacts.
- The native-sandbox library is installed and consumes its theme exclusively through `previewWrapper`: `.laneShadowTheme()` (iOS view extension) and `LaneShadowTheme { }` (Android composable). Both extensions MUST resolve their values from the generated token artifacts this task locks. Sandbox chrome is intentionally theme-neutral; only the preview canvas is themed.

## VERIFICATION GATES

- pnpm lint
- pnpm typecheck
- pnpm --dir react-native exec expo start --help

## DEPENDENCIES

- Sprint 1: Repo Restructure and Server Frontload
- .spec/prds/native-rewrite/08-design-system.md
- .spec/prds/native-rewrite/08d-component-parity-spec.md

## CODING STANDARDS

- .spec/prds/native-rewrite/08d-component-parity-spec.md — naming, interface, token, state, animation, accessibility, keyboard, and RTL parity
- .spec/prds/native-rewrite/08-design-system.md — token generation and consumption rules
- ~/Projects/brain/docs/TDD-METHODOLOGY.md — RED/GREEN/REFACTOR evidence expectations

## OUT OF SCOPE

- Feature wiring beyond sandbox-ready component translation.
- Changes to unrelated sprints or backend and server code.
