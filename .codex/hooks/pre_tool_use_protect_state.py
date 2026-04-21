#!/usr/bin/env python3
"""
PreToolUse hook: Block Bash commands that modify kb-run-sprint state files.

Codex PreToolUse currently only intercepts Bash tool calls, not Write/Edit.
This blocks shell-level mutations (rm, sed -i, cat >, tee, chmod +w, etc.)
against orchestrator state files.

The orchestrator (kb-run-sprint-codex skill running in Claude Code) owns
these files. Codex subagents must never touch them.
"""
import json
import re
import sys

# Paths that are owned exclusively by the kb-run-sprint orchestrator.
PROTECTED_PATTERNS = [
    re.compile(r"\.kb-run-sprint-codex/state\.json"),
    re.compile(r"\.kb-run-sprint-codex/tasks/"),
    re.compile(r"\.kb-run-sprint-codex/validation/"),
    re.compile(r"\.spec/.*?/\.kb-run-sprint-state\."),
    re.compile(r"\.spec/.*?/\.kb-run-epic-state\."),
]


def command_touches_protected(command: str) -> list[str]:
    """Return list of protected patterns matched in the command."""
    hits = []
    for pattern in PROTECTED_PATTERNS:
        if pattern.search(command):
            hits.append(pattern.pattern)
    return hits


def is_mutation_command(command: str) -> bool:
    """Heuristic: does this command write/mutate files?"""
    mutation_signs = [
        r"\bcat\s*>\s",          # cat redirect write
        r"\btee\b",              # tee write
        r"\bsed\s.*-i",          # sed in-place
        r"\bawk\s.*-i",          # awk in-place
        r"\brm\s",               # remove
        r"\bmv\b",               # move/rename
        r"\bchmod\b",            # permission change
        r"\btruncate\b",         # truncate file
        r"\bdd\s",               # dd write
        r"\bpython.*open\s*\(.*['\"]w",  # python write
        r">>",                    # append redirect
        r"(?<!\S)>",             # stdout redirect (not >>)
    ]
    for sign in mutation_signs:
        if re.search(sign, command):
            return True
    return False


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    command = payload.get("tool_input", {}).get("command", "")
    if not command:
        return 0

    protected_hits = command_touches_protected(command)
    if not protected_hits:
        return 0

    if is_mutation_command(command):
        reason = (
            "BLOCKED: Attempted to modify protected state file(s). "
            "State files (.kb-run-sprint-codex/*, .kb-run-sprint-state.*) "
            "are owned exclusively by the Claude Code orchestrator. "
            "Do not modify them from Codex."
        )
        json.dump(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            },
            sys.stdout,
        )
        sys.stdout.write("\n")
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
