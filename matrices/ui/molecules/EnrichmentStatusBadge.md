# EnrichmentStatusBadge

## Component Classification
**Type:** Molecule
**Domain:** Enrichment
**Source:** `components/enrichment/enrichment-status-badge.tsx`

## Purpose
Badge showing enrichment phase status (cached, fast, extended, error). Visual indicator of route enrichment state.

## COMPOSITION

### Child Components
- `IconSymbol` (atom) - Status icon
- `Badge` (atom) - Base badge container

### Layout Structure
```
┌─────────┐
│ ✓ Cached│
└─────────┘
```

## TRANSLATION SOURCES

### React Native Source
**File:** `components/enrichment/enrichment-status-badge.tsx`

**Key Implementation:**
- Badge variant based on status
- Icon selection (check, clock, alert)
- Color mapping (green, amber, purple, red)
- Compact label text

### Kotlin/Compose Target
**File:** `android/app/src/main/java/com/laneshadow/ui/molecules/EnrichmentStatusBadge.kt`

**Implementation Notes:**
- Use `Badge` atom or `Surface` with `shape`
- `Icon` composable for status icon
- `when` expression for status styling
- Color mapping from semantic theme

**Expected API:**
```kotlin
@Composable
fun EnrichmentStatusBadge(
  status: EnrichmentStatus,
  modifier: Modifier = Modifier
)

enum class EnrichmentStatus {
  Cached,
  Fast,
  Extended,
  Error
}
```

### Swift/SwiftUI Target
**File:** `ios/LaneShadow/UI/Molecules/EnrichmentStatusBadge.swift`

**Implementation Notes:**
- Use `Badge` view or `RoundedRectangle` background
- SF Symbol for status icon
- Switch statement for styling
- Color mapping from semantic theme

**Expected API:**
```swift
struct EnrichmentStatusBadge: View {
  var status: EnrichmentStatus

  enum EnrichmentStatus {
    case cached, fast, extended, error
  }

  var body: some View {
    // ...
  }
}
```

## STYLE PROPERTIES MATRIX

| Property | RN Value | Kotlin | iOS | Token |
|----------|----------|---------|-----|-------|
| Badge Shape | Pill | Pill shape | Capsule | `shape.pill` |
| Height | 24dp | 24.dp | 24 | `size.badge.sm` |
| Padding Horizontal | 8dp | 8.dp | 8 | `spacing.sm` |
| Font Size | 12sp | 12.sp | 12 | `typography.fontSize.xs` |
| Font Weight | 600 (SemiBold) | FontWeight.SemiBold | .semibold | `typography.weight.semiBold` |
| Icon Size | 14dp | 14.dp | 14 | `iconSize.xs` |
| Icon-Text Gap | 4dp | 4.dp | 4 | `spacing.xs` |
| | | | | |
| **Cached** | | | | |
| Background Color | Success green | colorSuccess | Color.green | `color.success` |
| Text Color | On success | onSuccess | Color.white | `color.onSuccess` |
| Icon Name | check | check | checkmark | `icon.check` |
| | | | | |
| **Fast** | | | | |
| Background Color | Info blue | colorInfo | Color.blue | `color.info` |
| Text Color | On info | onInfo | Color.white | `color.onInfo` |
| Icon Name | bolt | bolt | bolt.fill | `icon.bolt` |
| | | | | |
| **Extended** | | | | |
| Background Color | Purple | colorEnrichmentExtended | Color.purple | `color.enrichmentExtended` |
| Text Color | On purple | onEnrichmentExtended | Color.white | `color.onEnrichmentExtended` |
| Icon Name | clock | schedule | clock.fill | `icon.clock` |
| | | | | |
| **Error** | | | | |
| Background Color | Danger red | colorError | Color.red | `color.danger` |
| Text Color | On error | onError | Color.white | `color.onError` |
| Icon Name | alert | error | exclamationmark.triangle.fill | `icon.error` |

## NOTES

### Status Mapping
- **Cached:** Pre-computed, instant display
- **Fast:** Enriched in <2s, background
- **Extended:** Enriched in >2s, loading state
- **Error:** Enrichment failed, showing fallback

### Label Text
- Cached: "Cached"
- Fast: "Fast"
- Extended: "Extended"
- Error: "Failed"

### Accessibility
- `accessibilityLabel`: "Enrichment status: {status}"
- `accessibilityRole`: "text"
- Status announced as suffix to route name

### Platform Differences
- **Android:** Material3 `Badge` or `Surface` with `CircleShape` stretched
- **iOS:** Native `Badge` or capsule `RoundedRectangle`

### Dependencies
- `IconSymbol` atom
- `Badge` atom (optional)
- Enrichment status enum
- Color tokens (semantic)
