---
title: Qwen3.5 — Route Mutation Intent → Mapbox API Parameter Extraction
date: 2026-04-10
status: plan
hypothesis: slot-filling from mutation intent is viable; selection from alternates is not
prior-art: INTENT_TO_QUERY_RESULTS_2026-04-10.md (93% pass, ✅ VIABLE)
---

# Route Mutation Intent → Mapbox API Parameter Extraction

## Why This Test

The prior modification test (`test_route_modification.py`, result: ❌ NOT VIABLE) asked Qwen to
**select leg alternates from a structured pool** — "structure → selection." That's the pattern
Qwen consistently fails at.

This test targets a different pattern: **"text → structured API delta"** — the same slot-filling
task that achieved 93% pass rate in intent → SQL params. The difference:

| Prior test (❌) | This test (❓) |
|---|---|
| Input: 20 pre-scored leg objects | Input: natural language intent + route context |
| Task: pick the best ones | Task: extract what mutation ops to perform |
| Pattern: structure → selection | Pattern: text → structure |
| Qwen failure mode: echoes original, ignores constraints | Expected to work: same slot-fill Qwen succeeds at |

Qwen's job here is narrow: recognize op type and fill in a few discriminating fields
(`place_name`, `waypoint_index`, `feature`, `road_hint`). Deterministic code constructs
the actual Mapbox API call.

## Two Research Questions

**Q1 — Classification**: Can Qwen distinguish CREATE from UPDATE intent?

- Example CREATE: "Find me a ride to Santa Cruz" (no active route)
- Example UPDATE: "Can we avoid Highway 1?" (active route in context)

This is a three-class problem: `create | update | ambiguous`.

**Q2 — Parameter extraction**: Given an UPDATE intent + current route, can Qwen
slot-fill the correct Mapbox mutation op(s)?

- Op types: `add_waypoint | remove_waypoint | exclude_feature | avoid_road | trim_route | reorder_waypoints`
- Key fields per op type: place name, waypoint index, feature enum, road hint, etc.

## Output Schema

```json
{
  "intent_type": "create" | "update" | "ambiguous",
  "ops": [
    {
      "op": "add_waypoint",
      "place_name": "Pigeon Point Lighthouse",
      "insert_before_index": 2,
      "waypoint_index": null,
      "feature": null,
      "road_hint": null,
      "keep_through_index": null,
      "swap_indices": null
    }
  ]
}
```

`ops` is always an array. Multiple changes produce multiple ops. Empty for CREATE intents.

## Example Scenarios

```
CREATE — no active route:
  "Find me a ride to Santa Cruz"
  → {"intent_type": "create", "ops": []}

UPDATE — active route SF → Pescadero → Santa Cruz:
  "Can we avoid Highway 1?"
  → {"intent_type": "update", "ops": [{"op": "avoid_road", "road_hint": "Highway 1", ...nulls}]}

UPDATE:
  "Skip Pescadero, go straight to Santa Cruz"
  → {"intent_type": "update", "ops": [{"op": "remove_waypoint", "waypoint_index": 1, ...nulls}]}

UPDATE (multi-op):
  "No tolls and avoid the coastal highway"
  → {"intent_type": "update", "ops": [
       {"op": "exclude_feature", "feature": "toll", ...},
       {"op": "avoid_road", "road_hint": "Highway 1", ...}
     ]}

AMBIGUOUS:
  "Give me a different route"
  → {"intent_type": "ambiguous", "ops": []}
```

## Test Files

| File | Purpose |
|---|---|
| `test_mapbox_mutation_fixtures.py` | Route contexts, scenarios, scoring helpers |
| `test_mapbox_mutation.py` | Qwen + Haiku runner, both phases, gate evaluation |

## Scenario Breakdown

**Phase 1 — Classification (21 scenarios):**

| Class | Count | Examples |
|---|---|---|
| create | 7 | "Find me a ride to Santa Cruz", "Show me something twisty near Marin" |
| update | 11 | "Can we avoid Highway 1?", "Skip Pescadero", "Add a stop at Pigeon Point" |
| ambiguous | 3 | "Give me a different route", "Make it more scenic", "Try something else" |

**Phase 2 — Mutation extraction (20 scenarios):**

| Difficulty | Count | What's tested |
|---|---|---|
| Easy | 7 | Single explicit op: avoid named road, remove named stop, add named place, feature exclusion, trim |
| Medium | 7 | Inference required: "go through Half Moon Bay" (which index?), "back roads" (motorway exclude), generic coffee stop |
| Hard | 6 | Multi-op, swap, remove multiple, ambiguous extension |

Two route contexts used:
- **Route A**: SF → Pescadero → Santa Cruz (3 waypoints, Highway 1)
- **Route B**: SF → Mill Valley → Point Reyes → Bodega Bay (4 waypoints, US-101/CA-1)

## Success Gates

### Phase 1 — Classification

| Metric | Gate |
|---|---|
| Valid JSON rate | ≥90% |
| Classification accuracy | ≥80% |

### Phase 2 — Mutation extraction

| Metric | Gate |
|---|---|
| Valid JSON rate | ≥90% |
| Scenarios passed (F1≥0.5 & no forbidden) | ≥65% |
| Avg F1 | ≥0.60 |
| Forbidden violations | ≤3 total |

## Hypotheses Going In

From the prior research pattern:
- ✅ Works: "text → structure" (slot-filling, no reasoning about existing data)
- ❌ Fails: "structure → selection" (choosing from a pool)

Route mutation sits between these:

| Sub-task | Pattern | Predicted |
|---|---|---|
| Feature exclusion ("no tolls") | text → feature enum | ✅ Likely works |
| Add named waypoint ("add stop at Pigeon Point") | text → place + index | ✅ Likely works |
| Avoid named road ("avoid Highway 1") | text → road hint | ✅ Likely works |
| Remove named stop ("skip Pescadero") | text → waypoint index lookup | ⚠️ Needs index reasoning |
| Trim route ("end at Pescadero") | text → keep_through_index | ⚠️ Needs index reasoning |
| Multi-op ("no tolls AND avoid coast") | compound text → multiple ops | ⚠️ Qwen tends toward single ops |
| Reorder ("swap last two stops") | text → swap_indices pair | ❌ Likely fails |

Expected overall: viable for simple single-op mutations; degraded for index inference and multi-op.

## Running

```bash
cd .spec/research/local-models
source venv/bin/activate
export ANTHROPIC_API_KEY="$(grep ANTHROPIC_API_KEY ../../../.env.local | cut -d= -f2)"

# Full test, both phases, both models
venv/bin/python3 test_mapbox_mutation.py

# Phase 1 only (faster)
venv/bin/python3 test_mapbox_mutation.py --phase 1

# Qwen only (skip Haiku API calls)
venv/bin/python3 test_mapbox_mutation.py --qwen-only
```

Results saved to `mapbox_mutation_{timestamp}.json`. Write findings to
`MAPBOX_MUTATION_RESULTS_{date}.md` using the same format as
`INTENT_TO_QUERY_RESULTS_2026-04-10.md`.

## What the Results Will Decide

| Outcome | Decision |
|---|---|
| Both phases viable | Qwen handles classification + param extraction on-device. Haiku fallback only for zero-result cases. |
| Phase 1 viable, Phase 2 fails at hard | Qwen classifies intent; Haiku extracts params for mutations. Adds ~1s network latency for updates. |
| Phase 1 fails | Classification must go to Haiku. On-device Qwen only for intent → SQL (discovery). |
| Both fail | Route mutation is Haiku-only. Qwen scope stays: leg labels + discovery params. |
