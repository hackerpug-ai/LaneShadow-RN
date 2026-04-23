# LSBadgeBest — Atom

**Family:** Badge atoms (UC-ATM-07)
**Status:** Spec complete

## Description

A distinct badge atom — not a variant of LSBadgeWeather — that carries a unique semantic
role: "the Navigator's recommendation." Copper (`--signal-default`) fill with white
(`--content-on-signal`) text. A filled star SVG leads the label. The copper fill is
reserved exclusively for this meaning.

Two text variants:

| Variant | Label | Use |
|---------|-------|-----|
| Full | "BEST FOR TODAY" | Primary context — route list, summary card |
| Compact | "BEST" | Tight spaces — inline with other badges |

The filled-star icon is always present and is never optional.

## Dimensions

| Property | Value | Token |
|----------|-------|-------|
| Height | 24px | (badge canonical size from spec) |
| Padding | 0 10px | `--space-3` + 2px (spec: spacing.2.5) |
| Border-radius | 999px | `--radius-pill` |
| Icon size | 11px | approx `--icon-xs` |
| Icon fill | currentColor | inherits from badge fg |
| Text weight | 700 | (heavier than weather badge — intentional) |
| Letter-spacing | 0.06em | (brand differentiation) |

## Tokens Consumed

| Token | Role |
|-------|------|
| `--signal-default` | Background fill (copper) |
| `--content-on-signal` | Text + icon color (white) |
| `--radius-pill` | Pill shape |
| `--font-ui` | Label typeface |

## Quality Bar

- Zero hex literals in badge CSS
- Zero raw numeric font/spacing values in CSS
- Both variants (full / compact) rendered in light + dark theme panes
- Star icon fills `currentColor` — always white against copper bg
- Copper fill unchanged in dark mode (semantic token `--signal-default` unchanged)
