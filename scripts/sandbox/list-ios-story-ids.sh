#!/bin/bash

# iOS Story ID Introspection Script
#
# This script extracts all registered story IDs from the LaneShadow iOS sandbox
# by parsing all story source files.
#
# Usage: ./scripts/sandbox/list-ios-story-ids.sh
#
# Output: One story ID per line to stdout

set -euo pipefail

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
IOS_SANDBOX_DIR="$PROJECT_ROOT/ios/LaneShadow/Sandbox"

# Check if the sandbox directory exists
if [[ ! -d "$IOS_SANDBOX_DIR" ]]; then
    echo "Error: iOS sandbox directory not found at $IOS_SANDBOX_DIR" >&2
    exit 1
fi

# Extract all story IDs from all Swift files in the Sandbox directory
# Pattern: id: "{story_id}"
# We extract the content within quotes after "id: "
# Filter out template strings (those containing parentheses for interpolation)
# Only match lines that are actual code (not comments) - exclude lines starting with //
find "$IOS_SANDBOX_DIR" -name "*.swift" -type f -exec grep -v '^[[:space:]]*//' {} \; | \
    grep -oE 'id: "[^"]*"' | \
    sed 's/id: "//' | \
    sed 's/"$//' | \
    grep -v '(' | \
    grep -vE '^[0-9]+$' | \
    grep -vE '^\{' | \
    grep -vE '^atoms\.\{' | \
    grep -vE '^(chat|navigator|marin-headlands|mt-tam-summit|pch-evening-run|santa-cruz-loop|skyline-to-the-sea|route-[1-4])$' | \
    sort -u

exit 0
