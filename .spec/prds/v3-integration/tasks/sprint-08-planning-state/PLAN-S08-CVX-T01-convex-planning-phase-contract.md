# PLAN-S08-CVX-T01 — Convex planning phase contract (sessionMessages phase derivation + cancelPlan terminal contract)
> Status: ✅ Completed
> Cycle: 2
> Commit: 64d272ab0dda9c6adfbf37d8aba861bbdce8c86f
> Reviewer: convex-reviewer
> Updated: 2026-05-08T17:58:07.680Z

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-07T19:10:00.000Z

> **Task ID:** PLAN-S08-CVX-T01
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** convex-implementer
> **Estimate:** 180 min
> **Type:** INFRA
> **Status:** Backlog
> **Priority:** P0
> **Effort:** M
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-CHAT-02 (phase progression streaming), UC-CHAT-04 (cancel + cancel-confirm flow), Sprint 08 — Map View Planning State (Map View Redesign 2026-05-06)

## Background

Sprint 08 ships the planning state of the canonical map view, where the `LSPhaseIndicator` (5-step pipeline: parsing → searching → drafting → enriching → finalizing) and the `LSContextCapsule(--planning)` italic phase line both bind to live Convex `sessionMessages` updates. iOS (`PlanningViewModel.phaseIndex(from:)`) and the Android twin currently derive the active phase by string-matching the latest planning-kind message's `content`/`statusMessage` against keyword lists (`"search"`, `"draft"`, `"enrich"`, etc.) — a brittle contract that breaks the moment the agent rephrases its own status copy. This task replaces that ad-hoc derivation with a deterministic surface so both clients can read the phase off `sessionMessages` without string heuristics.

The task ALSO verifies that `db.routePlans.cancelPlan` (already shipped in Sprint 04) cleanly transitions any in-flight planning-kind `sessionMessages` rows to a terminal state so the iOS + Android planning view-models can return the map view to its `--idle` state without races. Net-new backend is small: either (a) add an optional `phase` field on `sessionMessages` rows where `kind === 'planning'`, populated by the agent at write-time, OR (b) document a deterministic derivation rule from `thinkingSteps[].toolName` + `status` that both clients implement identically. Either way, the chosen contract MUST be encoded in `server/models/session-messages.ts` and exercised by tests in `convex/db/__tests__/`.

## Critical Constraints

**MUST:**
- Choose ONE phase-derivation contract in `server/models/session-messages.ts` and document it in a JSDoc block on `sessionMessageValidator`: either (a) add an optional `phase` field with `v.union(v.literal('parsing'), v.literal('searching'), v.literal('drafting'), v.literal('enriching'), v.literal('finalizing'))` or (b) export a pure helper `derivePlanningPhase(message: SessionMessage): PlanningPhase | null` that maps `thinkingSteps[].toolName` + `status` deterministically
- Update `sessionMessages.ts` create/finalize handlers (`createPendingAssistantMessageHandler`, `finalizeAssistantMessageHandler`, `recordReasoningHandler` if applicable) to set the `phase` field at write-time when `kind === 'planning'` (option a) OR ensure the helper handles every reachable `thinkingSteps`/status combination (option b)
- Verify `cancelPlanHandler` in `convex/db/routePlans.ts` transitions associated planning `sessionMessages` rows to `status === 'failed'` OR documents the existing terminal behavior (e.g., the route plan moves to `cancelled` and the planning message is left as-is; clients use route-plan terminal status as the cancel signal). If clients require the message status to flip, extend `cancelPlanHandler` to patch any `kind === 'planning'` `streaming|running` message rows for that session to `status === 'failed'`
- Add or extend tests in `convex/db/__tests__/sessionMessages.test.ts` for phase derivation (5 happy-path cases — one per phase — plus edge cases: empty `thinkingSteps`, unknown `toolName`, terminal `status === 'complete'`)
- Add or extend tests in `convex/db/__tests__/routePlans.test.ts` covering cancel-from-planning: given an active `route_plan` + an associated `streaming` planning `sessionMessage`, calling `cancelPlanHandler` transitions the plan to `cancelled` and (per chosen contract) either flips the message to `failed` OR leaves it alone with the test asserting that explicitly
- Run `pnpm type-check:native` clean; run `cd server && pnpm test` and have the new tests pass; run `pnpm biome check convex/db/sessionMessages.ts convex/db/routePlans.ts server/models/session-messages.ts` clean

