# RouteDirectionsSheet - Organism Matrix

**Component Source:** `react-native/components/sheets/route-directions-sheet.tsx`

**Atomic Level:** Organism

**Domain:** Routes / Navigation

---

## COMPOSITION ANALYSIS

### Child Components
- **External Dependencies:**
  - `@gorhom/bottom-sheet` (BottomSheetScrollView, BottomSheetWrapper)
  - `react-native-safe-area-context` (useSafeAreaInsets)
- **Internal Components:**
  - `Button` - Footer actions
  - `IconSymbol` - Icons
  - `BottomSheetWrapper` - Sheet wrapper
- **Composition Pattern:**
  - Fixed header (route title, segment count)
  - Scrollable content (step-by-step directions)
  - Fixed footer (Close, Navigate buttons)
  - Leg sections or individual step cards

### Layout Structure
```
RouteDirectionsSheet
└── BottomSheetWrapper
    ├── Header (fixed)
    │   ├── Title ("Route Overview")
    │   └── Subtitle (route name • segment count)
    ├── Scrollable Content
    │   └── BottomSheetScrollView
    │       ├── Leg Section 1
    │       │   ├── Leg Header ("Segment 1")
    │       │   └── Step Cards[] (if steps exist)
    │       │       ├── Step Number
    │       │       ├── Instruction
    │       │       └── Meta (distance, duration)
    │       ├── Leg Section 2
    │       │   └── ... (same as above)
    │       └── Summary Card (total distance/time)
    └── Footer (fixed)
        ├── Close Button
        └── Navigate Button
```

---

## STATE & BEHAVIOR

### Props Interface
```typescript
export type RouteDirectionsSheetProps = {
  isVisible: boolean
  onClose: () => void
  routeLabel: string
  legs: RouteLeg[]  // From server/models/saved-routes
  destinationLabel?: string
  onLegSelect?: (legIndex: number) => void
  selectedLegIndex?: number
  testID?: string
}
```

### Data Structures
```typescript
type RouteLeg = {
  legIndex: number
  start: { lat: number; lng: number; label?: string }
  end: { lat: number; lng: number; label?: string }
  distanceMeters: number
  durationSeconds: number
  steps?: RouteStep[]
}

type RouteStep = {
  stepIndex: number
  instruction: string
  distanceMeters: number
  durationSeconds: number
}
```

### State Management
- **Props-Driven:**
  - No internal state
  - Controlled by parent via props
- **Derived State:**
  - `finalDestination` - Memoized from last leg
  - `mapUrl` - Platform-specific navigation URL

### User Interactions
- **Leg Press:**
  - Fires `onLegSelect(legIndex)` callback
  - Highlights selected leg (border color)
- **Close:**
  - Fires `onClose()` callback
-**Navigate:**
  - Opens external map app (Google Maps or Apple Maps)
  - Uses `Linking.openURL()`

### Display Logic
- **Leg with Steps:**
  - Shows individual step cards with turn-by-turn directions
  - Each step has number, instruction, distance, duration
- **Leg without Steps:**
  - Shows leg-level summary card
  - From/to locations, distance, duration
  - Human-readable summary (first 2-3 steps)
- **Summary Footer:**
  - Total distance and duration across all legs

---

## TRANSLATION SOURCES

### React Native → Kotlin/Compose

**Bottom Sheet:**
- RN: `@gorhom/bottom-sheet` (BottomSheetModal)
- Kotlin: `BottomSheetScaffold` or `ModalBottomSheetLayout`

**Scrolling:**
- RN: `BottomSheetScrollView`
- Kotlin: `LazyColumn` inside sheet

**External Navigation:**
- RN: `Linking.openURL()`
- Kotlin: `Intent(Intent.ACTION_VIEW, Uri.parse(url))`

**Safe Area:**
- RN: `useSafeAreaInsets()`
- Kotlin: `WindowInsets.navigationBars`

### React Native → Swift/SwiftUI

**Bottom Sheet:**
- RN: `@gorhom/bottom-sheet`
- Swift: `.presentationDetents()` + `.sheet()`

**Scrolling:**
- RN: `BottomSheetScrollView`
- Swift: `ScrollView` inside sheet

