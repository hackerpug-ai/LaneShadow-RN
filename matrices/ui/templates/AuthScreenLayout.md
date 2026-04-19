# AuthScreenLayout - STYLE PROPERTIES MATRIX

**Component:** AuthScreenLayout
**RN Source:** `react-native/components/auth/auth-screen-layout.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-gesture-handler/src/ScrollView.tsx`, `node_modules/react-native-paper/src/components/Typography/Text.tsx`, `node_modules/react-native/Libraries/Image/ImageBackground.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/auth/auth-screen-layout.tsx` | Auth screen layout with branding and decoration |
| LaneShadowLogo | `react-native/components/auth/lane-shadow-logo.tsx` | Logo atom (see matrices/ui/atoms/LaneShadowLogo.md) |
| TopographicBackground | `react-native/components/auth/topographic-background.tsx` | Topographic decoration molecule (see matrices/ui/molecules/TopographicBackground.md) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Title and subtitle typography |
| ScrollView (RN GH) | `node_modules/react-native-gesture-handler/src/ScrollView.tsx` | Scrollable content area |
| ImageBackground (RN) | `node_modules/react-native/Libraries/Image/ImageBackground.js` | Optional texture background |

---

## LAYOUT COMPOSITION

**Purpose:** Auth screen layout with branding, decorative background, centered content, and card area

**Composition pattern:**
- Root View with background color
- Optional ImageBackground for texture (opacity 0.22)
- Scrim overlay (opacity 0.45) for darkening
- TopographicBackground decoration (opacity 0.1)
- Optional primary glow blob (opacity 0.08)
- ScrollView with centered content
- Brand mark: primary circle container with logo
- Header text: title (headlineLarge) and subtitle (titleMedium)
- Card area for auth form children

**Layout:** Full-screen scrollable layout with decorative background layers and centered brand/content

---

## STYLE PROPERTIES MATRIX

### Layout — Root Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.background.default` | `LaneShadowTheme.colors.background` | `theme.colors.background` | `color.background.default` |

### Layout — ImageBackground (optional)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true)` | `.frame(maxWidth: .infinity, maxHeight: .infinity).overlay(...)` | n/a |
| resizeMode | RN-wrapper | `'cover'` | `Modifier.fillMaxSize()` | `.resizable().scaledToFill()` | n/a |
| opacity | RN-wrapper | `0.22` | `Modifier.alpha(0.22f)` | `.opacity(0.22)` | ESCALATE — propose `opacity.authTexture = 0.22` |

### Visual — Scrim Overlay (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.scrim.default` | `LaneShadowTheme.colors.scrim` | `theme.colors.scrim` | `color.scrim.default` |
| opacity | RN-wrapper | `0.45` | `Modifier.alpha(0.45f)` | `.opacity(0.45)` | ESCALATE — propose `opacity.authScrim = 0.45` |
| pointerEvents | RN-wrapper | `'none'` | `Modifier.pointerInput(Unit, ...) { detectTapGestures { } }` | `.allowsHitTesting(false)` | n/a |

### Layout — TopographicBackground (optional)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| opacity | RN-wrapper | `0.1` | `Modifier.alpha(0.1f)` | `.opacity(0.1)` | ESCALATE — propose `opacity.authTopographic = 0.1` |

### Layout — Primary Glow (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| position | RN-wrapper | `'absolute'` | `Modifier.wrapContentSize(unbounded = true).offset(x = (-120).dp, y = (-160).dp)` | `.frame(width: 520, height: 520).offset(x: -120, y: -160)` | n/a |
| left | RN-wrapper | `-120` | Included above | Included above | n/a |
| top | RN-wrapper | `-160` | Included above | Included above | n/a |
| height | RN-wrapper | `520` | `Modifier.height(520.dp)` | `.frame(height: 520)` | ESCALATE — propose `size.authGlow = 520` |
| width | RN-wrapper | `520` | `Modifier.width(520.dp)` | `.frame(width: 520)` | ESCALATE — propose `size.authGlow = 520` |
| borderRadius | RN-wrapper | `520` | `RoundedCornerShape(260.dp)` / `CircleShape` | `Circle()` | n/a |
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| opacity | RN-wrapper | `0.08` | `Modifier.alpha(0.08f)` | `.opacity(0.08)` | ESCALATE — propose `opacity.authGlow = 0.08` |
| pointerEvents | RN-wrapper | `'none'` | `Modifier.pointerInput(Unit, ...) { detectTapGestures { } }` | `.allowsHitTesting(false)` | n/a |

