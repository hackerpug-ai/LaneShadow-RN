# DevMenu - Organism Matrix

**Component Source:** `react-native/components/dev/dev-menu.tsx`

**Atomic Level:** Organism

**Domain:** Development Tools

---

## COMPOSITION ANALYSIS

### Child Components
- **External Dependencies:**
  - `@gorhom/bottom-sheet` (BottomSheetModal, BottomSheetView, BottomSheetBackdrop)
  - `react-native-reanimated` (Animated.View, useSharedValue, useAnimatedStyle)
  - `react-native-gesture-handler` (Gesture, GestureDetector)
  - `MaterialCommunityIcons` from `@expo/vector-icons`
- **Internal Components:**
  - `Button` (actions)
- **Composition Pattern:**
  - Floating draggable FAB (GestureDetector + Animated.View)
  - Bottom sheet modal (BottomSheetModal)
  - Info display sections (View + Text)
  - Action buttons (Button)
  - Result banner (View + Text)

### Layout Structure
```
DevMenu
├── Floating FAB (draggable)
│   └── Pressable → Icon
└── BottomSheetModal
    └── BottomSheetView
        ├── Header (Text)
        ├── Model Info Section
        │   ├── Section Title
        │   └── Info Text (monospace)
        ├── Actions Section
        │   ├── Section Title
        │   ├── Clear Model Button
        │   └── Reset Setup Button
        ├── Result Banner (conditional)
        └── Close Button
```

---

## STATE & BEHAVIOR

### State Management
- **Local State:**
  - `modelInfo: string` - Model file information
  - `loading: string | null` - Which action is loading
  - `result: {type, text} | null` - Success/error message
- **Refs:**
  - `bottomSheetRef` - Bottom sheet control
  - `x, y` - FAB position (useSharedValue)
  - `startX, startY` - Drag start position
- **Derived State:**
  - `isEnabled` - From `useDevMenuEnabled()` hook
- **External State:**
  - `clearModel` - from `useDownloadStore()`
  - `resetSetup` - from `useDownloadStore()`

### User Interactions
- **FAB Drag:**
  - Pan gesture updates position (clamped to screen bounds)
  - Snap to left/right edge on release
- **FAB Press:**
  - Presents bottom sheet
  - Loads model info
- **Clear Model:**
  - Deletes model file from FileSystem
  - Shows result banner
- **Reset Setup:**
  - Resets download store state
  - Shows result banner
- **Close:**
  - Dismisses bottom sheet

### Side Effects
- `loadModelInfo` - Reads model file from FileSystem
- `handleClearModel` - Deletes model file
- `handleResetSetup` - Resets Zustand store

---

## TRANSLATION SOURCES

### React Native → Kotlin/Compose

**Draggable FAB:**
- RN: `GestureDetector` + `useSharedValue` (Reanimated)
- Kotlin: `Box` + `PointerInputScope.detectDragGestures`

**Bottom Sheet:**
- RN: `@gorhom/bottom-sheet` (BottomSheetModal)
- Kotlin: `Material3BottomSheet` or `androidx.compose.material3.BottomSheetScaffold`

**Animations:**
- RN: `Animated.View` + `useAnimatedStyle`
- Kotlin: `animate*AsState` functions

**State Management:**
- RN: `useState` + Zustand store
- Kotlin: `remember` + `ViewModel` + StateFlow

### React Native → Swift/SwiftUI

**Draggable FAB:**
- RN: `GestureDetector` + `useSharedValue`
- Swift: `.gesture(DragGesture())` on View

**Bottom Sheet:**
- RN: `@gorhom/bottom-sheet`
- Swift: `.presentationDetents()` + `.sheet()`

**Animations:**
- RN: `Animated.View` + `useAnimatedStyle`
- Swift: `.animation()` modifier

**State Management:**
- RN: `useState` + Zustand store
- Swift: `@State` + `@ObservedObject` / `@EnvironmentObject`

---

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin Token | Swift Token | Platform Fallback |
|----------|----------|--------------|-------------|-------------------|
| **FAB Background** | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `.primary` | #B87333 |
| **FAB Size** | 56pt | `56.dp` | `56` | 56pt |
| **FAB Border Radius** | 28pt | `28.dp` | `28` | 28pt |
| **Sheet Background** | `semantic.color.surface.default` | `MaterialTheme.colorScheme.surface` | `.regularMaterial` | #1A1C1F |
| **Header Title Color** | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `.primary` | #F3F4F6 |
| **Info Text Background** | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `.thickMaterial` | #2B2E33 |
| **Success Banner** | `semantic.color.success.default` | `MaterialTheme.colorScheme.primary` (green) | `.green` | #31A362 |
| **Error Banner** | `semantic.color.danger.default` | `MaterialTheme.colorScheme.error` | `.red` | #E35D6A |
| **Section Gap** | `semantic.space.lg` | `16.dp` | `16` | 16pt |
| **Small Gap** | `semantic.space.sm` | `8.dp` | `8` | 8pt |
| **Medium Gap** | `semantic.space.md` | `12.dp` | `12` | 12pt |
| **Border Radius (info)** | 8pt | `8.dp` | `8` | 8pt |
| **Text Monospace** | 12pt | `12.sp` | `12` | 12pt |
| **Elevation (FAB)** | `semantic.elevation[4]` | `CardDefaults.elevation(4)` | `.zIndex(4)` | elevation 4 |

### Platform-Specific Adjustments

**Android:**
- Use `FloatingActionButton` for the FAB
- Use `ModalBottomSheet` from Material 3
- Drag gestures need `Modifier.pointerInput`

**iOS:**
- Use `.toolbar` with `.confirmationDialog()` for sheet
- Draggable FAB with `.offset()` modifier
- Use `.monospaced()` font for info text

---

## NOTES

### Zero ESCALATE Tokens
- ✅ No platform-specific APIs requiring escalation
- ✅ Pure UI component with standard gestures
- ✅ Bottom sheet library has native equivalents

### Implementation Considerations

**Kotlin:**
```kotlin
@Composable
fun DevMenu(
  isEnabled: Boolean = BuildConfig.DEBUG,
  onClearModel: () -> Unit,
  onResetSetup: () -> Unit
) {
  val scope = rememberCoroutineScope()
  val sheetState = rememberModalBottomSheetState()
  val fabOffset = remember { Animatable(Offset(x = 0f, y = 0f)) }

  // Drag implementation with PointerInputScope
  // Bottom sheet with ModalBottomSheetLayout
}
```

**Swift:**
```swift
struct DevMenu: View {
  @Environment(\.colorScheme) var colorScheme
  @State private var isPresented = false
  @State private var modelInfo = ""

  var body: some View {
    VStack {
      // Draggable FAB with .offset()
      // Sheet with .presentationDetents([0.6])
    }
  }
}
```

### Testing Notes
- Test FAB drag boundaries and snap behavior
- Test model file operations (file system access)
- Test loading states and error handling
- Verify bottom sheet keyboard behavior
- Test that dev menu only appears in dev builds

### Dependencies
- **Critical:** File system access for model info/clear
- **Required:** Dev mode flag (`__DEV__` or `EXPO_PUBLIC_DEV_MENU`)
- **Optional:** Model metadata store integration
