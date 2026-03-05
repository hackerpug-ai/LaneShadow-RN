## Sprint 3 Tasks — Epic 1 (Backend data flows: `planRide` action + providers + overlays)

**Sprint**: `.spec/epics/epic-1/sprints/sprint-3/spec.md`
**Source of truth**: `.spec/epics/epic-1/trd/phase-1-core.md`
**Sprint 2 handoff (what already exists)**: `.spec/epics/epic-1/sprints/sprint-2/handoff.md`

> **Scope note:** Sprint 2 already delivered the public `db.*` endpoints (`db.routesPlan.getPlanInit`, `db.savedRoutes.*`). Sprint 3 is focused on the **planning pipeline** (`convex/actions/agent/planRide.ts`) and its supporting modules (LLM sketching, routing provider compilation, normalization to `RouteSnapshot`, `RouteIndex`, and wind overlay mapping).
>
> **Auth note (from Sprint 2 handoff):** Use `requireIdentity(ctx)` from `convex/guards.ts` for auth (viewer id = `identity.subject` / Clerk user id). Do not introduce a new viewer/auth abstraction for Sprint 3.
>
> **LangChain note:** LLM-based route sketching for Sprint 3 must be implemented using **LangChain (JS/TS) agent framework** (per TRD stack). Do not call the OpenAI API “raw” from `planRide`; wrap LLM interaction behind `convex/actions/agent/llm/routerAgent.ts` implemented with LangChain.
> - Use LangChain’s agent construction approach (`createAgent`) and define any external interactions as LangChain `tool`s.
> - Prefer **structured output** from the agent (JSON) so we can validate it deterministically before routing.
> - Note: LangChain agents are built on top of LangGraph; we are not requiring direct LangGraph usage in Sprint 3.
> - Reference: LangChain JS overview `http://docs.langchain.com/oss/javascript/langchain/overview`.

---

### Task 01 — Backend: Define planning error codes + error handling conventions (TRD §11)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: Sprint 2 auth primitive (`requireIdentity`) ✅

#### Context
- TRD §11 defines planning error codes (`INVALID_INPUT`, `LLM_SKETCH_INVALID`, `LLM_SKETCH_AMBIGUOUS`, `ROUTING_COMPILE_FAILED`, `CONDITIONS_LOOKUP_FAILED`).
- The repo already centralizes server codes/messages in `lib/errors.ts`, but it currently only includes auth/session/user profile codes.
- Sprint 3 needs a consistent convention so UI can map failures deterministically.

#### Requirements
- Extend `lib/errors.ts` to include the TRD planning error codes.
- Decide and document (in code comments) how actions throw errors:
  - Use `throw new Error('CODE')` where `CODE` is in `ServerErrorCode`.
  - Prefer **one canonical code** per failure mode.
- Ensure codes used by `planRide` are a subset of `ServerErrorCode`.

#### Acceptance Criteria
- [x] `lib/errors.ts` includes all planning error codes from TRD §11.
- [x] `ServerErrorCode` includes planning codes and remains type-safe.
- [x] Error handling convention is documented with a short comment in `lib/errors.ts`.

#### Files to Modify
- `lib/errors.ts`

---

### Task 02 — Backend: Add validator-first `RouteSketch` contract for LLM output (TRD §5.2)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: None

#### Context
- TRD §5.2 defines the `RouteSketch` shape the LLM must produce (label/rationale/segments/anchorPoints).
- Sprint 1 established a repo standard: **Convex `v` validators are the source of truth** for shared shapes.
- Sprint 3 needs to validate LLM output strictly before routing compilation (to avoid hallucinated / malformed results).

#### Requirements
- Create a validator-first model module (recommend: `models/route-sketch.ts`) that exports:
  - `routeSketchValidator` (Convex `v` object validator)
  - `RouteSketch` type (`Infer<typeof routeSketchValidator>`)
  - Nested validators for `RouteSketchSegment` and `RouteSketchAnchorPoint`.
