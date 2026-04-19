# AppHeader - STYLE PROPERTIES MATRIX

**Component:** AppHeader
**RN Source:** `react-native/components/ui/app-header.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/app-header.tsx` | Public API, layout, glass-morphic styling |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Header action icons (see `matrices/ui/atoms/IconSymbol.md`) |
| Avatar | `react-native/components/ui/avatar.tsx` | User avatar in right slot (see `matrices/ui/atoms/Avatar.md`) |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Press feedback for icon buttons |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title typography |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Left/right action icons (back, menu, settings, etc.) (see `matrices/ui/atoms/IconSymbol.md`)
- `Avatar` - User profile avatar in right slot (see `matrices/ui/atoms/Avatar.md`)

**Composition pattern:** Three-section row layout (left | title | right). Left and right sections have fixed minimum width (44px), title fills remaining space (flex: 1). Slots accept custom content via `leftContent`/`rightContent` props or render icon/avatar from props.

**Layout:** Horizontal row (`flexDirection: 'row'`), space-between alignment, fixed height.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | n/a | n/a |
| height | RN-wrapper | `60` | `Modifier.height(60.dp)` | `.frame(height: 60)` | ESCALATE — propose `size.headerHeight = 60` |
| padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |

### Layout — Left Section

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| minWidth | RN-wrapper | `44` | `Modifier.minWidth(44.dp)` or `Modifier.width(44.dp)` | `.frame(minWidth: 44)` | ESCALATE — propose `touchTarget.min = 44` |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Layout — Right Section

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| minWidth | RN-wrapper | `44` | `Modifier.minWidth(44.dp)` or `Modifier.width(44.dp)` | `.frame(minWidth: 44)` | `touchTarget.min` |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| alignItems | RN-wrapper | `'flex-end'` | `horizontalArrangement = Arrangement.End` | n/a | n/a |

### Layout — Title Section

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

### Layout — Icon Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `44` | `Modifier.width(44.dp)` | `.frame(width: 44)` | `touchTarget.min` |
| height | RN-wrapper | `44` | `Modifier.height(44.dp)` | `.frame(height: 44)` | `touchTarget.min` |
| padding | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | n/a | n/a |

### Visual — Background

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${semantic.color.background.default}CC` (80% opacity) | `LaneShadowTheme.colors.background.copy(alpha = 0.8f)` | `theme.colors.background.opacity(0.8)` | `color.background.default` + `opacity.glass = 0.8` |
| borderBottomWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` (bottom only) | `.overlay(Rectangle().fill(...).frame(height: 1), alignment: .bottom)` | `borderWidth.thin` |
| borderBottomColor | RN-wrapper | `${semantic.color.primary.default}33` (20% opacity) | `LaneShadowTheme.colors.primary.copy(alpha = 0.2f)` | `theme.colors.primary.opacity(0.2)` | `color.primary.default` + `opacity.subtle = 0.2` |

### Visual — Icon Button Press State

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| pressed | RN-wrapper | `semantic.color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |

### Visual — Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `24` | `Modifier.size(24.dp)` | `.frame(width: 24, height: 24)` | ESCALATE — propose `iconSize.lg = 24` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| type | RN-wrapper | `semantic.type.heading.md` | `MaterialTheme.typography.titleMedium` → map to LaneShadow | `.font(.system(size: 20, weight: .semibold))` | `type.heading.md` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress (icon buttons) | RN-wrapper | callback prop | `Modifier.clickable { onPress() }` | `.onTapGesture { onPress() }` | n/a |
| onPress (avatar) | RN-wrapper | callback prop | `Modifier.clickable { onPress() }` | `.onTapGesture { onPress() }` | n/a |
| accessibilityRole | RN-wrapper | `'button'` (for Pressable wrappers) | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |

---

## NOTES

- **Glass-morphic effect:** Background uses 80% opacity background color with 20% opacity primary border for translucent glass effect
- **Three-slot layout:** Left (icon/back), center (title, flex: 1), right (icon/avatar/content)
- **Placeholder views:** 44×44px empty views maintain spacing when no content provided
- **Touch targets:** All interactive elements use 44px minimum size for accessibility
- **Icon sizing:** 24px icons for header actions
- **Title typography:** Uses `heading.md` scale for subpage titles
- **Content slots:** `leftContent` and `rightContent` props allow custom React nodes instead of icons/avatar
- **Avatar integration:** Right slot can render Avatar component with imageUri or initials
