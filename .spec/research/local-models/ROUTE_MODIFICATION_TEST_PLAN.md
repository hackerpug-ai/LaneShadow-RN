---
title: Qwen3.5 vs Haiku — Ranking & Route Modification Validation
date: 2026-04-10
status: plan
purpose: Validate two new capabilities beyond leg labels — candidate ranking at scale, and route segment modification — before committing curation PRD v1.1 to the local-model path.
---

# Qwen3.5 vs Haiku — Ranking & Route Modification Validation

## Why This Test Exists

The existing research (`SWARM_RESEARCH_SUMMARY.md`) validated Qwen3.5 0.8B for **leg label generation only**. Everything else failed (route labels, rationales, highlights — all creative text tasks). The curation PRD v1.1 proposes two **new** Qwen3.5 use cases that have never been tested:

1. **Ranking / selection from a candidate pool** (discovery flow)
   Prompt: 20 pre-scored ride cards + intent → JSON list of top-5 IDs

2. **Route segment modification** (the real reason for a local model)
   Prompt: existing multi-leg route + constraint like "avoid Highway 1" + alternate leg pool → JSON list of leg IDs with alternates substituted in

The second is where Qwen earns its slot: speed (<1s vs network round-trip), independence (offline), and customization that SQL can't express ("the highway from SF to Daly City is closed, what's an alternate?").

**Goal:** produce quantitative evidence of viability or failure for each path, plus a map of the **specific failure modes** the 0.8B model exhibits, so the PRD can gate the local-model scope on real data instead of hopeful prose.

---

## Design Principles

1. **Haiku is ground truth.** Every Qwen output is compared to Haiku's output on the same prompt. The question is parity — not absolute correctness, but whether Qwen makes the same call Haiku does.

2. **Load-test by candidate count.** We don't ask "does it work" — we ask "at what N does it stop working." Test with N = 5, 10, 20, 40, 60 candidates. The accuracy curve is the output, not a single number.

3. **Target known small-model failure modes.** Don't just measure pass/fail. Construct adversarial prompts that expose each failure mode so we know *why* it breaks:
   - **Positional bias** — picks top or bottom of list regardless of content
   - **Score blindness** — ignores numeric fields, ranks by prose
   - **Keyword attraction** — picks candidates whose *name* matches the intent even when *scores* contradict
   - **Distractor susceptibility** — picks irrelevant entries that sound related
   - **Hallucination** — returns IDs not in the candidate pool
   - **Count violation** — asked for 5 picks, returns 3 or 7
   - **Instruction inversion failure** — can't handle "worst" instead of "best"
   - **Duplicate output** — same ID picked twice
   - **JSON malformation** — returns prose or broken JSON
   - **Order instability** — same prompt at temperature=0 produces different outputs across runs

4. **Two test files, shared fixtures.** One file tests ranking + failure modes at scale. The other tests the route modification use case specifically. Both import from a single `test_fixtures.py` so candidate pools and scoring are consistent.

5. **All results saved to JSON** for later analysis. Human-readable Markdown summary written alongside.

---

## Test Files

| File | Purpose |
|---|---|
| `test_fixtures.py` | Shared candidate pool + route-with-alternates fixtures, intent-to-ground-truth mapping |
| `test_ranking_accuracy.py` | Scale accuracy, failure modes, Haiku parity, consistency at temperature=0 |
| `test_route_modification.py` | Highway avoidance, closure reroute, preference upgrade, multi-constraint — the actual PRD use cases |
| `analyze_ranking_results.py` | Post-run analysis → Markdown report with accuracy curves and failure mode table |

All follow the existing `test_all_microtasks.py` pattern: MLX local Qwen + Anthropic Haiku + JSON output + side-by-side comparison.

---

## Test 1 — Ranking Scale Accuracy

**Hypothesis:** Qwen3.5 accuracy degrades as candidate count grows. Find the knee of the curve.

### Setup

- **Candidate pool**: 60 ride segments (hand-crafted 20 "anchor" entries with known characteristics + 40 procedurally generated fillers). Each has `id`, `name`, `archetype`, `length_mi`, `scores{curvature, scenic, technical, traffic, remoteness}`, and a 10-word `one_liner`.
- **Intents tested** (4):
  - `"twisty sport roads"` — ground truth = top 5 by `curvature + archetype==twisties bonus`
  - `"scenic mountain ride"` — ground truth = top 5 by `scenic*0.6 + archetype==mountain bonus`
  - `"low traffic backroads"` — ground truth = top 5 by `traffic (inverted) + remoteness`
  - `"adventure dirt"` — ground truth = top 5 by `archetype==adventure bonus + technical`
