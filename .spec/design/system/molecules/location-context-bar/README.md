# location-context-bar

LaneShadow V2 Copper · Molecule · Authority: uc-mol-08-location-route.html

---

## Purpose

LSLocationContextBar sits above the suggestion row in LSChatInput, providing two pieces of ambient context before a user types a Navigator prompt: **where you are** and **whether that location is auto-derived or manually set**. Tapping the trailing mode chip fires `onModeChange`, letting the user override GPS with a manual location.

The bar floats as a glass pill over map and surface layers alike, staying legible in both light and dark contexts through backdrop-blur and semantic border tokens.

---

## Anatomy

```
┌────────────────────────────────────────────────────┐
│  [●live-dot / pin-icon] [city label · distance]   [AUTO/MANUAL chip] │
└────────────────────────────────────────────────────┘
      mol-lcb__location-pill              mol-lcb__mode-chip
```

| Slot | Element | Notes |
|---|---|---|
| Root | `.mol-location-context-bar` | `justify-content: space-between`; glass surface |
| Leading | `.mol-lcb__location-pill` | flex pill; max-width 260px; truncates with ellipsis |
| Leading icon | `.mol-lcb__live-dot` or `.mol-lcb__pin-icon` | live-dot pulses via CSS animation; pin is static fill SVG |
| Leading text | `.mol-lcb__label.t-body-md` | overflow hidden + text-overflow ellipsis |
| Sub-label | `.mol-lcb__sublabel.t-label-sm` | shown only in `.is-expanded` variant; neighborhood + distance anchor |
| Distance | `.mol-lcb__distance.t-label-sm` | inline suffix appended to label when anchor is provided |
| Trailing | `.mol-lcb__mode-chip.t-label-md` | "AUTO" or "MANUAL"; tappable; `cursor: pointer` |

---

## Variants

| Variant | Class modifier | Description |
|---|---|---|
| Auto mode | (default) | Live dot pulses; mode chip neutral |
| Manual mode | `.mol-lcb__mode-chip.is-manual` | Pin icon; mode chip uses signal-whisper tint + copper text |
| Compact | `.mol-location-context-bar.is-compact` | Reduces pill height to `--size-control-md` (36px) |
| Expanded / multiline | `.mol-lcb__location-pill.is-expanded` | Column layout inside pill; shows `.mol-lcb__sublabel` for neighborhood context |
| With distance anchor | Inline `.mol-lcb__distance` span | Appended inside label: "Salt Lake City, UT · 0.3 mi" |
| Error (no-fix) | `.mol-location-context-bar.is-error` + `.mol-lcb__location-pill.is-error` | Error icon; border and label shift to `--status-error` |
| Dark | `.mode-dark` on ancestor | Border uses `--border-default` (rgba ink); glass adjusts automatically |

---

## States

| State | Visual change |
|---|---|
| Default | Glass pill, subtle shadow |
| Mode chip hover | Background shifts to `--surface-inset` |
| Manual mode chip hover | Tint deepens to `--signal-tint` |
| Error | Pill border becomes `status-error`-tinted; label turns `--status-error` |
| Live dot active | Pulse ring animates outward (`lcb-pulse`, `--duration-deliberate`, alternate) |

---

## Atoms Used

| Atom | Usage |
|---|---|
| `ls-phase-dot` | Modeled as `.mol-lcb__live-dot` inline (same visual: signal.default dot + animated ring) |
| `ls-pill` | Structural basis for both the location pill and mode chip shape/tokens |

---

## Token Recipe

| Property | Token |
|---|---|
| Root background | `--surface-glass` |
| Root border (light) | `rgba(255,255,255,0.35)` (glass convention) |
| Root border (dark) | `--border-subtle` |
| Root shadow | `--elev-chrome` |
| Root radius | `--radius-lg` |
| Root gap | `--space-3` |
| Root padding | `--space-2` `--space-3` |
| Pill border (light) | `rgba(255,255,255,0.55)` |
| Pill border (dark) | `--border-default` |
| Pill max-width | `260px` (hard cap) |
| Pill min-height | `--size-touch-min` (44px) |
| Pill padding | `--space-2` `--space-3` |
| Live dot size | `--space-2` (4px) |
| Live dot color | `--signal-default` |
| Live dot pulse | `--signal-default` @ 45% opacity |
| Pin icon size | `--icon-xs` |
| Pin icon color | `--signal-default` |
| Label color | `--content-secondary` |
| Sub-label color | `--content-tertiary` |
| Distance color | `--content-tertiary` |
| Mode chip color (auto) | `--content-tertiary` |
| Mode chip color (manual) | `--signal-default` |
| Mode chip bg (manual) | `--signal-whisper` |
| Mode chip border (manual) | `--signal-tint` |
| Error border tint | `color-mix(in srgb, --status-error 40%, transparent)` |
| Error label color | `--status-error` |
| Typography (label) | `.t-body-md` |
| Typography (sub-label) | `.t-label-sm` |
| Typography (distance) | `.t-label-sm` |
| Typography (mode chip) | `.t-label-md` |

---

## Accessibility

- Mode chip has `cursor: pointer` and is keyboard-activatable (add `role="button"` + `tabindex="0"` in native implementation)
- Location pill has `cursor: default`; read-only display
- Error state communicates through color + icon + text ("Location unavailable") — not color alone
- Live dot animation respects `prefers-reduced-motion` — wrap `@keyframes lcb-pulse` in a motion media query in production
- Minimum touch target: `--size-touch-min` (44px) on both pills per Apple HIG / Material guidelines
- `aria-label` on mode chip should read "Location mode: AUTO" or "Location mode: MANUAL"
- `aria-label` on bar should read "Current location: [city], [state]" or "Location unavailable"

---

## Notes

- The glass blur effect (`backdrop-filter: blur(14px)`) requires the bar be placed above a rendered background. On opaque surfaces use `.ls-glass-panel` as a container.
- Live dot pulse animation is CSS-only (`lcb-pulse`); no JS required. In production, toggle `.mol-lcb__live-dot` vs `.mol-lcb__pin-icon` via the `isLive` prop.
- The bar is designed to sit as a full-width header row inside the Navigator chat input region (above `LSChatInput`). Width is `100%` within its container column.
- Distance anchor (e.g., "0.3 mi") is optional and appended inline. Use when a named trailhead or anchor is within 5 miles.
- The `is-expanded` / multiline variant is used when neighborhood context adds meaningful disambiguation (e.g., two Cottonwood Canyons). Default to the single-line variant.
- In React Native: the backdrop-filter maps to `BlurView` (iOS) / translucent overlay (Android). The blur radius is `14`.