**NEVER:**
- NEVER change the existing `kind` enum values (`'planning'`, `'thinking_card'`, etc.) — schema-breaking change blocks every existing client; if a new kind is needed it MUST be additive
- NEVER make `phase` required (option a) — pre-migration `sessionMessages` rows without `phase` MUST still validate; default to `null`/derivation fallback
- NEVER remove or rename `thinkingSteps[]` — multiple existing clients (iOS thinking card, Android thinking card) read it
- NEVER introduce a new Convex table or index without explicit user approval — this task is contract verification + small additive field, NOT new infrastructure
- NEVER write tests that mock the Convex runtime directly; use the testable handler-context pattern already established in `sessionMessages.validation.test.ts` and `routePlans.test.ts`

**STRICTLY:**
- STRICTLY follow `RULES.md` §"Convex Backend Guidelines" — handlers stay pure (`*Handler` exports); Convex `mutation`/`query` wrappers stay thin pass-throughs; tests target handlers, not wrappers
- STRICTLY match phase enum strings to the iOS `PlanningPhase` model strings (`parsing|searching|drafting|enriching|finalizing`) so PLAN-S08-IOS-T01 + PLAN-S08-AND-T01 can deserialize without translation tables
- STRICTLY document the chosen contract (a or b) in DECISIONS.md or in a JSDoc block on the exported helper/validator so future clients (Sprint 09+, route-results-state) know the canonical rule

## Specification

**Objective:** Establish a single deterministic source of truth for the current planning pipeline phase that iOS + Android `PlanningViewModel`s can read off `sessionMessages` without string heuristics, AND verify `db.routePlans.cancelPlan` produces a clean terminal state for the planning view-model's return-to-idle path. Implementation is either (a) an additive `phase` field on `sessionMessageValidator` or (b) a documented + tested derivation helper — chosen and recorded in this task.

**Success State:** `cd server && pnpm test` exits 0 with the new sessionMessages phase-derivation tests + routePlans cancel-from-planning tests passing; `pnpm type-check:native` and `pnpm biome check server/**` exit 0; `server/models/session-messages.ts` documents the chosen contract in a JSDoc block; PLAN-S08-IOS-T01 and PLAN-S08-AND-T01 can adopt the contract without further backend changes.

## Acceptance Criteria

### AC-1 — Phase derivation contract documented in models layer

**GIVEN** `server/models/session-messages.ts`
**WHEN** the file is read after this task
**THEN** it exports either (a) a `PLANNING_PHASE` const + `planningPhaseValidator` matching the 5-step iOS/Android enum AND `sessionMessageValidator` includes `phase: v.optional(planningPhaseValidator)`, OR (b) a pure helper `export function derivePlanningPhase(message: SessionMessage): PlanningPhase | null` documented with JSDoc explaining the mapping rule from `thinkingSteps`/`status` to one of the 5 phases
**Verify:** `cd server && pnpm test -- session-messages` && `pnpm type-check:native`

### AC-2 — Phase derivation correct for all 5 happy-path phases

**GIVEN** a `SessionMessage` with `kind === 'planning'` and `thinkingSteps`/`status` consistent with each of the 5 phases (parsing, searching, drafting, enriching, finalizing)
**WHEN** the chosen contract is exercised (read `phase` field OR call `derivePlanningPhase`)
**THEN** each of the 5 cases returns the matching phase string deterministically with no reliance on `content` substring heuristics
**Verify:** `cd server && pnpm test -- sessionMessages.test --testNamePattern="derivePlanningPhase|phase field"`

### AC-3 — Phase derivation handles terminal + edge cases

**GIVEN** edge-case messages: (a) `kind === 'planning'` + `status === 'complete'`, (b) empty `thinkingSteps`, (c) `kind !== 'planning'`, (d) unknown `toolName` in `thinkingSteps`
**WHEN** the chosen contract is exercised
**THEN** (a) returns `'finalizing'`, (b) returns the appropriate default phase (likely `'parsing'` for empty + streaming), (c) returns `null`, (d) falls back gracefully to the previously-known phase or `null` without throwing
**Verify:** `cd server && pnpm test -- sessionMessages.test --testNamePattern="phase.*edge"`

### AC-4 — cancelPlan transitions planning sessionMessages to terminal state

