#!/usr/bin/env python3
"""
Multi-model leg-label benchmark for 2026-04-12 research recommendations.

Tests any list of MLX-compatible models on the validated leg-labels micro-task
and reports per-model latency, tokens/sec, JSON validity, and leg count correctness.

IMPORTANT: Apple Silicon / MLX only. Latency numbers are Mac-biased and NOT valid
as estimates of on-device mobile performance (see ENVIRONMENT_BIAS_FINDING_2026-04-10.md).
Accuracy findings ARE portable.
"""
import json
import time
import sys
import gc
from pathlib import Path
from mlx_lm import load, generate

# Default model list — override via CLI arg (comma-separated)
DEFAULT_MODELS = [
    "mlx-community/Qwen3.5-0.8B-OptiQ-4bit",      # Prior baseline, already cached
    "mlx-community/gemma-3-1b-it-4bit",           # New: Google 1B, structured output
    "mlx-community/Phi-4-mini-instruct-4bit",     # New: Microsoft reasoning-leaning
]

TEST_ROUTES = [
    {
        "route_id": "sf-to-point-reyes",
        "legs": [
            {"index": 0, "from": "San Francisco", "to": "Sausalito", "road": "Highway 101"},
            {"index": 1, "from": "Sausalito", "to": "Stinson Beach", "road": "Highway 1"},
            {"index": 2, "from": "Stinson Beach", "to": "Point Reyes", "road": "Highway 1"},
        ],
    },
    {
        "route_id": "la-to-san-diego",
        "legs": [
            {"index": 0, "from": "Los Angeles", "to": "Laguna Beach", "road": "Pacific Coast Highway"},
            {"index": 1, "from": "Laguna Beach", "to": "Oceanside", "road": "I-5 S"},
            {"index": 2, "from": "Oceanside", "to": "San Diego", "road": "I-5 S"},
        ],
    },
    {
        "route_id": "seattle-to-portland",
        "legs": [
            {"index": 0, "from": "Seattle", "to": "Olympia", "road": "I-5 S"},
            {"index": 1, "from": "Olympia", "to": "Longview", "road": "I-5 S"},
            {"index": 2, "from": "Longview", "to": "Portland", "road": "I-5 S"},
        ],
    },
]


def build_prompt(route):
    legs_desc = "\n".join(
        [f"  Leg {i+1}: {leg['from']} → {leg['to']} via {leg['road']}"
         for i, leg in enumerate(route["legs"])]
    )
    return f"""You are a motorcycle route specialist. Generate descriptive labels for route leg segments.

Route: {route['route_id'].replace('-', ' ').title()}

Legs:
{legs_desc}

Generate a short, descriptive label (max 6 words) for each leg that describes the FROM → TO journey.
Use place names and road names. Format as JSON:

{{
  "leg_labels": [
    "Label for leg 1",
    "Label for leg 2",
    "Label for leg 3"
  ]
}}

Respond ONLY with valid JSON, no markdown, no explanation. /no_think"""


def extract_json(text: str):
    """Find first {...} block and parse."""
    start = text.find("{")
    if start < 0:
        return None
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start : i + 1])
                except Exception:
                    return None
    return None


