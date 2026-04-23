# LSBadgeWeather — Atom

**Family:** Badge atoms (UC-ATM-07)
**Status:** Spec complete

## Description

A pill-shaped badge that communicates current or forecasted weather conditions. Six
condition variants, each using a dedicated `--wx-{condition}` / `--wx-{condition}-tint`
color pair. A 12px inline SVG icon with 1.5px rounded stroke leads the label text.

## Variants

| Variant | Background token | Foreground token | Border |
|---------|-----------------|-----------------|--------|
| clear | `--wx-clear-tint` | `--wx-clear` | 0.5px rgba(230,165,42,0.55) |
| rain | `--wx-rain-tint` | `--wx-rain` | 0.5px rgba(74,134,190,0.55) |
| wind | `--wx-wind-tint` | `--wx-wind` | 0.5px rgba(107,123,143,0.55) |
| storm | `--wx-storm-tint` | `--wx-storm` | 0.5px rgba(94,63,174,0.55) |
| hot | `--wx-hot-tint` | `--wx-hot` | 0.5px rgba(201,66,60,0.55) |
| cold | `--wx-cold-tint` | `--wx-cold` | 0.5px rgba(58,139,227,0.55) |

## Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Height | 24px | (hardcoded — badge canonical size) |
| Padding | 0 8px | `--space-3` (8px) |
| Border-radius | 999px | `--radius-pill` |
| Icon size | 12px | `--icon-xs` |
| Icon gap | 5px | (between icon and text) |
| Icon stroke | 1.5px | `--stroke-md` |
| Text style | `.t-body-sm` + weight 600 | type-modules.css |

## Tokens Consumed

| Token | Role |
|-------|------|
| `--wx-clear/rain/wind/storm/hot/cold` | Text + icon color |
| `--wx-clear-tint/rain-tint/…` | Background fill |
| `--radius-pill` | Pill shape |
| `--space-3` | Horizontal padding (8px) |
| `--icon-xs` | Icon bounding box |
| `--stroke-md` | SVG stroke width |
| `--font-ui` | Badge text typeface |

## Icons (inline SVG, 12×12, stroke-linecap round, no fill)

| Condition | Icon concept |
|-----------|-------------|
| clear | Sun with 8 rays |
| rain | Cloud with rain drops |
| wind | Wind streamlines |
| storm | Lightning bolt |
| hot | Thermometer |
| cold | Snowflake / crystal |

## Quality Bar

- Zero hex literals in badge CSS (rgba border channels are an unavoidable CSS limitation
  since `var()` cannot be decomposed into channels; matches the approach used in concept file)
- Zero raw numeric font/spacing in CSS (all via tokens or type classes)
- All 6 variants rendered in light + dark theme panes
- Icon stroke color inherits `currentColor` (adapts automatically to theme)
- Badge text uses `.t-body-sm` typography class
