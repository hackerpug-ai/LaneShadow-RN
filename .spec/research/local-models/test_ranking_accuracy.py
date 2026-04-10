#!/usr/bin/env python3
"""
Ranking accuracy validation: Qwen3.5 0.8B vs Haiku.

Tests:
  1. Scale accuracy — precision@5 as candidate count grows (N=5,10,20,40,60)
  2. Failure modes — adversarial prompts exposing known small-model weaknesses
  3. Consistency  — temperature=0 repeatability across 10 runs

Run:
  source venv/bin/activate
  export ANTHROPIC_API_KEY=...
  python test_ranking_accuracy.py
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
    FULL_POOL, ANCHOR_CANDIDATES, get_pool, ground_truth_top_k,
    INTENTS, format_candidate,
)

QWEN_MODEL   = "mlx-community/Qwen3.5-0.8B-OptiQ-4bit"
HAIKU_MODEL  = "claude-haiku-4-5-20251001"
TOP_K        = 5
SCALES       = [5, 10, 20, 40, 60]
CONSISTENCY_RUNS = 10

# ─────────────────────────────────────────────────────────────────────────────
# Prompt builder
# ─────────────────────────────────────────────────────────────────────────────

def build_ranking_prompt(pool: list, intent_text: str, k: int = TOP_K) -> str:
    numbered = "\n".join(f"{i+1}. {format_candidate(c)}" for i, c in enumerate(pool))
    return f"""You are a motorcycle ride recommender. You pick rides from a pre-scored list.
You do not write descriptions. You do not invent IDs. You return JSON only.

User intent: {intent_text}

Candidates (scored 0.0–1.0, higher is better for each dimension):
{numbered}

