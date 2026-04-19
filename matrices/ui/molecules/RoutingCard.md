# RoutingCard - STYLE PROPERTIES MATRIX

**Component:** RoutingCard
**RN Source:** `react-native/components/chat/routing-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `react-native-reanimated`, `Convex useQuery`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/chat/routing-card.tsx` | Public API, route planning state display |
| RouteAttachmentCard | `react-native/components/chat/route-attachment-card.tsx` | Route options in completed state |
| Reanimated | `react-native-reanimated` | Phase pill pulse animation |
| Convex | `convex/react` | Reactive route plan query |

---

## COMPOSITION

**Child atoms:**
- `PhasePill` - Phase indicator pills (Reading, Finding, Weather, Building)
- `RouteAttachmentCard` - Route option cards (completed state)
- `View` - Card containers, phase pill row
- `Text` - Status messages, error messages, labels

**Composition pattern:** State card with 5 visual states: pending (subtle), running (phase pills + pulse), completed (route list), failed (red-tinted), cancelled (muted).

**Layout:** Vertical stack. Running state has horizontal phase pill row + status message. Completed state has vertical stack of RouteAttachmentCards.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| minWidth | RN-wrapper | `'90%'` | `Modifier.fillMaxWidth(0.9f)` | `.frame(minWidth: 0.9)` | n/a |
| maxWidth | RN-wrapper | `'100%'` | `Modifier.fillMaxWidth()` | `.frame(maxWidth: .infinity)` | n/a |

### Visual — Pending/Cancelled Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` | `LaneShadowTheme.shapes.medium` | `.cornerRadius(8)` | `radius.md` (8) |
| padding | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(12)` | `space.md` (12) |

### Visual — Running Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` | `LaneShadowTheme.shapes.medium` | `.cornerRadius(8)` | `radius.md` (8) |
| padding | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(12)` | `space.md` (12) |
| gap | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `8` | `space.sm` (8) |

### Visual — Failed Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `${semantic.color.danger.default}1A` (10% alpha) | `LaneShadowTheme.colors.danger.copy(alpha = 0.1f)` | `theme.colors.danger.opacity(0.1)` | `color.danger.default` |
| borderWidth | RN-wrapper | `1` | `1.dp` | `1` | n/a |
| borderColor | RN-wrapper | `${semantic.color.danger.default}4D` (30% alpha) | `LaneShadowTheme.colors.danger.copy(alpha = 0.3f)` | `theme.colors.danger.opacity(0.3)` | `color.danger.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` | `LaneShadowTheme.shapes.medium` | `.cornerRadius(8)` | `radius.md` (8) |
| padding | RN-wrapper | `semantic.space.md` | `LaneShadowTheme.spacing.medium` | `.padding(12)` | `space.md` (12) |

### Layout — Pill Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| flexWrap | RN-wrapper | `'wrap'` | `Modifier.wrapContentWidth(...)` | n/a (iOS auto-wraps) | n/a |
| gap | RN-wrapper | `8` | `8.dp` | `8` | `space.xs` (4) + 4 |

### Visual — Phase Pill

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor (active) | RN-wrapper | `semantic.color.primary.default` | `LaneShadowTheme.colors.primary` | `theme.colors.primary` | `color.primary.default` |
| backgroundColor (inactive) | RN-wrapper | `semantic.color.surfaceVariant.default` | `LaneShadowTheme.colors.surfaceVariant` | `theme.colors.surfaceVariant` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.full` | `CircleShape` | `.cornerRadius(9999)` | `radius.full` |
| paddingHorizontal | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `.padding(.horizontal, 8)` | `space.sm` (8) |
| paddingVertical | RN-wrapper | `semantic.space.xs` | `LaneShadowTheme.spacing.extraSmall` | `.padding(.vertical, 4)` | `space.xs` (4) |

### Visual — Phase Pill Animation

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| transform (active) | RN-wrapper | `scale: 1.0 → 1.05 → 1.0` (repeat) | `Modifier.scale(animateFloatAsState(...))` | `.scaleEffect(pulse)` | n/a |
| duration (each) | RN-wrapper | `600ms` | `600ms` | `0.6s` | n/a |
| repeat | RN-wrapper | `-1` (infinite) | `repeatMode = RepeatMode.Infinite` | `.repeatForever(...)` | n/a |

### Typography — Phase Pill Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.label.sm.fontSize` | `LaneShadowTheme.typography.labelSmall.fontSize` | `Font.caption` | `type.label.sm.fontSize` |
| color (active) | RN-wrapper | `semantic.color.onPrimary.default` | `LaneShadowTheme.colors.onPrimary` | `theme.colors.onPrimary` | `color.onPrimary.default` |
| color (inactive) | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Typography — Status Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.sm.fontSize` | `LaneShadowTheme.typography.bodySmall.fontSize` | `Font.footnote` | `type.body.sm.fontSize` |
| color | RN-wrapper | `semantic.color.onSurface.muted` | `LaneShadowTheme.colors.onSurfaceMuted` | `theme.colors.onSurfaceMuted` | `color.onSurface.muted` |

### Typography — Failed Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.sm.fontSize` | `LaneShadowTheme.typography.bodySmall.fontSize` | `Font.footnote` | `type.body.sm.fontSize` |
| color | RN-wrapper | `semantic.color.danger.default` | `LaneShadowTheme.colors.danger` | `theme.colors.danger` | `color.danger.default` |

### Typography — Cancelled Message

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| fontSize | RN-wrapper | `semantic.type.body.sm.fontSize` | `LaneShadowTheme.typography.bodySmall.fontSize` | `Font.footnote` | `type.body.sm.fontSize` |
| color | RN-wrapper | `semantic.color.onSurface.subtle` | `LaneShadowTheme.colors.onSurfaceSubtle` | `theme.colors.onSurfaceSubtle` | `color.onSurface.subtle` |

### Layout — Completed Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| gap | RN-wrapper | `semantic.space.sm` | `LaneShadowTheme.spacing.small` | `8` | `space.sm` (8) |

---

## NOTES

- **5 visual states:** pending, running, completed, failed, cancelled
- **Phase system:** 4 phases (Reading, Finding, Weather, Building) with pills
- **Active phase:** Only one phase pill active at a time, others muted
- **Pulse animation:** Active phase pill scales 1.0 ↔ 1.05 every 600ms (respects reduce motion)
- **Completed state:** Morphs into list of RouteAttachmentCards for each route option
- **Signature state:** Running card with phase pills is the iconic visual
- **Reactive query:** Uses Convex `useQuery` to subscribe to route_plans table
- **State transitions:** Key by status so React fully unmounts old state (prevents "Attempt to recycle a mounted view" crash)
- **Undo hint:** DeleteRouteDialog shows "You can undo this within 5 seconds" - companion to routing completion
- **Accessibility:** Live region announces phase changes and status messages
- **Default selection:** First route option auto-selected when no selection exists
- **Map fit:** Selecting route triggers `requestFitToRouteWithReset()` to zoom to route
- **View on map:** Optional callback for "View on map" button on route cards
- **Width constraint:** 90% minimum width for chat transcript alignment
- **Error opacity:** Failed card uses 10% danger background, 30% danger border (hex suffixes: `1A` = 10%, `4D` = 30%)
