#!/usr/bin/env python3
"""
Multi-model intent → SQL query parameter benchmark.

Reuses the prompt, fixtures, scoring function, retry-on-degeneration logic,
and enum validation from test_intent_to_query.py — but runs N MLX models
instead of hardcoding Qwen3.5 + Haiku. Skips Haiku (no API key assumed).

This is the CURRENT-architecture representative test:
  user utterance → LLM slot-fills JSON → deterministic params_to_sql → results

Usage:
  venv313/bin/python test_intent_multimodel.py \
      "mlx-community/Llama-3.2-3B-Instruct-4bit,mlx-community/Phi-4-mini-instruct-4bit"
"""
import json
import re
import sys
import time
import gc
from datetime import datetime
from pathlib import Path

from mlx_lm import load, generate as mlx_generate

from test_intent_fixtures import SCENARIOS, build_db, params_to_sql, score_results
from test_intent_to_query import (
    build_prompt, parse_params, normalize_params, _looks_degenerate,
)

RESULT_LIMIT = 10

DEFAULT_MODELS = [
    "mlx-community/Qwen3.5-0.8B-OptiQ-4bit",          # Prior validated baseline (93%)
    "mlx-community/Llama-3.2-1B-Instruct-4bit",
    "mlx-community/Llama-3.2-3B-Instruct-4bit",       # Leg-labels winner
    "mlx-community/gemma-3-1b-it-4bit",
    "mlx-community/Phi-4-mini-instruct-4bit",
]


USE_CHAT_TEMPLATE = True  # overridden by CLI flag


def infer_mlx(model, tokenizer, prompt: str, with_chat_template: bool = None) -> tuple[str, float]:
    if with_chat_template is None:
        with_chat_template = USE_CHAT_TEMPLATE
    """Generic MLX inference with /no_think + retry-on-degeneration."""
    t0 = time.time()

    # Apply chat template if the tokenizer supports it — critical for instruct models
    def format_prompt(p: str) -> str:
        if with_chat_template and hasattr(tokenizer, "apply_chat_template") and tokenizer.chat_template is not None:
            msgs = [{"role": "user", "content": p}]
            return tokenizer.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
        return p

    # First attempt: add /no_think directive (Qwen-specific, harmless for others)
    out = mlx_generate(
        model, tokenizer,
        prompt=format_prompt(prompt + " /no_think"),
        max_tokens=400, verbose=False,
    )

    # Retry once if the output degenerates or has no JSON brace
    if _looks_degenerate(out) or "{" not in out:
        out = mlx_generate(
            model, tokenizer,
            prompt=format_prompt(prompt + "\n\nReturn the JSON object now:"),
            max_tokens=400, verbose=False,
        )

    return out, time.time() - t0


