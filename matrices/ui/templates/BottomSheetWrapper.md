# BottomSheetWrapper - STYLE PROPERTIES MATRIX

**Component:** BottomSheetWrapper
**RN Source:** `react-native/components/sheets/bottom-sheet-wrapper.tsx`
**Framework Primitives:** `@gorhom/bottom-sheet` library

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Gorhom bottom sheet wrapper with standardized spacing |
| BottomActionSheet | `react-native/components/ui/bottom-action-sheet.tsx` | Bottom sheet template (see matrices/ui/templates/BottomActionSheet.md) |
| SheetHandle | `react-native/components/sheets/sheet-handle.tsx` | Drag handle atom (see matrices/ui/atoms/SheetHandle.md) |
| Gorhom library | `node_modules/@gorhom/bottom-sheet/` | Bottom sheet primitives |

---

## LAYOUT COMPOSITION

**Purpose:** Mid-level wrapper around Gorhom BottomSheet that standardizes snap points, spacing, and optional drag handle

**Composition pattern:**
- BottomActionSheet wrapper (Gorhom integration)
- Optional SheetHandle at top
- Wrapped children with standard padding (16px horizontal, 12px top, 16px bottom, 12px gap)
- Optional footer positioned absolutely at bottom
- Configurable snap point presets (content: 40%, half: 60%, full: 90%)
- Keyboard avoidance support for text inputs

**Layout:** Bottom sheet with handle, padded content area, optional footer

---

## STYLE PROPERTIES MATRIX

### Layout — Content Wrapper (View, wrapChildren=true)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| paddingHorizontal | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingTop | RN-wrapper | `semantic.space.md` (= 12) | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |
| paddingBottom | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |
| gap | RN-wrapper | `semantic.space.md` (= 12) | `Arrangement.spacedBy(12.dp)` / `Modifier.padding(end = 12.dp)` between items | `spacing(12)` | `space.md` |

### Layout — Unwrapped Container (View, wrapChildren=false)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |
| flexDirection | RN-wrapper | `'column'` | `Column(...)` | `VStack` | n/a |

### Layout — Footer Wrapper (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true).align(Alignment.BottomCenter)` | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(...)` | n/a |
| bottom | RN-wrapper | `0` | `Modifier.align(Alignment.Bottom)` / `absoluteOffset(y = 0.dp)` | alignment `.bottom` | n/a |
| left | RN-wrapper | `0` | `Modifier.align(Alignment.Start)` | alignment `.leading` | n/a |
| right | RN-wrapper | `0` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

### Snap Point Presets

| Preset | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| content | RN-wrapper | `['40%']` | `40% of screen height` | `presentationDetents([.fraction(0.4)])` | n/a (percentage) |
| half | RN-wrapper | `['60%']` | `60% of screen height` | `presentationDetents([.fraction(0.6)])` | n/a (percentage) |
| full | RN-wrapper | `['90%']` | `90% of screen height` | `presentationDetents([.fraction(0.9)])` | n/a (percentage) |

### Props

| Prop | Type | Source | Purpose |
|---|---|---|---|
| isVisible | boolean | RN-wrapper | Sheet visibility |
| onClose | () => void | RN-wrapper | Dismiss callback |
| children | ReactNode | RN-wrapper | Sheet content |
| preset | SnapPreset | RN-wrapper | Snap point preset (content/half/full) |
| snapPoints | (string \| number)[] | RN-wrapper | Custom snap points (overrides preset) |
| wrapChildren | boolean | RN-wrapper | Whether to wrap children with padding |
| showHandle | boolean | RN-wrapper | Whether to show drag handle |
| footer | ReactNode | RN-wrapper | Optional footer content |
| hasTextInput | boolean | RN-wrapper | Enable keyboard avoidance for text inputs |

---

## NOTES

- **Snap point presets:** content (40%), half (60%), full (90%)
- **Standard padding:** 16px horizontal, 12px top, 16px bottom, 12px gap
- **Handle:** Optional SheetHandle for drag indication
- **Keyboard avoidance:** Set `hasTextInput=true` for sheets with text inputs
- **Footer positioning:** Absolutely positioned at bottom when `wrapChildren=false`
- **Gorhom integration:** Wraps BottomActionSheet which wraps Gorhom's BottomSheet
- **Unwrapped mode:** Set `wrapChildren=false` for custom layouts
- **TestID propagation:** Passes testID to BottomActionSheet
