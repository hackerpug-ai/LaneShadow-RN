#!/usr/bin/env python3
"""
Intent → SQL query parameter extraction test.

Tests whether Qwen3.5 0.8B (and Haiku, as baseline) can translate free-text
motorcycle ride intents into structured query parameters that, when executed
against a real SQLite DB, return the routes a human would expect.

This is the "db whisperer" hypothesis: small models are bad at selection/ranking
but good at slot-filling from a fixed schema. Test both models on 15 scenarios
spanning easy/medium/hard/subjective difficulty levels.

Run:
  source venv/bin/activate
  export ANTHROPIC_API_KEY=...
  venv/bin/python3 test_intent_to_query.py
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

from test_intent_fixtures import (
    SCENARIOS, PARAM_SCHEMA, build_db, params_to_sql, score_results,
    USER_LOCATION, DEFAULT_RADIUS_MI, routes_in_default_radius,
)

QWEN_MODEL  = "mlx-community/Qwen3.5-0.8B-OptiQ-4bit"
HAIKU_MODEL = "claude-haiku-4-5-20251001"
RESULT_LIMIT = 10


# ─────────────────────────────────────────────────────────────────────────────
# Prompt builder
# ─────────────────────────────────────────────────────────────────────────────

def build_prompt(intent: str) -> str:
    return f"""You convert a rider's natural-language intent into a JSON query filter.

CONTEXT: The rider is currently in {USER_LOCATION['city']}, {USER_LOCATION['state']}
(lat {USER_LOCATION['lat']}, lng {USER_LOCATION['lng']}). Searches are anchored to
this location with a default radius of {DEFAULT_RADIUS_MI} miles. The SQL layer
applies this radius automatically — you do NOT need to set distance unless the
rider wants something different.

OUTPUT: a JSON object with exactly these 10 keys. EVERY key defaults to null.
Only set a key if the intent explicitly implies it:

  archetype         twisties | mountain | coastal | adventure | scenic_byway | desert
  state             2-letter uppercase code — ONLY if rider names a state explicitly
  min_length_mi     number — for "long" / "epic" / "all-day" intents
  max_length_mi     number — for "short" / "quick" intents
  max_technical     0.5 — for "easy" / "gentle" / "beginner" intents
  min_traffic_score 0.7 — for "low traffic" / "uncrowded" intents
  min_remoteness    0.7 — for "remote" / "isolated" / "away from cities" intents
  max_distance_mi   number — ONLY if rider wants a tighter or wider radius than default
  season            year_round | apr_nov | may_sep — only if rider mentions season
  sort_by           curvature | scenic | technical | traffic | remoteness | length

CRITICAL RULES:
1. Default to null. Do NOT fill in fields "just to be safe".
2. `archetype` MUST be EXACTLY one of these 6 strings or null:
   twisties, mountain, coastal, adventure, scenic_byway, desert
   DO NOT invent archetypes. "short" is NOT an archetype — use max_length_mi.
   "epic" / "long" is NOT an archetype — use min_length_mi.
   "challenging" / "technical" is NOT an archetype — use sort_by: "technical".
   "gentle" / "easy" is NOT an archetype — use max_technical: 0.5.
   "remote" is NOT an archetype — use min_remoteness: 0.7.
3. Numeric values go into numeric fields ONLY. Never put miles into min_curvature.
4. "twisty" / "twistiest" / "most curvy" → sort_by: "curvature"  (no filter)
5. "most scenic" / "best views" → sort_by: "scenic"
6. "twisty mountain" → archetype: "mountain" + sort_by: "curvature"
7. "challenging" / "technical" / "for experts" → sort_by: "technical" (NOT max_technical)
8. "gentle" / "beginner" / "easy" → max_technical: 0.5
9. Only set `state` when the rider explicitly names a state other than their own.
10. The rider's current state ({USER_LOCATION['state']}) is the default — NEVER set state = "{USER_LOCATION['state']}".

EXAMPLES:

