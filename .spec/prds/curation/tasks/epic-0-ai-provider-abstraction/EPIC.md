# Epic 0: AI Provider Abstraction & Cerebras Migration

**Sequence**: 0 (foundation — runs before Epic 1)
**Status**: Backlog
**Source Proposal**: `.spec/proposals/cerebras-provider-migration.md`

## Overview
Abstract Anthropic/OpenAI provider + model selection behind intelligence-level keys (`low`, `high`) so agent code never hardcodes a provider or model ID, then switch the default provider to Cerebras (via the existing `@mariozechner/pi-ai` Cerebras adapter). Epic 1's seed pipeline doesn't depend on this, but Epic 2's LLM extraction (PIPE-004) and any curation agents that reuse the chat agent infrastructure must hit the new registry — so this lands before downstream curation work that calls `getModel()`.

## Motivation
- **Zero-churn provider swaps**: today provider/model strings live across 6 call sites; changing them is a refactor. After this epic, swapping providers is a 2-line edit in one file.
- **Cost**: differentiated by intelligence level — `low` uses `cerebras / qwen-3-235b-a22b-instruct-2507` ($0.60/$1.20 per 1M, 131K ctx) for sub-agent tool calls (100% tool-match in benchmark — `llama3.1-8b` was tested and rejected for tool-call format failures), `high` uses `cerebras / zai-glm-4.7` ($2.25/$2.75 per 1M, 131K ctx) for orchestration and generation. Both dramatically cheaper than `anthropic / claude-sonnet-4-6`. See `.spec/research/cerebras-vs-haiku/VERDICT.md`.
- **Infra already exists**: `@mariozechner/pi-ai@0.63.1` ships a Cerebras adapter; `CEREBRAS_API_KEY` is already set in the user's environment.

## Model Map (default)

| Level | Provider | Model | Context | Cost (in/out per 1M) | Used By |
|-------|----------|-------|---------|----------------------|---------|
| `low` | cerebras | `qwen-3-235b-a22b-instruct-2507` | 131K | $0.60 / $1.20 | routingAgent, searchAgent, enrichmentAgent, enrichRoute tool |
| `high` | cerebras | `zai-glm-4.7` | 131K | $2.25 / $2.75 | orchestrator, generateTripPlan, sendMessage metadata |

## Human Test Steps
1. `npx tsc --noEmit` — type check passes
2. `npx vitest run convex/` — all existing agent tests pass
3. Send a chat message from the app → verify the agent responds (server logs show a cerebras model, not `claude-*`)
4. In `convex/actions/agent/lib/models.ts`, temporarily change `MODEL_MAP.low.model` to a different Cerebras model → confirm no code changes needed anywhere else for agents to pick it up
5. `npx convex env list` shows `CEREBRAS_API_KEY` set

## PRD Sections Covered
- N/A — This epic is a cross-cutting infrastructure change sourced from `.spec/proposals/cerebras-provider-migration.md`. It precedes the PRD's scoped functional groups and exists to de-risk downstream agent/LLM work in Epic 2 (PIPE-004 Haiku extraction, CONVEX-006 intent extraction).

## Dependencies
- **Blocks**: Epic 2 (PIPE-004 and CONVEX-006 should consume `getAgentModel()` rather than importing providers directly)
- **Depends On**: none

## Task List

| ID | Title | Agent | Priority | Effort | Est (min) | Depends On |
|----|-------|-------|----------|--------|-----------|------------|
| AI-001 | Create agent model registry (`lib/models.ts`) with TDD | convex-implementer | P0 | S | 75 | — |
| AI-002 | Env migration: remove AI_PROVIDER/AI_MODEL, add CEREBRAS_API_KEY | convex-implementer | P0 | XS | 30 | — |
| AI-003 | Migrate 6 agent call sites to `getAgentModel()` + update tests | convex-implementer | P0 | M | 150 | AI-001, AI-002 |

## Wall-clock Estimate
~0.5 day (AI-001 and AI-002 run in parallel; AI-003 is a mechanical replace-across-files after both land)

## Definition of Done
- [ ] `convex/actions/agent/lib/models.ts` exists and exports `getAgentModel` + `getAgentModelInfo`
- [ ] `convex/lib/env.ts` no longer exports `AI_PROVIDER` or `AI_MODEL`
- [ ] Grep for `getModel('anthropic'` and `getModel('openai'` in `convex/actions/agent/**` returns zero hits
- [ ] `npx tsc --noEmit` passes
- [ ] `npx vitest run convex/` passes
- [ ] `npx convex env list` shows `CEREBRAS_API_KEY`
- [ ] Smoke test: chat message round-trip hits Cerebras provider
