# SessionContextMenu - STYLE PROPERTIES MATRIX

**Component:** SessionContextMenu
**RN Source:** `react-native/components/ui/session-context-menu.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/Modal/Modal.js`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/session-context-menu.tsx` | Public API, modal positioning, menu item layout |
| Modal | `node_modules/react-native/Libraries/Components/Modal/Modal.js` | Modal overlay with backdrop |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Menu item press feedback |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Menu item icons (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Menu item typography |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Menu item icons (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Modal with backdrop (full-screen Pressable) and absolutely positioned menu container. Menu items rendered as vertical stack of Pressable rows with icon + text. Destructive items use error color for icon and text.

**Layout:** Modal with transparent overlay, absolutely positioned menu container (180px width), vertical stack of menu items (48px height each).

---

## STYLE PROPERTIES MATRIX

### Layout — Modal

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| visible | RN-wrapper | boolean prop | `androidx.compose.ui.window.Dialog(onDismissRequest = { !visible })` | `.sheet(isPresented: $visible)` | n/a |
| transparent | RN-wrapper | `true` | `DialogWindowProvider` with transparent background | `.presentationBackground(.ultraThinMaterial)` | n/a |
| animationType | RN-wrapper | `'fade'` | `AnimatedVisibility` with fadeIn/expandIn | `.transition(.opacity)` | n/a |

### Layout — Menu Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Box(modifier = Modifier.offset(...))` | `.position(x:, y:)` | n/a |
| width | RN-wrapper | `180` | `Modifier.width(180.dp)` | `.frame(width: 180)` | ESCALATE — propose `size.contextMenuWidth = 180` |
| borderRadius | RN-wrapper | `8` | `Modifier.clip(RoundedCornerShape(8.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 8))` | `radius.md` |
| backgroundColor | RN-wrapper | `theme.colors.surface` | `MaterialTheme.colorScheme.surface` | `Color(.systemBackground)` | `color.surface.default` |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clipToBounds()` | `.clipped()` | n/a |

### Layout — Menu Item

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| height | RN-wrapper | `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | ESCALATE — propose `size.touchTarget = 48` |
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| gap | RN-wrapper | `12` | `Arrangement.spacedBy(12.dp)` | `.spacing(12)` | `space.md` |
| borderBottomWidth | RN-wrapper | `StyleSheet.hairlineWidth` (except last) | `Divider(modifier = Modifier.height(1.dp))` | `.overlay(Rectangle().fill(.separator).frame(height: 0.5), alignment: .bottom)` | `borderWidth.thin` |

### Visual — Backdrop

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `'rgba(0, 0, 0, 0.3)'` | `Color.Black.copy(alpha = 0.3f)` | `Color.black.opacity(0.3)` | ESCALATE — propose `opacity.backdrop = 0.3` |

### Visual — Menu Item Press State

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| pressed | RN-wrapper | `'rgba(0, 0, 0, 0.05)'` | `indication = ripple()` | `.buttonStyle(.plain)` or `.pressEffect()` | ESCALATE — propose `opacity.pressed = 0.05` |

### Visual — Elevation

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| shadow (iOS) | RN-wrapper | `{ color: '#000', offset: { w: 0, h: 4 }, opacity: 0.15, radius: 8 }` | `Modifier.shadow(8.dp, ambient = 0.15f, spot = 0f)` | `.shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)` | `elevation[3]` |
| elevation (Android) | RN-wrapper | `8` | `Modifier.clickable(...).shadow(8.dp, ...)` | n/a | `elevation[3]` |

### Visual — Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `Modifier.size(20.dp)` | `.frame(width: 20, height: 20)` | `iconSize.md` |
| color (normal) | RN-wrapper | `theme.colors.onSurface` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| color (destructive) | RN-wrapper | `theme.colors.error` | `MaterialTheme.colorScheme.error` | `Color(.red)` | `color.error.default` |

### Typography — Menu Item Text

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `15` | `fontSize = 15.sp` | `.font(.system(size: 15))` | ESCALATE — propose `type.body.md.fontSize = 15` |
| color (normal) | RN-wrapper | `theme.colors.onSurface` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| color (destructive) | RN-wrapper | `theme.colors.error` | `MaterialTheme.colorScheme.error` | `Color(.red)` | `color.error.default` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress | RN-wrapper | callback prop | `Modifier.clickable { onPress() }` | `.onTapGesture { onPress() }` | n/a |
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |

---

## NOTES

- **Positioning logic:** Menu position calculated to stay within screen bounds using `Math.max/min` with safe area insets
- **Backdrop:** Full-screen Pressable with semi-transparent black overlay dismisses menu on tap
- **Menu width:** Fixed 180px width for consistency
- **Item height:** 48px minimum touch target for accessibility
- **Destructive items:** Use error color for both icon and text
- **Hairline divider:** Bottom border on all items except last (using `StyleSheet.hairlineWidth`)
- **Platform shadows:** iOS uses shadow props, Android uses elevation
- **Position calculation:** `menuLeft = max(insets.left + 8, min(position.x - MENU_WIDTH / 2, ...))`
- **Modal animation:** Fade animation for smooth appearance
