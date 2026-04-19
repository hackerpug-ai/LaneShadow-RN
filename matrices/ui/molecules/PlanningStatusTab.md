# PlanningStatusTab Component Matrix

**Component Path:** `react-native/components/planning/planning-status-tab.tsx`
**Atomic Level:** Molecule
**Domain:** Planning
**Last Updated:** 2025-01-18

---

## COMPOSITION

**React Native Source:**
```tsx
import { Pressable, StyleSheet, View } from 'react-native'
import { ActivityIndicator, Text } from 'react-native-paper'
import Animated, { FadeOutDown, SlideInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { IconSymbol } from '../ui/icon-symbol'
```

**Child Dependencies:**
- `IconSymbol` (atom) - icons (motorbike, check-circle, alert-circle, close)
- `ActivityIndicator` (react-native-paper) - loading spinner
- `Animated.View` (react-native-reanimated) - animated container

**Layout Structure:**
```
PlanningStatusTab (floating HUD card)
└── Pressable (touchable surface)
    ├── Left Accent Bar (animated, status-colored)
    ├── Icon Area (motorbike icon)
    ├── Center Column (route label + status text)
    └── Right Area (spinner/icon + dismiss button)
```

---

## TRANSLATION SOURCES

### Kotlin/Compose

**Dependencies:**
- `androidx.compose.animation.AnimatedVisibility`
- `androidx.compose.animation.slideInVertically`
- `androidx.compose.animation.fadeOut`
- `androidx.compose.foundation.layout.Row`
- `androidx.compose.material3.Surface`
- `androidx.compose.material3.CircularProgressIndicator`
- `IconSymbol` atom (from `ui/atoms/IconSymbol.kt`)

**Platform Equivalents:**
- `Animated.View` → `AnimatedVisibility`
- `ActivityIndicator` → `CircularProgressIndicator`
- `Pressable` → `Box` + `clickable`
- `StyleSheet` → `Modifier` chain

### Swift/SwiftUI

**Dependencies:**
- `SwiftUI.withAnimation`
- `SwiftUI.transition`
- `SwiftUI.HStack`
- `ProgressView` (iOS 14+)
- `IconSymbol` atom (from `UI/Atoms/IconSymbol.swift`)

**Platform Equivalents:**
- `Animated.View` → `withAnimation` + `.transition(.move(edge: .top))`
- `ActivityIndicator` → `ProgressView` (`.circular`)
- `Pressable` → `Button` or `.onTapGesture`
- `StyleSheet` → View modifier chain

---

## STYLE PROPERTIES MATRIX