def run_model(model_name: str, scenarios: list, conn) -> dict:
    print(f"\n{'='*72}")
    print(f"  {model_name}")
    print("="*72)

    t_load = time.time()
    try:
        model, tokenizer = load(model_name)
    except Exception as e:
        print(f"  LOAD FAILED: {e}")
        return {"model": model_name, "error": f"load failed: {e}"}
    load_seconds = time.time() - t_load
    print(f"  loaded in {load_seconds:.1f}s")

    rows = []
    cur = conn.cursor()

    for s in scenarios:
        raw_text, duration = infer_mlx(model, tokenizer, build_prompt(s["intent"]))
        raw_params = parse_params(raw_text)

        row = {
            "scenario_id": s["id"],
            "difficulty": s["difficulty"],
            "intent": s["intent"],
            "raw_output": raw_text.strip()[:300],
            "valid_json": raw_params is not None,
            "duration_s": round(duration, 2),
        }

        if raw_params is None:
            row.update({
                "params": None, "sql": None, "sql_ok": False,
                "returned": [], "metrics": score_results([], s),
            })
            print(f"  [{s['id']:<22}] ❌ INVALID JSON ({duration:.2f}s)")
            rows.append(row)
            continue

        params = normalize_params(raw_params)
        row["params"] = params

        try:
            sql, args = params_to_sql(params, limit=RESULT_LIMIT)
            row["sql"] = sql
            row["sql_args"] = args
            returned = [r[0] for r in cur.execute(sql, args).fetchall()]
            row["sql_ok"] = True
        except Exception as e:
            row.update({"sql_ok": False, "sql_error": str(e), "returned": []})
            row["metrics"] = score_results([], s)
            print(f"  [{s['id']:<22}] ❌ SQL ERROR: {e}")
            rows.append(row)
            continue

        row["returned"] = returned
        row["metrics"] = score_results(returned, s)

        m = row["metrics"]
        icon = "✅" if m["f1"] >= 0.5 and m["forbidden_violations"] == 0 else "⚠️ " if m["f1"] >= 0.3 else "❌"
        print(
            f"  [{s['id']:<22}] {icon} F1={m['f1']:.2f} P={m['precision']:.2f} R={m['recall']:.2f} "
            f"req={m['required_hit_rate']:.0%} fbd={m['forbidden_violations']} "
            f"n={m['returned_count']} ({duration:.2f}s)"
        )
        rows.append(row)

    # Summary
    n = len(rows)
    valid_json = sum(1 for r in rows if r["valid_json"])
    sql_ok = sum(1 for r in rows if r.get("sql_ok"))
    passes = sum(1 for r in rows if r["metrics"]["f1"] >= 0.5 and r["metrics"]["forbidden_violations"] == 0)
    f1s = [r["metrics"]["f1"] for r in rows]
    avg_f1 = sum(f1s) / n if n else 0
    avg_p = sum(r["metrics"]["precision"] for r in rows) / n if n else 0
    avg_r = sum(r["metrics"]["recall"] for r in rows) / n if n else 0
    avg_dur = sum(r["duration_s"] for r in rows) / n if n else 0
    fbd_total = sum(r["metrics"]["forbidden_violations"] for r in rows)

    print(f"\n  ── summary ──")
    print(f"  Valid JSON:        {valid_json}/{n} ({valid_json/n:.0%})")
    print(f"  SQL executed:      {sql_ok}/{n} ({sql_ok/n:.0%})")
    print(f"  Passes (F1≥.5):    {passes}/{n} ({passes/n:.0%})")
    print(f"  Avg F1:            {avg_f1:.2f}")
    print(f"  Avg precision:     {avg_p:.2f}")
    print(f"  Avg recall:        {avg_r:.2f}")
    print(f"  Avg duration:      {avg_dur:.2f}s")
    print(f"  Forbidden total:   {fbd_total}")

    # Per-difficulty breakdown
    print(f"  By difficulty:")
    for diff in ["easy", "medium", "hard", "subjective"]:
        sub = [r for r in rows if r["difficulty"] == diff]
        if not sub:
            continue
        sub_pass = sum(1 for r in sub if r["metrics"]["f1"] >= 0.5 and r["metrics"]["forbidden_violations"] == 0)
        sub_f1 = sum(r["metrics"]["f1"] for r in sub) / len(sub)
        print(f"    {diff:12s}: {sub_pass}/{len(sub)} pass, avg F1={sub_f1:.2f}")

    summary = {
        "model": model_name,
        "load_seconds": round(load_seconds, 2),
        "n_scenarios": n,
        "valid_json_rate": valid_json / n if n else 0,
        "sql_exec_rate": sql_ok / n if n else 0,
        "pass_rate": passes / n if n else 0,
        "avg_f1": round(avg_f1, 3),
        "avg_precision": round(avg_p, 3),
        "avg_recall": round(avg_r, 3),
        "avg_duration_s": round(avg_dur, 3),
        "forbidden_violations_total": fbd_total,
        "rows": rows,
    }

    # Free
    del model
    del tokenizer
    gc.collect()
    return summary


def main():
    global USE_CHAT_TEMPLATE
    models = DEFAULT_MODELS
    args = [a for a in sys.argv[1:] if a != "--no-chat-template"]
    if "--no-chat-template" in sys.argv:
        USE_CHAT_TEMPLATE = False
    if args:
        models = [m.strip() for m in args[0].split(",")]

    print("🏍  Multi-model Intent → SQL Query Parameter Benchmark")
    print(f"    Scenarios: {len(SCENARIOS)} | DB: 20 routes | Top-K: {RESULT_LIMIT}")
    print(f"    Models: {len(models)}")
    print(f"    NOTE: MLX latency is Mac-biased, not mobile-representative.")

    conn = build_db()
    all_summaries = []
    for m in models:
        all_summaries.append(run_model(m, SCENARIOS, conn))

    # Comparison table
    print("\n" + "="*72)
    print("  LEADERBOARD")
    print("="*72)
    print(f"  {'model':<55s} {'pass':>8s} {'F1':>6s} {'time':>7s}")
    for s in all_summaries:
        if "error" in s:
            print(f"  {s['model']:<55s} ERROR")
            continue
        print(
            f"  {s['model']:<55s} "
            f"{s['pass_rate']*100:6.0f}%  "
            f"{s['avg_f1']:5.2f}  "
            f"{s['avg_duration_s']:5.2f}s"
        )

    # Gates (applied to each model)
    print("\n  GATES:")
    for s in all_summaries:
        if "error" in s:
            continue
        gate = (
            s["valid_json_rate"] >= 0.90
            and s["pass_rate"] >= 0.60
            and s["avg_f1"] >= 0.50
            and s["forbidden_violations_total"] <= 3
        )
        print(f"    {s['model']:<55s} {'✅ VIABLE' if gate else '❌ NOT VIABLE'}")

    out = {
        "test_type": "intent_to_query_multimodel",
        "date": datetime.now().isoformat(),
        "scenarios_count": len(SCENARIOS),
        "models": all_summaries,
    }
    out_path = Path(f"intent_multimodel_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    out_path.write_text(json.dumps(out, indent=2, default=str))
    print(f"\n💾 → {out_path}")


if __name__ == "__main__":
    main()
