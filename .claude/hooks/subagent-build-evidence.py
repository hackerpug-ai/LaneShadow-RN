#!/usr/bin/env python3
"""
SubagentStop hook: require structured build evidence when a subagent commits
iOS or Android changes.

Extends subagent-precommit-gate.py with a platform-aware check — the gate
ensures CODE is committed; this ensures BUILDS were actually verified.

Rationale: LLM reward-hacking tends to produce "build passes" / "tests pass"
claims in free text without the subagent ever having invoked xcodebuild or
gradlew. This hook reads the transcript and confirms the specialist actually
ran the platform toolchain against the files it changed.

Exit codes:
  0 = ALLOW (no mobile changes, or evidence present, or infra error)
  2 = BLOCK (mobile files committed, but no build evidence in transcript)

Only active in LaneShadow project. Relies on Claude Code's SubagentStop
payload containing `transcript_path`.
"""

import json
import os
import re
import subprocess
import sys

IOS_EXTS = (".swift", ".m", ".mm", ".h")
IOS_MARKERS = ("ios/", "LaneShadow.xcodeproj", "Package.swift")
ANDROID_EXTS = (".kt", ".kts")
ANDROID_MARKERS = ("android/", "build.gradle", "settings.gradle")

# Tokens in the transcript that count as genuine build evidence.
IOS_EVIDENCE = (
    "xcodebuild",
    "xcrun simctl",
    "mcp__XcodeBuildMCP",   # MCP tool names are namespaced
    "mcp__xcode",
    "xcrun mcpbridge",
)
ANDROID_EVIDENCE = (
    "./gradlew",
    "gradle",
    "adb install",
    "adb shell",
    "mcp__android",
)


def git(cwd, *args):
    try:
        r = subprocess.run(
            ["git", "-C", cwd, *args],
            capture_output=True, text=True, timeout=10,
        )
        return r.returncode, r.stdout, r.stderr
    except Exception:
        return -1, "", ""


def committed_files_on_branch(cwd):
    """Files committed on this branch but not on main."""
    rc, base, _ = git(cwd, "rev-parse", "--verify", "main")
    if rc != 0:
        rc, base, _ = git(cwd, "rev-parse", "--verify", "master")
        if rc != 0:
            return []
    rc, out, _ = git(cwd, "diff", "--name-only", "main..HEAD")
    if rc != 0:
        return []
    return [line.strip() for line in out.splitlines() if line.strip()]


def classify(files):
    ios = any(
        f.endswith(IOS_EXTS) or any(m in f for m in IOS_MARKERS) for f in files
    )
    android = any(
        f.endswith(ANDROID_EXTS) or any(m in f for m in ANDROID_MARKERS)
        for f in files
    )
    return ios, android


def transcript_text(path):
    if not path or not os.path.exists(path):
        return ""
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    except Exception:
        return ""


def has_evidence(transcript, tokens):
    return any(tok in transcript for tok in tokens)


def block(msg):
    bar = "=" * 72
    print(bar, file=sys.stderr)
    print("BLOCKED by subagent-build-evidence", file=sys.stderr)
    print(bar, file=sys.stderr)
    print(msg, file=sys.stderr)
    print(bar, file=sys.stderr)
    sys.exit(2)


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    if payload.get("stop_hook_active"):
        sys.exit(0)

    cwd = payload.get("cwd") or os.getcwd()
    transcript_path = payload.get("transcript_path", "")

    # Only enforce inside the LaneShadow repo.
    rc, root, _ = git(cwd, "rev-parse", "--show-toplevel")
    if rc != 0 or "LaneShadow" not in root:
        sys.exit(0)

    files = committed_files_on_branch(cwd)
    if not files:
        sys.exit(0)

    ios, android = classify(files)
    if not (ios or android):
        sys.exit(0)

    text = transcript_text(transcript_path)
    if not text:
        # Can't verify — fail open (don't block on infra). Still surface a warning.
        print(
            "[subagent-build-evidence] WARNING: transcript unreadable — "
            "cannot verify build evidence. Orchestrator must review manually.",
            file=sys.stderr,
        )
        sys.exit(0)

    problems = []
    if ios and not has_evidence(text, IOS_EVIDENCE):
        problems.append(
            "iOS files changed but transcript contains NO xcodebuild / "
            "XcodeBuildMCP invocation. A build-PASS claim without "
            "toolchain evidence is not acceptable.\n"
            "  iOS files committed: "
            + ", ".join(f for f in files if f.endswith(IOS_EXTS) or any(m in f for m in IOS_MARKERS))[:400]
        )
    if android and not has_evidence(text, ANDROID_EVIDENCE):
        problems.append(
            "Android files changed but transcript contains NO gradlew / "
            "adb / android MCP invocation. A build-PASS claim without "
            "toolchain evidence is not acceptable.\n"
            "  Android files committed: "
            + ", ".join(f for f in files if f.endswith(ANDROID_EXTS) or any(m in f for m in ANDROID_MARKERS))[:400]
        )

    if problems:
        block(
            "\n".join(problems)
            + "\n\nREQUIRED: actually build and test the platform you changed, "
              "then commit again so the transcript contains evidence. "
              "Do not rationalize ('ran earlier', 'trivial change', 'types-only') — "
              "run the toolchain in this session."
        )


if __name__ == "__main__":
    main()