**External Navigation:**
- RN: `Linking.openURL()`
- Swift: `URL(string:).openURL()`

**Safe Area:**
- RN: `useSafeAreaInsets()`
- Swift: `.safeAreaInset()` automatically

---

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin Token | Swift Token | Platform Fallback |
|----------|----------|--------------|-------------|-------------------|
| **Sheet Snap Points** | ['50%', '90%'] | `BottomSheetDefaults.expandedOffset` | `.presentationDetents([.medium, .large])` | 50%, 90% |
| **Header Padding** | `semantic.space.lg` | `16.dp` | `16` | 16pt |
| **Header Padding Top** | `semantic.space.md` | `12.dp` | `12` | 12pt |
| **Header Padding Bottom** | `semantic.space.sm` | `8.dp` | `8` | 8pt |
| **Header Border** | `semantic.color.border.default` + 33% opacity | `DividerDefaults.color` | `.opacity(0.2)` | 20% border color |
| **Title Color** | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `.primary` | #F3F4F6 |
| **Subtitle Color** | `semantic.color.onSurface.subtle` | `MaterialTheme.colorScheme.onSurfaceVariant` | `.secondary` | #9CA3AF |
| **Content Padding** | `semantic.space.lg` | `16.dp` | `16` | 16pt |
| **Content Padding Bottom** | 120pt | `120.dp` | `120` | 120pt (extra for footer) |
| **Leg Section Gap** | 16pt | `16.dp` | `16` | 16pt |
| **Leg Section Header Gap** | 8pt | `8.dp` | `8` | 8pt |
| **Leg Label Color** | `semantic.color.onSurface.subtle` | `MaterialTheme.colorScheme.onSurfaceVariant` | `.secondary` | #9CA3AF |
| **Step Card Background** | `semantic.color.surface.default` + E6 (90%) | `MaterialTheme.colorScheme.surface` | `.regularMaterial` | 90% surface |
| **Step Card Border** | `semantic.color.border.default` + 4D (30%) | `OutlinedCard.border` | `.stroke()` | 30% border color |
| **Step Card Radius** | 8pt | `8.dp` | `8` | 8pt |
| **Step Card Padding** | 12pt | `12.dp` | `12` | 12pt |
| **Step Card Margin Bottom** | `semantic.space.xs` (last: `semantic.space.md`) | `4.dp` (last: `8.dp`) | `4` (last: `8`) | 4pt (8pt last) |
| **Step Number Size** | 24x24pt | `24.dp` | `24` | 24pt |
| **Step Number Radius** | 12pt | `12.dp` | `12` | 12pt |
| **Step Number Background** | `semantic.color.primary.default` + 1A (10%) | `MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)` | `.primary.opacity(0.1)` | 10% primary |
| **Step Number Color** | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `.primary` | #B87333 |
| **Step Number Font** | 12pt, weight 700 | `12.sp` + `FontWeight.Bold` | `.font(.system(size: 12, weight: .bold))` | 12pt bold |
| **Instruction Line Height** | 20pt | `20.sp` + `lineHeight = 20.sp` | `.lineSpacing(2)` | 20pt |
| **Instruction Color** | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `.primary` | #F3F4F6 |
| **Meta Icon Size** | 12pt | `12.dp` | `12` | 12pt |
| **Meta Icon Color** | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `.secondary.opacity(0.5)` | #6B7280 |
| **Meta Text Color** | `semantic.color.onSurface.subtle` | `MaterialTheme.colorScheme.onSurfaceVariant` | `.secondary` | #9CA3AF |
| **Leg Card Selected Border** | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `.primary` | #B87333 |
| **Leg Card Selected Background** | `semantic.color.primary.default` + 1A (10%) | `MaterialTheme.colorScheme.primaryContainer` | `.primary.opacity(0.1)` | 10% primary |
| **Leg Card Background** | `semantic.color.surface.default` + E6 (90%) | `MaterialTheme.colorScheme.surface` | `.regularMaterial` | 90% surface |
| **Leg Card Border** | `semantic.color.border.default` + 4D (30%) | `OutlinedCard.border` | `.stroke()` | 30% border color |
| **Leg Card Radius** | 12pt | `12.dp` | `12` | 12pt |
| **Leg Card Padding** | `semantic.space.md` (12pt) | `12.dp` | `12` | 12pt |
| **Leg Card Gap** | `semantic.space.sm` (8pt) | `8.dp` | `8` | 8pt |
| **Leg Card Margin Bottom** | `semantic.space.xl` (last: `semantic.space.sm`) | `24.dp` (last: `8.dp`) | `24` (last: `8`) | 24pt (8pt last) |
| **Leg Number Size** | 28x28pt | `28.dp` | `28` | 28pt |
| **Leg Number Radius** | 14pt | `14.dp` | `14` | 14pt |
| **Location Icon Size** | 12pt (small), 14pt (marker) | `12.dp`, `14.dp` | `12`, `14` | 12pt, 14pt |
| **Location Icon Color** | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `.primary` | #B87333 |
| **Summary Card Background** | `semantic.color.primary.default` + 0D (5%) | `MaterialTheme.colorScheme.primaryContainer` | `.primary.opacity(0.05)` | 5% primary |
| **Summary Card Border** | `semantic.color.primary.default` + 33 (20%) | `MaterialTheme.colorScheme.primary` | `.stroke(.primary.opacity(0.2))` | 20% primary |
| **Summary Card Radius** | 8pt | `8.dp` | `8` | 8pt |
| **Summary Card Padding** | `semantic.space.sm` (8pt) | `8.dp` | `8` | 8pt |
| **Footer Gap** | `semantic.space.sm` (8pt) | `8.dp` | `8` | 8pt |
| **Footer Button Flex** | 1 | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | Equal width |

