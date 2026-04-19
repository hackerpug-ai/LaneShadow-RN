# SaveFavoriteSheet - STYLE PROPERTIES MATRIX

**Component:** SaveFavoriteSheet (aka SaveRouteSheet)
**RN Source:** `react-native/components/ui/save-favorite-sheet.tsx`
**Framework Primitives:** `react-native-paper Dialog`, `BottomActionSheet`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/save-favorite-sheet.tsx` | Public API, save route bottom sheet |
| BottomActionSheet | `react-native/components/ui/bottom-action-sheet.tsx` | Bottom sheet container with Gorhom |
| BottomSheetInput | `react-native/components/ui/bottom-sheet-input.tsx` | Text input with Gorhom keyboard handling |
| Button | `react-native/components/ui/button.tsx` | Save and cancel buttons (see `matrices/ui/atoms/Button.md`) |

---

## COMPOSITION

**Child atoms:**
- `BottomActionSheet` - Sheet container
- `BottomSheetInput` - Route name input
- `Button` - Save and cancel buttons (see `matrices/ui/atoms/Button.md`)
- `View` - Content container, button container
- `Text` - Title, caption, character count, error message

**Composition pattern:** Bottom sheet with title, caption, name input (auto-focused), character count, error message, and action buttons.

**Layout:** Vertical stack with 16px gap. Full-width buttons at bottom.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |

### Layout — Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| padding | RN-wrapper | `16` | `16.dp` | `16` | ESCALATE — between `space.md` (12) and `space.lg` (16) |
| gap | RN-wrapper | `16` | `16.dp` | `16` | ESCALATE — between `space.md` (12) and `space.lg` (16) |
| paddingBottom | RN-wrapper | `32` | `32.dp` | `32` | `space.2xl` (32) |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'headlineSmall'` (Paper) | `LaneShadowTheme.typography.headlineSmall` | `Font.title3` | `type.heading.sm` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| marginBottom | RN-wrapper | `4` | `4.dp` | `4` | `space.xs` (4) |

### Typography — Caption

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodyMedium'` (Paper) | `LaneShadowTheme.typography.bodyMedium` | `Font.body` | `type.body.md` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| marginBottom | RN-wrapper | `8` | `8.dp` | `8` | `space.sm` (8) |

### Visual — Input

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| autoFocus | RN-wrapper | `true` | `Modifier.focusRequester(...)` | `.focused()` | n/a |
| maxLength | RN-wrapper | `100` | `maxLines = 1` | `maxLength = 100` | n/a |
| error | RN-wrapper | `!!error` | `isError = error != null` | `error != nil` | n/a |

### Typography — Character Count

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodySmall'` (Paper) | `LaneShadowTheme.typography.bodySmall` | `Font.footnote` | `type.body.sm` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Typography — Error Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodySmall'` (Paper) | `LaneShadowTheme.typography.bodySmall` | `Font.footnote` | `type.body.sm` |
| color | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| marginTop | RN-wrapper | `-8` | `-8.dp` | `-8` | ESCALATE — negative margin |
| marginBottom | RN-wrapper | `8` | `8.dp` | `8` | `space.sm` (8) |

### Layout — Button Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginTop | RN-wrapper | `8` | `8.dp` | `8` | `space.sm` (8) |
| gap | RN-wrapper | `12` | `12.dp` | `12` | `space.md` (12) |

### Visual — Save Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `'lg'` | `ButtonSize.Large` | `.buttonSize(.large)` | `size.lg` |
| disabled | RN-wrapper | `isSaving || !name.trim()` | `enabled = !isSaving && name.isNotBlank()` | `!isSaving && !name.isEmpty` | n/a |
| loading | RN-wrapper | `isSaving` | `isLoading = isSaving` | `isSaving` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

### Visual — Cancel Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'outline'` | `ButtonVariant.Outline` | `.buttonStyle(.bordered)` | `variant.outline` |
| disabled | RN-wrapper | `isSaving` | `enabled = !isSaving` | `!isSaving` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

---

## NOTES

- **Validation:** Empty name shows "Please enter a name", >100 chars shows "Name must be 100 characters or less"
- **Auto-focus:** Input automatically focused when sheet opens
- **Character count:** Shows "X/100 characters" below input
- **Error display:** Error message appears below character count (negative margin for tight spacing)
- **Save button:** Disabled while saving or if name is empty/whitespace
- **Loading state:** Save button shows loading spinner while saving
- **Mutation:** Calls `api.db.savedRoutes.saveRoute` with route data payload
- **Error handling:** Catches mutation errors and shows "Failed to save route. Please try again."
- **Success flow:** Calls `onSuccess()` callback and closes sheet on successful save
- **Cancel flow:** Calls `onCancel()` callback and closes sheet
- **Suggested name:** Pre-fills input with `routeData.suggestedName` if provided
- **Sheet snap points:** 60% and 90% heights
- **Keyboard handling:** Uses `BottomSheetInput` with `hasTextInput={true}` for proper Gorhom keyboard behavior
- **Backwards compatibility:** Exported as both `SaveRouteSheet` and `SaveFavoriteSheet`
- **Payload builder:** `buildSaveRoutePayload()` function creates save payload with trimmed name
- **Form reset:** Clears name and error when sheet opens