- **Scales tested**: N ∈ {5, 10, 20, 40, 60}
- **Runs per (intent, N)**: 3 (to catch consistency at temperature=0)
- **Models**: Qwen3.5 0.8B (MLX) vs Haiku (Anthropic API)

**Total calls:** 4 intents × 5 scales × 3 runs × 2 models = **120 ranked responses**

### Metrics

| Metric | Definition |
|---|---|
| **Precision@5** | `|picks ∩ ground_truth_top_5| / 5` — how many of Qwen's picks are actually in the deterministic top 5 |
| **Overlap with Haiku** | `|qwen_picks ∩ haiku_picks| / 5` — agreement with the stronger model |
| **Hallucination rate** | `non-pool picks / total picks` — IDs returned that weren't in the input candidate set |
| **Count accuracy** | `|actual picks| == 5` — did it return the requested count |
| **Valid JSON rate** | `parseable picks / total calls` |
| **Consistency rate** | Across 3 runs of same prompt, `identical picks / 3` at temperature=0 |
| **Latency (P50, P95)** | Per scale N |

### Success Gates

| Metric | Acceptable | Deal-breaker |
|---|---|---|
| Precision@5 at N=20 | ≥0.60 | <0.40 |
| Overlap with Haiku at N=20 | ≥0.60 | <0.40 |
| Hallucination rate | 0% | >5% |
| Valid JSON rate | ≥95% | <90% |
| Consistency rate (temp=0) | ≥80% identical | <50% |
| Latency P95 at N=20 | ≤2s | >3s |

**If ranking fails at N=20**, drop the ranking use case entirely from the PRD. SQL `ORDER BY composite_score` is the fallback — it's boring but reliable.

---

## Test 2 — Failure Modes (Adversarial)

**Hypothesis:** 0.8B models exhibit specific, measurable failure modes. We identify which ones Qwen has so we know what to design around.

Each failure mode gets a purpose-built adversarial prompt. Each is tested 5 times to get a failure rate. Haiku is run against the same prompts for comparison.

### Failure Mode Tests

| Mode | Adversarial Prompt Design | Detection |
|---|---|---|
| **Positional bias** | Same 20 candidates, shuffled into 5 different orders, same intent | Stable picks → no bias. Picks correlate with position → bias. |
| **Score blindness** | 10 candidates in 5 pairs: each pair has identical `name` + `one_liner`, but different `curvature` scores (0.95 vs 0.30). Intent: "very twisty" | Prefers high-curvature half → score-aware. Random → score-blind. |
| **Keyword attraction** | 20 candidates. One named "Twisty Meadow Trail" with `curvature=0.15`. Most twisty actual candidate is "Pacific Coast Ridge" with `curvature=0.92`. Intent: "twisty" | Picks Pacific Coast Ridge → OK. Picks Twisty Meadow → keyword-biased. |
| **Distractor susceptibility** | 19 ride segments + 1 obvious non-ride ("Lunch spot at mile 12 with good views"). Intent: "best scenic ride" | Non-ride not picked → OK. Non-ride in picks → susceptible. |
| **Count violation** | Ask for top K where K ∈ {3, 5, 7, 10} | `len(picks) == K` for each |
| **Hallucination** | Standard ranking prompts, check every pick against candidate pool | Any ID not in input set |
| **Instruction inversion** | "Return the 5 WORST candidates for a scenic ride" | Is it the inverted top 5? |
| **Duplicate output** | Standard ranking prompts, check `len(set(picks)) == len(picks)` | Any duplicates at all |
| **JSON malformation** | Standard prompts, strict JSON parse | Parse success rate |
| **Order instability** | Same prompt, temperature=0, 10 runs | All runs identical? |

### Output

A **failure mode matrix**: rows = modes, columns = Qwen vs Haiku failure rate. Each cell is a percentage. This is the table the PRD decision rests on.

---

## Test 3 — Route Modification (the Real Use Case)

**Hypothesis:** Even if ranking is shaky, modification is a narrower task with a smaller candidate pool and a clearer constraint. This is where a 0.8B model might actually be useful.

### Setup: SF → Santa Cruz route with alternates

A realistic 5-leg route with 2–3 alternate segments per leg. Each alternate carries structured fields: `highway: bool`, `distance_mi`, `curvature`, `scenic_score`, `traffic_score`, `toll: bool`, `surface`.

