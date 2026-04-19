# ModelManagerSection - Organism Matrix

**Component Source:** `react-native/components/model/ModelManagerSection.tsx`

**Atomic Level:** Organism

**Domain:** Settings / Model Management

---

## COMPOSITION ANALYSIS

### Child Components
- **External Dependencies:**
  - `react-native-paper` (Card, Button, IconButton, Text)
  - `ScrollView` for scrollable content
- **Composition Pattern:**
  - Status card with badge
  - Model information card (key-value rows)
  - Actions card (update, validate, delete buttons)
  - Info card with explanation

### Layout Structure
```
ModelManagerSection
└── ScrollView
    ├── Title ("Your Shadow")
    ├── Status Card
    │   ├── Status Badge (dot + text)
    │   └── Status Icon (conditional)
    ├── Model Info Card (conditional)
    │   ├── Card Title ("Model Information")
    │   ├── Version Row
    │   ├── Size Row
    │   ├── Downloaded Row
    │   ├── Last Validated Row
    │   └── Checksum Row
    ├── Actions Card
    │   ├── Update Button (conditional)
    │   ├── Validate Button
    │   └── Delete Button
    └── Info Card
        ├── Info Header (icon + title)
        └── Info Text (2 paragraphs)
```

---

## STATE & BEHAVIOR

### Props Interface
```typescript
interface ModelManagerSectionProps {
  modelMetadata: ModelMetadata | null
  isModelValid: boolean
  onUpdateAvailable?: () => void
  onDeleteModel?: () => void
  onValidateModel?: () => void
  updateAvailable?: boolean
}
```

### State Management
- **Props-Driven:**
  - All state is passed via props (controlled component)
  - No local state (except ScrollView scrolling)
- **Derived State:**
  - `statusColor` - Based on `isModelValid` and `updateAvailable`
  - `statusText` - Based on `isModelValid` and `updateAvailable`
  - `formatDate()` - Date formatting utility
  - `formatBytes()` - Byte formatting utility

### User Interactions
- **Update Model:**
  - Fires `onUpdateAvailable()` callback
  - Only visible when `updateAvailable === true`
- **Validate Model:**
  - Fires `onValidateModel()` callback
  - Optional (only if `onValidateModel` prop provided)
- **Delete Model:**
  - Fires `onDeleteModel()` callback
  - Styled as destructive (red text)

### Display Logic
- **Status Determination:**
  - Invalid: Red dot, "Corrupted" text
  - Update Available: Amber dot, "Update Available" text
  - Active: Green dot, "Active" text + checkmark icon
- **Model Info Card:**
  - Only shown when `modelMetadata !== null`
  - Displays version, size, download date, validation date, checksum

---

## TRANSLATION SOURCES

### React Native → Kotlin/Compose

**Cards:**
- RN: `react-native-paper` Card
- Kotlin: `Card` from `androidx.compose.material3`

**Buttons:**
- RN: `react-native-paper` Button
- Kotlin: `Button` from `androidx.compose.material3`

**Icons:**
- RN: `react-native-paper` IconButton
- Kotlin: `IconButton` from `androidx.compose.material3`

**Scrolling:**
- RN: `ScrollView`
- Kotlin: `Column` with `Modifier.verticalScroll()`

**Text Styling:**
- RN: `Text` variant styles
- Kotlin: `MaterialTheme.typography.*`

### React Native → Swift/SwiftUI

**Cards:**
- RN: `react-native-paper` Card
- Swift: `.background()` + `.cornerRadius()` or custom Card view

**Buttons:**
- RN: `react-native-paper` Button
- Swift: `.buttonStyle()` + `.buttonBorderShape()`

**Icons:**
- RN: `react-native-paper` IconButton
- Swift: `Button(systemImage:)` or `Image(systemName:)`

**Scrolling:**
- RN: `ScrollView`
- Swift: `ScrollView`

**Text Styling:**
- RN: `Text` variant styles
- Swift: `.font()`, `.fontWeight()` modifiers

