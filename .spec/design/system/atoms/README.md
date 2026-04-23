# Atoms — LaneShadow V2 Copper

Single-purpose, indivisible UI primitives. Each atom references only semantic tokens — never other atoms.

## Inventory

| Atom | Folder | Variants | Description |
|------|--------|----------|-------------|
| button | `button/` | 6 (primary, secondary, ghost, accept, destructive, outline) | Interactive tap targets for all confirmed actions |
| badge-weather | `badge-weather/` | 6 (clear, rain, wind, storm, hot, cold) | Weather condition indicators |
| badge-best | `badge-best/` | 2 (full, compact) | "Best for today" copper badge |
| icon | `icon/` | 25 icons × 4 sizes (sm/md/lg/xl) | 1.5px stroke icon catalog |
| chip-suggestion | `chip-suggestion/` | 2 (default, selected) | Clickable suggestion pill |
| input | `input/` | text-field + text-area × 4 states + icon slots | LSTextField + LSTextArea atoms |
| phase-dot | `phase-dot/` | 3 (thinking, complete, error) | AI status pulse indicator |
| scrim | `scrim/` | 2 (default, heavy) | Dismiss overlay |
| text | `text/` | 17 (opinion ×4, title ×3, body ×3, label ×3, instrument ×4) | Typography atom — all type roles |
| pill | `pill/` | 3 (filled, outlined, ghost) × 3 sizes (sm, md, lg) | Non-interactive shape primitive |
| avatar | `avatar/` | 3 variants (image, initials, placeholder) × 5 sizes (xs/sm/md/lg/xl) | Circular rider identity display |
| divider | `divider/` | 3 (plain, centered-label, left-label) | 1px border.subtle separator |
| spinner | `spinner/` | 3 sizes (sm=16px, md=24px, lg=32px) | Indeterminate copper loading indicator |
| card | `card/` | 3 padding (sm/md/lg) | Elevated content container — route cards, session tiles |
| panel | `panel/` | 1 (flat inset) | Flat grouped region — settings, info blocks, nested details |
| glass-panel | `glass-panel/` | 4 (base, chrome, callout-signal, callout-warning) | Translucent map overlay — backdrop-blur, optional accent stripes |

## Atoms-Used Matrix

| Atom | Tokens Only | Depends On |
|------|-------------|------------|
| button | yes | — (icon SVGs are inlined; no runtime dep on icon atom) |
| badge-weather | yes | — |
| badge-best | yes | — |
| icon | yes | — |
| chip-suggestion | yes | — |
| input | no | icon (leading/trailing icon slots) |
| phase-dot | yes | — |
| scrim | yes | — |
| text | yes | — |
| pill | yes | — |
| avatar | yes | — |
| divider | yes | — |
| spinner | yes | — |
| card | yes | — |
| panel | yes | — |
| glass-panel | yes | — |

## Quality Bar

- Zero hex literals in any atom CSS
- Zero numeric font-size / font-weight / line-height / letter-spacing
- Zero raw px in padding / margin / gap
- Every variant × state rendered in both themes
- Self-contained HTML (links only tokens.css, fonts.css, type-modules.css, _preview.css)
