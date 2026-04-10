#!/usr/bin/env python3
"""
Decomposed route mutation: Option A (sequential 2-pass) vs Option B (parallel probes).
Compares both against the Haiku single-pass baseline on the same 20 MUTATION_SCENARIOS.

Option A — Sequential:
  Pass 1: intent_type + op_types[] (flat JSON, string array)
  Pass 2: one targeted extraction prompt per op type (run in parallel on device,
          or sequentially if only one model instance available)
  Deterministic: map waypoint names → indices, assemble final ops

Option B — Parallel probes:
  6 independent yes/no + params probes (one per op type)
  Filter applies=true results
  Deterministic: same name→index map, assemble ops

Haiku baseline: single-pass prompt from test_mapbox_mutation.py

Latency reporting:
  sequential_s: actual wall time (all Qwen calls one-after-another)
  parallel_s:   theoretical time if independent calls ran truly in parallel
                = max(individual call latencies) for Option B
                = pass1 + max(pass2 per op) for Option A

Run:
  source venv/bin/activate
  export ANTHROPIC_API_KEY=...
  venv/bin/python3 test_decomposed_mutation.py [--qwen-only] [--skip-haiku]
"""
import argparse
import json
import os
import re
import time
from datetime import datetime
from pathlib import Path

try:
    from mlx_lm import load, generate as mlx_generate
except ImportError:
    raise SystemExit("mlx-lm not installed.")

try:
    import anthropic
except ImportError:
    raise SystemExit("anthropic not installed.")

from test_mapbox_mutation_fixtures import (
    MUTATION_SCENARIOS,
    ROUTE_A, ROUTE_B,
    FEATURES, OP_TYPES,
    score_mutation,
)

# Reuse the single-pass prompt + haiku logic from the original test
from test_mapbox_mutation import (
    build_mutation_prompt as build_singlepass_prompt,
    normalize_output,
    infer_haiku as _infer_haiku,
)

QWEN_MODEL  = "mlx-community/Qwen3.5-0.8B-OptiQ-4bit"
HAIKU_MODEL = "claude-haiku-4-5-20251001"

VALID_OP_TYPES = list(OP_TYPES)
VALID_FEATURES = list(FEATURES)


# ─────────────────────────────────────────────────────────────────────────────
# Shared helpers
# ─────────────────────────────────────────────────────────────────────────────

def fmt_waypoints(route: dict) -> str:
    return "\n".join(
        f"  {wp['index']}: {wp['name']}  [{wp['role']}]"
        for wp in route["waypoints"]
    )


def _extract_json(text: str) -> dict | None:
    """Extract first balanced {…} object from text (handles Qwen repetition loops)."""
    text = re.sub(r"```(?:json)?\s*", "", text).replace("```", "")
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    in_str = False
    escape = False
    for i, ch in enumerate(text[start:], start):
        if escape:
            escape = False; continue
        if ch == "\\" and in_str:
            escape = True; continue
        if ch == '"':
            in_str = not in_str; continue
        if in_str:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    parsed = json.loads(text[start:i+1])
                    return parsed if isinstance(parsed, dict) else None
                except Exception:
                    return None
    return None


def _looks_degenerate(text: str) -> bool:
    if not text or len(text) < 10:
        return True
    for m in re.finditer(r'(\w{3,15})\1{5,}', text):
        if len(m.group(0)) > len(text) * 0.4:
            return True
    return False


def infer_qwen(model, tokenizer, prompt: str, max_tokens: int = 200) -> tuple[str, float]:
    t0 = time.time()
    out = mlx_generate(model, tokenizer, prompt=prompt + " /no_think", max_tokens=max_tokens, verbose=False)
    if _looks_degenerate(out) or "{" not in out:
        out = mlx_generate(model, tokenizer, prompt=prompt + "\n\nReturn the JSON object now:", max_tokens=max_tokens, verbose=False)
    return out, time.time() - t0


# Name → index lookup from route
def name_to_index(name: str, route: dict) -> int | None:
    if not name:
        return None
    name_lower = name.lower()
    for wp in route["waypoints"]:
        if name_lower in wp["name"].lower() or wp["name"].lower() in name_lower:
            return wp["index"]
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Option A — Sequential 2-pass
# ─────────────────────────────────────────────────────────────────────────────

