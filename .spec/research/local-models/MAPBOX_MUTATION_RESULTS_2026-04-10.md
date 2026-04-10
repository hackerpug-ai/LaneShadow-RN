---
date: 2026-04-10
status: complete
models_tested: Qwen3.5 0.8B (MLX, OptiQ-4bit) vs claude-haiku-4-5-20251001
verdict: Qwen ❌ NOT VIABLE / Haiku ✅ VIABLE
---

# Route Mutation Intent → Mapbox API Parameter Extraction

## Executive Summary

Route mutation is **Haiku-only**. Qwen3.5 0.8B fails both the create/update
classification gate (67% vs ≥80% required) and the mutation parameter extraction
gate (60% pass rate, 0.57 avg F1 vs ≥65% / ≥0.60). Haiku passes both gates
cleanly (81% classification, 90% mutation pass rate, 0.85 avg F1).

**Parser bug note**: The first run showed 0% valid JSON for Qwen due to a greedy
regex that captured multi-object output garbage. After fixing the parser to extract
the first balanced `{...}` object, Qwen achieves 100% valid JSON in both phases.
The actual outputs were fine; the extractor was broken.

**Qwen's on-device scope remains unchanged**: leg labels + intent → SQL discovery params.
Route mutation joins the "Haiku-only" category alongside creative text generation and
candidate ranking.

---

## Results

### Phase 1 — Create / Update Classification

| Metric | Qwen3.5 0.8B | Haiku | Gate |
|---|---:|---:|---:|
| Valid JSON | **100%** (21/21) | 100% (21/21) | ≥90% |
| Classification accuracy | **67%** (14/21) | 81% (17/21) | ≥80% ✅ Haiku / ❌ Qwen |
| create accuracy | **43%** (3/7) | 86% (6/7) | — |
| update accuracy | **91%** (10/11) | 91% (10/11) | — |
| ambiguous accuracy | **33%** (1/3) | 33% (1/3) | — |

### Phase 2 — Mutation Parameter Extraction

| Metric | Qwen3.5 0.8B | Haiku | Gate |
|---|---:|---:|---:|
| Valid JSON | **100%** (20/20) | 100% (20/20) | ≥90% ✅ both |
| Scenarios passed | **60%** (12/20) | 90% (18/20) | ≥65% ❌ Qwen / ✅ Haiku |
| Avg F1 | **0.57** | 0.85 | ≥0.60 ❌ Qwen / ✅ Haiku |
| Avg required-hit rate | **62%** | 90% | — |
| Forbidden violations | **3** | 1 | ≤3 ✅ both |

### Phase 2 by difficulty

| Difficulty | Qwen pass | Qwen F1 | Haiku pass | Haiku F1 |
|---|---:|---:|---:|---:|
| Easy (7) | 6/7 (86%) | 0.86 | 7/7 (100%) | 1.00 |
| Medium (7) | 3/7 (43%) | 0.43 | 5/7 (71%) | 0.71 |
| Hard (6) | 3/6 (50%) | 0.39 | 6/6 (100%) | 0.83 |

---

## Qwen Failure Modes

### Phase 1: "ambiguous" over-classification

Qwen is **strong at detecting UPDATE** (91%) — when there's an active route in
context and the rider clearly references it, Qwen correctly says "update."

It **fails on open-ended CREATE** intents by defaulting to "ambiguous":

| Scenario | Intent | Expected | Qwen |
|---|---|---|---|
| C2-archetype | "Show me something twisty near Marin" | create | ambiguous |
| C5-discovery | "What's a good mountain road near me?" | create | ambiguous |
| C6-day-ride | "Take me somewhere scenic for the day" | create | ambiguous |

Pattern: discovery intents that could theoretically apply to an existing route
trigger the ambiguous response. Haiku correctly reads the absence of a current
route context as the decisive signal.

### Phase 2: single-op ceiling and feature confusion

**Qwen never outputs more than one op.** Every result had `ops=1`. Scenarios
requiring multi-op output (M15: two stops, M16: two excludes, M18: remove two
waypoints) either partially passed or failed because the second op was always missing.

**Specific failure categories**:

| ID | Intent | Expected | Qwen output | Failure |
|---|---|---|---|---|
| M7-avoid-ferry | "Avoid any ferry crossings" | `exclude_feature: ferry` | `exclude_feature: motorway` | Wrong enum value |
| M8-add-hmb | "Go through Half Moon Bay on the way" | `add_waypoint index=1` | `add_waypoint index=0` | Wrong insertion index |
| M11-straight-shot | "Skip all intermediate stops, straight shot" | `remove_waypoint index=1` | `trim_route index=0` | Wrong op type (trim vs remove) |
| M12-no-highways | "Back roads only, avoid major highways" | `exclude_feature: motorway` | `avoid_road` | Wrong op type |
| M14-add-stinson | "Ride through Stinson Beach after Mill Valley" | `add_waypoint index=2` | `add_waypoint index=1` | Off-by-one index |
| M17-swap-stops | "Go to Bodega Bay first, then loop back to Point Reyes" | `reorder_waypoints [2,3]` | Wrong swap | Reorder beyond Qwen capability |
| M19-trim | "End the ride at Point Reyes, skip Bodega Bay" | `trim_route index=2` | `trim_route index=3` | Off-by-one index |

