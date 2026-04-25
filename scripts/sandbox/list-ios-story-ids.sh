#!/bin/bash

# iOS Story ID Introspection Script
#
# This script extracts all registered story IDs from the LaneShadow iOS sandbox
# by parsing the LaneShadowStories.swift source file.
#
# Usage: ./scripts/sandbox/list-ios-story-ids.sh
#
# Output: One story ID per line to stdout

set -euo pipefail

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
IOS_SANDBOX_FILE="$PROJECT_ROOT/ios/LaneShadow/Sandbox/LaneShadowStories.swift"

# Check if the sandbox file exists
if [[ ! -f "$IOS_SANDBOX_FILE" ]]; then
    echo "Error: iOS sandbox file not found at $IOS_SANDBOX_FILE" >&2
    exit 1
fi

# Extract all story IDs from the file
# Pattern: id: "{story_id}"
# We extract the content within quotes after "id: "
# Filter out template strings (those containing parentheses for interpolation)
grep -oE 'id: "[^"]*"' "$IOS_SANDBOX_FILE" | \
    sed 's/id: "//' | \
    sed 's/"$//' | \
    grep -v '(' | \
    sort -u

exit 0
