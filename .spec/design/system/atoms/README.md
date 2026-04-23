# Atoms — LaneShadow V2 Copper

Single-purpose, indivisible UI primitives. Each atom references only semantic tokens — never other atoms.

**Authority:** `.spec/prds/v2/concepts/uc-atm-01..13.html`

## Inventory

| # | Atom | Folder | Authority | Variants | Description |
|---|------|--------|-----------|----------|-------------|
| 1 | text | `text/` | uc-atm-01 | 17 (opinion ×4, title ×3, body ×3, label ×3, instrument ×4) | LSText — typography atom |
| 2 | button | `button/` | uc-atm-02 | 6 × 5 states (primary, secondary, ghost, accept, destructive, outline) | LSButton — interactive tap targets |
| 3 | input | `input/` | uc-atm-03 | text-field + text-area × 4 states + icon slots | LSTextField + LSTextArea |
| 4 | avatar | `avatar/` | uc-atm-04 | 3 variants × 5 sizes (xs/sm/md/lg/xl) | Circular rider identity |
| 5 | divider | `divider/` | uc-atm-04 | 3 (plain, centered-label, left-label) | 1px border.subtle separator |
| 6 | spinner | `spinner/` | uc-atm-04 | 3 sizes (sm=16, md=24, lg=32) | Indeterminate copper loader |
| 7 | card | `card/` | uc-atm-05 | 3 padding (sm/md/lg) | Elevated content container |
| 8 | panel | `panel/` | uc-atm-05 | 1 (flat inset) | Grouped inset region |
| 9 | glass-panel | `glass-panel/` | uc-atm-05 | 4 (base, chrome, callout-signal, callout-warning) | Translucent map overlay with backdrop-blur |
| 10 | pill | `pill/` | uc-atm-06 | 3 × 3 (filled, outlined, ghost) × (sm, md, lg) | Non-interactive shape primitive |
| 11 | badge-weather | `badge-weather/` | uc-atm-07 | 6 (clear, rain, wind, storm, hot, cold) | Weather condition indicator |
| 12 | badge-best | `badge-best/` | uc-atm-07 | 2 (full "BEST FOR TODAY", compact "BEST") | Copper winning-route badge |
| 13 | phase-dot | `phase-dot/` | uc-atm-08 | 3 states (pending, active, done) | AI status pulse indicator |
| 14 | scrim | `scrim/` | uc-atm-09 | 6 opacity levels × 2 touch modes (non-blocking, blocking) | Dismiss overlay |
| 15 | icon | `icon/` | uc-atm-10 | 31 glyphs × 5 sizes (xs/sm/md/lg/xl) × 6 color roles | 1.5px stroke icon catalog |
| 16 | map | `map/` | uc-atm-11/12/13 | cross-platform contract (iOS MapKit + Android Mapbox) | LSMap — paper surface + polylines + annotations |
| 17 | toggle | `toggle/` | uc-mol-01 (extracted) | 2 variants (off/on) × 4 states | LSToggle — boolean switch |

## Atoms-Used Matrix

| Atom | Tokens Only | Depends On |
|------|-------------|------------|
| text | yes | — |
| button | yes | — (icon SVGs inlined) |
| input | partial | icon (leading/trailing slots) — SVGs may be inlined |
| avatar | yes | — |
| divider | yes | — |
| spinner | yes | — |
| card | yes | — |
| panel | yes | — |
| glass-panel | yes | — |
| pill | yes | — |
| badge-weather | yes | — |
| badge-best | yes | — |
| phase-dot | yes | — |
| scrim | yes | — |
| icon | yes | — |
| map | yes | — (composes badge/pill/glass-panel visually but not by import) |
| toggle | yes | — |

## Quality Bar (all 17 atoms audited)

- ✅ Zero hex literals in atom `<style>` blocks
- ✅ Zero numeric font-size / font-weight / line-height / letter-spacing inside atom-local CSS (type roles delegated to `.t-*` classes)
- ✅ Zero raw px in padding / margin / gap — all use `var(--space-*)`
- ✅ Every variant × state rendered in both themes via `.mode-dark` class
- ✅ Self-contained HTML — links only `../../typography/fonts.css`, `../../tokens/tokens.css`, `../../typography/type-modules.css`, `../_preview.css`
- ✅ Real content throughout — no "Lorem ipsum" or "preview" placeholders

## Typography Classes Available

From `typography/type-modules.css`:
- `.t-opinion-xl/lg/md/sm` — Newsreader serif (Navigator voice)
- `.t-title-lg/md/sm` — Geist 600 (screen/card titles)
- `.t-body-lg/md/sm` — Geist 400 (paragraphs)
- `.t-label-lg/md/sm` — Geist 500/600 all-caps (eyebrows, labels)
- `.t-instr-lg/md/sm/xs` — JetBrains Mono 500 (distances, coords, tnum)

## Token Categories Referenced

From `tokens/tokens.css`:
- Surface: `--surface-primary/card/inset/overlay/glass/scrim/map`
- Content: `--content-primary/secondary/tertiary/subtle/on-signal`
- Border: `--border-default/subtle/strong/focus`
- Signal: `--signal-default/hover/pressed/tint/whisper`
- Action: `--action-primary/primary-hover/primary-pressed/primary-disabled`
- Status: `--status-info/success/warning/error/recording`
- Weather: `--wx-{clear,rain,wind,storm,hot,cold}` + `-tint`
- Route: `--route-best/alt1/alt2`
- Map: `--map-paper/contour/contour-faint`
- Motion: `--duration-*`, `--ease-*`
- Radius: `--radius-none/xs/sm/md/lg/xl/pill`
- Spacing: `--space-0` → `--space-12` (4px base grid)
- Sizing: `--size-touch-min`, `--size-control-*`, `--icon-*`, `--avatar-*`
- Stroke: `--stroke-sm/md/lg`
- Opacity: `--opacity-0/subtle/focus/disabled/overlay/dim/veil/1`
