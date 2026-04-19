# BottomActionSheet - STYLE PROPERTIES MATRIX

**Component:** BottomActionSheet
**RN Source:** `react-native/components/ui/bottom-action-sheet.tsx`
**Framework Primitives:** `@gorhom/bottom-sheet` library

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/bottom-action-sheet.tsx` | Low-level Gorhom bottom sheet primitive |
| Gorhom BottomSheetModal | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetModal/bottomSheetModal.tsx` | Modal bottom sheet |
| Gorhom BottomSheetBackdrop | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetBackdrop/bottomSheetBackdrop.tsx` | Backdrop overlay |
| Gorhom BottomSheetView | `node_modules/@gorhom/bottom-sheet/src/components/bottomSheetView/bottomSheetView.tsx` | Sheet content view |

---

## LAYOUT COMPOSITION

**Purpose:** Low-level primitive for bottom sheets with consistent positioning, styling, and Gorhom integration

**Composition pattern:**
- BottomSheetModal (Gorhom) with snap points, keyboard handling
- BottomSheetBackdrop with opacity 0.5
- BottomSheetView container with flex: 1
- PaperProvider for theme context
- Safe area handling via topInset
- Stack behavior "push" for sheet-to-sheet stacking

**Layout:** Modal bottom sheet with backdrop, safe area insets, keyboard behavior

---

## STYLE PROPERTIES MATRIX

### Layout — BottomSheetModal (Gorhom)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| index | RN-wrapper | `0` (first snap point) | `sheetState.currentValue = 0` | `presentationDetents([.fraction(0.9)].selectedDetent = .first)` | n/a |
| snapPoints | RN-wrapper | `customSnapPoints or ['90%']` | `SheetState.snapPoints = [...]` | `presentationDetents([...])` | n/a (dynamic) |
| topInset | RN-wrapper | `insets.top` (dynamic) | `WindowInsets.safeDrawing.asPaddingValues().calculateTopPadding()` | `safeAreaInsets.top` | n/a (dynamic) |
| stackBehavior | RN-wrapper | `'push'` | `stackBehavior = StackBehavior.push` | (n/a iOS) | n/a |
| enablePanDownToClose | RN-wrapper | `true` | `skipHiddenState = false` | `.presentationDragIndicator(.visible)` | n/a |
| enableDismissOnClose | RN-wrapper | `true` | Included above | Included above | n/a |

### Visual — Background Style

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Keyboard Behavior

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| android_keyboardInputMode | RN-wrapper | `'adjustResize'` | `WindowInsets.ime` (automatic) | (n/a iOS) | n/a |
| keyboardBehavior | RN-wrapper | `hasTextInput ? 'interactive' : 'fillParent'` | `imePadding()` with interactive | (n/a iOS) | n/a |
| keyboardBlurBehavior | RN-wrapper | `hasTextInput ? 'restore' : 'none'` | `WindowInsets.ime.animationToImeNested()` | (n/a iOS) | n/a |

### Visual — Backdrop (BottomSheetBackdrop)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| disappearsOnIndex | RN-wrapper | `-1` | `disappearsOnIndex = -1` | `.opacity(disappearsAt: -1)` | n/a |
| appearsOnIndex | RN-wrapper | `0` | `appearsOnIndex = 0` | `.opacity(appearsAt: 0)` | n/a |
| opacity | RN-wrapper | `0.5` | `alpha = 0.5f` | `.opacity(0.5)` | ESCALATE — propose `opacity.backdrop = 0.5` |
| pressBehavior | RN-wrapper | `'close'` | `onBackPressed = { ... }` | `.onTapGesture { ... }` | n/a |

### Layout — BottomSheetView (Gorhom)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxHeight()` | `.frame(maxHeight: .infinity)` | n/a |

### Props

| Prop | Type | Source | Purpose |
|---|---|---|---|
| visible | boolean | RN-wrapper | Sheet visibility (controlled via ref) |
| onDismiss | () => void | RN-wrapper | Dismiss callback |
| children | ReactNode | RN-wrapper | Sheet content |
| snapPoints | (string \| number)[] | RN-wrapper | Snap points (e.g., ['90%']) |
| testID | string | RN-wrapper | Test ID for BottomSheetView |
| hasTextInput | boolean | RN-wrapper | Enable interactive keyboard behavior |

---

## NOTES

- **Low-level primitive:** Direct Gorhom BottomSheetModal wrapper
- **Default snap point:** 90% of screen height
- **Backdrop:** 50% opacity, closes on press
- **Keyboard handling:** Interactive mode when `hasTextInput=true`
- **Stack behavior:** "push" allows sheet-to-sheet stacking
- **Pan to close:** Enabled by default
- **Safe area:** topInset applied for notch area
- **Theme context:** PaperProvider wraps content for Paper components
- **Handle:** Null (no default drag handle - use SheetHandle separately)
- **TestID:** Applied to BottomSheetView when wrapChildren=true
- **Ref management:** Uses useRef and isPresented ref for state tracking
