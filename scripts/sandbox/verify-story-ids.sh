#!/bin/bash

# Story ID Validation Script
#
# This script verifies that all story IDs follow the dotted notation convention.
#
# Usage: ./scripts/sandbox/verify-story-ids.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
IOS_SANDBOX_DIR="$PROJECT_ROOT/ios/LaneShadow/Sandbox"

# Check if the sandbox directory exists
if [[ ! -d "$IOS_SANDBOX_DIR" ]]; then
    echo "Error: iOS sandbox directory not found at $IOS_SANDBOX_DIR" >&2
    exit 1
fi

# Extract all static story IDs (no string interpolation)
echo "Validating story ID format..."
echo ""

# Extract story IDs and validate against dotted regex
INVALID_COUNT=0
TOTAL_COUNT=0

while IFS= read -r line; do
    if [[ -n "$line" ]]; then
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
        # Check if ID matches dotted notation: tier.component.variant or tier.category.component.variant (3 or 4 segments)
        # Pattern: starts with lowercase, followed by dot-separated segments
        if [[ ! "$line" =~ ^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]+){2,3}$ ]]; then
            echo "✗ Invalid ID: $line"
            INVALID_COUNT=$((INVALID_COUNT + 1))
        fi
    fi
done < <(find "$IOS_SANDBOX_DIR" -name "*.swift" -type f -exec grep -v '^[[:space:]]*//' {} \; | \
    grep -oE 'id: "[^"]*"' | \
    sed 's/id: "//' | \
    sed 's/"$//' | \
    grep -v '(' | \
    grep -vE '^[0-9]+$' | \
    grep -vE '^\{' | \
    grep -vE '^atoms\.\{' | \
    grep -vE '^(chat|navigator|marin-headlands|mt-tam-summit|pch-evening-run|santa-cruz-loop|skyline-to-the-sea|route-[1-4])$' | \
    sort -u)

echo ""
echo "Validated $TOTAL_COUNT static story IDs"
if [[ $INVALID_COUNT -eq 0 ]]; then
    echo "✓ All story IDs follow dotted notation"
    exit 0
else
    echo "✗ $INVALID_COUNT story IDs do not follow dotted notation"
    exit 1
fi
