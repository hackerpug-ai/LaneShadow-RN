# WelcomeScreen — STYLE PROPERTIES MATRIX

**Component:** WelcomeScreen
**Level:** Screen
**Source:** `react-native/components/onboarding/welcome-screen.tsx`
**Platform Mapping:** Android `Column` with animations, iOS `VStack` with animations

---

## TRANSLATION SOURCES

| Property | RN wrapper source | Framework primitives | Native target file | Variants |
|---|---|---|---|---|
| Layout | `react-native/components/onboarding/welcome-screen.tsx` | `react-native/Libraries/Components/View/View.js`, `react-native/Libraries/Animated/Animated.js` | Android: `app/src/main/java/com/laneshadow/ui/screens/WelcomeScreen.kt`<br>iOS: `app/ui/screens/WelcomeScreen.swift` | 2 states: idle, downloading |

---

## STYLE PROPERTIES MATRIX

> Exhaustive enumeration of every style property from both sources.

### Layout — Screen Container

**Source files read:**
- LaneShadow: `react-native/components/onboarding/welcome-screen.tsx`
- Framework: `react-native/Libraries/Components/View/View.js`, `react-native/Libraries/Animated/Animated.js`, `react-native-paper/src/components/Typography/Text.tsx`

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | justifyContent | RN-wrapper | `'space-between'` | `Modifier.wrapContentSize(unbounded = true)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | paddingHorizontal | RN-wrapper | `24` | `Modifier.padding(horizontal = 24.dp)` | `.padding(.horizontal, 24)` | ESCALATE — `space.xl` |
| Layout | paddingTop | RN-wrapper | `max(insets.top, 24)` | `max(SafeAreaPadding.top, 24.dp)` | `.safeAreaPadding(.top).padding(.top, 24)` | ESCALATE — `space.xl` |
| Layout | paddingBottom | RN-wrapper | `max(insets.bottom, 40)` | `max(SafeAreaPadding.bottom, 40.dp)` | `.safeAreaPadding(.bottom).padding(.bottom, 40)` | ESCALATE — propose `space.2xl + 8` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — Logo Container

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | `120` | `Modifier.width(120.dp)` | `.frame(width: 120)` | ESCALATE — propose `size.logoContainer = 120` |
| Layout | height | RN-wrapper | `120` | `Modifier.height(120.dp)` | `.frame(height: 120)` | ESCALATE — propose `size.logoContainer = 120` |
| Layout | justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.Center)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | borderRadius | RN-wrapper | `radius.xl` = 16 | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` (16) |
| Visual | shadow | RN-wrapper | `elevation[3]` | `Modifier.shadow(elevation = 3.dp)` | `.shadow(color:.black.opacity(0.08), radius:8, y:4)` | `elevation.light.3` |

### Layout — Content Area

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | flex | RN-wrapper | `flex: 1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| Layout | justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.Center)` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| Layout | alignItems | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | maxWidth | RN-wrapper | `400` | `Modifier.requiredWidthIn(max = 400.dp)` | `.frame(maxWidth: 400)` | ESCALATE — propose `size.contentMaxWidth = 400` |
| Layout | paddingHorizontal | RN-wrapper | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |

### Typography — Welcome Text

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | RN-wrapper | `headlineLarge` (Paper) | `MaterialTheme.typography.headlineLarge` | `.font(.headlineLarge)` | ESCALATE — map to `type.display.sm` (36) |
| Typography | fontSize | headlineLarge | 32 | `32.sp` | `32` | ESCALATE — `type.display.sm.fontSize = 36` (closest) |
| Typography | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Typography — Body Text

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | RN-wrapper | `bodyLarge` (Paper) | `MaterialTheme.typography.bodyLarge` | `.font(.bodyLarge)` | ESCALATE — map to `type.body.md` (16) |
| Typography | fontSize | bodyLarge | 16 | `16.sp` | `16` | `type.body.md.fontSize` |
| Typography | lineHeight | RN-wrapper | `24` | `LineHeightStyle(24.sp)` | `.lineSpacing(24 - 16)` = 8 | `type.body.md.lineHeight` |
| Typography | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| Layout | marginTop | RN-wrapper | `space.md` = 12 | `Modifier.padding(top = 12.dp)` | `.padding(.top, 12)` | `space.md` |

