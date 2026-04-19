# Banner - STYLE PROPERTIES MATRIX

**Component:** Banner
**RN Source:** `react-native/components/ui/banner.tsx`
**Framework Primitives:** `node_modules/react-native-paper/src/components/Banner.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/banner.tsx` | Public API, visibility control, theme styling |
| Paper Banner | `node_modules/react-native-paper/src/components/Banner.tsx` | Banner layout, actions, icon rendering |

---

## COMPOSITION

**Child atoms:** None (Paper Banner composes its own content)

**Composition pattern:** Thin wrapper around React Native Paper Banner. Applies semantic theme colors for warning background. Paper Banner handles internal layout of icon, message, and actions.

**Layout:** Paper Banner default layout (row with icon + message + actions).

---

## STYLE PROPERTIES MATRIX

### Layout — Container (Paper Banner)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | Paper | `'row'` (default) | `Row(...)` | `HStack` | n/a |
| alignItems | Paper | `'center'` (contentStyle) | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |

### Layout — Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |

### Visual — Background

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${semantic.color.warning.default}33` (20% opacity) | `LaneShadowTheme.colors.warning.copy(alpha = 0.2f)` | `theme.colors.warning.opacity(0.2)` | `color.warning.default` + `opacity.subtle = 0.2` |

### Visual — Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| message | RN-wrapper | prop value | `text = message` | `Text(message)` | n/a |
| icon | RN-wrapper | prop value (optional) | `icon = { icon }` | `icon = icon` | n/a |
| actions | RN-wrapper | prop value (array) | `actions = actions` | `actions = actions` | n/a |

### Interaction — Actions

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| actions[].label | RN-wrapper | string | `label = "..."` | `label = "..."` | n/a |
| actions[].onPress | RN-wrapper | callback | `onClick = { ... }` | `onTap = { ... }` | n/a |

### Visibility

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| visible | RN-wrapper | prop boolean | `if (visible) { ... }` | `if visible { ... }` | n/a |

---

## NOTES

- **Paper component:** Banner is a thin wrapper around React Native Paper's Banner component
- **Warning styling:** Uses warning color with 20% opacity for background
- **Conditional rendering:** Returns null when `visible` is false
- **Actions:** Paper Banner handles action buttons; passed via `actions` prop array
- **Icon:** Optional icon prop passed to Paper Banner
- **Use cases:** Warning messages, alerts, announcements, system notifications
- **Platform parity:** On Android, use Material Design Banner; on iOS, replicate layout with custom implementation or third-party library
