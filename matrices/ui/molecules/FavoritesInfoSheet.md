# FavoritesInfoSheet - STYLE PROPERTIES MATRIX

**Component:** FavoritesInfoSheet
**RN Source:** `react-native/components/sheets/favorites-info-sheet.tsx`
**Framework Primitives:** `react-native/components/ui/bottom-action-sheet.tsx`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/favorites-info-sheet.tsx` | Public API, sheet layout, favorites list |
| BottomActionSheet | `react-native/components/ui/bottom-action-sheet.tsx` | Bottom sheet container (see `matrices/ui/templates/BottomActionSheet.md`) |
| Button | `react-native/components/ui/button.tsx` | "Got it" close button (see `matrices/ui/atoms/Button.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Info icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title, message, list, guidance typography |

---

## COMPOSITION

**Child atoms/molecules:**
- `IconSymbol` - Info icon (see `matrices/ui/atoms/IconSymbol.md`)
- `Button` - "Got it" close button (see `matrices/ui/atoms/Button.md`)

**Composition pattern:** Vertical column with info icon (centered, 15% opacity primary background), title (centered), message, favorites list (50% opacity surface background, bullet items), guidance text, and close button. Uses BottomActionSheet with 60% snap point.

**Layout:** Vertical flex column with gap spacing. Center-aligned icon and title. List uses bullet points for each favorite.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| padding | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| gap | RN-wrapper | `semantic.space.md` = 12 | `Arrangement.spacedBy(12.dp)` inside Column | `.spacing(12)` | `space.md` |

### Layout — Icon Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` + centered content | n/a |
| padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| borderRadius | RN-wrapper | `semantic.radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |
| backgroundColor | RN-wrapper | `addOpacity(semantic.color.primary.default, 0.15)` (15% opacity) | `MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)` | `Color(.orange).opacity(0.15)` | `color.primary.default` + ESCALATE — propose `opacity.iconBackground = 0.15` |
| alignItems | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.Center` | n/a | n/a |

### Layout — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |

### Layout — Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| lineHeight | RN-wrapper | `22` | `lineHeight = 22.sp` | `.lineSpacing(22 - fontSize)` | ESCALATE — propose `type.body.md.lineHeight = 22` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |

### Layout — Favorites List

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `addOpacity(semantic.color.surface.default, 0.5)` (50% opacity) | `MaterialTheme.colorScheme.surface.copy(alpha = 0.5f)` | `Color(.systemBackground).opacity(0.5)` | `color.surface.default` + `opacity.faint` |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `Modifier.clip(RoundedCornerShape(8.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 8))` | `radius.md` |
| padding | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(12.dp)` | `.padding(12)` | `space.md` |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` inside Column | `.spacing(8)` | `space.sm` |
| marginTop | RN-wrapper | `4` | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | ESCALATE — use `space.xs = 4` |

### Layout — List Item

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | RN-wrapper | `8` | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |

### Layout — Guidance

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| lineHeight | RN-wrapper | `20` | `lineHeight = 20.sp` | `.lineSpacing(20 - fontSize)` | ESCALATE — propose `type.body.sm.lineHeight = 20` |
| marginTop | RN-wrapper | `4` | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |

### Visual — Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| name | RN-wrapper | `'information'` | `Icons.Outlined.Info` | SF Symbol: `info.circle` | n/a |
| size | RN-wrapper | `32` | `Modifier.size(32.dp)` | `.frame(width: 32, height: 32)` | ESCALATE — propose `iconSize.xl = 32` |
| color | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |

### Typography — Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'titleMedium'` | `MaterialTheme.typography.titleMedium` | `.font(.system(size: 16, weight: .semibold))` | ESCALATE — map to `type.heading.sm` |

### Typography — Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodyMedium'` | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14))` | `type.body.md` |

### Typography — List Item

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodyMedium'` | `MaterialTheme.typography.bodyMedium` | `.font(.system(size: 14))` | `type.body.md` |
| color | RN-wrapper | `semantic.color.onSurface.default` | `MaterialTheme.colorScheme.onSurface` | `Color(.label)` | `color.onSurface.default` |
| bullet | RN-wrapper | `'• '` | `Text("• ")` | `Text("• ")` | n/a |

### Typography — Guidance

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'bodySmall'` | `MaterialTheme.typography.bodySmall` | `.font(.system(size: 12))` | `type.body.sm` |

### Button — "Got it"

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `'default'` | `ButtonDefaults.buttonColors(...)` | `.buttonStyle(.borderedProminent)` | `buttonVariant.default` |
| size | RN-wrapper | `'lg'` | `ContentPadding.Large` | `.controlSize(.large)` | `buttonSize.lg` |
| text | RN-wrapper | `'Got it'` | `Text("Got it")` | `Text("Got it")` | n/a |

### Sheet Configuration

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| snapPoints | RN-wrapper | `['60%']` | `BottomSheetState(..., skipHiddenState = false)` with `spec = ModalBottomSheetSpec(...)` | `.presentationDetents([.height(0.6)])` | n/a |

---

## NOTES

- **Bottom sheet:** Uses BottomActionSheet with 60% snap point
- **Info icon:** Centered, 32px, primary color, 15% opacity primary background, pill shape
- **Title:** "Favorites Not Included", centered, onSurface color
- **Message:** Explains favorites are too far from route
- **Favorites list:** 50% opacity surface background, bullet points for each favorite name
- **Guidance:** "Try planning a route nearer to these favorites, or add them to a different route."
- **Close button:** "Got it", default variant, large size
- **Spacing:** 16px container padding, 12px gap between elements
- **Border radius:** 8px for list container, full for icon container
- **addOpacity utility:** Converts hex to rgba with specified opacity
- **Typography:** titleMedium for title, bodyMedium for message/list, bodySmall for guidance
