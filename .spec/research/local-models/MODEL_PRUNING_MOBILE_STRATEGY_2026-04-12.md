---
title: "Task-Specific Model Pruning for LaneShadow Mobile LLMs"
date: "2026-04-12"
time: "14:30"
category: "research"
tags: [model-pruning, mobile-llm, reap, llm-sieve, task-specific, expo, react-native]
status: "complete"
research_type: "deep_research"
iterations: 3
sources_consulted: 48
confidence: "HIGH"
method: "deep-research"
context_input:
  - url: https://github.com/CerebrasResearch/reap
  - existing: .spec/research/local-models/mobile_llm_strategies_2025.md
  - existing: .spec/research/local-models/mobile_models_2026_route_optimization.md
---

# Task-Specific Model Pruning for LaneShadow Mobile LLMs

## Executive Summary

**The short answer to "use REAP to prune a smarter model down for only the skills we need on mobile":** REAP itself is not the right tool — it compresses Mixture-of-Experts (MoE) models that are still far too large for a phone, even after 50% pruning. **The right tool for LaneShadow is LLM-Sieve** (Microsoft, May 2025), which applies REAP's core philosophy — task-specific calibration plus impact-weighted saliency — directly to dense mobile-scale models. LLM-Sieve achieves **25–75% parameter reduction with only 1–5% accuracy loss** on narrow tasks, exactly matching LaneShadow's use case of a ride-discovery assistant rather than a generalist chatbot.

For production, LaneShadow should run a **two-track mobile strategy**:
1. **iOS (via Apple Foundation Models framework, iOS 26+):** Use the existing 3B / 2-bit on-device model through the `react-native-apple-llm` plugin. Apple already pruned and quantized it; customize it via LoRA adapters. Near-zero ongoing cost.
2. **Android (and older iOS):** Start from **MobileLLM-Pro 1B** or **Qwen3.5 0.8B**, apply **LLM-Sieve task-specific pruning** with a LaneShadow calibration mix (ride queries, route reasoning, community UGC), add **QLoRA fine-tune** on the same data, then export to **ExecuTorch (.pte) or GGUF** and ship via `react-native-executorch` or `llama.rn`. Expected final footprint: **~400–700 MB, 8–15 tok/sec on mid-range Android**.

REAP remains valuable as a **teacher-model compressor** in an optional Track C: run REAP on a large MoE (e.g., Qwen3-Coder-REAP-246B-A35B) with a LaneShadow calibration mix, then distill the pruned MoE into the small dense student — higher quality per MB at the cost of ML infrastructure.

The single most important lesson from all five primary papers read (LLM-Sieve, REAP, Frustratingly Easy Task-aware Pruning, Preserving LLM Capabilities, Apple Foundation Models): **calibration data is the lever.** Pruning with generic C4/Wikipedia calibration preserves "fluent sentence generation" and discards exactly the instruction-following, reasoning, and domain knowledge LaneShadow needs. Calibration data built from real ride queries, route descriptions, and community content is what steers pruning to preserve the right skills.

---

## Key Findings

### 1. REAP is for MoE compression, not mobile — but its philosophy transfers

**Finding:** Cerebras REAP ("Router-weighted Expert Activation Pruning", ICLR 2026) is a one-shot method that removes up to **50% of experts** from Sparsely-activated MoE models while retaining **97.6% of baseline non-agentic coding** and **96.7% on agentic SWE-Bench** on Qwen3-Coder-480B. It is state-of-the-art for MoE compression. (Confidence: HIGH, 6 sources including Cerebras blog, arXiv paper, HuggingFace model cards, ICLR announcement)

**Why it does not directly solve LaneShadow's mobile problem:**

| Model | Pre-REAP | Post-REAP (50%) | Still fits on phone? |
|---|---|---|---|
| Qwen3-30B-A3B | 30B total / 3B active | ~15B total | ❌ ~8–10 GB @ int4 |
| GLM-4.5-Air | 106B total | ~53B total | ❌ ~27 GB @ int4 |
| MiniMax-M2 | 230B total | 162B (A10B) | ❌ ~80 GB @ int4 |
| Qwen3-Coder-480B | 480B total | 246B (A35B) | ❌ ~120 GB @ int4 |
| Kimi-K2 | 1T total | ~500B | ❌ ~250 GB @ int4 |

Even the smallest REAP checkpoint requires a workstation, not a phone. Mobile phones target models **under 2 GB RAM** for acceptable UX, which means **1–3 B dense parameters at 4-bit quantization**.

**What transfers from REAP:**
- **Saliency criterion**: REAP scores each expert by `gate_value × output_magnitude`, averaged over inputs where the router actually activated that expert. The same "weighted impact" intuition applies to dense-model neurons and attention heads.
- **Merging hurts, pruning preserves**: REAP proves that merging causes "functional subspace collapse" because the router loses its ability to dynamically mix experts. Translating this to dense models: **do not merge attention heads or FFN neurons** when compressing — prune entire units.
- **Calibration mix recipe matters more than the algorithm**: Cerebras published their calibration data mix specifically for agentic reasoning (evol-codealpaca, Mixture-of-Thoughts, xlam-function-calling, SWE-smith-trajectories). The algorithm is open source; the secret sauce is **what data you show it while pruning**. LaneShadow's equivalent is a mix of ride queries, route descriptions, waypoint reasoning, and community text.