Intent: "rides in Colorado"
{{"archetype":null,"state":"CO","min_length_mi":null,"max_length_mi":null,"max_technical":null,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":null,"season":null,"sort_by":null}}

Intent: "coastal ride"
{{"archetype":"coastal","state":null,"min_length_mi":null,"max_length_mi":null,"max_technical":null,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":null,"season":null,"sort_by":null}}

Intent: "mountain ride at least 50 miles"
{{"archetype":"mountain","state":null,"min_length_mi":50,"max_length_mi":null,"max_technical":null,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":null,"season":null,"sort_by":null}}

Intent: "short twisty road nearby"
{{"archetype":null,"state":null,"min_length_mi":null,"max_length_mi":25,"max_technical":null,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":100,"season":null,"sort_by":"curvature"}}

Intent: "twisty mountain roads"
{{"archetype":"mountain","state":null,"min_length_mi":null,"max_length_mi":null,"max_technical":null,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":null,"season":null,"sort_by":"curvature"}}

Intent: "the most scenic ride"
{{"archetype":null,"state":null,"min_length_mi":null,"max_length_mi":null,"max_technical":null,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":null,"season":null,"sort_by":"scenic"}}

Intent: "easy beginner ride"
{{"archetype":null,"state":null,"min_length_mi":null,"max_length_mi":null,"max_technical":0.5,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":null,"season":null,"sort_by":null}}

Intent: "remote ride far from cities"
{{"archetype":null,"state":null,"min_length_mi":null,"max_length_mi":null,"max_technical":null,"min_traffic_score":null,"min_remoteness":0.7,"max_distance_mi":null,"season":null,"sort_by":"remoteness"}}

Intent: "year-round twisty"
{{"archetype":"twisties","state":null,"min_length_mi":null,"max_length_mi":null,"max_technical":null,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":null,"season":"year_round","sort_by":null}}

Intent: "short ride under 20 miles"
{{"archetype":null,"state":null,"min_length_mi":null,"max_length_mi":20,"max_technical":null,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":null,"season":null,"sort_by":null}}

Intent: "epic long-distance trip"
{{"archetype":null,"state":null,"min_length_mi":100,"max_length_mi":null,"max_technical":null,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":null,"season":null,"sort_by":"length"}}

Intent: "challenging technical roads for experts"
{{"archetype":null,"state":null,"min_length_mi":null,"max_length_mi":null,"max_technical":null,"min_traffic_score":null,"min_remoteness":null,"max_distance_mi":null,"season":null,"sort_by":"technical"}}

Now do this one. Output ONLY valid JSON with all 10 keys. No explanation.

Intent: "{intent}"
JSON:"""


# ─────────────────────────────────────────────────────────────────────────────
# Inference & parsing
# ─────────────────────────────────────────────────────────────────────────────

def _looks_degenerate(text: str) -> bool:
    """Detect degeneration loops like '_why_why_why...'."""
    if not text or len(text) < 10:
        return True
    # Repeated 4+ char token making up >50% of output
    import re as _re
    for m in _re.finditer(r'(\w{3,15})\1{5,}', text):
        if len(m.group(0)) > len(text) * 0.4:
            return True
    return False


def infer_qwen(model, tokenizer, prompt: str) -> tuple[str, float]:
    """Call Qwen with /no_think and retry once on degeneration or parse fail."""
    t0 = time.time()
    prompt_with_directive = prompt + " /no_think"
    out = mlx_generate(model, tokenizer, prompt=prompt_with_directive, max_tokens=400, verbose=False)

    # Retry once if degenerated — use a slightly different suffix to break the loop
    if _looks_degenerate(out) or "{" not in out:
        retry_prompt = prompt + "\n\nReturn the JSON object now:"
        out = mlx_generate(model, tokenizer, prompt=retry_prompt, max_tokens=400, verbose=False)

    return out, time.time() - t0


def infer_haiku(client, prompt: str) -> tuple[str, float]:
    t0 = time.time()
    msg = client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text, time.time() - t0


def parse_params(text: str) -> dict | None:
    """Extract JSON object from model output."""
    # Strip markdown code fences if present
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = text.replace("```", "")
    # Find the first {...} block
    m = re.search(r'\{[\s\S]*?\}(?=\s*$|\s*[^,:\[\{])', text)
    if not m:
        m = re.search(r'\{[\s\S]*\}', text)
    if not m:
        return None
    try:
        parsed = json.loads(m.group())
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


VALID_ARCHETYPES = {"twisties", "mountain", "coastal", "adventure", "scenic_byway", "desert"}
VALID_SEASONS = {"year_round", "apr_nov", "may_sep", "spring_fall"}
VALID_SORT_BY = {"curvature", "scenic", "technical", "traffic", "remoteness", "length"}


def normalize_params(params: dict) -> dict:
    """Coerce types and validate enum values; invalid → null (defensive)."""
    valid_keys = {
        "archetype", "state",
        "max_technical", "min_traffic_score", "min_remoteness",
        "min_length_mi", "max_length_mi", "max_distance_mi",
        "season", "sort_by",
    }
    out = {}
    for k, v in params.items():
        if k not in valid_keys:
            continue
        if v in ("", "null", "none", "None", None):
            out[k] = None
        else:
            out[k] = v

    # Enum validation — if the model hallucinates, drop the bad value
    if out.get("archetype") and out["archetype"] not in VALID_ARCHETYPES:
        out["archetype"] = None
    if out.get("season") and out["season"] not in VALID_SEASONS:
        out["season"] = None
    if out.get("sort_by") and out["sort_by"] not in VALID_SORT_BY:
        out["sort_by"] = None

    # Ignore rider's own state — treat as null (default to radius search)
    if out.get("state") and str(out["state"]).upper() == USER_LOCATION["state"]:
        out["state"] = None

    # State should be a 2-letter code
    if out.get("state") and len(str(out["state"])) != 2:
        out["state"] = None

    return out


# ─────────────────────────────────────────────────────────────────────────────
# Test loop
# ─────────────────────────────────────────────────────────────────────────────

def run_model(name: str, infer_fn, scenarios: list, conn) -> list[dict]:
    print(f"\n{'='*72}")
    print(f"{name}")
    print("="*72)
    results = []
    cur = conn.cursor()

    for s in scenarios:
        text, duration = infer_fn(build_prompt(s["intent"]))
        raw_params = parse_params(text)

        row = {
            "scenario_id": s["id"],
            "difficulty": s["difficulty"],
            "intent": s["intent"],
            "raw_output": text.strip()[:300],
            "valid_json": raw_params is not None,
            "duration_s": round(duration, 2),
        }

        if raw_params is None:
            row.update({
                "params": None, "sql": None, "sql_ok": False,
                "returned": [], "metrics": score_results([], s),
            })
            print(f"  [{s['id']:<22}] ❌ INVALID JSON ({duration:.2f}s)")
            results.append(row)
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
            print(f"  [{s['id']:<22}] ❌ SQL ERROR: {e}")
            row["metrics"] = score_results([], s)
            results.append(row)
            continue

        row["returned"] = returned
        row["metrics"] = score_results(returned, s)

        m = row["metrics"]
        icon = "✅" if m["f1"] >= 0.5 and m["forbidden_violations"] == 0 else "⚠️ " if m["f1"] >= 0.3 else "❌"
        print(f"  [{s['id']:<22}] {icon} F1={m['f1']:.2f} "
              f"P={m['precision']:.2f} R={m['recall']:.2f} "
              f"req={m['required_hit_rate']:.0%} "
              f"fbd={m['forbidden_violations']} "
              f"n={m['returned_count']} ({duration:.2f}s)")

        results.append(row)
    return results


def summarize(model_name: str, rows: list[dict]):
    print(f"\n── {model_name} summary ──")
    n = len(rows)
    valid_json   = sum(1 for r in rows if r["valid_json"])
    sql_ok       = sum(1 for r in rows if r.get("sql_ok"))
    f1_vals      = [r["metrics"]["f1"] for r in rows]
    precisions   = [r["metrics"]["precision"] for r in rows]
    recalls      = [r["metrics"]["recall"] for r in rows]
    req_hits     = [r["metrics"]["required_hit_rate"] for r in rows]
    fbd_total    = sum(r["metrics"]["forbidden_violations"] for r in rows)
    passes       = sum(1 for r in rows if r["metrics"]["f1"] >= 0.5 and r["metrics"]["forbidden_violations"] == 0)

    avg_f1   = sum(f1_vals) / n if n else 0
    avg_p    = sum(precisions) / n if n else 0
    avg_r    = sum(recalls) / n if n else 0
    avg_req  = sum(req_hits) / n if n else 0

    print(f"  Valid JSON:            {valid_json}/{n} ({valid_json/n:.0%})")
    print(f"  SQL executed:          {sql_ok}/{n} ({sql_ok/n:.0%})")
    print(f"  Scenarios passed (F1≥0.5 & no forbidden): {passes}/{n} ({passes/n:.0%})")
    print(f"  Avg F1:                {avg_f1:.2f}")
    print(f"  Avg precision:         {avg_p:.2f}")
    print(f"  Avg recall:            {avg_r:.2f}")
    print(f"  Avg required-hit rate: {avg_req:.0%}")
    print(f"  Forbidden violations:  {fbd_total} (total across scenarios)")

    # Breakdown by difficulty
    print(f"\n  By difficulty:")
    for diff in ["easy", "medium", "hard", "subjective"]:
        sub = [r for r in rows if r["difficulty"] == diff]
        if not sub:
            continue
        sub_f1 = sum(r["metrics"]["f1"] for r in sub) / len(sub)
        sub_pass = sum(1 for r in sub if r["metrics"]["f1"] >= 0.5 and r["metrics"]["forbidden_violations"] == 0)
        print(f"    {diff:12s}: {sub_pass}/{len(sub)} pass, avg F1={sub_f1:.2f}")

    return {
        "valid_json_rate": valid_json / n if n else 0,
        "sql_exec_rate": sql_ok / n if n else 0,
        "pass_rate": passes / n if n else 0,
        "avg_f1": round(avg_f1, 3),
        "avg_precision": round(avg_p, 3),
        "avg_recall": round(avg_r, 3),
        "avg_required_hit": round(avg_req, 3),
        "forbidden_violations_total": fbd_total,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("🏍  Intent → SQL Query Parameter Extraction Test")
    print(f"    Scenarios: {len(SCENARIOS)} | DB: 20 routes | Top-K: {RESULT_LIMIT}")

    # Load .env.local
    env_path = Path(".env.local")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

    # Build DB
    conn = build_db()

    # Load Qwen
    print("\n📦 Loading Qwen3.5 0.8B (MLX)...")
    qwen_model, qwen_tok = load(QWEN_MODEL)
    qwen_infer = lambda p: infer_qwen(qwen_model, qwen_tok, p)

    # Load Haiku
    haiku_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    haiku_infer = lambda p: infer_haiku(haiku_client, p)

    # Run
    qwen_rows  = run_model("Qwen3.5 0.8B (MLX)", qwen_infer, SCENARIOS, conn)
    haiku_rows = run_model("Haiku (baseline)", haiku_infer, SCENARIOS, conn)

    # Summarize
    print("\n" + "="*72)
    print("SUMMARY")
    print("="*72)
    qwen_sum  = summarize("Qwen3.5 0.8B", qwen_rows)
    haiku_sum = summarize("Haiku", haiku_rows)

    # Head-to-head
    print("\n── Head-to-head ──")
    agreements = 0
    for q, h in zip(qwen_rows, haiku_rows):
        q_ret = set(q["returned"])
        h_ret = set(h["returned"])
        overlap = len(q_ret & h_ret) / max(len(q_ret | h_ret), 1)
        agreements += overlap
        print(f"  {q['scenario_id']:<22} Qwen F1={q['metrics']['f1']:.2f}  Haiku F1={h['metrics']['f1']:.2f}  Jaccard overlap={overlap:.2f}")
    print(f"\n  Avg Jaccard(Qwen∩Haiku): {agreements/len(qwen_rows):.2f}")

    # Gate
    gate_pass = (
        qwen_sum["valid_json_rate"] >= 0.90
        and qwen_sum["pass_rate"] >= 0.60
        and qwen_sum["avg_f1"] >= 0.50
        and qwen_sum["forbidden_violations_total"] <= 3
    )

    print(f"\n{'─'*72}")
    print(f"  GATES (Qwen3.5):")
    print(f"    Valid JSON ≥90%:     {qwen_sum['valid_json_rate']:.0%}  {'✅' if qwen_sum['valid_json_rate'] >= 0.90 else '❌'}")
    print(f"    Pass rate ≥60%:      {qwen_sum['pass_rate']:.0%}  {'✅' if qwen_sum['pass_rate'] >= 0.60 else '❌'}")
    print(f"    Avg F1 ≥0.50:        {qwen_sum['avg_f1']:.2f}  {'✅' if qwen_sum['avg_f1'] >= 0.50 else '❌'}")
    print(f"    Forbidden ≤3:        {qwen_sum['forbidden_violations_total']}  {'✅' if qwen_sum['forbidden_violations_total'] <= 3 else '❌'}")
    print(f"\n  → INTENT → PARAMS USE CASE: {'✅ VIABLE' if gate_pass else '❌ NOT VIABLE'}")

    # Save
    output = {
        "test_type": "intent_to_query_validation",
        "date": datetime.now().isoformat(),
        "qwen_model": QWEN_MODEL,
        "haiku_model": HAIKU_MODEL,
        "db_size": 20,
        "scenarios_count": len(SCENARIOS),
        "qwen_results": qwen_rows,
        "haiku_results": haiku_rows,
        "qwen_summary": qwen_sum,
        "haiku_summary": haiku_sum,
        "gate_pass": gate_pass,
    }
    out_path = Path(f"intent_to_query_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    out_path.write_text(json.dumps(output, indent=2, default=str))
    print(f"\n💾 Full results → {out_path}")


if __name__ == "__main__":
    main()
