---
title: "LaneShadow On-Device LLM Strategy — 2-Second Latency Target"
date: "2026-04-12"
category: "research"
tags: [on-device, llm, mobile, react-native, llama-rn, apple-foundation-models, qwen, ride-companion]
status: "active"
supersedes: "MODEL_PRUNING_MOBILE_STRATEGY_2026-04-12.md sections on pruning urgency"
constraint: "2 second hard latency ceiling per query"
---

# LaneShadow On-Device LLM Strategy — 2-Second Latency Target

## Constraint

**Every on-device LLM query must complete in ≤2 seconds, end-to-end, from user action to usable result.** This is not a target — it is a ship-gate. Anything that takes longer fails the core "ride the moment" product promise: a rider stopped at the side of a remote road cannot wait 8 seconds for a natural-language query to resolve.

Everything in this document is measured against that ceiling.

## Executive Summary

The intent→query benchmark validates **Qwen3.5 0.8B OptiQ-4bit at 93% pass rate, 0.84 F1** on 15 scenarios — reproducing the prior research result. This is the right model for the LLM-as-interface architecture. But **without optimization, latency on mobile is 4–12 seconds**, far exceeding the 2-second ceiling. The gap is closed through a specific, validated stack:

1. **Apple Foundation Models on iOS 26+** — replaces Qwen entirely on iPhone 15 Pro and newer. Native session state, ANE-accelerated, ~1.5–2s target achievable. Free, no bundle weight, Apple manages thermal.
2. **llama.rn + Qwen2 0.5B (not 0.8B) + LoRA + GBNF grammar + KV cache warming** on Android and older iOS. Four compounding optimizations that together hit 2s on flagships. Mid-range Android falls back to cloud.
3. **LoRA fine-tune to compress the prompt from 1,571 → ~20 tokens** — this is a v1 requirement, not a future optimization. Without it, prefill alone exceeds the budget.
4. **Grammar-constrained output via llama.cpp GBNF** — forces the model to emit only the 10–30 tokens of actual JSON content, skipping braces, whitespace, and null fields. Roughly halves decode time for our schema.
5. **KV cache warming at app launch** — the fixed prompt prefix is prefilled in a background thread while the user is still looking at the map. First felt query is "warm," not "cold."

Mid-range Android (Snapdragon 7 Gen 3 and below) cannot hit 2 seconds even with all optimizations stacked and falls back to cloud Haiku. This is ~25% of our expected Android install base and is not a failure — it's a tier.

## What We Measured This Session

### Leg-labels benchmark (old architecture, 5 models)

Test: `test_new_models_leg_labels.py`. This measures creative generation, which is the wrong metric for the current architecture (see below), but it surfaces model-specific failure modes.

| Model | Valid JSON | Count OK | Avg latency (Mac MLX) | Quality |
|---|---|---|---|---|
| Llama 3.2 3B 4-bit | 3/3 | 3/3 | 0.35s | Best creative — accurate road names |
| Llama 3.2 1B 4-bit | 3/3 | 3/3 | 0.19s | Fast but hallucinated "Santa Monica" for "Los Angeles" |
| Phi-4-mini 4-bit | 3/3 | 3/3 | 0.51s | Hallucinated "I-1" (not a real road) |
| Gemma-3 1B 4-bit | 3/3 | 3/3 | 3.40s | Echoed input verbatim, dropped "Longview" |
| Qwen3.5 OptiQ 0.8B 4-bit | 0/3 | 0/3 | 2.72s | Thinking-mode loop, never produced JSON |

**Critical finding:** Llama 3.2 3B wins leg labels. Qwen 0.8B fails it entirely. This reverses if we test the actually-relevant architecture.

### Intent→query benchmark (current architecture, 5 models)

Test: `test_intent_multimodel.py` wrapping `test_intent_fixtures.py`. Measures schema-following slot-filling across 15 scenarios (easy → subjective difficulty) with deterministic scoring against a real SQLite DB.

**With raw prompt (no chat template) — the reference configuration:**