| Element | Property | Token Path (Light) | Token Path (Dark) | Platform Mapping |
|---------|----------|-------------------|------------------|------------------|
| **Wrapper Background** | Color | `semantic.color.surface.default` | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` |
| **Wrapper Radius** | Corner radius | `semantic.radius.md` (8pt) | `semantic.radius.md` (8pt) | `8.dp` / `cornerRadius: 8` |
| **Wrapper Elevation** | Shadow | `semantic.elevation[3]` | `semantic.elevation.dark[3]` | `shadowElevation = 3.dp` / `.shadow(radius: 8)` |
| **Wrapper Min Height** | Dimension | `64` (64pt) | `64` (64pt) | `64.dp` / `frame(minHeight: 64)` |
| **Accent Bar Width** | Dimension | `4` (4pt) | `4` (4pt) | `4.dp` / `frame(width: 4)` |
| **Accent Bar Color** | Pending/Running | `semantic.color.primary.default` | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` |
| **Accent Bar Color** | Completed | `semantic.color.success.default` | `semantic.color.success.default` | `MaterialTheme.colorScheme.primary` (green) |
| **Accent Bar Color** | Failed | `semantic.color.danger.default` | `semantic.color.danger.default` | `MaterialTheme.colorScheme.error` |
| **Accent Bar Color** | Cancelled | `semantic.color.onSurface.muted` | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` |
| **Motorbike Icon Size** | Dimension | `20` (20pt) | `20` (20pt) | `20.dp` / `frame(width: 20, height: 20)` |
| **Motorbike Icon Color** | Color | `accentColor` (dynamic) | `accentColor` (dynamic) | Dynamic based on status |
| **Icon Area Width** | Dimension | `28` (28pt) | `28` (28pt) | `28.dp` / `frame(width: 28)` |
| **Icon Area Left Margin** | Spacing | `semantic.space.sm` (8pt) | `semantic.space.sm` (8pt) | `8.dp` / `padding(.leading, 8)` |
| **Route Label Font** | Typography | `semantic.type.label.sm` (500 weight, 12pt) | `semantic.type.label.sm` (500 weight, 12pt) | `Typography.labelSmall` / `Font.caption` |
| **Route Label Color** | Color | `semantic.color.onSurface.default` | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` |
| **Route Label Weight** | Font weight | `700` (bold) | `700` (bold) | `FontWeight.Bold` / `.bold()` |
| **Status Text Font** | Typography | `semantic.type.label.sm` (500 weight, 12pt) | `semantic.type.label.sm` (500 weight, 12pt) | `Typography.labelSmall` / `Font.caption` |
| **Status Text Color** | Pending/Running | `semantic.color.onSurface.muted` | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` |
| **Status Text Color** | Completed | `semantic.color.success.default` | `semantic.color.success.default` | `MaterialTheme.colorScheme.primary` (green) |
| **Status Text Color** | Failed | `semantic.color.danger.default` | `semantic.color.danger.default` | `MaterialTheme.colorScheme.error` |
| **Status Text Color** | Cancelled | `semantic.color.onSurface.muted` | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` |
| **Center Column Gap** | Spacing | `2` (2pt) | `2` (2pt) | `2.dp` / `spacing: 2` |
| **Center Column Horizontal Margin** | Spacing | `semantic.space.sm` (8pt) | `semantic.space.sm` (8pt) | `8.dp` / `padding(.horizontal, 8)` |
| **Right Area Right Margin** | Spacing | `semantic.space.sm` (8pt) | `semantic.space.sm` (8pt) | `8.dp` / `padding(.trailing, 8)` |
| **Spinner Size** | Dimension | `20` (20pt) | `20` (20pt) | `20.dp` / `.progressViewStyle(.circular)` |
| **Spinner Color** | Color | `semantic.color.primary.default` | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` |
| **Check Icon Size** | Dimension | `22` (22pt) | `22` (22pt) | `22.dp` / `frame(width: 22, height: 22)` |
| **Check Icon Color** | Completed | `semantic.color.success.default` | `semantic.color.success.default` | `MaterialTheme.colorScheme.primary` (green) |
| **Alert Icon Size** | Dimension | `22` (22pt) | `22` (22pt) | `22.dp` / `frame(width: 22, height: 22)` |
| **Alert Icon Color** | Failed | `semantic.color.danger.default` | `semantic.color.danger.default` | `MaterialTheme.colorScheme.error` |
| **Dismiss Icon Size** | Dimension | `18` (18pt) | `18` (18pt) | `18.dp` / `frame(width: 18, height: 18)` |
| **Dismiss Icon Color** | Color | `semantic.color.onSurface.muted` | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` |
| **Dismiss Button Left Margin** | Spacing | `semantic.space.sm` (8pt) | `semantic.space.sm` (8pt) | `8.dp` / `padding(.leading, 8)` |
| **Dismiss Button Hit Slop** | Touch target | `8` (8pt) | `8` (8pt) | `8.dp` / `.hitSlop` |
| **Wrapper Horizontal Margin** | Spacing | `semantic.space.md` (12pt) | `semantic.space.md` (12pt) | `12.dp` / `padding(.horizontal, 12)` |

---

## IMPLEMENTATION NOTES

### Status States

**Five States:**
1. **pending** - Queued, waiting to start (pulsing accent bar)
2. **running** - Actively planning (spinner, statusMessage)
3. **completed** - Success (check icon, tappable to view)
4. **failed** - Error (alert icon, tappable to retry)
5. **cancelled** - Cancelled by user (muted, no dismiss button)

### Accent Bar Animation

**Pulsing Opacity (Pending State):**
```tsx
pulseOpacity.value = withRepeat(
  withSequence(withTiming(0.25, { duration: 600 }), withTiming(1, { duration: 600 })),
  -1,
  false,
)
```

- Animates from 25% to 100% opacity
- 600ms duration per phase
- Repeats infinitely while pending

### Route Label Formatting

**Start → End Pattern:**
```tsx
const routeLabel = startLabel && endLabel
  ? `${startLabel} → ${endLabel}`
  : (startLabel ?? endLabel ?? 'Planning route')
```

**Examples:**
- `"San Francisco → Santa Cruz"`
- `"San Francisco → Planning route"` (only start provided)
- `"Planning route"` (fallback)

### Status Text

**Dynamic Labels:**
- pending: `"Queued..."`
- running: `statusMessage ?? "Planning route..."`
- completed: `"Route ready — tap to view"`
- failed: `"Planning failed — tap to retry"`
- cancelled: `"Cancelled"`

### Touch Handling

**Terminal States (completed, failed):**
- Entire card is tappable
- Completed → opens route results
- Failed → retries planning