Task: Return the top {k} IDs that best match the intent, ordered best first.
Respond with ONLY valid JSON: {{"picks": ["id1","id2","id3","id4","id5"]}}"""


# ─────────────────────────────────────────────────────────────────────────────
# Inference wrappers
# ─────────────────────────────────────────────────────────────────────────────

def infer_qwen(model, tokenizer, prompt: str, max_tokens: int = 200) -> tuple[str, float]:
    t0 = time.time()
    out = mlx_generate(model, tokenizer, prompt=prompt, max_tokens=max_tokens, verbose=False)
    return out, time.time() - t0


def infer_haiku(client, prompt: str) -> tuple[str, float]:
    t0 = time.time()
    msg = client.messages.create(
        model=HAIKU_MODEL,
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text, time.time() - t0


def parse_picks(text: str) -> list[str]:
    """Extract list of picks from model output, tolerating minor JSON issues."""
    m = re.search(r'\{[\s\S]*?"picks"[\s\S]*?\}', text)
    if m:
        try:
            return json.loads(m.group()).get("picks", [])
        except Exception:
            pass
    # Fallback: extract bare array
    m = re.search(r'\[([^\]]+)\]', text)
    if m:
        try:
            return json.loads(f'[{m.group(1)}]')
        except Exception:
            pass
    return []


def evaluate(picks: list, ground_truth: list, pool: list) -> dict:
    pool_ids = {c["id"] for c in pool}
    hallucinations = [p for p in picks if p not in pool_ids]
    duplicates     = len(picks) - len(set(picks))
    precision_at_k = len(set(picks) & set(ground_truth)) / TOP_K if picks else 0
    return {
        "precision_at_k": round(precision_at_k, 3),
        "hallucination_count": len(hallucinations),
        "hallucinated_ids": hallucinations,
        "duplicate_count": duplicates,
        "count_correct": len(picks) == TOP_K,
        "actual_count": len(picks),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Test 1: Scale accuracy
# ─────────────────────────────────────────────────────────────────────────────

def run_scale_test(qwen_model, qwen_tok, haiku_client) -> list[dict]:
    print("\n" + "="*70)
    print("TEST 1: SCALE ACCURACY")
    print("="*70)
    results = []

    for n in SCALES:
        for intent in INTENTS:
            pool = get_pool(n)
            gt   = ground_truth_top_k(pool, intent, TOP_K)
            prompt = build_ranking_prompt(pool, intent["text"])

            # Qwen
            q_text, q_dur = infer_qwen(qwen_model, qwen_tok, prompt)
            q_picks = parse_picks(q_text)
            q_eval  = evaluate(q_picks, gt, pool)
            q_eval.update({"valid_json": bool(q_picks), "duration_s": round(q_dur, 2)})

            # Haiku
            h_text, h_dur = infer_haiku(haiku_client, prompt)
            h_picks = parse_picks(h_text)
            h_eval  = evaluate(h_picks, gt, pool)
            h_eval.update({"valid_json": bool(h_picks), "duration_s": round(h_dur, 2)})

            overlap = len(set(q_picks) & set(h_picks)) / TOP_K if q_picks and h_picks else 0

            row = {
                "test": "scale",
                "n": n,
                "intent": intent["id"],
                "ground_truth": gt,
                "qwen": {"picks": q_picks, **q_eval},
                "haiku": {"picks": h_picks, **h_eval},
                "qwen_haiku_overlap": round(overlap, 3),
            }
            results.append(row)

            print(f"  N={n:3d} | intent={intent['id']:15s} | "
                  f"Qwen P@5={q_eval['precision_at_k']:.2f} | "
                  f"Haiku P@5={h_eval['precision_at_k']:.2f} | "
                  f"Overlap={overlap:.2f} | "
                  f"Qwen {q_dur:.2f}s / Haiku {h_dur:.2f}s")

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Test 2: Failure modes
# ─────────────────────────────────────────────────────────────────────────────

def run_failure_modes(qwen_model, qwen_tok, haiku_client) -> list[dict]:
    print("\n" + "="*70)
    print("TEST 2: FAILURE MODES")
    print("="*70)
    results = []
    REPS = 5  # runs per mode

    # ── Mode 2a: Positional bias ───────────────────────────────────────────
    print("\n  [2a] Positional bias (shuffle candidates 5 orders, compare picks)")
    pool_base = get_pool(20)
    intent    = INTENTS[0]  # twisty-sport
    pick_sets = []
    for shuffle_seed in range(REPS):
        import random; random.seed(shuffle_seed)
        shuffled = pool_base.copy(); random.shuffle(shuffled)
        prompt   = build_ranking_prompt(shuffled, intent["text"])
        text, _  = infer_qwen(qwen_model, qwen_tok, prompt)
        picks    = parse_picks(text)
        pick_sets.append(set(picks))
        print(f"    shuffle {shuffle_seed}: {picks}")

    agreement = len(set.intersection(*pick_sets)) / TOP_K if pick_sets else 0
    print(f"    Core agreement across shuffles: {agreement:.2f}")
    results.append({
        "mode": "positional_bias",
        "agreement_across_shuffles": round(agreement, 3),
        "pick_sets": [list(s) for s in pick_sets],
        "verdict": "OK" if agreement >= 0.6 else "BIAS_DETECTED",
    })

    # ── Mode 2b: Score blindness ───────────────────────────────────────────
    print("\n  [2b] Score blindness (paired candidates, same text, different curvature)")
    from test_fixtures import ANCHOR_CANDIDATES
    pairs = [
        ("score-pair-a1", "score-pair-b1"),
        ("score-pair-a2", "score-pair-b2"),
    ]
    pair_pool = [c for c in ANCHOR_CANDIDATES if c["id"] in
                 {p for pair in pairs for p in pair}]
    # Fill to 20 with fillers (no pair members)
    fillers = [c for c in get_pool(20) if c["id"] not in {c2["id"] for c2 in pair_pool}][:16]
    pair_pool_full = pair_pool + fillers

    correct = 0; total_pairs = 0
    for pair in pairs:
        a_id, b_id = pair
        prompt = build_ranking_prompt(pair_pool_full, "very twisty technical roads")
        text, _ = infer_qwen(qwen_model, qwen_tok, prompt)
        picks = parse_picks(text)
        # A has high curvature, B has low — A should win
        if a_id in picks and b_id not in picks:
            correct += 1
        elif a_id not in picks and b_id not in picks:
            pass  # neither picked — can't judge
        total_pairs += 1
        print(f"    pair A={a_id} B={b_id}: picks={picks}, A_preferred={a_id in picks and b_id not in picks}")
    blind_rate = 1 - (correct / max(total_pairs, 1))
    results.append({
        "mode": "score_blindness",
        "correct_pair_picks": correct,
        "total_pairs": total_pairs,
        "blindness_rate": round(blind_rate, 3),
        "verdict": "OK" if blind_rate <= 0.3 else "SCORE_BLIND",
    })

    # ── Mode 2c: Keyword attraction ────────────────────────────────────────
    print("\n  [2c] Keyword attraction ('Twisty Meadow Trail' has curvature=0.15)")
    trap = next(c for c in ANCHOR_CANDIDATES if c["id"] == "twisty-meadow-trap")
    real_twisty = next(c for c in ANCHOR_CANDIDATES if c["id"] == "ca36-mad-river")
    pool_with_trap = [trap, real_twisty] + get_pool(18)
    prompt = build_ranking_prompt(pool_with_trap, "the twistiest roads possible")
    q_text, _ = infer_qwen(qwen_model, qwen_tok, prompt)
    h_text, _ = infer_haiku(haiku_client, prompt)
    q_picks = parse_picks(q_text)
    h_picks = parse_picks(h_text)
    print(f"    Qwen picks: {q_picks}  (trap in picks: {'twisty-meadow-trap' in q_picks})")
    print(f"    Haiku picks: {h_picks} (trap in picks: {'twisty-meadow-trap' in h_picks})")
    results.append({
        "mode": "keyword_attraction",
        "qwen_picks": q_picks,
        "haiku_picks": h_picks,
        "qwen_trap_triggered": "twisty-meadow-trap" in q_picks,
        "haiku_trap_triggered": "twisty-meadow-trap" in h_picks,
        "verdict": "OK" if "twisty-meadow-trap" not in q_picks else "KEYWORD_BIASED",
    })

    # ── Mode 2d: Distractor susceptibility ────────────────────────────────
    print("\n  [2d] Distractor ('Lunch Spot at Mile 12' should never be picked)")
    from test_fixtures import ANCHOR_CANDIDATES
    distractor = next(c for c in ANCHOR_CANDIDATES if c["id"] == "lunch-stop-distract")
    pool_with_distract = [distractor] + get_pool(19)
    prompt = build_ranking_prompt(pool_with_distract, "best scenic motorcycle ride")
    q_text, _ = infer_qwen(qwen_model, qwen_tok, prompt)
    h_text, _ = infer_haiku(haiku_client, prompt)
    q_picks = parse_picks(q_text)
    h_picks = parse_picks(h_text)
    print(f"    Qwen picks: {q_picks} (distractor in: {'lunch-stop-distract' in q_picks})")
    print(f"    Haiku picks: {h_picks} (distractor in: {'lunch-stop-distract' in h_picks})")
    results.append({
        "mode": "distractor_susceptibility",
        "qwen_picks": q_picks,
        "haiku_picks": h_picks,
        "qwen_distracted": "lunch-stop-distract" in q_picks,
        "haiku_distracted": "lunch-stop-distract" in h_picks,
        "verdict": "OK" if "lunch-stop-distract" not in q_picks else "DISTRACTED",
    })

    # ── Mode 2e: Count violations ──────────────────────────────────────────
    print("\n  [2e] Count violations (ask for K=3,5,7,10 picks)")
    pool_cv = get_pool(20)
    count_results = {}
    for k in [3, 5, 7, 10]:
        prompt = build_ranking_prompt(pool_cv, "twisty sport roads", k=k)
        prompt = prompt.replace(f"top {TOP_K}", f"top {k}")
        prompt = prompt.replace(f'"picks": ["id1","id2","id3","id4","id5"]}}', f'"picks": ["id1",...(exactly {k} ids)...]}}')
        text, _ = infer_qwen(qwen_model, qwen_tok, prompt)
        picks = parse_picks(text)
        count_results[k] = {"requested": k, "returned": len(picks), "correct": len(picks) == k}
        print(f"    asked for {k}, got {len(picks)}: {'✓' if len(picks)==k else '✗'}")
    results.append({"mode": "count_violation", "by_k": count_results,
                    "verdict": "OK" if all(v["correct"] for v in count_results.values()) else "COUNT_ERRORS"})

    # ── Mode 2f: Hallucination ─────────────────────────────────────────────
    print("\n  [2f] Hallucination (picks must come from the pool)")
    hallucination_counts = []
    for intent in INTENTS:
        pool = get_pool(20)
        prompt = build_ranking_prompt(pool, intent["text"])
        text, _ = infer_qwen(qwen_model, qwen_tok, prompt)
        picks = parse_picks(text)
        pool_ids = {c["id"] for c in pool}
        h_count = sum(1 for p in picks if p not in pool_ids)
        hallucination_counts.append(h_count)
        print(f"    intent={intent['id']:15s}: {h_count} hallucinations in {picks}")
    total_h = sum(hallucination_counts)
    results.append({
        "mode": "hallucination",
        "total_hallucinations": total_h,
        "per_intent": hallucination_counts,
        "verdict": "OK" if total_h == 0 else f"HALLUCINATED_{total_h}",
    })

    # ── Mode 2g: Instruction inversion ────────────────────────────────────
    print("\n  [2g] Instruction inversion ('worst 5' should be anti-ranked)")
    pool = get_pool(20)
    gt_best  = ground_truth_top_k(pool, INTENTS[0], TOP_K)
    # Expected worst = bottom 5 of the same scoring
    gt_worst = ground_truth_top_k(pool, INTENTS[0], len(pool))[-TOP_K:]
    prompt_worst = build_ranking_prompt(pool, "worst 5 rides for someone who loves twisty roads").replace(
        "top 5 IDs that best match", "5 IDs that are the WORST match")
    q_text, _ = infer_qwen(qwen_model, qwen_tok, prompt_worst)
    h_text, _ = infer_haiku(haiku_client, prompt_worst)
    q_picks = parse_picks(q_text)
    h_picks = parse_picks(h_text)
    q_worst_match = len(set(q_picks) & set(gt_worst)) / TOP_K if q_picks else 0
    h_worst_match = len(set(h_picks) & set(gt_worst)) / TOP_K if h_picks else 0
    print(f"    Qwen worst match: {q_worst_match:.2f}  |  Haiku worst match: {h_worst_match:.2f}")
    results.append({
        "mode": "instruction_inversion",
        "qwen_worst_precision": round(q_worst_match, 3),
        "haiku_worst_precision": round(h_worst_match, 3),
        "verdict": "OK" if q_worst_match >= 0.4 else "INVERSION_FAILED",
    })

    # ── Mode 2h: Duplicate output ──────────────────────────────────────────
    print("\n  [2h] Duplicate output (picks should be unique)")
    dup_found = 0
    for intent in INTENTS:
        pool = get_pool(20)
        prompt = build_ranking_prompt(pool, intent["text"])
        text, _ = infer_qwen(qwen_model, qwen_tok, prompt)
        picks = parse_picks(text)
        dups = len(picks) - len(set(picks))
        if dups: dup_found += 1
        print(f"    intent={intent['id']:15s}: {dups} duplicates in {picks}")
    results.append({
        "mode": "duplicate_output",
        "intents_with_duplicates": dup_found,
        "verdict": "OK" if dup_found == 0 else f"DUPLICATES_IN_{dup_found}_INTENTS",
    })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Test 3: Consistency at temperature=0
# ─────────────────────────────────────────────────────────────────────────────

def run_consistency_test(qwen_model, qwen_tok) -> list[dict]:
    print("\n" + "="*70)
    print("TEST 3: CONSISTENCY (temperature=0, 10 runs same prompt)")
    print("="*70)
    results = []

    # Sample 3 representative prompts
    test_cases = [
        (get_pool(20), INTENTS[0]),
        (get_pool(20), INTENTS[2]),
        (get_pool(40), INTENTS[1]),
    ]

    for pool, intent in test_cases:
        prompt = build_ranking_prompt(pool, intent["text"])
        all_picks = []
        for run in range(CONSISTENCY_RUNS):
            text, _ = infer_qwen(qwen_model, qwen_tok, prompt)
            picks = parse_picks(text)
            all_picks.append(tuple(sorted(picks)))  # order-insensitive comparison

        unique_outputs = len(set(all_picks))
        most_common = max(set(all_picks), key=all_picks.count)
        most_common_freq = all_picks.count(most_common) / CONSISTENCY_RUNS

        print(f"  N={len(pool)} intent={intent['id']}: {unique_outputs} distinct outputs, "
              f"mode at {most_common_freq:.0%}")
        results.append({
            "n": len(pool),
            "intent": intent["id"],
            "distinct_outputs": unique_outputs,
            "mode_frequency": round(most_common_freq, 3),
            "verdict": "OK" if most_common_freq >= 0.7 else "INCONSISTENT",
        })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("🏍  Qwen3.5 vs Haiku — Ranking Accuracy Validation")
    print(f"    Pool: {len(FULL_POOL)} candidates | Scales: {SCALES} | Top-K: {TOP_K}")

    # Load env
    env_path = Path(".env.local")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

    # Load models
    print("\n📦 Loading Qwen3.5 0.8B (MLX)...")
    qwen_model, qwen_tok = load(QWEN_MODEL)

    haiku_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    # Run tests
    scale_results    = run_scale_test(qwen_model, qwen_tok, haiku_client)
    failure_results  = run_failure_modes(qwen_model, qwen_tok, haiku_client)
    consist_results  = run_consistency_test(qwen_model, qwen_tok)

    # Summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)

    # Scale: print accuracy curve
    print("\nScale accuracy (Qwen Precision@5 vs ground truth):")
    print(f"  {'N':>5} | {'twisty':>10} | {'mountain':>10} | {'low-traffic':>12} | {'adventure':>10} | avg")
    for n in SCALES:
        row_results = [r for r in scale_results if r["n"] == n]
        scores = {r["intent"]: r["qwen"]["precision_at_k"] for r in row_results}
        avg = sum(scores.values()) / len(scores) if scores else 0
        print(f"  {n:>5} | {scores.get('twisty-sport',0):>10.2f} | "
              f"{scores.get('scenic-mountain',0):>10.2f} | "
              f"{scores.get('low-traffic',0):>12.2f} | "
              f"{scores.get('adventure-dirt',0):>10.2f} | {avg:.2f}")

    # Failure modes
    print("\nFailure mode verdicts:")
    for r in failure_results:
        verdict = r.get("verdict", "?")
        icon = "✅" if verdict == "OK" else "❌"
        print(f"  {icon} {r['mode']:35s}: {verdict}")

    # Consistency
    print("\nConsistency verdicts:")
    for r in consist_results:
        icon = "✅" if r["verdict"] == "OK" else "❌"
        print(f"  {icon} N={r['n']:3d} intent={r['intent']:15s}: mode at {r['mode_frequency']:.0%} — {r['verdict']}")

    # Overall gate
    n20_scores = [r["qwen"]["precision_at_k"] for r in scale_results if r["n"] == 20]
    avg_at_20  = sum(n20_scores) / len(n20_scores) if n20_scores else 0
    json_rates  = [1 if r["qwen"]["valid_json"] else 0 for r in scale_results]
    avg_json    = sum(json_rates) / len(json_rates) if json_rates else 0
    all_no_halluc = all(r.get("total_hallucinations", 0) == 0 for r in failure_results if "total_hallucinations" in r)

    print(f"\n{'─'*70}")
    print(f"  Precision@5 at N=20: {avg_at_20:.2f}  (gate: ≥0.60)")
    print(f"  Valid JSON rate:      {avg_json:.0%}     (gate: ≥95%)")
    print(f"  Zero hallucinations:  {'YES' if all_no_halluc else 'NO'}")
    gate_pass = avg_at_20 >= 0.60 and avg_json >= 0.95 and all_no_halluc
    print(f"\n  → RANKING USE CASE: {'✅ VIABLE' if gate_pass else '❌ NOT VIABLE — use SQL ORDER BY'}")

    # Save results
    output = {
        "test_type": "ranking_accuracy_validation",
        "date": datetime.now().isoformat(),
        "model": QWEN_MODEL,
        "top_k": TOP_K,
        "scales": SCALES,
        "scale_results": scale_results,
        "failure_mode_results": failure_results,
        "consistency_results": consist_results,
        "gates": {
            "precision_at_20": round(avg_at_20, 3),
            "json_rate": round(avg_json, 3),
            "zero_hallucinations": all_no_halluc,
            "ranking_viable": gate_pass,
        },
    }
    out_path = Path(f"ranking_accuracy_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    out_path.write_text(json.dumps(output, indent=2))
    print(f"\n💾 Full results → {out_path}")


if __name__ == "__main__":
    main()
