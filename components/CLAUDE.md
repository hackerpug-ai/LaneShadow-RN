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
