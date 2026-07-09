# REDHAT-FIX-004: H-1 + H-2 — extract MOCK_SEMANTIC + shared RN mock infrastructure to shared test helpers

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** M · **Estimate:** 90 min
**Agent:** react-native-ui-implementer
**Proposed By:** react-native-ui-planner
**TDD Mode:** red_first · **RED/GREEN Required:** yes
**Agent rationale:** Owns the RN integration test files in `app/(app)/(tabs)/` and `components/chat/cards/`. The work is a pure test-only refactor (no production code touched), so react-native-ui-implementer can drive the extraction, prove all four suites still pass under vitest, and run the type-check + biome gates.

> **Source:** [red-hat-sprint-01-discovery-2026-07-03T18-53-01Z.md](../../../reviews/red-hat-sprint-01-discovery-2026-07-03T18-53-01Z.md) — cycle-1 re-review findings H-1 (MOCK_SEMANTIC duplicated ~207 lines across 4 RN integration suites) and H-2 (the ~20 `vi.mock()` blocks + map-ref/context stubs duplicated across the 3 `index.*` suites).

## Outcome

The ~207-line `MOCK_SEMANTIC` theme object is defined exactly once in a shared fixture and imported by all four RN integration test files; a shared `setupHomeScreenMocks()` / `renderHomeScreen()` helper encapsulates the duplicated `vi.mock()` boundary stack for the three `index.*` suites; all four suites still pass green under vitest, and `pnpm type-check` + `pnpm exec biome check` pass on every changed file.

## Specification

**Part A — H-1 MOCK_SEMANTIC extraction (PRIMARY):** The identical ~207-line `MOCK_SEMANTIC` object (color/space/radius/type/elevation/control/opacity/borderWidth) is copy-pasted into four RN integration test files — `app/(app)/(tabs)/index.route-tag.integration.test.tsx:208-414`, `app/(app)/(tabs)/index.card-loading.integration.test.tsx:194-400`, `app/(app)/(tabs)/index.discovery.integration.test.tsx:193-399`, and `components/chat/cards/curated-route-card.integration.test.tsx:248-454`. Extract it ONCE into a shared fixture at `test-helpers/mock-semantic.ts` (exported as `MOCK_SEMANTIC`) and replace each in-file definition with `import { MOCK_SEMANTIC } from '<relative path>/test-helpers/mock-semantic'`. The object must be byte-identical to the current definition — no token edits, no field renames, no reorderings. The `useSemanticTheme` mock in each file continues to reference the (now imported) `MOCK_SEMANTIC`.

**Part B — H-2 shared index-screen mock harness:** The three `index.*` suites (`index.route-tag`, `index.card-loading`, `index.discovery`) each duplicate the same ~20 `vi.mock()` boundary blocks: `convex/react`, `expo-router`, `react-native-safe-area-context`, `react-native-reanimated`, `@clerk/clerk-expo`, `expo-haptics`, `@rnmapbox/maps`, the context mocks (`search-results`, `selected-route`, `theme-preference`), the hook mocks (`use-active-session-route`, `use-chat-planning`, `use-curated-discovery`, `use-current-location`, `use-is-route-saved`, `use-plan-ride`, `use-ride-flow`, `use-toast-messages`), the `chat-session-store` mock, the `use-semantic-theme` mock, and the `@rnmapbox/maps` + map-component mocks. Create `test-helpers/index-screen.ts` exporting `setupHomeScreenMocks()` (registers every `vi.mock()` listed above and returns the shared mock handles — `mockUseQuery`, `mockUseMutation`, `mockUseActiveSessionRoute`, `mockUseRideFlow`, `mockFitToCoordinates`, `mockSetCameraPosition`, `mockMapRef`, `mockSetSelectedRouteId`, etc.) and `renderHomeScreen()` (calls `setupHomeScreenMocks()` then `render(createElement(Index))`). The three `index.*` files MUST call `setupHomeScreenMocks()` instead of inlining the `vi.mock()` stack; per-test files retain only the mock RETURN values they set (e.g. `mockUseActiveSessionRoute.mockReturnValue(...)`), since those are scenario-specific.

