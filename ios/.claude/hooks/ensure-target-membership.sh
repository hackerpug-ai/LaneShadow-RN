#!/usr/bin/env bash
#
# ensure-target-membership.sh — Detect Swift files not in correct Xcode target
#
# This script checks that Swift files in ios/LaneShadow/ are registered in the
# LaneShadow target. It BLOCKS commits when Swift files are in wrong targets.
#
# Exit codes:
#   0 = All Swift files in correct target
#   1 = Swift files in wrong target (commit blocked)
#   2 = Xcode project not found
#

set -euo pipefail

IOS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROJECT_FILE="$IOS_ROOT/LaneShadow.xcodeproj/project.pbxproj"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

log_error() {
    echo -e "${RED}[ensure-target-membership]${NC} $*" >&2
}

log_info() {
    echo -e "${GREEN}[ensure-target-membership]${NC} $*"
}

if [[ ! -f "$PROJECT_FILE" ]]; then
    log_error "Xcode project not found at $PROJECT_FILE"
    exit 2
fi

# Check for Swift files that were added/modified in this commit
# Only check files in the staging area
SWIFT_FILES=$(git diff --cached --name-only --diff-filter=AC 2>/dev/null | grep '\.swift$' || true)

if [[ -z "$SWIFT_FILES" ]]; then
    # No new Swift files in this commit - check if we should still run
    # Run on explicit request or if Swift files exist in LaneShadow/
    if [[ "${FORCE_CHECK:-}" != "1" ]]; then
        exit 0
    fi
fi

log_info "Checking Swift files for correct target membership..."

# Track problematic files
PROBLEMATIC_FILES=()

# Check each Swift file
for file in $SWIFT_FILES; do
    if [[ ! -f "$file" ]]; then
        continue
    fi
    
    filename=$(basename "$file")
    
    # Skip test files
    if [[ "$file" =~ Tests/ ]]; then
        continue
    fi
    
    # Check if file is in project.pbxproj
    if ! grep -q "$filename" "$PROJECT_FILE" 2>/dev/null; then
        log_error "$filename is not registered in project.pbxproj"
        PROBLEMATIC_FILES+=("$filename: not in project")
        continue
    fi
    
    # Check if file is in LaneShadow target (not ConvexMobile or other)
    # Look for the file in a Sources build phase
    file_section=$(grep -B100 "$filename" "$PROJECT_FILE" | grep -A100 "in Sources")
    
    if echo "$file_section" | grep -q "LaneShadow.*in Sources"; then
        # File is in LaneShadow target - good!
        continue
    fi
    
    if echo "$file_section" | grep -q "ConvexMobile.*in Sources"; then
        log_error "$filename is in ConvexMobile target, should be in LaneShadow target"
        PROBLEMATIC_FILES+=("$filename: wrong target (ConvexMobile)")
    elif echo "$file_section" | grep -q "in Sources"; then
        log_error "$filename is in unknown target"
        PROBLEMATIC_FILES+=("$filename: wrong target")
    else
        log_error "$filename is in project but not in any target's Sources"
        PROBLEMATIC_FILES+=("$filename: not in any target")
    fi
done

if [[ ${#PROBLEMATIC_FILES[@]} -eq 0 ]]; then
    log_info "All Swift files are in correct target"
    exit 0
fi

# Block the commit
log_error ""
log_error "BLOCKING COMMIT: ${#PROBLEMATIC_FILES[@]} Swift files have incorrect target membership"
log_error ""
log_error "Problematic files:"
for file in "${PROBLEMATIC_FILES[@]}"; do
    log_error "  - $file"
done
log_error ""
log_error "To fix this:"
log_error "  1. Open ios/LaneShadow.xcodeproj in Xcode"
log_error "  2. Select each file in the Project Navigator"
log_error "  3. In the File Inspector (Cmd+Option+1), check 'Target Membership'"
log_error "  4. Ensure 'LaneShadow' is checked and 'ConvexMobile' is unchecked"
log_error "  5. Commit again"
log_error ""

exit 1
