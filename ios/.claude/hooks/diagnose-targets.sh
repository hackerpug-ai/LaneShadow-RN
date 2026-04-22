#!/usr/bin/env bash
#
# diagnose-targets.sh — Diagnostic tool to find ALL Swift files with wrong target membership
#
# Usage: ios/.claude/hooks/diagnose-targets.sh
#

set -euo pipefail

IOS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROJECT_FILE="$IOS_ROOT/LaneShadow.xcodeproj/project.pbxproj"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${GREEN}=== iOS Target Membership Diagnostic ===${NC}"
echo ""
echo "Checking all Swift files in ios/LaneShadow/..."
echo ""

# Find all Swift files in LaneShadow/
SWIFT_COUNT=0
PROBLEM_COUNT=0

while IFS= read -r -d '' file; do
    ((SWIFT_COUNT++))
    
    # Skip Generated directory
    if [[ "$file" =~ /Generated/ ]]; then
        continue
    fi
    
    filename=$(basename "$file")
    
    # Check if file is in project
    if ! grep -q "$filename" "$PROJECT_FILE" 2>/dev/null; then
        echo -e "${YELLOW}⚠ ${filename} — not in project.pbxproj${NC}"
        ((PROBLEM_COUNT++))
        continue
    fi
    
    # Check target membership
    file_section=$(grep -B100 "$filename" "$PROJECT_FILE" | grep -A100 "in Sources")
    
    if echo "$file_section" | grep -q "LaneShadow.*in Sources"; then
        # Good - file is in LaneShadow target
        continue
    fi
    
    if echo "$file_section" | grep -q "ConvexMobile.*in Sources"; then
        echo -e "${RED}✗ ${filename} — in ConvexMobile target (should be LaneShadow)${NC}"
        ((PROBLEM_COUNT++))
    elif echo "$file_section" | grep -q "in Sources"; then
        echo -e "${YELLOW}⚠ ${filename} — in unknown target${NC}"
        ((PROBLEM_COUNT++))
    fi
    
done < <(find "$IOS_ROOT/LaneShadow" -name "*.swift" -print0 2>/dev/null)

echo ""
echo "Checked $SWIFT_COUNT Swift files"
echo -e "Found ${RED}$PROBLEM_COUNT${NC} files with incorrect target membership"
echo ""

if [[ $PROBLEM_COUNT -gt 0 ]]; then
    echo "To fix these files:"
    echo "  1. Open ios/LaneShadow.xcodeproj in Xcode"
    echo "  2. For each file above, select it in the Project Navigator"
    echo "  3. Press Cmd+Option+1 to open File Inspector"
    echo "  4. In 'Target Membership', check 'LaneShadow' and uncheck 'ConvexMobile'"
    echo "  5. Save the project (Cmd+S)"
    echo ""
fi

exit $PROBLEM_COUNT