def build_a_pass1_prompt(intent: str, route: dict) -> str:
    wps = fmt_waypoints(route)
    return f"""You identify what kind of route change a rider is requesting.

Current route waypoints:
{wps}

OUTPUT a JSON with exactly these two keys:
  intent_type   "update" (the rider is changing the route) or "create" (wants a new route)
  op_types      array of operation names from this list, in order:
                "add_waypoint" | "remove_waypoint" | "exclude_feature"
                | "avoid_road" | "trim_route" | "reorder_waypoints"

RULES:
1. intent_type "create" = rider wants a brand new route, ignore the current one.
2. intent_type "update" = rider wants to CHANGE the current route.
3. op_types lists ALL the changes requested, in the order they appear in the intent.
4. If intent_type is "create", op_types MUST be [].
5. Do NOT add op types that were not requested.

EXAMPLES:
Intent: "Can we avoid Highway 1?"
{{"intent_type": "update", "op_types": ["avoid_road"]}}

Intent: "Skip Pescadero, go straight to Santa Cruz"
{{"intent_type": "update", "op_types": ["remove_waypoint"]}}

Intent: "No tolls AND avoid the coastal highway"
{{"intent_type": "update", "op_types": ["exclude_feature", "avoid_road"]}}

Intent: "Add a stop at Pigeon Point Lighthouse before Santa Cruz"
{{"intent_type": "update", "op_types": ["add_waypoint"]}}

Intent: "End the ride at Pescadero"
{{"intent_type": "update", "op_types": ["trim_route"]}}

Intent: "Find me a ride to Santa Cruz" (no active route)
{{"intent_type": "create", "op_types": []}}

Now output JSON only. No explanation.

Intent: "{intent}"
JSON:"""


def build_a_pass2_add_waypoint(intent: str, route: dict) -> str:
    wps = fmt_waypoints(route)
    names = [wp["name"] for wp in route["waypoints"]]
    return f"""The rider wants to ADD A STOP to this route.

Current waypoints:
{wps}

Intent: "{intent}"

OUTPUT JSON with:
  place_name          the place to add (string)
  insert_before_name  the waypoint it should come BEFORE (must be one of {names}),
                      or null to APPEND at the end of the route

JSON:"""


def build_a_pass2_remove_waypoint(intent: str, route: dict) -> str:
    wps = fmt_waypoints(route)
    names = [wp["name"] for wp in route["waypoints"] if wp["role"] not in ("start",)]
    return f"""The rider wants to REMOVE A STOP from this route.

Current waypoints:
{wps}

Intent: "{intent}"

Which waypoint should be removed? Choose the name from the list above.
OUTPUT JSON with:
  remove_name   the name of the waypoint to remove

JSON:"""


def build_a_pass2_exclude_feature(intent: str) -> str:
    return f"""The rider wants to EXCLUDE a road feature type.

Intent: "{intent}"

Which feature should be excluded?
  toll      = no toll roads or toll bridges
  motorway  = no major highways, take back roads
  ferry     = no ferry crossings
  unpaved   = paved roads only

OUTPUT JSON with:
  feature   one of: toll | motorway | ferry | unpaved

JSON:"""


def build_a_pass2_avoid_road(intent: str) -> str:
    return f"""The rider wants to AVOID A SPECIFIC ROAD.

Intent: "{intent}"

What road name or road description should be avoided?
OUTPUT JSON with:
  road_hint   the road name or description

JSON:"""


def build_a_pass2_trim_route(intent: str, route: dict) -> str:
    wps = fmt_waypoints(route)
    non_start = [wp["name"] for wp in route["waypoints"]]
    return f"""The rider wants to END THE ROUTE EARLY.

Current waypoints:
{wps}

Intent: "{intent}"

Which is the LAST waypoint to KEEP? Choose from: {non_start}
OUTPUT JSON with:
  keep_through_name   the name of the last waypoint to keep

JSON:"""