- Ensure the contract is usable for **LangChain agent outputs**:
  - `routerAgent` must return **structured JSON** (not free-form prose) representing a `RouteSketch` candidate.
  - Each candidate must be validated against `routeSketchValidator` before any routing compilation.
  - Invalid outputs must not proceed to provider compilation (discard or repair).
- Also define **co-located Zod schemas** for the agent boundary:
  - In `models/route-sketch.ts`: export both `routeSketchValidator` (Convex `v`) and a Zod schema like `routeSketchSchema`.
  - In `models/saved-routes.ts`: export Zod schemas for the planning input shapes the agent/tools consume (at minimum `planInputSchema`, plus nested schemas like `routeStopSchema` and `planPreferencesSchema`).
  - Zod is not the source of truth; it exists to help LangChain reliably emit/consume structured JSON.
- Ensure constraints are representable and validated where feasible:
  - `segments` length is capped to a reasonable upper bound (soft cap acceptable if strict cap isn’t feasible in `v`).
  - `anchorPoints.kind` is a `v.union(v.literal('town'), v.literal('junction'), v.literal('landmark'), v.literal('pass'))`.
- Add a re-export from the existing shared types barrel if applicable (e.g. `types/index.ts`), **without redefining** the shape.

#### Acceptance Criteria
- [x] `models/route-sketch.ts` exists and exports validators + inferred types.
- [x] Code calling the LLM can validate a JSON object against `routeSketchValidator` before compiling routes.

#### Files to Create / Modify
- **Create**: `models/route-sketch.ts` (must export BOTH Convex `v` validators + co-located Zod schemas)
- **Modify**: `models/saved-routes.ts` (add co-located Zod schemas for `PlanInput` + nested shapes used by LangChain)
- **Modify (optional)**: `types/index.ts` (only if project convention is to re-export model-derived types)

---

### Task 03 — Backend: Create routing provider abstraction + initial provider implementation (TRD §4.2, §5.3)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: Task 02

#### Context
- TRD requires compiling a validated sketch into a provider-backed route, then normalizing to our provider-agnostic `RouteSnapshot`.
- The repo currently has no routing provider code under `convex/actions/agent/*`.

#### Requirements
- Create a provider abstraction module (recommend):
  - `convex/actions/agent/providers/routing-provider.ts`
  - Exports a **type** for `RoutingProvider` (functional composition, no class inheritance).
  - Exports a `createRoutingProvider()` (or `routingProvider`) that calls a real provider **or** a development stub.
- Implement `compileSketch` tool function (recommend):
  - `convex/actions/agent/tools/compile-sketch.ts`
  - Converts `RouteSketch` + `PlanInput` into provider request(s) (via points, waypoints) per TRD §5.3.
- Provider selection:
  - If real provider integration is not ready, implement a deterministic **mock provider** behind the same interface that returns a fixed, valid `RouteSnapshot`-compatible payload (so Sprint 3 can proceed).
- Environment variables:
  - Use existing env patterns (`convex/lib/env.ts` if applicable) for provider keys.
  - Do not hardcode secrets.

#### Acceptance Criteria
- [x] `RoutingProvider` abstraction exists and is used by `compileSketch`.
- [x] `compileSketch` can produce a provider response for a single sketch.
- [x] When provider config is missing, behavior is deterministic (either throws `ROUTING_COMPILE_FAILED` or uses a documented mock mode).

#### Files to Create / Modify
- **Create**: `convex/actions/agent/providers/routing-provider.ts`
- **Create**: `convex/actions/agent/tools/compile-sketch.ts`
- **Modify (if needed)**: `convex/lib/env.ts`

---

### Task 04 — Backend: Normalize provider route output into `RouteSnapshot` (TRD §3.3, §7)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: Task 03

#### Context
- TRD §3.3 requires `RouteSnapshot` to be provider-agnostic and fully renderable without recomputation.
- POC geometry policy: store **overview polyline** + **leg polylines**; do not store turn-by-turn steps.

