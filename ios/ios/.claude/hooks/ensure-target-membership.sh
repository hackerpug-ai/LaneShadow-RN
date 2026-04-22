#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_FILE="$IOS_ROOT/LaneShadow.xcodeproj/project.pbjproj"

echo "[ensure-target-membership] Checking Swift files for target membership..."

# Find Swift files added in this commit
SWIFT_FILES=$(git diff --cached --name-only --diff-filter=AC | grep '\.swift$' || true)

if [[ -z "$SWIFT_FILES" ]]; then
    echo "[ensure-target-membership] No new Swift files in this commit"
    exit 0
fi

echo "[ensure-target-membership] Found $(echo "$SWIFT_FILES" | wc -l) new Swift files"

# Check each file is in correct target
for file in $SWIFT_FILES; do
    filename=$(basename "$file")
    echo "[ensure-target-membership] Checking $filename..."
    
    # Simple check: file must be referenced in project.pbxproj
    if ! grep -q "$filename" "$PROJECT_FILE" 2>/dev/null; then
        echo "[ensure-target-membership] WARNING: $filename not in project.pbxproj"
        echo "[ensure-target-membership] Please add it to the LaneShadow target in Xcode"
        exit 1
    fi
done

echo "[ensure-target-membership] All Swift files are registered in project"
exit 0