**Sources:**
- [REAP GitHub — CerebrasResearch/reap](https://github.com/CerebrasResearch/reap)
- [Cerebras Blog: REAP: One-Shot Pruning for Trillion-Parameter Mixture-of-Experts](https://www.cerebras.ai/blog/reap)
- [REAP the Experts arXiv 2510.13999](https://arxiv.org/abs/2510.13999) (ICLR 2026 accepted)
- [cerebras/GLM-4.7-REAP-268B-A32B HuggingFace](https://huggingface.co/cerebras/GLM-4.7-REAP-268B-A32B)
- [Reddit r/LocalLLaMA REAP experiences](https://www.reddit.com/r/LocalLLaMA/comments/1qn0dtg/reap_experiences)

### 2. LLM-Sieve is the REAP-equivalent for dense mobile models

**Finding:** LLM-Sieve (Microsoft, May 2025) is "the first comprehensive framework for task-specific pruning of LLMs" and achieves **20–75% weight removal with 1–5% accuracy loss** on narrow tasks across models from Phi-3-mini (3.8 B) to LLaMA-3.1-70B. This is exactly the tool LaneShadow needs. (Confidence: HIGH, 4 sources including full paper read)

**Two innovations that matter for us:**
1. **Output-aligned non-orthogonal projections** — unlike PCA/SVD which assume aligned orthogonal subspaces, LLM-Sieve learns a non-orthogonal projection tailored to each compression level by aligning directly with the layer's actual outputs. This captures task-specific structure more faithfully.
2. **Adaptive pruning via Genetic Algorithm** — instead of uniform 30%-across-the-board pruning, a GA automatically discovers which matrices can be pruned 70% and which are bottlenecks that can barely tolerate 10%. The GA optimizes **non-differentiable end-to-end metrics** (e.g., "did the assistant recommend a valid ride?"), which gradient-based methods cannot.

**The two-phase accuracy curve:** On Phi-3-mini, LLaMA-3.1-8B, and LLaMA-3.1-70B running a Generic-RAG multi-step QA task, accuracy **stays stable until 25–60% pruning**, then **collapses sharply**. This is the "bottleneck cliff." Finding where the cliff is for a LaneShadow calibration set is the first engineering deliverable.

**Compatibility stack:** LLM-Sieve is explicitly compatible with (i) LoRA fine-tuning and (ii) quantization. The paper claims **up to ~90% effective memory savings when combined with 8-bit quantization**, within a ≤5% accuracy gap. Combined with 4-bit int (standard for mobile), a 3B base model pruned 50% and quantized to int4 would be roughly **~400–500 MB on disk**, which is well within Android mid-range budgets.

**Limitation:** LLM-Sieve's GA optimization is compute-intensive. Pruning a 3B model on a laptop/workstation is feasible; doing it iteratively on dozens of calibration variants is not. Plan for **one offline pruning job per major calibration update**, not continuous.

**Sources:**
- [Task Specific Pruning with LLM-Sieve arXiv 2505.18350](https://arxiv.org/abs/2505.18350)
- [LLM-Sieve HTML full paper](https://arxiv.org/html/2505.18350v1)
- [ResearchGate 392105328 LLM-Sieve](https://www.researchgate.net/publication/392105328_Task_Specific_Pruning_with_LLM-Sieve)

### 3. Calibration data is the lever, not the algorithm

**Finding:** Across four independent 2024–2025 papers, the single biggest determinant of pruned-model quality is **what calibration data you use**, not which algorithm (SparseGPT vs Wanda vs LLM-Sieve). (Confidence: HIGH, 4 sources)

- **"Is C4 Dataset Optimal for Pruning?"** (arXiv 2410.07461): "Calibration data significantly affects downstream performance. Using the wrong calibration dataset can cost more than choosing the wrong pruning algorithm."
- **"Beware of Calibration Data for Pruning Large Language Models"** (arXiv 2410.17711): Systematic study showing calibration data choice dominates pruning outcomes.
- **"Frustratingly Easy Task-aware Pruning"** (arXiv 2510.22489): Uses **two** calibration datasets — one general, one task-specific — and partitions parameters into "shared" and "exclusive" groups based on activation-norm differences between the two datasets. Integrates cleanly with SparseGPT and Wanda. Key quote: *"Existing pruning approaches primarily focus on preserving the LLM's ability to generate fluent sentences, while neglecting performance on specific domains and tasks... generic calibration data fails to highlight the weights critical for conditional behaviors."*
- **"Preserving LLM Capabilities through Calibration Data Curation"** (NeurIPS 2025, arXiv 2510.10618): Finds that **representativeness and diversity in activation space** fundamentally determine calibration quality. Proposes curation framework.

**Implication for LaneShadow:** Before any pruning happens, LaneShadow must assemble a calibration dataset that activates the exact behaviors the assistant needs to retain. Rough inventory:

| Skill | Example calibration input | Source |
|---|---|---|
| Ride intent extraction | "I want a twisty 2-hour ride near Tahoe, no freeways" | Synthetic + real user queries |
| Route rationale generation | Route waypoints → scenic rationale | Existing Haiku outputs |
| Leg labeling (already validated) | Leg context → short label | Existing `test_leg_labels_only.py` |
| Waypoint sanity-checking | Proposed waypoint → local-knowledge reasoning | Synthetic + map context |
| Community language | Ride descriptions, comments, route posts | LaneShadow UGC |
| Safety-adjacent refusals | "Take me on a high-speed illegal route" | Small handcrafted set |
| Tool-call formatting | Geocoder / routing-engine tool calls | Existing function-calling schemas |

**Sample size:** 2K–8K samples is typical for calibration-data-driven pruning methods; REAP uses 24K total across 6 sources at 16K token length. For LaneShadow, **4K–8K total** at ~1–2K tokens each is a reasonable first cut.

**Sources:**
- [Is C4 Dataset Optimal for Pruning? arXiv 2410.07461](https://arxiv.org/pdf/2410.07461)
- [Beware of Calibration Data for Pruning LLMs arXiv 2410.17711](https://arxiv.org/pdf/2410.17711)
- [Frustratingly Easy Task-aware Pruning arXiv 2510.22489](https://arxiv.org/pdf/2510.22489)
- [Preserving LLM Capabilities through Calibration Data Curation arXiv 2510.10618](https://arxiv.org/pdf/2510.10618) (NeurIPS 2025)
- [EMNLP 2024 llm-pruning-calibration-data GitHub](https://github.com/abx393/llm-pruning-calibration-data)

### 4. Small-dense pruning ecosystem: Sheared-LLaMA, ATP, FineScope, EfficientXpert

**Finding:** Beyond LLM-Sieve, five more recent methods target exactly the "dense model → task-specialized mobile size" problem. Each has specific strengths. (Confidence: HIGH, 5 sources)

| Method | Year | Core idea | Best for LaneShadow when |
|---|---|---|---|
| **Sheared-LLaMA** (ICLR 2024, princeton-nlp) | 2023 | Structured pruning + continued pretraining; produced Sheared-LLaMA-1.3B and 2.7B from LLaMA-2-7B | We want a proven, published checkpoint as a starting fork |
| **LLM-Sieve** (Microsoft) | May 2025 | Task-specific GA pruning with output-aligned projections | **Primary recommendation** — best 20–75% pruning with 1–5% loss on narrow tasks |
| **ATP (All-in-One Tuning and Structural Pruning)** (arXiv 2412.14426) | Dec 2024 | **One-stage** approach integrating LoRA fine-tuning with structural pruning | We want to prune and domain-adapt in a single training run |
| **FineScope (SAE-guided Data Selection)** (arXiv 2505.00624) | Feb 2026 | Uses Sparse Autoencoders to identify domain-relevant data, then structured pruning + self-distillation | We need a methodical way to *select* calibration data from a larger pool |
| **EfficientXpert** (arXiv 2511.19935) | Nov 2025 | One-step conversion of general pretrained models to sparse domain-adapted models, LoRA-cost fine-tuning | We want the lowest-effort domain adaptation with built-in sparsity |
| **D-Pruner / Pruning as a Domain-specific LLM Extractor** (arXiv 2405.06275) | May 2024 | Pruning as extraction of a domain-specialized sub-model | We want a lineage paper to cite for "pruning = extraction" |

**Instruction-Following Pruning** (arXiv 2501.02086) is a different branch worth noting: it trains a **sparse mask predictor** that takes the user instruction as input and emits a dynamic, context-aware pruning mask. This is promising for LaneShadow if we want a single on-device model that dynamically activates the right sub-network per user query type, but the implementation is substantially more complex than static pruning. **Skip for v1, revisit for v2**.

**Sources:**
- [Sheared LLaMA arXiv 2310.06694](https://arxiv.org/abs/2310.06694)
- [princeton-nlp/LLM-Shearing GitHub](https://github.com/princeton-nlp/LLM-Shearing)
- [ATP arXiv 2412.14426](https://arxiv.org/pdf/2412.14426)
- [FineScope arXiv 2505.00624](https://arxiv.org/pdf/2505.00624)
- [EfficientXpert arXiv 2511.19935](https://arxiv.org/pdf/2511.19935)
- [D-Pruner arXiv 2405.06275](https://arxiv.org/pdf/2405.06275)
- [Instruction-Following Pruning arXiv 2501.02086](https://arxiv.org/pdf/2501.02086)

### 5. MobileLLM-Pro 1B — Meta's purpose-built on-device base model

**Finding:** Meta released **MobileLLM-Pro** (Nov 2025) as a 1B parameter model specifically designed for on-device inference. It outperforms both **Gemma 3-1B and Llama 3.2-1B by 5.7–7.9%** on 11 standard benchmarks, supports 128K context, and has **near-lossless int4 quantization** (<1.3% degradation). It is explicitly optimized for **Apple Neural Engine** and **Qualcomm Hexagon Tensor Processor**. (Confidence: HIGH, 5 sources)

This is a more attractive Android starting point than the Llama 3.2 / Phi-3 / Gemma 3 base models that the existing `mobile_llm_strategies_2025.md` and `mobile_models_2026_route_optimization.md` research recommended. It is drop-in compatible with the existing Qwen3.5 0.8B pipeline decisions and is designed from scratch for the NPU backends mobile phones actually ship.

**Alternative bases to benchmark against:**
- **Qwen3.5 0.8B** — already validated in `mobile_models_2026_route_optimization.md` as fast (403 tok/s) with native JSON mode. Good existing baseline.
- **Gemma 3 2B** — strong structured output, ~3–4 GB RAM.
- **Phi-4-mini (~3.8B)** — best reasoning of the mobile tier, higher memory.

**Benchmark task:** re-run the existing `benchmark_llm_models.py` with MobileLLM-Pro 1B added and compare against Qwen3.5 0.8B on the same four micro-tasks (leg labels, route labels, rationales, scenic highlights). This is a low-effort experiment that tells us whether pruning MobileLLM-Pro beats using Qwen3.5 0.8B off the shelf.

**Sources:**
- [MobileLLM-Pro Technical Report arXiv 2511.06719](https://arxiv.org/html/2511.06719v1)
- [facebook/MobileLLM-Pro HuggingFace](https://huggingface.co/facebook/MobileLLM-Pro)
- [MobileLLM-Pro Meta Blog - HowAIWorks](https://howaiworks.ai/blog/mobilellm-pro-announcement)
- [On-Device LLMs State of the Union 2026 - Vikas Chandra](https://v-chandra.github.io/on-device-llms)
- [Phi-4 vs Gemma 3 vs Llama 3.3 Enterprise Edge AI 2026](https://www.meta-intelligence.tech/en/insight-slm-enterprise)

### 6. iOS has a free 3B on-device LLM — Apple Foundation Models framework

**Finding:** Apple Intelligence (iOS 18.4+ / iOS 26) ships a **~3B parameter foundation language model quantized to 2 bits** and exposes it through the **Foundation Models framework** Swift API. Apple already applied pruning (feed-forward hidden-dimension pruning with Soft-Top-K masking per the Apple tech report) and 2-bit quantization. Developers customize it via **LoRA adapters**. A React Native plugin exists: **`react-native-apple-llm`** and `@ratley/react-native-apple-foundation-models`. Vercel AI SDK has a community provider. (Confidence: HIGH, 8 sources)

**Why this is the biggest single finding for LaneShadow:**
- **Zero inference cost** — Apple pays the compute
- **Zero model-download burden** — model is already on the device
- **Apple already did the hard pruning** — no ML infra for iOS
- **LoRA adapters** are the supported customization path — matches the calibration-driven fine-tune story we'd use for our own pruned Android model
- **Battery/thermal management is Apple's responsibility** — they can rotate between CPU/NE/GPU and downclock based on thermal state, something a third-party model shipped via llama.cpp cannot do
- **Privacy** — zero user data leaves the device

**Caveats:**
- iOS 26+ only — older iPhones (iPhone 14 and earlier, non-AI-capable devices) fall through to the Android/Track-B path
- The model is general-purpose; Apple is not going to retrain it on motorcycle ride data
- LoRA adapter size is constrained; the API surface is curated

**Impact on the two-track strategy:** The iOS Apple-Foundation-Models track replaces **most of the "prune + quantize" work for most users**, because the majority of LaneShadow's active device base is likely modern iOS. The LLM-Sieve pruning work only needs to produce an **Android-and-older-iOS fallback**, not a universal model.

**Sources:**
- [Apple Intelligence Foundation Language Models Tech Report 2025](https://machinelearning.apple.com/research/apple-foundation-models-tech-report-2025)
- [Apple Foundation Models Tech Report arXiv 2407.21075](https://arxiv.org/pdf/2407.21075)
- [Updates to Apple's On-Device and Server Foundation Language Models (2025)](https://machinelearning.apple.com/research/apple-foundation-models-2025-updates)
- [Apple Foundation Models framework documentation](https://developer.apple.com/documentation/FoundationModels)
- [deveix/react-native-apple-llm GitHub](https://github.com/deveix/react-native-apple-llm)
- [@ratley/react-native-apple-foundation-models NPM](https://www.npmjs.com/package/@ratley/react-native-apple-foundation-models)
- [On-Device Apple LLM Support Comes to React Native — Callstack](https://www.callstack.com/blog/on-device-apple-llm-support-comes-to-react-native)
- [AI SDK Community Provider: React Native Apple](https://ai-sdk.dev/providers/community-providers/react-native-apple)

### 7. React Native / Expo inference runtimes — ExecuTorch and llama.rn

**Finding:** Two production-ready React Native LLM runtimes exist, each with different sweet spots. LaneShadow should pick one primary and use the other as fallback. (Confidence: HIGH, 6 sources)

**react-native-executorch (Software Mansion):**
- Uses ExecuTorch — Meta's PyTorch-native on-device inference runtime, the same stack powering Meta's own mobile AI features
- `.pte` binary format
- Supports Llama 3.2 quantized, with hardware-accelerated backends (XNNPACK, Apple Neural Engine via Core ML delegate, Qualcomm HTP)
- Pre-built QLoRA INT4 Llama 3.2 1B available on HuggingFace: `executorch-community/Llama-3.2-1B-Instruct-QLORA_INT4_EO8-ET`
- Graph-level optimizations: operator fusion, memory layout compression, quantization
- Expo compatible via config plugin

**llama.rn (mybigday):**
- React Native binding of llama.cpp
- GGUF format (the standard for quantized models on llama.cpp)
- Supports multimodal (vision, audio)
- Most mature ecosystem — any GGUF model available on HuggingFace works
- Simpler install, widely deployed, battle-tested

**Recommendation:** **Start with `llama.rn`** for v1 because GGUF's ecosystem is richer (any HuggingFace GGUF drops in), and the existing LaneShadow research (Qwen3.5 0.8B at GGUF Q4_K_M) already uses this format. **Add `react-native-executorch`** in v2 when we have our own LLM-Sieve-pruned checkpoint, because ExecuTorch's `.pte` format gives us better control over on-device LoRA adapter injection and hardware backend delegation (Apple Neural Engine, Qualcomm HTP).

**Sources:**
- [react-native-executorch docs - Software Mansion](https://docs.swmansion.com/react-native-executorch/docs/0.1.x/guides/running-llms)
- [mybigday/llama.rn GitHub](https://github.com/mybigday/llama.rn)
- [I Ran Llama 3.2 On Android in React Native - Medium](https://medium.com/@vinesheg/i-ran-llama-3-2-on-an-android-phone-inside-a-react-native-app-heres-what-i-learned-336036f7b2e8)
- [ExecuTorch Llama README - PyTorch](https://github.com/pytorch/executorch/blob/main/examples/models/llama/README.md)
- [LLM Inference for Llama 3.2 Quantized Models with ExecuTorch and KleidiAI - Arm](https://developer.arm.com/community/arm-community-blogs/b/ai-blog/posts/llm-inference-llama-quantized-models-executorch-kleidiai)
- [Building On-Device Predictive Autocomplete in React Native - Swiggy (uses llama.rn)](https://bytes.swiggy.com/building-on-device-predictive-autocomplete-in-react-native-23c35210dc9d)

### 8. Mobile reality: thermal throttling is the binding constraint, not compute

**Finding:** iPhone 16 Pro **loses nearly half its LLM throughput** to thermal throttling during sustained on-device inference; Android mid-range NPU inference is bandwidth-bound long before it is compute-bound. Battery drain is significant but bounded; heat is the actual ship-blocker. (Confidence: HIGH, 3 sources)

Implications for LaneShadow:
- **Do not design flows that chain >3 consecutive on-device LLM calls without a cool-down window**
- **Batch UI-facing LLM work** (generate all 3 route enrichments in one forward pass if possible)
- **Prefer 1B over 3B base models** on Android — throughput advantage disappears under thermal load but memory/battery advantage stays
- **Test on a thermally-degraded device state**, not a fresh-cold device — ride-planning sessions are typically the end of a 30-minute map-scrolling interaction, not the first thing after unlock

**Sources:**
- [LLM Inference at the Edge: Mobile, NPU, GPU Performance arXiv 2603.23640](https://arxiv.org/pdf/2603.23640)
- [Running LLMs on Smartphones: The Reality Check — Prakash Sharma](https://trricho.medium.com/running-llms-on-smartphones-the-reality-check-58abb59d9d0e)
- [AI Beyond the Cloud: On-Device Generative AI — Nearform](https://nearform.com/digital-community/ai-beyond-the-cloud-the-current-and-future-state-of-on-device-generative-ai)

### 9. Knowledge distillation from a REAP-pruned teacher is viable but advanced

**Finding:** MoE-to-dense distillation works. LLaVA-MoD, Microsoft's MoE-to-dense speech distillation, and several 2025–2026 papers demonstrate that a small dense student can inherit most of a larger MoE teacher's behavior on a narrow task. This is an optional advanced track for LaneShadow. (Confidence: MEDIUM, 3 sources)

**Pipeline (optional Track C):**
1. Take Qwen3-Coder-REAP-246B-A35B (Cerebras-published, 50% REAP-pruned, FP8)
2. Further prune with the LaneShadow calibration mix to specialize it for ride-discovery reasoning
3. Run it as a teacher during a distillation pass into a small dense student (Llama 3.2 3B or Qwen 2.5 3B)
4. Apply LLM-Sieve to the student on the same calibration mix
5. Quantize to int4, export to GGUF, deploy via llama.rn

**When to take this path:**
- LaneShadow's core product is LLM-heavy enough that quality-per-MB is make-or-break
- We have ML infrastructure (A100 or H100 access) or can rent it
- We want to open-source the resulting student (possible PR benefit)

**When to skip this path:**
- v1 / v2: just use MobileLLM-Pro-Pruned or an Apple Foundation Models adapter
- ML infra cost not justified for the current user base

**Sources:**
- [LLaVA-MoD: Making LLaVA Tiny via MoE-Knowledge Distillation arXiv 2408.15881](https://arxiv.org/html/2408.15881v1)
- [Microsoft Speech MoE KD paper](https://www.microsoft.com/en-us/research/wp-content/uploads/2022/05/MainzSpeech_Interspeech2022_KD_MoE_Network.pdf)
- [The Era of Small Models — SLM, MoE, Distillation, Quantization - Jidonglab](https://jidonglab.com/blog/slm-moe-distillation-quantization-en)

---

## Confidence Assessment

| Finding | Confidence | Sources |
|---|---|---|
| REAP is for MoE compression, not mobile sizing | HIGH | 6 |
| LLM-Sieve achieves 25–75% reduction with 1–5% loss on narrow tasks | HIGH | 4 (incl. full paper read) |
| Calibration data dominates pruning outcome | HIGH | 5 |
| MobileLLM-Pro 1B beats Llama 3.2 1B and Gemma 3 1B by 5.7–7.9% | HIGH | 5 |
| Apple Foundation Models framework exposes a 3B / 2-bit on-device LLM to React Native | HIGH | 8 |
| react-native-executorch and llama.rn are production-ready for Expo | HIGH | 6 |
| Thermal throttling is the binding mobile constraint | HIGH | 3 |
| MoE-to-dense distillation is viable as an optional advanced track | MEDIUM | 3 |
| Pruning + LoRA + quantization compose cleanly in one pipeline | HIGH | 3 (LLM-Sieve, ATP, EfficientXpert) |

---

## Recommended Implementation Strategy

### Track A — iOS (majority of users, lowest cost)

**Goal:** Ship a ride-discovery assistant that runs on-device for free on modern iPhones, with calibration-driven specialization via LoRA adapters.

**Pipeline:**
1. Add `@ratley/react-native-apple-foundation-models` (or `react-native-apple-llm`) to the Expo app as a **peer dependency behind a feature flag**.
2. Feature-detect `iOS ≥ 26` at runtime; fall through to Track B on older iOS.
3. For v1, call the Apple Foundation Model through the Swift `LanguageModelSession` API with **structured output (JSON schema)** for our 4 micro-tasks (leg labels, route labels, scenic highlights, rationales).
4. For v2, train a **LoRA adapter** on the same LaneShadow calibration dataset used for Track B's LLM-Sieve pruning. Ship the adapter (small, < 50 MB) with the app, load at session start via the Foundation Models API.
5. Measure quality deltas against Haiku and the existing Qwen3.5 0.8B baseline on the four micro-tasks. Promote tasks to Apple Foundation Models as they hit ≥95% parity with Haiku.

**Engineering effort:** 1–2 weeks for v1 (plugin integration + prompt engineering), 4–6 weeks for v2 (LoRA adapter training pipeline + evaluation).

**Expected outcomes:**
- Inference latency: **sub-second** for short micro-tasks on iPhone 15 Pro and newer
- Cost: **$0 per route** on iOS
- Offline capability: **100%**
- Battery impact: managed by Apple (thermal-aware runtime)

### Track B — Android and older iOS (non-trivial minority)

**Goal:** Ship a ride-discovery assistant on Android phones and iPhones without iOS 26, using a task-pruned MobileLLM-Pro variant.

**Pipeline:**

**Phase B-1: Baseline (2–3 weeks)**
1. Add MobileLLM-Pro 1B to the existing `benchmark_llm_models.py` benchmark against Qwen3.5 0.8B on the four validated micro-tasks.
2. If MobileLLM-Pro wins on leg labels (the one confirmed-working task) or any of the three currently-failing tasks, switch the Android fallback to MobileLLM-Pro.
3. Ship via **llama.rn with GGUF Q4_K_M** (same pipeline the existing Qwen3.5 path uses — low integration cost).

**Phase B-2: Calibration mix assembly (2 weeks, parallelizable with B-1)**
1. Collect **4–8 K samples** for calibration, sourced from:
   - Synthetic ride queries (GPT-4 or Haiku generated)
   - Real user queries (from existing logs, redacted)
   - Haiku outputs for the four micro-tasks (treat as gold labels)
   - Community UGC (ride descriptions, route comments)
   - Handcrafted refusals and safety-adjacent cases (~100 samples)
2. Balance across the seven skill categories in the table in Finding #3.
3. Store in `.spec/research/local-models/calibration-mix/` under version control.

**Phase B-3: LLM-Sieve pruning run (1–2 weeks)**
1. Stand up LLM-Sieve from the Microsoft paper (code availability: **check with authors if not on GitHub** — may need to reimplement the GA adaptive pruning; output-aligned projection math is in the paper). If that blocks, fall back to **Frustratingly Easy Task-aware Pruning** (arXiv 2510.22489) which integrates with off-the-shelf SparseGPT/Wanda and achieves similar results with less engineering.
2. Run on MobileLLM-Pro 1B with the calibration mix.
3. Target **50% parameter reduction** as the first attempt. Fall back to 30% if quality drops >5% on the four micro-tasks.
4. Evaluate against Haiku using the existing accuracy metrics in `benchmark_llm_models.py`.

**Phase B-4: LoRA fine-tune on calibration data (1 week)**
1. QLoRA fine-tune the pruned MobileLLM-Pro on the same calibration data. This recovers the 1–5% of quality lost to pruning and specializes the surviving weights further.
2. Merge LoRA adapters into the base model.

**Phase B-5: Quantize and deploy (1 week)**
1. Quantize to **INT4 (Q4_K_M for GGUF via llama.rn, or spinquant INT4 for ExecuTorch)**.
2. Export to GGUF or `.pte`.
3. Push through the existing `react-native-executorch` or `llama.rn` integration.
4. A/B test vs the current Qwen3.5 0.8B fallback.

**Expected outcomes:**
- Final model size: **~400–700 MB**
- Inference speed: **8–15 tok/sec on mid-range Android**, slower on iPhone 14 and below
- Quality: **≥95% parity with Haiku on leg labels; 70–85% on the harder three micro-tasks** (informed estimate based on LLM-Sieve's published 1–5% loss at 50% pruning on narrow tasks)
- Cost: **$0 per route**
- Offline capability: **100%**
- Battery impact: **10–20% per session**, managed by React Native runtime

**Total Track B engineering effort: ~7–10 weeks** for one engineer. Half of that is calibration data assembly and evaluation, not pruning per se.

### Track C — Optional: Teacher-distilled student (quality-first)

**Goal:** If Tracks A and B are not enough, distill from a REAP-pruned large MoE teacher into a small dense student.

**When to trigger:** After Tracks A and B are shipped and measured, if quality-per-MB is the main bottleneck.

**Pipeline sketch:**
1. Pull `cerebras/Qwen3-Coder-REAP-246B-A35B-FP8` from HuggingFace as a starting teacher.
2. Re-run REAP on top with the LaneShadow calibration mix, further compressing and specializing.
3. Distill via standard KD (logit matching or on-policy distillation — see "Revealing the Power of Post-Training for Small Language Models" arXiv 2509.26497) into a 1–3 B dense student (Llama 3.2 3B or MobileLLM-Pro 1B).
4. Apply LLM-Sieve to the student on the same calibration mix.
5. Quantize, deploy.

**Estimated effort: 2–3 months** with one ML engineer and cloud GPU access (~$5K–15K in training compute).

**Skip if:** Tracks A and B already meet quality targets.

---

## Gaps & Open Questions

1. **Is LLM-Sieve's code public?** The paper does not link a GitHub repo in the sources I read. If the GA adaptive pruning is not released, we'll either need to reimplement it (moderate ML effort, ~1–2 weeks) or substitute with Frustratingly Easy Task-aware Pruning, which integrates with off-the-shelf SparseGPT/Wanda and achieves similar effect with less novel machinery.

2. **LaneShadow calibration data composition ratios.** The right mix across the seven skill categories in Finding #3 is an empirical question. Expect to iterate: first run uniform 1/7 each, measure per-skill accuracy deltas, rebalance. This is genuinely experimental work — no paper tells us the right ratios for ride discovery.

3. **iOS-26 adoption curve on LaneShadow's actual install base.** Track A is vastly cheaper than Track B, so the right investment split depends on the share of users on iOS 26+. Pull app-store analytics before scoping effort.

4. **Thermal budget per session.** We do not know yet how many sequential LLM calls a typical ride-planning session involves. If it's >3, we need either batching or server fallback even for on-device users. Run a mobile instrumentation experiment before finalizing Track B v2.

5. **MobileLLM-Pro vs Qwen3.5 0.8B actual head-to-head on LaneShadow's four micro-tasks.** The published benchmarks show MobileLLM-Pro beating Llama 3.2 1B and Gemma 3 1B by 5.7–7.9%, but Qwen3.5 0.8B was not in Meta's comparison. The existing `benchmark_llm_models.py` is the right tool to answer this — it's a few hours of work to add one more model.

6. **LLM-Sieve on 1B models specifically.** The paper reports on 3.8B, 8B, and 70B models, which leaves a gap at the actual size LaneShadow wants. Phi-3-mini (3.8B) results extrapolate reasonably to MobileLLM-Pro (1B), but the "bottleneck cliff" position may shift — smaller models have less slack to prune. Budget for the first pruning attempt being a learning experiment.

7. **Dynamic / instruction-aware pruning.** Instruction-Following Pruning (arXiv 2501.02086) and SWE-Pruner (arXiv 2601.16746) point at a future where a single model dynamically activates different sub-networks per query. This is probably 2027-era production technology for mobile — interesting to revisit in 12 months.

---

## Sources

[1] REAP GitHub - CerebrasResearch - https://github.com/CerebrasResearch/reap
[2] Cerebras Blog: REAP: One-Shot Pruning for Trillion-Parameter Mixture-of-Experts - https://www.cerebras.ai/blog/reap
[3] REAP the Experts: Why Pruning Prevails for One-Shot MoE Compression - arXiv 2510.13999 - https://arxiv.org/abs/2510.13999
[4] cerebras/GLM-4.7-REAP-268B-A32B - HuggingFace - https://huggingface.co/cerebras/GLM-4.7-REAP-268B-A32B
[5] Cerebras MiniMax-M2-REAP-162B-A10B Release - https://www.facebook.com/groups/DeepNetGroup/posts/2654412941618238
[6] OpenReview: Why Pruning Prevails for One-Shot MoE Compression - https://openreview.net/forum?id=ukGxWd2aDG
[7] Calgary ML Lab REAP ICLR 2026 Announcement - https://www.calgaryml.com/news/announcement_29_reap_ICLR
[8] Reddit r/LocalLLaMA REAP Experiences - https://www.reddit.com/r/LocalLLaMA/comments/1qn0dtg/reap_experiences
[9] Task Specific Pruning with LLM-Sieve - arXiv 2505.18350 - https://arxiv.org/abs/2505.18350
[10] LLM-Sieve Full Paper HTML - https://arxiv.org/html/2505.18350v1
[11] LLM-Sieve ResearchGate - https://www.researchgate.net/publication/392105328_Task_Specific_Pruning_with_LLM-Sieve
[12] LLM-Pruner arXiv NeurIPS 2023 - https://neurips.cc/virtual/2023/poster/72074
[13] Lightweight and Post-Training Structured Pruning for On-Device - IEEE Computer 2026 - https://www.computer.org/csdl/journal/tm/2026/04/11230638/2bqyKE2Euli
[14] Awesome-LLMs-Pruning GitHub - https://github.com/liyunqianggyn/Awesome-LLMs-Pruning
[15] On-Device LLMs: State of the Union 2026 - Vikas Chandra - https://v-chandra.github.io/on-device-llms
[16] Sheared LLaMA - arXiv 2310.06694 - https://arxiv.org/abs/2310.06694
[17] Sheared LLaMA 1.3B HuggingFace - https://huggingface.co/princeton-nlp/Sheared-LLaMA-1.3B
[18] princeton-nlp/LLM-Shearing GitHub - https://github.com/princeton-nlp/LLM-Shearing
[19] M-Wanda: Improving One-Shot Pruning for Multilingual LLMs - arXiv 2505.21171 - https://arxiv.org/html/2505.21171v1
[20] abx393/llm-pruning-calibration-data GitHub (EMNLP 2024) - https://github.com/abx393/llm-pruning-calibration-data
[21] Wanda paper OpenReview - https://openreview.net/forum?id=PxoFut3dWW
[22] locuslab/wanda GitHub - https://github.com/locuslab/wanda
[23] Wanda++ Regional Optimization ACL 2025 - https://aclanthology.org/2025.findings-acl.224.pdf
[24] Is C4 Dataset Optimal for Pruning? An Investigation of Calibration Data - arXiv 2410.07461 - https://arxiv.org/pdf/2410.07461
[25] Beware of Calibration Data for Pruning LLMs - arXiv 2410.17711 - https://arxiv.org/pdf/2410.17711
[26] Think Before You Prune - arXiv 2511.18864 - https://arxiv.org/pdf/2511.18864
[27] Frustratingly Easy Task-aware Pruning - arXiv 2510.22489 - https://arxiv.org/pdf/2510.22489
[28] Preserving LLM Capabilities through Calibration Data Curation - NeurIPS 2025 - arXiv 2510.10618 - https://arxiv.org/pdf/2510.10618
[29] NIRVANA Structured Pruning - arXiv 2509.14230 - https://arxiv.org/pdf/2509.14230
[30] All-in-One Tuning and Structural Pruning for Domain-Specific LLMs (ATP) - arXiv 2412.14426 - https://arxiv.org/pdf/2412.14426
[31] SAE-guided Data Selection (FineScope) - arXiv 2505.00624 - https://arxiv.org/pdf/2505.00624
[32] Pruning as a Domain-specific LLM Extractor (D-Pruner) - arXiv 2405.06275 - https://arxiv.org/pdf/2405.06275
[33] EfficientXpert - arXiv 2511.19935 - https://arxiv.org/pdf/2511.19935
[34] Instruction-Following Pruning - arXiv 2501.02086 - https://arxiv.org/pdf/2501.02086
[35] SWE-Pruner Self-Adaptive Context Pruning - arXiv 2601.16746 - https://arxiv.org/pdf/2601.16746
[36] LLaVA-MoD: Making LLaVA Tiny via MoE-Knowledge Distillation - arXiv 2408.15881 - https://arxiv.org/html/2408.15881v1
[37] The Era of Small Models — SLM, MoE, Distillation, Quantization - https://jidonglab.com/blog/slm-moe-distillation-quantization-en
[38] Revealing the Power of Post-Training for Small Language Models - arXiv 2509.26497 - https://arxiv.org/pdf/2509.26497
[39] MobileLLM-Pro Technical Report - arXiv 2511.06719 - https://arxiv.org/html/2511.06719v1
[40] facebook/MobileLLM-Pro HuggingFace - https://huggingface.co/facebook/MobileLLM-Pro
[41] MobileLLM-Pro Announcement - HowAIWorks - https://howaiworks.ai/blog/mobilellm-pro-announcement
[42] Apple Intelligence Foundation Language Models Tech Report 2025 - https://machinelearning.apple.com/research/apple-foundation-models-tech-report-2025
[43] Apple Foundation Models arXiv 2407.21075 - https://arxiv.org/pdf/2407.21075
[44] Updates to Apple's On-Device and Server Foundation Language Models (2025) - https://machinelearning.apple.com/research/apple-foundation-models-2025-updates
[45] Apple Foundation Models framework documentation - https://developer.apple.com/documentation/FoundationModels
[46] deveix/react-native-apple-llm GitHub - https://github.com/deveix/react-native-apple-llm
[47] @ratley/react-native-apple-foundation-models NPM - https://www.npmjs.com/package/@ratley/react-native-apple-foundation-models
[48] On-Device Apple LLM Support Comes to React Native — Callstack - https://www.callstack.com/blog/on-device-apple-llm-support-comes-to-react-native
[49] AI SDK Community Provider: React Native Apple - https://ai-sdk.dev/providers/community-providers/react-native-apple
[50] react-native-executorch docs - Software Mansion - https://docs.swmansion.com/react-native-executorch/docs/0.1.x/guides/running-llms
[51] mybigday/llama.rn GitHub - https://github.com/mybigday/llama.rn
[52] ExecuTorch Llama README - PyTorch - https://github.com/pytorch/executorch/blob/main/examples/models/llama/README.md
[53] LLM Inference for Llama 3.2 Quantized Models with ExecuTorch and KleidiAI - Arm - https://developer.arm.com/community/arm-community-blogs/b/ai-blog/posts/llm-inference-llama-quantized-models-executorch-kleidiai
[54] I Ran Llama 3.2 On Android in React Native - Medium - https://medium.com/@vinesheg/i-ran-llama-3-2-on-an-android-phone-inside-a-react-native-app-heres-what-i-learned-336036f7b2e8
[55] Building On-Device Predictive Autocomplete in React Native - Swiggy - https://bytes.swiggy.com/building-on-device-predictive-autocomplete-in-react-native-23c35210dc9d
[56] executorch-community/Llama-3.2-1B-Instruct-QLORA_INT4_EO8-ET HuggingFace - https://huggingface.co/executorch-community/Llama-3.2-1B-Instruct-QLORA_INT4_EO8-ET
[57] Enabling Resource-Efficient On-Device Fine-Tuning of LLMs Using P-RGE - arXiv 2409.15520 - https://arxiv.org/pdf/2409.15520
[58] Apple's Foundation Models Framework: Run AI On-Device - dev.to - https://dev.to/arshtechpro/apples-foundation-models-framework-run-ai-on-device-with-just-a-few-lines-of-swift-lbp
[59] LLM Inference at the Edge: Mobile, NPU, GPU Performance - arXiv 2603.23640 - https://arxiv.org/pdf/2603.23640
[60] Running LLMs on Smartphones: The Reality Check - Prakash Sharma - https://trricho.medium.com/running-llms-on-smartphones-the-reality-check-58abb59d9d0e
[61] AI Beyond the Cloud: On-Device Generative AI - Nearform - https://nearform.com/digital-community/ai-beyond-the-cloud-the-current-and-future-state-of-on-device-generative-ai
[62] Phi-4 vs Gemma 3 vs Llama 3.3 Enterprise Edge AI 2026 - Meta Intelligence - https://www.meta-intelligence.tech/en/insight-slm-enterprise
[63] Small Language Models 2026: Phi-4, Gemma 3, Qwen 3 Guide - localaimaster - https://localaimaster.com/blog/small-language-models-guide-2026
[64] Apple Quietly Built a New AI Stack and It Runs on Your Device - HackerNoon - https://hackernoon.com/lang/lo/apple-quietly-built-a-new-ai-stack-and-it-runs-on-your-device
[65] iOS On‑Device LLMs: Foundation Models + ML Frameworks - levelup.gitconnected - https://levelup.gitconnected.com/ios-on-device-llms-foundation-models-ml-frameworks-you-can-actually-ship-with-code-4cddf3f0b352
[66] Meet the Foundation Models framework - WWDC25 - https://developer.apple.com/videos/play/wwdc2025/286
[67] stevelaskaridis/awesome-mobile-llm GitHub - https://github.com/stevelaskaridis/awesome-mobile-llm

---

## Appendix A: Side-by-side — REAP vs LLM-Sieve

| Dimension | REAP (Cerebras) | LLM-Sieve (Microsoft) |
|---|---|---|
| **Model family** | Sparsely-activated MoE only | Dense LLMs (all families) |
| **Compression unit** | Whole experts (FFN blocks) | Individual weights / matrix columns |
| **Saliency signal** | Router gate-value × expert output norm | Output-aligned non-orthogonal projection |
| **Decision rule** | Fixed per-layer ratio (e.g., 50%) | Genetic Algorithm per-matrix adaptive |
| **One-shot vs. retraining** | One-shot | One-shot + optional LoRA recovery |
| **Published max reduction** | 50% at near-lossless | 75% at ≤5% loss on narrow tasks |
| **Model sizes tested** | 20 B – 1 T | 3.8 B – 70 B |
| **Calibration size** | 24 K samples × 16 K tokens | Standard (~2–8 K samples) |
| **Direct mobile applicability** | ❌ (smallest output ~15 B) | ✅ (3.8 B–70 B, down-scalable) |
| **Code availability** | ✅ GitHub + HF checkpoints | ⚠️ Paper only — check for repo |
| **Composability with LoRA** | Not discussed | ✅ Explicit |
| **Composability with quantization** | ✅ Demonstrated on FP8 | ✅ Demonstrated on int8 |

**Bottom line:** REAP is the right tool for making a trillion-parameter MoE fit on a GPU cluster. LLM-Sieve is the right tool for making a 1–3 B dense model fit on a phone. Both share the same underlying insight: **score parts of the model by their impact on the tasks you actually care about, and remove the lowest-impact parts**.

## Appendix B: Prior LaneShadow research that this report builds on

- [`mobile_llm_strategies_2025.md`](mobile_llm_strategies_2025.md) — 2025 landscape: Llama 3.2, Phi-3 Mini, structured output with grammar-constrained sampling
- [`mobile_models_2026_route_optimization.md`](mobile_models_2026_route_optimization.md) — 2026 update: Qwen3.5 0.8B as the current Android baseline at 403 tok/s with native JSON mode
- [`qwen_mobile_compatibility.md`](qwen_mobile_compatibility.md) — Hardware-compatibility analysis for Qwen3.5 0.8B on iPhone 15 Pro and Android flagship
- [`microtask_swarm_analysis.md`](microtask_swarm_analysis.md) — Validated that **only leg labels** among the four `enrichRoute` micro-tasks work with Qwen3.5 0.8B; the other three (route labels, rationales, scenic highlights) need Haiku-quality reasoning
- [`ENVIRONMENT_BIAS_FINDING_2026-04-10.md`](ENVIRONMENT_BIAS_FINDING_2026-04-10.md) — All prior latency numbers were measured on MacBook Pro MLX, not iPhone / Android. Mobile is 4–6× lower memory bandwidth. Re-benchmark on actual target devices before shipping.

**What is new in this report vs prior research:**
1. The reframing of "use REAP" from user intent into "REAP is for MoE; the dense equivalent is LLM-Sieve."
2. The concrete two-track recommendation (Apple Foundation Models for iOS, LLM-Sieve-pruned MobileLLM-Pro for Android) that did not exist in any earlier research doc.
3. The calibration-data inventory across 7 LaneShadow-specific skill categories.
4. The surfacing of `react-native-apple-llm` / `@ratley/react-native-apple-foundation-models` — none of the prior docs mentioned these plugins, and they likely reset our iOS strategy.
5. The thermal-throttling finding as a primary design constraint — prior research focused on RAM and tokens/sec but not on sustained-session heat limits.

## Appendix C: First concrete next actions (low-cost, high-signal)

1. **Add MobileLLM-Pro 1B to `benchmark_llm_models.py`** (1 day). Compare against existing Qwen3.5 0.8B on the four micro-tasks. If it wins on any of the three currently-failing tasks, the Android strategy is already better.
2. **Assemble a 500-sample LaneShadow calibration mini-set** (1 day). Tag by skill category. This is the sand-in-the-oyster input for Phase B-2; you want to know what it looks like before committing to 4–8 K.
3. **Spike the `react-native-apple-llm` plugin in a throwaway Expo branch** (1 day). Verify it runs on a test device and can return structured JSON for leg labels. This is the iOS Track A viability check.
4. **Pull app-store analytics on iOS version distribution** (30 min). This tells you how much of the user base Track A covers and therefore how much to invest in Track B.
5. **Check if LLM-Sieve has public code** (1 hour). Email the Microsoft authors if not. This gate decides whether Phase B-3 uses LLM-Sieve or Frustratingly Easy Task-aware Pruning as the primary algorithm.

These five actions together cost ~4 person-days and resolve ~80% of the scoping uncertainty for the full Track A + Track B effort.