#### Requirements
- Create a normalization helper (recommend):
  - `convex/actions/agent/tools/normalize-route.ts`
- Input: provider route response + original `PlanInput` (origin/destination/waypoints).
- Output: `RouteSnapshot` aligned to existing validators/types (from `types/routes.ts` / `models/saved-routes.ts`).
- Populate:
  - `provider` (string), `bounds`, `origin`, `destination`, `waypoints`
  - `overviewGeometry` (polyline)
  - `legs[]` with `legIndex`, `start`, `end`, `distanceMeters`, `durationSeconds`, `geometry`
  - `annotations[]` may be empty for POC (but must exist as array)
  - `overlays` initially `{}` or `{ wind?: ... }` depending on Task 06.

#### Acceptance Criteria
- [x] Normalization produces a `RouteSnapshot` that satisfies the validator/type contract.
- [x] Returned `RouteSnapshot` includes overview + leg polylines only (no step-level data persisted).

#### Files to Create / Modify
- **Create**: `convex/actions/agent/tools/normalize-route.ts`

---

### Task 05 — Backend: Compute `RouteIndex` (fingerprint + sampled points) (TRD §3.4)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: Task 04

#### Context
- TRD §3.4 defines `RouteIndex` for overlays and future analytics.
- Sprint 3 needs a deterministic, bounded index computation.

#### Requirements
- Create a pure helper (recommend):
  - `convex/actions/agent/tools/compute-route-index.ts`
- Inputs: normalized `RouteSnapshot` (prefer leg geometries).
- Output: `RouteIndex` with:
  - `routeFingerprint`: stable string (document chosen strategy in code comment).
  - `sampledPoints[]`: bounded list of points with cumulative distance.
- Keep computation bounded:
  - Cap number of sampled points (e.g., 100–300 total) regardless of route length.

#### Acceptance Criteria
- [x] `computeRouteIndex` returns a valid `RouteIndex` aligned to existing types.
- [x] Sampling is deterministic and bounded.

#### Files to Create / Modify
- **Create**: `convex/actions/agent/tools/compute-route-index.ts`

---

### Task 06 — Backend: Implement conditions probing + wind overlay mapping with soft-fail support (TRD §3.3 overlays, §6.2.10)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: Task 05

#### Context
- TRD requires wind overlay support, but also requires a degraded mode: if conditions fail, still return routes with `conditionsStatus: "unavailable"`.
- Sprint 3’s output to UI includes `overlaysPreview.windSummary` and `conditionsStatus`.

#### Requirements
- Create weather provider abstraction (recommend):
  - `convex/actions/agent/providers/weather-provider.ts`
- Create probing + mapping tools (recommend):
  - `convex/actions/agent/tools/probe-conditions.ts` (fetch wind data at representative points)
  - `convex/actions/agent/tools/map-conditions.ts` (map probed data to `WindOverlay` legend + segments)
- Soft-fail behavior:
  - If probing/mapping fails, do **not** fail planning entirely.
  - Set `conditionsStatus: "unavailable"` and omit `routeSnapshot.overlays.wind`.
  - `overlaysPreview.windSummary` should reflect unavailability.
- Ensure overlay payload matches TRD §3.3 / §4.3.4 `WindOverlay*` shapes.

#### Acceptance Criteria
- [x] When weather provider is configured, returned options include wind overlay preview and `conditionsStatus: "ok"`.
- [x] When weather provider fails/unconfigured, `planRide` still returns route options with `conditionsStatus: "unavailable"`.
- [x] No excessive fan-out: probing is bounded (sample points cap) and implemented efficiently.

#### Files to Create / Modify
- **Create**: `convex/actions/agent/providers/weather-provider.ts`
- **Create**: `convex/actions/agent/tools/probe-conditions.ts`
- **Create**: `convex/actions/agent/tools/map-conditions.ts`

---

### Task 07 — Backend: Implement reliability standards for agentic pipeline (timeouts, retry-once, bounded concurrency) (TRD §4.2.1, §9, §11)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: Tasks 01–06

