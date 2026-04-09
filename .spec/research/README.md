# LLM Model Benchmark for Route Suggestion

This directory contains automated benchmarks for testing local LLM models on route suggestion tasks.

## Setup

1. Install MLX and dependencies:
```bash
pip3 install mlx-lm psutil
```

2. Run the benchmark:
```bash
python3 .spec/research/benchmark_llm_models.py
```

## What It Tests

The benchmark tests 3 models on route suggestion prompts:

- **Llama 3.2 1B (4-bit)** - ~700MB
- **Llama 3.2 3B (4-bit)** - ~2GB
- **Phi-3 Mini (4-bit)** - ~2.2GB

### Test Scenarios

1. **Simple Route** - Basic A to B routing with traffic consideration
2. **Multi-stop Route** - Route with multiple waypoints
3. **Bike Route** - Bicycle-specific routing
4. **Transit Route** - Public transit multi-modal routing

### Metrics Measured

For each model and prompt, we measure:

- **Speed**: Tokens per second
- **Latency**: Time to first response
- **Memory**: RAM usage during inference
- **Disk Size**: Model file size on disk
- **Accuracy**: Completeness of response (checks for expected elements)
- **Success Rate**: % of prompts completed successfully

## Results

Results are saved to `.spec/research/llm_benchmark_results.json` with:

- Individual prompt results
- Aggregate statistics per model
- System information
- Timestamps

## Research Summary

### Overall Conclusion

**Qwen3.5 0.8B is viable for specific, simple tasks only.**

After comprehensive testing across all 4 micro-tasks from the monolithic `enrichRoute` function, **only leg labels are suitable for Qwen3.5 swarm deployment**. The model fails at creative tasks requiring evocative language, geographic reasoning, or complex structured output.

### What Works ✅

**Leg Labels:**
- 100% validity rate
- 2.16x faster than Haiku (0.35s vs 0.76s)
- Functional quality (stylistic preference: literal vs evocative)
- Zero API cost
- Works offline

### What Doesn't Work ❌

**Route Labels:**
- Repeats input data instead of generating names
- Example: "San Francisco to Point Reyes" vs Haiku's "Coastal Curve Chronicles"

**Scenic Highlights:**
- 0% validity rate (returns empty arrays)
- Complete failure on structured output

**Route Rationales:**
- Geographic hallucinations (claims Seattle-Portland I-5 route follows Pacific coastline)
- Excessive verbosity vs Haiku's concise accuracy

### Revised Swarm Architecture

**Original hope:** 4 parallel Qwen3.5 calls = 25% cost savings, 1.5x speed, 50% offline

**Actual result:** 1 Qwen3.5 call + 3 Haiku calls = 12.5% cost savings, 1.2x speed, 25% offline

**The reality:** Small models (0.8B) lack the reasoning capability for creative tasks, even when decomposed into micro-tasks.

### Mobile LLM Route Planning (2024-2025)
**Question:** Can small mobile-optimized LLMs generate quality motorcycle route suggestions?

**Findings:**
- 2025 models (Llama 3.2 1B, Phi-3 Mini 4K) failed on structured output requirements
- JSON extraction unreliable; models failed to follow output schema
- Llama 3.2 1B: fastest but 0% valid JSON
- Phi-3 Mini: extremely slow (10.5 tok/s), 25% valid JSON
- **Conclusion:** Not viable for production without grammar-constrained sampling

### 2026 Mobile Models Research (January 2026)
**Question:** Are there better mobile-optimized LLMs for route planning?

**Findings:**
- Qwen3.5 0.8B (Alibaba, 2026): 403 tok/s, 0.37s latency, native JSON mode
- Hybrid architecture: Gated Delta Networks + Mixture-of-Experts
- **Recommended for:** First deployment, with fallback to cloud
- **Next:** Download and test against 2025 baselines

### Benchmark Results (April 2026)
**Status:** Complete ✅

**Qwen3.5 0.8B Performance:**
- Speed: 73.6 tok/s (MLX local inference)
- Duration: 1.8s per route
- RAM: 1.15 GB
- JSON Validity: ~100% (manual inspection)
- Quality: Generates complete route data but with generic waypoints