def run_one_model(model_name: str):
    print(f"\n=== {model_name} ===", flush=True)
    t_load = time.time()
    try:
        model, tokenizer = load(model_name)
    except Exception as e:
        print(f"  LOAD FAILED: {e}")
        return {"model": model_name, "error": f"load failed: {e}"}
    load_seconds = time.time() - t_load
    print(f"  loaded in {load_seconds:.1f}s", flush=True)

    results = []
    for route in TEST_ROUTES:
        prompt = build_prompt(route)
        # Apply chat template if tokenizer supports it
        if hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template is not None:
            messages = [{"role": "user", "content": prompt}]
            prompt_text = tokenizer.apply_chat_template(
                messages, add_generation_prompt=True, tokenize=False
            )
        else:
            prompt_text = prompt

        t_start = time.time()
        try:
            response = generate(
                model,
                tokenizer,
                prompt=prompt_text,
                max_tokens=1024,
                verbose=False,
            )
        except Exception as e:
            print(f"  {route['route_id']}: GENERATE FAILED: {e}")
            results.append({"route_id": route["route_id"], "error": str(e)})
            continue
        duration = time.time() - t_start

        # Strip any prompt echo (some models do this even with chat templates)
        if response.startswith(prompt_text):
            response = response[len(prompt_text):]

        parsed = extract_json(response)
        valid_json = parsed is not None
        correct_count = (
            valid_json
            and isinstance(parsed.get("leg_labels"), list)
            and len(parsed["leg_labels"]) == len(route["legs"])
        )
        # Rough tok/s estimate based on output tokens
        out_tokens = len(tokenizer.encode(response)) if response else 0
        tok_per_sec = out_tokens / duration if duration > 0 else 0

        print(
            f"  {route['route_id']:25s}  {duration:5.2f}s  "
            f"{tok_per_sec:6.1f} tok/s  "
            f"json={'Y' if valid_json else 'N'}  "
            f"count={'Y' if correct_count else 'N'}",
            flush=True,
        )
        results.append(
            {
                "route_id": route["route_id"],
                "duration_s": round(duration, 3),
                "tok_per_sec": round(tok_per_sec, 1),
                "valid_json": valid_json,
                "correct_count": correct_count,
                "labels": parsed.get("leg_labels") if valid_json else None,
                "raw_response": response,
            }
        )

    # Aggregate
    ok = [r for r in results if "error" not in r]
    agg = {
        "model": model_name,
        "load_seconds": round(load_seconds, 2),
        "n_routes": len(TEST_ROUTES),
        "n_valid_json": sum(1 for r in ok if r.get("valid_json")),
        "n_correct_count": sum(1 for r in ok if r.get("correct_count")),
        "avg_duration_s": round(sum(r.get("duration_s", 0) for r in ok) / max(len(ok), 1), 3),
        "avg_tok_per_sec": round(sum(r.get("tok_per_sec", 0) for r in ok) / max(len(ok), 1), 1),
        "results": results,
    }
    print(
        f"  SUMMARY: valid={agg['n_valid_json']}/{agg['n_routes']}  "
        f"count={agg['n_correct_count']}/{agg['n_routes']}  "
        f"avg={agg['avg_duration_s']}s  {agg['avg_tok_per_sec']} tok/s"
    )

    # Free memory between models
    del model
    del tokenizer
    gc.collect()
    return agg


def main():
    models = DEFAULT_MODELS
    if len(sys.argv) > 1:
        models = sys.argv[1].split(",")

    print(f"Testing {len(models)} models on {len(TEST_ROUTES)} routes (leg labels)")
    print("Apple Silicon / MLX — latency is Mac-biased (see ENVIRONMENT_BIAS_FINDING)")

    all_results = []
    for m in models:
        agg = run_one_model(m)
        all_results.append(agg)

    # Final comparison table
    print("\n=== Comparison ===")
    print(f"{'model':55s}  {'json':>6s}  {'count':>6s}  {'avg_s':>7s}  {'tok/s':>7s}")
    for r in all_results:
        if "error" in r:
            print(f"{r['model']:55s}  ERROR: {r['error']}")
            continue
        print(
            f"{r['model']:55s}  "
            f"{r.get('n_valid_json','?')}/{r.get('n_routes','?')}".ljust(63)
            + f"  {r.get('n_correct_count','?')}/{r.get('n_routes','?')}"
            f"  {r.get('avg_duration_s', 0):7.2f}"
            f"  {r.get('avg_tok_per_sec', 0):7.1f}"
        )

    # Save
    out_path = Path(__file__).parent / f"new_models_leg_labels_{time.strftime('%Y%m%d_%H%M%S')}.json"
    with open(out_path, "w") as f:
        json.dump({"models": all_results, "test_routes": TEST_ROUTES}, f, indent=2)
    print(f"\nSaved to: {out_path}")


if __name__ == "__main__":
    main()