### Layout — Feature Carousel

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | gap | RN-wrapper | `space.lg` = 16 | `Spacer(Modifier.height(16.dp))` | `Spacer(minLength: 16)` | `space.lg` |
| Animation | crossfade | RN-wrapper | `Animated.timing` 250/350ms | `AnimatedVisibility(alpha)` | `.opacity(...)` | n/a |
| Animation | autoAdvance | RN-wrapper | `setInterval` 4500ms | `LaunchedEffect` with `delay(4500)` | `.onReceive(timer)` | n/a |

### Typography — Feature Title

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Typography | variant | RN-wrapper | `headlineSmall` (Paper) | `MaterialTheme.typography.headlineSmall` | `.font(.headlineSmall)` | ESCALATE — map to `type.heading.lg` (20) |
| Typography | textAlign | RN-wrapper | `'center'` | `textAlign = TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| Typography | color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| Layout | marginBottom | RN-wrapper | `space.sm` = 8 | `Modifier.padding(bottom = 8.dp)` | `.padding(.bottom, 8)` | `space.sm` |

### Layout — Carousel Dots

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | gap | RN-wrapper | `space.sm` = 8 | `Spacer(Modifier.width(8.dp))` | `Spacer(minLength: 8)` | `space.sm` |
| Layout | marginTop | RN-wrapper | `24` | `Modifier.padding(top = 24.dp)` | `.padding(.top, 24)` | ESCALATE — `space.xl` |
| Layout | dotSize | RN-wrapper | `6 × 6` | `Modifier.size(6.dp)` | `.frame(width: 6, height: 6)` | ESCALATE — propose `size.carouselDot = 6` |
| Visual | dotColor (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | dotColor (inactive) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Visual | borderRadius | RN-wrapper | `radius.full` = 9999 | `CircleShape` | `Circle()` | `radius.full` |

### Layout — Action Area

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | maxWidth | RN-wrapper | `400` | `Modifier.requiredWidthIn(max = 400.dp)` | `.frame(maxWidth: 400)` | ESCALATE — `size.contentMaxWidth = 400` |
| Animation | crossfade | RN-wrapper | `Animated.timing` 250/300ms | `AnimatedVisibility(alpha)` | `.opacity(...)` | n/a |

### Layout — Progress Pill

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | height | RN-wrapper | `4` | `Modifier.height(4.dp)` | `.frame(height: 4)` | ESCALATE — propose `size.progressHeight = 4` |
| Visual | backgroundColor | RN-wrapper | `semantic.color.secondary.default` | `LaneShadowTheme.colors.secondary` | `theme.colors.secondary` | `color.secondary.default` |
| Visual | borderRadius | RN-wrapper | `radius.full` = 9999 | `RoundedCornerShape(percent = 50)` | `Capsule()` | `radius.full` |

### Layout — Progress Fill

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | width | RN-wrapper | `${percent}%` | `Modifier.fillMaxWidth(percent / 100f)` | `.frame(width: percent * maxWidth)` | n/a |
| Visual | backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| Visual | borderRadius | RN-wrapper | `radius.full` = 9999 | `RoundedCornerShape(percent = 50)` | `Capsule()` | `radius.full` |

### Typography — Progress Meta

| Category | Property | Source | Value in source | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|---|
| Layout | gap | RN-wrapper | row with `space-between` | `Arrangement.SpaceBetween` | `.frame(maxWidth: .infinity)` | n/a |
| Layout | marginTop | RN-wrapper | `space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |
| Typography | variant | RN-wrapper | `bodySmall` (Paper) | `MaterialTheme.typography.bodySmall` | `.font(.bodySmall)` | ESCALATE — map to `type.body.sm` (14) |
| Typography | color (label) | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| Typography | color (percent) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |

---

## DESIGN NOTES

- Two states: idle (welcome text) and downloading (carousel + progress)
- Logo with shadow and primary background
- Feature carousel auto-advances during download
- Progress pill shows download percentage
- Cross-fade animation between button and progress (300ms)
- Centered content with max width

---

## VERIFICATION GATES

- Logo centered and sized correctly
- Welcome text centered
- Carousel auto-advances
- Progress updates correctly
- Cross-fade smooth
- Safe areas respected

---

## DEPENDENCIES

- UI-001 (core theme contract)
- LaneShadowLogo component
- Button component
- Animation system (Android `AnimatedVisibility`, iOS `.opacity`)

---

## COMPOSITION

- WelcomeScreen = Column + [Logo, ContentArea, ActionArea]
- ContentArea = WelcomeText OR FeatureCarousel
- ActionArea = Button OR ProgressPill
- FeatureCarousel = [Emoji, Title, Body, Dots]
