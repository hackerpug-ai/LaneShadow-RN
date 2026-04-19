# UI Screenshot Diff Harness

Per-component screenshot-diff infrastructure that captures RN/Android/iOS screenshots and detects pixel-level variance at commit time.

**Purpose**: Catch visual drift early instead of at Phase G (integration testing). This tool validates that native implementations (Android Compose, iOS SwiftUI) match the React Native reference implementation pixel-for-pixel, per the [08d-component-parity-spec](../../.spec/prds/native-rewrite/08d-component-parity-spec.md).

---

## Overview

The UI diff harness consists of:

- **capture-rn.ts** — Captures React Native Storybook component screenshots
- **capture-android.ts** — Captures Android Compose component screenshots via adb
- **capture-ios.ts** — Captures iOS SwiftUI component screenshots via xcrun
- **compare.ts** — Performs pixel-level diffing with configurable ±1px tolerance
- **variance-schema.ts** — JSON schema for variance reports (CI/CD consumable)

---

## Quick Start

### 1. Capture Baseline Screenshots

First, capture baseline screenshots for all platforms:

```bash
# Capture all React Native components
pnpm tsx scripts/ui-diff/capture-rn.ts

# Capture all Android components (emulator must be running)
pnpm tsx scripts/ui-diff/capture-android.ts

# Capture all iOS components (simulator must be running)
pnpm tsx scripts/ui-diff/capture-ios.ts
```

### 2. Run Full Harness

After making UI changes, capture current screenshots and compare against baseline:

```bash
# Capture current screenshots (if needed)
# Then run comparison
pnpm ui:diff
```

The harness will:
1. Capture screenshots from all three platforms (optional)
2. Compare each platform's screenshots against baseline
3. Generate diff images highlighting variance
4. Exit with code 1 if any component exceeds the tolerance threshold

### 3. Review Diff Output

- **Diff images**: `screenshots/diff/{platform}/{component-name}.png`
- **Variance report**: `screenshots/diff/variance.json`

---

## Usage

### Individual Scripts

#### capture-rn.ts

Captures React Native Storybook screenshots.

**Prerequisites**:
- React Native dev client running (`pnpm client:dev`)
- Storybook accessible

```bash
pnpm tsx scripts/ui-diff/capture-rn.ts [OPTIONS]
```

**Options**:
- `--components <name1,name2>` — Capture specific components only
- `--output-dir <path>` — Custom output directory (default: `screenshots/rn/baseline`)

**Examples**:
```bash
# Capture all components
pnpm tsx scripts/ui-diff/capture-rn.ts

# Capture specific components
pnpm tsx scripts/ui-diff/capture-rn.ts --components ThemeButton,ThemeBadge

# Capture to custom directory
pnpm tsx scripts/ui-diff/capture-rn.ts --output-dir screenshots/rn/custom
```

#### capture-android.ts

Captures Android Compose screenshots via adb.

**Prerequisites**:
- Android emulator running OR physical device connected
- App installed and in screenshot-capture mode
- `adb` available in PATH

```bash
pnpm tsx scripts/ui-diff/capture-android.ts [OPTIONS]
```

**Options**:
- `--components <name1,name2>` — Capture specific components only
- `--output-dir <path>` — Custom output directory (default: `screenshots/android/baseline`)
- `--device <serial>` — Specific ADB device serial (default: first available)

**Examples**:
```bash
# Capture all components
pnpm tsx scripts/ui-diff/capture-android.ts

# Capture from specific device
pnpm tsx scripts/ui-diff/capture-android.ts --device emulator-5554

# Capture specific components
pnpm tsx scripts/ui-diff/capture-android.ts --components ThemeButton,ThemeInput
```

#### capture-ios.ts

Captures iOS SwiftUI screenshots via xcrun.

**Prerequisites**:
- iOS simulator running
- App installed and in screenshot-capture mode
- Xcode tools installed (`xcrun` available)

