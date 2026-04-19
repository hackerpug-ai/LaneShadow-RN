---
review_type: red-hat-visual-parity
sprint: sprint-02-ui-component-translation
date: 2026-04-18
reviewer_role: adversarial-visual-reviewer
verdict: FAIL — native atoms are NOT on track to "look exactly like" the RN Paper baseline
---

# Sprint 02 — Native Atom Visual Parity Red-Hat Review

---

## 1. Component Parity Table

| Atom | RN Paper base | RN wrapper (file:line) | Android (file:line) | iOS (file:line) | Radius match | Typography match | Color/token match | State coverage (pressed/focus/disabled) | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| Button | Custom Pressable (not Paper Button) | button.tsx:102–106 (`semantic.radius.md` for default) | ThemeButton.kt:162 (`theme.radius.md` for default sizes) | ThemeButton.swift:127 (`theme.radius.md` for default) | ✅ (radius.md aligns) | ⚠️ RN uses Paper `Text variant="labelLarge"`; native uses `ThemedTextVariant.LabelMd` — scale may differ | ✅ Token-backed | ⚠️ pressed=opacity+scale; no ripple/M3 state layer | ⚠️ PARTIAL |
| Card | Custom `Pressable`/`View` | card.tsx:88–90 (`semantic.radius.lg`, `semantic.space.lg` padding, elevation[2/3]) | ThemeCard.kt:31 (`theme.radius.lg`); shadowElevation hardcoded 2.dp/3.dp | ThemeCard.swift:47 (radius.lg); shadow radius 6/8 hardcoded | ✅ | ✅ TitleMd/BodySm match | ✅ | ❌ Android: `clickable` with no ripple scrim; pressed state never reduces opacity; no disabled visual | ❌ FAIL |
| Chip | Custom `Pressable` | chip.tsx:38 (`semantic.radius.full`; `paddingVertical: 6`; fontSize hardcoded 13) | ThemeChip.kt:43 (`theme.radius.full`; `padding(vertical = 6.dp)`) | ThemeChip.swift:37 (`Capsule`, padding(.vertical, 6)) | ✅ | ❌ RN hardcodes `fontSize: 13` overriding LabelSm token; native delegates to LabelSm token — actual size may differ | ✅ Token-backed | ⚠️ Android/iOS disable=opacity only; no pressed overlay | ⚠️ PARTIAL |
| Switch | Custom animated Pressable | switch.tsx:79–99 (track 44×24, thumb 20×20, `semantic.radius.full`) | ThemeSwitch.kt:18 (M3 `Switch`; thumb/track delegated to Material3) | ThemeSwitch.swift:31 (custom RoundedRect; `theme.space.xxxxl` wide, `theme.space.xxl` tall; thumb `theme.space.lg`) | ❌ Android delegates to M3 Switch geometry (M3 default: 52×32 track, 24×24 thumb); RN baseline is 44×24/20×20; iOS uses token-spaced sizes that may not match 44×24/20×20 exactly | ❌ M3 Switch uses M3 label-large; RN custom; iOS uses `ThemeText` bodyMd | ⚠️ Color tokens present; Android missing focus/hover state layers | ❌ Android has no pressed state beyond M3 default ripple; iOS thumb moves but no border treatment matching RN's `borderColor` | ❌ FAIL |
| Checkbox | Custom Pressable | (no direct RN file read; inferred from parity catalog) | ThemeCheckbox.kt:29 (`Modifier.size(16.dp)`; no border stroke; `theme.radius.sm`) | ThemeCheckbox.swift:33 (`theme.space.lg` × `theme.space.lg`; `theme.radius.sm`) | ❌ Android hardcodes 16.dp; iOS uses `theme.space.lg` (token value unknown without inspecting JSON — if `space.lg=16` they match numerically but semantically diverge) | ⚠️ iOS and Android use different text variants in label slot; no border drawn in unchecked state | ⚠️ Color tokens used | ❌ No border stroke on unchecked state (RN equivalent has input border); no focus ring on either platform | ❌ FAIL |
| Slider | Custom PanResponder (track 8px, thumb 20×20, border-2) | slider.tsx:91–127 | ThemeSlider.kt:20 (M3 `Slider`; M3 default thumb height ~44dp, track height ~4dp) | ThemeSlider.swift:25 (SwiftUI `Slider`; `.tint` only; no explicit track height) | ❌ RN: track=8px, thumb=20×20 with border; Android M3: track≈4dp, thumb≈44dp circle; iOS: OS default Slider thumb/track | ❌ M3 Slider thumb/track geometry fundamentally different from RN's custom 8/20 layout | ⚠️ Tint token present; track color missing on iOS | ❌ Android no explicit disabled geometry; iOS disabled=opacity only | ❌ FAIL |
| Progress | Custom Animated.View (height=16, borderRadius=full) | progress.tsx:89–126 | Progress.kt:40–59 (M3 `LinearProgressIndicator`, `height(16.dp)`) | ThemeProgress.swift:27 (SwiftUI `ProgressView` with `.linear` style; no explicit height/radius override) | ❌ iOS: `.linear` ProgressView renders at OS-default height (~4pt on iOS); RN baseline is 16px with full radius; Android M3 LinearProgressIndicator is also ~4dp default — height(16.dp) modifier overrides it there | ❌ iOS ProgressView track color (`foregroundColor`) is NOT themed; only `.tint` on the indicator | ❌ iOS track background color not explicitly set to `secondary.default` | ❌ iOS has no indeterminate sweep animation matching RN's translateX loop | ❌ FAIL |
| Input | Custom Pressable with `TextInput` | (inferred from parity catalog) | ThemeInput.kt:55 (`RoundedCornerShape(theme.radius.xl)`) | ThemeInput.swift:95 (`RoundedRectangle(cornerRadius: theme.radius.xl)`) | ✅ Both use radius.xl | ⚠️ Label variant: Android uses `LabelSm`; iOS uses `LabelSm` — match; but no focus-expanded label (M3-style float) on either | ✅ Token-backed | ❌ Android: focused border toggles between primary/border but no ripple or state layer; iOS: no focus ring — only static border color swap; pressed state visually absent | ⚠️ PARTIAL |
| Textarea | Extends Input | textarea.tsx | ThemeTextarea.kt:14 (delegates to `ThemeInput` with `singleLine=false`, `minLines=4`, `maxLines=6`) | (ThemeTextarea.swift not read; inferred from task pattern) | ✅ Inherits Input radius.xl | ✅ Inherits Input typography | ✅ Inherits Input tokens | ⚠️ Inherits Input state gaps | ⚠️ PARTIAL |
| BottomSheetInput | Wraps Gorhom BottomSheetTextInput in RN | bottom-sheet-input.tsx | ThemeBottomSheetInput.kt:6 (delegates to `ThemeInput` — NOT a native sheet-aware input) | ThemeBottomSheetInput.swift:31 (delegates to `ThemeInput` with `.submitLabel(.done)` only) | ✅ Inherits Input | ✅ Inherits Input | ✅ Inherits Input | ❌ The critical functional distinction in RN is `BottomSheetTextInput` from Gorhom for keyboard avoidance. Android's implementation is plain `ThemeInput` — no Compose ModalBottomSheet keyboard awareness. iOS adds `.submitLabel(.done)` only — no `.onSubmit` or focus management coordination. The component is visual theatre for the feature it's supposed to represent | ❌ FAIL |
| Badge | Custom `Row` with `Pressable` | (inferred from catalog) | ThemeBadge.kt:48 (`padding(horizontal = 10.dp, vertical = 2.dp)`) | (ThemeBadge.swift not read; inferred) | ⚠️ Android hardcodes `10.dp` horizontal padding, `2.dp` vertical — not token-derived | ✅ Inferred label scale | ✅ Token color system | ❌ No pressed/disabled state; static only | ⚠️ PARTIAL |
| Avatar | Custom `Pressable` with image | (inferred) | ThemeAvatar.kt:75 (`imageUrl` non-null renders `IconSymbol(name="favorite")` instead of image) | ThemeAvatar.swift:47 (`AsyncImage`) | ❌ Android: when `imageUrl` is provided but no actual image renderer exists — renders "favorite" icon instead of network image (ThemeAvatar.kt:75–78 is a stub placeholder) | ⚠️ Avatar text variants match between platforms | ✅ Token colors | ❌ No image loading parity; Android is placeholder-only | ❌ FAIL |
| Skeleton | Custom shimmer with Animated.Value | skeleton.tsx | Skeleton.kt:37–62 (opacity pulse 1→0.3, 750ms) | ThemeSkeleton.swift:29 (opacity 1→0.3 with `.easeInOut(0.75).repeatForever`) | ✅ | ✅ N/A | ✅ `muted.default` | ✅ Animation present on both | ✅ PASS |
| Collapsible | Pressable header with toggle | collapsible.tsx | Collapsible.kt:43 (`animateContentSize`; chevron icon) | ThemeCollapsible.swift:44 (`.transition(.opacity.combined(with: .move(edge: .top)))`) | ✅ N/A | ✅ Inherits header slot | ✅ Tokens | ⚠️ iOS has entry transition; Android has none — asymmetry | ⚠️ PARTIAL |
| FAB | Custom Pressable, circular | fab.tsx | ThemeFAB.kt:26 (`FloatingActionButton`/`ExtendedFloatingActionButton`) | ThemeFAB.swift:41 (`Capsule`) | ❌ Android `FloatingActionButton` renders at M3 default shape (large circle, 56dp); iOS renders as a `Capsule` pill — neither matches the other, and neither is verified against the RN FAB radius | ❌ M3 FAB uses `displaySmall` or `labelLarge` typography; iOS uses `labelMd` | ⚠️ Container color matches (`primary.default`) | ❌ Android inherits M3 FAB ripple; iOS has plain Button; different press affordances | ❌ FAIL |
| Toggle | Custom Pressable | toggle.tsx | ThemeToggle.kt:37 (`theme.colors.accent.default` when pressed) | (ThemeToggle.swift not read; inferred) | ✅ `radius.md` | ✅ LabelMd | ⚠️ Android uses `accent.default` for pressed; RN uses `accent.pressed` — may differ | ❌ No disabled visual on Android beyond muted background; no focus ring | ⚠️ PARTIAL |
| ThemedText / ThemeText | RN Paper `Text` with `variant="labelLarge"` etc. | card.tsx:179, button.tsx:278 | ThemedText.kt:12 (delegates to `theme.type.*`) | ThemeText.swift:19 (delegates to `theme.type.*`) | N/A | ⚠️ RN uses Paper `Text variant="labelLarge"` (M3 label-large spec: size 14, weight 500, tracking 0.1px); native uses LaneShadow token value — parity depends on whether token matches M3 spec exactly | ✅ Token-backed | ✅ Color prop | ⚠️ PARTIAL |
| DragHandle | Pill shape, muted color | drag-handle.tsx | DragHandle.kt:36 (`width` animates xxl↔xxxl; `height=theme.space.xs`) | (iOS inline per task spec — not a standalone file; ThemeDragHandle not found as separate file) | ⚠️ Android animates width via spring; iOS implementation is inline/not shipped as standalone atom | N/A | ✅ `divider.default`/`primary.default` | ⚠️ Android has active state; iOS not verified | ⚠️ PARTIAL |
| SheetHandle | Fixed pill, muted color | sheets/sheet-handle.tsx | SheetHandle.kt:20 (`width` animates xxxl↔xxxxl on `expanded`) | (iOS inline per task spec) | ⚠️ Same iOS inline gap | N/A | ✅ `muted.default`/`onSurface.default` | ⚠️ Android has expanded state | ⚠️ PARTIAL |

