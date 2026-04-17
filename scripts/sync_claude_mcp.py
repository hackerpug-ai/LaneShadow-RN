#!/usr/bin/env python3
"""Sync project-local MCP server definitions into Claude's global settings."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def dump_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")


def merge_mcp_servers(
    source_payload: dict[str, Any],
    target_payload: dict[str, Any],
) -> tuple[dict[str, Any], list[str]]:
    source_servers = source_payload.get("mcpServers")
    if not isinstance(source_servers, dict) or not source_servers:
        raise ValueError("Source config does not contain a non-empty 'mcpServers' object.")

    target_servers = target_payload.setdefault("mcpServers", {})
    if not isinstance(target_servers, dict):
        raise ValueError("Target config has a non-object 'mcpServers' value.")

    changed: list[str] = []
    for name, server_config in source_servers.items():
        if target_servers.get(name) != server_config:
            target_servers[name] = server_config
            changed.append(name)
    return target_payload, changed


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        default=".mcp.json",
        help="Project-local MCP config to read from.",
    )
    parser.add_argument(
        "--target",
        default="~/.claude/settings.json",
        help="Claude settings JSON file to update.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the MCP server names that would be synced without writing.",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    source_path = Path(args.source).expanduser().resolve()
    target_path = Path(args.target).expanduser()

    source_payload = load_json(source_path)
    target_payload = load_json(target_path) if target_path.exists() else {}
    merged_payload, changed = merge_mcp_servers(source_payload, target_payload)

    if args.dry_run:
        print(json.dumps({"target": str(target_path), "changed": changed}, indent=2))
        return 0

    dump_json(target_path, merged_payload)
    print(json.dumps({"target": str(target_path), "changed": changed}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