### Layout — ScrollView

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| contentContainerStyle padding | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |

### Layout — Centered Content (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.layoutPriority(1)` | n/a |
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| maxWidth | RN-wrapper | `480` | `Modifier.requiredWidthIn(max = 480.dp)` | `.frame(maxWidth: 480)` | ESCALATE — propose `layout.authContentMaxWidth = 480` |
| alignItems | RN-wrapper | `'stretch'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterVertically)` | `.frame(alignment: .center)` | n/a |
| alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| gap | RN-wrapper | `semantic.space.xl` (= 24) | `Arrangement.spacedBy(24.dp)` / `Modifier.padding(end = 24.dp)` between items | `spacing(24)` | `space.xl` |
| paddingVertical | RN-wrapper | `semantic.space.lg` (= 16) | `Modifier.padding(vertical = 16.dp)` | `.padding(.vertical, 16)` | `space.lg` |

### Layout — Brand Mark (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| borderRadius | RN-wrapper | `semantic.radius.xl` (= 16) | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.xl` |
| height | RN-wrapper | `semantic.space['4xl']` (= 64) | `Modifier.height(64.dp)` | `.frame(height: 64)` | `space.4xl` |
| width | RN-wrapper | `semantic.space['4xl']` (= 64) | `Modifier.width(64.dp)` | `.frame(width: 64)` | `space.4xl` |
| elevation | RN-wrapper | `semantic.elevation[3]` | `Modifier.shadow(elevation = 3.dp, ...)` | `.shadow(...)` | `elevation[3]` |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` + vertical | `.frame(alignment: .center)` | n/a |
| justifyContent | RN-wrapper | `'center'` | Included above | Included above | n/a |
| alignSelf | RN-wrapper | `'center'` | `Modifier.align(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |

### Layout — Header Text (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` | `.frame(maxWidth: .infinity, alignment: .center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` (= 8) | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(end = 8.dp)` between items | `spacing(8)` | `space.sm` |

### Typography — Title (Paper Text variant=headlineLarge)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---||---|---|
| variant | RN-wrapper | `headlineLarge` | `MaterialTheme.typography.headlineLarge` | Verify against Paper source | n/a |
| fontSize | Paper headlineLarge | Verify in source | (verify) | (verify) | ESCALATE — verify token |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |

### Typography — Subtitle (Paper Text variant=titleMedium)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| variant | RN-wrapper | `titleMedium` | `MaterialTheme.typography.titleMedium` | Verify against Paper source | n/a |
| fontSize | Paper titleMedium | Verify in source | (verify) | (verify) | ESCALATE — verify token |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| textAlign | RN-wrapper | `'center'` | `TextStyle(textAlign = TextAlign.Center)` | `.multilineTextAlignment(.center)` | n/a |

### Layout — Card Area (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| width | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

---

## NOTES

- **Background layers:** Texture (optional), scrim (always), topographic (always), glow (optional)
- **Texture:** Optional backgroundImage prop with 22% opacity
- **Scrim:** 45% opacity scrim for darkening texture
- **Topographic:** 10% opacity decorative pattern
- **Glow:** Primary color blob, 520px, 8% opacity, positioned -120/-160 (optional)
- **Brand mark:** 64px circle with primary background, elevation[3], logo centered
- **Logo size:** 50px (passed to LaneShadowLogo)
- **Title:** headlineLarge, centered, onSurface.default
- **Subtitle:** titleMedium, centered, onSurface.muted
- **Max content width:** 480px centered
- **Spacing:** 24px gap between brand/title/card, 16px vertical padding
- **ScrollView:** Gesture handler version for better performance
- **TestID:** None at layout level (propagate to children)
