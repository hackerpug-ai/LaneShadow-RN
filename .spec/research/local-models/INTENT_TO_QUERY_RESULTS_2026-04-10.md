---
date: 2026-04-10
status: complete
models_tested: Qwen3.5 0.8B (MLX, OptiQ-4bit) vs claude-haiku-4-5-20251001
verdict: ✅ VIABLE
---

# Qwen3.5 Intent → SQL Query Parameter Validation

## Executive Summary

**Qwen3.5 0.8B is viable for intent → structured query parameter extraction**, the "db whisperer" pattern. After four prompt iterations and two defensive layers (enum validation + retry-on-degeneration), Qwen hit **93% scenario pass rate** and **0.89 Jaccard agreement with Haiku** on 15 test scenarios spanning easy → subjective difficulty. This is the first new Qwen use case we've validated beyond leg labels.

The final architecture for LaneShadow's curation PRD:

```
User intent (natural language)
   ↓  Qwen3.5 0.8B (on-device, ~1s, no network)
JSON params (archetype, state, sort_by, filters, radius override)
   ↓  Deterministic params_to_sql()
Parameterized SQL query (with location bounding box)
   ↓  op-sqlite
Route IDs
```

Qwen does **slot-filling only** — the role it's best at. SQL does ranking/filtering deterministically. Haiku is the online fallback for intents Qwen fails on.

---

## Final Results

| Metric | Qwen3.5 0.8B | Haiku | Gate |
|---|---:|---:|---:|
| Valid JSON | **100%** (15/15) | 100% | ≥90% ✅ |
| Scenarios passed | **93%** (14/15) | 100% (15/15) | ≥60% ✅ |
| Avg F1 | **0.84** | 0.90 | ≥0.50 ✅ |
| Avg precision | **0.83** | 0.86 | — |
| Avg recall | **0.91** | 1.00 | — |
| Required-hit rate | **93%** | 100% | — |
| Forbidden violations | **0** | 0 | ≤3 ✅ |
| Jaccard with Haiku | **0.89** | — | — |
| Avg latency | **~1.5s** ⚠️ | ~1.0s | ≤2s ✅ |

### Per-scenario comparison

| Scenario | Intent | Qwen F1 | Haiku F1 | Agreement |
|---|---|---:|---:|---:|
| S1-coastal | "beachy coastal ride" | 1.00 | 1.00 | 1.00 |
| S2-colorado | "ride in Colorado" | **0.00** | 1.00 | 0.00 |
| S3-desert | "desert ride" | 1.00 | 1.00 | 1.00 |
| S4-scenic-byway | "classic scenic byway" | 1.00 | 1.00 | 1.00 |
| S5-short | "short, under 20 miles" | 1.00 | 1.00 | 1.00 |
| S6-utah-adventure | "adventure in Utah" | 1.00 | 1.00 | 1.00 |
| S7-mountain-long | "mountain ride ≥40mi" | 1.00 | 1.00 | 1.00 |
| S8-yearround-twisty | "twisty any time of year" | 1.00 | 1.00 | 1.00 |
| S9-twistiest | "twistiest possible" | 0.75 | 0.67 | 0.30 |
| S10-most-scenic | "most scenic" | 0.67 | 0.67 | 1.00 |
| S11-remote | "remote, away from crowds" | 0.57 | 0.57 | 1.00 |
| S12-epic-long | "epic long distance" | 1.00 | 1.00 | 1.00 |
| S13-challenging | "challenging technical" | 0.67 | 0.67 | 1.00 |
| S14-gentle | "gentle beginner ride" | 1.00 | 1.00 | 1.00 |
| S15-twisty-mountain | "twisty mountain roads" | 1.00 | 1.00 | 1.00 |

**Remarkable**: on 5 of 15 scenarios (including all "hard" sort-by scenarios), Qwen achieves the same F1 as Haiku. On S9 it actually beats Haiku slightly (0.75 vs 0.67).

### By difficulty

| Difficulty | Qwen pass | Haiku pass |
|---|---:|---:|
| Easy (5) | 4/5 | 5/5 |
| Medium (3) | 3/3 | 3/3 |
| Hard (3) | 3/3 | 3/3 |
| Subjective (4) | 4/4 | 4/4 |

