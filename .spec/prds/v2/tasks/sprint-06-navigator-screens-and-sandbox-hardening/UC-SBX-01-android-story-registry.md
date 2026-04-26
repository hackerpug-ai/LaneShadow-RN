# UC-SBX-01-android: Story registry + tier aggregation + parity manifest (finalize) — Android

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 240 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** L
**PRD Refs:** UC-SBX-01

---

## Background

Finalize the Android side of the cross-platform story registry — six-tier aggregation through LaneShadowSandboxEntry.kt, per-component story files with dotted IDs, and contribution to the canonical `tokens/sandbox/stories.parity.json` so `pnpm sandbox:parity-check` exits 0.

## Critical Constraints

**MUST:**
- Aggregate all six tiers (Atom, Molecule, Organism, Template, Modifier, Infrastructure) in LaneShadowSandboxEntry.kt via Kotlin object accessors (e.g., AtomStories.all + MoleculeStories.all + ...).
- Use dotted `{tier}.{component}.{variant}` story IDs everywhere (e.g., `atoms.button.primary`).
- Each tier aggregator file MUST reduce per-component story files; no Story declared directly in tier files.
- Story ID set on Android MUST match `tokens/sandbox/stories.parity.json` exactly (modulo allow-lists).
- Use `Story`, `SandboxRoot`, `ComponentTier` from native-sandbox composite ONLY — do not redeclare types host-side.

**NEVER:**
- Extend the `ComponentTier` enum (RULES §6 — fixed at 6 values).
- Declare stories directly inside a tier aggregator file.
- Modify the native-sandbox library — it is an external composite include.
- Use ad-hoc string IDs that violate `{tier}.{component}.{variant}`.
- Write into `tokens/platforms/kotlin/.../generated/` — generated code only.

**STRICTLY:**
- Co-locate per-component story objects under `android/app/src/debug/java/com/laneshadow/sandbox/stories/{tier}/{Component}Stories.kt`.
- Register the Infrastructure tier via `InfrastructureStories.all` (consumed by UC-SBX-02/03/06).
- Fail the build (parity-check) on any iOS-only or Android-only story ID without an allow-list entry.

## Specification

**Objective:** Finalize the Android side of the cross-platform story registry — six-tier aggregation through LaneShadowSandboxEntry.kt, per-component story files with dotted IDs, and contribution to the canonical `tokens/sandbox/stories.parity.json`.

**Success State:** `/native-sandbox --platform android` boots and renders every Android story; `pnpm sandbox:parity-check` passes; every story ID matches dotted notation; tier files contain no inline Story declarations.

## Acceptance Criteria

### AC-1 — Six-tier aggregation in entry
- **GIVEN** Developer opens `android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandboxEntry.kt`
- **WHEN** They inspect the root composable
- **THEN** They find a `LaneShadowSandboxEntry` that aggregates `AtomStories.all + MoleculeStories.all + OrganismStories.all + TemplateStories.all + ModifierStories.all + InfrastructureStories.all` into a single `SandboxRoot(stories = ...)` call
- **Verify:** `./gradlew :app:compileDebugKotlin` && grep -c "\.all" android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandboxEntry.kt >= 6
- **TDD State:** RED

### AC-2 — Tier aggregators reduce per-component files
- **GIVEN** Developer opens any tier file (e.g., `AtomStories.kt`)
- **WHEN** They read its `all` property
- **THEN** It is a concatenation of per-component lists (e.g., `AtomButtonStories.all + AtomTypographyStories.all + ...`); zero Story instances are declared directly inside the tier file
- **Verify:** Manual inspection + grep: `grep -n "Story(" android/app/src/debug/java/com/laneshadow/sandbox/stories/{Atom,Molecule,Organism,Template,Modifier,Infrastructure}Stories.kt` returns zero matches
- **TDD State:** RED

### AC-3 — Dotted story ID convention
- **GIVEN** Developer opens any per-component story file
- **WHEN** They inspect every `Story(id = ...)` call site
- **THEN** Every id matches `{tier}.{component}.{variant}` (e.g., `atoms.button.primary`, `templates.idle.default`)
- **Verify:** Grep regression returns zero non-conforming ids
- **TDD State:** RED

### AC-4 — Parity manifest contribution
- **GIVEN** Developer runs `pnpm sandbox:parity-check`
- **WHEN** The script collects Android story IDs via reflection over the registered SandboxRoot stories list
- **THEN** Exit code is 0 — Android story ID set matches the canonical list in `tokens/sandbox/stories.parity.json` (modulo `android_only`/`ios_only` allow-lists)
- **Verify:** `pnpm sandbox:parity-check` exits 0
- **TDD State:** RED