**vs Haiku API:**
- Haiku: 151.8 tok/s, 3.9s duration, 100% valid JSON
- Haiku quality: Superior waypoints (Sausalito → Stinson Beach → Tomales Bay)
- Qwen quality: Generic waypoints with coordinate inaccuracies

**Recommendation:** Hybrid approach
- 80% cache hits (Haiku quality, instant)
- 15% Haiku API (online, best quality)
- 5% Qwen3.5 local (offline fallback)

### Mobile Compatibility Analysis (April 2026)
**Status:** Complete ✅

**Hardware Requirements:**
- RAM: 2-3 GB (available on most modern phones)
- CPU: ARMv8 (iPhone 12+, Android mid-range+)
- OS: iOS 17.4+ / Android 13+

**Performance Expectations:**
- iPhone 15 Pro: 40-60 tok/s, 3-5s per route
- Android Flagship: 35-55 tok/s, 4-6s per route
- Battery impact: 15-25% per route
- Thermal throttling after 3-5 consecutive routes

**Limitations:**
- 2-5x slower than desktop
- Significant battery drain
- Quality degradation from mobile quantization (Q4_K_M)
- Memory pressure on 4 GB devices

**Recommendation:** Hybrid cloud-edge architecture for production deployment

### Swarm Candidate Analysis: Route Leg Labels (April 2026)
**Status:** Complete ✅

**Question:** Can we deconstruct monolithic route enrichment into parallel sub-tasks handled by smaller models?

**Test:** Leg label generation (FROM → TO labels for route segments)

**Results:**
| Model | Avg Duration | Validity | Cost |
|-------|--------------|----------|------|
| **Qwen3.5 0.8B** | 0.36s | 100% | $0 (local) |
| **Haiku** | 1.01s | 100% | $0.0003/route |

**Key Findings:**
- Qwen3.5 0.8B is **2.84x faster** than Haiku for leg labels
- Both models achieve 100% validity rate
- Quality difference is stylistic (Qwen: verbose, Haiku: concise)
- Leg labels are **ideal swarm sub-task**: simple input/output, low context, parallelizable

**Swarm Architecture:**
```typescript
// Current: 1 Haiku call generates everything
const enrichment = await enrichRoute({ routes })

// Proposed: Parallel sub-tasks with specialized models
const [labels, rationales, highlights, legLabels] = await Promise.all([
  generateRouteLabels({ routes }),        // Haiku (online, best quality)
  generateRationales({ routes }),         // Haiku (online, best quality)
  generateHighlights({ routes }),         // Haiku (online, best quality)
  generateLegLabels({ routes }),          // Qwen3.5 0.8B (local, free)
])
```

**Benefits:**
- 25% cost reduction vs Haiku-only
- 1.5x speed improvement vs current approach
- 100% offline availability for navigation-critical sub-tasks

**Conclusion:** Leg label generation is validated as a prime swarm candidate for hybrid cloud-edge deployment

## Monolithic Prompt Decomposition

### Current: Single Haiku Call (`enrichRoute`)

The current `enrichRoute` function makes **one LLM call** that generates **4 distinct outputs** for each route:

```typescript
// Single call generates ALL of these:
{
  label: "Pacific Coast Highway Dream",        // Micro-task 1
  rationale: "This route offers...",           // Micro-task 2
  highlights: ["Ocean views", "Twisty roads"], // Micro-task 3
  legLabels: [                                  // Micro-task 4
    "SF → Sausalito via 101",
    "Sausalito → Stinson Beach via 1",
    "Stinson → Point Reyes via 1"
  ]
}
```

### Micro-Task Breakdown

For **2-3 routes**, the single prompt is doing:

| Micro-Task | Output Type | Per Route | Total (3 routes) | Complexity |
|------------|-------------|-----------|------------------|------------|
| **1. Route Labels** | Short punchy name (≤8 words) | 1 string | 3 strings | Low |
| **2. Route Rationales** | 1-2 sentences why scenic | 1 string | 3 strings | Medium |
| **3. Scenic Highlights** | Array of short phrases (max 4 words each) | 3-5 strings | 9-15 strings | Low |
| **4. Leg Labels** | FROM → TO for each segment (max 6 words) | 2-4 strings | 6-12 strings | Low |

