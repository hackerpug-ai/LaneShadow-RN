# ErrorMessage Component Matrix

**Component Path:** `react-native/components/chat/error-message.tsx`
**Atomic Level:** Molecule
**Domain:** Chat
**Last Updated:** 2025-01-18

---

## COMPOSITION

**React Native Source:**
```tsx
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
```

**Child Dependencies:**
- `Text` (react-native-paper) - error message content
- `View` (React Native core) - container

**Layout Structure:**
```
ErrorMessage (left-aligned chat bubble)
└── Error Container (glass-morphic card with warning border)
    └── Message Text (bodyMedium variant)
```

---

## TRANSLATION SOURCES

### Kotlin/Compose

**Dependencies:**
- `androidx.compose.foundation.layout.Column`
- `androidx.compose.material3.Surface`
- `androidx.compose.material3.Text`

**Platform Equivalents:**
- `View` → `Column` or `Box`
- `Text` (react-native-paper) → `Text`
- `StyleSheet` → `Modifier` chain

### Swift/SwiftUI

**Dependencies:**
- `SwiftUI.VStack`
- `SwiftUI.Text`

**Platform Equivalents:**
- `View` → `VStack`
- `Text` (react-native-paper) → `Text`
- `StyleSheet` → View modifier chain

---

## STYLE PROPERTIES MATRIX

| Element | Property | Token Path (Light) | Token Path (Dark) | Platform Mapping |
|---------|----------|-------------------|------------------|------------------|
| **Container Background** | Color | `semantic.color.surfaceVariant.default` | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` |
| **Container Border** | Color | `semantic.color.warning.default` | `semantic.color.warning.default` | `MaterialTheme.colorScheme.error` |
| **Container Border** | Width | `1` (1pt) | `1` (1pt) | `1.dp` / `strokeWidth: 1` |
| **Container Radius** | Corner radius | `semantic.radius.lg` (16pt) | `semantic.radius.lg` (16pt) | `16.dp` / `cornerRadius: 16` |
| **Container Padding** | Spacing | `semantic.space.md` (12pt) | `semantic.space.md` (12pt) | `12.dp` / `padding: 12` |
| **Text Font** | Typography | `variant="bodyMedium"` | `variant="bodyMedium"` | `Typography.bodyMedium` / `Font.body` |
| **Text Color** | Color | `semantic.color.onSurface.default` | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` |
| **Container Max Width** | Dimension | `80%` | `80%` | `fillMaxWidth(0.8f)` / `.frame(maxWidth: .infinity)*0.8` |
| **Container Alignment** | Layout | `alignSelf: 'flex-start'` | `alignSelf: 'flex-start'` | `Modifier.align(Start)` / `.frame(maxWidth: .infinity, alignment: .leading)` |
| **Vertical Margin** | Spacing | `4` (4pt) | `4` (4pt) | `4.dp` / `margin(.vertical, 4)` |

---

## IMPLEMENTATION NOTES

### Chat Bubble Pattern

**Left Alignment:**
```tsx
alignSelf: 'flex-start'
```

ErrorMessage follows the "agent message" pattern — left-aligned like other agent responses in the chat transcript.

### Max Width Constraint

**80% Width:**
```tsx
maxWidth: '80%'
```

Prevents the error message from spanning the full screen width, maintaining readability and visual hierarchy.

### Warning Border

**Copper/Orange Border:**
```tsx
borderColor: semantic.color.warning.default
borderWidth: 1
```

The warning border (copper/orange color) distinguishes error messages from regular agent messages and user messages.

### Error Types

**Rate Limit Errors:**
- Message: "You've reached the rate limit. Please upgrade your plan for more requests."
- Context: Upsell message for free-tier users

**Parse Failures:**
- Message: "I couldn't understand that. Try rephrasing your request."
- Context: Agent couldn't parse natural language input

**Generation Failures:**
- Message: "I couldn't generate a route. Try a different destination or time."
- Context: Backend routing service failed

**Timeouts:**
- Message: "Request timed out. Please try again."
- Context: Network or backend timeout

### Styling Consistency

**Matches ChatTranscript:**
- Uses same background as other chat bubbles (`surfaceVariant`)
- Maintains consistent border radius (`lg`)
- Follows same padding scheme (`md`)
- Same typography scale (`bodyMedium`)

### Test ID

**Default:**
```tsx
testID = 'error-message'
```

Override via prop for specific error scenarios:
```tsx
<ErrorMessage testID="rate-limit-error" message="..." />
```

---

## PLATFORM-SPECIFIC CONSIDERATIONS

### Android (Kotlin/Compose)

**Surface with Border:**
```kotlin
Surface(
  color = MaterialTheme.colorScheme.surfaceVariant,
  shape = RoundedCornerShape(16.dp),
  border = BorderStroke(1.dp, MaterialTheme.colorScheme.error),
  modifier = Modifier
    .padding(12.dp)
    .fillMaxWidth(0.8f)
    .align(Alignment.Start)
) {
  Text(
    text = message,
    style = MaterialTheme.typography.bodyMedium,
    color = MaterialTheme.colorScheme.onSurface,
    modifier = Modifier.padding(12.dp)
  )
}
```

**Chat Integration:**
```kotlin
// In ChatTranscript (LazyColumn)
item {
  ErrorMessage(message = errorMessage)
}
```

### iOS (Swift/SwiftUI)

**View with Border:**
```swift
VStack {
  Text(message)
    .font(.body)
    .foregroundColor(Color.onSurface)
}
.padding(12)
.background(Color.surfaceVariant)
.cornerRadius(16)
.overlay(
  RoundedRectangle(cornerRadius: 16)
    .stroke(Color.warning, lineWidth: 1)
)
.frame(maxWidth: .infinity * 0.8, alignment: .leading)
.padding(.vertical, 4)
```

**Chat Integration:**
```swift
// In ChatTranscript (LazyVStack)
if let errorMessage {
  ErrorMessage(message: errorMessage)
}
```

---

## USAGE EXAMPLES

### Basic Usage

```tsx
<ErrorMessage
  message="I couldn't understand that. Try rephrasing your request."
  testID="parse-error"
/>
```

### Rate Limit Error

```tsx
<ErrorMessage
  message="You've reached the rate limit. Please upgrade your plan for more requests."
  testID="rate-limit-error"
/>
```

### Timeout Error

```tsx
<ErrorMessage
  message="Request timed out. Please try again."
  testID="timeout-error"
/>
```

---

## ACCESSIBILITY

**Accessibility Label:**
- `"Error: ${message}"`

**Accessibility Role:**
- `role = "alert"` on Android
- `.accessibilityAddTraits(.isStaticText)` on iOS

**Screen Reader:**
- VoiceOver reads: "Error, I couldn't understand that. Try rephrasing your request."

---

## ESCALATE

None. All required tokens and platform equivalents are available.

**Note:** The warning color token is mapped to Material's `error` color on both platforms for consistency with native design patterns.
