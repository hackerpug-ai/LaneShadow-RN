---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-13
prd_version: 1.0.0
---

# LLM Interaction Logging

## Product Description

A Convex-side logging subsystem that captures every LLM call LaneShadow makes — system prompt, user prompt, tool schema, model response, latency, status, and the structured input context — and persists it to a purpose-built table with privacy controls, retention policies, and a training-data export pipeline.

## Problem Statement

LaneShadow calls Haiku through `pi-ai`'s `complete()` function in at least four production paths (`enrichRoute`, route labels, rationales, scenic highlights). The inputs and outputs of those calls are high-value — they're the exact behavior we'd want a smaller, faster on-device model to reproduce — but today they vanish after the function returns. Only transient `console.info` / `console.warn` lines survive, and those die with the log stream.

This creates three compounding gaps:

1. **No training data.** If we ever want to distill Haiku into a small local model (as recommended in the pruning strategy research), we have to either (a) re-run Haiku offline on synthetic inputs, or (b) wait and instrument later, during which time every real user query is wasted training signal.
2. **No quality telemetry.** When a user reports "the route names are bad," we can't reconstruct what prompt Haiku saw, what it returned, or whether the fallback fired. Debugging is guesswork.
3. **No behavioral evaluation.** We can't measure Haiku's accuracy over time, detect model-drift when Anthropic rolls updates, or A/B prompt variants with real inputs.

All three problems share a single root cause: we are not recording what we ask Haiku or what it says back. Every day we don't fix this is a day of free training data thrown away.

## Solution Summary

Introduce a deterministic logging layer between LaneShadow's agent code and the `pi-ai` `complete()` call:

- **One new Convex table** (`llm_interactions`) with structured fields for task, model, prompts, response, latency, status, and input context.
- **One wrapper function** (`loggedComplete`) that times the call, captures inputs, fire-and-forgets the logging mutation, and returns the original response unchanged. Never blocks or fails inference on logging errors.
- **Callsite migration:** swap `complete(model, ctx)` for `loggedComplete(ctx, model, ctx, { task })` at every Haiku callsite (start with `enrichRoute`, expand to the other three micro-tasks).
- **Privacy layer:** opt-in user consent flag (`users.allowTrainingDataCollection`), retention cron (90 days default), and a user-facing deletion mutation.
- **Export script:** `scripts/curation/export_training_data.py` pulls interactions from Convex, writes JSONL to `.spec/training-data/{task}/YYYY-MM-DD.jsonl`, ready for QLoRA fine-tuning.

Framing for users: "Help us build offline mode — share the routes you plan." This is contribution, not surveillance. Opt-in, visible, deletable.

## Strategic Context

This PRD is a **prerequisite enabler** for the existing `on-device-ai` PRD (`.spec/prds/on-device-ai/`). That PRD assumes access to a distilled, task-specialized model; this one produces the training data that makes distillation possible. Shipping this first is the single cheapest way to de-risk the on-device AI roadmap — even if the distillation project is delayed six months, the data is accumulating the whole time.

The initiative is also valuable standalone: the debugging and telemetry benefits alone justify the two-week investment regardless of whether any on-device work ever happens.
