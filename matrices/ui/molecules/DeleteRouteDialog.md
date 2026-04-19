# DeleteRouteDialog - STYLE PROPERTIES MATRIX

**Component:** DeleteRouteDialog
**RN Source:** `react-native/components/ui/delete-route-dialog.tsx`
**Framework Primitives:** `node_modules/react-native-paper/src/components/Dialog/Dialog.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/delete-route-dialog.tsx` | Public API, layout, confirmation dialog |
| Dialog | `react-native-paper` | Modal dialog container |
| Button | `react-native-paper` | Cancel and confirm actions |
| Text | `react-native-paper` | Title and message text |

---

## COMPOSITION

**Child atoms:**
- `Dialog` - Modal container (Paper component)
- `Dialog.Title` - Dialog title text
- `Dialog.Content` - Dialog message content
- `Dialog.Actions` - Action button container
- `Button` - Cancel and confirm buttons (Paper component)
- `Text` - Message text

**Composition pattern:** Confirmation dialog with title, message (includes route name + undo hint), and cancel/confirm actions.

**Layout:** Vertical stack with title at top, message in middle, action buttons at bottom right.

---

## STYLE PROPERTIES MATRIX

### Visual — Dialog Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| text | RN-wrapper | `'Delete Route'` | n/a | n/a | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| text | RN-wrapper | `` `Are you sure you want to delete "${routeName}"? You can undo this within 5 seconds.` `` | n/a | n/a | n/a (dynamic) |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Cancel Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| text | RN-wrapper | `'Cancel'` | n/a | n/a | n/a |
| mode | RN-wrapper | `'text'` | `TextButton` | `.buttonStyle(.borderless)` | n/a |
| textColor | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Visual — Confirm Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| text | RN-wrapper | `'Delete'` | n/a | n/a | n/a |
| mode | RN-wrapper | `'text'` | `TextButton` | `.buttonStyle(.borderless)` | n/a |
| textColor | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

---

## NOTES

- **Destructive action:** Confirm button uses danger color to indicate destructive action
- **Undo hint:** Message includes "You can undo this within 5 seconds" to inform user of undo capability
- **Dynamic messaging:** Message includes route name via template literal
- **Text buttons:** Uses text mode buttons (not outlined/contained) for dialog actions per Material Design guidelines
- **Standard pattern:** Follows confirmation dialog pattern: clear question, specific item name, cancel/delete actions, undo hint
- **Callback pattern:** Separate `onConfirm` and `onDismiss` callbacks for clear action handling
- **Test IDs:** Includes testID prop with `-cancel` and `-confirm` suffixes for action buttons
- **Portal wrapper:** Uses Paper's Portal for proper modal layering
- **Undo support:** Designed to work with undo toast/snackbar that appears after confirmation
