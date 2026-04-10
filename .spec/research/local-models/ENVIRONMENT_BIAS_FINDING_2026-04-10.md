---
date: 2026-04-10
type: methodology-correction
affects: all latency findings in this research folder
status: open — device-level benchmarks not yet run
---

# Environment Bias: All Latency Findings Are Mac-Only

## The Problem

Every test in this research folder was run on a **2026 MacBook Pro (Apple Silicon,
likely M4 Pro/Max or M5)**. The production target is a **React Native mobile app
running on iPhone and Android**. These are different hardware, different runtimes,
and different thermal environments.

Accuracy findings are largely portable. **Latency findings are not.**

---

## What We Were Actually Running

| Layer | Test environment | Production target |
|---|---|---|
| Hardware | 2026 MacBook Pro | iPhone 15/16 Pro, mid-range Android |
| Memory bandwidth | ~273–400 GB/s | ~60–68 GB/s (iPhone A17/A18) |
| Inference runtime | MLX via Metal GPU | Core ML / ANE (iOS), ONNX / NPU (Android) |
| Thermal behavior | No throttling (sustained) | Throttles under load |
| Model format | MLX OptiQ-4bit | Needs Core ML conversion (iOS) |

MLX is a Mac-only framework. It will not run on iOS or Android. The on-device
production path requires a separate model conversion step and a different runtime.

---

## Latency Bias — Estimated Magnitude

LLM inference at this scale is memory-bandwidth-bound. The gap:

| Device | Mem bandwidth | Estimated multiplier vs Mac |
|---|---|---|
| 2026 MacBook Pro (M4 Pro) | ~273 GB/s | 1× (our baseline) |
| 2026 MacBook Pro (M5, if released) | ~400+ GB/s | 0.7× (even faster) |
| iPhone 16 Pro (A18 Pro) | ~68 GB/s | ~4–6× slower |
| iPhone 15 Pro (A17 Pro) | ~60 GB/s | ~5–7× slower |
| Mid-range Android (Snapdragon 8 Gen 3) | ~51 GB/s | ~6–8× slower |

### Corrected latency estimates (approximate)

| Approach | Observed (Mac) | Estimated iPhone 16 Pro | Status |
|---|---|---|---|
| Qwen single-pass | ~2.4s avg | ~10–15s | ❌ unacceptable |
| Option A (2-pass sequential) | ~1.2s avg | ~5–8s | ❌ unacceptable |
| Option B (6 probes, sequential) | ~3.7s avg | ~15–25s | ❌ unacceptable |
| Option B (6 probes, theoretical parallel) | ~1.0s | ~4–6s | ❌ borderline |
| Haiku single-pass | ~1.1s avg | ~1.5–3s (network) | ✅ likely fine |

Haiku's latency is network-bound (API round-trip), not compute-bound — it will
remain roughly comparable on a real device, modulated by LTE vs WiFi conditions.

### Implications for PRD latency claims

The curation PRD and prior results docs cite "~1.5s on-device" for Qwen inference.
**This figure is unvalidated on mobile hardware.** It must be treated as a Mac
benchmark only until device testing is complete.

---

## Accuracy Bias — Estimated Magnitude

Model weights are the same regardless of runtime. At 4-bit quantization, numerical
differences between MLX and Core ML are typically minor for sub-1B models. The
core reasoning behavior (slot-filling, classification errors, monoculture biases)
should transfer.

**Low-risk to trust:** op-type enumeration failures, `avoid_road` monoculture,
Option B false-positive probe firing, Haiku accuracy percentages.

**Non-zero risk:** Core ML's INT4 implementation may round differently than MLX's,
shifting exact output distributions at the margin. This is unlikely to flip a
pass/fail verdict but could move borderline scenarios.

---

## What a Valid Mobile Benchmark Requires

### 1. Model conversion
Convert `Qwen3.5-0.8B-OptiQ-4bit` from MLX format to Core ML:
```bash
# Install coremltools + mlx-lm
pip install coremltools mlx-lm

# Convert (approximate — actual flags depend on coremltools version)
python -m mlx_lm.convert \
  --hf-path mlx-community/Qwen3.5-0.8B-OptiQ-4bit \
  --mlx-path ./qwen3.5-0.8b-mlx \
  --upload-repo local

# Then convert MLX → Core ML via coremltools
# (or find a pre-converted .mlpackage from Hugging Face)
```

### 2. iOS test harness
A minimal Swift/Objective-C wrapper around Core ML that:
- Accepts a prompt string
- Returns generated text + wall-clock latency
- Exposes via a React Native native module for integration testing

Alternatively: use an existing on-device LLM framework that supports Core ML,
such as `swift-transformers` or `llama.cpp` with Metal backend, and run the
same 20 MUTATION_SCENARIOS.

### 3. Measurement protocol
- **Device:** iPhone 15 Pro (minimum target) AND iPhone 16 Pro (target)
- **Thermal soak:** run all 20 scenarios sequentially, record per-scenario latency — do NOT average only the first few
- **Cold start:** measure first-inference latency separately (model load + first token)
- **Warm inference:** average of scenarios 3–20 (skip thermal ramp-up)
- **Network conditions for Haiku:** measure on LTE (not WiFi) for realistic comparison

### 4. Android path (if targeting Android)
- Convert to ONNX or use llama.cpp Android build
- Test on Pixel 8 Pro (Tensor G3) and Samsung S24 (Snapdragon 8 Gen 3)
- Android inference is typically slower than iOS ANE for INT4 models

---

## Impact on Existing Decisions

| Decision | Still valid? | Caveat |
|---|---|---|
| Haiku-only for route mutation | ✅ Yes | Accuracy finding holds; latency also favors Haiku |
| Qwen for intent → SQL discovery | ✅ Probably | Accuracy validated (93%); latency needs device test |
| "~1.5s on-device" Qwen claim in PRD | ❌ Unvalidated | Replace with "~1.5s on M4 Mac; mobile TBD" |
| Haiku fallback for zero results | ✅ Yes | Not latency-sensitive |
| Option A / Option B decomposition rejected | ✅ Yes | Accuracy failure independent of hardware |

---

## Next Steps

- [ ] Source or convert Qwen3.5 0.8B to Core ML format
- [ ] Build minimal iOS Swift inference harness
- [ ] Run latency benchmark on iPhone 15 Pro + iPhone 16 Pro
- [ ] Update PRD latency claims with device-validated numbers
- [ ] Flag all latency figures in existing results docs as "Mac MLX only"
