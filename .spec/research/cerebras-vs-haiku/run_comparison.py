#!/usr/bin/env python3
"""
Run LaneShadow agent fixtures against Cerebras and Anthropic models,
bundle responses, and emit a side-by-side markdown comparison.

Usage:
    python run_comparison.py                          # all fixtures, all models
    python run_comparison.py --fixture routing_agent  # single fixture
    python run_comparison.py --models llama3.1-8b,claude-haiku-4-5
    python run_comparison.py --dry-run                # print calls, make no API requests

Output:
    results/<timestamp>/raw_responses.jsonl
    results/<timestamp>/summary.md
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import traceback
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).parent
FIXTURES_DIR = ROOT / "fixtures"
RESULTS_DIR = ROOT / "results"
MODELS_PATH = ROOT / "models.json"


# -----------------------------------------------------------------------------
# Data classes
# -----------------------------------------------------------------------------

@dataclass
class ModelConfig:
    id: str
    provider: str  # "cerebras" | "anthropic"
    api_model_id: str
    context_window: int
    cost_per_1m_input_usd: float
    cost_per_1m_output_usd: float
    tier_candidate: str


@dataclass
class InvocationResult:
    model_id: str
    provider: str
    fixture: str
    user_message_id: str
    user_message_content: str
    expected_tool: str | None
    latency_ms: int
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    text_response: str = ""
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    error: str | None = None
    notes: str = ""


# -----------------------------------------------------------------------------
# Loading
# -----------------------------------------------------------------------------

def load_models() -> dict[str, ModelConfig]:
    data = json.loads(MODELS_PATH.read_text())
    return {m["id"]: ModelConfig(**m) for m in data["models"]}


def load_fixtures(only: str | None = None) -> list[dict[str, Any]]:
    fixtures = []
    for path in sorted(FIXTURES_DIR.glob("*.json")):
        if only and path.stem != only:
            continue
        fixtures.append(json.loads(path.read_text()))
    if only and not fixtures:
        raise SystemExit(f"fixture not found: {only}")
    return fixtures


# -----------------------------------------------------------------------------
# Provider adapters
# -----------------------------------------------------------------------------

def call_cerebras(model: ModelConfig, fixture: dict, user_msg: dict, dry_run: bool) -> InvocationResult:
    result = InvocationResult(
        model_id=model.id,
        provider=model.provider,
        fixture=fixture["name"],
        user_message_id=user_msg["id"],
        user_message_content=user_msg["content"],
        expected_tool=user_msg.get("expected_first_tool") or user_msg.get("expected_tool"),
        latency_ms=0,
        notes=user_msg.get("notes", ""),
    )

    if dry_run:
        result.text_response = "[dry-run]"
        return result

    try:
        from openai import OpenAI
    except ImportError as e:
        result.error = f"openai not installed: {e}"
        return result

    api_key = os.environ.get("CEREBRAS_API_KEY")
    if not api_key:
        result.error = "CEREBRAS_API_KEY not set"
        return result

    client = OpenAI(api_key=api_key, base_url="https://api.cerebras.ai/v1")

    # Convert fixture tools → OpenAI tool schema
    openai_tools = [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["parameters"],
            },
        }
        for t in fixture["tools"]
    ]

    t0 = time.time()
    try:
        resp = client.chat.completions.create(
            model=model.api_model_id,
            messages=[
                {"role": "system", "content": fixture["system_prompt"]},
                {"role": "user", "content": user_msg["content"]},
            ],
            tools=openai_tools,
            tool_choice="auto",
            temperature=0,
            max_tokens=1024,
        )
    except Exception as e:
        result.latency_ms = int((time.time() - t0) * 1000)
        result.error = f"{type(e).__name__}: {e}"
        return result

    result.latency_ms = int((time.time() - t0) * 1000)

    choice = resp.choices[0]
    msg = choice.message
    result.text_response = msg.content or ""

    if msg.tool_calls:
        for tc in msg.tool_calls:
            try:
                parsed_args = json.loads(tc.function.arguments)
            except Exception:
                parsed_args = {"__raw__": tc.function.arguments}
            result.tool_calls.append({
                "name": tc.function.name,
                "arguments": parsed_args,
            })

    usage = getattr(resp, "usage", None)
    if usage:
        result.input_tokens = getattr(usage, "prompt_tokens", 0) or 0
        result.output_tokens = getattr(usage, "completion_tokens", 0) or 0
        result.cost_usd = (
            (result.input_tokens / 1_000_000) * model.cost_per_1m_input_usd
            + (result.output_tokens / 1_000_000) * model.cost_per_1m_output_usd
        )

    return result


def call_anthropic(model: ModelConfig, fixture: dict, user_msg: dict, dry_run: bool) -> InvocationResult:
    result = InvocationResult(
        model_id=model.id,
        provider=model.provider,
        fixture=fixture["name"],
        user_message_id=user_msg["id"],
        user_message_content=user_msg["content"],
        expected_tool=user_msg.get("expected_first_tool") or user_msg.get("expected_tool"),
        latency_ms=0,
        notes=user_msg.get("notes", ""),
    )

    if dry_run:
        result.text_response = "[dry-run]"
        return result

    try:
        import anthropic
    except ImportError as e:
        result.error = f"anthropic not installed: {e}"
        return result

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        result.error = "ANTHROPIC_API_KEY not set"
        return result

    client = anthropic.Anthropic(api_key=api_key)

    # Convert fixture tools → Anthropic tool schema
    anthropic_tools = [
        {
            "name": t["name"],
            "description": t["description"],
            "input_schema": t["parameters"],
        }
        for t in fixture["tools"]
    ]

    t0 = time.time()
    try:
        resp = client.messages.create(
            model=model.api_model_id,
            max_tokens=1024,
            temperature=0,
            system=fixture["system_prompt"],
            tools=anthropic_tools,
            messages=[
                {"role": "user", "content": user_msg["content"]},
            ],
        )
    except Exception as e:
        result.latency_ms = int((time.time() - t0) * 1000)
        result.error = f"{type(e).__name__}: {e}"
        return result

    result.latency_ms = int((time.time() - t0) * 1000)

    text_parts = []
    for block in resp.content:
        btype = getattr(block, "type", None)
        if btype == "text":
            text_parts.append(block.text)
        elif btype == "tool_use":
            result.tool_calls.append({
                "name": block.name,
                "arguments": block.input,
            })
    result.text_response = "".join(text_parts)

    usage = getattr(resp, "usage", None)
    if usage:
        result.input_tokens = getattr(usage, "input_tokens", 0) or 0
        result.output_tokens = getattr(usage, "output_tokens", 0) or 0
        result.cost_usd = (
            (result.input_tokens / 1_000_000) * model.cost_per_1m_input_usd
            + (result.output_tokens / 1_000_000) * model.cost_per_1m_output_usd
        )

    return result


def call_model(model: ModelConfig, fixture: dict, user_msg: dict, dry_run: bool) -> InvocationResult:
    if model.provider == "cerebras":
        return call_cerebras(model, fixture, user_msg, dry_run)
    if model.provider == "anthropic":
        return call_anthropic(model, fixture, user_msg, dry_run)
    raise ValueError(f"unknown provider: {model.provider}")


# -----------------------------------------------------------------------------
# Grading
# -----------------------------------------------------------------------------

def grade(result: InvocationResult) -> dict[str, Any]:
    grade = {
        "tool_match": None,        # True/False/None(no expectation)
        "concise_text": None,       # True/False/None(no text)
        "has_error": result.error is not None,
    }

    first_tool = result.tool_calls[0]["name"] if result.tool_calls else None

    if result.expected_tool is None:
        # Expected NO tool — model should answer directly
        grade["tool_match"] = (first_tool is None)
    else:
        grade["tool_match"] = (first_tool == result.expected_tool)

    if result.text_response:
        # "1-2 sentences" ≈ ≤ 280 chars as a rough heuristic
        grade["concise_text"] = len(result.text_response) <= 280

    return grade


# -----------------------------------------------------------------------------
# Summary rendering
# -----------------------------------------------------------------------------

def render_summary(all_results: list[InvocationResult], models: dict[str, ModelConfig]) -> str:
    lines = []
    lines.append("# Cerebras vs Haiku — Comparison Summary")
    lines.append("")
    lines.append(f"Generated: {datetime.now(timezone.utc).isoformat()}")
    lines.append("")

    # Group by fixture → user_message → model
    fixtures = {}
    for r in all_results:
        fixtures.setdefault(r.fixture, {}).setdefault(r.user_message_id, {})[r.model_id] = r

    # Aggregate scorecard
    scorecard: dict[str, dict[str, int]] = {}
    for r in all_results:
        g = grade(r)
        row = scorecard.setdefault(r.model_id, {"total": 0, "tool_match": 0, "concise": 0, "errors": 0, "cost": 0.0, "latency_sum": 0})
        row["total"] += 1
        if g["tool_match"]:
            row["tool_match"] += 1
        if g["concise_text"]:
            row["concise"] += 1
        if g["has_error"]:
            row["errors"] += 1
        row["cost"] += r.cost_usd
        row["latency_sum"] += r.latency_ms

    lines.append("## Scorecard")
    lines.append("")
    lines.append("| Model | Tool-match | Concise | Errors | Avg latency | Total cost |")
    lines.append("|---|---|---|---|---|---|")
    for model_id, row in scorecard.items():
        tm = f"{row['tool_match']}/{row['total']}"
        cc = f"{row['concise']}/{row['total']}"
        er = f"{row['errors']}/{row['total']}"
        avg_ms = row["latency_sum"] // max(row["total"], 1)
        cost = f"${row['cost']:.6f}"
        lines.append(f"| `{model_id}` | {tm} | {cc} | {er} | {avg_ms} ms | {cost} |")
    lines.append("")

    # Per-fixture detail
    for fname in sorted(fixtures):
        lines.append(f"## Fixture: `{fname}`")
        lines.append("")
        for umsg_id in sorted(fixtures[fname]):
            by_model = fixtures[fname][umsg_id]
            any_result = next(iter(by_model.values()))
            lines.append(f"### `{umsg_id}` — \"{any_result.user_message_content}\"")
            if any_result.notes:
                lines.append(f"> {any_result.notes}")
            if any_result.expected_tool is not None:
                lines.append(f"**Expected tool**: `{any_result.expected_tool}`")
            else:
                lines.append("**Expected tool**: (none — direct answer)")
            lines.append("")
            lines.append("| Model | First tool | Args | Text | ✓ | Latency | Cost |")
            lines.append("|---|---|---|---|---|---|---|")
            for model_id in sorted(by_model):
                r = by_model[model_id]
                g = grade(r)
                if r.error:
                    first = "ERROR"
                    args_preview = ""
                    text_preview = r.error[:80]
                    ok = "✗"
                else:
                    first = r.tool_calls[0]["name"] if r.tool_calls else "—"
                    args_preview = ""
                    if r.tool_calls:
                        args_str = json.dumps(r.tool_calls[0]["arguments"])[:60]
                        args_preview = f"`{args_str}`"
                    text_preview = (r.text_response or "").replace("\n", " ")[:80]
                    tool_ok = g["tool_match"]
                    ok = "✓" if tool_ok else "✗"
                cost = f"${r.cost_usd:.6f}"
                lines.append(f"| `{model_id}` | `{first}` | {args_preview} | {text_preview} | {ok} | {r.latency_ms} ms | {cost} |")
            lines.append("")

    return "\n".join(lines)


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--fixture", help="Run a single fixture by name (e.g. routing_agent)")
    p.add_argument("--models", help="Comma-separated model ids from models.json")
    p.add_argument("--dry-run", action="store_true", help="Do not make API calls")
    args = p.parse_args()

    models = load_models()
    if args.models:
        wanted = [m.strip() for m in args.models.split(",") if m.strip()]
        models = {k: v for k, v in models.items() if k in wanted}
        if not models:
            raise SystemExit(f"no models matched: {args.models}")

    fixtures = load_fixtures(only=args.fixture)

    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_dir = RESULTS_DIR / ts
    out_dir.mkdir(parents=True, exist_ok=True)

    raw_path = out_dir / "raw_responses.jsonl"
    summary_path = out_dir / "summary.md"

    all_results: list[InvocationResult] = []

    total = sum(len(models) * len(f["user_messages"]) for f in fixtures)
    done = 0

    with raw_path.open("w") as raw_fh:
        for fixture in fixtures:
            for user_msg in fixture["user_messages"]:
                for model in models.values():
                    done += 1
                    print(f"[{done}/{total}] {fixture['name']}/{user_msg['id']} → {model.id}", flush=True)
                    try:
                        result = call_model(model, fixture, user_msg, args.dry_run)
                    except Exception as e:
                        traceback.print_exc()
                        result = InvocationResult(
                            model_id=model.id,
                            provider=model.provider,
                            fixture=fixture["name"],
                            user_message_id=user_msg["id"],
                            user_message_content=user_msg["content"],
                            expected_tool=user_msg.get("expected_first_tool") or user_msg.get("expected_tool"),
                            latency_ms=0,
                            error=f"harness crash: {type(e).__name__}: {e}",
                        )
                    all_results.append(result)
                    raw_fh.write(json.dumps(asdict(result)) + "\n")
                    raw_fh.flush()

    summary_path.write_text(render_summary(all_results, models))
    print()
    print(f"Raw responses: {raw_path}")
    print(f"Summary:       {summary_path}")


if __name__ == "__main__":
    main()
