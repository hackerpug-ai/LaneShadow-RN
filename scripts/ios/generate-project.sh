#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
IOS_DIR="${REPO_ROOT}/ios"

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "error: xcodegen is required. Install with: brew install xcodegen" >&2
  exit 1
fi

cd "${IOS_DIR}"
xcodegen generate --spec project.yml --project .

# Normalize NativeSandbox folder reference path so generated pbxproj is stable
# across main checkout and deeper agent worktrees.
perl -0pi -e 's#path = "\.\./(?:\.\./)+native-sandbox/ios"; sourceTree = SOURCE_ROOT;#path = "../../native-sandbox/ios"; sourceTree = SOURCE_ROOT;#g' \
  "${IOS_DIR}/LaneShadow.xcodeproj/project.pbxproj"
