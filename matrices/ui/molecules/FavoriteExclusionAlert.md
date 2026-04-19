# FavoriteExclusionAlert - STYLE PROPERTIES MATRIX

**Component:** FavoriteExclusionAlert
**RN Source:** `react-native/components/ui/favorite-exclusion-alert.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/TouchableOpacity/TouchableOpacity.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/favorite-exclusion-alert.tsx` | Public API, alert layout, auto-dismiss logic |
| TouchableOpacity | `node_modules/react-native/Libraries/Components/TouchableOpacity/TouchableOpacity.js` | Dismissible container |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Info and close icons (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title and message typography |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Info icon (left), close icon (right) (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Horizontal row with info icon (left), text container (flex: 1, middle), and close button (right). Warning color scheme (warningContainer background, warning border, onWarningContainer text). Auto-dismisses after 10 seconds. Session-aware to prevent duplicate alerts.

**Layout:** TouchableOpacity container with horizontal flex layout. Text container has vertical gap between title and message.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| marginTop | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| marginBottom | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |
| padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `Modifier.clip(RoundedCornerShape(8.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 8))` | `radius.md` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(..., lineWidth: 1))` | `borderWidth.thin` |
| activeOpacity | RN-wrapper | `1` (no feedback on container tap) | `Modifier.clickable(...).interactionSource = remember { MutableInteractionSource() }` (no ripple) | `.buttonStyle(.plain)` or no effect | n/a |

### Layout — Content Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'flex-start'` | `verticalAlignment = Alignment.Top` | `.alignment(.top)` | n/a |

### Layout — Icon Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginRight | RN-wrapper | `12` | `Modifier.padding(end = 12.dp)` | `.padding(.trailing, 12)` | `space.md` |
| marginTop | RN-wrapper | `2` | `Modifier.padding(top = 2.dp)` | `.padding(.top, 2)` | ESCALATE — use `space.xs = 4` or keep magic number |

### Layout — Text Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| gap | RN-wrapper | `semantic.space.xs` = 4 | `Arrangement.spacedBy(4.dp)` inside Column | `.spacing(4)` | `space.xs` |

### Layout — Dismiss Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginLeft | RN-wrapper | `8` | `Modifier.padding(start = 8.dp)` | `.padding(.leading, 8)` | `space.sm` |
| marginTop | RN-wrapper | `2` | `Modifier.padding(top = 2.dp)` | `.padding(.top, 2)` | ESCALATE — use `space.xs = 4` or keep magic number |
| hitSlop | RN-wrapper | `{ top: 8, bottom: 8, left: 8, right: 8 }` | `Modifier.padding(8.dp).clickable(...)` (hitSlop in Compose) | `.padding(8)` | `space.sm` |

### Visual — Container Colors

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.warningContainer.default` | `MaterialTheme.colorScheme.tertiaryContainer` (or custom warning) | `Color(.systemYellow6)` (or custom) | `color.warningContainer.default` |
| borderColor | RN-wrapper | `semantic.color.warning.default` | `MaterialTheme.colorScheme.tertiary` (or custom warning) | `Color(.systemYellow)` (or custom) | `color.warning.default` |

### Visual — Icon Colors

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| info icon color | RN-wrapper | `semantic.color.onWarningContainer.default` | `MaterialTheme.colorScheme.onTertiaryContainer` | `Color(.yellow)` (contrast) | `color.onWarningContainer.default` |
| close icon color | RN-wrapper | `semantic.color.onWarningContainer.default` | Same as above | Same as above | `color.onWarningContainer.default` |
| info icon size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | `iconSize.md` |
| close icon size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | `iconSize.md` |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'titleSmall'` | `MaterialTheme.typography.titleSmall` | `.font(.system(size: 14, weight: .semibold))` | ESCALATE — map to `type.label.lg` |
| color | RN-wrapper | `semantic.color.onWarningContainer.default` | `MaterialTheme.colorScheme.onTertiaryContainer` | `Color(.yellow)` (contrast) | `color.onWarningContainer.default` |
| fontWeight | RN-wrapper | `'600'` | `fontWeight = FontWeight.SemiBold` | `.fontWeight(.semibold)` | ESCALATE — propose `type.label.lg.fontWeight = 600` |

### Typography — Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodyMedium'` | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14))` | `type.body.md` |
| color | RN-wrapper | `semantic.color.onWarningContainer.default` | `MaterialTheme.colorScheme.onTertiaryContainer` | `Color(.yellow)` (contrast) | `color.onWarningContainer.default` |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress (container) | RN-wrapper | `handleDismiss` | `Modifier.clickable { handleDismiss() }` | `.onTapGesture { handleDismiss() }` | n/a |
| onPress (dismiss button) | RN-wrapper | `handleDismiss` | Same as above | Same as above | n/a |
| accessibilityRole | RN-wrapper | `'alert'` | `Modifier.semantics { role = Role.Alert }` | `.accessibilityAddTraits(.isStaticText)` (alert role implied) | n/a |
| accessibilityLabel | RN-wrapper | Full message with favorites list | `contentDescription = "..."` | `.accessibilityLabel("...")` | n/a |

### Behavior — Auto-Dismiss

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| timeout | RN-wrapper | `10000` (10 seconds) | `LaunchedEffect(Unit) { delay(10000) ... }` | `DispatchQueue.main.asyncAfter(deadline: .now() + 10) { ... }` | ESCALATE — propose `timing.autoDismissMs = 10000` |
| session awareness | RN-wrapper | Track shown session keys | `remember { mutableSetOf<String>() }` | `@State var shownSessions: Set<String> = []` | n/a |

### Formatting — Favorites List

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| MAX_VISIBLE_NAMES | RN-wrapper | `3` | `const val MAX_VISIBLE_NAMES = 3` | `let MAX_VISIBLE_NAMES = 3` | n/a |
| format (≤3) | RN-wrapper | `"name1, name2, name3"` | `names.joinToString(", ")` | `names.joined(separator: ", ")` | n/a |
| format (>3) | RN-wrapper | `"name1, name2, name3 and N more"` | `${visible.joinToString(", ")} and $remaining more` | `${visible.joined(separator: ", ")} and \(remaining) more` | n/a |
| format (none) | RN-wrapper | `"some favorites"` | `"some favorites"` | `"some favorites"` | n/a |

---

## NOTES

- **Warning color scheme:** Uses warningContainer background, warning border, onWarningContainer for text/icons
- **Auto-dismiss:** 10 second timer that dismisses alert and calls onDismiss callback
- **Session awareness:** Tracks session keys to prevent showing same exclusion twice
- **Dismiss on tap:** Entire container is tappable (activeOpacity: 1 for no visual feedback)
- **Close button:** Separate TouchableOpacity with 8px hitSlop for easier tapping
- **Favorites list formatting:** Shows first 3 names, then "and N more" for remaining
- **Accessibility:** Full message exposed in accessibilityLabel, including all favorites
- **Icon names:** "information" (left), "close" (right)
- **Icon size:** 20px for both icons
- **Spacing:** 12px margin horizontal, 8px margin top, 12px margin bottom, 12px padding
- **Border:** 1px warning color border
- **Text gap:** 4px gap between title and message
- **Empty state:** Returns null if not visible or if includeFavorites is false or no exclusions
