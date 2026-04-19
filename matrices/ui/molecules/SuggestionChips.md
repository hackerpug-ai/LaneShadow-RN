# SuggestionChips - STYLE PROPERTIES MATRIX

**Component:** SuggestionChips
**RN Source:** `react-native/components/ui/suggestion-chips.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js`, `node_modules/react-native/Libraries/Components/Pressable/Pressable.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|
| RN Wrapper | `react-native/components/ui/suggestion-chips.tsx` | Public API, layout variants (horizontal/vertical) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Typography |

---

## COMPOSITION

**Child atoms:** None (uses Text component directly)

**Composition pattern:** ScrollView or View container with row of Pressable chips. Each chip contains optional emoji icon + text label.

**Layout:** Horizontal row with 8px gap, either scrollable (horizontal) or wrapping (vertical).

---

## STYLE PROPERTIES MATRIX

### Layout — Container (Both Variants)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | RN-wrapper | `12` | `Modifier.padding(vertical = 12.dp)` | `.padding(.vertical, 12)` | `space.md` |
| gap | RN-wrapper | `8` | `Modifier.padding(end = 8.dp)` between items | `Spacer(minLength: 8)` | `space.sm` |

### Visual — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surface.default` | `LaneShadowTheme.colors.surface` | `theme.colors.surface` | `color.surface.default` |

### Layout — Chip

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| paddingHorizontal | RN-wrapper | `14` | `Modifier.padding(horizontal = 14.dp)` | `.padding(.horizontal, 14)` | ESCALATE — propose `space.md + 2 = 14` |
| paddingVertical | RN-wrapper | `8` | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |
| borderRadius | RN-wrapper | `20` | `RoundedCornerShape(20.dp)` | `RoundedRectangle(cornerRadius: 20)` | ESCALATE — propose `radius.pill = 20` |
| gap | RN-wrapper | `6` | `Modifier.padding(end = 6.dp)` between items | `Spacer(minLength: 6)` | ESCALATE — propose `space.xs + 2 = 6` |
| borderWidth | RN-wrapper | `1` | `Modifier.border(1.dp, ...)` | `.overlay(RoundedRectangle(...).stroke(..., lineWidth: 1))` | `borderWidth.thin` |
| minHeight | RN-wrapper | `36` | `Modifier.heightIn(min = 36.dp)` | `.frame(minHeight: 36)` | ESCALATE — propose `touchTarget.min - 8 = 36` |

### Visual — Chip (by state)

| State | Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|---|
| default | backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| pressed | backgroundColor | RN-wrapper | `semantic.color.primary.pressed` | `LaneShadowTheme.colors.primaryPressed` | `theme.colors.primaryPressed` | `color.primary.pressed` |
| default | borderColor | RN-wrapper | `semantic.color.border.default` | `LaneShadowTheme.colors.border` | `theme.colors.border` | `color.border.default` |
| disabled | opacity | RN-wrapper | `0.5` | `Modifier.alpha(0.5f)` | `.opacity(0.5)` | `opacity.disabled = 0.5` |

### Typography — Chip Icon (Emoji)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.label.md.fontSize` |
| color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

### Typography — Chip Text

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| fontSize | RN-wrapper | `14` | `14.sp` | `14` | `type.label.md.fontSize` |
| fontWeight | RN-wrapper | `'600'` (semibold) | `FontWeight.SemiBold` | `.semibold` | `type.label.md.fontWeight` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### ScrollView Props (Horizontal Variant)

| Property | Source | Value | Android | iOS | Token |
|---|---|---|---|---|---|---|
| horizontal | RN-wrapper | `true` | `horizontalScrollingEnabled = true` | `.horizontal(...)` | n/a |
| showsHorizontalScrollIndicator | RN-wrapper | `false` | `horizontalScrollBarEnabled = false` | `.scrollIndicators(.hidden)` | n/a |

### Interaction

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| onPress | RN-wrapper | callback prop | `Modifier.clickable { onPress() }` | `.onTapGesture { onPress() }` | n/a |
| accessibilityRole | RN-wrapper | `'button'` | `Modifier.semantics { role = Role.Button }` | `.accessibilityAddTraits(.isButton)` | n/a |
| accessibilityLabel | RN-wrapper | `suggestion.label` | `contentDescription = label` | `.accessibilityLabel(label)` | n/a |
| disabled | RN-wrapper | prop disables Pressable | `Modifier.clickable(enabled = false)` | `.disabled(!disabled)` | n/a |

---

## NOTES

- **Two layout variants:** Horizontal (scrollable) or vertical (wrapping)
- **Container:** 16px horizontal, 12px vertical padding, surface background
- **Chip shape:** Pill shape with 20px border radius
- **Chip padding:** 14px horizontal, 8px vertical
- **Gap:** 8px between chips, 6px between icon and text
- **Border:** 1px border on chips
- **Min height:** 36px for touch target (slightly under 44px standard)
- **Press state:** Primary pressed background color
- **Disabled state:** 0.5 opacity
- **Icon:** Optional emoji icon, 14sp, primary color
- **Text:** 14sp semibold weight, onSurface.muted color
- **Horizontal scroll:** No scroll indicator
- **Touch feedback:** Full chip pressable
- **Accessibility:** Button role, label from suggestion text
