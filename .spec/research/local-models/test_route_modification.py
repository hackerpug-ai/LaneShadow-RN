#!/usr/bin/env python3
"""
Route modification validation: Qwen3.5 0.8B vs Haiku.

The real strategic case for a local model: modifying an existing route when the
user adds live constraints ("avoid Highway 1", "Leg 3 is closed", "make it twistier").

Tests M1–M7 against the SF→Santa Cruz fixture. Measures JSON validity,
ID fidelity (no hallucination), leg count preservation, route connectivity,
and constraint adherence — compared to Haiku as ground truth.

Run:
  source venv/bin/activate
  export ANTHROPIC_API_KEY=...
  python test_route_modification.py
"""
import json
import os
import re
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

from test_fixtures import (
    SF_SANTA_CRUZ, MODIFICATION_SCENARIOS,
    format_leg, format_alternates, _all_legs,
)

QWEN_MODEL  = "mlx-community/Qwen3.5-0.8B-OptiQ-4bit"
HAIKU_MODEL = "claude-haiku-4-5-20251001"
REPS        = 3  # runs per scenario (consistency check)


# ─────────────────────────────────────────────────────────────────────────────
# Prompt builder
# ─────────────────────────────────────────────────────────────────────────────

def build_modification_prompt(fixture: dict, constraint: str) -> str:
    current = "\n".join(f"  {format_leg(leg)}" for leg in fixture["primary_legs"])
    alternates = format_alternates(fixture)
    n_legs = len(fixture["primary_legs"])
    leg_ids = [l["leg_id"] for l in fixture["primary_legs"]]

    return f"""You are modifying a motorcycle route. Return JSON only.

Current route: {fixture['from_city']} → {fixture['to_city']} ({n_legs} legs)
{current}

User constraint: {constraint}

Available alternate segments:
{alternates}

Rules:
- Keep legs that already satisfy the constraint exactly as-is (use their original leg_id).
- Replace only the legs that violate the constraint, choosing from the alternates list.
- Maintain route connectivity: each leg's destination must match the next leg's origin.
- Return exactly {n_legs} leg IDs (one per leg).
- Only use IDs from the current route or the alternates list above. Do not invent IDs.

Respond with ONLY valid JSON: {{"legs": ["{leg_ids[0]}", "...", "{leg_ids[-1]}"]}}"""


# ─────────────────────────────────────────────────────────────────────────────
# Inference wrappers
# ─────────────────────────────────────────────────────────────────────────────

def infer_qwen(model, tokenizer, prompt: str) -> tuple[str, float]:
    t0 = time.time()
    out = mlx_generate(model, tokenizer, prompt=prompt, max_tokens=300, verbose=False)
    return out, time.time() - t0


def infer_haiku(client, prompt: str) -> tuple[str, float]:
    t0 = time.time()
    msg = client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text, time.time() - t0


def parse_legs(text: str) -> list[str]:
    m = re.search(r'\{[\s\S]*?"legs"[\s\S]*?\}', text)
    if m:
        try:
            return json.loads(m.group()).get("legs", [])
        except Exception:
            pass
    m = re.search(r'\[([^\]]+)\]', text)
    if m:
        try:
            return json.loads(f'[{m.group(1)}]')
        except Exception:
            pass
    return []