**GIVEN** an active `route_plan` (status `pending` or `running`) with one or more associated `kind === 'planning'` `sessionMessages` in `streaming`/`running` status
**WHEN** `cancelPlanHandler` is invoked by the owning rider
**THEN** the route plan moves to `status === 'cancelled'`, the scheduled action (if any) is cancelled, AND (per chosen contract) any associated planning message rows for the same session reach a terminal status (`'failed'` or stay as-is per documented decision)
**Verify:** `cd server && pnpm test -- routePlans.test --testNamePattern="cancel.*planning"`

### AC-5 — cancelPlan respects ownership

**GIVEN** an active `route_plan` belonging to user A
**WHEN** `cancelPlanHandler` is invoked with user B's `clerkUserId`
**THEN** the handler throws `ConvexError(ERROR_CODES.PLAN_NOT_FOUND)` and the plan + messages are unchanged
**Verify:** `cd server && pnpm test -- routePlans.test --testNamePattern="cancel.*ownership|cancel.*unauthorized"`

### AC-6 — Backward compatibility — pre-migration rows still validate

**GIVEN** a pre-migration `session_messages` row without the new `phase` field (option a) or without any `thinkingSteps` (option b)
**WHEN** `sessionMessageValidator` parses the row OR `derivePlanningPhase` reads it
**THEN** validation passes and the contract returns either `null` or the documented default — no `ConvexError` is thrown
**Verify:** `cd server && pnpm test -- sessionMessages.validation.test --testNamePattern="pre-migration|backward"`

### AC-7 — Phase enum strings match iOS/Android model

**GIVEN** the chosen contract emits a phase string
**WHEN** that string is compared against the iOS `PlanningPhase` enum + Android `PlanningPhase` enum (both will land in PLAN-S08-IOS-T01 / PLAN-S08-AND-T01 with the literals `parsing|searching|drafting|enriching|finalizing`)
**THEN** the strings are identical lowercase (no PascalCase, no trailing underscores) so the clients deserialize without translation
**Verify:** `cd server && pnpm test -- sessionMessages.test --testNamePattern="phase.*enum.*literal"`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | `server/models/session-messages.ts` exports either `planningPhaseValidator` + `phase` optional field on `sessionMessageValidator` OR `derivePlanningPhase` helper with JSDoc | AC-1 | `cd server && pnpm test -- session-messages` | happy_path |
| TC-2 | All 5 phase strings (parsing/searching/drafting/enriching/finalizing) derive deterministically from a representative input set with no `content` substring matching | AC-2 | `cd server && pnpm test -- sessionMessages.test --testNamePattern="derivePlanningPhase\|phase field"` | happy_path |
| TC-3 | Edge cases — terminal `status === 'complete'`, empty `thinkingSteps`, non-planning kind, unknown `toolName` — all return documented defaults without throwing | AC-3 | `cd server && pnpm test -- sessionMessages.test --testNamePattern="phase.*edge"` | edge |
| TC-4 | `cancelPlanHandler` transitions an active `route_plan` to `cancelled` AND reaches the documented terminal state for any associated planning `sessionMessages` | AC-4 | `cd server && pnpm test -- routePlans.test --testNamePattern="cancel.*planning"` | happy_path |
| TC-5 | Ownership guard — non-owning rider invoking `cancelPlanHandler` raises `ConvexError(PLAN_NOT_FOUND)` | AC-5 | `cd server && pnpm test -- routePlans.test --testNamePattern="cancel.*ownership\|cancel.*unauthorized"` | error |
| TC-6 | Pre-migration rows without `phase` / `thinkingSteps` still validate and yield `null`/default through the contract — no exception | AC-6 | `cd server && pnpm test -- sessionMessages.validation.test --testNamePattern="pre-migration\|backward"` | edge |
| TC-7 | Phase enum strings emitted by backend are lowercase literals matching the iOS/Android `PlanningPhase` model strings exactly | AC-7 | `cd server && pnpm test -- sessionMessages.test --testNamePattern="phase.*enum.*literal"` | happy_path |
| TC-8 | Type check + lint pass cleanly across modified files | AC-1, AC-7 | `pnpm type-check:native && pnpm biome check convex/db/sessionMessages.ts convex/db/routePlans.ts server/models/session-messages.ts` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `convex/db/sessionMessages.ts` | 1-250 | Existing handlers — `createPendingAssistantMessageHandler` sets `status: 'streaming'\|'running'` for planning kind; `finalizeAssistantMessageHandler` sets `status: 'complete'\|'failed'`; pattern source for contract additions |
| `convex/db/routePlans.ts` | 220-339 | `cancelPlanHandler` already shipped — transitions plan to `cancelled` + cancels scheduled action; verify if it touches `session_messages` rows for the session |
| `server/models/session-messages.ts` | 1-98 | `sessionMessageValidator` — extension point for optional `phase` field; `thinkingStepValidator` defines `tool_start`/`tool_finish`/`thinking` step types with `toolName`/`summary`/`detail` |
| `convex/db/__tests__/sessionMessages.validation.test.ts` | 1-100 | Pattern source for validator tests — pre-migration row coverage |
| `convex/db/__tests__/routePlans.test.ts` | 1-100 | Pattern source for handler-context tests — `requireIdentity` mocking, `db.get/patch` shape |
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | 345-415 | Current iOS string-heuristic derivation in `phaseIndex(from:)` — what this task replaces; `phaseLabels` array shows the 5 phase strings the contract MUST match |
| `.spec/design/system/molecules/phase-indicator/README.md` | all | 5-step pipeline contract — confirms the parsing→searching→drafting→enriching→finalizing order |

