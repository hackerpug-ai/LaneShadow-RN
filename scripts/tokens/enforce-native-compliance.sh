#!/usr/bin/env bash
# enforce-native-compliance.sh — Pre-commit hook that rejects hardcoded color literals
# in native Swift/Kotlin source files outside allowed paths.
#
# Allowed paths (exempt from checks):
#   - tokens/platforms/  (theme package IS the token source)
#   - *MockProvider*     (fixture colors are legitimate)
#   - *Test*             (test assertions may use literal colors)
#   - *Stories*          (sandbox stories may reference colors for preview)
#   - *Snapshot*         (snapshot test infrastructure)
#   - *Fixture*          (test fixtures)
#
# Exit codes:
#   0 — no violations found
#   1 — violations found (blocks commit)

set -euo pipefail

VIOLATIONS=()

# Allowed path patterns (matched via grep -E against the file path)
ALLOWED_PATTERNS="tokens/platforms/|MockProvider|Test|Stories|Snapshot|Fixture|ResolvedValues"

# Swift patterns: hex color literals, Color() initializer, UIColor() initializer
# Excludes: Color.red (system colors), Color.clear, Color.white, Color.black
SWIFT_PATTERNS=(
  '0x[0-9A-Fa-f]{6,8}'
  'UIColor\s*\('
  'Color\s*\(\s*red\s*:'
  'Color\s*\(\s*0x'
)

# Kotlin patterns: hex color literals, Color() constructor with hex
KOTLIN_PATTERNS=(
  '0x[0-9A-Fa-f]{6,8}'
  'Color\s*\(\s*0x'
)

check_swift_file() {
  local file="$1"
  local line_num line_text pattern

  for pattern in "${SWIFT_PATTERNS[@]}"; do
    while IFS= read -r match; do
      line_num=$(echo "$match" | cut -d: -f1)
      line_text=$(echo "$match" | cut -d: -f2-)
      VIOLATIONS+=("$file:$line_num — hardcoded color: $(echo "$line_text" | xargs | head -c 80)")
    done < <(grep -nE "$pattern" "$file" 2>/dev/null || true)
  done
}

check_kotlin_file() {
  local file="$1"
  local line_num line_text pattern

  for pattern in "${KOTLIN_PATTERNS[@]}"; do
    while IFS= read -r match; do
      line_num=$(echo "$match" | cut -d: -f1)
      line_text=$(echo "$match" | cut -d: -f2-)
      VIOLATIONS+=("$file:$line_num — hardcoded color: $(echo "$line_text" | xargs | head -c 80)")
    done < <(grep -nE "$pattern" "$file" 2>/dev/null || true)
  done
}

# Get staged files matching Swift or Kotlin extensions
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- '*.swift' '*.kt' 2>/dev/null || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

for file in $STAGED_FILES; do
  # Skip allowed paths
  if echo "$file" | grep -qE "$ALLOWED_PATTERNS"; then
    continue
  fi

  # Skip deleted files
  [ -f "$file" ] || continue

  case "$file" in
    *.swift) check_swift_file "$file" ;;
    *.kt)    check_kotlin_file "$file" ;;
  esac
done

if [ ${#VIOLATIONS[@]} -gt 0 ]; then
  echo "❌ Hardcoded color literals detected in native source files:"
  echo ""
  for v in "${VIOLATIONS[@]}"; do
    echo "  $v"
  done
  echo ""
  echo "Use theme tokens from the LaneShadowTheme package instead."
  echo "Allowed paths: tokens/platforms/, *MockProvider*, *Test*, *Stories*, *Snapshot*, *Fixture*"
  exit 1
fi

exit 0
