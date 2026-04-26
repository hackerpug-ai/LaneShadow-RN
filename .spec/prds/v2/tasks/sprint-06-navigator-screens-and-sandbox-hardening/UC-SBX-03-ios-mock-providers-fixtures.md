# UC-SBX-03-ios: Mock data providers + fixtures (finalize all 6 screen providers) — iOS

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 240 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** L
**PRD Refs:** UC-SBX-03

---

## Background

Finalize the iOS mock data layer: ensure `tokens/sandbox/fixtures/*.json` is complete (routes, users, sessions, navigator-messages, weather-timelines, planning-phases, suggestion-chips), regenerate `LaneShadowMocks.Generated.Fixtures`, and ship six pure-function Navigator screen providers each exposing four selectable variants (default/empty/overflow/long-copy). Wires generated fixture types from `LaneShadowMocks` into six Navigator screen mock providers.

## Critical Constraints

**MUST:**
- All six Navigator screen providers (`IdleMockProvider`, `PlanningMockProvider`, `RouteResultsMockProvider`, `RouteDetailsMockProvider`, `SessionsMockProvider`, `ErrorMockProvider`) MUST be pure synchronous functions/types returning typed fixture records — zero I/O.
- Each provider MUST source data from generated `LaneShadowMocks.Generated.Fixtures` (consumed via SPM) — never inline literals inside the story.
- Each provider MUST expose at least four named variants: `default`, `empty`, `overflow`, `long-copy` — selectable via a `.select` argType.
- Provider data shapes MUST mirror the read types in `server/convex/schema.ts` (with Navigator-domain extensions per `11-technical-requirements.md`) so future integration is a 1:1 swap.
- If `tokens/platforms/swift/Sources/LaneShadowMocks/Generated/Fixtures.swift` does not yet exist, run `pnpm fixtures:generate` and commit the regenerated output as part of this task.

**NEVER:**
- Perform any network, disk, Convex, or filesystem I/O inside a provider — providers are pure functions.
- Inline mock data literals inside Navigator screen stories — stories MUST consume providers.
- Modify generated `Fixtures.swift` by hand — regenerate via `pnpm fixtures:generate`.
- Touch any path under `android/**`, `react-native/**`, `server/convex/**`, or `~/Projects/native-sandbox/**`.
- Add new fixture JSON files without first verifying the field shapes against `server/convex/schema.ts`.

**STRICTLY:**
- A platform test (`MockProviderPurityTests`) asserts every provider is annotated `@MockProvider` (or equivalent marker) and surfaces zero I/O symbols (no `URLSession`, no `FileManager`, no `Convex*`).
- Each provider variant returns deterministic data — same call returns identical values across invocations.
- Provider variants are registered under `infrastructure.providers.*` stories so they are individually visible/inspectable in the sandbox.

## Specification

**Objective:** Finalize the iOS mock data layer: ensure `tokens/sandbox/fixtures/*.json` is complete, regenerate `LaneShadowMocks.Generated.Fixtures`, and ship six pure-function Navigator screen providers each exposing four selectable variants.

**Success State:** All six Navigator screen stories in Sprint 6 (UC-SCR-01..06) consume their provider via a `provider` argType `.select` control; toggling the variant live-swaps the rendered fixture data; a purity test confirms zero providers perform I/O; `pnpm fixtures:generate` is idempotent.

## Acceptance Criteria

### AC-1 — Fixture JSON corpus complete
- **GIVEN** A developer opens `tokens/sandbox/fixtures/`
- **WHEN** They list the directory
- **THEN** They find at minimum: `routes.fixtures.json`, `users.fixtures.json`, `sessions.fixtures.json`, `navigator-messages.fixtures.json`, `weather-timelines.fixtures.json`, `planning-phases.fixtures.json`, `suggestion-chips.fixtures.json` — each with 6–12 representative records
- **Verify:** `ls tokens/sandbox/fixtures/`; load each JSON; assert record count ∈ [6,12]
- **TDD State:** RED

### AC-2 — Generated Swift fixtures importable
- **GIVEN** The developer runs `pnpm fixtures:generate`
- **WHEN** The script completes
- **THEN** `tokens/platforms/swift/Sources/LaneShadowMocks/Generated/Fixtures.swift` exists and exports typed structs (e.g., `Route`, `User`, `Session`, `NavigatorMessage`) whose fields mirror `server/convex/schema.ts` read types; importing `LaneShadowMocks` and reading `Mocks.routes[0]` returns a fully-typed value
- **Verify:** Run `pnpm fixtures:generate`; build iOS; unit test in `LaneShadowMocksTests` reads `Mocks.routes[0].id` and asserts non-empty
- **TDD State:** RED

