# weather-timeline

LaneShadow V2 Copper · Navigator Molecule · Authority: uc-mol-07-navigator-molecules.html

## Purpose

`LSWeatherTimeline` renders the per-hour weather forecast for a planned route as a horizontal grid of tinted condition cells. Each cell contains an hour label, condition icon, and temperature reading in tabular mono type. It composes `ls-badge-weather` tint semantics into a scannable strip.

**When it appears:** Inside RouteDetailsScreen, embedded in the Navigator's route summary card, after planning completes. It anchors below the route title and above the instrument readout. In planning overlays, it can appear inline as a compact strip.

**Why it matters (Navigator voice):** Weather is not an afterthought — it's a first-class planning input. The timeline encodes time-of-day progression left-to-right in a format that is scannable at a glance, with each condition carrying its own perceptual color identity. No weather metadata belongs buried in text.

## Anatomy

```html
<div class="mol-weather-timeline" aria-label="Weather along City Creek Canyon, 9 AM to 2 PM">
  <!-- header row -->
  <div class="mol-weather-timeline__header">
    <span class="mol-weather-timeline__title t-label-md">Weather along the way</span>
    <span class="mol-weather-timeline__range t-instr-xs">9 AM — 2 PM</span>
  </div>

  <!-- cell grid — 6 columns by default, scrollable on narrow -->
  <div class="mol-weather-timeline__cells" role="list">
    <div class="mol-weather-timeline__cell mol-wx--clear" role="listitem" aria-label="9 AM, clear, 68 degrees">
      <span class="mol-weather-timeline__hour t-label-sm">9 AM</span>
      <span class="mol-weather-timeline__icon" aria-hidden="true"><!-- sun SVG --></span>
      <span class="mol-weather-timeline__temp t-instr-sm">68°</span>
    </div>
    <!-- repeat for each hour -->
  </div>

  <!-- optional expanded row: temperature + wind readouts -->
  <div class="mol-weather-timeline__readouts">
    <div class="mol-weather-timeline__readout">
      <span class="mol-weather-timeline__readout-label t-label-sm">High</span>
      <span class="mol-weather-timeline__readout-value t-instr-sm">78°</span>
    </div>
    <div class="mol-weather-timeline__readout">
      <span class="mol-weather-timeline__readout-label t-label-sm">Wind</span>
      <span class="mol-weather-timeline__readout-value t-instr-sm">12 mph</span>
    </div>
  </div>
</div>
```

## Variants

| Variant | Description |
|---|---|
| `compact` | 6 cells, no expanded readouts — default |
| `expanded` | 6 cells + bottom readout strip (temp high/low + wind) |
| `6h` | 6 consecutive hour cells |
| `12h` | 12 cells in a horizontally scrollable strip |
| `24h` | 24 cells, full day — requires `overflow-x: auto` |
| `all-clear` | All 6 cells share one condition; no visual fragmentation |
| `mixed` | 2+ conditions across the strip; most common real-world state |
| `dark` | `.mode-dark` applied to parent — condition tints preserved |

## States

| Cell state | Appearance |
|---|---|
| `clear` | `wx-clear-tint` bg, `wx-clear` border + icon + temp |
| `rain` | `wx-rain-tint` bg, `wx-rain` border + icon + temp |
| `wind` | `wx-wind-tint` bg, `wx-wind` border + icon + temp |
| `storm` | `wx-storm-tint` bg, `wx-storm` border + icon + temp |
| `hot` | `wx-hot-tint` bg, `wx-hot` border + icon + temp |
| `cold` | `wx-cold-tint` bg, `wx-cold` border + icon + temp |

Condition tints are intentionally unchanged in dark mode — color-coded recognition is paramount and must be preserved across themes.

## Atoms Used

| Atom | Role |
|---|---|
| Weather tint semantics (UC-ATM-07) | Per-condition bg/border/text color via `--wx-{cond}` and `--wx-{cond}-tint` tokens |
| `.t-label-md` / `.t-label-sm` (UC-ATM-01) | Header title, hour label |
| `.t-instr-xs` / `.t-instr-sm` (UC-ATM-01) | Range string (xs), temperature values (sm) |

## Token Recipe

| Property | Token |
|---|---|
| Container background | `var(--surface-card)` |
| Container border | `var(--border-default)` |
| Container border-radius | `var(--radius-lg)` |
| Container padding | `var(--space-4)` `var(--space-5)` |
| Container shadow | `var(--elev-card)` |
| Grid gap | `var(--space-2)` |
| Cell border-radius | `var(--radius-md)` |
| Cell padding | `var(--space-3)` `var(--space-2)` |
| Cell border | `1px solid` condition color at 33% alpha |
| Clear bg | `var(--wx-clear-tint)` |
| Clear accent | `var(--wx-clear)` |
| Rain bg | `var(--wx-rain-tint)` |
| Rain accent | `var(--wx-rain)` |
| Wind bg | `var(--wx-wind-tint)` |
| Wind accent | `var(--wx-wind)` |
| Storm bg | `var(--wx-storm-tint)` |
| Storm accent | `var(--wx-storm)` |
| Hot bg | `var(--wx-hot-tint)` |
| Hot accent | `var(--wx-hot)` |
| Cold bg | `var(--wx-cold-tint)` |
| Cold accent | `var(--wx-cold)` |
| Header title color | `var(--content-primary)` |
| Range color | `var(--content-tertiary)` |
| Hour color | `var(--content-secondary)` |
| Readout divider | `var(--border-subtle)` |

## Accessibility

- Wrap the grid in `role="list"` — each cell is `role="listitem"` with a descriptive `aria-label`: `"9 AM, clear, 68 degrees"`.
- Container carries `aria-label` naming the route context and time range: `"Weather along City Creek Canyon, 9 AM to 2 PM"`.
- All condition icons are `aria-hidden="true"` — the cell's `aria-label` is the source of truth.
- Temperature values must include the degree unit in the accessible name even if visually abbreviated: `"68 degrees"` not `"68°"`.
- For 12h/24h scrollable variants, wrap the cell container in a `<div>` with `role="region"` + `aria-label="Scrollable weather timeline"` and `tabindex="0"` to allow keyboard scrolling.

## Animation Notes

### Timeline mount (cells stagger in)
```css
/* Each cell enters sequentially: */
.mol-weather-timeline__cell {
  opacity: 0;
  transform: translateY(var(--space-2));
}
/* Stagger: nth-child delay = (n - 1) * var(--duration-fast) */
/* Each cell animates to opacity 1 + translateY(0) over var(--duration-standard) var(--ease-decelerated) */
```

### Scroll snap (12h/24h)
```css
.mol-weather-timeline__cells--scrollable {
  overflow-x: auto;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
}
.mol-weather-timeline__cell {
  scroll-snap-align: start;
}
```

## Notes

- Condition tints are semantic palette values, not raw hex — they adapt correctly as the token system evolves.
- The 6-column grid uses `repeat(6, 1fr)` — each cell is equal width. For 12h/24h, switch to `repeat(N, minmax(48px, 1fr))` with overflow scroll.
- Border uses `color-mix(in srgb, var(--wx-{cond}) 33%, transparent)` for the alpha border — avoids raw hex.
- `mol-weather-timeline` never redefines `ls-badge-weather` or any `.ls-*` class.
- Expanded readout strip (`mol-weather-timeline__readouts`) sits below the cell grid, separated by `border-subtle`. Readout values use `.t-instr-sm`.
