#!/usr/bin/env python3
"""
PreToolUse hook: Block apply_patch commands that modify kb-run-sprint state files.

Codex apply_patch uses a diff-like format:
  *** Begin Patch
  *** Update File: path/to/file
  @@ ...
  -old line
  +new line
  *** End Patch

This hook parses the patch content for protected file paths and denies
if any match. See Codex issues #16732, #18295 for context on when this
hook becomes active (requires PreToolUse support for apply_patch tool).
"""
import json
import re
import sys

# Same protected patterns as pre_tool_use_protect_state.py
PROTECTED_PATTERNS = [
    re.compile(r"\.kb-run-sprint-codex/state\.json"),
    re.compile(r"\.kb-run-sprint-codex/tasks/"),
    re.compile(r"\.kb-run-sprint-codex/validation/"),
    re.compile(r"\.spec/.*?/\.kb-run-sprint-state\."),
    re.compile(r"\.spec/.*?/\.kb-run-epic-state\."),
]

# apply_patch file operation headers
FILE_OP_RE = re.compile(
    r"^\*\*\*\s+(?:Add|Update|Delete)\s+File:\s+(.+)$",
    re.MULTILINE,
)


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    # apply_patch is invoked via shell with the patch as the command argument
    # The tool_input may look like: {"command": ["apply_patch", "*** Begin Patch\n..."]}
    tool_input = payload.get("tool_input", {})

    # Handle both array form ["apply_patch", "...patch content..."] and string form
    command = tool_input.get("command", "")
    if isinstance(command, list):
        patch_content = " ".join(command[1:]) if len(command) > 1 else ""
    else:
        patch_content = str(command)

    if not patch_content:
        return 0

    # Extract all file paths from the patch
    file_matches = FILE_OP_RE.findall(patch_content)
    if not file_matches:
        return 0

    # Check each file path against protected patterns
    for file_path in file_matches:
        for pattern in PROTECTED_PATTERNS:
            if pattern.search(file_path):
                reason = (
                    "BLOCKED: Attempted to modify protected state file via apply_patch: "
                    f"{file_path}. State files (.kb-run-sprint-codex/*, .kb-run-sprint-state.*) "
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
