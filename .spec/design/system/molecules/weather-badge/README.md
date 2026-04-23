# weather-badge

LaneShadow V2 Copper · Molecule · Authority: uc-mol-05-pill-family.html

## Purpose

`LSWeatherBadge` communicates a weather condition at a glance — it composes `ls-badge-weather` (UC-ATM-06's weather badge atom, which supplies the icon, tinted background, and semantic color) with a readout text slot for condition label and optionally a temperature or wind-speed value. It ships in two sizes (`sm` 24px for map overlays, `md` 32px for cards and detail panels) and two content modes (compact label-only "Rain", expanded label+value "Rain · 67°").

Organisms that need to communicate live or forecast weather conditions on routes — route cards, ride detail headers, map overlays, navigator banners — use this molecule.

## Anatomy (HTML snippet)

```html
<!-- Compact — condition label only -->
<span class="ls-badge-weather rain sm mol-weather-badge">
  <svg class="mol-weather-badge__icon" aria-hidden="true" …></svg>
  <span class="t-label-sm mol-weather-badge__label">Rain</span>
</span>

<!-- Expanded — condition + readout value -->
<span class="ls-badge-weather rain md mol-weather-badge">
  <svg class="mol-weather-badge__icon" aria-hidden="true" …></svg>
  <span class="t-label-sm mol-weather-badge__label">Rain</span>
  <span class="mol-weather-badge__separator" aria-hidden="true">·</span>
  <span class="t-instr-xs mol-weather-badge__value">67°</span>
</span>

<!-- Expanded with two values — condition + temp + wind -->
<span class="ls-badge-weather wind md mol-weather-badge">
  <svg class="mol-weather-badge__icon" aria-hidden="true" …></svg>
  <span class="t-label-sm mol-weather-badge__label">Wind</span>
  <span class="mol-weather-badge__separator" aria-hidden="true">·</span>
  <span class="t-instr-xs mol-weather-badge__value">67°</span>
  <span class="mol-weather-badge__separator" aria-hidden="true">·</span>
  <span class="t-instr-xs mol-weather-badge__value">12mph</span>
</span>
```

## Variants

### Conditions (6)

| Condition | Atom class | Surface token | Text token |
|---|---|---|---|
| Clear | `clear` | `var(--wx-clear-tint)` | `var(--wx-clear)` |
| Rain | `rain` | `var(--wx-rain-tint)` | `var(--wx-rain)` |
| Wind | `wind` | `var(--wx-wind-tint)` | `var(--wx-wind)` |
| Storm | `storm` | `var(--wx-storm-tint)` | `var(--wx-storm)` |
| Hot | `hot` | `var(--wx-hot-tint)` | `var(--wx-hot)` |
| Cold | `cold` | `var(--wx-cold-tint)` | `var(--wx-cold)` |

### Sizes

| Size | Class | Height | Notes |
|---|---|---|---|
| Small | `sm` | 24px | Map overlay, compact list row, HUD |
| Medium | `md` | 32px | Route card header, detail panel |

### Content modes

| Mode | Pattern |
|---|---|
| Compact | Icon + label (e.g. "Rain") |
| Expanded | Icon + label + separator + value (e.g. "Rain · 67°") |
| Full readout | Icon + label + sep + temp + sep + wind (e.g. "Rain · 67° · 12mph") |

## States

`mol-weather-badge` is non-interactive and stateless. The weather condition may change at runtime by swapping the condition class (e.g. `rain` → `storm`) and updating `aria-label`.

## Atoms Used

| Atom | Role | Class |
|---|---|---|
| LSBadgeWeather | Tinted pill shape — background color, border, icon color, height | `ls-badge-weather {condition} sm/md` |

## Token Recipe

`mol-weather-badge` adds no color tokens of its own — all color is inherited from `ls-badge-weather`'s condition class. The molecule layer contributes only the readout text classes and the separator.

| Property | Token |
|---|---|
| Background | inherited from `ls-badge-weather.{condition}` → `var(--wx-{condition}-tint)` |
| Text/icon color | inherited → `var(--wx-{condition})` |
| Label typography | `.t-label-sm` (8.5px, 600 wt, uppercase) |
| Value typography | `.t-instr-xs` (8.5px, 500 wt, tabular nums) |
| Separator | `mol-weather-badge__separator` — `content-tertiary`, `aria-hidden` |
| Gap (between slots) | inherited from `ls-badge-weather` (3px sm, 4px md) |

## Accessibility

- The outer element should carry `aria-label` with the full human-readable string, e.g. `aria-label="Rain, 67 degrees, 12 mph"`.
- All inner elements (`icon`, `separator`) must be `aria-hidden="true"` — the outer `aria-label` is the screen reader text.
- Element should be `role="img"` so screen readers announce it as a single unit.

## Notes

- `mol-weather-badge` never redefines `background`, `border`, `color`, or `height` — those are owned by `ls-badge-weather`.
- The separator character `·` is `aria-hidden="true"` in markup; the `aria-label` on the root uses plain prose (comma-separated).
- On dark surfaces, the weather tint tokens are identical to light — the tint palette is perceptually designed to work on both surfaces. No dark override needed for the weather condition colors.
- For map overlay usage, prefer `sm` to minimize interference with map content; switch to `md` only in card/panel contexts.