```bash
pnpm tsx scripts/ui-diff/capture-ios.ts [OPTIONS]
```

**Options**:
- `--components <name1,name2>` — Capture specific components only
- `--output-dir <path>` — Custom output directory (default: `screenshots/ios/baseline`)
- `--device <id>` — Specific simulator device ID (default: first booted)

**Examples**:
```bash
# Capture all components
pnpm tsx scripts/ui-diff/capture-ios.ts

# Capture from specific simulator
pnpm tsx scripts/ui-diff/capture-ios.ts --device "iPhone 16"

# Capture specific components
pnpm tsx scripts/ui-diff/capture-ios.ts --components ThemeButton,ThemeInput
```

#### compare.ts

Performs pixel-level diffing between baseline and current screenshots.

```bash
pnpm tsx scripts/ui-diff/compare.ts [OPTIONS]
```

**Options**:
- `--tolerance <number>` — Pixel tolerance threshold (default: 1)
- `--platform <rn|android|ios>` — Compare specific platform only

**Examples**:
```bash
# Compare all platforms with default tolerance
pnpm tsx scripts/ui-diff/compare.ts

# Compare with custom tolerance (±2px)
pnpm tsx scripts/ui-diff/compare.ts --tolerance 2

# Compare only Android screenshots
pnpm tsx scripts/ui-diff/compare.ts --platform android
```

**Exit Codes**:
- `0` — All components within tolerance threshold
- `1` — One or more components exceeded threshold

---

## NPM Scripts

The following NPM scripts are available in `package.json`:

```bash
# Run full harness (capture + compare)
pnpm ui:diff
```

---

## Lefthook Integration

The UI diff harness integrates with lefthook for opt-in pre-push validation.

### Enable UI Diff Hook

```bash
git config lane-shadow.ui-diff.enabled true
```

Once enabled, `pnpm ui:diff` will run before every push, blocking the push if visual regressions are detected.

### Disable UI Diff Hook

```bash
git config lane-shadow.ui-diff.enabled false
```

### Check Hook Status

```bash
git config lane-shadow.ui-diff.enabled
# Output: "true" if enabled, empty if disabled
```

### Bypass Hook Temporarily

To skip the UI diff check for a single push:

```bash
git push --no-verify
```

---

## Directory Structure

```
screenshots/
├── rn/
│   ├── baseline/          # Reference RN screenshots
│   └── current/           # Current RN screenshots (for comparison)
├── android/
│   ├── baseline/          # Reference Android screenshots
│   └── current/           # Current Android screenshots
├── ios/
│   ├── baseline/          # Reference iOS screenshots
│   └── current/           # Current iOS screenshots
└── diff/
    ├── rn/                # Diff images for RN components
    ├── android/           # Diff images for Android components
    ├── ios/               # Diff images for iOS components
    └── variance.json      # Machine-readable variance report
```

---

## Variance Report Schema

The `variance.json` report conforms to the schema defined in `variance-schema.ts`:

```json
{
  "schemaVersion": "1.0.0",
  "timestamp": "2026-04-18T12:00:00.000Z",
  "commitSha": "abc123...",
  "branch": "feature/new-component",
  "tolerance": 1,
  "status": "pass",
  "platforms": [
    {
      "platform": "rn",
      "totalComponents": 60,
      "passed": 58,
      "failed": 1,
      "warned": 1,
      "components": [
        {
          "component": "ThemeButton",
          "platform": "rn",
          "baselinePath": "screenshots/rn/baseline/ThemeButton.png",
          "currentPath": "screenshots/rn/current/ThemeButton.png",
          "diffPath": "screenshots/diff/rn/ThemeButton.png",
          "variance": {
            "totalPixels": 6400,
            "differentPixels": 0,
            "percentageDiff": 0.0,
            "maxChannelDiff": 0
          },
          "status": "pass",
          "message": "Perfect match"
        }
      ]
    }
  ],
  "summary": {
    "totalComponents": 180,
    "totalPassed": 174,
    "totalFailed": 3,
    "totalWarned": 3
  }
}
```

