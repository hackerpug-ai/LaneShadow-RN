# PlanningCard - STYLE PROPERTIES MATRIX

**Component:** PlanningCard
**RN Source:** `react-native/components/chat/cards/planning-card.tsx`
**Framework Primitives:** `node_modules/react-native/Libraries/Components/View/View.js`, `node_modules/react-native-reanimated/`

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/chat/cards/planning-card.tsx` | Public API, status display, streaming animation |
| IconSymbol | `react-native/components/ui/icon-symbol.tsx` | Status icons (check, close, map-marker-path) (see `matrices/ui/atoms/IconSymbol.md`) |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Label typography |
| Reanimated | `node_modules/react-native-reanimated/` | Pulsing dot animation for streaming state |

---

## COMPOSITION

**Child atoms:**
- `IconSymbol` - Status icon (check-circle-outline, close-circle-outline, map-marker-path) (see `matrices/ui/atoms/IconSymbol.md`)

**Composition pattern:** Horizontal row with icon, label (flex: 1), and pulsing dot (when streaming). Card has surfaceVariant background with streaming overlay (primary color at 8% opacity) during streaming state. Three states: streaming (pulsing dot, streaming overlay), complete (check icon, static), failed (X icon, static).

**Layout:** Single-row card (minHeight 44px) with horizontal flex layout.

---

## STYLE PROPERTIES MATRIX

### Layout — Container

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| minWidth | RN-wrapper | `'90%'` | `Modifier.fillMaxWidth(0.9f)` | `.frame(minWidth: 0)` (in HStack) | n/a |

### Layout — Card

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| minHeight | RN-wrapper | `44` | `Modifier.heightIn(min = 44.dp)` or `Modifier.defaultMinSize(minHeight = 44.dp)` | `.frame(minHeight: 44)` | ESCALATE — propose `size.touchTarget = 44` |
| justifyContent | RN-wrapper | `'center'` | `contentAlignment = Alignment.CenterVertically` (for Row) | `.alignment(.center)` (for VStack content) | n/a |
| overflow | RN-wrapper | `'hidden'` | `Modifier.clipToBounds()` | `.clipped()` | n/a |
| position | RN-wrapper | `'relative'` | `Box(modifier = Modifier)` (default is relative) | default | n/a |
| backgroundColor | RN-wrapper | `semantic.color.surfaceVariant.default` | `MaterialTheme.colorScheme.surfaceVariant` | `Color(.systemGray6)` | `color.surfaceVariant.default` |
| borderRadius | RN-wrapper | `semantic.radius.md` = 8 | `Modifier.clip(RoundedCornerShape(8.dp))` | `.clipShape(RoundedRectangle(cornerRadius: 8))` | `radius.md` |
| paddingHorizontal | RN-wrapper | `semantic.space.md` = 12 | `Modifier.padding(horizontal = 12.dp)` | `.padding(.horizontal, 12)` | `space.md` |
| paddingVertical | RN-wrapper | `semantic.space.sm` = 8 | `Modifier.padding(vertical = 8.dp)` | `.padding(.vertical, 8)` | `space.sm` |

### Layout — Header Row

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| flexDirection | RN-wrapper | `'row'` | `Row(...)` | `HStack` | n/a |
| alignItems | RN-wrapper | `'center'` | `verticalAlignment = Alignment.CenterVertically` | `.alignment(.center)` | n/a |
| gap | RN-wrapper | `semantic.space.sm` = 8 | `Arrangement.spacedBy(8.dp)` | `.spacing(8)` | `space.sm` |

### Layout — Pulsing Dot

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| width | RN-wrapper | `6` | `Modifier.size(6.dp)` | `.frame(width: 6, height: 6)` | ESCALATE — propose `size.pulsingDot = 6` |
| height | RN-wrapper | `6` | n/a | n/a | n/a |
| borderRadius | RN-wrapper | `3` (50%) | `CircleShape` | `Circle()` | `radius.full` |

### Visual — Streaming Overlay

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| position | RN-wrapper | `'absolute'` | `Box(modifier = Modifier.matchParentSize())` inside Box | `.frame(maxWidth: .infinity, maxHeight: .infinity).position(x: 0, y: 0)` or `.background()` | n/a |
| ...absoluteFillObject | RN-wrapper | `{ top: 0, left: 0, right: 0, bottom: 0 }` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| backgroundColor | RN-wrapper | `${semantic.color.primary.default}14` (8% opacity) | `MaterialTheme.colorScheme.primary.copy(alpha = 0.08f)` | `Color(.orange).opacity(0.08)` | `color.primary.default` + ESCALATE — propose `opacity.streamingOverlay = 0.08` |
| pointerEvents | RN-wrapper | `'none'` | `Modifier.pointerInteropFilter(null)` or `clickable(false)` | `.allowsHitTesting(false)` | n/a |

### Visual — Icon Colors

| State | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| color (all states) | RN-wrapper | `semantic.color.onSurface.muted` (fallback to onSurface.default) | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |
| size | RN-wrapper | `16` | `Modifier.size(16.dp)` | `.frame(width: 16, height: 16)` | `iconSize.sm` |

### Visual — Pulsing Dot Color

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| backgroundColor | RN-wrapper | `semantic.color.primary.default` | `MaterialTheme.colorScheme.primary` | `Color(.orange)` | `color.primary.default` |

### Typography — Label

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| variant | RN-wrapper | `semantic.type.label.md` | `MaterialTheme.typography.labelMedium` | `.font(.system(size: 13, weight: .medium))` | `type.label.md` |
| color | RN-wrapper | `semantic.color.onSurface.muted` (fallback to onSurface.default) | `MaterialTheme.colorScheme.onSurfaceVariant` | `Color(.secondaryLabel)` | `color.onSurface.muted` |
| flex | RN-wrapper | `1` | `Modifier.weight(1f)` | `.frame(maxWidth: .infinity)` | n/a |
| numberOfLines | RN-wrapper | `1` | `maxLines = 1` (in Text composable) | `.lineLimit(1)` | n/a |

### Animation — Pulsing Dot

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| animation | RN-wrapper | `withRepeat(withSequence(timing(1.0, 600ms), timing(0.4, 600ms)), -1)` | `InfiniteTransition(repeatMode = RepeatMode.Restart).animateFloat(...)` | `.animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true))` | ESCALATE — propose `animation.pulseDuration = 600` |
| reduceMotion | RN-wrapper | Static opacity 0.7 when enabled | Check `LocalAccessibilitySettings.isMotionReduced` | check `@Environment(\.accessibilityReduceMotion)` | n/a |
| opacity (reduced) | RN-wrapper | `0.7` | `alpha = 0.7f` | `.opacity(0.7)` | ESCALATE — propose `opacity.reducedMotion = 0.7` |
| opacity (animating) | RN-wrapper | `0.4 → 1.0 → 0.4` | `alpha = 0.4f → 1.0f → 0.4f` | `.opacity(0.4 → 1.0 → 0.4)` | ESCALATE — propose `opacity.pulseMin = 0.4`, `opacity.pulseMax = 1.0` |

### Icon — Names

| State | Source | Icon name | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| complete | RN-wrapper | `'check-circle-outline'` | `Icons.Outlined.CheckCircle` | SF Symbol: `checkmark.circle` | n/a |
| failed | RN-wrapper | `'close-circle-outline'` | `Icons.Outlined.Cancel` | SF Symbol: `xmark.circle` | n/a |
| streaming | RN-wrapper | `'map-marker-path'` | `Icons.Outlined.Route` | SF Symbol: `map` or `location` | n/a |

### Accessibility

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---|---|---|
| accessibilityRole | RN-wrapper | `'text'` | `Modifier.semantics { role = Role.IME ?? null }` or no role (text default) | `.accessibilityAddTraits()` (none for text) | n/a |
| accessibilityLabel | RN-wrapper | Dynamic: "Planning: {label}" or label | `contentDescription = "Planning: $label"` | `.accessibilityLabel("Planning: \(label)")` | n/a |
| accessibilityState (busy) | RN-wrapper | `isStreaming` | `Modifier.semantics { state = ProgressState.Indeterminate }` or `busy = true` | `.accessibilityValue("Planning in progress")` | n/a |
| accessibilityLiveRegion | RN-wrapper | `'polite'` (streaming), `'none'` (complete/failed) | `Modifier.semantics { liveRegionMode = LiveRegionMode.Polite }` | `.accessibilityLiveRegion(.polite)` | n/a |

---

## NOTES

- **Three states:** streaming (pulsing dot, streaming overlay), complete (check icon, "Planned for Xs"), failed (X icon, "Planning failed")
- **Streaming overlay:** Primary color at 8% opacity fills card during streaming
- **Pulsing dot:** 6×6px circle with opacity animation 0.4 → 1.0 → 0.4 (600ms each direction, infinite repeat)
- **Reduce motion:** When enabled, pulsing dot uses static 0.7 opacity
- **Icons:** 16px icons using onSurface.muted color. Check (complete), X (failed), map-marker-path (streaming)
- **Label:** Truncated to 1 line with ellipsis
- **Duration format:** "less than a second" for <1000ms, "Xs" for ≥1000ms
- **Accessibility:** Live region set to 'polite' during streaming, 'none' otherwise
- **Min width:** 90% of parent container
- **Min height:** 44px touch target
- **Content parsing:** JSON parse from message.content for statusLine and totalDurationMs