**Example structure** (full fixture in `test_fixtures.py`):
```
Route: SF → Santa Cruz (primary legs, all on Highway 1 by default)
  Leg 1: SF → Daly City via Highway 1
  Leg 2: Daly City → Half Moon Bay via Highway 1
  Leg 3: Half Moon Bay → Pescadero via Highway 1
  Leg 4: Pescadero → Davenport via Highway 1
  Leg 5: Davenport → Santa Cruz via Highway 1

Alternates per leg: 2-3 options with non-highway, toll-free, scenic, etc.
```

### Test Scenarios

| ID | Constraint | Success Criterion |
|---|---|---|
| **M1** | "Avoid Highway 1" | All returned legs have `highway == false` OR are non-Highway-1 alternates |
| **M2** | "Leg 3 (Half Moon Bay → Pescadero) is closed for construction" | Returned legs for that segment use an alternate, other legs unchanged |
| **M3** | "Make it more scenic" | Returned alternates have higher `scenic_score` than originals |
| **M4** | "Shorter" | Total `distance_mi` of returned route is less than original |
| **M5** | "No toll roads AND more scenic" | Returned alternates satisfy both constraints |
| **M6** | "Skip legs 2 and 4 using alternates, keep everything else" | Exact surgical swap |
| **M7** | "I want the twistiest possible version" | Returned alternates all have higher `curvature` than originals |

### Metrics (per scenario, per model)

| Metric | Definition |
|---|---|
| **Valid JSON rate** | Parseable output |
| **ID fidelity** | All returned leg IDs exist in the alternates pool or original legs |
| **Leg count preserved** | Returned route has same number of legs as original |
| **Connectivity preserved** | Each leg's `to` matches the next leg's `from` (no broken route) |
| **Constraint adherence** | Rule-based check per scenario (e.g., no highway legs if constraint was "avoid highway") |
| **Overlap with Haiku** | Do Qwen and Haiku agree on the modification? |
| **Latency** | Per call |

### Success Gates

| Metric | Acceptable | Deal-breaker |
|---|---|---|
| Valid JSON rate | ≥95% | <90% |
| ID fidelity | 100% | any hallucination |
| Leg count preserved | 100% | any miscount |
| Connectivity preserved | ≥95% | <80% |
| Constraint adherence | ≥80% | <60% |
| Latency P95 | ≤2s | >3s |

**If modification works at ≥80% constraint adherence**, Qwen3.5 earns its place in the PRD even if ranking fails. Modification is the strategic use case.

---

## Test 4 — Consistency (Temperature = 0)

**Hypothesis:** At temperature=0, the same prompt should produce the same output every time. If not, the "consistency" promise of the PRD is broken.

- Pick 10 random prompts from Tests 1 and 3
- Run each 10 times at temperature=0
- Measure: `|distinct outputs| == 1` per prompt

**Gate:** at least 8 of 10 prompts must produce identical output across all 10 runs.

---

## Running the Tests

```bash
# From project root
cd .spec/research/local-models

# Activate existing venv
source venv/bin/activate

# Set API key for Haiku comparison
export ANTHROPIC_API_KEY="$(grep ANTHROPIC_API_KEY ../../../.env.local | cut -d= -f2)"

# Run ranking + failure mode validation
python test_ranking_accuracy.py

# Run route modification validation
python test_route_modification.py

# Generate human-readable report from both result JSONs
python analyze_ranking_results.py
```

Each test writes results to a timestamped JSON file in this directory.

---

## What the Results Will Answer

1. **Can Qwen3.5 rank from a candidate pool?** → Precision@5 curve vs N
2. **At what scale does it break?** → Knee of the accuracy curve
3. **What specific mistakes does it make?** → Failure mode matrix
4. **Can it handle route modification?** → M1–M7 pass rates
5. **Is it deterministic at temperature=0?** → Consistency gate
6. **Is it faster than Haiku?** → Latency P50/P95 comparison
7. **Does it agree with Haiku?** → Overlap percentages

---

## What We Will Decide After

| Outcome | Decision |
|---|---|
| Ranking passes gates AND modification passes gates | Keep both in PRD v1.1 as designed |
| Ranking fails AND modification passes | Drop ranking from PRD, keep Qwen only for modification. Discovery uses pure SQL `ORDER BY`. |
| Ranking passes AND modification fails | Unlikely, but: keep ranking, escalate modification to Haiku |
| Both fail | Drop Qwen3.5 from the curation PRD entirely. Leg labels only (existing scope). All discovery is SQL, all modification is Haiku. |

The test is a decision tool, not a formality. Whatever the results say, the PRD adjusts.