**Non-Terminal States (pending, running, cancelled):**
- Card is not tappable
- Only dismiss button works (completed/failed)

### Right Indicator

**Status-Based Icons:**
- pending: `ActivityIndicator` (spinner)
- running: `ActivityIndicator` (spinner)
- completed: `check-circle` icon (success color)
- failed: `alert-circle` icon (danger color)
- cancelled: `null` (no icon)

### Animations

**Enter Animation:**
```tsx
SlideInDown.springify().damping(18).stiffness(200)
```

Slides in from top with spring physics.

**Exit Animation:**
```tsx
FadeOutDown.duration(200)
```

Fades out while sliding down over 200ms.

### Accessibility

**Accessibility Role:**
- Terminal states: `role = "button"`
- Non-terminal: `role = "progressbar"`

**Accessibility Label:**
- Returns status text: `"Queued..."`, `"Planning route..."`, etc.

---

## PLATFORM-SPECIFIC CONSIDERATIONS

### Android (Kotlin/Compose)

**AnimatedVisibility:**
```kotlin
AnimatedVisibility(
  visible = isVisible,
  enter = slideInVertically(
    initialOffsetY = { -it },
    animationSpec = spring(dampingRatio = 0.7f, stiffness = 200f)
  ),
  exit = fadeOut(slideOffset = { it / 2 }, animationSpec = tween(200))
) {
  // Content...
}
```

**CircularProgressIndicator:**
```kotlin
if (status == Status.PENDING || status == Status.RUNNING) {
  CircularProgressIndicator(
    modifier = Modifier.size(20.dp),
    color = MaterialTheme.colorScheme.primary,
    strokeWidth = 2.dp
  )
}
```

**Icon Mapping:**
- `motorbike` → `Icons.Outlined.TwoWheeler` or custom
- `check-circle` → `Icons.Filled.CheckCircle`
- `alert-circle` → `Icons.Filled.Error`
- `close` → `Icons.Filled.Close`

### iOS (Swift/SwiftUI)

**Animation:**
```swift
@State var isVisible: Bool = false

var body: some View {
  VStack {
    if isVisible {
      PlanningStatusTabContent()
        .transition(.move(edge: .top).combined(with: .opacity))
    }
  }
  .animation(.spring(response: 0.5, dampingFraction: 0.7), value: isVisible)
}
```

**ProgressView:**
```swift
if status == .pending || status == .running {
  ProgressView()
    .progressViewStyle(.circular)
    .scaleEffect(0.8) // 20pt size
}
```

**SF Symbol Mapping:**
- `motorbike` → `figure.outdoor.tricycle` or custom
- `check-circle` → `checkmark.circle.fill`
- `alert-circle` → `exclamationmark.triangle.fill`
- `close` → `xmark.circle.fill`

---

## USAGE EXAMPLES

### Basic Usage

```tsx
<PlanningStatusTab
  status="running"
  startLabel="San Francisco"
  endLabel="Santa Cruz"
  statusMessage="Checking weather..."
  onTapComplete={() => console.log('View results')}
  onTapRetry={() => console.log('Retry planning')}
  onDismiss={() => console.log('Dismiss')}
  testID="planning-status-tab"
/>
```

### Completed State

```tsx
<PlanningStatusTab
  status="completed"
  startLabel="San Francisco"
  endLabel="Santa Cruz"
  onTapComplete={() => navigation.navigate('RouteResults')}
  onTapRetry={() => {}}
  onDismiss={() => setShowStatusTab(false)}
  testID="planning-status-tab"
/>
```

### Failed State

```tsx
<PlanningStatusTab
  status="failed"
  startLabel="San Francisco"
  endLabel="Santa Cruz"
  statusMessage="No routes found"
  onTapComplete={() => {}}
  onTapRetry={() => retryPlanning()}
  onDismiss={() => setShowStatusTab(false)}
  testID="planning-status-tab"
/>
```

---

## ACCESSIBILITY

**Accessibility Labels:**
- Dynamic based on status text
- Examples: `"Queued..."`, `"Planning route..."`, `"Route ready — tap to view"`

**Accessibility Roles:**
- Terminal: `.accessibilityAddTraits(.isButton)`
- Non-terminal: `.accessibilityAddTraits(.updatesFrequently)`

**Accessibility Hints:**
- Completed: `"Double tap to view route"`
- Failed: `"Double tap to retry planning"`

---

## ESCALATE

None. All required tokens and platform equivalents are available.

**Note:** React Native Reanimated animations must be replaced with platform-specific animation APIs (Compose Animation, SwiftUI Animation).