**Path note (adaptation from requested path):** This task was requested with helpers at `react-native/test-helpers/`. The repo has NO `react-native/` subdirectory — app code lives at the repo root, and a `test-helpers/` directory already exists there (see `test-helpers/overlays.ts`). Helpers land at the existing root `test-helpers/` so the relative imports (`../../../test-helpers/mock-semantic` from `app/(app)/(tabs)/`, `../../test-helpers/mock-semantic` from `components/chat/cards/`) resolve correctly and stay consistent with the existing `overlays.ts` pattern.

**Out of scope (do NOT refactor here):** The OTHER four suites that also duplicate `MOCK_SEMANTIC` (`index.one-route`, `index.route-tap`, `index.carousel`, `index.finished-route-fit`) — they are not named in H-1 and widening the blast radius risks the gate. A follow-up can migrate them to the same fixture once this lands.

## Critical Constraints

- **MUST** define `MOCK_SEMANTIC` exactly once in `test-helpers/mock-semantic.ts`; zero remaining in-file definitions across the four target files after refactor.
- **MUST** keep `MOCK_SEMANTIC` byte-identical to the current definition (same keys, same order, same string/number literals). A diff in the object's values is a regression.
- **MUST NOT** touch any production (non-test) source file. This is a test-only refactor.
- **MUST** preserve every assertion and test name in all four suites — the refactor is behavior-preserving; only the mock plumbing moves.
- **NEVER** change `useSemanticTheme` to return a different shape — it still returns `{ semantic: MOCK_SEMANTIC }` with the imported object.
- **MUST** keep per-file scenario-specific mock RETURN wiring in the test files (only the `vi.mock()` registrations + handle declarations move into the helper); moving scenario return values into the helper would couple unrelated suites.
- **MUST** run `validate_scenario` on the REQUIREMENT-CONTRACT scenario fixture before declaring done; the non-waivable Fakeability Floor applies.

## Acceptance Criteria

### AC-1: MOCK_SEMANTIC is defined exactly once in the shared fixture and imported by all four test files
*(PRIMARY)*
- **GIVEN** the four target RN integration suites each currently inline a ~207-line `MOCK_SEMANTIC` object
- **WHEN** the refactor lands
- **THEN** `test-helpers/mock-semantic.ts` exports `MOCK_SEMANTIC`; each of the four files imports it; `grep -rn "const MOCK_SEMANTIC"` returns zero hits inside the four target files (only the shared fixture defines it)
- **Test tier:** `unit` (grep/code-shape) · **Service:** repo source (grep across `app/(app)/(tabs)/index.route-tag.integration.test.tsx`, `app/(app)/(tabs)/index.card-loading.integration.test.tsx`, `app/(app)/(tabs)/index.discovery.integration.test.tsx`, `components/chat/cards/curated-route-card.integration.test.tsx`)
- **Verify:** `grep -rn "MOCK_SEMANTIC" test-helpers/mock-semantic.ts app/\(app\)/\(tabs\)/index.route-tag.integration.test.tsx app/\(app\)/\(tabs\)/index.card-loading.integration.test.tsx app/\(app\)/\(tabs\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx`
- **Scenario** (start `static_rn_test_suite`):
  - must observe: `test-helpers/mock-semantic.ts` contains `export const MOCK_SEMANTIC = {`; the four target files each contain `import { MOCK_SEMANTIC } from`; the four target files contain NO `const MOCK_SEMANTIC = {`
  - must NOT observe: any `const MOCK_SEMANTIC = {` inside the four target files; an edited token value in the shared object; a new in-file definition sneaking back in
  - negative control (would fail if): the helper file is not created; an import path is wrong so the suite fails to load; `MOCK_SEMANTIC` is re-declared locally (shadowing the import); the shared object is re-typed in a way that drops the `as const` fontWeight literals

