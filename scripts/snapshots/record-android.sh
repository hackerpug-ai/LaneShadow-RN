#!/usr/bin/env bash
set -euo pipefail

# Record Android snapshot baselines using dropshots.
# This script runs the snapshot suite on a connected emulator or physical device
# and records PNG files in android/app/src/androidTest/screenshots/AllStoriesSnapshotTest/
# for every story in LaneShadowSandboxEntry.getAllStories() in both light and dark themes.
#
# Usage: pnpm snapshots:record:android
#
# Prerequisites:
# - Android emulator (Pixel 5, API 34) running and visible to adb
# - Or physical device connected via adb
#
# After recording, review the generated PNGs visually, then commit them alongside
# the code change that prompted the update.

cd "$(dirname "$0")/../.."
PROJECT_ROOT="$(pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"

echo "📸 Recording Android snapshot baselines via dropshots..."
echo "   Project: $ANDROID_DIR"
echo "   Target: Pixel 5 / API 34 emulator"
echo ""

# Verify a device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ Error: No Android device/emulator detected"
    echo "Please ensure the Pixel 5 / API 34 emulator is running:"
    echo "  emulator -avd Pixel_5_API_34 -no-snapshot -no-window &"
    exit 1
fi

echo "✅ Android device detected"
echo ""

# Run snapshot tests in record mode (RECORD_DROPSHOTS=true)
echo "Running snapshot tests..."
cd "$ANDROID_DIR"
RECORD_DROPSHOTS=true ./gradlew :app:connectedDebugAndroidTest \
    -Pandroid.testInstrumentationRunnerArguments.class=com.laneshadow.sandbox.snapshots.AllStoriesSnapshotTest

# Count generated snapshots
SCREENSHOT_DIR="$ANDROID_DIR/app/src/androidTest/screenshots"
if [ -d "$SCREENSHOT_DIR" ]; then
    SNAPSHOT_COUNT=$(find "$SCREENSHOT_DIR" -name "*.png" | wc -l | tr -d ' ')
    echo ""
    echo "✅ Recorded $SNAPSHOT_COUNT snapshots to:"
    echo "   $SCREENSHOT_DIR"
    echo ""
    echo "Next steps:"
    echo "  1. Review the generated PNGs visually"
    echo "  2. Commit the updated snapshots alongside your code changes"
    echo "  3. Run 'pnpm snapshots:check' to verify parity"
else
    echo ""
    echo "⚠️  Screenshot directory not yet created: $SCREENSHOT_DIR"
    echo "Snapshots will be generated on next test run if fixtures were updated."
fi
