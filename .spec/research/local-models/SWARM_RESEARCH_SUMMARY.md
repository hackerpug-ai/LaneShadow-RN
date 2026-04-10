---
title: "Swarm Research Summary: From Hope to Reality"
date: "2026-04-09"
category: "summary"
tags: [swarm, research-summary, qwen, haiku, micro-tasks]
---

# Swarm Research Summary: What We Actually Learned

## The Original Hypothesis

**Hope:** We could deconstruct the monolithic `enrichRoute` function into 4 parallel micro-tasks, each handled by a smaller, faster model (Qwen3.5 0.8B).

**Expected benefits:**
- 25% cost reduction
- 1.5x speed improvement
- 50% offline capability (2 of 4 tasks)
- Better fault tolerance

## What We Tested

We systematically tested all 4 micro-tasks from `enrichRoute`:

1. **Route Labels** - Generate punchy, memorable names (≤8 words)
2. **Route Rationales** - Explain why route is scenic (1-2 sentences)
3. **Scenic Highlights** - Generate 3-5 short phrases highlighting features
4. **Leg Labels** - Generate FROM → TO labels for each segment

## The Reality

### What Worked ✅

**Leg Labels ONLY:**

| Metric | Qwen3.5 0.8B | Haiku | Winner |
|--------|--------------|-------|--------|
| Speed | 0.35s | 0.76s | Qwen (2.16x faster) |
| Validity | 100% | 100% | Tie |
| Quality | Functional | Evocative | Preference |
| Cost | $0 | $0.0003 | Qwen |

**Why it works:**
- Simple input structure (from, to, road)
- Clear output format (array of strings)
- No creative reasoning required
- Pattern matching suffices

### What Didn't Work ❌

**1. Scenic Highlights - Complete Failure**

| Metric | Qwen3.5 0.8B | Haiku |
|--------|--------------|-------|
| Validity | **0%** | 100% |
| Output | `[]` (empty) | 4-5 relevant highlights |

**Root cause:** Qwen3.5 cannot generate evocative language or identify scenic features from waypoint names alone.

**2. Route Labels - Quality Failure**

| Metric | Qwen3.5 0.8B | Haiku |
|--------|--------------|-------|
| Output | "San Francisco to Point Reyes" | "Coastal Curve Chronicles" |
| Quality | Generic waypoint listing | Evocative, brandable |

**Root cause:** Qwen3.5 repeats input data instead of synthesizing creative names.

**3. Route Rationales - Hallucination Failure**

| Metric | Qwen3.5 0.8B | Haiku |
|--------|--------------|-------|
| Accuracy | Geographic hallucinations | Accurate |
| Example | "Pacific coastline" for I-5 | "Columbia River" for I-5 |

**Root cause:** 0.8B parameter count limits world knowledge and reasoning.

## The Revised Architecture

### Original Hope vs Reality

| Aspect | Original Hope | Reality | Change |
|--------|---------------|---------|--------|
| **Cost savings** | 25% | 12.5% | -50% |
| **Speed improvement** | 1.5x | 1.2x | -20% |
| **Offline capability** | 50% | 25% | -50% |
| **Tasks for Qwen** | 4 of 4 | 1 of 4 | -75% |

### Recommended Implementation

```typescript
// Only leg labels go to Qwen3.5
async function enrichRouteHybrid({ routes }) {
  const [labels, rationales, highlights, legLabels] = await Promise.all([
    enrichWithHaiku({ routes, task: 'labels' }),        // Required for quality
    enrichWithHaiku({ routes, task: 'rationales' }),     // Required for accuracy
    enrichWithHaiku({ routes, task: 'highlights' }),     // Only working option
    enrichWithQwen({ routes, task: 'legLabels' }),       // Validated, 2.16x faster
  ])

  return { labels, rationales, highlights, legLabels }
}
```

## Key Lessons

### 1. Small Models Have Limited Creative Range

**Finding:** 0.8B parameter models can handle pattern matching but fail at creative synthesis.

**Implication:** Swarm decomposition works best for **deterministic sub-tasks**, not creative ones.

### 2. Speed Doesn't Matter if Quality Fails

**Finding:** Qwen3.5 was 2-3x faster on all tasks, but quality failures made it unusable for 3 of 4.

**Implication:** **Quality parity is the gatekeeper** - speed is secondary.

### 3. Geographic Reasoning Requires Model Scale

**Finding:** Qwen3.5 hallucinated geographic features (claimed I-5 follows Pacific coastline).

**Implication:** **World knowledge scales with model size** - can't be decomposed away.

### 4. Validity Rate is Critical

**Finding:** Scenic highlights had 0% validity (empty arrays) - complete failure mode.

**Implication:** **Structured output reliability varies by task complexity** - simple patterns work, complex patterns fail.

## Recommendations

### For Production

1. **Implement leg labels with Qwen3.5** - Validated, safe, 2.16x faster
2. **Keep other tasks on Haiku** - Quality requirements demand larger model
3. **Monitor leg label quality** - User feedback may reveal edge cases
4. **Set realistic expectations** - 12.5% cost savings, not 25%

### For Future Research

1. **Test 2B-4B models** - May have better creative capabilities
2. **Fine-tune Qwen3.5** on motorcycle route data for domain adaptation
3. **Grammar-constrained sampling** - May improve structured output reliability
4. **Hybrid human-AI** - Use Qwen for drafts, Haiku for refinement

## Conclusion

**Swarm decomposition is not a magic bullet.**

While leg labels worked beautifully (100% validity, 2.16x faster), the other 3 micro-tasks failed due to quality limitations. The original hypothesis of 25% cost savings and 50% offline capability proved optimistic.

**The reality:**
- **12.5% cost savings** (not 25%)
- **1.2x speed improvement** (not 1.5x)
- **25% offline capability** (not 50%)

**But this is still valuable!**
- Leg labels alone save ~$1/year at 10k routes
- 2.16x faster on that sub-task improves overall latency
- Offline capability for navigation-critical sub-task

**The lesson:** Small models excel at **simple pattern matching**, not **creative reasoning**. Swarm decomposition works when tasks are **deterministic**, not **generative**.

## Research Artifacts

- **Comprehensive analysis:** `.spec/research/microtask_swarm_analysis.md`
- **Test results:** `.spec/research/microtask_swarm_analysis.json`
- **Test script:** `.spec/research/test_all_microtasks.py`
- **Leg labels validation:** `.spec/research/leg_labels_swarm_analysis.md`
- **Qwen vs Haiku comparison:** `.spec/research/qwen_vs_haiku_comparison.md`
