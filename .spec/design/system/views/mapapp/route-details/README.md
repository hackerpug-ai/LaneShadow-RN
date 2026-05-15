# route-details-screen (UC-SCR-04 — LaneShadow V2 Copper)

## Purpose

RouteDetailsScreen is the commitment surface. The rider has picked a route; the map reduces to that single polyline (best variant, `var(--route-best)`) framed against the warm paper canvas. Everything decisive lives in the bottom sheet: a copper "BEST FOR TODAY" badge as the Navigator's seal of approval, an opinion-serif Newsreader route title, a four-column JetBrains Mono instrument readout (DIST / TIME / CLIMB / SCENIC), a six-cell per-hour weather timeline with condition-tint backgrounds, and a sticky action row — outline `Save` plus copper primary `Ride this`. No Navigator message, no chat input, no competing affordances. The rider either saves or rides.

---

## Variants

| Variant ID | Description | Theme |
|------------|-------------|-------|
| S01 · Default · Light | Large detent; six clear cells; "The Skyline Spine"; 4-col instrument grid; outline Save + primary Ride this | Light |
| S02 · Mixed Weather · Light | Clear → wind → rain across six hours; italic Newsreader narration below the weather grid; "Coast & Ridge Loop" | Light |
| S03 · Default · Dark | All tokens re-resolve on ink-800 substrate; polyline gains stronger bloom; night hours use moon icon; wind cells for second half | Dark |
| S04 · Medium Detent · Light | Sheet dragged down; weather and narration collapse below fold; header + instrument + action row remain visible | Light |
| S05 · Dismissing · Light | Sheet dragged past medium toward dismiss threshold; copper stripe flashes on sheet top edge; map fully revealed | Light |
| V01 · Saved State · Light | Post-Save: toast confirms with copper check; Save button flips to saved variant; "Saved" pill appears beside best badge | Light |

---

## Composes

| Layer | Class | Role in View |
|-------|-------|--------------|
| organism | `org-map-layer` | Foundational canvas — z-order / slot contract (map / topBar / bottomSheet) |
| organism | `org-map-layer__map` | Map slot — paper background + contour SVG + route polyline + start/end markers |
| organism | `org-map-layer__top-bar` | TopBar slot — absolute z:30 across full width |
| organism | `org-topbar` | LSTopBar — hamburger chip + NEW chip |
| organism | `org-topbar__chip` | Individual glass chips (circular hamburger, pill NEW) |
| organism | `org-topbar__chip--square` | Hamburger (40×40pt) |
| organism | `org-topbar__chip--with-label` | NEW pill (label + icon) |
| organism | `org-route-sheet` | LSRouteSheet — bottom sheet with handle, head, instrument grid, weather timeline, action row |
| molecule | `mol-instrument-readout` | LSInstrumentReadout — 4-column mono metric grid (DIST / TIME / CLIMB / SCENIC) |
| molecule | `mol-weather-timeline` | LSWeatherTimeline — 6-hour horizontal forecast with condition-tint cells |
| atom | `ls-badge-best` | LSBestBadge — copper "BEST FOR TODAY" badge |
| atom | `ls-btn--outline` | Outline Save button (flex:1, 44pt height, border-default stroke) |
| atom | `ls-btn--primary` | Copper primary Ride this button (flex:2, signal-default fill) |
| atom | `ls-badge-weather` | Weather cell condition badge (clear / wind / rain / hot / night) |
| typography | `.t-opinion-md` | Opinion-serif route title ("The Skyline Spine") |
| typography | `.t-body-md` | Via subtitle ("via Kings Mountain Rd · 47 mi") |
| typography | `.t-opinion-sm` | Weather narration italic prose below the timeline |
| typography | `.t-label-sm` | Badge text ("BEST FOR TODAY"), instrument column labels, weather timeline header |
| typography | `.t-instr-lg` | JetBrains Mono metric values (47, 2h10, 3200, 9.2) |
| typography | `.t-instr-xs` | Metric sub-labels (miles, mins, ft, of 10), weather hour labels, temperature values |
| typography | `.t-title-sm` | Action row button labels (Save, Ride this) |
| typography | `.t-instr-sm` | Story ID labels in preview header band; status bar time |