### AC-2: a shared setupHomeScreenMocks() helper exists and is used by the three index.* test files
- **GIVEN** the three `index.*` suites each inline the same ~20 `vi.mock()` boundary blocks plus shared handle declarations
- **WHEN** the refactor lands
- **THEN** `test-helpers/index-screen.ts` exports `setupHomeScreenMocks()` (and `renderHomeScreen()`); the three `index.*` files call `setupHomeScreenMocks()` and no longer inline the shared `vi.mock()` stack; scenario-specific `mockReturnValue(...)` wiring stays in each test file
- **Test tier:** `unit` (code-shape) · **Service:** repo source
- **Verify:** `grep -rn "setupHomeScreenMocks" test-helpers/index-screen.ts app/\(app\)/\(tabs\)/index.route-tag.integration.test.tsx app/\(app\)/\(tabs\)/index.card-loading.integration.test.tsx app/\(app\)/\(tabs\)/index.discovery.integration.test.tsx`
- **Scenario** (start `static_rn_test_suite`):
  - must observe: `test-helpers/index-screen.ts` defines `export function setupHomeScreenMocks()`; the three `index.*` files call `setupHomeScreenMocks()` near the top; the duplicated `vi.mock('convex/react', ...)` / `vi.mock('expo-router', ...)` / `vi.mock('@rnmapbox/maps', ...)` blocks are gone from the three files
  - must NOT observe: a fourth suite (`curated-route-card`) forced onto the index harness (it renders a card, not the home screen — its mock stack differs); scenario-specific return values hoisted into the shared helper
  - negative control (would fail if): the helper is not created; the helper swallows per-test mock return values so the suites pass for the wrong reason; a `vi.mock()` is dropped during extraction causing a test to silently exercise real (unmocked) code

### AC-3: all four test files still pass after refactoring
- **GIVEN** the four target suites pass green on `main` before the refactor
- **WHEN** the refactor lands
- **THEN** `pnpm test` against each of the four files reports all tests passing — the refactor is behavior-preserving
- **Test tier:** `integration` · **Service:** vitest (jsdom + @testing-library/react-native)
- **Verify:** `pnpm test app/\(app\)/\(tabs\)/index.route-tag.integration.test.tsx app/\(app\)/\(tabs\)/index.card-loading.integration.test.tsx app/\(app\)/\(tabs\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx`
- **Scenario** (start `static_rn_test_suite`):
  - must observe: vitest reports `Test Files 4 passed`; every existing `it(...)` name still present and passing
  - must NOT observe: a dropped/skipped test; a new failing assertion; a suite that passes only because a `vi.mock()` was removed and the real module happens to be importable
  - negative control (would fail if): an import path is wrong (module-not-found); `MOCK_SEMANTIC` is `undefined` at runtime because the import is hoisted behind a `vi.mock`; a shared handle is re-created per test so cross-test contamination flips a pass

### AC-4: pnpm type-check passes
- **GIVEN** the new `test-helpers/*.ts` files and the edited test files
- **WHEN** `pnpm type-check` runs
- **THEN** it exits 0 with no TypeScript errors across the RN tsconfig (the `as const` fontWeight literals, the mock-handle types, and the shared helper return type all type-check)
- **Test tier:** `unit` · **Service:** `tsc --noEmit -p tsconfig.json`
- **Verify:** `pnpm type-check`
- **Scenario** (start `static_rn_test_suite`):
  - must observe: `pnpm type-check` exits 0
  - must NOT observe: TS errors from a widened helper return type, a missing type import, or `MOCK_SEMANTIC` typed as a structural mismatch against `useSemanticTheme`'s expected shape
  - negative control (would fail if): the shared fixture drops `as const` and the consuming component's style prop narrows on the literal; the helper return type is `any` masking a real mismatch (biome may flag this)

