---
stability: CONSTITUTION
last_validated: 2026-04-13
prd_version: 1.0.0
---

# Technical Requirements

## System Components

| Component | Role |
|-----------|------|
| `llm_interactions` table | Convex table persisting every LLM call with structured fields for task, model, prompts, response, status, and context |
| `convex/db/llmInteractions.ts` | Module exposing the `logInteraction` internal mutation and `deleteMyTrainingData` public mutation |
| `convex/actions/agent/lib/loggedComplete.ts` | Wrapper around `pi-ai`'s `complete()` function that transparently schedules logging mutations |
| `convex/crons.ts` (extension) | New `purgeExpiredInteractions` cron entry enforcing 90-day retention |
| `scripts/curation/export_training_data.py` | Python script that pulls logged interactions from Convex and writes JSONL artifacts to `.spec/training-data/` |
| Settings screen (extension) | Mobile UI toggle and deletion button wired to Convex mutations |

## Data Schema

### `llm_interactions` table

```ts
llm_interactions: defineTable({
  task: v.string(),                                    // "enrichRoute" (future: "legLabels", "rationales", "scenicHighlights")
  model: v.string(),                                   // e.g. "claude-3-5-haiku-20241022" — pulled from getAgentModel('low').name
  systemPrompt: v.string(),                            // Full system prompt sent to the model
  userPrompt: v.string(),                              // Full user message content
  toolSchema: v.optional(v.any()),                     // TypeBox schema exposed as tool parameters (enrichmentTool.parameters)
  response: v.any(),                                   // Tool call arguments from the model (the structured output)
  latencyMs: v.number(),                               // Wall time from pre-complete to post-complete
  status: v.union(                                     // Always captured, not just success
    v.literal("success"),
    v.literal("fallback"),
    v.literal("error"),
  ),
  errorMessage: v.optional(v.string()),                // Populated when status != "success"
  userId: v.optional(v.id("users")),                   // undefined for anonymous / unauth'd calls
  routeContext: v.optional(v.any()),                   // Structured input (EnrichRouteInput.routes) for prompt reconstruction
  createdAt: v.number(),                               // Date.now() at wrapper invocation
})
  .index("by_task_status", ["task", "status"])
  .index("by_createdAt", ["createdAt"])
  .index("by_user", ["userId"]),                       // Supports UC-PRIV-04 user deletion
```

### `users` table extension

```ts
// Add to existing userValidator in convex/schema.ts:
allowTrainingDataCollection: v.optional(v.boolean()),  // Default absent = false = no logging
```

## API Design

### `internal.db.llmInteractions.logInteraction` (internalMutation)

**Args (full record):**
```ts
{
  task: v.string(),
  model: v.string(),
  systemPrompt: v.string(),
  userPrompt: v.string(),
  toolSchema: v.optional(v.any()),
  response: v.any(),
  latencyMs: v.number(),
  status: v.union(v.literal("success"), v.literal("fallback"), v.literal("error")),
  errorMessage: v.optional(v.string()),
  userId: v.optional(v.id("users")),
  routeContext: v.optional(v.any()),
}
```

**Returns:** `v.id("llm_interactions")` — the inserted record ID
**Errors:** Swallowed internally with `console.warn`; never throws to caller

### `api.users.deleteMyTrainingData` (public mutation)

**Args:** `{}` (no arguments — operates on authenticated caller)
**Returns:** `v.object({ deletedCount: v.number() })`
**Auth:** Requires authenticated user; throws `ConvexError` with code `UNAUTHENTICATED` otherwise
**Side effect:** Deletes all `llm_interactions` where `userId === ctx.auth user._id`

### `api.users.setTrainingDataConsent` (public mutation)

**Args:** `{ enabled: v.boolean() }`
**Returns:** `v.null()`
**Auth:** Requires authenticated user
**Side effect:** Updates `users.allowTrainingDataCollection` for the calling user

### `loggedComplete` (TypeScript utility, not a Convex function)

**Signature:**
```ts
export async function loggedComplete(
  ctx: ActionCtx,
  model: LanguageModel,
  context: Context,
  options: {
    task: string
    routeContext?: unknown
  },
): Promise<AssistantMessage>
```

**Behavior:**
1. Read `ctx.auth.getUserIdentity()` to resolve `userId` (may be `undefined`)
2. Check `users.allowTrainingDataCollection` for that user; short-circuit logging if absent/false
3. Capture `startMs = Date.now()`
4. Call `complete(model, context)`:
   - On success: schedule `logInteraction` mutation (fire-and-forget) with `status: 'success'`, return assistant message
   - On throw: schedule `logInteraction` mutation with `status: 'error'`, re-throw original error
5. Callers can also invoke `loggedComplete.logFallback(ctx, {...})` from catch blocks to record `status: 'fallback'` without invoking the LLM again

## Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                        LaneShadow Convex                     │
│                                                               │
│   ┌──────────────────┐         ┌─────────────────────┐        │
│   │  enrichRoute.ts  │────────▶│  loggedComplete.ts  │        │
│   │   (agent tool)   │         │    (wrapper)        │        │
│   └──────────────────┘         └──────┬──────┬───────┘        │
│                                       │      │                │
│                       (inference) ────┘      │ (logging)      │
│                                │              ▼                │
│                                │      ┌───────────────────┐   │
│                                │      │ logInteraction    │   │
│                                │      │ (internalMutation)│   │
│                                │      └────────┬──────────┘   │
│                                │               │              │
│                                ▼               ▼              │
│                         {pi-ai complete}  ┌───────────────┐   │
│                                │          │ llm_          │   │
│                                │          │ interactions  │   │
│                                │          │ (table)       │   │
│                                │          └───┬──────┬────┘   │
│                                │              │      │        │
│                                │              │      │        │
│   ┌──────────────────┐         │              │      │        │
│   │ purgeExpired     │─────────┼──────────────┘      │        │
│   │ Interactions     │         │                     │        │
│   │ (daily cron)     │         │                     │        │
│   └──────────────────┘         │                     │        │
│                                │                     │        │
│   ┌──────────────────┐         │                     │        │
│   │ deleteMy         │─────────┼─────────────────────┘        │
│   │ TrainingData     │         │                              │
│   │ (user mutation)  │         │                              │
│   └────────▲─────────┘         ▼                              │
│            │          {Anthropic Haiku}                       │
└────────────┼──────────────────────────────────────────────────┘
             │
             │ (settings toggle / delete button)
             │
     ┌───────┴────────┐                 ┌──────────────────────┐
     │ Settings       │                 │ export_training_     │
     │ Screen         │                 │ data.py              │
     │ (React Native) │                 │ (Python, off-device) │
     └────────────────┘                 └──────────┬───────────┘
                                                   │
                                                   ▼
                                      .spec/training-data/
                                      └── enrichRoute/
                                          └── 2026-04-13.jsonl
```

## External Dependencies

| Component | Dependency | Purpose | Documentation |
|-----------|------------|---------|---------------|
| `loggedComplete.ts` | `@mariozechner/pi-ai` | Existing LLM client; `complete()` is the function wrapped | Already imported at `convex/actions/agent/tools/enrichRoute.ts:3` |
| `logInteraction` mutation | Convex internal mutations | Server-only write path | https://docs.convex.dev/functions/internal-functions |
| `purgeExpiredInteractions` cron | Convex scheduled functions | Daily retention enforcement | https://docs.convex.dev/scheduling/cron-jobs |
| `export_training_data.py` | Existing curation MCP pattern | Auth and Convex query interface | See `scripts/curation/` existing scripts |
| `export_training_data.py` | `jsonlines` Python package | JSONL writing | https://jsonlines.readthedocs.io/ |
| Settings screen toggle | Existing Settings screen Convex bindings | UI state persistence | Existing pattern in mobile app |

## UI Infrastructure

**Design libraries:** None new. Reuses existing Settings screen components and theme tokens.

**Style tokens:** No new tokens. Uses existing destructive-action color for the delete button and the existing toggle component style.

**Component reuse:**
- Settings row toggle — existing
- Destructive confirmation alert — existing native pattern (`Alert.alert`)
- Text link to privacy policy — existing pattern
- Toast notification on delete success — existing pattern

**New components:** Zero. This initiative is deliberately UI-minimal.

## Privacy Policy Changes

Add a new section `#llm-logging` to the privacy policy covering:

1. **What's collected:** Prompt sent to the LLM, response from the LLM, input route context (waypoints, stats, preferences), latency, model name, user ID, timestamp
2. **What's not collected:** User-typed free text, messages, chat history, location outside of ride planning context
3. **How long it's kept:** 90 days after which the data is automatically purged
4. **How to stop it:** Settings screen toggle, effective immediately; past data is preserved until deletion
5. **How to delete it:** Settings screen "Delete my contributed data" button
6. **How it's used:** Debugging, quality telemetry, and future training of an offline assistant model. Never shared with third parties. Never sold.

## Test Strategy

- **Schema test:** Verify insert/query of `llm_interactions` works against a mock Convex test harness
- **Wrapper test:** Mock `complete()` to return a fixture response; assert that `logInteraction` is called with the expected shape
- **Wrapper failure test:** Mock `complete()` to throw; assert that the wrapper re-throws and that `logInteraction` is called with `status: 'error'`
- **Consent gate test:** Call `loggedComplete` for a user with `allowTrainingDataCollection: false`; assert that `logInteraction` is never called
- **Retention cron test:** Seed 100 records with varying `createdAt`; run cron; assert only records >90 days are deleted
- **Deletion mutation test:** Seed records for two users; call `deleteMyTrainingData` as user A; assert user A's records are gone and user B's are untouched
- **Export script test:** Mock Convex query to return a fixture; assert the JSONL file has the expected shape and field names
- **Integration test:** Full `enrichRoute` call with consent on; assert a record lands in the table within 5 seconds

## Known Risks

| Risk | Mitigation |
|------|------------|
| Convex document quota growth | 90-day retention caps total records; sample rate can be reduced if storage becomes a concern |
| User concern about "AI data collection" | Opt-in default, clear copy, visible delete button, privacy policy transparency |
| Logging mutation failures causing noisy warn logs | Use `console.warn` sparingly; rate-limit via a simple in-memory counter if volume becomes annoying |
| Large `routeContext` fields blowing up record size | 50 KB per-record cap enforced in the wrapper; truncate if exceeded |
| User forgetting they opted in | Periodic reminder in Settings ("You're helping build offline mode — thanks!") deferred to a later cycle |
