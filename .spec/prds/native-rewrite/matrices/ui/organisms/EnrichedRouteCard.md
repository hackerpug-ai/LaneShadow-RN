# EnrichedRouteCard - STYLE PROPERTIES MATRIX

**Component:** EnrichedRouteCard
**RN Source:** `react-native/components/enrichment/enriched-route-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `react-native-reanimated`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/enrichment/enriched-route-card.tsx` | Public API, enriched route display |
| Badge | `react-native/components/ui/badge.tsx` | Status badges (see `matrices/ui/atoms/Badge.md`) |
| StatRow | `react-native/components/ui/stat-row.tsx` | Route statistics (see `matrices/ui/molecules/StatRow.md`) |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Icons (see `matrices/ui/atoms/IconSymbol.md`) |
| Reanimated | `react-native-reanimated` | Fade-in animations |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `Badge` - Status badges (fast, extended, cached)
- `StatRow` - Distance, duration, elevation stats
- `IconSymbol` - Route type icons, enrichment status icons

**Composition pattern:**
- Card layout with press interaction
- Header with route label and status badge
- Stat rows for route metrics
- Enrichment status indicator (progress/complete)
- Fade-in animation on mount
- Press feedback for selection
- Creative label reveal (staggered animation)
- Highlight tags (badges) stagger reveal

**Layout:** Vertical card with 16dp padding, 8dp gap between elements

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|---|
| (none - controlled component) | - | - | - |

**Side effects:**
- Fade-in animation: `Animated.View` with `FadeIn` → `AnimatedVisibility(...enter = fadeIn())` / `.transition(.opacity)` animation
- Stagger animations: Sequential delays for child elements → `AnimationStagger` / `.animation(.easeInOut.delay(...))` staggered

**Callback signatures:**
- `onPress: (routeId: string) => void` → `(routeId: String) -> Unit` / `(String) -> Void`

---

## STYLE PROPERTIES MATRIX

### Layout — Card Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | semantic | `semantic.color.card.default` | `LaneShadowTheme.colors.card` | `theme.colors.card` | `color.card.default` |
| borderRadius | semantic | `semantic.radius.lg` (= 16) | `RoundedCornerShape(16.dp)` | `RoundedRectangle(cornerRadius: 16)` | `radius.lg` |
| padding | constant | `16` | `Modifier.padding(16.dp)` | `.padding(16)` | `space.lg` |
| gap | constant | `8` | `Arrangement.spacedBy(8.dp)` / `Modifier.padding(bottom = 8.dp)` between elements | `spacing(8)` | `space.sm` |
| elevation | semantic | `semantic.elevation[1]` | `Modifier.shadow(elevation = 1.dp, ...)` | `.shadow(...)` | `elevation.light.1` |

### Visual — Pressed State

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| opacity (pressed) | constant | `0.8` | `Modifier.alpha(if (pressed) 0.8f else 1f)` | `.opacity(pressed ? 0.8 : 1)` | `opacity.pressed` |

### Layout — Header Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | StyleSheet | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | StyleSheet | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| justifyContent | StyleSheet | `'space-between'` | `Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween` | `.frame(maxWidth: .infinity).spacing(...)` | n/a |

### Typography — Route Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | react-native-paper | `titleMedium` | `LaneShadowTheme.typography.titleMedium` | `theme.typography.titleMedium` | `type.title.md` |
| color | semantic | `semantic.color.onSurface.default` | `LaneShadowTheme.colors.onSurface` | `theme.colors.onSurface` | `color.onSurface.default` |

### Layout — Enrichment Status Badge

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| alignSelf | StyleSheet | `'flex-start'` | `Modifier.align(Alignment.Start)` | `.frame(maxWidth: .infinity, alignment: .leading)` | n/a |

### Layout — Stat Rows

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | constant | `4` | `Arrangement.spacedBy(4.dp)` / `Modifier.padding(bottom = 4.dp)` between rows | `spacing(4)` | `space.xs` |

### Animation — Fade In

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| entering | Reanimated | `FadeIn.duration(300)` | `AnimatedVisibility(...enter = fadeIn(tween(300)))` | `.transition(.opacity).animation(.easeInOut(duration: 0.3))` | `motion.duration.normal` |

---

## NOTES

- **Enrichment status:** Shows fast (teal), extended (purple), or cached (gray) badge
- **Progress indicator:** Shows enrichment progress when status is 'enriching'
- **Creative label:** Staggered fade-in for route creative label
- **Highlight tags:** Staggered fade-in for highlight badges
- **Rationale reveal:** Expandable section for enrichment rationale
- **Press feedback:** Opacity change on press for visual feedback
- **Child components:** Badge, StatRow, IconSymbol
- **Gap spacing:** 8dp gap between card elements
- **Card elevation:** Level 1 shadow for depth
- **Theme integration:** All colors sourced from semantic theme tokens
- **Delegation:** Most styling delegated to child components
- **Animation:** Fade-in on mount, stagger animations for child reveals