### AC-5 — Sandbox boots and renders all Android stories
- **GIVEN** Developer launches `/native-sandbox --platform android`
- **WHEN** The sandbox starts on an emulator
- **THEN** Every Android-registered story renders without crash and is selectable from the tier-grouped list
- **Verify:** `pnpm sandbox:android` launches; manual smoke-tap through tiers shows all stories load
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | AtomStories.all.size == sum of per-component story counts | AC-2 | JUnit unit test asserts equality | unit |
| TC-2 | Every Story.id in InfrastructureStories.all matches regex `^infrastructure\.[a-z0-9-]+\.[a-z0-9-]+$` | AC-3 | JUnit regex assertion over flattened story list | unit |
| TC-3 | LaneShadowSandboxEntry exposes exactly 6 tier aggregations | AC-1 | JUnit reflection test counts `.all` references | unit |
| TC-4 | `sandbox:parity-check` returns exit 0 with current Android registry | AC-4 | Run `pnpm sandbox:parity-check` from CI | integration |

## Reading List

- `concepts/designs.html` lines `1-end` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/09-uc-sbx.md` lines `23-35` — UC-SBX-01 acceptance criteria verbatim
- `.spec/prds/v2/11-technical-requirements.md` lines `188-215` — Story / ThemeController / MockProvider API contracts
- `RULES.md` lines `1-end` — §6 ComponentTier fixed enum, §10 args wiring policy
- `tokens/sandbox/stories.parity.json` lines `1-end` — Canonical cross-platform story ID list
- `android/app/src/debug/java/com/laneshadow/sandbox/` lines `all` — Existing partial sandbox tree to finalize
- `ios/LaneShadow/Sandbox/LaneShadowSandboxEntry.swift` lines `1-end` — Reference implementation for parity

## Guardrails

**WRITE-ALLOWED:**
- `android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowSandboxEntry.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/**`
- `android/app/src/debug/java/com/laneshadow/sandbox/InfrastructureStories.kt`
- `tokens/sandbox/stories.parity.json` (additions only — coordinate with iOS counterpart)
- `android/app/src/test/java/com/laneshadow/sandbox/**` (unit tests)

**WRITE-PROHIBITED:**
- `ios/**`
- `react-native/**`
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/**` — read only
- native-sandbox library — external dep

## Code Pattern

**Reference:** Storywright-style tier aggregation: top-level entry composes 6 tier `.all` values; tier files compose per-component `.all` values; component files declare individual `Story(...)` instances.

**Source:** `.spec/prds/v2/09-uc-sbx.md#UC-SBX-01`

**Anti-Pattern:** Declaring Story instances directly in `AtomStories.kt`, or using non-dotted IDs like `"buttonPrimary"` instead of `"atoms.button.primary"`.

## Design

**References:**
- `concepts/designs.html`
- `.spec/prds/v2/09-uc-sbx.md#UC-SBX-01`

**Interaction Notes:**
- Sandbox shell renders a tier-grouped list of stories; tapping a story opens its preview. No bespoke styling — relies on native-sandbox SandboxRoot.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `cd android && ./gradlew detekt` | 0 violations |
| build | `cd android && ./gradlew :app:compileDebugKotlin` | BUILD SUCCESSFUL |
| unit-test | `cd android && ./gradlew :app:testDebugUnitTest` | All tier-count + ID-regex tests pass |
| parity-check | `pnpm sandbox:parity-check` | Exit 0; Android set matches manifest |
| sandbox-launch | `pnpm sandbox:android` | App boots; all tier stories render |

## Agent Assignment

**Agent:** kotlin-implementer

**Rationale:** Pure Android Kotlin/Compose work — wiring story aggregator objects, dotted IDs, and SandboxRoot integration via the native-sandbox Gradle composite. kotlin-implementer owns Compose + Kotlin object aggregation patterns.

## Coding Standards

- `brain/docs/kotlin-rules.md`
- `RULES.md §6 ComponentTier`
- `RULES.md §10 args`

## Dependencies

**Depends On:** _(none)_

**Blocks:** UC-SCR-01-android, UC-SCR-02-android, UC-SCR-03-android, UC-SCR-04-android, UC-SCR-05-android, UC-SCR-06-android, UC-SBX-02-android, UC-SBX-06-android

## TDD Workflow

1. **RED** — Write JUnit tests for tier aggregation, dotted IDs, parity manifest schema
2. **GREEN** — Implement tier aggregators + per-component story objects + manifest contribution
3. **REFACTOR** — Clean
4. **VERIFY** — Run all gates; commit when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Six-tier aggregation in entry","verify":"build + grep"},
{"id":"AC-2","type":"acceptance_criterion","description":"Tier aggregators reduce per-component files","verify":"grep"},
{"id":"AC-3","type":"acceptance_criterion","description":"Dotted story ID convention","verify":"regex"},
{"id":"AC-4","type":"acceptance_criterion","description":"Parity manifest contribution","verify":"shell"},
{"id":"AC-5","type":"acceptance_criterion","description":"Sandbox renders all Android stories","verify":"manual launch"},
{"id":"TC-1","type":"test_criterion","description":"Tier sum equality","verify":"unit","maps_to_ac":"AC-2"},
{"id":"TC-2","type":"test_criterion","description":"InfrastructureStories ids match regex","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-3","type":"test_criterion","description":"6 tier aggregations","verify":"unit","maps_to_ac":"AC-1"},
{"id":"TC-4","type":"test_criterion","description":"sandbox:parity-check exits 0","verify":"integration","maps_to_ac":"AC-4"}
]}
-->
