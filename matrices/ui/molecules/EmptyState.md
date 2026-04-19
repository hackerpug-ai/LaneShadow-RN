# EmptyState - STYLE PROPERTIES MATRIX

**Component:** EmptyState
**RN Source:** `react-native/components/ui/empty-state.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/ui/empty-state.tsx` | Public API, layout, accessibility |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Empty state icon (see `matrices/ui/atoms/IconSymbol.md`) |
| Button | `react-native/components/ui/button.tsx` | Optional CTA button (see `matrices/ui/atoms/Button.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Headline and body text |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Large decorative icon (see `matrices/ui/atoms/IconSymbol.md`)
- `Button` - Optional call-to-action button (see `matrices/ui/atoms/Button.md`)

**Composition pattern:** Vertical column (flex: 1) with centered content. Icon at top, headline/body text block below, optional CTA button at bottom. Icon hidden from accessibility (decorative), text block has combined accessibility label.

**Layout:** Vertical column (`flexDirection: 'column'`), center alignment, justify-center (flex: 1).

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| alignItems | RN-wrapper | `'center'` | `horizontalAlignment = Alignment.CenterHorizontally` | n/a | n/a |
| justifyContent | RN-wrapper | `'center'` | `verticalArrangement = Arrangement.Center` | n/a | n/a |

### Layout — Icon

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| size | RN-wrapper | `64` | `Modifier.size(64.dp)` | `.frame(width: 64, height: 64)` | ESCALATE — propose `iconSize.xxl = 64` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |
| accessibility | RN-wrapper | `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` | `Modifier.semantics { invisible = true }` | `.accessibilityElement(children: .ignore)` | n/a |

### Layout — Text Block

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| marginTop | RN-wrapper | `semantic.space.lg` = 16 | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |
| accessible | RN-wrapper | `true` | `Modifier.semantics { mergeDescendants = true }` | `.accessibilityElement(children: .combine)` | n/a |
| accessibilityLabel | RN-wrapper | `${headline}. ${body}` | `Modifier.semantics { text = AnnotatedString("$headline. $body") }` | `.accessibilityLabel("$headline. $body")` | n/a |

### Typography — Headline

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `titleMedium` (Paper) | `MaterialTheme.typography.titleMedium` → map to LaneShadow | `.font(.title2)` | ESCALATE — map Paper `titleMedium` to LaneShadow tokens |
| fontSize | Paper titleMedium | varies | `20.sp` (typical) | `20` | `type.title.sm.fontSize` or `20.sp` literal |
| color | RN-wrapper | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |

### Typography — Body

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `bodyMedium` (Paper) | `MaterialTheme.typography.bodyMedium` → map to LaneShadow | `.font(.body)` | ESCALATE — map Paper `bodyMedium` to LaneShadow tokens |
| fontSize | Paper bodyMedium | varies | `14.sp` (typical) | `14` | `type.body.sm.fontSize` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |
| textAlign | RN-wrapper | `'center'` | `TextAlign.Center` | `.multilineTextAlignment(.center)` | n/a |
| marginTop | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(top = 8.dp)` | `.padding(.top, 8)` | `space.sm` |

### Layout — CTA Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `default` | `ButtonVariant.Default` | `.default` | n/a |
| size | RN-wrapper | `lg` | `ButtonSize.Lg` | `.lg` | n/a |
| marginTop | RN-wrapper | `semantic.space.xl` = 24 | `Modifier.padding(top = 24.dp)` | `.padding(.top, 24)` | `space.xl` |
| testID | RN-wrapper | prop or `'empty-state-cta'` | `Modifier.testTag(testID)` | `.accessibilityIdentifier(testID)` | n/a |

### Interaction — Button

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| onPress | RN-wrapper | `onCtaPress` prop | `onClick = { onCtaPress }` | `.onTapGesture { onCtaPress() }` | n/a |

---

## NOTES

- **Icon accessibility:** Icon marked as decorative (hidden from accessibility), text block provides semantic content
- **Combined accessibility:** Text block has combined accessibility label with headline and body for screen readers
- **Centered layout:** All content centered horizontally and vertically in flex container
- **Large icon:** 64px icon for visual emphasis
- **Paper variants:** Uses `titleMedium` and `bodyMedium` from React Native Paper; map to LaneShadow equivalents
- **Optional CTA:** Button renders only when both `onCtaPress` and `ctaLabel` provided
- **Use cases:** Empty saved routes, no search results, offline state, onboarding completion