### Status Values

- **pass** — Component within tolerance threshold (±1px)
- **warn** — Minor variance detected (anti-aliasing, sub-pixel rendering)
- **fail** — Significant visual regression detected

### CI/CD Integration

Parse `variance.json` in your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Check visual regressions
  run: |
    STATUS=$(jq -r '.status' screenshots/diff/variance.json)
    if [ "$STATUS" = "fail" ]; then
      echo "Visual regressions detected"
      exit 1
    fi
```

---

## Tolerance Threshold

Per the [08d-component-parity-spec](../../.spec/prds/native-rewrite/08d-component-parity-spec.md), the default tolerance is **±1px per RGB channel**.

This tolerance accounts for:
- Anti-aliasing differences across platforms
- Sub-pixel rendering variations
- Font rendering engine differences
- GPU rounding differences

**Adjust tolerance** (not recommended):
```bash
pnpm tsx scripts/ui-diff/compare.ts --tolerance 2
```

---

## Troubleshooting

### RN: Dev server not detected

**Error**: `React Native dev server not detected`

**Solution**:
```bash
pnpm client:dev
```

Wait for the dev server to start, then re-run the capture script.

### Android: No devices found

**Error**: `No Android devices/emulators found`

**Solution**:
```bash
# Start an emulator
emulator -avd <avd_name>

# Or list available devices
adb devices

# Or check connected devices
adb devices -l
```

### iOS: No simulators running

**Error**: `No iOS simulators currently running`

**Solution**:
```bash
# Start Simulator app
open -a Simulator

# Or boot a specific device
xcrun simctl boot "iPhone 16"

# Or list available devices
xcrun simctl list devices available
```

### Type check failures

**Error**: TypeScript errors in capture scripts

**Solution**:
```bash
pnpm type-check:native
```

Fix any type errors before committing.

---

## Implementation Notes

### Current Limitations (Placeholder Implementation)

The current implementation uses **placeholder screenshots** (1x1 PNG files) for demonstration purposes. In a production environment, each capture script should:

**capture-rn.ts**:
- Use Expo's screenshot API or Storybook's screenshot addon
- Navigate to each component's Storybook story
- Capture full-component screenshots
- Handle loading states and animations

**capture-android.ts**:
- Use `adb shell am start` to launch specific component screens
- Use `adb shell screencap` to capture screenshots
- Pull screenshots from device with `adb pull`
- Crop screenshots to component bounds

**capture-ios.ts**:
- Use `xcrun simctl launch` to launch specific component screens
- Use `xcrun simctl io` to capture screenshots
- Crop screenshots to component bounds

### Future Enhancements

- **Component discovery**: Parse Storybook/Kotlin/Swift source to auto-discover components
- **Screenshot automation**: Integrate with Detox or XCUITest for automated capture
- **CI/CD integration**: Run in GitHub Actions with emulator/simulator runners
- **Diff artifact upload**: Upload diff images as build artifacts
- **Baseline updates**: Semi-automated baseline update workflow

---

## References

- [08d-component-parity-spec](../../.spec/prds/native-rewrite/08d-component-parity-spec.md) — Cross-platform parity guarantees
- [08a-atomic-component-catalog](../../.spec/prds/native-rewrite/08a-atomic-component-catalog.md) — RN component inventory
- [08b-android-component-map](../../.spec/prds/native-rewrite/08b-android-component-map.md) — Android Compose architecture
- [08c-ios-component-map](../../.spec/prds/native-rewrite/08c-ios-component-map.md) — iOS SwiftUI architecture
- [FND-009 Task Spec](../../.spec/prds/native-rewrite/tasks/sprint-01a-foundation-rewrite/FND-009-author-ui-diff-harness.md) — Original task requirements
