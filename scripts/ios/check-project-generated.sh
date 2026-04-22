#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

"${SCRIPT_DIR}/generate-project.sh"

if ! git -C "${REPO_ROOT}" diff --quiet -- \
  ios/LaneShadow.xcodeproj/project.pbxproj \
  ios/LaneShadow.xcodeproj/project.xcworkspace/contents.xcworkspacedata \
  ios/LaneShadow.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved \
  ios/LaneShadow.xcodeproj/xcshareddata/xcschemes/LaneShadow.xcscheme; then
  echo "error: generated Xcode project is not up to date. Run scripts/ios/generate-project.sh and commit the result." >&2
  exit 1
fi
