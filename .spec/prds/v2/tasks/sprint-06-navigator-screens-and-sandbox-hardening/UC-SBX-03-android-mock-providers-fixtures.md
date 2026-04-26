# UC-SBX-03-android: Mock data providers + fixtures (finalize all 6 screen providers) — Android

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 240 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** L
**PRD Refs:** UC-SBX-03

---

## Background

Finalize the Android mock provider layer for all six Navigator screens — typed providers wrapping generated Fixtures.kt, with `default`/`empty`/`overflow`/`long-copy` variants where the screen demands them, all wired into the corresponding screen stories.

## Critical Constraints

**MUST:**
- Implement `IdleMockProvider`, `PlanningMockProvider`, `RouteResultsMockProvider`, `RouteDetailsMockProvider`, `SessionsMockProvider`, `ErrorMockProvider` as Kotlin objects implementing the `MockProvider<T>` contract.
- Each provider exposes `value(variant: String = "default"): T` returning a deterministic, fully-typed Navigator-domain payload sourced from generated `Fixtures.kt`.
- Each provider declares a `variants: List<String>` static including at minimum `"default"` and additional variants `"empty"`, `"overflow"`, `"long-copy"` where applicable.
- Provider data shapes MUST mirror the Navigator-domain entities in `11-technical-requirements.md` (Route, Session, NavigatorMessage, PlanningPhase, etc.).
- All Navigator screen stories MUST consume named providers — never inline literals inside the story body.

**NEVER:**
- Perform I/O — no network, no disk, no Convex, no `runBlocking` reads.
- Duplicate fixture content inline in providers — always read through generated `Fixtures.kt`.
- Modify `tokens/sandbox/fixtures/` schema in this task (codegen step is separate).
- Expose mutable state from a provider — return immutable data classes / `List` (not MutableList).
- Access generated Fixtures from outside debug variant code paths.

**STRICTLY:**
- Enforce purity via a unit test that introspects each provider for I/O calls (no `java.io.*`, no `okhttp3.*`, no Convex client refs).
- Support deterministic `variant` switching — same variant string returns identical payload across calls.
- Type-match the Navigator domain — `Route.scenicScore` is Int 0-10, `Session.routeIds` references existing Route IDs from fixtures, etc.

## Specification

**Objective:** Finalize the Android mock provider layer for all six Navigator screens — typed providers wrapping generated Fixtures.kt, with `default`/`empty`/`overflow`/`long-copy` variants where the screen demands them.

**Success State:** Every Navigator screen story on Android renders from a named `*MockProvider`; `pnpm fixtures:generate` produces matching Kotlin types; purity test passes; provider variant arg control swaps payloads live.

## Acceptance Criteria

### AC-1 — Six named providers exist
- **GIVEN** Developer opens `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/`
- **WHEN** They list the directory
- **THEN** They find `IdleMockProvider.kt`, `PlanningMockProvider.kt`, `RouteResultsMockProvider.kt`, `RouteDetailsMockProvider.kt`, `SessionsMockProvider.kt`, `ErrorMockProvider.kt` — each a Kotlin object implementing `MockProvider<T>`
- **Verify:** `ls android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/*MockProvider.kt | wc -l` >= 6
- **TDD State:** RED

### AC-2 — Typed payloads from generated Fixtures
- **GIVEN** Developer imports `LaneShadowMocks` (`tokens/platforms/kotlin/.../generated/Fixtures.kt`)
- **WHEN** They read `Mocks.routes[0]`
- **THEN** They get a fully-typed `Route` data class whose fields (id, name, via, distance, estimatedTime, climb, scenicScore, difficulty, polyline, variant) match `11-technical-requirements.md` Route entity
- **Verify:** JUnit test instantiates each provider, asserts non-null typed fields per Navigator schema
- **TDD State:** RED

### AC-3 — Variant switching via arg control
- **GIVEN** A screen story declares `argTypes = listOf(ArgType("provider", control = Select(options = listOf("default","empty","overflow","long-copy"))))`
- **WHEN** Developer changes the dropdown in the sandbox
- **THEN** Story re-renders with the corresponding variant payload (e.g., `empty` → no routes; `overflow` → 12+ routes; `long-copy` → multi-line text)
- **Verify:** Compose UI test asserts node count differs across variants
- **TDD State:** RED

### AC-4 — Stories consume providers, never inline
- **GIVEN** Developer greps every Navigator screen story file under `android/app/src/debug/.../stories/screens/`
- **WHEN** They search for hardcoded String/Int literals in Story bodies
- **THEN** Zero matches — every payload field originates from a `*MockProvider.value(variant = ...)` call
- **Verify:** Grep regression returns zero non-comment lines
- **TDD State:** RED

