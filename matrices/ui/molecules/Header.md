# Header - STYLE PROPERTIES MATRIX

**Component:** Header
**RN Source:** `react-native/components/layouts/header.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/layouts/header.tsx` | Public API, app header with menu button |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Menu icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Pressable | `node_modules/react-native/Libraries/Components/Pressable/Pressable.js` | Menu button touch handling |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Menu icon (see `matrices/ui/atoms/IconSymbol.md`)
- `Pressable` - Menu button container
- `View` - Header container, title container, spacer
- `Text` - Title text

**Composition pattern:** Horizontal row with menu button (left), centered title, and spacer (right) for balance.

**Layout:** Row container, 60px height, space-between layout.

---

## STYLE PROPERTIES MATRIX

### Layout — Header Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | RN-wrapper | `'space-between'` | `horizontalArrangement = Arrangement.SpaceBetween` | `.frame(maxWidth: .infinity)` | n/a |
| height | RN-wrapper | `60` | `60.dp` | `60` | ESCALATE — custom height |
| borderBottomWidth | RN-wrapper | `1` | `1.dp` | `1` | n/a |

### Visual — Header Background

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| borderBottomColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` | `LaneShadowTheme.spacing.large` | `.padding(.horizontal, 16)` | `space.lg` (16) |
| paddingVertical | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.vertical, 8)` | `space.sm` (8) |

### Layout — Menu Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `44` | `44.dp` | `44` | ESCALATE — touch target (44pt) |
| height | RN-wrapper | `44` | `44.dp` | `44` | ESCALATE — touch target (44pt) |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Visual — Menu Button Background

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor (default) | RN-wrapper | `'transparent'` | `Color.Transparent` | `.clear` | n/a |
| backgroundColor (pressed) | RN-wrapper | `semantic.color.surface.pressed` | `LaneShadowTheme.colors.surfacePressed` | `theme.colors.surfacePressed` | `color.surface.pressed` |
| borderRadius | RN-wrapper | `semantic.radius.full` | `CircleShape` | `.cornerRadius(9999)` | `radius.full` |
| padding | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(8)` | `space.sm` (8) |

### Visual — Menu Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| name | RN-wrapper | `'menu'` | `Icons.Outlined.Menu` | `SF Symbol: "line.3.horizontal"` | n/a |
| size | RN-wrapper | `24` | `24.dp` | `24` | ESCALATE — standard icon size |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Title Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'titleLarge'` (Paper) | `LaneShadowTheme.typography.titleLarge` | `Font.title2` | `type.title.lg` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Header Right Spacer

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `44` | `44.dp` | `44` | ESCALATE — balances menu button (44pt) |

---

## NOTES

- **Teacher/parent header:** Generic header component for teacher and parent role screens
- **Menu button:** 44pt touch target for accessibility compliance
- **Centered title:** Title centered with flex container, spacer balances menu button
- **Pressed state:** Menu button shows surface pressed color on press
- **Border bottom:** 1px border for visual separation from content
- **Fixed height:** 60px header height for consistency
- **Responsive padding:** Uses semantic spacing tokens (lg horizontal, sm vertical)
- **Full border radius:** Menu button uses full border radius for circular touch target
- **Paper typography:** Uses Paper's `titleLarge` variant (titleLarge maps to semantic type.title.lg)