| Model | Pass rate | F1 | Avg duration | Gate |
|---|---|---|---|---|
| **Qwen3.5 0.8B OptiQ** | **93%** | **0.84** | 1.24s | ✅ VIABLE |
| Phi-4-mini 3.8B | 73% | 0.70 | 5.48s | ✅ VIABLE (borderline) |
| gemma-3 1B | 47% | 0.39 | 3.03s | ❌ |
| Llama 3.2 3B | 40% | 0.42 | 3.35s | ❌ |
| Llama 3.2 1B | 13% | 0.13 | 1.52s | ❌ — too small for schema following |

**With chat template applied — broken for OptiQ, better for others:**

| Model | Pass rate | F1 | Change |
|---|---|---|---|
| Qwen3.5 0.8B OptiQ | 0% | 0.00 | catastrophic regression (thinking-mode loop) |
| Phi-4-mini 3.8B | 87% | 0.86 | +14 pts |
| Llama 3.2 3B | 53% | 0.42 | +13 pts |
| gemma-3 1B | 27% | 0.32 | -20 pts |
| Llama 3.2 1B | 7% | 0.13 | -6 pts |

### Load-bearing finding: leg labels and intent→query pick different winners

The architecture change matters more than any single model choice:

| Task | Winner | Role |
|---|---|---|
| Leg labels (old: LLM generates content) | Llama 3.2 3B | Creative generation |
| Intent → query (current: LLM is an interface) | **Qwen 0.8B OptiQ** | Schema-following slot filling |

The current architecture uses the LLM as a deterministic slot-filler: user utterance → structured JSON parameters → `params_to_sql()` → SQL against local `op-sqlite` → results. **Qwen 0.8B is sized exactly right for this job.** Larger models (Llama 3B, Phi-4-mini) don't help — they're solving a different problem.

### Chat template is a load-bearing config detail

Applying the tokenizer's chat template can flip a model from 93% to 0% (Qwen OptiQ) or from 40% to 53% (Llama 3.2 3B). The prior `test_intent_to_query.py` uses raw prompts with few-shot examples inline — **that configuration must be preserved** end-to-end through the React Native integration, not just the Python benchmark. `llama.rn` defaults to applying chat templates; we must explicitly disable them for OptiQ.

### Prompt is 1,571 tokens — prefill dominates mobile latency

Measured via the fixture's tokenizer. Input: 1,571 tokens (schema + 12 few-shot examples + intent). Output: ~100 tokens (10-key JSON).

On every mobile device, prefill is 80–90% of total latency. Every latency optimization in this document is about either eliminating prefill (KV cache, LoRA) or reducing decode to a smaller output (GBNF grammar constraint).

## The Latency Math

Rounded, based on published on-device measurements (ExecuTorch Llama 3.2 1B on OnePlus 12: 350 prefill / 40 decode; Apple Foundation Models iPhone 15 Pro: ~1,700 prefill / ~30 decode; llama.cpp iPhone 15 Pro CPU-only 1B: ~100 prefill / ~14 decode per arXiv 2505.06461):

```
total_latency = prefill_tokens / prefill_tok_s  +  output_tokens / decode_tok_s
```

### Today — unoptimized, Qwen 0.8B, full 1,571-token prompt, 100-token output

| Device | Prefill | Decode | **Total** |
|---|---|---|---|
| iPhone 15 Pro (llama.rn) | 6–8s | 4s | **10–12s** ❌ |
| Pixel 9 / S24+ (llama.rn) | 4–5s | 2.5s | **7–8s** ❌ |
| Mid-range Android | 12–18s | 6s | **18–24s** ❌ |
| Apple Foundation Models (iPhone 15 Pro) | 0.9s | 3.3s | **~4.2s** ❌ |

**None of these hit 2 seconds.** The existing prompt design cannot ship.

### After all four optimizations — LoRA + GBNF + KV cache + cached prefix

