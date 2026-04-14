---
stability: FEATURE_SPEC
last_validated: 2026-04-13
prd_version: 1.0.0
functional_group: LOG
---

# Use Cases: Capture Infrastructure (LOG)

| ID | Title | Description |
|----|-------|-------------|
| UC-LOG-01 | Define `llm_interactions` table | Add a new Convex table with structured fields for task, model, prompts, response, latency, status, context, and user attribution. |
| UC-LOG-02 | Internal logging mutation | Provide a server-only internal mutation that accepts a fully-built interaction record and inserts it. |
| UC-LOG-03 | `loggedComplete` wrapper | Create a thin wrapper around `pi-ai`'s `complete()` that times the call, captures inputs/outputs, schedules the log mutation fire-and-forget, and returns the assistant message unchanged. |
| UC-LOG-04 | Migrate `enrichRoute` callsite | Swap the direct `complete(model, context)` call in `convex/actions/agent/tools/enrichRoute.ts` for `loggedComplete(ctx, model, context, { task: 'enrichRoute', routeContext })`, preserving all existing behavior. |

---

## UC-LOG-01: Define `llm_interactions` table

A new Convex table is added to `convex/schema.ts` that persists every LLM interaction with enough structure to support debugging, telemetry, and future training-data export.

### Acceptance Criteria

- ☐ System can persist an `llm_interactions` record containing `task`, `model`, `systemPrompt`, `userPrompt`, `toolSchema`, `response`, `latencyMs`, `status`, `errorMessage`, `userId`, `routeContext`, and `createdAt` fields
- ☐ System validates the `status` field as exactly one of `success`, `fallback`, or `error` on insert
- ☐ System indexes records by `[task, status]` for query efficiency when exporting by task
- ☐ System indexes records by `createdAt` for efficient retention cron scans
- ☐ Developer can query the table from the Convex dashboard without errors after schema push
- ☐ Existing tests pass after schema is added (schema additions are backward compatible)

---

## UC-LOG-02: Internal logging mutation

A server-only internal mutation is added that the wrapper function calls to persist interaction records. The mutation is never exposed to client code.

### Acceptance Criteria

- ☐ System exposes `internal.db.llmInteractions.logInteraction` as an `internalMutation` declared in `convex/db/llmInteractions.ts`
- ☐ System rejects client-side calls to the mutation because it is internal-only
- ☐ System accepts the full interaction record shape defined in UC-LOG-01 and returns the inserted record ID
- ☐ System sets `createdAt` to the server-side `Date.now()` when the caller omits it
- ☐ System handles mutation errors without throwing — a failed insert is logged via `console.warn` and swallowed so that callers never see an exception
- ☐ Developer can call the mutation from Convex dashboard's Functions panel for manual testing

---

## UC-LOG-03: `loggedComplete` wrapper

A new wrapper function `loggedComplete` is added at `convex/actions/agent/lib/loggedComplete.ts` that transparently logs every LLM call without changing caller behavior.

### Acceptance Criteria

- ☐ System records the start time via `Date.now()` before invoking `pi-ai`'s `complete()` function
- ☐ System captures the `systemPrompt`, `messages[0].content` (as `userPrompt`), and `tools[0].parameters` (as `toolSchema`) from the `Context` argument
- ☐ System schedules the `logInteraction` mutation via `ctx.runMutation` with `status: 'success'` when the underlying `complete()` call returns normally
- ☐ System schedules the `logInteraction` mutation with `status: 'error'` and the error message when the underlying `complete()` call throws, then re-throws the original error
- ☐ System returns the unmodified `AssistantMessage` from `complete()` to the caller so that downstream logic is unchanged
- ☐ System never blocks the inference return on the logging mutation — logging uses fire-and-forget with a `.catch(() => {})` to swallow mutation failures
- ☐ Developer can import `loggedComplete` as a drop-in replacement for `complete` at any agent callsite without other code changes

---

## UC-LOG-04: Migrate `enrichRoute` callsite

The single existing production callsite in `enrichRoute.ts` is migrated to use `loggedComplete`, and the existing fallback path also emits a logging record with `status: 'fallback'`.

### Acceptance Criteria

- ☐ System routes the `complete(model, context)` call at `convex/actions/agent/tools/enrichRoute.ts:127` through `loggedComplete` with `task: 'enrichRoute'`
- ☐ System passes the `params.routes` input as the `routeContext` field so that the prompt can be reconstructed with a different template later
- ☐ System emits a `status: 'fallback'` log record inside the catch block at `enrichRoute.ts:152` before returning fallback enrichments, capturing why the primary call failed
- ☐ System preserves the existing `withTimeout` wrapper behavior — the logging layer sits inside `loggedComplete`, not around the timeout
- ☐ Existing `enrichRoute` tests in `convex/actions/agent/tools/__tests__/enrichRoute.test.ts` pass unchanged
- ☐ Developer can observe logged interactions in the Convex dashboard within seconds of a `planRide` call that triggers enrichment