**Total outputs per call:** 19-33 distinct strings across 4 categories

### Swarm Decomposition Opportunities

#### ✅ **VALIDATED: Leg Labels** (Tested April 2026)

**Current:** Part of monolithic `enrichRoute` call
**Swarm approach:** Separate `generateLegLabels` function

```typescript
// Can be extracted to:
const legLabels = await generateLegLabels({
  routes: routes.map(r => ({
    legs: r.legContext.map(leg => ({
      from: leg.fromName,
      to: leg.toName,
      road: leg.roadName
    }))
  }))
})
```

**Validation:**
- ✅ Qwen3.5 0.8B: 0.36s, 100% valid, $0
- ✅ Haiku: 1.01s, 100% valid, $0.0003
- ✅ 2.84x faster with Qwen3.5
- ✅ Functionally equivalent quality

#### 🔄 **PENDING: Route Labels** (Not yet tested)

**Current:** Part of monolithic `enrichRoute` call
**Proposed:** Separate `generateRouteLabels` function

```typescript
const routeLabels = await generateRouteLabels({
  routes: routes.map(r => ({
    waypoints: r.waypoints.map(w => w.name),
    distance: `${(r.stats.distanceMeters / 1609.34).toFixed(1)} miles`,
    duration: `${Math.round(r.stats.durationSeconds / 60)} minutes`,
    preferences: r.preferences
  }))
})
```

**Input complexity:** Medium (requires understanding waypoint progression)
**Output complexity:** Low (1 short string per route)
**Swarm potential:** HIGH (can use Qwen3.5 for offline fallback)

#### 🔄 **PENDING: Route Rationales** (Not yet tested)

**Current:** Part of monolithic `enrichRoute` call
**Proposed:** Separate `generateRationales` function

```typescript
const rationales = await generateRationales({
  routes: routes.map(r => ({
    waypoints: r.waypoints.map(w => w.name),
    scenicBias: r.preferences?.scenicBias
  }))
})
```

**Input complexity:** Medium (requires understanding scenic value)
**Output complexity:** Medium (1-2 sentences with reasoning)
**Swarm potential:** MEDIUM (may require Haiku for quality)

#### 🔄 **PENDING: Scenic Highlights** (Not yet tested)

**Current:** Part of monolithic `enrichRoute` call
**Proposed:** Separate `generateHighlights` function

```typescript
const highlights = await generateHighlights({
  routes: routes.map(r => ({
    waypoints: r.waypoints.map(w => w.name),
    routeType: inferRouteType(r.waypoints) // coastal, mountain, etc.
  }))
})
```

**Input complexity:** Low (waypoint names only)
**Output complexity:** Low (array of 3-5 short phrases)
**Swarm potential:** HIGH (good candidate for Qwen3.5)

### Proposed Swarm Architecture

```typescript
// Current: 1 Haiku call = $0.0008, 2.0s
const enrichment = await enrichRoute({ routes })

// Proposed: 4 parallel calls = $0.0006, 1.5s (or free with Qwen swarm)
const [labels, rationales, highlights, legLabels] = await Promise.all([
  generateRouteLabels({ routes }),        // Haiku: complex reasoning
  generateRationales({ routes }),         // Haiku: requires scenic understanding
  generateHighlights({ routes }),         // Qwen3.5: simple pattern matching
  generateLegLabels({ routes }),          // Qwen3.5: validated, 2.84x faster
])
```

### Swarm Benefits

| Metric | Current (Monolithic) | Hybrid Swarm | Improvement |
|--------|---------------------|--------------|-------------|
| **Cost** | $0.0008/route | $0.0006/route | 25% reduction |
| **Latency** | 2.0s | 1.5s | 1.5x faster |
| **Offline capability** | 0% | 50% (2 of 4 tasks) | Partial |
| **Fault tolerance** | All-or-nothing | Granular | Better |

### Testing Roadmap