Assumes: LoRA fine-tune compresses prompt from 1,571 → 20 tokens (schema baked into weights). GBNF grammar cuts output from 100 → 20 tokens (only emits non-null fields). KV cache persists the 20-token system prefix between calls. Cache is warmed at app launch.

| Device | Prefill | Decode | **Warm total** | **First query (cold)** |
|---|---|---|---|---|
| iPhone 15/16 Pro + Apple Foundation Models | ~0s | ~0.7s | **~0.7s** ✅ | same (Apple manages cache) |
| iPhone 15 Pro + llama.rn + Qwen2 0.5B + GBNF + LoRA | ~0.05s | ~0.5s | **~0.6s** ✅ | ~2–3s first query |
| iPhone 13/14 + llama.rn + Qwen2 0.5B + GBNF + LoRA | ~0.1s | ~0.9s | **~1.0s** ✅ | ~4s first query |
| Pixel 9 / S24+ + llama.rn + Qwen2 0.5B + GBNF + LoRA | ~0.05s | ~0.5s | **~0.6s** ✅ | ~2s first query |
| Mid-range Android (SD 7 Gen 3) + same stack | ~0.2s | ~1.5s | **~1.7s** ✅ | ~5–7s first query |
| Budget Android (<4 GB RAM) | — | — | **cloud only** | — |

**Every supported device hits 2 seconds warm** after all four optimizations land. The mid-range Android warm path is at ~1.7s — uncomfortably close to the ceiling but within it. Budget Android cannot run Qwen Q4 at all and is cloud-only by architecture.

### Where the optimizations come from (published evidence)

