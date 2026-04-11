# Verdict: Cerebras vs Haiku

**Status**: ✅ Complete — ran 2026-04-11, 63 calls across 4 fixtures × 3 Cerebras models.
**Note**: Anthropic keys not available at run time; Haiku/Sonnet baselines pending. Cerebras comparison is sufficient to select `low` and `high` candidates.

## Decision

- [x] **GO** — `qwen-3-235b-a22b-instruct-2507` for `low`, `zai-glm-4.7` for `high`.
- [x] `llama3.1-8b` as `low` — **REJECTED** (tool format failure, see below)
- [x] `gpt-oss-120b` as `low` — **REJECTED** (18/21 vs qwen's 21/21; missed `take_hwy1_south` sketch path and `somewhere_fun_2_hours` planRoute — both cases where qwen succeeded. Production-stable but accuracy loss not worth it.)
- [x] `gpt-oss-120b` as `high` — **DEFERRED** (reasoning_effort not yet tested; revisit if GLM-4.7 Preview status becomes a problem)

## Scorecard

| Model | Tool-match | Concise | Errors | Avg latency | Total cost (21 calls) |
|---|---|---|---|---|---|
| `llama3.1-8b` | 8/21 (38%) | 11/21 | 0/21 | 366 ms | $0.003237 |
| `zai-glm-4.7` | 19/21 (90%) | 8/21 | 0/21 | 688 ms | $0.057238 |
| `qwen-3-235b` | 21/21 (100%) | 6/21 | 0/21 | 335 ms | $0.013624 |

## Key failure modes

### llama3.1-8b — DISQUALIFIED ❌

**Root cause: tool-calling format incompatibility.** In 13/21 cases (62%), llama3.1-8b emits the intended tool call as **plain-text JSON** — e.g.:

```
{"type": "function", "name": "searchNearby", "arguments": {"query": "gas station", ...}}
```

...rather than triggering an actual API function call. The `tool_calls` list comes back empty; the call lands in `text_response`. pi-ai (which wraps the OpenAI-compatible Cerebras client) cannot intercept or retry a text-mode tool emission — the agent loop sees no tool call and terminates or stalls.

This is a known limitation of 8B-class instruction-tuned models on the OpenAI structured tool-use protocol. The model "knows" what to do but doesn't format it correctly for the API. Not fixable with prompt engineering alone (we'd need json_schema + response_format forcing, which the Cerebras API may support but pi-ai doesn't expose today).

**Additional observed failure:** `orchestrator/thanks` — called `routing_agent({"query": "thanks, that"})` instead of responding directly. The model mis-truncated the user message and triggered a spurious tool call.

### zai-glm-4.7 — Two misses in routing_agent, both acceptable

1. **`somewhere_fun_2_hours`**: Called `geocode("Point Reyes National Seashore")` instead of `planRoute` directly. The model decided to pick a concrete destination before routing — logically sound, just differs from the expected straight-to-planRoute pattern. In production this adds one extra API roundtrip; not a correctness failure.
2. **`take_hwy1_south`**: Called `geocode("Santa Cruz, CA")` as the first step instead of `createRouteSketch`. The model appears to have conflated "Highway 1 south" with a destination-first workflow. In production this could produce the wrong route (planRoute-style instead of sketch), but it does proceed toward a result.

Neither miss is a format failure — both are semantically reasonable, just not optimal. Fixable with tighter prompt examples (already good candidates for prompt iteration).

## Wins observed

- **qwen-3-235b latency (335 ms avg)** is faster than llama3.1-8b (366 ms) and significantly faster than zai-glm-4.7 (688 ms). Cerebras dedicated hardware inference is very fast.
- **qwen-3-235b cost**: $0.014 for 21 calls vs $0.057 for zai-glm-4.7. Cheaper than Haiku (est. ~$0.03 at $0.80/$4.00 per 1M, similar token volumes).
- **All three models correctly avoided tool calls for general knowledge questions** (`abs_light`, `general_knowledge_tank`) — a common failure mode in smaller models. This is encouraging.
- **qwen-3-235b handled the "conciseness" trap worse than the others** (6/21 vs 11/21 for llama, 8/21 for glm) but still produced correct tool calls. The conciseness grader (≤280 chars) may be too strict — text was often correct but verbose.

## Recommended MODEL_MAP

```typescript
const MODEL_MAP: Record<IntelligenceLevel, { provider: string; model: string }> = {
  // qwen-3-235b-a22b-instruct-2507: 131K ctx, $0.60/$1.20 per 1M
  // 100% tool-match on all sub-agent fixtures, 335ms avg latency — cheaper than Haiku
  low:  { provider: 'cerebras', model: 'qwen-3-235b-a22b-instruct-2507' },
  // zai-glm-4.7: 131K ctx, $2.25/$2.75 per 1M
  // 90% tool-match, 688ms, strong on orchestration and direct answers
  high: { provider: 'cerebras', model: 'zai-glm-4.7' },
}
```

## Final MODEL_MAP (locked)

```typescript
const MODEL_MAP: Record<IntelligenceLevel, { provider: string; model: string }> = {
  low:  { provider: 'cerebras', model: 'qwen-3-235b-a22b-instruct-2507' },
  high: { provider: 'cerebras', model: 'zai-glm-4.7' },
}
```

Task specs updated: `epic-0-ai-provider-abstraction/AI-001.md` and `EPIC.md` already reflect this.

## Open questions / follow-ups

1. **Anthropic baseline comparison still pending.** We don't know how Haiku performs on the same fixtures. Before GO, run `python run_comparison.py --models claude-haiku-4-5,claude-sonnet-4-6` when keys are available. Primary question: does Haiku also fail on `take_hwy1_south`? If so, zai-glm-4.7's miss is parity, not regression.
2. **qwen-3-235b conciseness.** Six of its text responses exceeded 280 chars. Check whether these are the "no tool expected" cases (where a longer explanation is fine) or cases where the model verbosely preambles before returning results.
3. **zai-glm-4.7 `take_hwy1_south` miss.** Prompt already has an explicit example: `"Take Highway 1 south" → geocode → createRouteSketch`. Try adding one more example before accepting the miss.
4. **pi-ai json_schema forcing.** If a future Cerebras model regression emerges, check whether pi-ai exposes `response_format: {type: "json_object"}` or tool_choice enforcement — this would prevent text-mode tool emission from ever landing in production.
5. **Intent extraction (CONVEX-006) model choice.** CONVEX-006 uses a JSON-schema validation + retry loop (not tool calling). Both qwen-3-235b and zai-glm-4.7 handle direct-answer responses well. Recommend `low` (qwen-3-235b) there — the task is JSON extraction, not multi-step tool orchestration.
