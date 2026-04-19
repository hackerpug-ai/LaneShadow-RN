# BottomActionSheet — STYLE PROPERTIES MATRIX

**Component:** BottomActionSheet
**Level:** Template
**Source:** `react-native/components/ui/bottom-action-sheet.tsx`
**Platform Mapping:** Android `BottomSheetScaffold` with action list, iOS `.confirmationDialog()` or custom sheet

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/ui/bottom-action-sheet.tsx` | `@gorhom/bottom-sheet` | Android: `app/src/main/java/com/laneshadow/ui/templates/BottomActionSheet.kt`<br>iOS: `app/ui/templates/BottomActionSheet.swift` | 1 fixed layout with dynamic actions |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Action Sheet Container

**Source files read:**
- LaneShadow: `react-native/components/ui/bottom-action-sheet.tsx`
- Framework: `node_modules/@gorhom/bottom-sheet/src/components/bottomSheet/BottomSheet.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | cornerRadius | RN-wrapper | `radius.lg` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| Layout | paddingHorizontal | RN-wrapper | `space.lg` = 16 | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| Layout | paddingTop | RN-wrapper | `space.lg` = 16 | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |
| Layout | paddingBottom | RN-wrapper | `space.xl` = 24 | `Modifier.padding(bottom = 24.dp)` | `.padding(.bottom, 24)` | `space.xl` |

### Layout — Action Items

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | itemHeight | RN-wrapper | `space.2xl + space.sm` = 40 | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` |
| Layout | gap | RN-wrapper | `space.xs` = 4 | `Spacer(Modifier.height(4.dp))` | `Spacer(minLength: 4)` | `space.xs` |
| Visual | backgroundColor (pressed) | RN-wrapper | `semantic.color.muted.pressed` | (pressed branch) | (pressed branch) | `color.muted.pressed` |
| Visual | borderRadius | RN-wrapper | `radius.md` = 8 | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

### Typography — Action Items

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | fontSize | RN-wrapper | `16` | `16.sp` | `16` | `type.body.md.fontSize` |
| Typography | fontWeight | RN-wrapper | `'400'` (normal), `'600'` (destructive) | `FontWeight.Normal / SemiBold` | `.regular / .semibold` | `type.body.md.fontWeight` |
| Typography | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Typography | color (destructive) | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |
| Typography | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

### Layout — Cancel Button

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | marginTop | RN-wrapper | `space.xs` = 4 | `Modifier.padding(top = 4.dp)` | `.padding(.top, 4)` | `space.xs` |
| Layout | height | RN-wrapper | `space.2xl + space.sm` = 40 | `Modifier.height(40.dp)` | `.frame(height: 40)` | `space.2xl + space.sm` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |
| Typography | color | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Typography | fontWeight | RN-wrapper | `'600'` | `FontWeight.SemiBold` | `.semibold` | `type.body.md.fontWeight` |

---

## DESIGN NOTES

- Action sheet slides up from bottom
- Cancel button is separate from action list
- Destructive actions use danger color
- All actions are centered
- Touch feedback on press
- Sheet snaps to content height

---

## VERIFICATION GATES

- Sheet animates up smoothly
- All actions are tappable (44pt min)
- Destructive actions visually distinct
- Cancel button separated by divider
- Tapping outside dismisses sheet
- Safe area respected on bottom

---

## DEPENDENCIES

- UI-001 (core theme contract)
- Button component (for cancel action)
- Safe area system
- Bottom sheet system (Android `BottomSheetScaffold`, iOS `.sheet`)
