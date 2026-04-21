#!/usr/bin/env python3
"""
Codex PreToolUse hook: block shell-level mutations to .pbxproj / .xcodeproj.

Mirrors ~/.claude/hooks/protect-xcode-project.py but written for the Codex
hook contract (JSON stdout with hookSpecificOutput).

Codex currently only intercepts Bash (apply_patch matcher is dormant pending
openai/codex#18295). Once apply_patch ships, this script is reused by
pre_tool_use_protect_xcode_patch.py — keep the detection logic in sync.
"""

import json
import re
import sys
from typing import Optional

FORBIDDEN_MARKERS = (".pbxproj", ".xcodeproj", ".xcworkspace")
ALLOWLIST = ("xcuserdata/", "UserInterfaceState.xcuserstate")

WRITE_PATTERNS = [
    re.compile(r"[>|]\s*(\S*\.pbxproj)"),
    re.compile(r"[>|]\s*(\S*\.xcodeproj/\S+)"),
    re.compile(r"[>|]\s*(\S*\.xcworkspace/\S+)"),
    re.compile(r"sed\s+-i\S*\s+.*?(\S+\.pbxproj)"),
    re.compile(r"sed\s+-i\S*\s+.*?(\S+\.xcodeproj/\S+)"),
    re.compile(r"\b(?:cp|mv|rm|tee|chmod)\b[^\n]*?(\S+\.pbxproj)"),
    re.compile(r"\b(?:cp|mv|rm|tee|chmod)\b[^\n]*?(\S+\.xcodeproj/\S+)"),
    re.compile(r"\b(?:cp|mv|rm|tee|chmod)\b[^\n]*?(\S+\.xcworkspace/\S+)"),
]


def find_violation(command: str) -> Optional[str]:
    if not command or not any(m in command for m in FORBIDDEN_MARKERS):
        return None
    for pat in WRITE_PATTERNS:
        m = pat.search(command)
        if m:
            target = m.group(1)
            if not any(a in target for a in ALLOWLIST):
                return target
    return None


def deny(target: str) -> None:
    reason = (
        f"BLOCKED: shell write to {target}. "
        "Agents must not modify .pbxproj / .xcodeproj internals — "
        "Xcode target membership and build settings must be edited by "
        "a human in Xcode. If a file needs to be added to a target, stop "
        "and ask the user."
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


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    command = payload.get("tool_input", {}).get("command", "")
    target = find_violation(command)
    if target:
        deny(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
