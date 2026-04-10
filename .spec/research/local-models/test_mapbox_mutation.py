#!/usr/bin/env python3
"""
Route mutation intent → Mapbox API parameter extraction test.

Tests two hypotheses:

  H1 (Classification): Qwen3.5 0.8B can distinguish "find me a new route"
     (CREATE) from "change this route" (UPDATE) when given the rider's intent
     and optionally a current route context.

  H2 (Parameter extraction): Given an UPDATE intent + current route context,
     Qwen can slot-fill the correct Mapbox mutation op type and key parameters
     (waypoint index, place name, feature type, road hint, etc.).

Design rationale: prior tests showed Qwen fails at "structure → selection"
(picking alternates from a pool). This test targets "text → structure" —
the same slot-filling pattern that achieved 93% pass rate in intent → SQL.

Run:
  source venv/bin/activate
  export ANTHROPIC_API_KEY=...
  venv/bin/python3 test_mapbox_mutation.py [--phase 1|2|both] [--qwen-only]
"""
import argparse
import json
import os
import re
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    from mlx_lm import load, generate as mlx_generate
except ImportError:
    raise SystemExit("mlx-lm not installed. Run: pip install mlx-lm")

try:
    import anthropic
except ImportError:
    raise SystemExit("anthropic not installed. Run: pip install anthropic")

from test_mapbox_mutation_fixtures import (
    CLASSIFICATION_SCENARIOS,
    MUTATION_SCENARIOS,
    MUTATION_SCHEMA,
    ROUTE_A,
    OP_TYPES,
    FEATURES,
    INTENT_TYPES,
    format_route_context,
    score_classification,
    score_mutation,
)

QWEN_MODEL  = "mlx-community/Qwen3.5-0.8B-OptiQ-4bit"
HAIKU_MODEL = "claude-haiku-4-5-20251001"


# ─────────────────────────────────────────────────────────────────────────────
# Prompt builders
# ─────────────────────────────────────────────────────────────────────────────

def build_classification_prompt(intent: str, route_context: dict | None) -> str:
    """Build the prompt for Phase 1: classify create vs update."""
    ctx_block = ""
    if route_context:
        ctx_block = f"""
CURRENT ROUTE:
{format_route_context(route_context)}

"""
    return f"""You classify a motorcycle rider's intent as a route request type.

{MUTATION_SCHEMA}

DEFINITIONS:
  create    = the rider wants a new route (no current route, or asking to find something entirely different)
  update    = the rider wants to modify an existing route shown above
  ambiguous = genuinely unclear whether they want a new route or a modification
{ctx_block}
RULES:
1. If there is NO current route shown above, the answer is almost always "create".
2. If there IS a current route, check: is the rider asking to change it (update)?
   Or discover something entirely new (create)?
3. Use "ambiguous" only when it's truly impossible to decide. When in doubt, prefer
   "create" (no route) or "update" (route in context).

EXAMPLES:

No current route, intent: "Find me a ride to Santa Cruz"
{{"intent_type": "create", "ops": []}}

Current route: SF → Pescadero → Santa Cruz, intent: "Can we avoid Highway 1?"
{{"intent_type": "update", "ops": [{{"op": "avoid_road", "road_hint": "Highway 1", "waypoint_index": null, "insert_before_index": null, "place_name": null, "feature": null, "keep_through_index": null, "swap_indices": null}}]}}

No current route, intent: "Show me something twisty near Marin"
{{"intent_type": "create", "ops": []}}

Current route: SF → Pescadero → Santa Cruz, intent: "Add a stop at Pigeon Point Lighthouse"
{{"intent_type": "update", "ops": [{{"op": "add_waypoint", "place_name": "Pigeon Point Lighthouse", "insert_before_index": 2, "waypoint_index": null, "feature": null, "road_hint": null, "keep_through_index": null, "swap_indices": null}}]}}

Current route: SF → Pescadero → Santa Cruz, intent: "Give me a completely different route"
{{"intent_type": "ambiguous", "ops": []}}

Now classify this. Output ONLY valid JSON with intent_type and ops. No explanation.

Intent: "{intent}"
JSON:"""


