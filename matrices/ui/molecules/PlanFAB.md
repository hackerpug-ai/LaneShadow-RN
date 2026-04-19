# PlanFAB

## Component Classification
**Type:** Molecule
**Domain:** Map
**Source:** `components/map/plan-fab.tsx`

## Purpose
Floating action button for initiating route planning. Primary CTA for planning workflow.

## COMPOSITION

### Child Components
- `FAB` (atom) - Base floating action button

### Layout Structure
```
         ┌─────┐
         │  +  │
         └─────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/map/plan-fab.tsx`

**Key Implementation:**
- FAB positioned bottom-right
- Route planning icon
- Extended label on hover (desktop)
- OnPress callback to open planning

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/PlanFAB.kt`

**Implementation Notes:**
- Use `FloatingActionButton` from Material3
- `FloatingActionButtonDefaults.containerColor`
- `Icon` composable for planning icon
- `Modifier.align()` for positioning

**Expected API:**
```kotlin
@Composable
fun PlanFAB(
  visible: Boolean,
  onPress: () -> Unit,
  modifier: Modifier = Modifier
)
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/PlanFAB.swift`

**Implementation Notes:**
- Use native floating button or custom
- Circle background with primary color
- SF Symbol for icon
- `.frame()` for sizing

**Expected API:**
```swift
struct PlanFAB: View {
  var visible: Bool
  var onPress: () -> Void

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Size | 56dp | 56.dp | 56 | `size.fab.default` |
| Corner Radius | 16dp | 16.dp | 16 | `borderRadius.fab` |
| Background Color | Primary copper | colorPrimary | Color.primary | `color.primary` |
| Icon Color | On primary | onPrimary | Color.white | `color.onPrimary` |
| Icon Name | route-plus | add | plus | `icon.plan` |
| Icon Size | 24dp | 24.dp | 24 | `iconSize.md` |
| Elevation | 6 | 6.dp | 6 | `elevation.fab` |
| Shadow | Enabled | shadowElevation | .shadow(radius: 4) | `elevation.fab` |
| Position | Bottom-right | BottomEnd | trailing, bottom | - |
| Margin | 16dp | 16.dp | 16 | `spacing.lg` |

## NOTES

### Visibility Logic
- Show on map view
- Hide during active navigation
- Hide when planning sheet open
- Fade transition: 200ms

### Interaction
- Tap to open planning sheet
- No long-press behavior
- Ripple effect on tap (Android)

### Accessibility
- `accessibilityLabel`: "Plan a ride"
- `accessibilityHint`: "Opens route planning"
- `accessibilityRole`: "button"
- Min touch target: 48dp

### Platform Differences
- **Android:** Material3 `FloatingActionButton` with extended variant option
- **iOS:** Custom circle button with SF Symbol

### Dependencies
- `FAB` atom
- Planning state
- Color tokens (primary)