### Platform-Specific Adjustments

**Android:**
- Use `Material3BottomSheet` for modern Material 3 design
- Use `Intent.ACTION_VIEW` for navigation
- Use `Uri.parse()` for map URLs
- Footer uses `Row` with `Modifier.weight(1f)`

**iOS:**
- Use `.presentationDetents([.medium, .large])` for snap points
- Use `.toolbar { ToolbarItem(placement: .confirmationDialog) }` for footer
- Use `URL(string:).openURL()` for navigation
- Footer uses `HStack` with `.frame(maxWidth: .infinity)`

---

## NOTES

### Zero ESCALATE Tokens
- ✅ No platform-specific APIs requiring escalation
- ✅ Standard bottom sheet patterns
- ✅ External navigation via URL schemes
- ✅ Safe area handling is standard

### Implementation Considerations

**Kotlin:**
```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RouteDirectionsSheet(
  isVisible: Boolean,
  onDismiss: () -> Unit,
  routeLabel: String,
  legs: List<RouteLeg>,
  destinationLabel: String? = null,
  onLegSelect: (Int) -> Unit = {},
  selectedLegIndex: Int? = null
) {
  val sheetState = rememberBottomSheetScaffoldState(
    bottomSheetState = rememberStandardBottomSheetState(
      initialValue = SheetValue.Hidden,
      skipHiddenState = false
    )
  )

  val context = LocalContext.current

  // Handle navigation
  val handleNavigate = {
    if (legs.isNotEmpty()) {
      val lastLeg = legs.last()
      val url = "https://www.google.com/maps/dir/?api=1" +
        "&destination=${lastLeg.end.lat},${lastLeg.end.lng}"
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
      context.startActivity(intent)
    }
  }

  if (isVisible) {
    BottomSheetScaffold(
      scaffoldState = sheetState,
      sheetContent = {
        Column(
          modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
        ) {
          // Header
          Text(
            text = "Route Overview",
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface
          )
          Text(
            text = "$routeLabel • ${legs.size} segment${if (legs.size != 1) "s" else ""}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )

          Spacer(modifier = Modifier.height(12.dp))

          // Scrollable legs
          LazyColumn {
            items(legs.size) { legIndex ->
              val leg = legs[legIndex]
              RouteLegCard(
                leg = leg,
                isSelected = selectedLegIndex == legIndex,
                onClick = { onLegSelect(legIndex) }
              )
            }
          }

          Spacer(modifier = Modifier.height(120.dp))

          // Footer
          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
          ) {
            Button(
              onClick = onDismiss,
              modifier = Modifier.weight(1f),
              variant = ButtonVariant.Outline
            ) {
              Text("Close")
            }
            Button(
              onClick = handleNavigate,
              modifier = Modifier.weight(1f),
              variant = ButtonVariant.Primary
            ) {
              Icon(
                imageVector = Icons.Default.Navigation,
                contentDescription = null,
                modifier = Modifier.size(20.dp)
              )
              Spacer(modifier = Modifier.width(8.dp))
              Text("Navigate")
            }
          }
        }
      },
      sheetPeekHeight = 0.dp
    ) {
      // Main content (empty for modal)
    }
  }
}
```

