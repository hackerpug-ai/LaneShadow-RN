# RenameRouteDialog - STYLE PROPERTIES MATRIX

**Component:** RenameRouteDialog
**RN Source:** `react-native/components/ui/rename-route-dialog.tsx`
**Framework Primitives:** `node_modules/react-native-paper/src/components/Dialog/Dialog.js`, `node_modules/react-native-paper/src/components/TextInput/TextInput.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/rename-route-dialog.tsx` | Public API, layout, rename dialog with validation |
| Dialog | `react-native-paper` | Modal dialog container |
| TextInput | `react-native-paper` | Route name input field |
| Button | `react-native-paper` | Cancel and save actions |

---

## COMPOSITION

**Child atoms:**
- `Dialog` - Modal container (Paper component)
- `Dialog.Title` - Dialog title text
- `Dialog.Content` - Input field container
- `Dialog.Actions` - Action button container
- `TextInput` - Route name input (Paper component, outlined mode)
- `Button` - Cancel and save buttons (Paper component)

**Composition pattern:** Input dialog with title, text input field (auto-focused), and cancel/save actions with validation.

**Layout:** Vertical stack with title at top, input in middle, action buttons at bottom right.

---

## STYLE PROPERTIES MATRIX

### Visual — Dialog Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| text | RN-wrapper | `'Rename Route'` | n/a | n/a | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — TextInput

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| mode | RN-wrapper | `'outlined'` | `OutlinedTextField` | `.textFieldStyle(.roundedBorder)` | n/a |
| value | RN-wrapper | `name` (state) | `value = name` | `@State var name` | n/a |
| maxLength | RN-wrapper | `100` | `maxLines = 1` | `maxLength = 100` | n/a |
| autoFocus | RN-wrapper | `true` | `Modifier.focusRequester()` | `.focused()` | n/a |
| textColor | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| outlineColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| activeOutlineColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Visual — Cancel Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| text | RN-wrapper | `'Cancel'` | n/a | n/a | n/a |
| mode | RN-wrapper | `'text'` | `TextButton` | `.buttonStyle(.borderless)` | n/a |
| textColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Visual — Save Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| text | RN-wrapper | `'Save'` | n/a | n/a | n/a |
| mode | RN-wrapper | `'text'` | `TextButton` | `.buttonStyle(.borderless)` | n/a |
| textColor (enabled) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| textColor (disabled) | RN-wrapper | `semantic.color.onSurface.disabled` | `LaneShadowTheme.colors.onSurfaceDisabled` | `theme.colors.onSurfaceDisabled` | `color.onSurface.disabled` |
| disabled | RN-wrapper | `!canSave` | `enabled = canSave` | `.disabled(!canSave)` | n/a |

### State Management

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| name (state) | RN-wrapper | `useState(currentName)` | `var name by remember { mutableStateOf(currentName) }` | `@State var name = currentName` | n/a |
| trimmed | RN-wrapper | `name.trim()` | `name.trim()` | `name.trimmingCharacters(in: .whitespaces)` | n/a |
| canSave | RN-wrapper | `trimmed.length > 0 && trimmed !== currentName` | `trimmed.isNotEmpty() && trimmed != currentName` | `!trimmed.isEmpty && trimmed != currentName` | n/a |

---

## NOTES

- **Validation:** Save button disabled if name is empty or unchanged from current name
- **Auto-focus:** Input automatically focused when dialog opens for immediate editing
- **State synchronization:** Internal state resets to `currentName` when prop changes via `useEffect`
- **Trimmed validation:** Uses trimmed value for validation to prevent whitespace-only saves
- **Max length:** Route names limited to 100 characters
- **Primary cancel:** Cancel button uses primary color (not default onSurface) for visual hierarchy
- **Disabled state:** Save button shows disabled color when validation fails
- **Test IDs:** Includes testID prop with `-input`, `-cancel`, and `-save` suffixes
- **Portal wrapper:** Uses Paper's Portal for proper modal layering
- **Outlined input:** Uses outlined mode for clear visual boundary
- **Focus management:** Auto-focus ensures keyboard appears immediately on dialog open