### AC-5 — No I/O in providers
- **GIVEN** A purity test scans every `*MockProvider.kt`
- **WHEN** It checks bytecode/source for I/O imports
- **THEN** Zero references to `java.io.*`, `okhttp3.*`, `kotlinx.coroutines.flow.Flow`, Convex client classes, or `runBlocking`
- **Verify:** JUnit unit test reads provider source files + asserts no banned imports
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | Each of 6 providers returns a non-null typed payload for variant="default" | AC-1, AC-2 | Parameterized JUnit test | unit |
| TC-2 | Repeated calls to provider.value(variant=X) return equal payloads (determinism) | AC-3 | JUnit equality assertion | unit |
| TC-3 | Provider source files contain no banned I/O imports | AC-5 | JUnit source scan | unit |
| TC-4 | Each Navigator screen story registers a MockProvider; no inline payload literals | AC-4 | Grep + JUnit reflection over registered stories | unit |
| TC-5 | `empty` variant returns empty/cleared payload; `overflow` returns >=10 records | AC-3 | Provider unit tests with variant assertions | unit |

## Reading List

- `concepts/designs.html` lines `1-end` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/09-uc-sbx.md` lines `53-65` — UC-SBX-03 acceptance criteria verbatim
- `.spec/prds/v2/11-technical-requirements.md` lines `36-220` — Navigator domain entities + MockProvider API contract
- `tokens/sandbox/fixtures/` lines `all JSON files` — Fixture record shapes
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/` lines `all` — Generated Fixtures.kt typed structs (READ ONLY)
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/` lines `all` — Existing partial providers to finalize
- `server/convex/schema.ts` lines `1-end` — Read-type reference for Route + User shape parity

## Guardrails

**WRITE-ALLOWED:**
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/IdleMockProvider.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/PlanningMockProvider.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/RouteResultsMockProvider.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/RouteDetailsMockProvider.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/SessionsMockProvider.kt`
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/ErrorMockProvider.kt`
- `android/app/src/test/java/com/laneshadow/sandbox/mockproviders/**`

**WRITE-PROHIBITED:**
- `ios/**`
- `react-native/**`
- `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/**` — read only
- `tokens/sandbox/fixtures/**` — codegen-managed in this task scope
- native-sandbox library — external dep
- `server/convex/**` — read-only reference

## Code Pattern

**Reference:** Kotlin object implementing `MockProvider<T>` from native-sandbox; `value(variant)` returns immutable data classes built from generated `Fixtures.Routes`/`Fixtures.Sessions`/etc.

**Source:** `.spec/prds/v2/09-uc-sbx.md#UC-SBX-03`

**Anti-Pattern:** Inlining `Route(id = "r1", name = "...", ...)` directly in a Story body, or calling Convex/HTTP/disk from a provider.

## Design

**References:**
- `concepts/designs.html`
- `.spec/prds/v2/09-uc-sbx.md#UC-SBX-03`

**Interaction Notes:**
- Providers are headless data sources — UI is delivered by stories that consume them.
- The `provider` arg control selects between `default` / `empty` / `overflow` / `long-copy` variants for visual stress-testing.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `cd android && ./gradlew detekt` | 0 violations |
| build | `cd android && ./gradlew :app:compileDebugKotlin` | BUILD SUCCESSFUL |
| unit-test | `cd android && ./gradlew :app:testDebugUnitTest` | All provider, purity, and variant tests pass |
| token-validation | `pnpm tokens:validate` | Fixtures schema valid |
| sandbox-launch | `pnpm sandbox:android` | Each Navigator screen story renders from its named provider |

## Agent Assignment

**Agent:** kotlin-implementer

**Rationale:** Pure Kotlin data classes + provider objects consuming generated Fixtures.kt. No Compose UI. kotlin-implementer owns Kotlin data layer + test patterns.

## Coding Standards

- `brain/docs/kotlin-rules.md`
- `RULES.md §6 ComponentTier`
- `RULES.md §10 args`

## Dependencies

**Depends On:** UC-SBX-01-android

**Blocks:** UC-SCR-01-android, UC-SCR-02-android, UC-SCR-03-android, UC-SCR-04-android, UC-SCR-05-android, UC-SCR-06-android

## TDD Workflow

1. **RED** — Write JUnit provider/purity/variant tests
2. **GREEN** — Implement six providers consuming generated fixtures
3. **REFACTOR** — Clean
4. **VERIFY** — Run all gates; commit when green

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"Six named providers exist","verify":"shell ls"},
{"id":"AC-2","type":"acceptance_criterion","description":"Typed payloads from generated Fixtures","verify":"unit"},
{"id":"AC-3","type":"acceptance_criterion","description":"Variant switching via arg control","verify":"ui"},
{"id":"AC-4","type":"acceptance_criterion","description":"Stories consume providers; never inline","verify":"grep"},
{"id":"AC-5","type":"acceptance_criterion","description":"No I/O in providers","verify":"unit"},
{"id":"TC-1","type":"test_criterion","description":"6 providers return typed payload","verify":"unit","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Determinism","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-3","type":"test_criterion","description":"No banned I/O imports","verify":"unit","maps_to_ac":"AC-5"},
{"id":"TC-4","type":"test_criterion","description":"Stories register MockProvider, no inline","verify":"unit","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"empty + overflow variants behave","verify":"unit","maps_to_ac":"AC-3"}
]}
-->
