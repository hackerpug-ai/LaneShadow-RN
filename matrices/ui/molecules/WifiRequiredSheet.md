# WifiRequiredSheet

## Component Classification
**Type:** Molecule
**Domain:** Onboarding
**Source:** `components/onboarding/wifi-required-sheet.tsx`

## Purpose
Bottom sheet shown when WiFi is required but unavailable. Blocks download until WiFi.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - WiFi warning icon
- `Button` (atom) - Connect and dismiss actions

### Layout Structure
```
┌─────────────────────────────────┐
│  ════════ (drag handle)         │
│                                 │
│       [WiFi Icon]               │
│                                 │
│  WiFi Required                  │
│  Connect to WiFi to download    │
│  offline regions.               │
│                                 │
│  ┌─────────────────────────┐   │
│  │      Got it              │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/onboarding/wifi-required-sheet.tsx`

**Key Implementation:**
- Bottom sheet presentation
- WiFi icon with warning color
- Explanatory message
- Single dismiss button
- No auto-dismiss (require tap)

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/WifiRequiredSheet.kt`

**Implementation Notes:**
- Use `BottomSheetScaffold` or `ModalBottomSheet`
- `Column` layout with `Spacer`
- `Icon` composable for WiFi indicator
- `Button` for dismiss
- Large icon for emphasis

**Expected API:**
```kotlin
@Composable
fun WifiRequiredSheet(
  visible: Boolean,
  onClose: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/WifiRequiredSheet.swift`

**Implementation Notes:**
- Use `.sheet()` or `.presentationDetents()`
- `VStack` layout with `Spacer`
- SF Symbol for WiFi icon
- `Button` for dismiss
- Large icon for emphasis

**Expected API:**
```swift
struct WifiRequiredSheet: View {
  var visible: Bool
  var onClose: () -> Void

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Sheet Corner Radius | 16dp | 16.dp | 16 | `borderRadius.sheet` |
| Background Color | Surface | surface | Color(.systemBackground) | `color.surface` |
| Padding | 24dp | 24.dp | 24 | `spacing.xl` |
| Icon Name | wifi-off | wifi_off | wifi.slash | `icon.wifiOff` |
| Icon Size | 48dp | 48.dp | 48 | `iconSize.xl` |
| Icon Color | Warning amber | colorWarning | Color.orange | `color.warning` |
| Title Font | Title large | Typography.titleLarge | Font.title2 | `typography.title` |
| Title Color | Text primary | onSurface | Color.primary | `color.textPrimary` |
| Message Font | Body | Typography.bodyMedium | Font.body | `typography.body` |
| Message Color | Text secondary | onSurfaceVariant | Color.secondary | `color.textSecondary` |
| Button | Primary | Button(primary) | Button(.borderedProminent) | `button.primary` |
| Button Height | 48dp | 48.dp | 48 | `size.button.default` |

## NOTES

### Message Content
- Title: "WiFi Required"
- Body: "Connect to WiFi to download offline regions."
- Optional: "Downloads over 100MB require WiFi."

### Interaction
- Swipe down to dismiss
- Tap button to dismiss
- No auto-dismiss (require acknowledgment)
- Open WiFi settings (optional)

### Trigger Conditions
- Download size > threshold (e.g., 100MB)
- Device on cellular only
- User has WiFi-only setting enabled

### Accessibility
- `accessibilityLabel`: "WiFi required"
- `accessibilityHint`: "Connect to WiFi to continue"
- `accessibilityRole`: "alert"
- Focus trap when open

### Platform Differences
- **Android:** Material3 `ModalBottomSheet`
- **iOS:** Native `.sheet()` with drag indicator

### Dependencies
- `IconSymbol` atom
- `Button` atom
- Bottom sheet system
- Network state detection
- Localization literals