1. ✅ **Leg Labels** - Complete (Qwen3.5 validated)
2. ✅ **Route Labels** - Complete (Qwen3.5: repeats input data, NOT suitable)
3. ✅ **Scenic Highlights** - Complete (Qwen3.5: 0% validity, NOT suitable)
4. ✅ **Route Rationales** - Complete (Qwen3.5: geographic hallucinations, NOT suitable)

**Final Validation Results:**

| Micro-Task | Qwen3.5 Result | Validated for Swarm | Status |
|------------|----------------|---------------------|--------|
| **Leg Labels** | 100% valid, 2.16x faster | ✅ **YES** | Production-ready |
| **Route Labels** | Repeats input data | ❌ **NO** | Use Haiku |
| **Scenic Highlights** | 0% validity (empty arrays) | ❌ **NO** | Use Haiku |
| **Route Rationales** | Geographic hallucinations | ❌ **NO** | Use Haiku |

**Comprehensive Analysis:** `.spec/research/microtask_swarm_analysis.md`

**Final Recommendation:** Only leg labels are viable for Qwen3.5 swarm deployment. Other tasks require Haiku for quality.

**Revised Architecture:**
- **Leg labels**: Qwen3.5 0.8B (local, fast, free)
- **Labels, rationales, highlights**: Haiku (online, best quality)
- **Cost savings**: 12.5% (not 25% as initially hoped)
- **Speed improvement**: 1.2x (not 1.5x)
- **Offline capability**: 25% (1 of 4 tasks)

**Success criteria met:** Each micro-task must achieve:
- ≥95% validity rate (correct structure/count) ✅ Leg labels only
- ≥80% quality parity with Haiku (human evaluation) ✅ Leg labels only
- ≤2x latency of Haiku (for cost savings) ✅ Leg labels only

## Research Documents

- `mobile_llm_strategies_2025.md` - 2025 mobile LLM analysis
- `mobile_models_2026_route_optimization.md` - 2026 Qwen3.5 research
- `qwen_vs_haiku_comparison.md` - Quality comparison benchmark
- `qwen_mobile_compatibility.md` - Mobile deployment analysis
- `leg_labels_swarm_analysis.md` - Swarm candidate validation
- `test_leg_labels_only.py` - Leg label comparison test

## Next Steps

1. Implement leg labels with Qwen3.5 (validated, production-ready)
2. Build template-based system for offline fallback (see `task_decomposition_analysis.md`)
3. Test with real-world motorcycle routes (50+ requests)
4. Consider fine-tuning Qwen3.5 on motorcycle route data for domain adaptation

## Ultra-Decomposition Analysis

**Question:** Can we break down the failing tasks (labels, rationales, highlights) even further to make them viable for Qwen3.5?

**Finding:** **Creative reasoning cannot be decomposed away.** Further breakdown reveals that these tasks require creative synthesis that small models cannot provide, regardless of task size.

**Options:**

1. **Template-based approach** - 100% offline, 0% cost, but generic quality
2. **Hybrid approach** (recommended) - Balance quality and cost
3. **Accept limitations** - Not all tasks can be solved with decomposition

**Full analysis:** `task_decomposition_analysis.md`

**Key insight:** We cannot decompose our way to 100% offline + 100% quality + 0% cost. Something has to give.

## Executive Summary

**Read the full research summary:** `SWARM_RESEARCH_SUMMARY.md`

**Key finding:** Only 1 of 4 micro-tasks (leg labels) is viable for Qwen3.5 swarm deployment. Original hope of 25% cost savings and 50% offline capability proved optimistic. Reality: 12.5% cost savings, 25% offline capability.

**Lesson:** Small models (0.8B) excel at simple pattern matching but fail at creative reasoning. Swarm decomposition works for deterministic sub-tasks, not generative ones.

## Running Multiple Times

To compare models over multiple runs:

```bash
# Run benchmark
python3 .spec/research/benchmark_llm_models.py

# Results are timestamped, so you can run multiple times
# and compare the JSON files
```

## Customization

Edit `ROUTE_PROMPTS` in `benchmark_llm_models.py` to test your own route scenarios.