---

## 2. Top Visual Fidelity Gaps

### Gap 1 — Android Switch geometry fundamentally diverges from the RN baseline (HIGH SEVERITY)

The RN `Switch` in `switch.tsx` is a custom-built component:
- Track: exactly **44×24px**, `borderRadius: semantic.radius.full`, borderWidth 2
- Thumb: exactly **20×20px**, `borderRadius: full`, elevation[2]
- Thumb translation: 2px → 22px

Android `ThemeSwitch.kt:18` wraps `androidx.compose.material3.Switch` with zero geometry customization. M3 Switch default is **52×32dp** track and **24×24dp** thumb (Material Design 3 spec). The token color overrides are correct but the component is **8dp wider, 8dp taller**, with a different thumb size. A human comparing screenshots will immediately see the size difference.

```kotlin
// ThemeSwitch.kt:18 — no width/height/thumbSize constraints applied
Switch(
    checked = checked,
    onCheckedChange = onCheckedChange,
    ...
    colors = SwitchDefaults.colors(...)
)
```

### Gap 2 — iOS `ThemeProgress` has no explicit height or track color (HIGH SEVERITY)

The RN Progress renders at **16px height** with `semantic.color.secondary.default` as track background and `semantic.color.primary.default` as fill. iOS `ThemeProgress.swift:27`:

```swift
ProgressView(value: ...)
    .progressViewStyle(.linear)
    .tint(theme.colors.primary.default)
    .frame(maxWidth: .infinity)
```

The `.linear` `ProgressViewStyle` on iOS renders at the platform default height (~4pt) with no mechanism to override it. No `.frame(height:)` applied. No track background color set. The `foregroundStyle` of the track color is not customized. A side-by-side screenshot will show a thin iOS system bar vs. the RN 16px bar.

### Gap 3 — Android Slider delegates to M3 `Slider` with incompatible track geometry (HIGH SEVERITY)

RN Slider: `track height = 8px`, `thumb = 20×20px with border-2`. Android `ThemeSlider.kt:20`:

```kotlin
Slider(
    value = value,
    ...
    colors = SliderDefaults.colors(...)
)
```

M3 Slider renders a **~4dp track** and a **~44dp touch-target thumb** (thumb indicator is 4dp wide by default in M3 compact mode). No `thumb` or `track` override lambdas are passed. The visual geometry is completely different.

### Gap 4 — Android `ThemeAvatar` renders a "favorite" icon as a placeholder when `imageUrl` is provided (MEDIUM SEVERITY)

`ThemeAvatar.kt:75–78`:
```kotlin
!imageUrl.isNullOrBlank() ->
    IconSymbol(
        name = "favorite",
        size = avatarIconSize(size),
        color = theme.colors.onSurface.default,
    )
```