### AC-5: pnpm exec biome check passes on all changed files
- **GIVEN** the new and edited files introduced by this refactor
- **WHEN** `pnpm exec biome check` runs over the changed file set
- **THEN** it exits 0 (no lint errors / no unsafe fixes) on every changed file
- **Test tier:** `unit` · **Service:** biome
- **Verify:** `pnpm exec biome check test-helpers/mock-semantic.ts test-helpers/index-screen.ts app/\(app\)/\(tabs\)/index.route-tag.integration.test.tsx app/\(app\)/\(tabs\)/index.card-loading.integration.test.tsx app/\(app\)/\(tabs\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx`
- **Scenario** (start `static_rn_test_suite`):
  - must observe: biome reports clean for every changed file
  - must NOT observe: import-order violations (the new `test-helpers` import must be ordered correctly by biome's import sorter); unused-variable warnings from leftover handles after extraction
  - negative control (would fail if): an import is added in the wrong group; a now-unused `vi`/`createElement` import remains after the `vi.mock()` stack moved out

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Code-shape: `MOCK_SEMANTIC` is defined once in the shared fixture and imported (not re-defined) by all four target files. | AC-1 | `grep -rn "MOCK_SEMANTIC" test-helpers/mock-semantic.ts app/\(app\)/\(tabs\)/index.route-tag.integration.test.tsx app/\(app\)/\(tabs\)/index.card-loading.integration.test.tsx app/\(app\)/\(tabs\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx` |
| TC-2 | Code-shape: `setupHomeScreenMocks()` exists in `test-helpers/index-screen.ts` and is called by the three `index.*` files; the shared `vi.mock()` stack is no longer inlined in those three files. | AC-2 | `grep -rn "setupHomeScreenMocks" test-helpers/index-screen.ts app/\(app\)/\(tabs\)/index.route-tag.integration.test.tsx app/\(app\)/\(tabs\)/index.card-loading.integration.test.tsx app/\(app\)/\(tabs\)/index.discovery.integration.test.tsx` |
| TC-3 | Integration: all four target suites pass green under vitest with every original assertion intact. | AC-3 | `pnpm test app/\(app\)/\(tabs\)/index.route-tag.integration.test.tsx app/\(app\)/\(tabs\)/index.card-loading.integration.test.tsx app/\(app\)/\(tabs\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx` |
| TC-4 | Type-check: `pnpm type-check` exits 0 across RN + Convex tsconfigs. | AC-4 | `pnpm type-check` |
| TC-5 | Lint + scope: biome clean on every changed file; only write-allowed files changed (no production source touched). | AC-5 | `pnpm exec biome check test-helpers/mock-semantic.ts test-helpers/index-screen.ts app/\(app\)/\(tabs\)/index.route-tag.integration.test.tsx app/\(app\)/\(tabs\)/index.card-loading.integration.test.tsx app/\(app\)/\(tabs\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx && git diff --name-only` |

## Reading List

- `app/(app)/(tabs)/index.route-tag.integration.test.tsx` (1-435) — PRIMARY: full mock boundary; `MOCK_SEMANTIC` at 208-414; `useSemanticTheme` mock at 416-418; map-component mocks 425+.
- `app/(app)/(tabs)/index.card-loading.integration.test.tsx` (1-~435) — `MOCK_SEMANTIC` at 194-400; same shared `vi.mock()` stack as route-tag.
- `app/(app)/(tabs)/index.discovery.integration.test.tsx` (1-~410) — `MOCK_SEMANTIC` at 193-399; `useSemanticTheme` mock at ~402; note `mockSendPlanningMessage` and `mockUseCuratedDiscovery` are scenario-specific handles kept in-file.
- `components/chat/cards/curated-route-card.integration.test.tsx` (1-~460) — `MOCK_SEMANTIC` at 248-454; only the `MOCK_SEMANTIC` extraction applies (NOT the index harness — it renders a card, not the home screen).
- `test-helpers/overlays.ts` (1-40) — READ-ONLY reference: the EXISTING shared-test-helper pattern to mimic (named exports, relative import of shared types from `../shared/...`, no default export).
- `app/(app)/(tabs)/index.tsx` — READ-ONLY reference: the production home screen the `index.*` suites render, to confirm `renderHomeScreen()` wraps it faithfully.

## Guardrails

- WRITE-ALLOWED: `test-helpers/mock-semantic.ts (NEW — the single MOCK_SEMANTIC definition)`
- WRITE-ALLOWED: `test-helpers/index-screen.ts (NEW — setupHomeScreenMocks() + renderHomeScreen())`
- WRITE-ALLOWED: `app/(app)/(tabs)/index.route-tag.integration.test.tsx (MODIFY — drop in-file MOCK_SEMANTIC; replace vi.mock() stack with setupHomeScreenMocks(); import MOCK_SEMANTIC)`
- WRITE-ALLOWED: `app/(app)/(tabs)/index.card-loading.integration.test.tsx (MODIFY — same)`
- WRITE-ALLOWED: `app/(app)/(tabs)/index.discovery.integration.test.tsx (MODIFY — same)`
- WRITE-ALLOWED: `components/chat/cards/curated-route-card.integration.test.tsx (MODIFY — drop in-file MOCK_SEMANTIC; import from shared fixture; do NOT adopt the index harness)`
- WRITE-PROHIBITED: Any production source file under `app/`, `components/`, `contexts/`, `hooks/`, `stores/`, `convex/`, `shared/`, `tokens/` (test-only refactor)
- WRITE-PROHIBITED: The other four `MOCK_SEMANTIC`-duplicating suites (`index.one-route`, `index.route-tap`, `index.carousel`, `index.finished-route-fit`) — out of scope for H-1/H-2
- WRITE-PROHIBITED: `test-helpers/overlays.ts` (existing helper — read for pattern, do not edit)
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: `test-helpers/overlays.ts` — the existing shared-test-helper pattern (named exports, relative imports, no default export) to mimic for `mock-semantic.ts` and `index-screen.ts`.
- ref: `app/(app)/(tabs)/index.route-tag.integration.test.tsx:208-414` — the canonical `MOCK_SEMANTIC` definition to extract verbatim.
- pattern: Extract-don't-redefine — move the shared object ONCE to a fixture module; consumers import. Move shared `vi.mock()` registrations into a `setup*Mocks()` helper that returns handles; keep scenario-specific `mockReturnValue(...)` wiring in each test.
- anti-pattern: Re-declaring `MOCK_SEMANTIC` locally (shadowing the import); hoisting scenario-specific mock RETURN values into the shared helper (couples suites and can mask a dropped mock); forcing the card suite onto the home-screen harness (different render target).
- vitest hoist note: `vi.mock()` factory calls are hoisted to the top of the file by vitest, so a helper that CALLS `vi.mock(...)` must be invoked at module top-level (not inside a `beforeEach`). `setupHomeScreenMocks()` must therefore run at file scope; `renderHomeScreen()` is called per-test.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test app/\(app\)/\(tabs\)/index.route-tag.integration.test.tsx app/\(app\)/\(tabs\)/index.card-loading.integration.test.tsx app/\(app\)/\(tabs\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check test-helpers/mock-semantic.ts test-helpers/index-screen.ts app/\(app\)/\(tabs\)/index.route-tag.integration.test.tsx app/\(app\)/\(tabs\)/index.card-loading.integration.test.tsx app/\(app\)/\(tabs\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx` |
| scope | `git diff --name-only ⊆ write_allowed` (NO production source files in the diff) |

## Coding Standards

- Shared test helpers use named exports (`export const MOCK_SEMANTIC`, `export function setupHomeScreenMocks()`), matching `test-helpers/overlays.ts`.
- Preserve `as const` assertions on `fontWeight` literals inside `MOCK_SEMANTIC` so the consuming style props stay narrow.
- The shared helper returns a typed object of mock handles; do NOT type it `any` (biome will flag, and it masks mismatches).
- Imports follow biome's import ordering (test-helper imports land in the correct relative group).
- No comments added unless explicitly requested (per repo convention).

## Dependencies

- Depends on: (none — pure test-only refactor; safe to run independently of REDHAT-FIX-001/002/003/005)
- Blocks: (none — a follow-up may later migrate the other four MOCK_SEMANTIC-duplicating suites onto the shared fixture)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-004",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "static_rn_test_suite": {
      "description": "The current repo state with the four target RN integration suites (index.route-tag, index.card-loading, index.discovery, curated-route-card) green on main, each inlining the identical ~207-line MOCK_SEMANTIC object and the three index.* suites inlining the same ~20-entry vi.mock() boundary stack. The existing test-helpers/overlays.ts establishes the shared-helper pattern. No live Convex deployment is exercised — these suites run in jsdom under vitest with all Convex/native boundaries mocked.",
      "seed_method": "git_main_state",
      "records": [
        "app/(app)/(tabs)/index.route-tag.integration.test.tsx with MOCK_SEMANTIC at 208-414 and full vi.mock() stack",
        "app/(app)/(tabs)/index.card-loading.integration.test.tsx with MOCK_SEMANTIC at 194-400 and full vi.mock() stack",
        "app/(app)/(tabs)/index.discovery.integration.test.tsx with MOCK_SEMANTIC at 193-399 and full vi.mock() stack",
        "components/chat/cards/curated-route-card.integration.test.tsx with MOCK_SEMANTIC at 248-454 (card mock stack, NOT the index harness)",
        "test-helpers/overlays.ts establishing the named-export shared-test-helper pattern"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the four target RN integration suites each currently inline a ~207-line MOCK_SEMANTIC object WHEN the refactor lands THEN test-helpers/mock-semantic.ts exports MOCK_SEMANTIC; each of the four files imports it; grep for 'const MOCK_SEMANTIC' returns zero hits inside the four target files (only the shared fixture defines it).",
      "verify": "grep -rn \"MOCK_SEMANTIC\" test-helpers/mock-semantic.ts app/\\(app\\)/\\(tabs\\)/index.route-tag.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.card-loading.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "static_rn_test_suite",
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "repo source grep",
        "must_observe": ["test-helpers/mock-semantic.ts contains 'export const MOCK_SEMANTIC = {'", "all four target files contain 'import { MOCK_SEMANTIC } from'", "zero 'const MOCK_SEMANTIC = {' inside the four target files"],
        "must_not_observe": ["any 'const MOCK_SEMANTIC = {' inside the four target files", "an edited token value in the shared object vs the current definition", "a dropped 'as const' on fontWeight literals"],
        "negative_control": { "would_fail_if": ["the helper file is not created", "an import path is wrong so a suite fails to load", "MOCK_SEMANTIC is re-declared locally shadowing the import", "the shared object is re-typed dropping the as-const fontWeight literals"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "static_rn_test_suite", "action": { "actor": "developer", "steps": ["create test-helpers/mock-semantic.ts with the verbatim MOCK_SEMANTIC object", "replace each in-file definition with an import", "run the grep verify command"] }, "end_state": { "must_observe": ["grep shows MOCK_SEMANTIC defined once in the fixture and imported by all four files"], "must_not_observe": ["any local const MOCK_SEMANTIC in the four target files"] } }]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the three index.* suites each inline the same ~20 vi.mock() boundary blocks plus shared handle declarations WHEN the refactor lands THEN test-helpers/index-screen.ts exports setupHomeScreenMocks() (and renderHomeScreen()); the three index.* files call setupHomeScreenMocks() and no longer inline the shared vi.mock() stack; scenario-specific mockReturnValue wiring stays in each test file.",
      "verify": "grep -rn \"setupHomeScreenMocks\" test-helpers/index-screen.ts app/\\(app\\)/\\(tabs\\)/index.route-tag.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.card-loading.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.discovery.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "static_rn_test_suite",
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "repo source grep",
        "must_observe": ["test-helpers/index-screen.ts defines 'export function setupHomeScreenMocks()'", "the three index.* files call setupHomeScreenMocks()", "the shared vi.mock('convex/react' / 'expo-router' / '@rnmapbox/maps') blocks are gone from the three files"],
        "must_not_observe": ["curated-route-card forced onto the index harness", "scenario-specific mockReturnValue values hoisted into the shared helper"],
        "negative_control": { "would_fail_if": ["the helper is not created", "the helper swallows per-test return values so suites pass for the wrong reason", "a vi.mock() is dropped during extraction causing a test to silently exercise real unmocked code"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "static_rn_test_suite", "action": { "actor": "developer", "steps": ["create test-helpers/index-screen.ts exporting setupHomeScreenMocks() that registers the shared vi.mock() stack and returns handles", "replace the inlined stack in the three index.* files with a setupHomeScreenMocks() call", "keep scenario-specific mockReturnValue wiring in each test"] }, "end_state": { "must_observe": ["grep shows setupHomeScreenMocks defined once and called by the three index files"], "must_not_observe": ["duplicated vi.mock boundary blocks remaining in the three index files"] } }]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the four target suites pass green on main before the refactor WHEN the refactor lands THEN pnpm test against each of the four files reports all tests passing — the refactor is behavior-preserving.",
      "verify": "pnpm test app/\\(app\\)/\\(tabs\\)/index.route-tag.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.card-loading.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "static_rn_test_suite",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "vitest (jsdom + @testing-library/react-native)",
        "must_observe": ["vitest reports 'Test Files 4 passed'", "every original it(...) name is still present and passing"],
        "must_not_observe": ["a dropped or skipped test", "a new failing assertion", "a suite passing only because a vi.mock was removed and the real module is importable"],
        "negative_control": { "would_fail_if": ["an import path is wrong (module-not-found)", "MOCK_SEMANTIC is undefined at runtime because the import is hoisted behind a vi.mock", "a shared handle is re-created per test causing cross-test contamination"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "static_rn_test_suite", "action": { "actor": "vitest", "steps": ["run pnpm test against the four target files", "confirm Test Files 4 passed"] }, "end_state": { "must_observe": ["4 files passed, 0 failed"], "must_not_observe": ["any failing test", "any skipped assertion vs main"] } }]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the new test-helpers/*.ts files and the edited test files WHEN pnpm type-check runs THEN it exits 0 with no TypeScript errors across the RN tsconfig (the as-const fontWeight literals, the mock-handle types, and the shared helper return type all type-check).",
      "verify": "pnpm type-check",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "static_rn_test_suite",
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "tsc --noEmit",
        "must_observe": ["pnpm type-check exits 0"],
        "must_not_observe": ["TS errors from a widened helper return type", "a missing type import", "MOCK_SEMANTIC typed as a structural mismatch against useSemanticTheme's expected shape"],
        "negative_control": { "would_fail_if": ["the shared fixture drops 'as const' and a consuming style prop narrows on the literal", "the helper return type is 'any' masking a real mismatch"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "static_rn_test_suite", "action": { "actor": "tsc", "steps": ["run pnpm type-check", "confirm exit 0"] }, "end_state": { "must_observe": ["exit code 0"], "must_not_observe": ["any TS error in the changed files"] } }]
      }
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the new and edited files introduced by this refactor WHEN pnpm exec biome check runs over the changed file set THEN it exits 0 (no lint errors / no unsafe fixes) on every changed file.",
      "verify": "pnpm exec biome check test-helpers/mock-semantic.ts test-helpers/index-screen.ts app/\\(app\\)/\\(tabs\\)/index.route-tag.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.card-loading.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "static_rn_test_suite",
        "tier": "visible",
        "test_tier": "unit",
        "verification_service": "biome",
        "must_observe": ["biome reports clean for every changed file"],
        "must_not_observe": ["import-order violations on the new test-helpers import", "unused-variable warnings from leftover handles after extraction"],
        "negative_control": { "would_fail_if": ["an import is added in the wrong group", "a now-unused vi/createElement import remains after the vi.mock() stack moved out"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "static_rn_test_suite", "action": { "actor": "biome", "steps": ["run biome check on the changed file set", "confirm exit 0"] }, "end_state": { "must_observe": ["all changed files clean"], "must_not_observe": ["any biome error or unsafe-fix suggestion"] } }]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Code-shape: MOCK_SEMANTIC is defined once in the shared fixture and imported (not re-defined) by all four target files.",
      "verify": "grep -rn \"MOCK_SEMANTIC\" test-helpers/mock-semantic.ts app/\\(app\\)/\\(tabs\\)/index.route-tag.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.card-loading.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Code-shape: setupHomeScreenMocks() exists in test-helpers/index-screen.ts and is called by the three index.* files; the shared vi.mock() stack is no longer inlined in those three files.",
      "verify": "grep -rn \"setupHomeScreenMocks\" test-helpers/index-screen.ts app/\\(app\\)/\\(tabs\\)/index.route-tag.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.card-loading.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.discovery.integration.test.tsx",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Integration: all four target suites pass green under vitest with every original assertion intact.",
      "verify": "pnpm test app/\\(app\\)/\\(tabs\\)/index.route-tag.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.card-loading.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Type-check: pnpm type-check exits 0 across RN + Convex tsconfigs.",
      "verify": "pnpm type-check",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Lint + scope: biome clean on every changed file; only write-allowed files changed (no production source touched).",
      "verify": "pnpm exec biome check test-helpers/mock-semantic.ts test-helpers/index-screen.ts app/\\(app\\)/\\(tabs\\)/index.route-tag.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.card-loading.integration.test.tsx app/\\(app\\)/\\(tabs\\)/index.discovery.integration.test.tsx components/chat/cards/curated-route-card.integration.test.tsx && git diff --name-only",
      "maps_to_ac": "AC-5"
    }
  ]
}
-->