---

## Token Recipe

View-level properties applied via `.view-route-details-screen*` selectors only:

| Property | Token | Notes |
|----------|-------|-------|
| Phone frame background | `var(--surface-primary)` | Matches map paper in light; ink-800 in dark |
| Phone frame border | `var(--border-default)` via `var(--stroke-sm)` | 1px separator |
| Phone frame corner radius | `var(--radius-xl)` | 16px — consistent with organisms |
| Section background | `var(--surface-primary)` | Page-level background |
| Map paper | `var(--map-paper)` | paper-50 light / ink-900 dark |
| Map contour strokes | `var(--map-contour)` / `var(--map-contour-faint)` | Decorative SVG strokes — no color literals |
| Route polyline best | `var(--route-best)` | Copper stroke + drop-shadow bloom |
| Route start marker fill | `var(--signal-default)` | Copper dot |
| Route end marker ring | `var(--signal-default)` | Copper ring + inner dot |
| Sheet background | `var(--surface-card)` | paper-50 light / ink-700 dark |
| Sheet top border | `var(--border-subtle)` | Hair-line separator |
| Sheet handle | `var(--border-strong)` | Drag handle pill |
| Best badge fill | `var(--signal-default)` | Copper background |
| Best badge text | `var(--content-on-signal)` | White label |
| Badge drop-shadow | `color-mix(in srgb, var(--signal-default) 40%, transparent)` | Copper glow |
| Scenic dot filled | `var(--signal-default)` | Copper scenic dot |
| Scenic dot empty | `var(--border-strong)` | Muted dot |
| Saved pill background | `var(--signal-whisper)` | Copper-100 tint |
| Saved pill border | `var(--signal-tint)` | Copper-200 |
| Saved pill text | `var(--signal-default)` | Copper |
| Instrument label | `var(--content-tertiary)` | Muted uppercase label |
| Instrument value | `var(--content-primary)` | Ink-900 mono number |
| Instrument scenic value | `var(--signal-default)` | Copper positive signal |
| Instrument sub-label | `var(--content-tertiary)` | Muted unit |
| Instrument dividers | `var(--border-subtle)` | Top/bottom rules + column separators |
| Weather header label | `var(--content-primary)` | Bold uppercase |
| Weather range | `var(--content-tertiary)` | Mono time range |
| Weather cell — clear | `var(--wx-clear-tint)` bg / `var(--wx-clear)` text | Amber tint |
| Weather cell — wind | `var(--wx-wind-tint)` bg / `var(--wx-wind)` text | Slate tint |
| Weather cell — rain | `var(--wx-rain-tint)` bg / `var(--wx-rain)` text | Blue tint |
| Weather cell — hot | `var(--wx-hot-tint)` bg / `var(--wx-hot)` text | Terracotta tint |
| Weather cell — night | `color-mix(in srgb, var(--wx-wind) 15%, transparent)` bg | Cooled neutral for night hours |
| Weather narration | `var(--content-tertiary)` | Italic opinion prose |
| Save button border | `var(--border-default)` via `var(--stroke-md)` | Outline variant |
| Save button saved border | `var(--signal-tint)` | Copper saved state |
| Save button saved bg | `var(--signal-whisper)` | Copper-100 fill |
| Save button saved text | `var(--signal-default)` | Copper |
| Ride this button fill | `var(--signal-default)` | Copper primary |
| Ride this button text | `var(--content-on-signal)` | White |
| Ride this button shadow | `color-mix(in srgb, var(--signal-default) 35%, transparent)` | Copper ambient glow |
| Toast background | `var(--surface-glass)` | Frosted glass |
| Toast border | `var(--signal-tint)` | Copper-200 |
| Toast accent stripe | `var(--signal-default)` via `var(--stroke-lg)` | Left copper edge |
| Toast icon fill | `var(--signal-default)` | Copper circle |
| Home indicator (light) | `rgba(0, 0, 0, 0.38)` | Device chrome simulation — raw value intentional |
| Home indicator (dark) | `rgba(255, 255, 255, 0.30)` | Device chrome simulation — raw value intentional |
| Dismissing copper stripe | `var(--signal-default)` via linear-gradient | Top-edge flash on drag toward dismiss |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Default (≥ 900px) | Phone frame centered with `var(--space-9)` (40px) horizontal padding; sections have generous vertical padding `var(--space-11)` |
| Tablet (< 900px) | Phone frame max-width scales to `min(390px, 80vw)`; section padding reduces to `var(--space-6)` |
| Mobile (≤ 375px) | Section padding collapses to `var(--space-4)`; phone frame spans full section inner width; caption header stacks vertically; story annotation text aligns center |