## Guardrails

**Write-Allowed:**
- `convex/db/sessionMessages.ts` (MODIFY — add `phase` field set at write-time OR import + export derivation helper)
- `convex/db/routePlans.ts` (MODIFY — only if extending `cancelPlanHandler` to patch associated planning messages per chosen contract)
- `server/models/session-messages.ts` (MODIFY — add `planningPhaseValidator` + optional `phase` field OR add `derivePlanningPhase` helper with JSDoc)
- `convex/db/__tests__/sessionMessages.test.ts` (NEW or MODIFY — phase derivation cases)
- `convex/db/__tests__/sessionMessages.validation.test.ts` (MODIFY — backward-compat case for `phase` field)
- `convex/db/__tests__/routePlans.test.ts` (MODIFY — cancel-from-planning case + ownership case)
- `convex/_generated/**` ONLY if codegen is required after schema additions; run `pnpm server:codegen`

**Write-Prohibited:**
- `convex/schema.ts` (do NOT add a new index or table; field additions only via models layer + validator extension)
- `ios/**`, `android/**`, `react-native/**` — out of scope; clients adopt the contract in PLAN-S08-IOS-T01 / PLAN-S08-AND-T01
- `convex/agent/**`, `convex/actions/**` — agent + action layers consume but do not own this contract; if agent emits the new `phase` field, that lives in a follow-up task once the contract is locked
- `tokens/**`, `.spec/design/**` — out of scope

## Design

**References:**
- `.spec/design/system/molecules/phase-indicator/README.md` — 5-step pipeline contract (parsing → searching → drafting → enriching → finalizing)
- `.spec/prds/v3-integration/tasks/sprint-08-planning-state/SPRINT.md` — sprint scope and human-testing gate

**Interaction Notes:** Backend-only task — no UI surface. Contract is consumed by `PlanningViewModel.phases` on iOS + Android in subsequent tasks. The chosen contract (option a vs option b) MUST be recorded in a JSDoc block on the exported symbol so PLAN-S08-IOS-T01 implementers know unambiguously which surface to read.

**Pattern:** `convex/db/sessionMessages.ts` `createPendingAssistantMessageHandler` (line 192-220) — pattern for additive optional field write at message creation; `finalizeAssistantMessageHandler` (line 222-246) — pattern for status transitions on terminal events.

**Pattern Source:** Sprint 04 ReAct loop — `recordToolResultHandler` / `recordReasoningHandler` already extend session messages with `piMessage` + `thinkingSteps` additively; this task uses the same additive-field pattern.

**Anti-Pattern:** Adding a new `phase` table or index; making `phase` required (breaks pre-migration rows); rewriting `cancelPlanHandler` to do anything beyond the documented terminal contract; baking iOS-specific PascalCase phase strings into the backend (must stay lowercase to match the cross-platform model strings).

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `cd server && pnpm test -- session-messages && pnpm type-check:native` |
| AC-2 | `cd server && pnpm test -- sessionMessages.test --testNamePattern="derivePlanningPhase\|phase field"` |
| AC-3 | `cd server && pnpm test -- sessionMessages.test --testNamePattern="phase.*edge"` |
| AC-4 | `cd server && pnpm test -- routePlans.test --testNamePattern="cancel.*planning"` |
| AC-5 | `cd server && pnpm test -- routePlans.test --testNamePattern="cancel.*ownership\|cancel.*unauthorized"` |
| AC-6 | `cd server && pnpm test -- sessionMessages.validation.test --testNamePattern="pre-migration\|backward"` |
| AC-7 | `cd server && pnpm test -- sessionMessages.test --testNamePattern="phase.*enum.*literal"` |
| build | `pnpm type-check:native` |
| lint | `pnpm biome check convex/db/sessionMessages.ts convex/db/routePlans.ts server/models/session-messages.ts` |