#### Context
- Sprint 3’s agentic planning pipeline uses external providers (LLM, routing, weather).
- Project agent standards require: deterministic tools, structured outputs, timeouts, bounded retries, and explicit fallback behavior.
- This task is intentionally separated from `planRide` orchestration so reliability improvements can be reviewed/validated independently.

#### Requirements
- Add timeouts for **all** external calls used by planning:
  - LLM calls (LangChain)
  - routing provider calls
  - weather provider calls
- Add bounded concurrency for provider fan-out:
  - weather probing should cap points and execute with bounded concurrency (no unbounded sequential loops).
  - document chosen caps and rationale (align with TRD §9 fan-out guidance).
- Add a retry-once policy:
  - validate → retry once → fallback
  - never exceed 1 retry per failure type unless explicitly specified.
- Ensure deterministic error behavior:
  - leaf tools should not throw free-form strings intended for UI mapping
  - wrap or normalize failures to deterministic error codes from TRD §11 / `lib/errors.ts` where appropriate
  - conditions failures must remain **soft-fail** (return routes with `conditionsStatus: "unavailable"`).

#### Acceptance Criteria
- [x] External calls used by Sprint 3 planning have timeouts and bounded concurrency.
- [x] Retry-once behavior is implemented and documented for provider failures.
- [x] Error behavior is deterministic (TRD §11 codes); soft-fail conditions behavior is preserved.

#### Files to Modify (expected)
- `convex/actions/agent/providers/weather-provider.ts`
- `convex/actions/agent/providers/routing-provider.ts` (if/when real provider wiring is added)
- `convex/actions/agent/llm/routerAgent.ts` (once implemented)
- `convex/actions/agent/tools/*` (only where error normalization is required)

---

### Task 08 — Backend: Implement `actions.agent.planRide` end-to-end orchestration (TRD §4.3.5, §5.3, §9)

**Assignee**: @.cursor/agents/backend-engineer.md
**Status**: Completed
**Dependencies**: Tasks 01–07

#### Context
- Sprint 3’s primary deliverable is `planRide` (public action) returning `PlannedRouteOptionsView` for the Route Options UI (S002).
- Repo convention: actions that use external APIs must include `"use node";`.
- Sprint 2 handoff: auth is via `requireIdentity(ctx)`.
- TRD stack assumption: LLM integration is via **LangChain (OpenAI)**; implement sketching through a LangChain agent module, not ad-hoc prompting.

#### Requirements
- Create `convex/actions/agent/planRide.ts` exporting `planRide` as a public `action`:
  - Include `"use node";` at top.
  - Add `v` validators for args + returns.
- Implement LLM sketching using **LangChain agent framework**:
  - Create `convex/actions/agent/llm/routerAgent.ts` that builds a LangChain agent via `createAgent`.
  - Use LangChain `tool`s for any non-trivial sub-steps you want the agent to call (e.g. optional geocoding of anchor points, or validation/repair helpers), but keep the overall Sprint 3 pipeline deterministic.
  - Define any LangChain tool schemas using **Zod schemas co-located with the `v` models** (e.g. `models/saved-routes.ts` for `PlanInput`, `models/route-sketch.ts` for `RouteSketch`).
  - `routerAgent` must return **structured JSON** for 2–3 `RouteSketch` candidates (no free-form text as the primary output).
  - The caller (`planRide`) must validate each candidate with `routeSketchValidator` prior to provider compilation.
  - Support one repair attempt for invalid/ambiguous sketches (TRD §5.2).
- Inputs:
  - Accept `PlanInput` (from the shared validators/types already in the repo; do not redefine).
