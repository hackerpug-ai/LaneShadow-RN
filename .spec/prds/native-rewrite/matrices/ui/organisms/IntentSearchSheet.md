# IntentSearchSheet - STYLE PROPERTIES MATRIX

**Component:** IntentSearchSheet
**RN Source:** `react-native/components/discovery/intent-search-sheet.tsx`
**Framework Primitives:** `@gorhom/bottom-sheet`, `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/discovery/intent-search-sheet.tsx` | Public API, intent search interface |
| BottomSheetWrapper | `react-native/components/sheets/bottom-sheet-wrapper.tsx` | Gorhom bottom sheet integration |
| Input | `react-native/components/ui/input.tsx` | Search input (see `matrices/ui/atoms/Input.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Search icon (see `matrices/ui/atoms/IconSymbol.md`) |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `Input` - Search text input field
- `IconSymbol` - Search icon

**Composition pattern:**
- Bottom sheet with search input
- Full-width input with search icon
- Placeholder text "Search intents..."
- Auto-focus on open
- Debounced search (300ms delay)
- Clear button on text input
- Keyboard handling (dismiss on sheet close)

**Layout:** Full-width input with 16dp horizontal padding

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|---|
| (none - controlled component) | - | - | - |

**Side effects:**
- Debounced search: `useEffect` with debounce timer → `LaunchedEffect(query) { delay(300); onSearch(query) }` / `.debounce(...)`
- Auto-focus: `useEffect` with input ref → `LaunchedEffect(Unit) { focusRequester.requestFocus() }` / `.focused(@FocusState)` focus state
- Keyboard dismiss: Sheet close callback → Keyboard dismissal on sheet dismiss

**Callback signatures:**
- `onClose: () => void` → `() -> Unit` / `() -> Void`
- `onQueryChange: (query: string) => void` → `(query: String) -> Unit` / `(String) -> Void`
- `onSelect: (intent: Intent) => void` → `(intent: Intent) -> Unit` / `(Intent) -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Sheet Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| preset | BottomSheetWrapper | `'search'` (custom) | `BottomSheetState(...snapPoints = [...])` | `.presentationDetents([.medium()])` | n/a (preset name) |
| paddingHorizontal | constant | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | constant | `16` | `Modifier.padding(vertical = 16.dp)` | `.padding(.vertical, 16)` | `space.lg` |

### Typography — Header Title

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | react-native-paper | `titleMedium` | `LaneShadowTheme.typography.titleMedium` | `theme.typography.titleMedium` | `type.title.md` |
| color | semantic | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| marginBottom | constant | `12` | `Modifier.padding(bottom = 12.dp)` | `.padding(.bottom, 12)` | `space.md` |

### Layout — Input Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | StyleSheet | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

---

## NOTES

- **Search input:** Full-width input with search icon
- **Auto-focus:** Input auto-focuses when sheet opens
- **Debounce:** 300ms debounce on search query changes
- **Clear button:** Input has clear button for resetting query
- **Keyboard handling:** Keyboard dismisses when sheet closes
- **Placeholder:** "Search intents..." placeholder text
- **Medium height:** Uses medium detent for sheet height
- **Gap spacing:** 12dp gap between header and input
- **Theme integration:** All colors sourced from semantic theme tokens
- **Child components:** Composed from Input and IconSymbol
- **No state:** Purely presentational component with controlled props
- **Delegation:** All input styling delegated to Input component
- **Intent results:** Intent search results rendered in separate list component