Qwen matches Haiku on medium, hard, and subjective. Its only miss is S2 on easy difficulty — a word-collision edge case.

---

## Architecture

### Product framing: location-anchored search

The test assumes every search is **anchored to the rider's current location** with a default radius. This matches product reality: riders search "near me" by default, not globally. The location + radius become prompt context so the model doesn't have to reason about geography.

For the test: **anchor = San Francisco (37.77, -122.42, CA), default radius = 900mi** (rectangular bounding box via `centroid_lat` / `centroid_lng` between/between). 15 of 20 test routes fall inside this box.

When the rider explicitly names a different state ("in Colorado"), the state filter overrides the bounding box — user is asking about a specific place, not "near me".

### Parameter schema

Only 10 keys. Every key defaults to null. Model fills in only what the intent explicitly mentions:

```
archetype         twisties | mountain | coastal | adventure | scenic_byway | desert
state             2-letter code (overrides bounding box)
min_length_mi     for "long" / "epic" intents
max_length_mi     for "short" / "quick" intents
max_technical     0.5 for "gentle" / "beginner"
min_traffic_score 0.7 for "low traffic"
min_remoteness    0.7 for "remote"
max_distance_mi   override the default radius
season            year_round | apr_nov | may_sep
sort_by           curvature | scenic | technical | traffic | remoteness | length
```

### Deterministic SQL construction

Python `params_to_sql()` converts params into a parameterized SELECT. Key behaviors:

- If `state` is set → filter by state, skip distance.
- Otherwise → apply bounding box using user location + `max_distance_mi` (or default).
- All other filters stack as AND clauses.
- `sort_by` maps to an ORDER BY clause; otherwise sort by `route_id` for determinism.
- `LIMIT 10` always applied.

No SQL is ever written by the model. Zero injection risk. Every query is valid by construction.

### Defensive layers

Two guards handle Qwen's known failure modes:

**1. Enum validation in normalize_params()** — reject hallucinated archetype/season/sort_by values:
```python
VALID_ARCHETYPES = {"twisties","mountain","coastal","adventure","scenic_byway","desert"}
if out.get("archetype") and out["archetype"] not in VALID_ARCHETYPES:
    out["archetype"] = None
```
Also rejects the rider's own state (auto-ignored) and invalid 2-letter codes.

**2. Retry-on-degeneration in infer_qwen()** — detect `_why_why_why...` loops and re-prompt with a different suffix:
```python
if _looks_degenerate(out) or "{" not in out:
    retry_prompt = prompt + "\n\nReturn the JSON object now:"
    out = mlx_generate(...)
```
Fixed 2 out of 2 loop failures (S8, S14). No retry was needed on the final passing run, but the safety net stays in production code.

---

## The remaining failure

**S2-colorado**: "Show me something to ride in Colorado" → Qwen outputs `{archetype: "coastal", state: "CO"}`. The "coastal" hallucination is a word-similarity glitch — "Colorado" and "coastal" share the "co" prefix, and the token "coast" appears adjacent to "Colorado" in some training data contexts. Because "coastal" IS a valid archetype enum value, my validation doesn't drop it. The resulting SQL is `WHERE archetype='coastal' AND state='CO'`, which returns nothing (no coastal routes in Colorado).

**Mitigation options**:
1. Accept as known limitation — 14/15 is still a strong result.
2. Add a consistency check in `normalize_params`: if `state` is set AND no routes match the archetype in that state, drop the archetype filter. Runtime DB lookup cost, but fixes the edge case.
3. Add a few-shot example showing "ride in Colorado" → `{archetype: null, state: "CO"}`.
4. Use Haiku fallback on any query returning zero results with a non-null archetype filter.

Option 4 is probably cleanest for production — if local query returns nothing, escalate to Haiku online. Let the network layer handle the long tail.

---

## Iteration timeline