## Agent Assignment

**Agent:** convex-implementer
**Rationale:** Pure backend contract task — modify validators in `server/models/`, extend handlers in `convex/db/`, write Vitest handler-context tests in `convex/db/__tests__/`. Matches convex-implementer's mandate (Convex schema + handler patterns, models layer, ownership guards, scheduler interactions). No UI, no platform code.

## Coding Standards

- `RULES.md` §"Convex Backend Guidelines" — handler purity, models-layer validators, ownership guards via `requireIdentity`
- `RULES.md` §".spec directory structure" — task spec lives under sprint folder
- `brain/docs/mobile-architecture/testing-strategy.md` — TDD for backend contracts; tests target handlers, not wrappers
- `convex/db/__tests__/sessionMessages.validation.test.ts` — established testable handler-context pattern

## Dependencies

**Depends on:** _(none — Sprint 04 backend substrate is shipped)_
**Blocks:**
- PLAN-S08-IOS-T01 (iOS PlanningViewModel adopts phase derivation contract)
- PLAN-S08-AND-T01 (Android PlanningViewModel adopts phase derivation contract)
- PLAN-S08-IOS-T04 (cancel-confirm sheet wires `cancelPlan` and trusts the documented terminal contract)
- PLAN-S08-T11 (Sprint 08 gate — backend contract is a gate prerequisite)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "server/models/session-messages.ts exports phase-derivation contract — either optional planningPhaseValidator phase field on sessionMessageValidator OR derivePlanningPhase helper with JSDoc",
      "verify": "cd server && pnpm test -- session-messages && pnpm type-check:native",
      "satisfied": true,
      "evidence": "server/models/session-messages.ts:52-67 defines lowercase phase literals/validator; server/models/session-messages.ts:164-235 exports documented derivePlanningPhase contract and optional phase field; server/models/__tests__/session-messages-planning-phase.test.ts:16-35 passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "All 5 phases (parsing/searching/drafting/enriching/finalizing) derive deterministically from thinkingSteps + status without content substring heuristics",
      "verify": "cd server && pnpm test -- sessionMessages.test --testNamePattern=\"derivePlanningPhase|phase field\"",
      "satisfied": true,
      "evidence": "server/models/session-messages.ts:164-209 now prioritizes structured thinking/content over persisted phase; convex/db/sessionMessages.ts:398-407 and 667-675 recalculate phase with phase cache cleared before derivation; convex/db/__tests__/sessionMessages.test.ts:91-101 stale-phase regression passes via direct run `pnpm test -- convex/db/__tests__/sessionMessages.test.ts --testNamePattern='stale persisted phase'`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "Edge cases — terminal complete, empty thinkingSteps, non-planning kind, unknown toolName — return documented defaults without throwing",
      "verify": "cd server && pnpm test -- sessionMessages.test --testNamePattern=\"phase.*edge\"",
      "satisfied": true,
      "evidence": "server/models/session-messages.ts:178-209 handles non-planning/null, complete/finalizing, empty active/parsing, and unknown-tool fallbacks; convex/db/__tests__/sessionMessages.test.ts:104-163 passed with `--testNamePattern='phase.*edge'`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "cancelPlanHandler transitions active route_plan to cancelled AND associated planning sessionMessages reach documented terminal state",
      "verify": "cd server && pnpm test -- routePlans.test --testNamePattern=\"cancel.*planning\"",
      "satisfied": true,
      "evidence": "convex/db/routePlans.ts:249-266 marks in-flight planning messages failed before cancelling the route plan; convex/db/__tests__/routePlans.test.ts:443-500 passed with `--testNamePattern='cancel.*planning'`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "cancelPlanHandler ownership guard — non-owning rider raises ConvexError(PLAN_NOT_FOUND) and leaves state untouched",
      "verify": "cd server && pnpm test -- routePlans.test --testNamePattern=\"cancel.*ownership|cancel.*unauthorized\"",
      "satisfied": true,
      "evidence": "convex/db/routePlans.ts:237-240 rejects non-owned plans with ConvexError(PLAN_NOT_FOUND) and convex/db/__tests__/routePlans.test.ts:567-601 passed with `--testNamePattern='cancel.*ownership|cancel.*unauthorized'`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": null
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "Pre-migration sessionMessages rows without phase/thinkingSteps still validate and contract returns null/default without throwing",
      "verify": "cd server && pnpm test -- sessionMessages.validation.test --testNamePattern=\"pre-migration|backward\"",
      "satisfied": true,
      "evidence": "server/models/session-messages.ts:197-206 and 212-235 preserve backward-compatible defaults with optional phase/thinkingSteps; convex/db/__tests__/sessionMessages.validation.test.ts:109-133 passed with `--testNamePattern='pre-migration|backward'`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": null
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "Backend phase enum strings match iOS/Android PlanningPhase model literals exactly (lowercase parsing/searching/drafting/enriching/finalizing)",
      "verify": "cd server && pnpm test -- sessionMessages.test --testNamePattern=\"phase.*enum.*literal\"",
      "satisfied": true,
      "evidence": "server/models/session-messages.ts:52-67 defines exact lowercase literals and convex/db/__tests__/sessionMessages.test.ts:166-173 passed with `--testNamePattern='phase.*enum.*literal'`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "models/session-messages.ts exports chosen contract (validator extension OR helper) with JSDoc",
      "verify": "cd server && pnpm test -- session-messages",
      "satisfied": true,
      "evidence": "`pnpm test -- server/models/__tests__/session-messages-planning-phase.test.ts` passed (2 tests).",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "5 happy-path phase derivations return correct lowercase literals",
      "verify": "cd server && pnpm test -- sessionMessages.test --testNamePattern=\"derivePlanningPhase|phase field\"",
      "satisfied": true,
      "evidence": "`pnpm test -- convex/db/__tests__/sessionMessages.test.ts --testNamePattern='derivePlanningPhase|phase field'` passed (11 tests).",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Edge cases return documented defaults without exception",
      "verify": "cd server && pnpm test -- sessionMessages.test --testNamePattern=\"phase.*edge\"",
      "satisfied": true,
      "evidence": "`pnpm test -- convex/db/__tests__/sessionMessages.test.ts --testNamePattern='phase.*edge'` passed (2 tests, 9 skipped).",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "cancelPlan + planning message terminal contract holds end-to-end",
      "verify": "cd server && pnpm test -- routePlans.test --testNamePattern=\"cancel.*planning\"",
      "satisfied": true,
      "evidence": "`pnpm test -- convex/db/__tests__/routePlans.test.ts --testNamePattern='cancel.*planning'` passed (1 test, 30 skipped).",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Ownership guard prevents non-owners from cancelling",
      "verify": "cd server && pnpm test -- routePlans.test --testNamePattern=\"cancel.*ownership|cancel.*unauthorized\"",
      "satisfied": true,
      "evidence": "`pnpm test -- convex/db/__tests__/routePlans.test.ts --testNamePattern='cancel.*ownership|cancel.*unauthorized'` passed (1 test, 30 skipped).",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Backward-compat pre-migration rows still validate",
      "verify": "cd server && pnpm test -- sessionMessages.validation.test --testNamePattern=\"pre-migration|backward\"",
      "satisfied": true,
      "evidence": "`pnpm test -- convex/db/__tests__/sessionMessages.validation.test.ts --testNamePattern='pre-migration|backward'` passed (2 tests, 6 skipped).",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": "AC-6"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Phase enum strings are lowercase literals matching the iOS/Android model",
      "verify": "cd server && pnpm test -- sessionMessages.test --testNamePattern=\"phase.*enum.*literal\"",
      "satisfied": true,
      "evidence": "`pnpm test -- convex/db/__tests__/sessionMessages.test.ts --testNamePattern='phase.*enum.*literal'` passed (1 test, 10 skipped).",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": "AC-7"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Type check + biome lint clean across modified files",
      "verify": "pnpm type-check:native && pnpm biome check convex/db/sessionMessages.ts convex/db/routePlans.ts server/models/session-messages.ts",
      "satisfied": true,
      "evidence": "`pnpm type-check:native && pnpm exec biome check convex/db/sessionMessages.ts convex/db/routePlans.ts server/models/session-messages.ts` passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "64d272ab0dda9c6adfbf37d8aba861bbdce8c86f",
      "maps_to_ac": "AC-1"
    }
  ]
}
-->
