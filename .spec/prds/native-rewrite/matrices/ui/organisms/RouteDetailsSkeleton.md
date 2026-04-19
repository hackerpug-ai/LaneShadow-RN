# RouteDetailsSkeleton - STYLE PROPERTIES MATRIX

**Component:** RouteDetailsSkeleton
**RN Source:** `react-native/components/skeleton/route-details-skeleton.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/skeleton/route-details-skeleton.tsx` | Public API, loading state placeholder |
| Skeleton | `react-native/components/ui/skeleton.tsx` | Shimmer effect placeholder (see `matrices/ui/atoms/Skeleton.md`) |
| CardSkeleton | `react-native/components/skeleton/card-skeleton.tsx` | Card-shaped placeholder (see `matrices/ui/molecules/CardSkeleton.md`) |
| LabelSkeleton | `react-native/components/skeleton/label-skeleton.tsx` | Text line placeholder (see `matrices/ui/molecules/LabelSkeleton.md`) |

---

## COMPOSITION ANALYSIS

**Child molecules/atoms:**
- `CardSkeleton` - Card-shaped shimmer placeholders
- `LabelSkeleton` - Text line shimmer placeholders
- `Skeleton` - Generic shimmer elements

**Composition pattern:**
- Mimics RouteDetailsSheet layout with shimmer placeholders
- Header skeleton (title + badge)
- Stat row skeletons (distance, duration, elevation)
- Wind badge skeleton
- Button skeleton at bottom
- All skeleton elements use pulse animation

**Layout:** Vertical stack matching RouteDetailsSheet layout with 16dp padding

---

## STATE & BEHAVIOR

| State | Type | Source | Native Translation |
|---|---|---|---|---|
| (none - presentational) | - | - | - |

**Side effects:**
- (none - purely presentational)

**Callback signatures:**
- (none - no callbacks)

---

## STYLE PROPERTIES MATRIX

### Layout — Skeleton Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| paddingHorizontal | constant | `16` | `Modifier.padding(horizontal = 16.dp)` | `.padding(.horizontal, 16)` | `space.lg` |
| paddingVertical | constant | `16` | `Modifier.padding(vertical = 16.dp)` | `.padding(.vertical, 16)` | `space.lg` |
| gap | constant | `16` | `Arrangement.spacedBy(16.dp)` / `Modifier.padding(bottom = 16.dp)` between elements | `spacing(16)` | `space.lg` |

### Layout — Header Skeleton

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | StyleSheet | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | constant | `8` | `Arrangement.spacedBy(8.dp)` | `spacing(8)` | `space.sm` |
| marginBottom | constant | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Visual — Title Skeleton

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | constant | `120` | `Modifier.width(120.dp)` | `.frame(width: 120)` | ESCALATE — propose `skeleton.titleWidth = 120` |
| height | constant | `28` | `Modifier.height(28.dp)` | `.frame(height: 28)` | ESCALATE — propose `skeleton.titleHeight = 28` |
| borderRadius | constant | `4` | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |

### Visual — Badge Skeleton

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | constant | `60` | `Modifier.width(60.dp)` | `.frame(width: 60)` | ESCALATE — propose `skeleton.badgeWidth = 60` |
| height | constant | `24` | `Modifier.height(24.dp)` | `.frame(height: 24)` | ESCALATE — propose `skeleton.badgeHeight = 24` |
| borderRadius | constant | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |

### Layout — Stat Row Skeletons

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | StyleSheet | `'row'` | `Row(...)` | `HStack` | n/a |
| gap | constant | `12` | `Arrangement.spacedBy(12.dp)` | `spacing(12)` | `space.md` |
| marginBottom | constant | `16` | `Modifier.padding(bottom = 16.dp)` | `.padding(.bottom, 16)` | `space.lg` |

### Visual — Stat Skeleton

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | constant | `80` | `Modifier.width(80.dp)` | `.frame(width: 80)` | ESCALATE — propose `skeleton.statWidth = 80` |
| height | constant | `20` | `Modifier.height(20.dp)` | `.frame(height: 20)` | ESCALATE — propose `skeleton.statHeight = 20` |
| borderRadius | constant | `4` | `RoundedCornerShape(4.dp)` | `RoundedRectangle(cornerRadius: 4)` | `radius.sm` |

### Visual — Button Skeleton

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | StyleSheet | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |
| height | constant | `48` | `Modifier.height(48.dp)` | `.frame(height: 48)` | ESCALATE — propose `skeleton.buttonHeight = 48` |
| borderRadius | constant | `8` | `RoundedCornerShape(8.dp)` | `RoundedRectangle(cornerRadius: 8)` | `radius.md` |
| marginTop | constant | `16` | `Modifier.padding(top = 16.dp)` | `.padding(.top, 16)` | `space.lg` |

---

## NOTES

- **Loading placeholder:** Displays while route details are loading
- **Matches layout:** Mimics RouteDetailsSheet structure
- **Shimmer effect:** Uses Skeleton component with pulse animation
- **Child skeletons:** CardSkeleton, LabelSkeleton, Skeleton components
- **Gap spacing:** 16dp gap between skeleton sections
- **Theme integration:** All colors sourced from semantic theme tokens
- **No state:** Purely presentational component with no props
- **Delegation:** All shimmer effects delegated to child Skeleton components
- **Accessibility:** Hidden from accessibility tree (loading state only)