def build_a_pass2_reorder(intent: str, route: dict) -> str:
    wps = fmt_waypoints(route)
    names = [wp["name"] for wp in route["waypoints"]]
    return f"""The rider wants to SWAP THE ORDER of two waypoints.

Current waypoints:
{wps}

Intent: "{intent}"

Which two waypoint names should be swapped? Choose from: {names}
OUTPUT JSON with:
  swap_name_1   first waypoint name
  swap_name_2   second waypoint name

JSON:"""


def run_option_a_scenario(s: dict, infer_fn) -> dict:
    """Run Option A (2-pass sequential) for one scenario."""
    route = s["route"]
    intent = s["intent"]

    # Pass 1 — classify + enumerate op_types
    t_start = time.time()
    p1_text, p1_latency = infer_fn(build_a_pass1_prompt(intent, route), max_tokens=150)
    p1_parsed = _extract_json(p1_text)

    if not p1_parsed:
        total_s = time.time() - t_start
        return {
            "valid_json": False, "pass1_valid": False,
            "sequential_s": total_s, "parallel_s": total_s,
            "pass1_latency": p1_latency, "pass2_latencies": [],
            "model_ops": None, "metrics": score_mutation(None, s),
        }

    intent_type = p1_parsed.get("intent_type", "update")
    op_types_raw = p1_parsed.get("op_types", [])
    # Validate: only known op types
    op_types = [o for o in (op_types_raw or []) if o in OP_TYPES]

    # Pass 2 — targeted extraction per op type (run sequentially, record each latency)
    pass2_latencies = []
    assembled_ops = []

    for op_type in op_types:
        if op_type == "add_waypoint":
            prompt = build_a_pass2_add_waypoint(intent, route)
            text, lat = infer_fn(prompt, max_tokens=100)
            p = _extract_json(text)
            pass2_latencies.append(lat)
            if p:
                place = p.get("place_name")
                before_name = p.get("insert_before_name")
                before_idx = name_to_index(before_name, route) if before_name else None
                assembled_ops.append({
                    "op": "add_waypoint",
                    "place_name": place,
                    "insert_before_index": before_idx,
                    "waypoint_index": None, "feature": None,
                    "road_hint": None, "keep_through_index": None, "swap_indices": None,
                })

        elif op_type == "remove_waypoint":
            prompt = build_a_pass2_remove_waypoint(intent, route)
            text, lat = infer_fn(prompt, max_tokens=80)
            p = _extract_json(text)
            pass2_latencies.append(lat)
            if p:
                remove_name = p.get("remove_name")
                idx = name_to_index(remove_name, route)
                assembled_ops.append({
                    "op": "remove_waypoint",
                    "waypoint_index": idx,
                    "place_name": None, "insert_before_index": None,
                    "feature": None, "road_hint": None,
                    "keep_through_index": None, "swap_indices": None,
                })

        elif op_type == "exclude_feature":
            prompt = build_a_pass2_exclude_feature(intent)
            text, lat = infer_fn(prompt, max_tokens=60)
            p = _extract_json(text)
            pass2_latencies.append(lat)
            if p:
                feature = p.get("feature")
                if feature not in FEATURES:
                    feature = None
                assembled_ops.append({
                    "op": "exclude_feature",
                    "feature": feature,
                    "waypoint_index": None, "insert_before_index": None,
                    "place_name": None, "road_hint": None,
                    "keep_through_index": None, "swap_indices": None,
                })

        elif op_type == "avoid_road":
            prompt = build_a_pass2_avoid_road(intent)
            text, lat = infer_fn(prompt, max_tokens=80)
            p = _extract_json(text)
            pass2_latencies.append(lat)
            if p:
                assembled_ops.append({
                    "op": "avoid_road",
                    "road_hint": p.get("road_hint"),
                    "waypoint_index": None, "insert_before_index": None,
                    "place_name": None, "feature": None,
                    "keep_through_index": None, "swap_indices": None,
                })

        elif op_type == "trim_route":
            prompt = build_a_pass2_trim_route(intent, route)
            text, lat = infer_fn(prompt, max_tokens=80)
            p = _extract_json(text)
            pass2_latencies.append(lat)
            if p:
                keep_name = p.get("keep_through_name")
                keep_idx = name_to_index(keep_name, route)
                assembled_ops.append({
                    "op": "trim_route",
                    "keep_through_index": keep_idx,
                    "waypoint_index": None, "insert_before_index": None,
                    "place_name": None, "feature": None,
                    "road_hint": None, "swap_indices": None,
                })

        elif op_type == "reorder_waypoints":
            prompt = build_a_pass2_reorder(intent, route)
            text, lat = infer_fn(prompt, max_tokens=100)
            p = _extract_json(text)
            pass2_latencies.append(lat)
            if p:
                n1 = name_to_index(p.get("swap_name_1"), route)
                n2 = name_to_index(p.get("swap_name_2"), route)
                swap = [n1, n2] if (n1 is not None and n2 is not None) else None
                assembled_ops.append({
                    "op": "reorder_waypoints",
                    "swap_indices": swap,
                    "waypoint_index": None, "insert_before_index": None,
                    "place_name": None, "feature": None,
                    "road_hint": None, "keep_through_index": None,
                })

    sequential_s = time.time() - t_start
    # Theoretical parallel: pass1 + max(pass2 latencies) if pass2 had true parallelism
    parallel_s = p1_latency + (max(pass2_latencies) if pass2_latencies else 0)

    model_ops = assembled_ops if assembled_ops else None
    return {
        "valid_json": True,
        "pass1_valid": True,
        "intent_type": intent_type,
        "op_types_raw": op_types_raw,
        "op_types_valid": op_types,
        "pass1_latency": round(p1_latency, 2),
        "pass2_latencies": [round(l, 2) for l in pass2_latencies],
        "sequential_s": round(sequential_s, 2),
        "parallel_s": round(parallel_s, 2),
        "model_ops": assembled_ops,
        "metrics": score_mutation(model_ops, s),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Option B — Parallel probes (6 independent yes/no + params)
# ─────────────────────────────────────────────────────────────────────────────

PROBE_DEFS = [
    {
        "op": "avoid_road",
        "question": "Does the rider want to AVOID A SPECIFIC NAMED ROAD (e.g. Highway 1, Route 66)?",
        "note": "Only applies if a road NAME is mentioned. NOT for generic 'avoid highways'.",
        "fields": {"applies": "true | false", "road_hint": "road name or null"},
        "max_tokens": 80,
    },
    {
        "op": "exclude_feature",
        "question": "Does the rider want to EXCLUDE A TYPE OF ROAD FEATURE?",
        "note": "toll = no toll roads  |  motorway = no major highways  |  ferry = no ferries  |  unpaved = paved only",
        "fields": {"applies": "true | false", "feature": "toll | motorway | ferry | unpaved | null"},
        "max_tokens": 80,
    },
    {
        "op": "add_waypoint",
        "question": "Does the rider want to ADD A NEW STOP to the route?",
        "note": "Adding any place, coffee stop, landmark, or waypoint counts.",
        "fields": {"applies": "true | false", "place_name": "place name or null", "insert_before_name": "waypoint name or null (null = append at end)"},
        "max_tokens": 120,
    },
    {
        "op": "remove_waypoint",
        "question": "Does the rider want to SKIP OR REMOVE AN EXISTING STOP?",
        "note": "Only applies when removing a stop that is already in the route.",
        "fields": {"applies": "true | false", "remove_name": "waypoint name or null"},
        "max_tokens": 80,
    },
    {
        "op": "trim_route",
        "question": "Does the rider want to END THE ROUTE EARLY, cutting off one or more final destinations?",
        "note": "Phrases like 'end at X', 'cut the trip short at X', 'skip the last stop'.",
        "fields": {"applies": "true | false", "keep_through_name": "last waypoint to keep, or null"},
        "max_tokens": 80,
    },
    {
        "op": "reorder_waypoints",
        "question": "Does the rider want to SWAP THE ORDER of two existing stops?",
        "note": "Phrases like 'go to Y first then X', 'reverse the order', 'swap X and Y'.",
        "fields": {"applies": "true | false", "swap_name_1": "first waypoint or null", "swap_name_2": "second waypoint or null"},
        "max_tokens": 100,
    },
]


def build_b_probe_prompt(probe: dict, intent: str, route: dict) -> str:
    wps = fmt_waypoints(route)
    field_lines = "\n".join(f"  {k}   {v}" for k, v in probe["fields"].items())
    return f"""{probe['question']}
{probe['note']}

Current route waypoints:
{wps}

Intent: "{intent}"

OUTPUT JSON with:
{field_lines}

JSON:"""


def run_option_b_scenario(s: dict, infer_fn) -> dict:
    """Run Option B (6 independent probes) for one scenario."""
    route = s["route"]
    intent = s["intent"]

    t_start = time.time()
    probe_results = []

    for probe in PROBE_DEFS:
        prompt = build_b_probe_prompt(probe, intent, route)
        text, lat = infer_fn(prompt, max_tokens=probe["max_tokens"])
        p = _extract_json(text)

        applies = bool(p and str(p.get("applies", "")).lower() in ("true", "1", "yes"))

        probe_results.append({
            "op": probe["op"],
            "raw": text.strip()[:150],
            "parsed": p,
            "applies": applies,
            "latency": round(lat, 2),
        })

    sequential_s = time.time() - t_start
    # Theoretical parallel = max latency among all 6 probes
    parallel_s = max(r["latency"] for r in probe_results)

    # Assemble ops from probes that returned applies=true
    assembled_ops = []
    for pr in probe_results:
        if not pr["applies"]:
            continue
        p = pr["parsed"]
        op = pr["op"]

        if op == "add_waypoint":
            place = p.get("place_name")
            before_name = p.get("insert_before_name")
            before_idx = name_to_index(before_name, route) if before_name else None
            assembled_ops.append({
                "op": "add_waypoint",
                "place_name": place,
                "insert_before_index": before_idx,
                "waypoint_index": None, "feature": None,
                "road_hint": None, "keep_through_index": None, "swap_indices": None,
            })
        elif op == "remove_waypoint":
            remove_name = p.get("remove_name")
            idx = name_to_index(remove_name, route)
            assembled_ops.append({
                "op": "remove_waypoint",
                "waypoint_index": idx,
                "place_name": None, "insert_before_index": None,
                "feature": None, "road_hint": None,
                "keep_through_index": None, "swap_indices": None,
            })
        elif op == "exclude_feature":
            feature = p.get("feature")
            if feature not in FEATURES:
                feature = None
            assembled_ops.append({
                "op": "exclude_feature",
                "feature": feature,
                "waypoint_index": None, "insert_before_index": None,
                "place_name": None, "road_hint": None,
                "keep_through_index": None, "swap_indices": None,
            })
        elif op == "avoid_road":
            assembled_ops.append({
                "op": "avoid_road",
                "road_hint": p.get("road_hint"),
                "waypoint_index": None, "insert_before_index": None,
                "place_name": None, "feature": None,
                "keep_through_index": None, "swap_indices": None,
            })
        elif op == "trim_route":
            keep_name = p.get("keep_through_name")
            keep_idx = name_to_index(keep_name, route)
            assembled_ops.append({
                "op": "trim_route",
                "keep_through_index": keep_idx,
                "waypoint_index": None, "insert_before_index": None,
                "place_name": None, "feature": None,
                "road_hint": None, "swap_indices": None,
            })
        elif op == "reorder_waypoints":
            n1 = name_to_index(p.get("swap_name_1"), route)
            n2 = name_to_index(p.get("swap_name_2"), route)
            swap = [n1, n2] if (n1 is not None and n2 is not None) else None
            assembled_ops.append({
                "op": "reorder_waypoints",
                "swap_indices": swap,
                "waypoint_index": None, "insert_before_index": None,
                "place_name": None, "feature": None,
                "road_hint": None, "keep_through_index": None,
            })

    model_ops = assembled_ops if assembled_ops else None

    false_positive_count = sum(
        1 for pr in probe_results
        if pr["applies"]
        and pr["op"] not in {o["op"] for o in assembled_ops}
    )

    return {
        "valid_json": True,
        "probe_results": probe_results,
        "probes_fired": [pr["op"] for pr in probe_results if pr["applies"]],
        "sequential_s": round(sequential_s, 2),
        "parallel_s": round(parallel_s, 2),
        "model_ops": assembled_ops,
        "metrics": score_mutation(model_ops, s),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Haiku single-pass baseline
# ─────────────────────────────────────────────────────────────────────────────

def run_haiku_scenario(s: dict, haiku_client) -> dict:
    prompt = build_singlepass_prompt(s["intent"], s["route"])
    t0 = time.time()
    text, lat = _infer_haiku(haiku_client, prompt)
    sequential_s = time.time() - t0

    parsed = _extract_json(text)
    normed = normalize_output(parsed) if parsed else {}
    model_ops = normed.get("ops") if normed else None

    return {
        "valid_json": parsed is not None,
        "sequential_s": round(sequential_s, 2),
        "parallel_s": round(sequential_s, 2),  # single pass, no parallelism
        "model_ops": model_ops,
        "metrics": score_mutation(model_ops, s),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Runner + reporting
# ─────────────────────────────────────────────────────────────────────────────

def run_approach(label: str, scenario_fn, scenarios: list) -> list[dict]:
    print(f"\n{'='*72}")
    print(f"{label}")
    print("="*72)
    results = []
    for s in scenarios:
        r = scenario_fn(s)
        m = r["metrics"]
        seq = r["sequential_s"]
        par = r["parallel_s"]
        icon = "✅" if m["f1"] >= 0.5 and m["forbidden_violations"] == 0 else (
               "⚠️ " if m["f1"] >= 0.3 else "❌")
        print(f"  [{s['id']:<22}] {icon} F1={m['f1']:.2f} "
              f"req={m['required_hit_rate']:.0%} "
              f"fbd={m['forbidden_violations']} "
              f"seq={seq:.1f}s par={par:.1f}s")
        results.append({"scenario": s, **r})
    return results


def summarize_approach(label: str, rows: list[dict]) -> dict:
    n = len(rows)
    valid   = sum(1 for r in rows if r["valid_json"])
    passes  = sum(1 for r in rows if r["metrics"]["f1"] >= 0.5 and r["metrics"]["forbidden_violations"] == 0)
    f1_vals = [r["metrics"]["f1"] for r in rows]
    req_hits= [r["metrics"]["required_hit_rate"] for r in rows]
    fbd     = sum(r["metrics"]["forbidden_violations"] for r in rows)
    seq_lats= [r["sequential_s"] for r in rows]
    par_lats= [r["parallel_s"] for r in rows]

    avg_f1   = sum(f1_vals) / n if n else 0
    avg_req  = sum(req_hits) / n if n else 0
    avg_seq  = sum(seq_lats) / n if n else 0
    avg_par  = sum(par_lats) / n if n else 0
    p95_seq  = sorted(seq_lats)[int(n * 0.95)] if n else 0

    print(f"\n── {label} ──")
    print(f"  Valid JSON:     {valid}/{n} ({valid/n:.0%})")
    print(f"  Passed (F1≥0.5): {passes}/{n} ({passes/n:.0%})")
    print(f"  Avg F1:          {avg_f1:.2f}")
    print(f"  Avg req-hit:     {avg_req:.0%}")
    print(f"  Forbidden:       {fbd} total")
    print(f"  Latency avg:     seq={avg_seq:.1f}s  parallel={avg_par:.1f}s")
    print(f"  Latency P95:     seq={p95_seq:.1f}s")

    by_diff = {}
    for diff in ["easy", "medium", "hard"]:
        sub = [r for r in rows if r["scenario"]["difficulty"] == diff]
        if not sub:
            continue
        sp = sum(1 for r in sub if r["metrics"]["f1"] >= 0.5 and r["metrics"]["forbidden_violations"] == 0)
        sf = sum(r["metrics"]["f1"] for r in sub) / len(sub)
        sl = sum(r["sequential_s"] for r in sub) / len(sub)
        pl = sum(r["parallel_s"] for r in sub) / len(sub)
        print(f"    {diff:8s}: {sp}/{len(sub)} pass, avg F1={sf:.2f}, seq={sl:.1f}s par={pl:.1f}s")
        by_diff[diff] = {"pass": sp, "n": len(sub), "avg_f1": round(sf, 3)}

    return {
        "label": label,
        "valid_json_rate": valid / n if n else 0,
        "pass_rate": passes / n if n else 0,
        "avg_f1": round(avg_f1, 3),
        "avg_req_hit": round(avg_req, 3),
        "forbidden_total": fbd,
        "avg_seq_s": round(avg_seq, 2),
        "avg_par_s": round(avg_par, 2),
        "p95_seq_s": round(p95_seq, 2),
        "by_difficulty": by_diff,
    }


def print_comparison_table(summaries: list[dict]):
    print(f"\n{'='*72}")
    print("COMPARISON TABLE")
    print("="*72)
    hdr = f"{'Approach':<30} {'Pass%':>6} {'AvgF1':>6} {'Forbid':>6} {'Seq(avg)':>9} {'Par(avg)':>9}"
    print(hdr)
    print("-" * len(hdr))
    for s in summaries:
        print(f"  {s['label']:<28} {s['pass_rate']:>6.0%} {s['avg_f1']:>6.2f} "
              f"{s['forbidden_total']:>6} {s['avg_seq_s']:>8.1f}s {s['avg_par_s']:>8.1f}s")
    print()
    print("Gates: pass_rate ≥65%, avg_f1 ≥0.60, forbidden ≤3")
    for s in summaries:
        viable = (
            s["pass_rate"] >= 0.65
            and s["avg_f1"] >= 0.60
            and s["forbidden_total"] <= 3
        )
        print(f"  {s['label']:<30} → {'✅ VIABLE' if viable else '❌ NOT VIABLE'}")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--qwen-only", action="store_true")
    parser.add_argument("--skip-haiku", action="store_true")
    args = parser.parse_args()

    scenarios = MUTATION_SCENARIOS
    print(f"🏍  Decomposed mutation: Option A vs Option B vs Haiku baseline")
    print(f"    Scenarios: {len(scenarios)}")

    # Load env
    env_path = Path(".env.local")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

    # Load Qwen
    print("\n📦 Loading Qwen3.5 0.8B (MLX)...")
    qwen_model, qwen_tok = load(QWEN_MODEL)

    def qwen_infer(prompt, max_tokens=200):
        return infer_qwen(qwen_model, qwen_tok, prompt, max_tokens)

    summaries = []

    # Option A
    a_rows = run_approach(
        "Option A — Sequential 2-pass (Qwen)",
        lambda s: run_option_a_scenario(s, qwen_infer),
        scenarios,
    )
    summaries.append(summarize_approach("Option A: Sequential (Qwen)", a_rows))

    # Option B
    b_rows = run_approach(
        "Option B — Parallel probes (Qwen)",
        lambda s: run_option_b_scenario(s, qwen_infer),
        scenarios,
    )
    summaries.append(summarize_approach("Option B: Parallel probes (Qwen)", b_rows))

    # Haiku baseline
    if not (args.qwen_only or args.skip_haiku):
        haiku_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        h_rows = run_approach(
            "Haiku — Single-pass baseline",
            lambda s: run_haiku_scenario(s, haiku_client),
            scenarios,
        )
        summaries.append(summarize_approach("Haiku: Single-pass", h_rows))

    print_comparison_table(summaries)

    # Save
    output = {
        "test_type": "decomposed_mutation_comparison",
        "date": datetime.now().isoformat(),
        "qwen_model": QWEN_MODEL,
        "haiku_model": HAIKU_MODEL,
        "scenarios_count": len(scenarios),
        "option_a": {
            "rows": [{k: v for k, v in r.items() if k != "scenario"} for r in a_rows],
            "summary": summaries[0],
        },
        "option_b": {
            "rows": [{k: v for k, v in r.items() if k != "scenario"} for r in b_rows],
            "summary": summaries[1],
        },
        **({"haiku": {
            "rows": [{k: v for k, v in r.items() if k != "scenario"} for r in h_rows],
            "summary": summaries[2],
        }} if not (args.qwen_only or args.skip_haiku) else {}),
    }
    out_path = Path(f"decomposed_mutation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    out_path.write_text(json.dumps(output, indent=2, default=str))
    print(f"\n💾 Results → {out_path}")


if __name__ == "__main__":
    main()
