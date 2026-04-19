# PlanningErrorSheet - STYLE PROPERTIES MATRIX

**Component:** PlanningErrorSheet
**RN Source:** `react-native/components/sheets/planning-error-sheet.tsx`
**Framework Primitives:** `react-native/components/sheets/bottom-sheet-wrapper.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/planning-error-sheet.tsx` | Public API, error sheet layout |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Bottom sheet container (see `matrices/ui/templates/BottomSheetWrapper.md`) |
| Button | `react-native/components/ui/button.tsx` | "Try again" and "Back" buttons (see `matrices/ui/atoms/Button.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title and error message typography |

---

## COMPOSITION

**Child atoms/molecules:**
- `Button` - "Try again" (default), "Back" (outline) (see `matrices/ui/atoms/Button.md`)

**Composition pattern:** Vertical column with header section (title + error message) and actions section (two buttons stacked). Uses BottomSheetWrapper with "content" preset. Left-aligned header, stacked action buttons.

**Layout:** Vertical flex column with gap spacing. Header left-aligned, buttons stacked vertically.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` inside Column | `.spacing(12)` | `space.md` |

### Layout — Header

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'flex-start'` | `horizontalAlignment = Alignment.Start` | `.alignment(.leading)` or default | n/a |
| gap | RN-wrapper | `semantic.space.xs` = 4 | `Arrangement.spacedBy(4.dp)` inside Column | `.spacing(4)` | `space.xs` |

### Layout — Actions

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'titleMedium'` | `MaterialTheme.typography.titleMedium` | `.font(.system(size: 16, weight: .semibold))` | ESCALATE — map to `type.heading.sm` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| text | RN-wrapper | `'Couldn't plan route'` | `Text("Couldn't plan route")` | `Text("Couldn't plan route")` | n/a |

### Typography — Error Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodyMedium'` | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14))` | `type.body.md` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |
| text | RN-wrapper | `message` prop | `Text(message)` | `Text(message)` | n/a |

### Button — "Try again"

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'default'` | `ButtonDefaults.buttonColors(...)` | `.buttonStyle(.borderedProminent)` | `buttonVariant.default` |
| size | RN-wrapper | `'lg'` | `ContentPadding.Large` | `.controlSize(.large)` | `buttonSize.lg` |
| text | RN-wrapper | `'Try again'` | `Text("Try again")` | `Text("Try again")` | n/a |
| onPress | RN-wrapper | `onTryAgain` prop | `onClick = { onTryAgain }` | `.onTapGesture { onTryAgain() }` | n/a |

### Button — "Back"

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'outline'` | `OutlinedButton` or `ButtonDefaults.outlinedButtonColors` | `.buttonStyle(.bordered)` | `buttonVariant.outline` |
| size | RN-wrapper | `'lg'` | `ContentPadding.Large` | `.controlSize(.large)` | `buttonSize.lg` |
| text | RN-wrapper | `'Back'` | `Text("Back")` | `Text("Back")` | n/a |
| onPress | RN-wrapper | `onBack` prop | `onClick = { onBack }` | `.onTapGesture { onBack() }` | n/a |

### Sheet Configuration

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| preset | RN-wrapper | `'content'` | Custom BottomSheet state | `.presentationDetents([.medium])` or similar | n/a |
| onClose | RN-wrapper | `onClose` prop | `onDismissRequest = { onClose }` | `.dismiss` on environment | n/a |

---

## NOTES

- **Bottom sheet:** Uses BottomSheetWrapper with "content" preset
- **Two buttons:** "Try again" (default variant, primary action) and "Back" (outline variant, secondary action)
- **Stacked layout:** Buttons stacked vertically with 8px gap
- **Left-aligned header:** Title and error message left-aligned
- **Error message:** Dynamic content from `message` prop
- **Spacing:** 12px gap between header and actions, 4px gap between title and message, 8px gap between buttons
- **Typography:** titleMedium for title, bodyMedium for message
- **Centered content:** Container uses justifyContent: 'center' to vertically center content
- **Flex layout:** Container uses flex: 1 to fill available space