def build_mutation_prompt(intent: str, route: dict) -> str:
    """Build the prompt for Phase 2: extract mutation ops from an UPDATE intent."""
    return f"""You extract Mapbox route mutation operations from a rider's update intent.

{MUTATION_SCHEMA}

CURRENT ROUTE:
{format_route_context(route)}

RULES:
1. intent_type is always "update" for this task.
2. Extract one op per change the rider is requesting. Multiple changes → multiple ops.
3. For add_waypoint: set place_name to the exact place mentioned.
   Set insert_before_index to the waypoint index the new stop should come BEFORE.
   Use null to append at the end (after the last waypoint).
4. For remove_waypoint: use the waypoint_index from the route shown above.
5. For exclude_feature: pick from toll | motorway | ferry | unpaved only.
   "no toll roads" → toll. "avoid highway" / "back roads" → motorway.
   "avoid ferries" → ferry. "paved only" → unpaved.
6. For avoid_road: set road_hint to the road name mentioned.
7. For trim_route: set keep_through_index to the last waypoint index to KEEP.
8. Only output ops that the intent explicitly implies. Do NOT add extra ops.
9. All unused keys in each op object must be null.

EXAMPLES:

Intent: "Skip Pescadero, go straight to Santa Cruz" (route has Pescadero at index 1)
{{"intent_type": "update", "ops": [{{"op": "remove_waypoint", "waypoint_index": 1, "insert_before_index": null, "place_name": null, "feature": null, "road_hint": null, "keep_through_index": null, "swap_indices": null}}]}}

Intent: "No toll roads"
{{"intent_type": "update", "ops": [{{"op": "exclude_feature", "feature": "toll", "waypoint_index": null, "insert_before_index": null, "place_name": null, "road_hint": null, "keep_through_index": null, "swap_indices": null}}]}}

Intent: "Add a stop at Pigeon Point Lighthouse before Santa Cruz" (Santa Cruz is at index 2)
{{"intent_type": "update", "ops": [{{"op": "add_waypoint", "place_name": "Pigeon Point Lighthouse", "insert_before_index": 2, "waypoint_index": null, "feature": null, "road_hint": null, "keep_through_index": null, "swap_indices": null}}]}}

Intent: "Can we avoid Highway 1?"
{{"intent_type": "update", "ops": [{{"op": "avoid_road", "road_hint": "Highway 1", "waypoint_index": null, "insert_before_index": null, "place_name": null, "feature": null, "keep_through_index": null, "swap_indices": null}}]}}

Intent: "End the ride at Pescadero, skip Santa Cruz" (Pescadero is at index 1)
{{"intent_type": "update", "ops": [{{"op": "trim_route", "keep_through_index": 1, "waypoint_index": null, "insert_before_index": null, "place_name": null, "feature": null, "road_hint": null, "swap_indices": null}}]}}

Intent: "No tolls AND avoid the coastal highway"
{{"intent_type": "update", "ops": [{{"op": "exclude_feature", "feature": "toll", "waypoint_index": null, "insert_before_index": null, "place_name": null, "road_hint": null, "keep_through_index": null, "swap_indices": null}}, {{"op": "avoid_road", "road_hint": "Highway 1", "waypoint_index": null, "insert_before_index": null, "place_name": null, "feature": null, "keep_through_index": null, "swap_indices": null}}]}}

Now extract ops for this intent. Output ONLY valid JSON. No explanation.

Intent: "{intent}"
JSON:"""


# ─────────────────────────────────────────────────────────────────────────────
# Inference helpers (mirrors intent_to_query pattern)
# ─────────────────────────────────────────────────────────────────────────────

def _looks_degenerate(text: str) -> bool:
    if not text or len(text) < 10:
        return True
    for m in re.finditer(r'(\w{3,15})\1{5,}', text):
        if len(m.group(0)) > len(text) * 0.4:
            return True
    return False