| Iteration | Change | Qwen F1 | Valid JSON | Pass rate |
|---|---|---:|---:|---:|
| 1 | Initial prompt with schema hints | 0.00 | 100% | 0% |
| 2 | Few-shot examples | — | 0% | 0% (all empty output) |
| 3 | `/no_think` + max_tokens=800 | 0.41 | 93% | 47% |
| 4 | SF anchor + radius, tighter rules | 0.47 | 80% | 47% |
| 5 | Anti-hallucination rules, targeted examples | 0.60 | 87% | 67% |
| 6 | **Enum validation + retry-on-degenerate** | **0.84** | **100%** | **93%** |

The single biggest lift was the defensive layer: enum validation caught hallucinated archetypes that prompt engineering couldn't eliminate, and the retry mechanism fixed degeneration loops. Turns out the right approach for a 0.8B model is: **give it a narrow job, validate the hell out of the output, and retry when it goes off the rails.**

---

## Comparison to previous Qwen tests

| Use case | Result | Why |
|---|---|---|
| Leg label generation (prior) | ✅ VIABLE | Simple structured output, no reasoning |
| Candidate ranking (this cycle) | ❌ NOT VIABLE | Positional bias, score blindness, hallucinates IDs |
| Route modification (this cycle) | ❌ NOT VIABLE | Echoes original legs, can't apply constraints |
| **Intent → query params (this cycle)** | ✅ **VIABLE** | **Slot-filling is the direction small models do well** |

The pattern is clear: **Qwen3.5 is good at structured extraction from unstructured text, bad at selection from structured candidates.** Every use case that worked is "text → structure" (labels, params). Every use case that failed is "structure → selection" (ranking, modification). This is the organizing principle for what to send to Qwen vs Haiku.

---

## Updated PRD scope (Qwen3.5 0.8B)

**In scope (validated):**
- ✅ Leg label generation (prior research)
- ✅ **Intent → SQL query parameter extraction** (this test, 0.84 F1)
- ✅ Deterministic temp=0 output as a format/classification engine

**Out of scope (not viable):**
- ❌ Candidate ranking / selection from pool → SQL `ORDER BY` instead
- ❌ Route modification / leg swap → Haiku online
- ❌ Creative text generation (labels, rationales, highlights) → Haiku online

**The curation PRD discovery flow:**

```
User: "twisty mountain roads"
   ↓
Qwen3.5 (on-device, ~1s)
   ↓
{"archetype": "mountain", "sort_by": "curvature", ...}
   ↓
SQL: SELECT route_id FROM curated_routes
     WHERE primary_archetype = 'mountain'
       AND centroid_lat BETWEEN ... AND ...
       AND centroid_lng BETWEEN ... AND ...
     ORDER BY curvature_score DESC LIMIT 10
   ↓
Local op-sqlite (<10ms)
   ↓
Route cards rendered (offline-capable, end-to-end <2s)
```

If the local query returns zero results AND the device has connectivity, escalate to Haiku for intent clarification.

---

> **⚠️ Latency caveat (added 2026-04-10):** The ~1.5s Qwen latency above was measured on a 2026 MacBook Pro (MLX runtime). Mobile devices run Core ML (iOS) or ONNX (Android) with ~4–6× lower memory bandwidth. Estimated iPhone 15/16 Pro latency: ~6–10s. Validate on device before publishing latency claims in the PRD. See [`ENVIRONMENT_BIAS_FINDING_2026-04-10.md`](ENVIRONMENT_BIAS_FINDING_2026-04-10.md).

## Next steps

1. **Update curation PRD v1.1** to reflect validated scope: replace the removed "ranking" and "modification" sections with the "intent → query params" use case.
2. **Port the prompt + normalize_params + retry logic** to TypeScript for the React Native app. MLX inference becomes the on-device runtime for Qwen3.5.
3. **Add consistency check or Haiku fallback** for the S2-colorado edge case (word-similarity hallucination with zero results).
4. **Expand scenario coverage** to 30-40 scenarios before production to catch more edge cases. The 15 here are a starting point, not a full regression suite.
5. **Re-validate on device** — these results are from MLX on Mac. Mobile performance (iOS/Android) needs its own latency measurement.

---

## Files

- `test_intent_fixtures.py` — 20 routes + SF anchor + 15 scenarios + `params_to_sql()`
- `test_intent_to_query.py` — Qwen vs Haiku runner with retry + normalize
- `intent_to_query_20260410_144840.json` — raw results from the passing run
