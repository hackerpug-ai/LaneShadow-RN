# KeyboardAvoidingInput - STYLE PROPERTIES MATRIX

**Component:** KeyboardAvoidingInput
**RN Source:** `react-native/components/ui/keyboard-avoiding-input.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/keyboard-avoiding-input.tsx` | Public API, keyboard avoidance behavior |
| KeyboardAvoidingView | `node_modules/react-native/Libraries/Components/Keyboard/KeyboardAvoidingView.js` | Keyboard avoidance primitive |
| SafeAreaInsets | `react-native-safe-area-context` | Safe area bottom padding |

---

## COMPOSITION

**Child atoms:**
- None (wrapper component - children are passed through)

**Composition pattern:** Wrapper around KeyboardAvoidingView that adds safe area bottom padding for inputs in modals/bottom sheets.

**Layout:** Full-width container that adjusts position/height when keyboard appears.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| behavior (iOS) | RN-wrapper | `'padding'` | n/a | n/a | n/a |
| behavior (Android) | RN-wrapper | `undefined` | n/a | n/a | n/a |

### Layout — Content

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| paddingBottom (conditional) | RN-wrapper | `insets.bottom` | `WindowInsets.systemBars.addBottom(...)` | `.padding(.bottom, safeArea.bottom)` | n/a (dynamic) |

---

## NOTES

- **Global wrapper:** Must wrap ALL text inputs in bottom sheets, modals, or containers where keyboard might obscure input
- **Platform-specific behavior:** iOS uses `'padding'` behavior, Android uses `undefined` (different keyboard handling)
- **Safe area integration:** Automatically adds safe area bottom padding when `includeSafeAreaBottom` is true (default)
- **Custom behavior:** Supports `'padding'`, `'position'`, or `'height'` behavior modes
- **Offset support:** Optional `offset` prop for extra vertical spacing beyond keyboard avoidance
- **NOT for Gorhom bottom sheets:** Do NOT use with `@gorhom/bottom-sheet` - use `BottomSheetInput` instead
- **Use cases:** Regular modals, fixed-position containers, any non-Gorhom keyboard scenario
- **Why required:** Prevents "favorite menu hides input behind screen" issue by ensuring input stays visible when keyboard appears
- **Conflict avoidance:** Causes double keyboard avoidance if used with Gorhom sheets that have `hasTextInput={true}`

**References:**
- Gorhom issue #1891: "You should be using BottomSheetTextInput"
- Gorhom issue #1195: KeyboardAvoidingView causes double avoidance
- Gorhom discussion #233: Keyboard handling release notes