When `imageUrl` is non-null but image loading logic is absent (no `AsyncImage`/`Coil`/`Glide` call), the Android avatar renders a heart icon labeled as if it loaded an image. The iOS counterpart uses `AsyncImage`. This is not an animation or token gap — it is a missing feature declared as complete.

### Gap 5 — Android `ThemeFAB` uses M3 `FloatingActionButton` shape; iOS uses `Capsule` — neither matches the other (MEDIUM SEVERITY)

Android `ThemeFAB.kt:26`:
```kotlin
FloatingActionButton(
    containerColor = theme.colors.primary.default,
    ...
)
```
M3 `FloatingActionButton` has a default large-circle shape (56dp × 56dp). Android `ExtendedFloatingActionButton` is pill-shaped.

iOS `ThemeFAB.swift:41`:
```swift
.clipShape(Capsule(style: .continuous))
.frame(height: theme.space.xxxl)
```
iOS is always a pill (even icon-only). Cross-platform visual divergence is guaranteed for icon-only FAB.

### Gap 6 — `ThemeBottomSheetInput` is visual theatre — no native keyboard-avoidance integration (HIGH SEVERITY)

The RN `BottomSheetInput` wraps Gorhom's `BottomSheetTextInput`, which is the critical difference enabling keyboard-interactive behavior inside bottom sheets. The native implementations:

- `ThemeBottomSheetInput.kt:6`: delegates unconditionally to `ThemeInput` — identical to a plain text input
- `ThemeBottomSheetInput.swift:31`: delegates to `ThemeInput` and adds `.submitLabel(.done)` — also identical to a plain text input

