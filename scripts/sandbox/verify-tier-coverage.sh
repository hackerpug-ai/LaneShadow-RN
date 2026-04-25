#!/bin/bash

# Tier Coverage Verification Script
#
# This script verifies that all six ComponentTier values are represented
# in the LaneShadowStories.all aggregation.
#
# Usage: ./scripts/sandbox/verify-tier-coverage.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
IOS_SANDBOX_FILE="$PROJECT_ROOT/ios/LaneShadow/Sandbox/LaneShadowStories.swift"

# Check if the sandbox file exists
if [[ ! -f "$IOS_SANDBOX_FILE" ]]; then
    echo "Error: iOS sandbox file not found at $IOS_SANDBOX_FILE" >&2
    exit 1
fi

# Extract all tier references from the file
echo "Checking tier coverage in LaneShadowStories.all..."
echo ""

# Check for all six tier aggregators
TIERS=(
    "AtomsStories"
    "MoleculesStories"
    "OrganismStories"
    "TemplateStories"
    "ModifierStories"
    "InfrastructureStories"
)

ALL_FOUND=true
for tier in "${TIERS[@]}"; do
    if grep -q "$tier" "$IOS_SANDBOX_FILE"; then
        echo "✓ $tier found"
    else
        echo "✗ $tier NOT found"
        ALL_FOUND=false
    fi
done

echo ""
if [[ "$ALL_FOUND" == "true" ]]; then
    echo "✓ All six tiers are aggregated in LaneShadowStories.all"
    exit 0
else
    echo "✗ Some tiers are missing from LaneShadowStories.all"
    exit 1
fi