**Swift:**
```swift
struct RouteDirectionsSheet: View {
  var isVisible: Binding<Bool>
  var onDismiss: () -> Void
  var routeLabel: String
  var legs: [RouteLeg]
  var destinationLabel: String?
  var onLegSelect: (Int) -> Void = { _ in }
  var selectedLegIndex: Int?

  var body: some View {
    .sheet(isPresented: isVisible) {
      NavigationView {
        ScrollView {
          VStack(alignment: .leading, spacing: 16) {
            // Header
            Text("Route Overview")
              .font(.titleLarge)
              .foregroundColor(.primary)

            Text("\(routeLabel) • \(legs.count) segment\(legs.count != 1 ? "s" : "")")
              .font(.bodyMedium)
              .foregroundColor(.secondary)

            Divider()

            // Legs
            ForEach(0..<legs.count, id: \.self) { legIndex in
              RouteLegCard(
                leg: legs[legIndex],
                isSelected: selectedLegIndex == legIndex,
                onClick: { onLegSelect(legIndex) }
              )
            }

            // Summary
            HStack {
              Image(systemName: "info.circle")
                .foregroundColor(.secondary)
              Text("Total distance: \(totalDistance) • Total time: \(totalDuration)")
                .font(.caption)
                .foregroundColor(.secondary)
            }
            .padding(8)
            .background(Color.primary.opacity(0.05))
            .cornerRadius(8)
          }
          .padding()
        }
        .navigationTitle("Route Overview")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .confirmationDialog) {
            HStack {
              Button("Close", action: onDismiss)
              Button(action: handleNavigate) {
                Label("Navigate", systemImage: "navigation")
              }
              .buttonStyle(.borderedProminent)
            }
          }
        }
      }
      .presentationDetents([.medium, .large])
      .presentationDragIndicator(.visible)
    }
  }

  private func handleNavigate() {
    guard let lastLeg = legs.last else { return }
    let url = URL(string: "http://maps.apple.com/?daddr=\(lastLeg.end.lat),\(lastLeg.end.lng)&dirflg=d")!
    url.openURL()
  }
}
```

### Testing Notes
- Test sheet expansion/collapse at both snap points
- Test scroll performance with many steps
- Test external navigation opens correct map app
- Test leg selection highlighting
- Test that step cards render correctly
- Test accessibility (VoiceOver/TalkBack)
- Verify distance/duration formatting
- Test with very long instruction text (truncation)

### Dependencies
- **Required:** RouteLeg data structure
- **Required:** BottomSheetWrapper component
- **Required:** Button component
- **Required:** IconSymbol component
- **Required:** Safe area handling
- **Optional:** Route summary calculations

### External Navigation
- **Android:** Opens Google Maps with `https://www.google.com/maps/dir/?api=1&destination=...`
- **iOS:** Opens Apple Maps with `http://maps.apple.com/?daddr=...`
- **Fallback:** Could add Waze support (`waze://?ll=...`)
- **Note:** Deep linking may require URL scheme configuration in Info.plist (iOS) or Manifest (Android)

### Performance Considerations
- Use `LazyColumn` / `LazyVStack` for large step lists
- Memoize leg cards to avoid re-renders
- Virtualize long lists (100+ steps)
- Consider pagination for very long routes

### Accessibility
- Each step card should be accessible
- Use `accessibilityLabel` for step numbers
- Use `accessibilityHint` for leg selection
- Test with VoiceOver (iOS) and TalkBack (Android)
- Ensure sufficient color contrast for selected state
