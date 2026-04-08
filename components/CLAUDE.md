# Component Guidelines

## Screen Layouts

### Map screen (full-bleed)
The home map screen (`app/(app)/(tabs)/index.tsx`) uses `MenuLayout` for the slide-out drawer and `MapHeaderOverlay` for a floating glass-morphic header over the map. No safe area wrapper — the map fills edge-to-edge and the overlay handles its own `useSafeAreaInsets().top` padding.

### Subpages (settings, profile, etc.)
All non-map screens MUST use `SubpageLayout` from `components/layouts/subpage-layout.tsx`.

```tsx
<SubpageLayout title="Settings" testID="settings-screen">
  {/* your content */}
</SubpageLayout>
```

**What it provides:**
- Back button (navigates to `/(app)/(tabs)` by default, override with `backTo` prop)
- Large left-aligned title with copper accent rule
- Safe area handling for top and bottom
- Optional `rightAction` slot for header actions

**Critical pattern — gradient through the notch zone:**
Do NOT use `SafeAreaView` with a background color for subpage headers. The status bar zone and header must share the same visual treatment. `SubpageLayout` achieves this by:
1. Using a plain `View` as the root (not `SafeAreaView`)
2. Applying `paddingTop: insets.top` to the `LinearGradient` itself
3. The gradient extends from the top of the screen (behind the clock/notch) down through the header, fading into the background color

This prevents the visible color-band artifact that occurs when `SafeAreaView` paints its padding area in one color while the header starts in another.

## Theme System

### ThemePreferenceProvider
User theme choice (light/dark/system) is managed by `contexts/theme-preference.tsx`. It persists to AsyncStorage via the `theme_preference` key and is wired into the root layout (`app/_layout.tsx`).

- `useThemePreference()` returns `{ mode, isDark, setMode }`
- `mode` is `'light' | 'dark' | 'auto'`
- `isDark` resolves `auto` against the device's `useColorScheme()`

### Semantic tokens only
Components use `useSemanticTheme()` for all colors, spacing, radii, and typography. Never hardcode color values — reference `semantic.color.*`, `semantic.space.*`, `semantic.radius.*`.

Exception: the `ThemePicker` component hardcodes preview colors from `theme.ts` so the mini phone cards always show the target theme regardless of the active one.

## Navigation

Tab bar is hidden (`display: 'none'` in `_layout.tsx`). Navigation between tabs happens via:
- The slide-out `MenuLayout` drawer (Home, Settings, Saved)
- Direct `router.push()` calls

Since tabs are not stack-pushed, use `router.push('/(app)/(tabs)')` to go back — not `router.back()`.

## Input Components

### ALWAYS use KeyboardAvoidingInput for text inputs in bottom sheets/modals

**CRITICAL:** Any `Input`, `Textarea`, or `TextInput` used inside a bottom sheet, modal, or any container where the keyboard might obscure the input field MUST be wrapped with `KeyboardAvoidingInput`.

```tsx
import { KeyboardAvoidingInput } from '../ui/keyboard-avoiding-input'
import { Input } from '../ui/input'

// ❌ WRONG - Input will be hidden behind keyboard
<View>
  <Input ... />
</View>

// ✅ CORRECT - Input stays visible when keyboard appears
<KeyboardAvoidingInput>
  <Input ... />
</KeyboardAvoidingInput>
```

**Why this matters:**
- Bottom sheets sit at the bottom of the screen
- When keyboard appears, it can cover input fields
- `KeyboardAvoidingInput` uses `KeyboardAvoidingView` to automatically adjust layout
- Prevents users from typing blind (see feedback: "favorite menu hides input behind screen")

**Available props:**
- `behavior?: 'padding' | 'position' | 'height'` - How keyboard avoidance works (default: platform-appropriate)
- `offset?: number` - Extra vertical offset beyond keyboard (default: 0)
- `includeSafeAreaBottom?: boolean` - Add safe area bottom padding (default: true)
- `style?: any` - Custom wrapper style
- `testID?: string` - Test identifier

**When to use:**
- Bottom sheets with text inputs (e.g., `SaveRouteConfirmationSheet`, `PlanRideSheet`)
- Modal dialogs with input fields
- Any fixed-position container at screen bottom
- ANY time an input might be obscured by keyboard

**When NOT to use:**
- Regular form screens that scroll normally (use `ScrollView` with `keyboardShouldPersistTaps`)
- `ChatInput` component (has its own `KeyboardAvoidingView`)
- Inputs already inside a `KeyboardAvoidingView`

**Global component location:** `components/ui/keyboard-avoiding-input.tsx`