def evaluate_modification(
    legs: list[str],
    scenario: dict,
    fixture: dict,
) -> dict:
    all_leg_map = _all_legs(fixture)
    valid_ids   = set(all_leg_map.keys())
    n_expected  = len(fixture["primary_legs"])

    # Structural checks
    hallucinations     = [lid for lid in legs if lid not in valid_ids]
    count_correct      = len(legs) == n_expected
    valid_json         = bool(legs)

    # Connectivity: leg[i].to == leg[i+1].from
    connectivity_ok = True
    for i in range(len(legs) - 1):
        curr = all_leg_map.get(legs[i], {})
        nxt  = all_leg_map.get(legs[i+1], {})
        if curr.get("to") and nxt.get("from") and curr["to"] != nxt["from"]:
            connectivity_ok = False
            break

    # Constraint adherence (scenario-specific check)
    try:
        constraint_ok = scenario["check"](legs, fixture) if legs else False
    except Exception as e:
        constraint_ok = False

    return {
        "valid_json": valid_json,
        "count_correct": count_correct,
        "actual_count": len(legs),
        "expected_count": n_expected,
        "hallucinations": hallucinations,
        "hallucination_count": len(hallucinations),
        "connectivity_ok": connectivity_ok,
        "constraint_ok": constraint_ok,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main test loop
# ─────────────────────────────────────────────────────────────────────────────

def run_modification_tests(qwen_model, qwen_tok, haiku_client) -> list[dict]:
    print("\n" + "="*70)
    print("ROUTE MODIFICATION TEST: SF → Santa Cruz")
    print("="*70)
    results = []

    for scenario in MODIFICATION_SCENARIOS:
        print(f"\n  [{scenario['id']}] {scenario['description']}")
        print(f"    Constraint: \"{scenario['constraint'][:80]}...\"" if len(scenario['constraint']) > 80 else f"    Constraint: \"{scenario['constraint']}\"")

        prompt = build_modification_prompt(SF_SANTA_CRUZ, scenario["constraint"])
        scenario_runs = []

        for rep in range(REPS):
            # Qwen
            q_text, q_dur = infer_qwen(qwen_model, qwen_tok, prompt)
            q_legs = parse_legs(q_text)
            q_eval = evaluate_modification(q_legs, scenario, SF_SANTA_CRUZ)
            q_eval["duration_s"] = round(q_dur, 2)
            q_eval["legs"] = q_legs

            # Haiku (only run on first rep to save API calls)
            if rep == 0:
                h_text, h_dur = infer_haiku(haiku_client, prompt)
                h_legs = parse_legs(h_text)
                h_eval = evaluate_modification(h_legs, scenario, SF_SANTA_CRUZ)
                h_eval["duration_s"] = round(h_dur, 2)
                h_eval["legs"] = h_legs
            else:
                h_eval = scenario_runs[0]["haiku"]  # reuse first run

            scenario_runs.append({"rep": rep, "qwen": q_eval, "haiku": h_eval})

            q_icon = "✅" if q_eval["constraint_ok"] else "❌"
            print(f"    rep {rep}: Qwen {q_icon} constraint={'✓' if q_eval['constraint_ok'] else '✗'} "
                  f"conn={'✓' if q_eval['connectivity_ok'] else '✗'} "
                  f"count={'✓' if q_eval['count_correct'] else '✗'} "
                  f"halluc={q_eval['hallucination_count']} "
                  f"{q_dur:.2f}s   legs={q_legs}")

        # Aggregate across reps
        qwen_constraint_rate = sum(1 for r in scenario_runs if r["qwen"]["constraint_ok"]) / REPS
        qwen_connectivity_rate = sum(1 for r in scenario_runs if r["qwen"]["connectivity_ok"]) / REPS
        qwen_json_rate = sum(1 for r in scenario_runs if r["qwen"]["valid_json"]) / REPS
        qwen_halluc_total = sum(r["qwen"]["hallucination_count"] for r in scenario_runs)
        haiku_constraint_ok = scenario_runs[0]["haiku"]["constraint_ok"]

        print(f"    Qwen: constraint={qwen_constraint_rate:.0%} conn={qwen_connectivity_rate:.0%} "
              f"json={qwen_json_rate:.0%} halluc={qwen_halluc_total} | "
              f"Haiku: constraint={'✓' if haiku_constraint_ok else '✗'}")

        results.append({
            "scenario_id": scenario["id"],
            "description": scenario["description"],
            "constraint": scenario["constraint"],
            "runs": scenario_runs,
            "aggregate": {
                "qwen_constraint_rate": round(qwen_constraint_rate, 3),
                "qwen_connectivity_rate": round(qwen_connectivity_rate, 3),
                "qwen_json_rate": round(qwen_json_rate, 3),
                "qwen_hallucination_total": qwen_halluc_total,
                "haiku_constraint_ok": haiku_constraint_ok,
                "qwen_viable": qwen_constraint_rate >= 0.80 and qwen_json_rate >= 0.95 and qwen_halluc_total == 0,
            },
        })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────

def print_summary(results: list[dict]) -> bool:
    print("\n" + "="*70)
    print("MODIFICATION SUMMARY")
    print("="*70)
    print(f"\n{'Scenario':<25} {'Constraint%':>12} {'Connectivity%':>14} {'JSON%':>7} {'Halluc':>7} {'Viable':>8} {'Haiku':>7}")
    print("─" * 80)

    viable_count = 0
    for r in results:
        a = r["aggregate"]
        icon = "✅" if a["qwen_viable"] else "❌"
        if a["qwen_viable"]: viable_count += 1
        print(f"  {r['scenario_id']:<23} {a['qwen_constraint_rate']:>11.0%} "
              f"{a['qwen_connectivity_rate']:>13.0%} "
              f"{a['qwen_json_rate']:>6.0%} "
              f"{a['qwen_hallucination_total']:>7} "
              f"{icon:>8} "
              f"{'✓' if a['haiku_constraint_ok'] else '✗':>7}")

    overall_viable = viable_count >= len(results) * 0.80  # 80% of scenarios pass
    avg_constraint = sum(r["aggregate"]["qwen_constraint_rate"] for r in results) / len(results)
    all_no_halluc  = all(r["aggregate"]["qwen_hallucination_total"] == 0 for r in results)
    avg_json       = sum(r["aggregate"]["qwen_json_rate"] for r in results) / len(results)

    print(f"\n  Scenarios viable:     {viable_count}/{len(results)}")
    print(f"  Avg constraint rate:  {avg_constraint:.0%}  (gate: ≥80%)")
    print(f"  Avg JSON rate:        {avg_json:.0%}  (gate: ≥95%)")
    print(f"  Zero hallucinations:  {'YES' if all_no_halluc else 'NO'}")

    gate_pass = avg_constraint >= 0.80 and avg_json >= 0.95 and all_no_halluc
    print(f"\n  → MODIFICATION USE CASE: {'✅ VIABLE' if gate_pass else '❌ NOT VIABLE — use Haiku for modifications'}")
    return gate_pass


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("🏍  Qwen3.5 vs Haiku — Route Modification Validation")
    print(f"    Route: SF → Santa Cruz | {len(SF_SANTA_CRUZ['primary_legs'])} legs | {len(MODIFICATION_SCENARIOS)} scenarios | {REPS} reps each")

    env_path = Path(".env.local")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

    print("\n📦 Loading Qwen3.5 0.8B (MLX)...")
    qwen_model, qwen_tok = load(QWEN_MODEL)
    haiku_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    results = run_modification_tests(qwen_model, qwen_tok, haiku_client)
    viable  = print_summary(results)

    output = {
        "test_type": "route_modification_validation",
        "date": datetime.now().isoformat(),
        "model": QWEN_MODEL,
        "fixture": "sf-santa-cruz",
        "reps_per_scenario": REPS,
        "scenarios": results,
        "gates": {
            "modification_viable": viable,
        },
    }
    out_path = Path(f"route_modification_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    out_path.write_text(json.dumps(output, indent=2))
    print(f"\n💾 Full results → {out_path}")

    if not viable:
        print("\n  Recommendation: Drop local-model modification from curation PRD v1.1.")
        print("  Use Haiku for all route modification. Local model scope = leg labels only.")
    else:
        print("\n  Recommendation: Qwen3.5 earns its slot for route modification.")
        print("  Gate the modification prompt to structured constraints (not free-text).")


if __name__ == "__main__":
    main()
