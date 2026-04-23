#!/bin/bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
ORIGINAL_PWD=$(pwd)

cd "$REPO_ROOT"
source "$REPO_ROOT/scripts/agent-worktree-env.sh"
cd "$ORIGINAL_PWD"

DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-$REPO_ROOT/.agent-cache/derived-data}"
SWIFTPM_CACHE_DIR="${SWIFTPM_CACHE_DIR:-$REPO_ROOT/.agent-cache/spm}"

mkdir -p "$DERIVED_DATA_PATH" "$SWIFTPM_CACHE_DIR"

exec xcodebuild "$@" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  -clonedSourcePackagesDirPath "$SWIFTPM_CACHE_DIR"
