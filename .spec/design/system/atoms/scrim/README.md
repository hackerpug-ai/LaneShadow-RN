# Scrim Atom — LSScrim

UC-ATM-09 · LaneShadow V2 Copper · Tier B

LSScrim is a full-parent warm-black overlay that dims the map canvas when a drawer or modal needs visual priority. The warm-black tint (ink-800 base) preserves the paper feeling rather than flattening to a cold grey overlay. Touches pass through by default; blocking is an explicit opt-in.

## atoms-used

- none (tokens only)

## Token Table

| Role | Token | Light value | Dark value |
|------|-------|-------------|------------|
| Scrim color (base) | `--surface-scrim` | `rgba(34, 24, 16, 0.35)` | `rgba(10, 6, 3, 0.50)` |
| Fade duration | `--duration-fast` | `120ms` | `120ms` |
| Fade easing | `--ease-linear` | `linear` | `linear` |

Note: `--surface-scrim` already encodes the default opacity (0.35 light / 0.50 dark) as part of the token value. When applying a non-default opacity level, the token is used for its base color only and `opacity` is overridden via the variant class or inline prop.

## Opacity Variant Table

Six levels are defined — product engineers must never invent raw opacity values.

| Token name | Value | Use-site | Behavior |
|------------|-------|----------|----------|
| `opacity.scrim.hint` | `0.12` | Ambient dimming | Barely perceptible. Map fully legible. |
| `opacity.scrim.default` | `0.35` | LSSessionsDrawer | Default. Map recognizable. Touch-through. |
| `opacity.scrim.medium` | `0.50` | LSBottomSheet | Map readable but secondary. Blocking recommended. |
| `opacity.scrim.strong` | `0.60` | Modal | Full modal focus. Blocking required. |
| `opacity.scrim.heavy` | `0.76` | Critical modal | Near-opaque. Reserved for system-critical interruptions. |
| `opacity.scrim.opaque` | `0.95` | Full interrupt | Functionally opaque. Use sparingly — breaks spatial continuity. |

## Variants

### Touch behavior

| Variant | Class | CSS | When |
|---------|-------|-----|------|
| Non-blocking (default) | `.ls-scrim` | `pointer-events: none` | Default — taps pass through to map controls beneath. Used by LSSessionsDrawer. |
| Blocking | `.ls-scrim.ls-scrim--blocking` | `pointer-events: auto; cursor: pointer` | Explicit opt-in. Captures taps, fires dismiss callback. Used by LSBottomSheet (0.50) and Modal (0.60). |

### Dark mode

In light mode `--surface-scrim` is `rgba(34, 24, 16, 0.35)` — warm-ink over paper. In dark mode it resolves to `rgba(10, 6, 3, 0.50)` — a deeper near-black tint. The dark default is intentionally more opaque because the dark map canvas is already low-contrast; the deeper tint provides visible separation without a large opacity jump.

## Animation Spec

LSScrim itself has **no intrinsic animation**. Fade-in and fade-out transitions are owned by the consuming organism (LSBottomSheet, LSModal, LSSessionsDrawer). The organism animates opacity `0 → target` on enter and `target → 0` on exit using:

| Property | Token | Resolved value |
|----------|-------|----------------|
| `transition-duration` | `--duration-fast` | `120ms` |
| `transition-timing-function` | `--ease-linear` | `linear` |

This keeps motion logic at the organism layer and lets each organism tune its own enter/exit timing independently.

## Anatomy

```
div.ls-scrim[.ls-scrim--blocking]
```

The scrim is a single `<div>` with `position: absolute; inset: 0`. It inherits border-radius from its parent container. The consumer is responsible for clipping the scrim to its own bounds via `overflow: hidden` on the parent.

## CSS

```css
.ls-scrim {
  position: absolute;
  inset: 0;
  background: var(--surface-scrim);
  pointer-events: none;
  border-radius: inherit;
  z-index: 2;
}

.ls-scrim--blocking {
  pointer-events: auto;
  cursor: pointer;
}
```

## AC Traceability

| AC | Criterion |
|----|-----------|
| AC-1 | `LSScrim()` renders full-parent overlay using `--surface-scrim` at 0.35 opacity |
| AC-2 | Opacity override resolves from `opacity.scrim.*` token values, not raw literals |
| AC-3 | Default: touches pass through (`pointer-events: none`) |
| AC-4 | `blocking: true` captures taps and fires `onTap` dismiss callback |
| AC-5 | Story: Default, Opacity 0.60, Blocking (tap to dismiss) |
| AC-6 | Warm-black base `rgba(34,24,16)` confirmed — never pure `#000` |
| AC-7 | Six opacity levels: 0.12 / 0.35 / 0.50 / 0.60 / 0.76 / 0.95 |
| AC-8 | Use-sites: SessionsDrawer (0.35 non-blocking), BottomSheet (0.50 blocking), Modal (0.60 blocking) |

## Motion

No intrinsic animation. Fade transitions (120ms linear) are the responsibility of the consuming organism.