---

## Accessibility

| Element | Role / Landmark |
|---------|----------------|
| `<main>` | `role="main"` — wraps all story sections |
| Story section | `<section>` with `aria-label="S01 Default Large Light"` etc. |
| Phone frame | `role="img"` `aria-label="RouteDetailsScreen phone preview — [variant]"` |
| TopBar hamburger | `aria-label="Open sessions"` |
| TopBar NEW chip | `aria-label="Start new session"` |
| Route sheet | `role="region"` `aria-label="Route details sheet"` |
| Instrument grid | `role="group"` `aria-label="Route metrics"` |
| Weather cells container | `role="list"` `aria-label="Hourly weather"` |
| Each weather cell | `role="listitem"` |
| Route title | `<h2>` inside sheet — Newsreader opinion type |
| Save button | `aria-label="Save this route"` / `aria-pressed="true"` when saved |
| Ride this button | `aria-label="Start riding this route"` |
| Toast | `role="status"` `aria-label="Route saved confirmation"` |
| Dismissing sheet | `aria-label="Route details sheet dismissing"` |
| Focus order | TopBar chips → Sheet handle (non-interactive) → Save → Ride this |

---

## View-Local Constants

| Property | Value | Reason |
|----------|-------|--------|
| Phone frame `aspect-ratio` | `9 / 19.5` | Canonical iPhone preview proportions — not a spacing token |
| Phone frame `max-width` | `390px` | Canonical iPhone viewport width — not a spacing token |
| Phone frame `border-radius` | `var(--radius-xl)` | Intentionally uses token; no additional literal needed |
| Route start marker size | `var(--space-5)` (16px) | Touch-target-adjacent; consistent with concept spec |
| Route end marker size | `18px` | Slightly larger than start to distinguish; SVG geometry |
| Sheet large detent height | `62%` of phone frame | Canonical from concept — shows all sheet content |
| Sheet medium detent height | `38%` of phone frame | Canonical from concept — crops weather below fold |
| Sheet dismissing height | `18%` of phone frame | Near-collapse drag simulation |
| Route polyline `stroke-width` | `4px` | SVG geometry — not a CSS spacing token |
| SVG `stroke-width` on contours | `0.7` / `0.9` | SVG geometry — not CSS spacing tokens |
| `feGaussianBlur stdDeviation` | `3` / `5` | SVG filter geometry — no token equivalent |
| `backdrop-filter: blur(14px)` on toast | `14px` | Visual-effect blur radius — not a spacing token |
| Home indicator color (light) | `rgba(0, 0, 0, 0.38)` | Device chrome simulation — no semantic equivalent |
| Home indicator color (dark) | `rgba(255, 255, 255, 0.30)` | Device chrome simulation — same rationale |
| `@media (max-width: 375px)` / `@media (max-width: 900px)` | Pixel literals in `@media` | Structural breakpoint constraints — allowed per spec |
