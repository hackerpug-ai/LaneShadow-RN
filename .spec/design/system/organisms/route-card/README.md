# org-route-card — LSRouteCard

**Authority:** [`uc-org-06-route-card.html`](../../../../prds/v2/concepts/uc-org-06-route-card.html) · [`07-uc-org.md §UC-ORG-06`](../../../../prds/v2/07-uc-org.md)

Full route-card organism used in catalog views, search results, and discovery surfaces. Unlike `LSRouteAttachmentCard` (compact, UC-MOL-08), this card features an `LSMap` preview with the polyline auto-framed and start/end annotations, plus a richer info block with tags and saved state.

## Purpose

Map-first, data-second. A rider scanning a catalog can immediately see whether a route winds through hills or follows a flat coastal highway. The polyline preview does more work than stats — but the stats + difficulty tag complete the decision surface.

## Anatomy

```html
<div class="ls-card org-route-card">
  <div class="org-route-card__map">
    <div class="org-route-card__live-map" data-map-surface="live-mapbox"></div>
    <span class="org-route-card__marker org-route-card__marker--start"></span>
    <span class="org-route-card__marker org-route-card__marker--end"></span>
  </div>
  <div class="org-route-card__info">
    <div class="org-route-card__title-row">
      <span class="t-title-md org-route-card__title">The Skyline Spine</span>
      <!-- optional saved icon -->
      <span class="org-route-card__saved-icon">…heartFill svg…</span>
    </div>
    <div class="org-route-card__sub">
      <span class="t-instr-sm">47 mi</span>
      <span class="org-route-card__sub-sep"></span>
      <span class="t-instr-sm">1h 22m</span>
    </div>
    <div class="org-route-card__tags">
      <span class="ls-pill pill-sm org-route-card__tag--moderate">Moderate</span>
      <span class="ls-pill pill-sm">Paved</span>
    </div>
  </div>
</div>
```

The organism extends `.ls-card` (UC-ATM-05) by zeroing its padding (so the map preview reaches the card edges) and introducing the `.org-route-card__info` block with its own internal padding.

## Variants

| Variant | Modifier | Composition notes |
|---|---|---|
| Default | — | Polyline in `--route-best` + start/end markers + moderate tag |
| Saved | `.org-route-card__saved-icon` in title row | Heart-fill icon in `--signal-default` |
| Alt variant | Polyline stroke `var(--route-alt1)` + marker overrides | Dashed polyline + sage green markers |
| Long title overflow | `.org-route-card__title--overflow` on title | Single-line ellipsis truncation |
| Missing data | `.org-route-card__placeholder` inside map slot + `.org-route-card__sub--missing` | em-dash values + "Unknown" tag |
| Dark mode | Surface + borders re-resolve via tokens | Best-badge copper remains vivid |

## States

- **Saved = true** — render `.org-route-card__saved-icon` in the title row.
- **Tag tint** — apply one of `.org-route-card__tag--{easy,moderate,hard}` modifiers to the tag's `.ls-pill` base. Non-tinted tags keep the default neutral pill tokens.

## Composes

| Tier | Consumer | Role |
|---|---|---|
| Atom | `.ls-card` | Base wrapper — surface, border, elevation, radius |
| Atom | `.ls-pill` (`.pill-sm`) | Difficulty + descriptor tags |
| Atom (inline SVG) | `LSIcon(.heartFill)` | Saved state icon |
| Atom (platform) | `LSMap(.preview)` | Polyline preview with camera fit (native only — SVG stand-in here) |
| Typography module | `.t-title-md` | Route title |
| Typography module | `.t-instr-sm` | Distance / time pair |
| Typography module | `.t-label-sm` | Tag labels |
| Typography module | `.t-body-sm` | Placeholder text ("Map preview unavailable") |

## Atoms / molecules used

| Layer | Consumer |
|---|---|
| atom: card | Base wrapper |
| atom: pill | Tags |
| atom: icon | heartFill (saved), start/end markers (organism-local composition) |
| atom: text | All labels |
| atom: map | Polyline preview (native) / inline SVG (web preview) |

No molecules consumed — this is a large organism composed directly from atoms.

## Token recipe

| Property | Token |
|---|---|
| card `padding` override | `var(--space-0)` — lets the map slot extend edge-to-edge |
| map slot `aspect-ratio` | `9 / 4` — yields ~160pt at 360pt card width |
| map contour grid | `var(--map-contour-faint)`, size `var(--space-7)` |
| map bottom gradient | `linear-gradient(transparent, var(--surface-scrim))` |
| start-marker size | `var(--space-4)` — 12pt |
| start-marker `background` | `var(--signal-default)` |
| start-marker `border` | `var(--stroke-lg) solid var(--surface-card)` |
| end-marker size | `var(--space-5)` — 16pt ring |
| end-marker `border` | `var(--stroke-lg) solid var(--signal-default)` |
| end-marker dot | `var(--space-2)` / `var(--signal-default)` |
| info `padding` | `var(--space-4) var(--space-5) var(--space-5)` |
| info `gap` | `var(--space-3)` |
| title `color` | `var(--content-primary)` |
| saved-icon `color` | `var(--signal-default)` |
| sub `color` | `var(--content-secondary)` |
| sub-sep `width` / `height` | `var(--stroke-sm) × var(--space-3)` |
| sub-sep `background` | `var(--border-default)` |
| tag row `gap` | `var(--space-2)` |
| tag `--easy` | `background var(--status-success-tint)` / `border var(--status-success)` / `color var(--status-success)` |
| tag `--moderate` | `background var(--status-warning-tint)` / `border var(--status-warning)` / `color var(--status-warning)` |
| tag `--hard` | `background var(--status-error-tint)` / `border var(--status-error)` / `color var(--status-error)` |
| placeholder `color` | `var(--content-tertiary)` |

## Motion references

| Trigger | Recipe | Effect |
|---|---|---|
| Card rendered in catalog | `none` | No entrance animation at card level |
| Map preview loads | `routeDrawOn` | Polyline draws with `stroke-dashoffset` animation (280ms) |

## Accessibility

- The card container should have `role="link"` or be wrapped in an `<a>` so riders can tap through to RouteDetails.
- `LSIcon(.heartFill)` is decorative — the semantic "Saved" state should be surfaced via `aria-label="Saved"` on the card or a visually-hidden text span.
- Tag labels must use the platform's native semantic-color mapping: easy/moderate/hard are communicated both by tint AND by text so color-blind users aren't dependent on chroma.
- Start/end markers are visual cues only; the route's direction should be announced by the route-title + via sequence on native platforms.

## Organism-local constants

| Property | Value | Reason |
|---|---|---|
| `.ls-card` padding override to `var(--space-0)` | — | Atom modifier pattern: the organism zeroes the atom's padding so the embedded map extends edge-to-edge. Padding is re-applied inside `__info`. |
| `aspect-ratio: 9 / 4` on map slot | — | Enforces ~160pt map height at 360pt card width — spec constant. |
| Inline `style="bottom: …"` on marker positions | — | Marker placement depends on the actual polyline geometry, which varies per route. Inline styles here use token-based values (`var(--space-*)`) — the positions themselves are route-specific layout data, not stylistic tokens. |

Every color / spacing / radius / elevation resolves to a token.

## How to preview

Open `organisms/route-card/route-card.html` in a browser — every story renders in both light and dark `theme-pane`s.
