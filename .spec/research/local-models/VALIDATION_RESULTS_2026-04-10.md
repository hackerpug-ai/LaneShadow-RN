---
date: 2026-04-10
status: complete
models_tested: Qwen3.5 0.8B (MLX, OptiQ-4bit) vs claude-haiku-4-5-20251001
---

# Qwen3.5 Ranking & Route Modification Validation Results

## Executive Summary

Both new proposed use cases — candidate ranking and route modification — failed their viability gates. The test also revealed a test design bug that partially inflated the ranking failure signal. Full findings below.

---

## Test 1: Route Modification (M1–M7)

### Raw Results

| Scenario | Constraint | Qwen Rate | Haiku | Verdict |
|----------|-----------|-----------|-------|---------|
| M1 avoid-highway | "Avoid Highway 1" | 0% | ✓ | ❌ |
| M2 closed-leg | "Leg ssc-3a is closed" | 0% | ✓ | ❌ |
| M3 more-scenic | "Make more scenic" | 100% | ✓ | ✅* |
| M4 shorter | "Make shorter" | 100% | ✓ | ✅* |
| M5 multi-constraint | "No highway AND no toll" | 0% | ✓ | ❌ |
| M6 surgical-swap | "Replace legs 2a and 4a only" | 0% | ✓ | ❌ |
| M7 twistiest | "Highest curvature version" | 100% | ✓ | ✅ |

*M3/M4 pass only because returning the original unchanged route satisfies the lenient check (>= original). The model is not actually swapping legs — it returns the primary legs verbatim.

### What Actually Happened

**M1, M2, M5, M6 (0%):** Qwen returns the original primary legs unchanged every time:
```
['ssc-1a', 'ssc-2a', 'ssc-3a', 'ssc-4a', 'ssc-5a']
```
Perfectly valid JSON. Correct IDs from the pool. Correct count. Zero hallucinations. But completely ignores the constraint — it just echoes the primary route back.

**M7 (100%):** Qwen correctly swaps ALL legs to their 'b' alternates:
```
['ssc-1a', 'ssc-2b', 'ssc-3b', 'ssc-4b', 'ssc-5b']
```
This is genuinely correct for M7 and also what M6 should partially have done. Suggests the model can swap legs when the instruction is "swap everything" but not when it needs to swap selectively.

**M6 (0% but interesting):** Qwen swapped too aggressively:
```
['ssc-1a', 'ssc-2b', 'ssc-3b', 'ssc-4b', 'ssc-5b']
```
This is the M7 pattern applied to M6. It swapped all alternates when only 2a and 4a were requested.

### Structural Quality (all scenarios)

| Metric | Rate |
|--------|------|
| Valid JSON | 100% |
| Correct leg count | 100% |
| Connectivity preserved | 100% |
| Hallucinations | 0 |
| Latency | ~1.0s avg |

### Interpretation

The model understands the output format perfectly. The failure is semantic: it can't reliably map a constraint ("avoid Highway 1") to a selection action ("swap legs that have highway=true"). The exception is "make everything twistier / swap everything" — a global sweep is within its capability but selective constraint-based substitution is not.

**Gate result: FAILED (43% avg constraint rate, gate is ≥80%)**

---

## Test 2: Ranking Accuracy (Precision@5 at scale)

### Raw Results

| N | twisty-sport | scenic-mountain | low-traffic | adventure-dirt | avg |
|---|---|---|---|---|---|
| 5 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 10 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 20 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 40 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |
| 60 | 0.00 | 0.00 | 0.00 | 0.00 | 0.00 |

### ⚠️ Test Design Bug: ID Format Inflation

The test has a format bug that partially inflates the failure signal:

`format_candidate()` emits `id=ca1-bigsur` in the prompt. Qwen echoes this back as `id=ca1-bigsur` (faithfully copying the format), but the pool's ID keys are bare `ca1-bigsur`. The set intersection fails, counting every pick as a hallucination and precision as 0 — even when the model is picking reasonable candidates.

Actual Qwen picks for twisty-sport at N=20:
```
['id=ca1-bigsur', 'id=ca36-mad-river', 'id=co550-million', 'id=wa20-cascade', 'id=tn56-falls']
```

These are all high-quality candidates (Big Sur, Mad River Road, Million Dollar Highway). With the ID format fixed, some of these would match the ground truth — the real precision@5 is likely non-zero.

**The test needs to be re-run with a fixed `format_candidate` (bare ID in prompt, not `id=X`).**

### What IS clear from ranking results

Despite the format bug, these findings are reliable:

**Positional bias: CONFIRMED**
Shuffling the same 20 candidates produces completely different picks:
```
shuffle 0: ['id=mt2-glacier', 'id=us129-deals-gap', 'id=filler-015', ...]
shuffle 1: ['id10', 'id12', 'id14', 'id18', 'id1']   ← positional references
shuffle 2: ['id=ca36-mad-river', 'id=wa20-cascade', ...]
```
Agreement across 5 shuffles: **0%**. The model is highly order-dependent.

