# RR-S09-CVX-T01 — Convex route-results contract verification + read-model

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z

> **Task ID:** RR-S09-CVX-T01
> **Sprint:** [Sprint 09 — Map View · Route Results State](./SPRINT.md)
> **Agent:** convex-implementer
> **Estimate:** 180 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03 (route results with real route_plans), UC-CHAT-04 (chat-refine reuses session), Sprint 09 — Map View Route Results State

## Background

`convex/db/routePlans.ts` already exports `getPlanByIdHandler`, `getPlanById` (subscription-capable query), `cancelPlan` (mutation), and `getPlanByIdInternal` (internalQuery for agent flows). Sprint 04 shipped these surfaces; Sprint 09 verifies they are stable, complete, and correctly shaped for the iOS + Android `RouteResultsViewModel` consumers landing in this sprint.

The contract additions Sprint 09 may need are minimal: (a) a stable, deterministic `{best, alt1, alt2}` triple derived from `plan.options[]` (the agent ranking should already produce a deterministic order, but the contract MUST be explicit so iOS + Android map the same option to the same variant slot every time); (b) confirmation that calling `agent.sendMessage` from results-state to refine the plan **reuses** the active `sessionId` and does NOT mint a fresh `planningSessions` row; (c) a clear policy on `selectedRouteId` — per the design intent, it is a client-side view-model property, NOT a server-persisted commitment.

This task is mostly **verification + documentation + minimal contract codification**, not net-new backend. It produces (1) a contract test in `convex/db/__tests__/routePlans.test.ts` confirming the `{best, alt1, alt2}` triple is derivable and stable; (2) a contract test confirming refine via `agent.sendMessage` reuses `sessionId`; (3) an explicit `getPlanByIdResult` type (or doc comment on the existing return shape) that downstream view-models can consume; (4) a `selectedRouteId` policy note in `convex/db/routePlans.ts` documenting that selection is client-side.

If the agent ranking is NOT deterministic — i.e., `plan.options[]` arrives unsorted — this task adds the sort/triage helper (`triageOptionsToTriple` or similar) and exposes it from the handler so view-models receive `{best, alt1, alt2}` directly. If the ranking IS deterministic, this task documents the invariant and writes a test that asserts it.

## Critical Constraints

**MUST:**
- MUST verify `db.routePlans.getPlanById({routePlanId})` returns `plan.options[]` in a deterministic order that maps to `{best, alt1, alt2}` consistently across iOS and Android; if not deterministic, add the deterministic ordering inside the handler (NOT in the view-model)
- MUST add a contract test in `convex/db/__tests__/routePlans.test.ts` that calls `getPlanByIdHandler` with a stub plan containing 3 options and asserts the returned `options` array maps to `{best, alt1, alt2}` in the documented order (e.g., by `option.kind` enum or `option.rank`)
- MUST add a contract test that calls `agent.sendMessage` with an existing `sessionId` from the results-state (i.e., after a successful plan completion) and asserts (a) no new `planningSessions` row is created, (b) the `sessionMessages` row is appended to the existing session, (c) the resulting plan completion returns to the same `sessionId`
- MUST document `selectedRouteId` policy in `convex/db/routePlans.ts` (jsdoc / TSDoc comment block) explicitly stating that selected-route is a client-side view-model property and that NO `selectOption` mutation exists by design — the user's selection becomes a server commitment only at `SaveFavoriteSheet` (UC-ROUTE-01) or "Ride this" (post-V3)
- MUST keep all changes inside `convex/db/routePlans.ts` and `convex/db/__tests__/routePlans.test.ts`; if a shared type is needed, place it in `convex/db/routePlans.types.ts` (new file) and re-export from `routePlans.ts`

**NEVER:**
- NEVER add a `selectOption` mutation that persists `selectedRouteId` on the server; per design, selection is client-side
- NEVER alter the existing `getPlanByIdHandler` return shape in a way that breaks the iOS / Android Convex client codegen contracts; if the handler must change, update via a new field or a documented additive change, NOT a rename or removal
- NEVER add a parallel `getResultsTriple` query that duplicates `getPlanById` logic; if a deterministic triple is needed, derive it inside `getPlanByIdHandler` and return it inline
- NEVER mock the Convex test environment with shims that hide validator failures; use the existing `convexTest` harness in `convex/db/__tests__/routePlans.test.ts`
- NEVER add cross-cutting changes to `convex/agent/` or `convex/sessions/` from this task — if the refine flow has a `sessionId` bug, file a follow-up task; this task confirms behavior, doesn't refactor agent code