def infer_qwen(model, tokenizer, prompt: str) -> tuple[str, float]:
    t0 = time.time()
    out = mlx_generate(model, tokenizer, prompt=prompt + " /no_think", max_tokens=500, verbose=False)
    if _looks_degenerate(out) or "{" not in out:
        out = mlx_generate(model, tokenizer, prompt=prompt + "\n\nReturn the JSON object now:", max_tokens=500, verbose=False)
    return out, time.time() - t0


def infer_haiku(client, prompt: str) -> tuple[str, float]:
    t0 = time.time()
    msg = client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text, time.time() - t0


def parse_output(text: str) -> dict | None:
    """Extract the first complete JSON object from model output.

    Qwen3.5 sometimes generates the JSON then repeats itself before
    hitting max_tokens. A greedy regex captures the whole mess. Instead,
    walk through the text char-by-char to find the first balanced {…}.
    """
    text = re.sub(r"```(?:json)?\s*", "", text).replace("```", "")

    # Find the first '{' and walk to its matching '}'
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_str = False
    escape = False
    for i, ch in enumerate(text[start:], start):
        if escape:
            escape = False
            continue
        if ch == "\\" and in_str:
            escape = True
            continue
        if ch == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                candidate = text[start:i+1]
                try:
                    parsed = json.loads(candidate)
                    return parsed if isinstance(parsed, dict) else None
                except Exception:
                    return None
    return None


def normalize_output(parsed: dict) -> dict:
    """Validate and coerce model output; drop invalid enum values."""
    if not isinstance(parsed, dict):
        return {}

    intent_type = parsed.get("intent_type")
    if intent_type not in INTENT_TYPES:
        intent_type = None  # invalid

    raw_ops = parsed.get("ops", [])
    clean_ops = []
    if isinstance(raw_ops, list):
        for op in raw_ops:
            if not isinstance(op, dict):
                continue
            op_type = op.get("op")
            if op_type not in OP_TYPES:
                continue  # drop hallucinated op types
            # Validate feature enum
            if op_type == "exclude_feature" and op.get("feature") not in FEATURES:
                op["feature"] = None
            clean_ops.append(op)

    return {"intent_type": intent_type, "ops": clean_ops}


# ─────────────────────────────────────────────────────────────────────────────
# Phase 1 — Classification test loop
# ─────────────────────────────────────────────────────────────────────────────

def run_classification(model_name: str, infer_fn, scenarios: list) -> list[dict]:
    print(f"\n{'='*72}")
    print(f"Phase 1 — Classification: {model_name}")
    print("="*72)
    results = []

    for s in scenarios:
        prompt = build_classification_prompt(s["intent"], s["route_context"])
        text, duration = infer_fn(prompt)
        parsed = parse_output(text)
        normed = normalize_output(parsed) if parsed else {}

        predicted_type = normed.get("intent_type")
        score = score_classification(predicted_type, s)

        icon = "✅" if score["correct"] else "❌"
        print(f"  [{s['id']:<20}] {icon} expected={s['expected_type']:<10} got={str(predicted_type):<10} ({duration:.2f}s)")

        results.append({
            "scenario_id": s["id"],
            "difficulty": s["difficulty"],
            "intent": s["intent"],
            "has_route_context": s["route_context"] is not None,
            "raw_output": text.strip()[:200],
            "valid_json": parsed is not None,
            "duration_s": round(duration, 2),
            "predicted_type": predicted_type,
            "score": score,
        })

    return results


