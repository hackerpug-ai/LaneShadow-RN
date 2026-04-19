# PermissionNotification - STYLE PROPERTIES MATRIX

**Component:** PermissionNotification
**RN Source:** `react-native/components/ui/permission-notification.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/permission-notification.tsx` | Public API, safe area handling, action button |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Alert icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |
| SafeAreaInsets | `react-native-safe-area-context` | Top safe area inset for positioning |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Alert circle icon (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Vertical column with header (icon + title row), description, optional action button. Top margin includes safe area inset.

**Layout:** Column layout with gaps between sections.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| borderRadius | RN-wrapper | `semantic.radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| marginTop | RN-wrapper | `insets.top + semantic.space.sm` | `WindowInsets.statusBars.asPaddingValues()` + `Modifier.padding(top = 8.dp)` | `.padding(.top, insets.top + 8)` | `space.sm` + safe area |
| marginHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| gap | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(end = 4.dp)` between items | `Spacer(minLength: 4)` | `space.xs` |

### Visual — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.warning.default` | `LaneShadowTheme.colors.warning` | `theme.colors.warning` | `color.warning.default` |
| shadowColor | RN-wrapper | `'#000000'` | `shadowColor = Color.Black` | `.shadow(...)` | n/a |
| shadowOffset | RN-wrapper | `{ width: 0, height: 4 }` | `offset = androidx.compose.ui.unit.Offset(0.dp, 4.dp)` | `.offset(x: 0, y: 4)` | n/a |
| shadowOpacity | RN-wrapper | `0.15` | `alpha = 0.15f` (in shadow) | `.opacity(0.15)` | `opacity.shadow = 0.15` |
| shadowRadius | RN-wrapper | `8` | `blurRadius = 8.dp` | `.radius(8)` | `shadow.radius.md = 8` |
| elevation | RN-wrapper | `4` | `Modifier.shadow(elevation = 4.dp)` | (via shadow props) | `elevation.4` |

### Layout — Header Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(end = 8.dp)` between items | `Spacer(minLength: 8)` | `space.sm` |

### Visual — Alert Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `20` | `20.dp` | `20` | ESCALATE — propose `iconSize.actionButton = 20` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| name | RN-wrapper | `'alert-circle'` | `Icons.Outlined.Warning` | SF Symbol: `exclamationmark.circle.triangle.fill` | n/a |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `titleSmall` | `MaterialTheme.typography.titleSmall` → map to LaneShadow | `.font(.system(size: 14, weight: .semibold))` | `type.title.sm` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |

### Typography — Description

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodySmall` | `MaterialTheme.typography.bodySmall` → map to LaneShadow | `.font(.system(size: 12, weight: .regular))` | ESCALATE — verify `type.body.sm` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |

### Layout — Action Button (Optional)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | n/a | n/a |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| padding | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(8.dp)` | `.padding(8)` | `space.sm` |
| marginTop | RN-wrapper | `semantic.space.xs` = 4 | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` |

### Visual — Action Button (by state)

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `${color.onPrimary.default}20` (12.5% opacity) | `LaneShadowTheme.colors.onPrimary.copy(alpha = 0.125f)` | `theme.colors.onPrimary.opacity(0.125)` | `color.onPrimary.default` + `opacity.container = 0.125` |
| pressed | backgroundColor | RN-wrapper | `${color.onPrimary.default}30` (18.75% opacity) | `LaneShadowTheme.colors.onPrimary.copy(alpha = 0.1875f)` | `theme.colors.onPrimary.opacity(0.1875)` | `color.onPrimary.default` + `opacity.pressed = 0.1875` |

### Typography — Action Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `labelMedium` | `MaterialTheme.typography.labelMedium` → map to LaneShadow | `.font(.system(size: 14, weight: .medium))` | `type.label.md` |
| color | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | ESCALATE — verify weight |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| actionButton | stopPropagation | RN-wrapper | `e.stopPropagation()` on press/pressIn | `Modifier.pointerInput(Unit) { detectTapGestures { } }` | `.simultaneousGesture(...)` | n/a |
| dismiss | preventDismissOnTap | RN-wrapper | prop controls TouchableWithoutFeedback wrapper | n/a | n/a | n/a |

---

## NOTES

- **Warning color:** Uses warning background (#D98E04) with onPrimary text (#0E0F11)
- **Safe area:** Top margin = safe area inset + 8px for notch/status bar clearance
- **Margins:** 12px horizontal margins, 12px internal padding
- **Elevation:** 4 (shadow with 15% opacity, 8px radius, 4px offset)
- **Gaps:** 8px between header elements, 4px between sections
- **Icon:** 20px alert circle icon
- **Action button:** Optional, 12.5% opacity background (18.75% when pressed)
- **Event handling:** Action button stops propagation to prevent notification dismissal
- **Prevent dismiss:** Optional prop to make notification non-dismissible via tap
- **Typography:** titleSmall (title), bodySmall (description), labelMedium (action button)
- **Flexible title:** Title uses flex: 1 to fill header row width
- **Border radius:** 16px container, 8px action button
