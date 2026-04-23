# content-card

LaneShadow V2 Copper · Molecule · Authority: uc-mol-01-card-listrow.html

## Purpose

`LSContentCard` wraps `ls-card` (UC-ATM-05) with a fixed slot schema — image header, title, subtitle, meta stats, chip row, and action footer. It gives organisms a single, consistent API for every card-shaped content surface: ride discovery feeds, saved-routes lists, community post previews. No organism should reach for raw surface tokens to build a card; it uses this molecule.

## Anatomy (HTML snippet)

```html
<div class="ls-card mol-content-card">

  <!-- Slot: image header (optional) -->
  <div class="mol-content-card__image-header">
    <img src="…" alt="…">
    <span class="mol-content-card__image-label t-instr-xs">Wasatch Crest Trail</span>
  </div>

  <!-- Slot: body (always present) -->
  <div class="mol-content-card__body">
    <div class="mol-content-card__title-row">
      <span class="mol-content-card__title t-title-md">Emigration Canyon Climb</span>
    </div>
    <div class="mol-content-card__subtitle t-body-sm">28 mi · 1h 04m · Mountain</div>
    <div class="mol-content-card__meta">
      <span class="mol-content-card__meta-item t-instr-sm">3,400 ft gain</span>
      <span class="mol-content-card__meta-dot"></span>
      <span class="mol-content-card__meta-item t-instr-sm">Last ridden Apr 18</span>
    </div>
    <div class="mol-content-card__chip-row">
      <span class="mol-content-card__chip mol-content-card__chip--signal t-label-sm">Best Route</span>
      <span class="mol-content-card__chip t-label-sm">Alpine</span>
    </div>
  </div>

  <!-- Slot: footer (optional) -->
  <div class="mol-content-card__footer">
    <button class="ls-btn ls-btn--primary ls-btn--pill" style="flex:1;">Ride This</button>
    <button class="ls-btn ls-btn--ghost ls-btn--pill">Save</button>
  </div>

</div>
```

## Variants

| Variant | Modifier class(es) | Slots active |
|---|---|---|
| Title Only | — | body (title) |
| Title + Subtitle + Meta | — | body (title, subtitle, meta) |
| With Chips | — | body (title, subtitle, chips) |
| With Actions Footer | — | body + footer |
| With Image Header | — | image-header + body + footer |
| Interactive (hover/pressed) | `mol-content-card--interactive` | any |

## States

| State | Class | Effect |
|---|---|---|
| Default | — | `elev-card` shadow, `surface-card` background |
| Hover | `.mol-content-card--interactive.is-hover` | `elev-overlay` shadow upgrade |
| Pressed | `.mol-content-card--interactive.is-pressed` | `translateY(1px)`, shadow returns to `elev-card` |
| Disabled | `.mol-content-card--interactive.is-disabled` | `opacity-disabled` (0.38), `pointer-events: none` |

## Atoms Used

| Atom | Role | Class |
|---|---|---|
| LSCard | Container surface, border, radius, shadow | `ls-card` |
| LSButton (primary, pill) | Primary CTA in footer | `ls-btn ls-btn--primary ls-btn--pill` |
| LSButton (ghost, pill) | Secondary action in footer | `ls-btn ls-btn--ghost ls-btn--pill` |
| LSPill / chip | Taxonomy labels in chip row | `mol-content-card__chip` (inline, not `ls-pill`) |

Note: the chip inside the card is a molecule-local primitive, not the standalone `ls-pill` atom, because it uses a tighter padding and border variant. If `ls-pill` gains a `--compact` modifier that matches, migration is straightforward.

## Token Recipe

| Property | Token |
|---|---|
| Card background | `--surface-card` |
| Card border | `--stroke-sm` + `--border-default` |
| Card radius | `--radius-lg` (from `ls-card`) |
| Card shadow | `--elev-card` / `--elev-overlay` on hover |
| Body padding | `--space-4` (12px) |
| Body gap between rows | `--space-2` (4px) |
| Footer background | `--surface-inset` |
| Footer padding | `--space-3` top/bottom + `--space-4` sides |
| Footer top border | `--stroke-sm` + `--border-subtle` |
| Footer gap | `--space-3` |
| Title color | `--content-primary` |
| Subtitle color | `--content-secondary` |
| Meta item color | `--content-tertiary` |
| Meta dot background | `--border-strong` |
| Meta dot size | `--space-1` × `--space-1` |
| Chip background | `--surface-inset` |
| Chip border | `--stroke-sm` + `--border-default` |
| Chip radius | `--radius-pill` |
| Chip text color | `--content-secondary` |
| Chip--signal background | `--signal-whisper` |
| Chip--signal border | `--signal-tint` |
| Chip--signal text | `--signal-default` |
| Image header height | 120px (fixed dimension, not a token — TOKEN_GAP) |
| Image overlay gradient stop | `--surface-scrim` |
| Image label color | `--content-on-signal` at `--opacity-dim` |
| Hover shadow | `--elev-overlay` |
| Pressed translate | 1px (unit offset, not a spacing token) |
| Disabled opacity | `--opacity-disabled` |

## Accessibility

- The card itself is a `div`, not interactive. Add `role="button"` and `tabindex="0"` for keyboard navigation when the whole card is tappable.
- Footer buttons are native `<button>` elements and receive focus natively.
- `mol-content-card__image-header` should contain a real `<img alt="…">` in production; the `mol-content-card__image-fill` placeholder is for design previews only.
- Color contrast: title (`--content-primary` on `--surface-card`) meets WCAG AA for all sizes used here.
- Chip text color (`--content-secondary` / `--signal-default`) on their respective backgrounds meets AA at the `t-label-sm` size.

## Notes

- `ls-card` provides `overflow: hidden`, `border-radius`, `border`, and `box-shadow`. The molecule must not re-declare those properties.
- The image header's gradient overlay (`::after`) ensures the `mol-content-card__image-label` is legible regardless of photo content.
- `mol-content-card--interactive` is an opt-in modifier; static cards (e.g., info panels) omit it.
- Chip row gap uses `--space-2` (4px); body row gap uses `--space-2` (4px). Both intentional — chip row is tighter.
- TOKEN_GAP: image header fixed height 120px has no token equivalent; recommend adding `--size-card-image-sm: 120px` to sizing tokens in a future token pass.