- Pipeline:
  - Require auth via `requireIdentity(ctx)`.
  - Generate 2–3 sketches (max 3) using LLM router agent (Task 02/LLM integration).
  - Validate sketches (Task 02). If invalid, apply one repair attempt (TRD §5.2), else discard.
  - For each valid sketch:
    - Compile with routing provider (Task 03).
    - Normalize to `RouteSnapshot` (Task 04).
    - Compute `RouteIndex` (Task 05).
    - Probe/maybe map conditions + wind overlay (Task 06) with soft-fail.
  - Return `PlannedRouteOptionsView` matching TRD §4.3.5:
    - `planId` (stable per invocation; document strategy)
    - `options[]` each with `routeOptionId`, `label`, `rationale`, `stats`, `map`, `overlaysPreview`
- Error codes:
  - Hard failures throw deterministic codes from Task 01 (e.g., `INVALID_INPUT`, `LLM_SKETCH_AMBIGUOUS`, `ROUTING_COMPILE_FAILED`).
  - Conditions failures must **not** throw (soft-fail).
- Performance constraints:
  - Avoid excessive `ctx.runQuery`/`ctx.runMutation` fan-out; keep orchestration in-process within the action as much as possible.

#### Acceptance Criteria
- [x] `api.actions.agent.planRide` exists after Convex codegen.
- [x] LLM sketching is implemented via **LangChain** in `convex/actions/agent/llm/routerAgent.ts` (no raw OpenAI calls in `planRide`).
- [x] With valid input, returns 2–3 options including:
  - `label`, `rationale`
  - `stats` (distance/duration/legsCount)
  - `map` (bounds + overviewGeometry + legs[])
  - `overlaysPreview.windSummary` + `conditionsStatus`
- [x] Hard failures throw deterministic TRD §11 error codes.
- [x] Soft conditions failures still return routes with `conditionsStatus: "unavailable"`.
- [x] Output shapes compile against shared types (no duplicated TRD shapes).

#### Files to Create / Modify
- **Create**: `convex/actions/agent/planRide.ts`
- **Create**: `convex/actions/agent/graphs/planningGraph.ts` (LangGraph StateGraph with structured LLM output via `model.withStructuredOutput()`)
- **Modify**: `models/route-sketch.ts` (add co-located Zod schema for structured output, if not already done in Task 02)
- **Modify (optional, but likely needed)**: `models/saved-routes.ts` (add co-located Zod schema for `PlanInput`/nested shapes used as LangChain tool schemas)
- **Create (if needed)**: `convex/actions/agent/tools/geocode-anchors.ts` (only if you choose to expose geocoding as a LangChain `tool`)

> **Implementation Note**: Original design called for `llm/routerAgent.ts` using LangChain's `createAgent`. Refactored to LangGraph `StateGraph` in `graphs/planningGraph.ts` for clearer separation of probabilistic (LLM) and deterministic (tools) logic, and to support LangSmith observability.

---

### Task 09 — QA/DevEx: Manual verification playbook for `planRide` (auth + deterministic outputs)

**Assignee**: @.cursor/agents/qa-engineer.md
**Status**: COMPLETED
**Dependencies**: Task 08

#### Context
- Sprint 1/2 emphasized a repeatable dev auth path and deterministic verification steps.
- Actions are harder to test without a harness; a documented manual flow prevents integration churn.

#### Requirements
- Write a short manual verification checklist (recommend appending to `convex/README.md` or `.spec/epics/epic-1/sprints/sprint-3/spec.md`):
  - Required env vars for planning providers (LLM, routing, weather)
  - How to run `planRide` with `npx convex run` (or equivalent)
  - Expected output shape sanity checks (2–3 options, required fields present)
  - Expected error-code checks (invalid input → `INVALID_INPUT`, etc.)
  - Conditions degraded-mode check (disable weather key → `conditionsStatus: "unavailable"`)

#### Acceptance Criteria
- [ ] A new engineer can execute a manual planRide call and confirm the outputs are valid.
- [ ] Verification includes at least one auth-required check (unauthenticated → `AUTH_REQUIRED`).
- [ ] Verification includes at least one degraded-mode check for conditions.

#### Files to Modify
- `convex/README.md` (preferred) and/or `.spec/epics/epic-1/sprints/sprint-3/spec.md`

