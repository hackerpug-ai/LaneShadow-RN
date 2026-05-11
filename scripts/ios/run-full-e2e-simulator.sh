#!/usr/bin/env bash
# Run the full LaneShadowUITests target on an iOS simulator with honest exit codes.
#
# Why this exists: audit 2026-05-10 — an ad-hoc `xcodebuild test ... | tee log`
# returned shell exit 0 despite ** TEST FAILED ** because tee swallowed the
# non-zero status. This wrapper bakes in `set -euo pipefail` and uses
# PIPESTATUS to surface the real xcodebuild exit code.
#
# Behavior:
#   - Auto-detects an iPhone 16 simulator (or honors $SIMULATOR_ID).
#   - Sources .env.local and patches the .xctestrun so the XCTest runner
#     process sees CLERK/MAILOSAUR env vars (same pattern as Makefile
#     ios_e2e_simulator). Without this patch, AuthSignInE2ETests /
#     AuthRegistrationE2ETests fail before launch.
#   - Runs the FULL LaneShadowUITests target (no -only-testing filter).
#   - Logs to ios/build/logs/full-e2e-simulator-<ts>.log, result bundle to
#     ios/build/xcresults/full-e2e-simulator-<ts>.xcresult.
#   - Exits with the real xcodebuild status.

set -euo pipefail

cd "$(dirname "$0")/../.."

if ! command -v xcodebuild >/dev/null; then
    echo "ERROR: xcodebuild not found" >&2
    exit 1
fi

if ! command -v xcrun >/dev/null; then
    echo "ERROR: xcrun not found" >&2
    exit 1
fi

TS="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="ios/build/logs/full-e2e-simulator-${TS}.log"
RESULT_BUNDLE="ios/build/xcresults/full-e2e-simulator-${TS}.xcresult"
DERIVED_DATA="ios/build/DerivedDataE2EFull"

mkdir -p ios/build/logs ios/build/xcresults

if [ -z "${SIMULATOR_ID:-}" ]; then
    SIMULATOR_ID=$(xcrun simctl list devices available \
        | sed -nE 's/.*iPhone 16 \(([A-F0-9-]+)\).*/\1/p' \
        | head -1)
fi

if [ -z "${SIMULATOR_ID:-}" ]; then
    echo "ERROR: could not find an iPhone 16 simulator. Set SIMULATOR_ID=<udid>" >&2
    exit 1
fi

echo "==> Booting simulator $SIMULATOR_ID..."
open -a Simulator
xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || true
xcrun simctl bootstatus "$SIMULATOR_ID" -b

# Load .env.local so we can patch the xctestrun with the same keys the
# Makefile target patches.
set -a
if [ -f .env.local ]; then
    # shellcheck disable=SC1091
    . ./.env.local
fi
set +a

: "${CLERK_TEST_EMAIL:=${LANESHADOW_AUTH_EMAIL:-}}"
: "${CLERK_TEST_PASSWORD:=${LANESHADOW_AUTH_PASSWORD:-}}"
: "${CLERK_PUBLISHABLE_KEY:=${EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:-}}"

for v in CLERK_TEST_EMAIL CLERK_TEST_PASSWORD CLERK_PUBLISHABLE_KEY \
         MAILOSAUR_API_KEY MAILOSAUR_SERVER_ID MAILOSAUR_DOMAIN; do
    if [ -z "${!v:-}" ]; then
        echo "ERROR: missing $v in .env.local" >&2
        exit 1
    fi
done

E2E_SIGNUP_EMAIL="${IOS_E2E_SIGNUP_EMAIL:-ios-e2e-full-${TS}-$$@${MAILOSAUR_DOMAIN}}"

echo "==> Building for testing..."
cd ios
xcodebuild build-for-testing \
    -project LaneShadow.xcodeproj \
    -scheme LaneShadow \
    -destination "id=$SIMULATOR_ID" \
    -derivedDataPath "${DERIVED_DATA#ios/}" \
    > "../$LOG" 2>&1

XCTESTRUN_PATH=$(find "${DERIVED_DATA#ios/}/Build/Products" -maxdepth 1 \
    -name 'LaneShadow_iphonesimulator*.xctestrun' \
    ! -name '*.e2e.xctestrun' | head -1)

if [ -z "$XCTESTRUN_PATH" ]; then
    echo "ERROR: missing .xctestrun file" >&2
    cd ..
    exit 1
fi

PATCHED="${XCTESTRUN_PATH%.xctestrun}.full-e2e.xctestrun"
cp "$XCTESTRUN_PATH" "$PATCHED"

trap 'rm -f "$PATCHED"; xcrun simctl terminate "$SIMULATOR_ID" "com.laneshadow.app" >/dev/null 2>&1 || true' EXIT

for k in CLERK_TEST_EMAIL CLERK_TEST_PASSWORD CLERK_PUBLISHABLE_KEY \
         EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY MAILOSAUR_API_KEY \
         MAILOSAUR_SERVER_ID MAILOSAUR_DOMAIN E2E_SIGNUP_EMAIL; do
    case "$k" in
        EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY) val="$CLERK_PUBLISHABLE_KEY" ;;
        *) val="${!k}" ;;
    esac
    plutil -replace "LaneShadowUITests.EnvironmentVariables.$k" \
        -string "$val" "$PATCHED"
    plutil -replace "LaneShadowUITests.TestingEnvironmentVariables.$k" \
        -string "$val" "$PATCHED"
    case "$k" in
        CLERK_PUBLISHABLE_KEY|EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)
            plutil -replace "LaneShadowUITests.UITargetAppEnvironmentVariables.$k" \
                -string "$val" "$PATCHED"
            ;;
    esac
done

echo "==> Running full LaneShadowUITests target (no -only-testing filter)..."
# PIPESTATUS captures xcodebuild's exit code despite the tee. set -o pipefail
# (already enabled at top) makes the whole pipeline non-zero if xcodebuild fails.
set +e
xcodebuild test-without-building \
    -xctestrun "$PATCHED" \
    -destination "id=$SIMULATOR_ID" \
    -resultBundlePath "../$RESULT_BUNDLE" \
    2>&1 | tee -a "../$LOG"
TEST_STATUS=${PIPESTATUS[0]}
set -e

cd ..

echo "==> xcodebuild exit status: $TEST_STATUS"
echo "==> Log:    $LOG"
echo "==> Result: $RESULT_BUNDLE"

# Optional summary (best-effort; xcresulttool format varies by Xcode version).
if command -v xcrun >/dev/null && [ -d "$RESULT_BUNDLE" ]; then
    SUMMARY="${LOG%.log}.summary.json"
    xcrun xcresulttool get test-results summary \
        --path "$RESULT_BUNDLE" --format json > "$SUMMARY" 2>/dev/null \
        || xcrun xcresulttool get --path "$RESULT_BUNDLE" --format json \
            > "$SUMMARY" 2>/dev/null || true
    [ -f "$SUMMARY" ] && echo "==> Summary: $SUMMARY"
fi

exit "$TEST_STATUS"