### AC-3 — Six Navigator screen providers exist
- **GIVEN** A developer opens `ios/LaneShadow/Sandbox/MockProviders/`
- **WHEN** They list the directory
- **THEN** They find `IdleMockProvider.swift`, `PlanningMockProvider.swift`, `RouteResultsMockProvider.swift`, `RouteDetailsMockProvider.swift`, `SessionsMockProvider.swift`, `ErrorMockProvider.swift` — each declaring a typed `static func provide(variant: String) -> ScreenState` that wraps generated fixtures
- **Verify:** Read each file; confirm the function signature and variant switch
- **TDD State:** RED

### AC-4 — Four named variants per provider
- **GIVEN** Any of the six Navigator screen providers
- **WHEN** A developer calls `provide(variant:)` with `"default"`, `"empty"`, `"overflow"`, `"long-copy"`
- **THEN** Each call returns a deterministic, distinguishable `ScreenState` — `default` is the canonical happy path, `empty` returns zero-record collections, `overflow` returns 12+ records to stress layout, `long-copy` returns records with maximally long strings
- **Verify:** Unit test in `MockProviderVariantTests` calls each variant and asserts distinguishing properties
- **TDD State:** RED

### AC-5 — Stories consume providers via select argType
- **GIVEN** Any Navigator screen story (e.g., `templates.idle.default`)
- **WHEN** A developer reads its `argTypes` declaration
- **THEN** It includes `.init("provider", control: .select(options: ["default", "empty", "overflow", "long-copy"]))`; the `render(args)` closure dispatches to `IdleMockProvider.provide(variant: args["provider"])` (or analogous) — no inline mock literals
- **Verify:** Read each Navigator screen story; grep for inline mock literals (zero matches expected); confirm provider call site
- **TDD State:** RED

### AC-6 — Provider purity test
- **GIVEN** The test target `LaneShadowTests/Sandbox/`
- **WHEN** A developer runs `MockProviderPurityTests`
- **THEN** The test asserts every provider in `ios/LaneShadow/Sandbox/MockProviders/` contains zero references to `URLSession`, `FileManager`, `Convex`, `URL(string:)` for network, or any async I/O primitive
- **Verify:** Run `xcodebuild test`; assert `MockProviderPurityTests` passes
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | All required fixture JSON files exist with 6–12 records | AC-1 | Test loads each JSON path and asserts record count ∈ [6,12] | unit |
| TC-2 | Mocks.routes[0] decodes into typed Route struct | AC-2 | Unit test imports `LaneShadowMocks`; asserts non-empty `Mocks.routes` with typed access | unit |
| TC-3 | All six providers exist with provide(variant:) signature | AC-3 | Unit test reflects on each provider type and confirms function presence | unit |
| TC-4 | Each variant returns distinguishable, deterministic data | AC-4 | Test calls all four variants per provider; asserts uniqueness + deterministic equality across two calls | unit |
| TC-5 | No provider references I/O symbols | AC-6 | MockProviderPurityTests scans provider source files for forbidden symbols; asserts zero matches | static |

## Reading List

- `.spec/prds/v2/09-uc-sbx.md` lines `53-64` — UC-SBX-03 acceptance criteria — fixtures, generated mocks, six providers, four variants, purity
- `.spec/prds/v2/11-technical-requirements.md` lines `all` — Navigator-domain field extensions on top of Convex read types
- `concepts/designs.html` lines `all` — REQUIRED READING — visual design source for this task
- `tokens/sandbox/fixtures/` lines `all` — Existing fixture corpus (routes already present); identify gaps
- `server/convex/schema.ts` lines `all` — READ-ONLY — read-type shapes that fixture/provider types must mirror
- `ios/LaneShadow/Sandbox/MockProviders/` lines `all` — Existing partial providers if any
- `tokens/platforms/swift/Sources/` lines `all` — Generated mocks SPM package — confirm `LaneShadowMocks` target exists
- `scripts/fixtures/` lines `all` — Codegen script invoked by `pnpm fixtures:generate`

## Guardrails

