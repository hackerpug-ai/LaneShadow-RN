#!/usr/bin/env bash
set -euo pipefail

# Record iOS snapshot baselines using swift-snapshot-testing's record mode.
# This script regenerates PNG files in ios/LaneShadowTests/__Snapshots__/StorySnapshotTests/
# for every story in LaneShadowStories.all in both light and dark themes.
#
# Usage: pnpm snapshots:record:ios
#
# After recording, review the generated PNGs visually, then commit them alongside
# the code change that prompted the update.

cd "$(dirname "$0")/../.."
PROJECT_ROOT="$(pwd)"
XCODEPROJ="$PROJECT_ROOT/ios/LaneShadow.xcodeproj"
SCHEME="LaneShadow"
DESTINATION='platform=iOS Simulator,name=iPhone 16'

echo "📸 Recording iOS snapshot baselines..."
echo "   Project: $XCODEPROJ"
echo "   Scheme: $SCHEME"
echo "   Destination: $DESTINATION"
echo ""

# Set record mode environment variable for swift-snapshot-testing
export SNAPSHOT_TESTING_RECORD=true

# Run snapshot tests in record mode
xcodebuild test \
  -project "$XCODEPROJ" \
  -scheme "$SCHEME" \
  -destination "$DESTINATION" \
  -only-testing:LaneShadowTests/StorySnapshotTests/test_allStories_lightAndDark_snapshots \
  -resultBundlePath /tmp/LaneShadow-SnapshotRecord.xcresult

# Count generated snapshots
SNAPSHOT_DIR="$PROJECT_ROOT/ios/LaneShadowTests/__Snapshots__/StorySnapshotTests"
if [ -d "$SNAPSHOT_DIR" ]; then
  SNAPSHOT_COUNT=$(find "$SNAPSHOT_DIR" -name "*.png" | wc -l | tr -d ' ')
  echo ""
  echo "✅ Recorded $SNAPSHOT_COUNT snapshots to $SNAPSHOT_DIR"
  echo ""
  echo "Next steps:"
  echo "  1. Review the generated PNGs visually"
  echo "  2. Commit the updated snapshots alongside your code changes"
  echo "  3. Run 'pnpm snapshots:check' to verify parity"
else
  echo ""
  echo "❌ Failed to record snapshots: $SNAPSHOT_DIR not found"
  exit 1
fi