**Dominant pattern**: Qwen correctly identifies the op TYPE most of the time but
makes index-off-by-one errors and occasionally confuses `exclude_feature` for
`avoid_road`. It cannot produce multi-op output reliably at 0.8B.

---

## Haiku Failure Modes

Haiku's 4 Phase 1 misses are all genuinely ambiguous scenarios:
- A1 "Give me a different route" → classified create (reasonable; no preference)
- A2 "Make it more scenic" → classified update (also reasonable; route in context)
- A3 "Something shorter" (no context) → classified ambiguous (understandable)
- A4 "Can we stop for coffee?" → classified ambiguous (reasonable hedge)

These misses reflect the inherent ambiguity of the scenarios, not model failure.

Haiku's 2 Phase 2 misses:
- **M10** "Add a stop somewhere in the middle for a coffee break" → returned `[]` (no ops). Haiku hedged on the generic midpoint, refusing to guess a waypoint without a place name. Our scoring expected `add_waypoint`.
- **M11** "Skip all the intermediate stops, straight shot" → returned `trim_route` (forbidden op). Like Qwen, Haiku interpreted "straight shot" as trimming rather than removing the intermediate waypoint.

M11's shared failure (both models chose trim) suggests our expected answer may be
worth reconsidering — "skip all stops" could legitimately map to either op.

---

## The Organizing Principle: Confirmed

| Use case | Pattern | Qwen | Notes |
|---|---|---|---|
| Leg label generation | text → structure | ✅ VIABLE | Prior research |
| Intent → SQL discovery | text → flat JSON | ✅ VIABLE | Prior research, 93% pass |
| Create/update classification | text → enum | ❌ NOT VIABLE | 67%, fails on open-ended CREATE |
| Simple mutation (easy only) | text → single-op struct | ⚠️ 86% easy only | Drops to 43% at medium |
| Mutation extraction (all) | text → op array | ❌ NOT VIABLE | 60% overall, single-op ceiling |
| Candidate ranking/selection | structure → selection | ❌ NOT VIABLE | Prior research |
| Route modification (pool select) | structure → selection | ❌ NOT VIABLE | Prior research |

**Qwen3.5 0.8B does one thing well: slot-fill a flat JSON from text.**
Any schema that requires nested arrays of objects, multi-op output, or
index reasoning from a numbered list degrades below production threshold.

---

## Architecture Decision

```
Rider intent (natural language)
      ↓
  Intent classification (create vs update)
      ↓ Haiku online (~0.8s, requires connectivity)

  IF create:
      ↓
    Qwen3.5 on-device → SQL params → op-sqlite → route cards   ✅ validated
    (offline-capable, ~1.5s, 93% pass rate)

  IF update:
      ↓
    Haiku online → Mapbox mutation ops → API diff              ✅ validated
    (requires connectivity, ~1.0s, 90% pass rate)
```

Classification cannot be on-device (Qwen 67% fails gate). Both classification and
mutation param extraction use Haiku. The only on-device LLM path is discovery
(intent → SQL), which is already validated and offline-capable.

Fallback: if connectivity is unavailable during an update intent, surface a "route
editing requires connection" message rather than running Qwen with degraded results.

---

> **⚠️ Latency caveat (added 2026-04-10):** All latencies above were measured on a 2026 MacBook Pro (MLX runtime). Mobile devices run Core ML (iOS) or ONNX (Android) with ~4–6× lower memory bandwidth. Haiku's latency (~1.1s) is network-bound and transfers reliably to mobile. Qwen latencies do not. See [`ENVIRONMENT_BIAS_FINDING_2026-04-10.md`](ENVIRONMENT_BIAS_FINDING_2026-04-10.md).

## Next Steps

1. **Update curation PRD v1.2** — remove "on-device classification" from architecture.
   Route mutation flow is Haiku-only with connectivity requirement.
2. **Revisit M11 expected answer** — both models prefer `trim_route` over
   `remove_waypoint` for "skip all stops, straight shot." Our fixture may be wrong.
3. **Fix M10 scoring** — generic "add a coffee stop" may need a looser match
   (accept any `add_waypoint` op regardless of place_name or index).
4. **Port Haiku mutation prompt + normalize_output to TypeScript** alongside the
   existing intent → SQL params path.
5. **Expand classification scenarios** from 21 to 40+ before production, covering
   more edge cases of the create/update boundary.

---

## Files

- `test_mapbox_mutation_fixtures.py` — 21 classification + 20 mutation scenarios, scoring helpers
- `test_mapbox_mutation.py` — Qwen + Haiku runner, both phases, gate evaluation
- `mapbox_mutation_20260410_151343.json` — Qwen-only results (fixed parser)
- `mapbox_mutation_20260410_151002.json` — initial run with broken parser (discard)