Shuffle 1 is especially revealing: `id10`, `id12`, `id14` — the model is picking up the **line numbers from the numbered list** (1. id=..., 2. id=...) and treating them as IDs. This is a fundamental comprehension failure.

**Score blindness: CONFIRMED**
For paired candidates with identical text but different curvature scores (0.92 vs 0.12), the model returned neither pair member in picks. It ignored the scores entirely and picked unrelated candidates by name/semantic appeal.

**Instruction inversion: FAILED**
Asked to return the "worst 5" — returns the same high-quality picks as "best 5". Can't invert.

**What works:**
- Count accuracy: ✅ returned exactly K picks for K ∈ {3,5,7,10}
- No duplicates: ✅ 0 across all runs
- Keyword trap: ✅ didn't pick "Twisty Meadow Trail" (curvature=0.15) for twisty intent
- Distractor: ✅ didn't pick "Lunch Spot at Mile 12"
- Consistency (temp=0): ✅ 100% identical across 10 runs same prompt

**Gate result: FAILED (precision@5=0.00, gate ≥0.60; note: test bug inflates failure — real precision unknown until rerun)**

---

## Test 3: Consistency

Perfect. 100% identical output across 10 runs of the same prompt at temperature=0 for all 3 test cases. The model is completely deterministic.

---

## Failure Mode Summary

| Mode | Result | Notes |
|---|---|---|
| Positional bias | ❌ DETECTED | 0% agreement across shuffles; picks line numbers as IDs |
| Score blindness | ❌ DETECTED | Ignores numeric field values |
| Keyword attraction | ✅ OK | Didn't pick keyword-matched low-curvature candidate |
| Distractor susceptibility | ✅ OK | Ignored obvious non-ride candidate |
| Count violation | ✅ OK | Returns exactly K picks |
| Hallucination (ranking) | ❌ TEST BUG | Caused by id= prefix format; rerun needed |
| Instruction inversion | ❌ FAILED | Can't produce inverted ranking |
| Duplicates | ✅ OK | Zero duplicates |
| JSON validity | ✅ PERFECT | 100% parseable across all tests |
| Consistency (temp=0) | ✅ PERFECT | 100% identical across runs |

---

## Decisions for Curation PRD v1.1

### Ranking (use Qwen to pick top-N from candidate pool)
**Decision: DROP from PRD scope.**

Even correcting for the format bug, positional bias (0% agreement across shuffles) and score blindness make ranking unreliable. The model doesn't read numeric scores — it picks by semantic appeal of the name/summary text. That's unpredictable and uncalibrated. **Discovery uses pure SQL `ORDER BY composite_score DESC`.**

### Route Modification (constraint-based leg swap)
**Decision: DROP from PRD scope for Qwen. Route to Haiku.**

Qwen consistently returns the original route unchanged when constraints require selective leg substitution (M1, M2, M5, M6). It CAN do a global sweep (M7: "swap everything") but that's only useful for one specific interaction pattern. Constraint-based modification (the main use case: "avoid this road", "this leg is closed") is a Haiku task.

### What Qwen3.5 IS confirmed for

| Task | Status | Evidence |
|---|---|---|
| Leg labels (leg A → leg B format strings) | ✅ PRODUCTION | Prior research, 100% validity, 2.84x faster |
| Global route variation ("twistiest version") | ✅ LIKELY | M7 100% — but needs isolated test |
| JSON structure and count | ✅ PERFECT | 100% across all tests |
| Determinism at temp=0 | ✅ PERFECT | 100% consistency |
| Output latency | ✅ ~1s | Fast enough for all use cases |

### Recommended follow-up tests (before v1.2 scope decisions)

1. **Fix ranking test** — strip `id=` prefix from format_candidate, re-run scale accuracy to get real precision@5 numbers.
2. **Test "global preference swap"** — isolated test of M7 pattern ("make everything more X") which showed 100% success. This may be a viable Qwen task.
3. **Test simpler binary constraint** — "Is this leg a highway? Yes/No" × 5 legs. If classification-per-leg works, a multi-step orchestrator could do per-leg decisions and assemble the result deterministically.

---

## Updated PRD Scope (Qwen3.5 0.8B)

Remove from scope:
- ❌ Candidate ranking (§11.4 in TRD)
- ❌ Route modification / leg swap

Retain in scope:
- ✅ Leg label generation (validated, production-ready)
- ✅ Deterministic temp=0 consistency (useful as formatting engine)

Discovery path reverts to: **SQL filter + `ORDER BY composite_score DESC`.**
Modification path: **Haiku (online), with graceful offline degradation to "show original route, modifications require connectivity".**