**WRITE-ALLOWED:**
- `tokens/sandbox/fixtures/*.fixtures.json`
- `tokens/platforms/swift/Sources/LaneShadowMocks/Generated/Fixtures.swift`
- `ios/LaneShadow/Sandbox/MockProviders/IdleMockProvider.swift`
- `ios/LaneShadow/Sandbox/MockProviders/PlanningMockProvider.swift`
- `ios/LaneShadow/Sandbox/MockProviders/RouteResultsMockProvider.swift`
- `ios/LaneShadow/Sandbox/MockProviders/RouteDetailsMockProvider.swift`
- `ios/LaneShadow/Sandbox/MockProviders/SessionsMockProvider.swift`
- `ios/LaneShadow/Sandbox/MockProviders/ErrorMockProvider.swift`
- `ios/LaneShadow/Sandbox/Stories/Infrastructure/InfrastructureProvidersStories.swift`
- `ios/LaneShadowTests/Sandbox/MockProviderVariantTests.swift`
- `ios/LaneShadowTests/Sandbox/MockProviderPurityTests.swift`
- `ios/LaneShadowTests/Sandbox/FixtureGenerationTests.swift`

**WRITE-PROHIBITED:**
- `android/**`
- `react-native/**`
- `server/convex/**` — read only (schema reference)
- `tokens/platforms/swift/Sources/LaneShadowTheme/**` — read only
- `~/Projects/native-sandbox/**` — external dep

## Code Pattern

**Reference:** Pure-function provider layer over generated typed fixtures; variant dispatch via single string parameter to enable `.select` control wiring.

**Source:** PRD UC-SBX-03; Convex schema mirroring convention from `11-technical-requirements.md`.

**Anti-Pattern:** Inline mock literals inside stories; providers performing async/I/O; variant data derived from runtime randomness instead of fixed fixtures.

## Design

**References:**
- `concepts/designs.html`
- `.spec/prds/v2/09-uc-sbx.md#UC-SBX-03`

**Interaction Notes:**
- Each Navigator screen story shows a `provider` dropdown in the inspector.
- Switching variant from `default` → `empty` clears the rendered list; `overflow` causes scroll; `long-copy` stresses text wrapping.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `swiftlint --quiet --strict` | Zero warnings, zero errors |
| fixture-codegen | `pnpm fixtures:generate` | Exit 0; idempotent regeneration; no diff on second run |
| build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` | BUILD SUCCEEDED |
| unit-tests | `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | MockProviderVariantTests + MockProviderPurityTests + FixtureGenerationTests all pass |
| sandbox-launch | `pnpm sandbox:ios` | All six provider variant stories selectable under `infrastructure.providers.*`; variant dropdown swaps data live |

## Agent Assignment

**Agent:** swift-implementer

**Rationale:** Wires generated fixture types from `LaneShadowMocks` into six Navigator screen mock providers (Idle/Planning/RouteResults/RouteDetails/Sessions/Error). All Swift glue lives under `ios/LaneShadow/Sandbox/MockProviders/**`. swift-implementer owns the host-side provider layer.

## Coding Standards

- `brain/docs/swift-rules.md`
- `RULES.md §6 ComponentTier`
- `RULES.md §10 args`

## Dependencies

**Depends On:** UC-SBX-01-ios

**Blocks:** UC-SCR-01-ios, UC-SCR-02-ios, UC-SCR-03-ios, UC-SCR-04-ios, UC-SCR-05-ios, UC-SCR-06-ios

## TDD Workflow

1. **RED** — Write MockProviderVariantTests + PurityTests + FixtureGenerationTests
2. **GREEN** — Author fixtures + regenerate + implement six providers
3. **REFACTOR** — Collapse duplication
4. **VERIFY** — Run all gates; commit when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Fixture JSON corpus complete","verify":"shell + load"},
{"id":"AC-2","type":"acceptance_criterion","description":"Generated Swift fixtures importable","verify":"unit"},
{"id":"AC-3","type":"acceptance_criterion","description":"Six Navigator screen providers exist","verify":"file inspect"},
{"id":"AC-4","type":"acceptance_criterion","description":"Four named variants per provider","verify":"unit"},
{"id":"AC-5","type":"acceptance_criterion","description":"Stories consume providers via select argType","verify":"grep + inspect"},
{"id":"AC-6","type":"acceptance_criterion","description":"Provider purity test","verify":"unit"},
{"id":"TC-1","type":"test_criterion","description":"Fixture record counts in [6,12]","verify":"unit","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Typed Route struct from Mocks.routes[0]","verify":"unit","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"All providers have provide(variant:)","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Variants distinguishable + deterministic","verify":"unit","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Zero I/O symbols in providers","verify":"static","maps_to_ac":"AC-6"}
]}
-->