Neither platform integrates with the native bottom sheet keyboard avoidance system (`ModalBottomSheet`'s `windowSoftInputMode` on Android, or `.presentationDetents` + `@FocusState` on iOS). This is the most functionally critical parity gap in the entire batch.

### Gap 7 — iOS `ThemeSwitch` track dimensions use token space values whose pixel sizes are unverified against the 44×24 baseline (MEDIUM SEVERITY)

`ThemeSwitch.swift:32`:
```swift
RoundedRectangle(cornerRadius: theme.radius.full, style: .continuous)
    .fill(trackColor)
    .frame(width: theme.space.xxxxl, height: theme.space.xxl)
```

`theme.space.xxxxl` and `theme.space.xxl` are token-resolved values. Without reading `semantic.tokens.json`, the actual pixel values are unknown from code alone. If `xxxxl != 44` or `xxl != 24`, the iOS track will not match the RN baseline dimensions. The thumb uses `theme.space.lg × theme.space.lg` (target: 20×20) — again, unverifiable from code without the JSON. This is a medium-confidence finding.

### Gap 8 — `ThemeChip` in RN hardcodes `fontSize: 13` on top of the `LabelSm` token style (MEDIUM SEVERITY)

`chip.tsx:66`:
```tsx
<Text
  style={[
    semantic.type.label.sm,
    {
      ...
      fontSize: 13,
    },
  ]}
>
```

The RN baseline overrides LabelSm font size with a hardcoded 13px. Neither the Android nor iOS chip does this — they use the raw `LabelSm` token value. If `label.sm.fontSize != 13`, the RN chip text is visually larger or smaller than both native implementations. The "parity" is to a component that is itself not purely token-driven.

### Gap 9 — Android `ThemeBadge` hardcodes `padding(horizontal = 10.dp, vertical = 2.dp)` (LOW SEVERITY)

`ThemeBadge.kt:48`:
```kotlin
.padding(horizontal = 10.dp, vertical = 2.dp)
```

This is a magic number — `10.dp` is not a theme token (no `theme.space.anything` maps to 10dp in the standard xs/sm/md/lg/xl/xxl scale). The RN badge and iOS badge may render different horizontal padding if they use token-derived spacing.

### Gap 10 — `ThemeCard` on Android uses `Modifier.clickable` without ripple scoping; pressed state is invisible (LOW SEVERITY)

`ThemeCard.kt:33–38`:
```kotlin
val interactiveModifier =
    if (onClick != null) {
        Modifier.clickable(enabled = enabled, onClick = onClick)
    } else {
        Modifier
    }
```

`Modifier.clickable` without a custom `indication` will use the M3 default ripple. However, the RN `Card` uses a `Pressable` with `semantic.color.card.pressed` background color change. The visual pressed feedback is different in kind (color change vs. ripple) and — critically — no disabled visual dimming is applied on Android. The card renders identically when `enabled = false` as when `enabled = true` except for the `enabled` flag suppressing click.

---

## 3. RN Paper Contract Gaps

### Missing: M3 State Layer system (hover/focus/pressed/dragged overlays)

Material Design 3 mandates a state layer on interactive components — a colored overlay at 8% opacity (hover), 12% (focus/pressed), 16% (dragged). React Native Paper (the RN baseline) implements state layers through its `Ripple` and `TouchableRipple` system. The native implementations bypass this:

- Android buttons (`ThemeButton.kt`) pass colors to `ButtonDefaults.*colors()` — M3 does apply its own ripple, but with no state layer override to the LaneShadow semantic colors. The pressed color (`semantic.color.primary.pressed`) is never applied; M3's own ripple uses the resolved `contentColor` instead.
- iOS buttons (`ThemeButton.swift:253`) use `opacity(0.9)` and `scaleEffect(0.98)` — no M3-style overlay. The pressed state is a scale micro-animation, not a color overlay.
- No component provides a focus ring / keyboard focus indicator.

### Missing: M3 Elevation tiers (0–5) as visual depth

RN `Card` uses `semantic.elevation[pressed ? 3 : 2]` which maps to box-shadow parameters. Android `ThemeCard.kt:228–229` uses `shadowElevation = if (variant == CardVariant.Default) 2.dp else 3.dp` — hardcoded values not from the token system. iOS `ThemeCard.swift:52–56` uses `shadow(radius: 6/8, y: 2)` — also hardcoded numerics, not from an elevation token. None of the implementations use an `elevation` token from the theme contract.

### Missing: M3 Chip variants (assist/filter/input/suggestion)

The parity contract calls for `Chip` with `label, icon?, selected, onPress`. RN Paper ships four chip variants (Assist, Filter, Input, Suggestion) with distinct geometry and leading/trailing icon rules. The native `ThemeChip` is a single variant only. No platform implements `ChipVariant` enum or distinct chip types.

### Missing: M3 Button tonal variant

The RN `Button` supports `variant: 'secondary'` which is styled as a secondary-background button. RN Paper's `Button mode="contained-tonal"` is the M3 tonal button (uses `secondaryContainer` color). Neither native platform has an explicit tonal button variant — `ThemeButtonVariant.Secondary` may or may not visually match M3 tonal depending on what `secondary.default` token resolves to.

### Missing: M3 Switch check icon and thumb decorations

M3 Switch in Compose (API 33+) renders a checkmark icon inside the thumb when checked. The native Android `ThemeSwitch` does not configure `thumbContent` to suppress or customize this. In API 33+ environments, the Android switch will render with the M3 check icon that has no counterpart in the RN custom switch or the iOS custom switch.

---

## 4. Cross-Platform Divergence (iOS vs Android)

### Switch: M3 delegation vs. custom rendering

Android delegates to `androidx.compose.material3.Switch` (M3 spec geometry: 52×32dp track, 24dp thumb). iOS renders a custom `RoundedRectangle`+`Circle` with token-sized dimensions. These two platforms will look different from each other and both look different from the RN baseline.

### FAB: M3 shape vs. Capsule

Android icon-only FAB: M3 `FloatingActionButton` = circular (56dp). iOS icon-only FAB: `Capsule` pill. For a labeled FAB, Android uses `ExtendedFloatingActionButton` (also pill) — so labeled FABs are visually closer. Icon-only FABs diverge platform-to-platform.

### Progress: M3 LinearProgressIndicator vs. system ProgressView

Android: `LinearProgressIndicator` with `height(16.dp)` — passes height enforcement. iOS: `ProgressView().progressViewStyle(.linear)` with no height modifier — renders at system default (~4pt). Height mismatch between platforms is approximately 12pt.

### Collapsible open/close animation

Android uses `animateContentSize()` — a size interpolation that collapses vertically with no opacity. iOS uses `.transition(.opacity.combined(with: .move(edge: .top)))` — an opacity+vertical-slide combo. The entry/exit animations differ in kind and will read differently to any human watching them.

### Avatar image loading

iOS: `AsyncImage` (real async image load). Android: icon placeholder rendered instead of image. This is not a style divergence — it is a feature gap on Android.

### Checkbox size

Android: hardcoded `Modifier.size(16.dp)`. iOS: `theme.space.lg × theme.space.lg`. If `space.lg == 16`, they accidentally match. If `space.lg != 16`, they diverge. Using a hardcoded value on one platform and a token on the other is an architectural inconsistency regardless of current pixel value.

---

## 5. Stub / Theatre Findings

### ThemeBottomSheetInput (Android + iOS) — functional stub

Both platforms: `ThemeBottomSheetInput` delegates unconditionally to `ThemeInput` without any sheet-awareness.
- Android `ThemeBottomSheetInput.kt:8–27`: `ThemeInput(...)` — no `WindowInsets` handling, no `imePadding`, no Compose ModalBottomSheet keyboard callback
- iOS `ThemeBottomSheetInput.swift:32–42`: `ThemeInput(...).submitLabel(.done)` — `.submitLabel` only controls the keyboard return key label; it does not coordinate focus with sheet detents

The entire point of `BottomSheetInput` in the RN codebase is Gorhom's `BottomSheetTextInput` which wires into the bottom sheet's keyboard avoidance system. Both native atoms render and "look" like an input but the functional contract is absent.

### ThemeAvatar (Android) — image rendering is a placeholder

`ThemeAvatar.kt:74–78`:
```kotlin
!imageUrl.isNullOrBlank() ->
    IconSymbol(
        name = "favorite",
        size = avatarIconSize(size),
        color = theme.colors.onSurface.default,
    )
```
No image loading library is called. Passing a valid image URL produces a heart icon. This is declared "completed" in UI-009.

### ThemeSlider (iOS) — track background color not set

`ThemeSlider.swift:26`:
```swift
Slider(value: $value, in: range, step: step)
    .tint(theme.colors.primary.default)
    .disabled(!isEnabled)
    .opacity(isEnabled ? 1 : 0.7)
```
`.tint` on a SwiftUI `Slider` colors only the filled portion of the track. The track background color (RN: `semantic.color.secondary.default`) is not set. iOS renders the track background in the system default gray. This is a silent token contract violation.

### ThemeProgress (iOS) — track background + height both missing

As documented in Gap 2: no `.frame(height: 16)` and no track color customization. The component compiles and runs but does not match the 16px/secondary-background specification.

### ThemeCheckbox (Android) — no border on unchecked state

`ThemeCheckbox.kt:26–46`: the unchecked box uses `background(theme.colors.background.default)` — same as the page background. There is no border stroke drawn on the unchecked state. The checkbox is visually invisible when unchecked on a background-colored surface. The RN equivalent and iOS equivalent both render a visible border in unchecked state.

---

## 6. Confidence Summary

- **HIGH confidence findings:** 7
  - Android Switch delegates to M3 with wrong geometry (52×32 vs 44×24)
  - iOS Progress has wrong height (~4pt vs 16px) and missing track color
  - Android Slider delegates to M3 with incompatible track/thumb geometry
  - Android Avatar renders "favorite" icon instead of loading image
  - ThemeBottomSheetInput on both platforms is a functional stub
  - Android Checkbox unchecked state is invisible (no border)
  - Android/iOS FAB shape mismatch with each other and with RN

- **MEDIUM confidence findings:** 5
  - iOS Switch track dimensions unverified against 44×24 baseline (depends on token JSON values)
  - RN Chip hardcodes fontSize:13 overriding LabelSm — creates moving-target baseline
  - Missing M3 state layer system across all interactive atoms
  - iOS ThemeSlider track background color not set
  - ThemeCard Android clickable with no pressed color change (only M3 default ripple)

- **LOW confidence findings:** 3
  - ThemeBadge horizontal padding 10.dp is not a token
  - Android `ThemeButton` pressed state relies on M3 ripple, not semantic.pressed token
  - Collapsible animation asymmetry (size vs. opacity+slide)

---

## 7. Overall Verdict

The native atoms are **not tracking toward "look exactly like React Native Paper."** The systemic gap is that Android heavily delegates to M3 component primitives (M3 `Switch`, M3 `Slider`, M3 `LinearProgressIndicator`, M3 `FloatingActionButton`) whose default geometry and visual affordances — track heights, thumb sizes, shape tokens, state layer behavior — are defined by the Material Design 3 spec, not by the LaneShadow parity contract. This produces components that are token-colored correctly but geometrically and behaviorally different from the RN baseline, which uses fully custom-rendered primitives (custom `Animated.View` switch, custom `PanResponder` slider, custom `Animated.View` progress bar) styled to spec. iOS avoids the M3 geometry problem for most atoms but introduces its own failures: missing explicit dimensions on Progress, missing track color on Slider, and relying on system-default rendering wherever `.tint` is the only modifier applied. Three components (BottomSheetInput Android, BottomSheetInput iOS, Avatar Android) declare completion while missing their core functional contract. Until the geometry divergences on Switch, Slider, and Progress are resolved — and until BottomSheetInput and Avatar image-loading are actually implemented — these atoms cannot be considered visually or functionally equivalent to the RN baseline.