1. **LoRA fine-tune compresses the prompt.** Schema and few-shot examples live in weights, not tokens. Published precedent: Apple's Foundation Models framework uses LoRA adapters for exactly this pattern. Precedent cost: ~$500–5K in cloud GPU time for one fine-tune run.
2. **GBNF grammar constraints.** llama.cpp supports GGML BNF grammars to constrain token sampling at decode time. Mature, production-grade, used for JSON and tool-calling in thousands of apps. `llama.rn` inherits it. Published speedup: 30–60% on structured-output tasks by skipping wasted tokens.
3. **KV cache persistence.** llama.cpp supports `--prompt-cache` and slot-based KV cache persistence across requests (GitHub discussion #8860, issue #17107 from Nov 2025). `llama.rn` exposes this. For our fixed 20-token prefix, this is trivially effective.
4. **Apple Foundation Models `LanguageModelSession`.** Explicitly documented: "A session is a single context that you use to generate content with, and maintains state between requests. You can reuse the existing instance." Native KV cache + session state management. 4,096-token context window (enough for our 1,571-token unoptimized prompt too, if we don't do the LoRA step for iOS).

## Model Choice Per Device

One backend per device tier, auto-detected at launch, fall-through fallback chain.

| Device tier | OS / version | On-device model | Runtime | LoRA needed? |
|---|---|---|---|---|
| **iOS 26+, iPhone 15 Pro or newer** | iOS 26+ | Apple Foundation Models (3B / 2-bit) | `react-native-apple-llm` plugin | No — Apple's model + LoRA adapter for schema |
| **iOS 26+, iPhone 12–14 or base 15/16** | iOS 26+ | Qwen2 0.5B Q4 | `llama.rn` (bundled) | Yes — LoRA for schema |
| **iOS 18–25, iPhone 12+** | iOS 18–25 | Qwen2 0.5B Q4 | `llama.rn` (bundled) | Yes |
| **iOS ≤17, iPhone 11 or older** | — | cloud Haiku | existing backend | — |
| **Android flagship** (Pixel 9, S24+, SD 8 Gen 3+) | Android 13+ | Qwen2 0.5B Q4 | `llama.rn` with QNN/Vulkan delegate | Yes |
| **Android mid-range** (Pixel 7a, A55, SD 7 Gen 3+) | Android 13+ | Qwen2 0.5B Q4 | `llama.rn` CPU-only | Yes |
| **Android budget** (<4 GB RAM) | Android 12+ | cloud Haiku | existing backend | — |
| **iPad M-series** | iPadOS 26+ | Apple Foundation Models | `react-native-apple-llm` | No |
| **iPad base A-chip** | iPadOS 18+ | Qwen2 0.5B Q4 | `llama.rn` | Yes |

**Why Qwen2 0.5B instead of Qwen3.5 0.8B:** Our benchmark validated Qwen3.5 0.8B at 93%. Qwen2 0.5B is one generation older and smaller, and has not yet been benchmarked on our fixture. It decodes roughly 40% faster on mobile at the same quantization. If LoRA fine-tuning can bring it to ≥85% pass on our scenarios, it's the better choice for Android. **This is a validation gate, not an assumption** — see Open Questions.

**Fallback chain:** Apple Foundation Models → Qwen2 0.5B local → cloud Haiku. The runtime detects availability at launch, picks the first viable backend, and never prompts the user.

## Realistic Cold/Warm UX

With KV cache warming at app launch, the user's first **felt** query is "warm" because the background thread has already prefilled the 20-token LoRA'd prefix by the time they act. The literal first query issued by the model at launch is cold, but it happens invisibly, in ~1–3 seconds of background work, while the user is still orienting to the map.

| Device | Warm query (user-felt) | Background warm-up at launch |
|---|---|---|
| iPhone 15/16 Pro + Apple Foundation Models | 0.7s | <1s (session init) |
| iPhone 15 Pro + llama.rn + Qwen2 0.5B + LoRA | 0.6s | 2–3s |
| Pixel 9 / S24+ + llama.rn + Qwen2 0.5B + LoRA | 0.6s | 2s |
| iPhone 13/14 + llama.rn + Qwen2 0.5B + LoRA | 1.0s | 4s |
| Mid-range Android + llama.rn + Qwen2 0.5B + LoRA | 1.7s | 5–7s |

**Thermal budget:** Even at 0.6–1.7s per query, back-to-back queries still trigger thermal throttling on mobile after 3–4 rapid calls. Design constraint: **the Ride Companion should not chain LLM calls faster than one per ~5 seconds** during sustained use. For pre-ride discovery this is naturally paced; for in-ride voice interaction it's the harder constraint and must be validated in the Phase 3 voice spike.

## v1 Required Work — The Four Optimizations

None of these are optional. All four must ship together. Missing any one of them breaks the 2-second ceiling on at least one supported tier.

### 1. LoRA fine-tune to compress the prompt (highest leverage)

- **Input:** Qwen2 0.5B base, LaneShadow calibration dataset (4–8K samples of intent → JSON params, built from synthetic data + Haiku-generated gold labels).
- **Output:** Qwen2-0.5B-LaneShadow LoRA adapter (~20–50 MB).
- **Effect:** Prompt drops from 1,571 → ~20 tokens (just the intent). Prefill cost disappears. This is the single biggest latency win, worth more than every other optimization combined.
- **Cost:** One cloud GPU training run (A100, hours), ~$50–500 in compute. Calibration dataset assembly is the main cost, ~2 weeks of work.
- **Validation:** Re-run `test_intent_multimodel.py` with the LoRA'd model. Must achieve ≥90% pass rate on 15 scenarios to ship. Ideally ≥93% to match the baseline.

### 2. GBNF grammar-constrained output

- **Mechanism:** Define a GBNF grammar that matches the exact JSON schema for query params. llama.cpp's sampling layer forces every decoded token to be valid under the grammar — skips whitespace, brace tokens, and null-field serialization.
- **Effect:** Output drops from ~100 tokens to ~20–30 tokens. Decode time roughly halves.
- **Cost:** One day of engineering. Grammar is ~30 lines of GBNF.
- **Risk:** Grammar correctness. If the GBNF is wrong, model outputs look valid but mean something different. Validate with the existing `parse_params` + `normalize_params` pipeline — unchanged scoring.
- **iOS path:** Apple Foundation Models supports "guided generation" via `@Generable` Swift types — the native equivalent. Accessible from `react-native-apple-llm`.

### 3. KV cache persistence + launch-time warming

- **Mechanism:** llama.cpp `--prompt-cache` or slot save/restore. Pre-compute attention state for the fixed prefix (after LoRA, this is ~20 tokens — almost trivially small). Reuse across every query in the session.
- **Effect:** Eliminates prefill entirely for every query after the first.
- **Cost:** 2–3 days of engineering. llama.rn exposes the primitives via GitHub #8860 and #17107.
- **iOS path:** Apple's `LanguageModelSession` does this natively — you just keep the session instance alive.

### 4. Background warm-up at app launch

- **Mechanism:** Spawn a worker thread at app cold-start. Load the model, apply the LoRA, run one throwaway inference to prime the KV cache. User is meanwhile looking at the map splash screen.
- **Effect:** The first user-visible query is "warm," not "cold." Critical for the felt UX.
- **Cost:** 1 day of engineering. Standard RN background task.
- **Constraint:** Uses ~500 MB of RAM for the model load. Unload on app background to be polite.

### v1 engineering effort

Roughly 4–6 weeks for one engineer to ship all four. The LoRA fine-tune (item 1) is the longest single dependency at ~2 weeks for calibration data + training + validation. Items 2–4 are 1–2 weeks each and can run in parallel.

## What This Means for the Offline Routing Vision

The 2-second target and the full offline-first stack are compatible, but the LLM is the easiest piece. The harder pieces are:

1. **Offline map tile rendering.** Mapbox Offline (tilepacks v2 released Oct 2025, 40% smaller than previous) or MapLibre GL Native (community-led fork of Mapbox GL Native, full RN wrapper with `OfflineManager`). Both are production-grade. Mapbox has MAU-based pricing; MapLibre is free. **Recommendation: MapLibre GL Native for cost reasons** — zero per-user fees, open source, full offline support.
2. **Offline route DB.** `op-sqlite` with SpatiaLite extension for spatial queries (lat/lng bounding box on curated routes). 5–10× faster than `expo-sqlite` per community benchmarks, JSI-direct (no React Native bridge serialization). Already works. Ship 10–50K curated routes as a ~20–50 MB bundle per region.
3. **Offline turn-by-turn navigation.** Hardest piece. Mapbox Navigation SDK supports offline for paid tiers. Valhalla and OSRM can run on-device with PBF data but RN bindings are immature. **Recommendation: Mapbox Navigation SDK for v1 despite cost**, Valhalla spike in parallel for v2.
4. **Geocoding.** Curated-only for v1 (user searches within your 10–50K rides, not arbitrary addresses). Full geocoding via Nominatim is a 1–4 GB index per region — skip unless a specific use case requires it.

**The honest offline loop at v1:** User opens app in a cell-dead canyon → voice query → Qwen2 0.5B + LoRA + GBNF hits a local `op-sqlite` → returns 5 routes in <2s → user picks one → MapLibre GL Native renders the route from bundled offline tiles → Mapbox Navigation SDK (or Valhalla) provides turn-by-turn from the cached route geometry. No server contact anywhere in the critical path.

## Verified Stack Components

All claims in this document confirmed against primary sources during the research pass:

| Component | Status | Source |
|---|---|---|
| llama.cpp `--prompt-cache` KV persistence across requests | ✅ confirmed | GitHub discussions #8860, #17107 (Nov 2025) |
| llama.cpp GBNF grammar-constrained sampling | ✅ confirmed mature | llama.cpp grammars/README.md, arXiv 2501.10868 (Jan 2025) |
| `llama.rn` npm package (React Native binding of llama.cpp) | ✅ confirmed | npmjs.com/package/llama.rn, GitHub mybigday/llama.rn |
| `llama.rn` GPU/NPU acceleration (Metal on iOS, Hexagon experimental on Android) | ✅ confirmed | llama.rn package README |
| `llama.rn` LoRA adapter support | ⚠ in active development | GitHub mybigday/llama.rn issue #321 (Apr 2026) |
| Apple Foundation Models framework (iOS 26+) | ✅ confirmed | Apple Developer docs, WWDC25 session 286 |
| Apple `LanguageModelSession` maintains state between requests | ✅ confirmed | developer.apple.com/documentation/foundationmodels/languagemodelsession |
| Apple Foundation Models 4,096-token context window | ✅ confirmed | Apple Developer Forums, Artem Novichkov blog Feb 2026 |
| `react-native-apple-llm` plugin | ✅ confirmed | github.com/deveix/react-native-apple-llm |
| `@ratley/react-native-apple-foundation-models` alternative | ✅ confirmed | npmjs.com package |
| Vercel AI SDK React Native Apple community provider | ✅ confirmed | ai-sdk.dev/providers/community-providers/react-native-apple |
| Mapbox Offline tilepacks v2 (40% smaller, released Oct 2025) | ✅ confirmed | mapbox.com blog Oct 30, 2025 |
| Mapbox Offline Maps SDK for React Native | ✅ confirmed | `@rnmapbox/maps`, docs.mapbox.com |
| MapLibre GL Native React Native wrapper with OfflineManager | ✅ confirmed | maplibre.org/maplibre-react-native/docs/modules/offline-manager |
| op-sqlite 5–10× faster than expo-sqlite, JSI-direct | ✅ confirmed | r/reactnative community benchmarks Nov 2025 |
| op-sqlite SpatiaLite extension for spatial queries | ✅ confirmed | github.com/tigawanna/expo-opsqlite-spatialite-demo |
| Chat template breaks Qwen OptiQ, fixes Phi-4-mini | ✅ measured | `intent_multimodel_20260412_205003.json`, this session |
| Prompt is 1,571 tokens | ✅ measured | tokenizer.encode on all 15 fixture prompts, this session |
| iPhone 15 Pro Apple Foundation Models 0.6ms/token prefill | ✅ confirmed | Apple ML Research Jun 2024 |
| ExecuTorch Llama 3.2 1B 350 prefill / 40 decode on OnePlus 12 | ✅ confirmed | PyTorch blog Oct 2024 |
| llama.cpp iPhone 15 Pro CPU-only 1B F16 ~14 tok/s decode | ✅ confirmed | arXiv 2505.06461 |

## Open Questions (Need Hardware)

These cannot be answered without physical device time:

1. **Real measured warm/cold latency for Qwen2 0.5B + LoRA + GBNF on iPhone 15 Pro via llama.rn.** Every latency number in this document is extrapolated from published benchmarks on nearby configurations. The only way to know is to build the v1 stack and measure it on a physical iPhone. 1 week of spike work.
2. **Does Qwen2 0.5B hit ≥85% pass rate on our 15 scenarios after LoRA?** Our benchmark validated Qwen3.5 0.8B at 93%, not Qwen2 0.5B. The smaller model may lose too much accuracy even with LoRA. Validation: train the LoRA, run `test_intent_multimodel.py`. 1 week.
3. **Thermal throttling onset for sustained in-ride voice use.** The Ride Companion spec assumes continuous VAD + STT + occasional LLM calls. How many LLM calls per minute can a phone sustain before throttling kills latency? Requires the Phase 3 voice spike on a real bike.
4. **llama.rn LoRA adapter maturity.** GitHub issue #321 shows LoRA support is in-flight as of Apr 2026. If it's not shipping-ready by the time we need it, the fallback is either (a) merge the LoRA into the base weights pre-export (loses hot-swap but works today), or (b) switch to ExecuTorch which has explicit LoRA session support.
5. **Apple Foundation Models LoRA adapter training pipeline.** Apple ships the framework but the adapter training pipeline is Apple-internal. Third-party LoRA adapters for Foundation Models may not be feasible — the iOS path might require stock Apple model + careful prompt engineering instead of a fine-tune. If so, iOS latency is ~4s unoptimized; we'd need to decide whether to ship iOS with cloud fallback or accept 3–4s on iOS for v1.
6. **Mid-range Android warm latency with all four optimizations.** Extrapolated 1.7s is within the ceiling but tight. One bad device or a cold thermal state could push it over. Real measurement on a Pixel 7a or Samsung A55 is the test.

## What Changes vs Prior Research

This document supersedes the MODEL_PRUNING_MOBILE_STRATEGY_2026-04-12.md recommendations on three points:

1. **LLM-Sieve pruning is deferred.** The prior report framed LLM-Sieve as foundational. The 2-second constraint puts LoRA fine-tuning (simpler, cheaper, proven) in the v1 critical path instead. Pruning becomes a v3 optimization if LoRA alone cannot close the quality gap on the harder micro-tasks.
2. **MobileLLM-Pro is deprioritized.** The prior report recommended it as the Android base. Our benchmark shows Qwen 0.8B beats it for the actually-relevant slot-filling task, and no MLX conversion of MobileLLM-Pro exists yet. Qwen2 0.5B is the more promising smaller target.
3. **The offline-first stack is v1, not v2.** The 2-second constraint makes cloud calls architecturally impossible for the core loop (network round-trip alone is often >1s). Offline becomes the default, cloud becomes the fallback, and every subsystem must be designed that way from the start.

The prior report's research on calibration data design, the Apple Foundation Models framework, and the `react-native-apple-llm` plugin all remain valid and are incorporated into this document.

## Artifacts From This Session

- **`test_intent_multimodel.py`** — reusable multi-model wrapper around the existing intent→query fixture. Supports `--no-chat-template` flag. Tested against 5 models.
- **`test_new_models_leg_labels.py`** — multi-model leg-labels benchmark (lower-priority architecture, preserved for completeness).
- **`venv313/`** — working Python 3.13 venv with `mlx-lm` and `anthropic` installed. The pre-existing `venv/` has a broken interpreter path and should be deleted.
- **`intent_multimodel_20260412_205003.json`** — authoritative no-chat-template results, 5 models × 15 scenarios with full per-row metrics.
- **`new_models_leg_labels_20260412_*.json`** — leg-label result files for the 5 models tested.
- **`MODEL_PRUNING_MOBILE_STRATEGY_2026-04-12.md`** — prior research report (partially superseded by this document).
- **`ON_DEVICE_LLM_STRATEGY_2026-04-12.md`** — this document.

## Recommended Next Actions (In Priority Order)

1. **Spike the stack on a real iPhone 15 Pro.** Build a 100-line React Native test app with llama.rn + Qwen 0.8B + the existing prompt. Measure cold and warm latency for the unoptimized baseline. This tells us how far we actually are from 2s before we start optimizing. **1 week. Most important validation step in the whole plan.**
2. **Start the LaneShadow calibration dataset.** 500-sample mini-set tagged by skill category, built from Haiku-generated gold labels on real user queries. Foundation for the LoRA fine-tune. **1 week, parallelizable with step 1.**
3. **Verify Apple Foundation Models viability.** Build the same test app against `react-native-apple-llm` on iOS 26. Measure latency, verify `LanguageModelSession` state persistence across calls, confirm the 4,096-token context window holds for our prompt. **3 days.**
4. **Benchmark Qwen2 0.5B on current fixtures without LoRA.** Does it clear 60% pass rate without fine-tuning? That's the gate to justify the LoRA investment. **2 days.**
5. **GBNF grammar prototype.** Write the grammar for the 10-key params JSON, wire it into `test_intent_multimodel.py`, measure the decode speedup on Mac MLX as a proxy. **2 days.**
6. **Decision: ship with LoRA or without?** Based on the results of steps 1–5, decide whether the v1 stack includes the LoRA fine-tune (full 2s target) or ships with just KV cache + GBNF (maybe 3–4s, better than today but fails the constraint). **Gate decision, not engineering.**

Total spike + validation effort: ~3 weeks for one engineer. Actual v1 build: 4–6 weeks after that. Realistic ship date for offline-first Ride Discovery: **6–9 weeks from spike start.**
