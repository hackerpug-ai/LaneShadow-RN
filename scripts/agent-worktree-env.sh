#!/bin/bash
# agent-worktree-env.sh — per-worktree runtime isolation for parallel agents
#
# Source this when a specialist agent enters a git worktree so its iOS and
# Android builds do not collide with the main tree (or other worktrees) on
# shared caches, daemons, or simulator/emulator state.
#
# Usage (from orchestrator, after `git worktree add`):
#   cd .claude/worktrees/$TASK_ID
#   source ../../scripts/agent-worktree-env.sh
#
# Covers runtime-isolation gaps that git worktrees do NOT solve:
#   - Xcode DerivedData (one global cache → corrupt incremental builds)
#   - Gradle user home (daemon/cache contention across worktrees)
#   - Kotlin/Swift package caches
#
# Device reservation (simulator UDID, emulator port) is NOT set here —
# that belongs to the orchestrator before dispatch (see RULES.md).

set -u

_worktree_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "agent-worktree-env: not in a git repo — skipping" >&2
  return 0 2>/dev/null || exit 0
}

_common_dir=$(git rev-parse --git-common-dir 2>/dev/null)
_git_dir=$(git rev-parse --git-dir 2>/dev/null)

if [ "$_common_dir" = "$_git_dir" ]; then
  echo "agent-worktree-env: not in a worktree (main tree) — no overrides applied" >&2
  return 0 2>/dev/null || exit 0
fi

_task_id=$(basename "$_worktree_root")
_cache_base="$_worktree_root/.agent-cache"
mkdir -p "$_cache_base/derived-data" "$_cache_base/gradle" "$_cache_base/spm"

# Xcode: per-worktree DerivedData (agents must pass -derivedDataPath to xcodebuild)
export DERIVED_DATA_PATH="$_cache_base/derived-data"

# Gradle: per-worktree user home = isolated daemon, cache, wrapper dists
export GRADLE_USER_HOME="$_cache_base/gradle"

# Swift Package Manager cache (affects xcodebuild resolution)
export SWIFTPM_CACHE_DIR="$_cache_base/spm"

# Surface that isolation is active — agents should log this in their first
# build invocation so reviewers can verify no contention occurred.
echo "agent-worktree-env: task=$_task_id isolation active" >&2
echo "  DERIVED_DATA_PATH=$DERIVED_DATA_PATH" >&2
echo "  GRADLE_USER_HOME=$GRADLE_USER_HOME" >&2
echo "  SWIFTPM_CACHE_DIR=$SWIFTPM_CACHE_DIR" >&2
echo "  (Simulator UDID / Emulator port must be set by the orchestrator before dispatch.)" >&2
