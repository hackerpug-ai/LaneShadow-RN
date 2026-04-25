#!/bin/bash

# iOS-Android Story Parity Check Script
#
# This script verifies that iOS story IDs include all expected stories from the parity manifest.
# The parity manifest defines the minimum required set (shared ∪ ios_only).
# iOS may have additional stories beyond what's in the manifest.
#
# Usage: ./scripts/sandbox/parity-check.sh
#
# Exit codes:
#   0 - Parity check passed (all expected IDs found in iOS)
#   1 - Parity check failed (missing expected IDs)
#   2 - Script error (missing files, invalid JSON, etc.)

set -euo pipefail

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Define file paths
IOS_STORY_IDS_SCRIPT="$SCRIPT_DIR/list-ios-story-ids.sh"
PARITY_MANIFEST="$PROJECT_ROOT/tokens/sandbox/stories.parity.json"

# Check if required files exist
if [[ ! -f "$IOS_STORY_IDS_SCRIPT" ]]; then
    echo "Error: iOS story IDs script not found at $IOS_STORY_IDS_SCRIPT" >&2
    exit 2
fi

if [[ ! -f "$PARITY_MANIFEST" ]]; then
    echo "Error: Parity manifest not found at $PARITY_MANIFEST" >&2
    exit 2
fi

# Extract iOS story IDs
echo "Extracting iOS story IDs..."
mapfile -t IOS_IDS < <("$IOS_STORY_IDS_SCRIPT")

if [[ ${#IOS_IDS[@]} -eq 0 ]]; then
    echo "Error: No iOS story IDs found" >&2
    exit 2
fi

echo "Found ${#IOS_IDS[@]} iOS story IDs"
echo ""

# Extract expected IDs from parity manifest (shared + ios_only)
echo "Extracting expected IDs from parity manifest..."

# Use Node.js to parse JSON reliably
EXPECTED_IDS=$(node -e "
    const fs = require('fs');
    const manifest = JSON.parse(fs.readFileSync('$PARITY_MANIFEST', 'utf8'));
    const shared = manifest.shared || [];
    const iosOnly = manifest.ios_only || [];
    const allExpected = [...shared, ...iosOnly];
    allExpected.forEach(id => console.log(id));
" 2>/dev/null) || {
    echo "Error: Failed to parse parity manifest JSON" >&2
    exit 2
}

mapfile -t EXPECTED_IDS < <(echo "$EXPECTED_IDS")

if [[ ${#EXPECTED_IDS[@]} -eq 0 ]]; then
    echo "Error: No expected IDs found in parity manifest" >&2
    exit 2
fi

echo "Found ${#EXPECTED_IDS[@]} expected IDs (shared + ios_only)"
echo ""

# Convert arrays to sorted strings for comparison
IFS=$'\n' IOS_IDS_SORTED=($(sort <<<"${IOS_IDS[*]}"))
IFS=$'\n' EXPECTED_IDS_SORTED=($(sort <<<"${EXPECTED_IDS[*]}"))

# Find IDs that are in expected but not in iOS (missing) - THIS IS THE ERROR
MISSING_IDS=()
for expected_id in "${EXPECTED_IDS_SORTED[@]}"; do
    found=false
    for ios_id in "${IOS_IDS_SORTED[@]}"; do
        if [[ "$expected_id" == "$ios_id" ]]; then
            found=true
            break
        fi
    done
    if [[ "$found" == false ]]; then
        MISSING_IDS+=("$expected_id")
    fi
done

# Report results
HAS_ISSUES=false

if [[ ${#MISSING_IDS[@]} -gt 0 ]]; then
    echo "❌ Missing iOS story IDs (in parity manifest but not found):"
    for id in "${MISSING_IDS[@]}"; do
        echo "   - $id"
    done
    echo ""
    HAS_ISSUES=true
fi

# Note: Extra IDs (iOS stories not in manifest) are NOT an error
# The manifest defines the minimum required set, not an exhaustive list
EXTRA_COUNT=$((${#IOS_IDS_SORTED[@]} - ${#EXPECTED_IDS[@]} + ${#MISSING_IDS[@]}))
if [[ $EXTRA_COUNT -gt 0 ]]; then
    echo "ℹ️  iOS has $EXTRA_COUNT additional stories beyond the parity manifest (this is expected)"
fi

if [[ "$HAS_ISSUES" == true ]]; then
    echo "Parity check FAILED"
    exit 1
else
    echo "✅ Parity check PASSED"
    echo "   All ${#EXPECTED_IDS[@]} expected story IDs found in iOS"
    echo "   iOS has ${#IOS_IDS[@]} total stories (including $EXTRA_COUNT not tracked in manifest)"
    exit 0
fi