**STRICTLY:**
- STRICTLY follow `convex/_generated/ai/guidelines.md` for query/mutation patterns — read the file before writing code
- STRICTLY use `pnpm test --filter routePlans` (or the equivalent vitest scope) to verify tests run in isolation; do not break the broader `pnpm test` suite
- STRICTLY treat the `triageOptionsToTriple` helper (if added) as pure: input is `plan.options[]`, output is `{best: Option, alt1: Option | null, alt2: Option | null}`; null entries are valid (V01 Two Candidates variant)
- STRICTLY run `pnpm --dir server run convex:dev -- --once` after changes to verify codegen + validator compliance

## Specification

**Objective:** Verify and codify the route-results read contract: `getPlanByIdHandler` returns a deterministic `{best, alt1, alt2}` triple consumable by iOS + Android view-models; chat-refine via `agent.sendMessage` reuses the active `sessionId` without minting fresh planning sessions; `selectedRouteId` is documented as client-side-only state. Add contract tests for both invariants; add the deterministic-order helper only if the agent ranking does not already produce one.

**Success State:** `convex/db/__tests__/routePlans.test.ts` contains the two new contract tests and they pass via `pnpm test --filter routePlans` (or the project's Convex test command). `convex/db/routePlans.ts` contains the `selectedRouteId` policy doc comment block. `pnpm --dir server run convex:dev -- --once` exits 0 (validator + codegen clean). `pnpm type-check:native` exits 0. `pnpm lint` exits 0.

## Acceptance Criteria

### AC-1 — `getPlanByIdHandler` returns deterministic `{best, alt1, alt2}` triple

**GIVEN** a completed `route_plans` row with 3 options
**WHEN** `getPlanByIdHandler` is called with that `routePlanId`
**THEN** the returned `plan.options[]` array is in deterministic order such that `options[0]` is always the best route, `options[1]` is always alt1, `options[2]` is always alt2 (or null entries when fewer than 3 options exist, per UC-CHAT-03 ACs)
**Verify:** `pnpm test --filter routePlans -- --grep 'returns deterministic best/alt1/alt2 ordering'` (exit 0)

### AC-2 — Chat-refine reuses active `sessionId`

**GIVEN** a completed plan exists for `sessionId = "sess-abc123"`
**WHEN** `agent.sendMessage({ sessionId: "sess-abc123", message: "make it shorter" })` is called from results-state
**THEN** (a) no new `planningSessions` row is inserted, (b) a new `sessionMessages` row is appended with the same `sessionId`, (c) the subsequent plan completion writes to the same `sessionId`
**Verify:** `pnpm test --filter routePlans -- --grep 'chat-refine reuses sessionId'` (exit 0)

### AC-3 — `selectedRouteId` policy documented in `routePlans.ts`

**GIVEN** the Sprint 09 design intent that selection is a client-side property
**WHEN** `convex/db/routePlans.ts` is read
**THEN** the file contains a top-of-file (or per-function) jsdoc/TSDoc block explicitly stating: "selectedRouteId is a client-side view-model property; there is no selectOption mutation by design; selection becomes a server commitment only via SaveFavoriteSheet (UC-ROUTE-01) or Ride this (post-V3)"
**Verify:** `grep -c 'selectedRouteId is a client-side view-model property' convex/db/routePlans.ts` ≥ 1

### AC-4 — Convex validator + codegen clean

**GIVEN** the modified `routePlans.ts`
**WHEN** `pnpm --dir server run convex:dev -- --once` runs
**THEN** exit 0 with zero validator errors and zero codegen drift
**Verify:** `pnpm --dir server run convex:dev -- --once` (exit 0)

### AC-5 — TypeScript + lint clean across modified files

**GIVEN** the modified `convex/db/routePlans.ts` and `convex/db/__tests__/routePlans.test.ts`
**WHEN** `pnpm type-check:native` and `pnpm lint` run
**THEN** both exit 0 with no errors in either file
**Verify:** `pnpm type-check:native && pnpm lint` (exit 0)

### AC-6 — Triage helper (`triageOptionsToTriple`) is pure and null-safe

**GIVEN** the agent ranking does NOT produce a deterministic order (verified during implementation), so a `triageOptionsToTriple` helper is added
**WHEN** the helper is called with `[opt_a, opt_b]` (only 2 options, V01 Two Candidates variant)
**THEN** the result is `{best: opt_a, alt1: opt_b, alt2: null}` (or the documented equivalent — null in the alt2 slot when fewer than 3 options exist); when called with 0 options, returns `{best: null, alt1: null, alt2: null}` without throwing
**Verify:** `pnpm test --filter routePlans -- --grep 'triageOptionsToTriple null-safe'` (exit 0) — applicable only if helper is added; otherwise mark this AC `satisfied: true` with evidence "agent ranking is deterministic; no helper needed"

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | getPlanByIdHandler returns options in deterministic best/alt1/alt2 order across repeated calls | AC-1 | `pnpm test --filter routePlans -- --grep 'returns deterministic best/alt1/alt2 ordering'` | happy_path |
| TC-2 | sendMessage with existing sessionId appends to same session, no fresh planningSessions row | AC-2 | `pnpm test --filter routePlans -- --grep 'chat-refine reuses sessionId'` | happy_path |
| TC-3 | routePlans.ts contains the selectedRouteId policy doc block | AC-3 | `grep -c 'selectedRouteId is a client-side view-model property' convex/db/routePlans.ts` ≥ 1 | edge |
| TC-4 | Convex validator + codegen single-run exits 0 | AC-4 | `pnpm --dir server run convex:dev -- --once` | edge |
| TC-5 | Type check + lint clean across modified files | AC-5 | `pnpm type-check:native && pnpm lint` | edge |
| TC-6 | triageOptionsToTriple is null-safe for 0/1/2/3 option inputs (if helper exists) | AC-6 | `pnpm test --filter routePlans -- --grep 'triageOptionsToTriple null-safe'` OR explicit "not needed" evidence | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `convex/db/routePlans.ts` | all (especially getPlanByIdHandler, cancelPlanHandler) | Existing public surface; understand what the handler returns and how options are ordered |
| `convex/db/__tests__/routePlans.test.ts` | all | Existing test harness — extend with two new test blocks |
| `convex/agent/sendMessage.ts` (or equivalent) | all | Sprint 04 chat path — verify `sessionId` reuse path |
| `convex/sessions/` | all | `planningSessions` table shape; verify no new row on refine |
| `convex/_generated/ai/guidelines.md` | all | REQUIRED READING — Convex API patterns + validator rules |
| `.spec/prds/v3-integration/05-uc-chat.md` | UC-CHAT-03 + UC-CHAT-04 | AC list — multi-polyline map, refine reuses sessionId |
| `.spec/prds/v3-integration/architecture/ios-architecture.md` | §5.3 RouteResultsScreen | iOS view-model contract — what the screen expects from the subscription |
| `.spec/prds/v3-integration/architecture/android-architecture.md` | §6.3 RouteResultsRoute | Android view-model contract |

## Guardrails

**Write-Allowed:**
- `convex/db/routePlans.ts` (MODIFY — add deterministic-order helper if needed; add `selectedRouteId` policy doc block; do NOT change handler signatures in a breaking way)
- `convex/db/__tests__/routePlans.test.ts` (MODIFY — add two new contract tests)
- `convex/db/routePlans.types.ts` (NEW — optional, only if a shared `RouteResultsTriple` type is needed for re-export)

**Write-Prohibited:**
- `convex/agent/**` — Sprint 04 ownership; if a `sessionId` reuse bug exists, file a follow-up task, do NOT patch here
- `convex/sessions/**` — `planningSessions` table ownership; do NOT modify the schema or insertion logic
- `convex/schema.ts` — schema changes require their own task and migration plan
- `convex/_generated/**` — generated code, do NOT hand-edit
- `ios/**`, `android/**`, `react-native/**`, `tokens/**`, `.spec/**` — out of scope
- `convex/**` (project root) — Convex code lives in `convex/`; project-root `convex/` is the legacy path per RULES.md

## Design

**References:**
- `.spec/prds/v3-integration/05-uc-chat.md` (UC-CHAT-03 + UC-CHAT-04 AC list)
- `.spec/prds/v3-integration/architecture/ios-architecture.md` §5.3 RouteResultsScreen
- `.spec/prds/v3-integration/architecture/android-architecture.md` §6.3 RouteResultsRoute
- `convex/db/routePlans.ts` (existing handler surface — read before extending)

**Interaction Notes:** No user-facing interactions added by this task. The contract this task codifies is consumed by RR-S09-IOS-T01 (iOS ViewModel) and RR-S09-AND-T01 (Android ViewModel). Document the `{best, alt1, alt2}` ordering rule in code comments so view-models do not need to triage options themselves.

**Pattern:** Existing `getPlanByIdHandler` (lines ~191-253 in `convex/db/routePlans.ts`) — the read-model layer wraps the raw `route_plans` row and adds derived fields. Extend that pattern; do not introduce a parallel query.

**Pattern Source:** `convex/db/routePlans.ts:191-253` (getPlanByIdHandler)

**Anti-Pattern:** Adding a `selectOption` mutation that persists user selection (selection is client-side); adding a parallel `getRouteResultsTriple` query that duplicates `getPlanById`; mocking the Convex test harness with shims that hide validator failures; cross-cutting refactors of `convex/agent/` from this task.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `pnpm test --filter routePlans -- --grep 'returns deterministic best/alt1/alt2 ordering'` (exit 0) |
| AC-2 | `pnpm test --filter routePlans -- --grep 'chat-refine reuses sessionId'` (exit 0) |
| AC-3 | `grep -c 'selectedRouteId is a client-side view-model property' convex/db/routePlans.ts` ≥ 1 |
| AC-4 | `pnpm --dir server run convex:dev -- --once` (exit 0) |
| AC-5 | `pnpm type-check:native && pnpm lint` (exit 0) |
| AC-6 | `pnpm test --filter routePlans -- --grep 'triageOptionsToTriple null-safe'` (exit 0) OR explicit "agent ranking is deterministic; no helper needed" evidence in PR |

## Agent Assignment

**Agent:** convex-implementer
**Rationale:** Convex backend verification task — extending `convex/db/routePlans.ts` with deterministic-order documentation, adding contract tests in `convex/db/__tests__/routePlans.test.ts`. Matches `convex-implementer`'s mandate (Convex schemas, queries, mutations, migrations using TDD). No native code, no UI work. The reviewer is `convex-reviewer` per RULES.md.

## Coding Standards

- `convex/_generated/ai/guidelines.md` (REQUIRED reading — Convex API patterns)
- `brain/docs/coding-standards.md` (TypeScript best practices, functional patterns)
- `RULES.md` §"Convex Backend" (project-specific Convex rules)
- `brain/docs/TDD-METHODOLOGY.md` (RED → GREEN → REFACTOR; contract tests follow this pattern)

## Dependencies

**Depends on:**
- (none — runs in parallel with RR-S09-DR-T01 in Sprint 09 wave 1)

**Blocks:**
- RR-S09-IOS-T01 (iOS ViewModel consumes the documented `{best, alt1, alt2}` contract)
- RR-S09-AND-T01 (Android ViewModel consumes the same contract)
- RR-S09-T11 (Sprint 09 gate verifies the chat-refine sessionId reuse via E2E)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"getPlanByIdHandler returns options[] in deterministic best/alt1/alt2 order; verified by contract test","verify":"pnpm test --filter routePlans -- --grep 'returns deterministic best/alt1/alt2 ordering' exits 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"agent.sendMessage with existing sessionId appends to same session, does NOT create new planningSessions row","verify":"pnpm test --filter routePlans -- --grep 'chat-refine reuses sessionId' exits 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"convex/db/routePlans.ts contains explicit doc block stating selectedRouteId is client-side; no selectOption mutation","verify":"grep -c 'selectedRouteId is a client-side view-model property' convex/db/routePlans.ts >= 1","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Convex codegen + validator single-run is clean","verify":"pnpm --dir server run convex:dev -- --once exits 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"TypeScript + lint clean across modified files","verify":"pnpm type-check:native && pnpm lint exits 0","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"triageOptionsToTriple helper is pure + null-safe across 0/1/2/3 option inputs (only if added; mark satisfied with evidence if not needed)","verify":"pnpm test --filter routePlans -- --grep 'triageOptionsToTriple null-safe' exits 0 OR explicit not-needed evidence","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Contract test asserts deterministic option ordering across repeated handler invocations","verify":"pnpm test --filter routePlans -- --grep 'returns deterministic best/alt1/alt2 ordering'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Contract test asserts sendMessage with existing sessionId appends and no fresh session","verify":"pnpm test --filter routePlans -- --grep 'chat-refine reuses sessionId'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"selectedRouteId policy doc block grep returns >= 1 match","verify":"grep -c 'selectedRouteId is a client-side view-model property' convex/db/routePlans.ts","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"convex:dev --once exits 0","verify":"pnpm --dir server run convex:dev -- --once","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"pnpm type-check:native and pnpm lint exit 0","verify":"pnpm type-check:native && pnpm lint","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"triageOptionsToTriple null-safe across 0/1/2/3 inputs","verify":"pnpm test --filter routePlans -- --grep 'triageOptionsToTriple null-safe'","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"}
  ]
}
-->