---

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin Token | Swift Token | Platform Fallback |
|----------|----------|--------------|-------------|-------------------|
| **Background Color** | #111827 | `MaterialTheme.colorScheme.background` | `.colorScheme.background` | #111827 |
| **Title Font Size** | 24pt | `MaterialTheme.typography.headlineMedium.fontSize` | `.font(.largeTitle)` | 24pt |
| **Title Font Weight** | 700 | `MaterialTheme.typography.headlineMedium.fontWeight` | `.fontWeight(.bold)` | 700 |
| **Title Color** | #F3F4F6 | `MaterialTheme.colorScheme.onBackground` | `.colorScheme.onBackground` | #F3F4F6 |
| **Card Background** | #1F2937 | `MaterialTheme.colorScheme.surface` | `.colorScheme.surface` | #1F2937 |
| **Card Border Radius** | 16pt | `CardDefaults.shape = RoundedCornerShape(16)` | `.cornerRadius(16)` | 16pt |
| **Status Label Color** | #9CA3AF | `MaterialTheme.colorScheme.onSurfaceVariant` | `.colorScheme.onSurfaceVariant.opacity(0.6)` | #9CA3AF |
| **Status Dot Size** | 8x8pt | `8.dp` | `8` | 8pt |
| **Status Dot Radius** | 4pt | `4.dp` | `4` | 4pt |
| **Info Label Color** | #9CA3AF | `MaterialTheme.colorScheme.onSurfaceVariant` | `.colorScheme.onSurfaceVariant` | #9CA3AF |
| **Info Value Color** | #F3F4F6 | `MaterialTheme.colorScheme.onSurface` | `.colorScheme.onSurface` | #F3F4F6 |
| **Checksum Color** | #6B7280 | `MaterialTheme.colorScheme.onSurfaceVariant` | `.colorScheme.onSurfaceVariant.opacity(0.5)` | #6B7280 |
| **Checksum Font** | Monospace 12pt | `FontFamily.Monospace` | `.font(.system(.monospaced))` | Monospace 12pt |
| **Row Border Color** | rgba(255,255,255,0.05) | `DividerDefaults.color` | `.opacity(0.05)` | 5% white |
| **Update Button Color** | #F59E0B | `MaterialTheme.colorScheme.tertiary` | `.orange` | #F59E0B |
| **Delete Button Color** | #EF4444 | `MaterialTheme.colorScheme.error` | `.red` | #EF4444 |
| **Info Card Border** | rgba(245,158,11,0.3) | `BorderStroke(0.3.dp, Color(0xFFF59E0B))` | `.stroke(Color.orange.opacity(0.3))` | 30% amber |
| **Info Card Background** | rgba(245,158,11,0.1) | `Color(0xFFF59E0B).copy(alpha = 0.1f)` | `.background(Color.orange.opacity(0.1))` | 10% amber |
| **Info Title Color** | #F59E0B | `MaterialTheme.colorScheme.tertiary` | `.orange` | #F59E0B |
| **Info Text Color** | #D1D5DB | `MaterialTheme.colorScheme.onSurfaceVariant` | `.colorScheme.onSurfaceVariant` | #D1D5DB |
| **Content Gap** | 16pt | `16.dp` | `16` | 16pt |
| **Row Gap** | 12pt | `12.dp` | `12` | 12pt |
| **Info Row Padding** | 8pt vertical | `PaddingValues(vertical = 8.dp)` | `.padding(.vertical, 8)` | 8pt |

### Platform-Specific Adjustments

**Android:**
- Use `ElevatedCard` or `OutlinedCard` from Material 3
- Use `FilledTonalButton` for update button
- Use `TextButton` for delete button
- Use `OutlinedButton` for validate button

**iOS:**
- Use `.listRowBackground()` for card-like appearance
- Use `.buttonBorderShape(.roundedRectangle)` for buttons
- Use `.monospacedSystemFont()` for checksum
- Use `.background(.ultraThinMaterial)` for subtle cards

---

## NOTES

### Zero ESCALATE Tokens
- ✅ No platform-specific APIs requiring escalation
- ✅ Standard card/button components
- ✅ Pure presentation component (props-driven)
- ✅ No exotic file system operations

### Implementation Considerations

**Kotlin:**
```kotlin
@Composable
fun ModelManagerSection(
  modelMetadata: ModelMetadata?,
  isModelValid: Boolean,
  updateAvailable: Boolean = false,
  onUpdateAvailable: () -> Unit = {},
  onValidateModel: () -> Unit = {},
  onDeleteModel: () -> Unit = {}
) {
  Column(
    modifier = Modifier
      .fillMaxSize()
      .background(Color(0xFF111827))
      .verticalScroll(rememberScrollState())
      .padding(16.dp)
  ) {
    Text(
      text = "Your Shadow",
      style = MaterialTheme.typography.headlineMedium,
      fontWeight = FontWeight.Bold,
      color = Color(0xFFF3F4F6)
    )

    Spacer(modifier = Modifier.height(16.dp))

    // Status Card
    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1F2937))) {
      // ... status content
    }

    // Model Info Card (conditional)
    if (modelMetadata != null) {
      Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1F2937))) {
        // ... info rows
      }
    }

    // Actions Card
    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1F2937))) {
      // ... buttons
    }
  }
}
```

**Swift:**
```swift
struct ModelManagerSection: View {
  var modelMetadata: ModelMetadata?
  var isModelValid: Bool
  var updateAvailable: Bool = false
  var onUpdateAvailable: () -> Void = {}
  var onValidateModel: () -> Void = {}
  var onDeleteModel: () -> Void = {}

  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        Text("Your Shadow")
          .font(.largeTitle)
          .fontWeight(.bold)
          .foregroundColor(Color(red: 0.95, green: 0.96, blue: 0.97))

        // Status Card
        VStack(alignment: .leading) {
          // ... status content
        }
        .padding()
        .background(Color(red: 0.12, green: 0.16, blue: 0.22))
        .cornerRadius(16)

        // Model Info Card (conditional)
        if let metadata = modelMetadata {
          // ... info rows
        }

        // Actions Card
        VStack(spacing: 12) {
          if updateAvailable {
            Button("Update Model", action: onUpdateAvailable)
              .buttonStyle(.borderedProminent)
          }
          // ... other buttons
        }
        .padding()
        .background(Color(red: 0.12, green: 0.16, blue: 0.22))
        .cornerRadius(16)
      }
      .padding()
    }
    .background(Color(red: 0.07, green: 0.09, blue: 0.15))
  }
}
```

### Testing Notes
- Test status badge rendering for all three states (valid, invalid, update available)
- Test model info card rendering with null metadata
- Test conditional button visibility (update button only when `updateAvailable === true`)
- Test text truncation for long checksum values
- Test scrolling behavior with many cards
- Verify color contrast ratios meet accessibility standards
- Test button tap targets (min 44pt for iOS)

### Dependencies
- **Required:** ModelMetadata data structure
- **Required:** formatBytes utility function
- **Required:** formatDate utility function
- **Optional:** Update available check (backend integration)
- **Optional:** Model validation logic (backend integration)

### File System Operations
- **Note:** This component does NOT perform file system operations directly
- All file operations (model download, delete, validate) are handled by parent and passed via callbacks
- This is a presentation component only
