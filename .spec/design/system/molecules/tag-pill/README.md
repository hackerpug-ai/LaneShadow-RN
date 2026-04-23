# tag-pill

LaneShadow V2 Copper · Molecule · Authority: uc-mol-05-pill-family.html

## Purpose

`LSTagPill` is a non-interactive taxonomy label composing `ls-pill` (UC-ATM-06). It informs without inviting interaction — it never receives focus, hover, or press states. Use it to communicate static metadata about a route or ride: terrain category, ride mode, location proximity, or elapsed time. Organisms must not reach for raw `ls-pill` to display content labels; they use this molecule.

## Anatomy (HTML snippet)

```html
<span class="ls-pill sm mol-tag-pill">
  <!-- optional leading icon slot -->
  <svg class="mol-tag-pill__icon" …></svg>
  <!-- label text -->
  <span class="t-label-sm mol-tag-pill__label">Gravel</span>
</span>
```

### Color-tinted variant (weather or status)

```html
<span class="ls-pill sm mol-tag-pill mol-tag-pill--wx-rain">
  <span class="t-label-sm mol-tag-pill__label">Wet Roads</span>
</span>

<span class="ls-pill sm mol-tag-pill mol-tag-pill--success">
  <span class="t-label-sm mol-tag-pill__label">Great Conditions</span>
</span>
```

## Variants

| Variant | Modifier class | Surface | Text color |
|---|---|---|---|
| Neutral (default) | — | `surface-glass` | `content-secondary` |
| Signal (copper accent) | `mol-tag-pill--signal` | `signal-whisper` | `signal-default` |
| Status Success | `mol-tag-pill--success` | `status-success` tint | `status-success` |
| Status Warning | `mol-tag-pill--warning` | `status-warning` tint | `status-warning` |
| Status Error | `mol-tag-pill--error` | `status-error` tint | `status-error` |
| Weather Clear | `mol-tag-pill--wx-clear` | `wx-clear-tint` | `wx-clear` |
| Weather Rain | `mol-tag-pill--wx-rain` | `wx-rain-tint` | `wx-rain` |
| Weather Wind | `mol-tag-pill--wx-wind` | `wx-wind-tint` | `wx-wind` |
| Weather Storm | `mol-tag-pill--wx-storm` | `wx-storm-tint` | `wx-storm` |
| Weather Hot | `mol-tag-pill--wx-hot` | `wx-hot-tint` | `wx-hot` |
| Weather Cold | `mol-tag-pill--wx-cold` | `wx-cold-tint` | `wx-cold` |

## Sizes

Sizes are inherited from `ls-pill`. Apply `sm` (24px), `md` (32px), or `lg` (40px) alongside `mol-tag-pill`.

```html
<span class="ls-pill sm mol-tag-pill">Gravel</span>
<span class="ls-pill md mol-tag-pill">Gravel</span>
<span class="ls-pill lg mol-tag-pill">Gravel</span>
```

## States

`mol-tag-pill` is intentionally stateless. It must not receive interactive states. If a pill needs toggling, use `mol-filter-chip` instead.

## Atoms Used

| Atom | Role | Class |
|---|---|---|
| LSPill | Shape primitive — border-radius, height, gap | `ls-pill sm/md/lg` |

## Token Recipe

| Property | Token |
|---|---|
| Background (default) | `var(--surface-glass)` |
| Border (default) | `rgba(255,255,255,0.55)` light / `var(--border-default)` dark |
| Text color (default) | `var(--content-secondary)` |
| Icon color | `var(--signal-default)` |
| Backdrop | `blur(14px) saturate(1.2)` |
| Weather bg | `var(--wx-{condition}-tint)` |
| Weather text | `var(--wx-{condition})` |
| Status bg | `color-mix(in srgb, var(--status-{level}) 12%, transparent)` |
| Status text | `var(--status-{level})` |
| Typography | `.t-label-sm` (8.5px, 600 wt, 0.14em tracking, uppercase) |

## Accessibility

- `role="img"` or `aria-label` when a tag pill conveys semantic meaning with no visible text equivalent.
- Leading icon: `aria-hidden="true"` since the label text is the accessible name.
- No `tabindex` — this element is not interactive.

## Notes

- `mol-tag-pill` never redefines `border-radius`, `height`, `padding`, or `gap` — those belong to `ls-pill`.
- Glass treatment (`backdrop-filter`) degrades gracefully in environments that don't support it; the fallback is `surface-glass` at full opacity.
- On dark surfaces, override the border with `var(--border-default)` (which resolves to the dark rgba value via the `.mode-dark` cascade).