def summarize_classification(model_name: str, rows: list[dict]):
    print(f"\n── {model_name} classification summary ──")
    n = len(rows)
    valid = sum(1 for r in rows if r["valid_json"])
    correct = sum(1 for r in rows if r["score"]["correct"])

    print(f"  Valid JSON:    {valid}/{n} ({valid/n:.0%})")
    print(f"  Correct type: {correct}/{n} ({correct/n:.0%})")

    # Confusion breakdown
    for expected in ["create", "update", "ambiguous"]:
        sub = [r for r in rows if r["score"]["expected"] == expected]
        if not sub:
            continue
        sub_correct = sum(1 for r in sub if r["score"]["correct"])
        print(f"    {expected:10s}: {sub_correct}/{len(sub)}")

    # By difficulty
    print(f"\n  By difficulty:")
    for diff in ["easy", "medium", "hard"]:
        sub = [r for r in rows if r["difficulty"] == diff]
        if not sub:
            continue
        sc = sum(1 for r in sub if r["score"]["correct"])
        print(f"    {diff:8s}: {sc}/{len(sub)}")

    return {
        "valid_json_rate": valid / n if n else 0,
        "accuracy": correct / n if n else 0,
        "correct": correct,
        "total": n,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Phase 2 — Mutation extraction test loop
# ─────────────────────────────────────────────────────────────────────────────

def run_mutation(model_name: str, infer_fn, scenarios: list) -> list[dict]:
    print(f"\n{'='*72}")
    print(f"Phase 2 — Mutation extraction: {model_name}")
    print("="*72)
    results = []

    for s in scenarios:
        prompt = build_mutation_prompt(s["intent"], s["route"])
        text, duration = infer_fn(prompt)
        parsed = parse_output(text)
        normed = normalize_output(parsed) if parsed else {}

        model_ops = normed.get("ops") if normed else None
        metrics = score_mutation(model_ops, s)

        icon = "✅" if metrics["f1"] >= 0.5 and metrics["forbidden_violations"] == 0 else (
               "⚠️ " if metrics["f1"] >= 0.3 else "❌")
        print(f"  [{s['id']:<22}] {icon} F1={metrics['f1']:.2f} "
              f"req={metrics['required_hit_rate']:.0%} "
              f"fbd={metrics['forbidden_violations']} "
              f"ops={metrics['ops_count']} ({duration:.2f}s)")

        results.append({
            "scenario_id": s["id"],
            "difficulty": s["difficulty"],
            "intent": s["intent"],
            "raw_output": text.strip()[:300],
            "valid_json": parsed is not None,
            "duration_s": round(duration, 2),
            "model_ops": model_ops,
            "metrics": metrics,
        })

    return results


def summarize_mutation(model_name: str, rows: list[dict]):
    print(f"\n── {model_name} mutation summary ──")
    n = len(rows)
    valid = sum(1 for r in rows if r["valid_json"])
    f1_vals = [r["metrics"]["f1"] for r in rows]
    req_hits = [r["metrics"]["required_hit_rate"] for r in rows]
    fbd_total = sum(r["metrics"]["forbidden_violations"] for r in rows)
    passes = sum(1 for r in rows if r["metrics"]["f1"] >= 0.5 and r["metrics"]["forbidden_violations"] == 0)

    avg_f1 = sum(f1_vals) / n if n else 0
    avg_req = sum(req_hits) / n if n else 0

    print(f"  Valid JSON:             {valid}/{n} ({valid/n:.0%})")
    print(f"  Scenarios passed:       {passes}/{n} ({passes/n:.0%})")
    print(f"  Avg F1:                 {avg_f1:.2f}")
    print(f"  Avg required-hit rate:  {avg_req:.0%}")
    print(f"  Forbidden violations:   {fbd_total} (total)")

    print(f"\n  By difficulty:")
    for diff in ["easy", "medium", "hard"]:
        sub = [r for r in rows if r["difficulty"] == diff]
        if not sub:
            continue
        sub_f1 = sum(r["metrics"]["f1"] for r in sub) / len(sub)
        sub_pass = sum(1 for r in sub if r["metrics"]["f1"] >= 0.5 and r["metrics"]["forbidden_violations"] == 0)
        print(f"    {diff:8s}: {sub_pass}/{len(sub)} pass, avg F1={sub_f1:.2f}")

    return {
        "valid_json_rate": valid / n if n else 0,
        "pass_rate": passes / n if n else 0,
        "avg_f1": round(avg_f1, 3),
        "avg_required_hit": round(avg_req, 3),
        "forbidden_violations_total": fbd_total,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Gates
# ─────────────────────────────────────────────────────────────────────────────

CLASSIFICATION_GATES = {
    "valid_json_rate": 0.90,
    "accuracy": 0.80,
}

MUTATION_GATES = {
    "valid_json_rate": 0.90,
    "pass_rate": 0.65,
    "avg_f1": 0.60,
    "forbidden_violations_total": 3,  # ≤
}


def print_gates(phase: str, summary: dict, gates: dict):
    print(f"\n  GATES — {phase}:")
    all_pass = True
    for metric, threshold in gates.items():
        val = summary.get(metric, 0)
        if metric == "forbidden_violations_total":
            ok = val <= threshold
            print(f"    {metric:<35} {val}  {'✅' if ok else '❌'} (≤{threshold})")
        else:
            ok = val >= threshold
            print(f"    {metric:<35} {val:.0%}  {'✅' if ok else '❌'} (≥{threshold:.0%})")
        all_pass = all_pass and ok
    print(f"\n  → {phase.upper()}: {'✅ VIABLE' if all_pass else '❌ NOT VIABLE'}")
    return all_pass


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--phase", choices=["1", "2", "both"], default="both")
    parser.add_argument("--qwen-only", action="store_true")
    args = parser.parse_args()

    print("🏍  Route Mutation Intent → Mapbox API Parameter Extraction")
    print(f"    Classification scenarios: {len(CLASSIFICATION_SCENARIOS)}")
    print(f"    Mutation scenarios:       {len(MUTATION_SCENARIOS)}")

    # Load .env.local
    env_path = Path(".env.local")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

    # Load models
    print("\n📦 Loading Qwen3.5 0.8B (MLX)...")
    qwen_model, qwen_tok = load(QWEN_MODEL)
    qwen_infer = lambda p: infer_qwen(qwen_model, qwen_tok, p)

    haiku_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    haiku_infer = lambda p: infer_haiku(haiku_client, p)

    models = [("Qwen3.5 0.8B (MLX)", qwen_infer)]
    if not args.qwen_only:
        models.append(("Haiku (baseline)", haiku_infer))

    results = {}

    # Phase 1 — Classification
    if args.phase in ("1", "both"):
        for name, infer_fn in models:
            rows = run_classification(name, infer_fn, CLASSIFICATION_SCENARIOS)
            summary = summarize_classification(name, rows)
            key = name.replace(" ", "_").lower()
            results[f"phase1_{key}"] = {"rows": rows, "summary": summary}

        print(f"\n{'='*72}")
        print("PHASE 1 RESULTS")
        print("="*72)
        for name, _ in models:
            key = name.replace(" ", "_").lower()
            summary = results[f"phase1_{key}"]["summary"]
            viable = print_gates("Classification", summary, CLASSIFICATION_GATES)
            results[f"phase1_{key}"]["viable"] = viable

    # Phase 2 — Mutation extraction
    if args.phase in ("2", "both"):
        for name, infer_fn in models:
            rows = run_mutation(name, infer_fn, MUTATION_SCENARIOS)
            summary = summarize_mutation(name, rows)
            key = name.replace(" ", "_").lower()
            results[f"phase2_{key}"] = {"rows": rows, "summary": summary}

        print(f"\n{'='*72}")
        print("PHASE 2 RESULTS")
        print("="*72)
        for name, _ in models:
            key = name.replace(" ", "_").lower()
            summary = results[f"phase2_{key}"]["summary"]
            viable = print_gates("Mutation extraction", summary, MUTATION_GATES)
            results[f"phase2_{key}"]["viable"] = viable

    # Save full output
    output = {
        "test_type": "mapbox_mutation_intent_extraction",
        "date": datetime.now().isoformat(),
        "qwen_model": QWEN_MODEL,
        "haiku_model": HAIKU_MODEL,
        "classification_scenarios": len(CLASSIFICATION_SCENARIOS),
        "mutation_scenarios": len(MUTATION_SCENARIOS),
        **results,
    }
    out_path = Path(f"mapbox_mutation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    out_path.write_text(json.dumps(output, indent=2, default=str))
    print(f"\n💾 Full results → {out_path}")


if __name__ == "__main__":
    main()
