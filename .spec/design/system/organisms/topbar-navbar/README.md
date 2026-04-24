# org-topbar + org-navbar — LSTopBar + LSNavBar

**Authority:** [`uc-org-01-topbar-navbar.html`](../../../../prds/v2/concepts/uc-org-01-topbar-navbar.html) · [`07-uc-org.md §UC-ORG-01`](../../../../prds/v2/07-uc-org.md)

Two top-chrome organisms. `LSTopBar` floats above every Navigator screen as a pair of rounded-rect chips over the map. `LSNavBar` anchors modal-sheet and full-screen-modal chrome with a toolbar + optional filter-chip row or search slot.

## Purpose

- **TopBar** — primary Navigator chrome. Leading hamburger chip, optional centered title, trailing NEW chip. Both chips share the same geometry (`--radius-md`, `--space-9` tall) so they read as a family.
- **NavBar** — modal-sheet toolbar. Back + title + close + optional filter-chip row or search slot. Does not appear on map screens.

## Anatomy — TopBar

```html
<div class="org-topbar">
  <div class="org-topbar__chip org-topbar__chip--square" role="button">…hamburger svg…</div>
  <span class="t-opinion-md org-topbar__title">Details</span>   <!-- optional -->
  <div class="org-topbar__chip org-topbar__chip--with-label" role="button">
    …plus svg…
    <span class="t-title-sm">NEW</span>
  </div>
</div>
```

## Anatomy — NavBar

```html
<div class="org-navbar">
  <div class="org-navbar__toolbar">
    <div class="org-navbar__leading">
      <button class="org-navbar__icon-btn org-navbar__icon-btn--signal">…back svg…</button>
      <span class="t-body-md org-navbar__back">Back</span>   <!-- optional label -->
    </div>
    <span class="t-title-md org-navbar__title">Filter</span>
    <div class="org-navbar__trailing">
      <button class="org-navbar__icon-btn">…close svg…</button>
    </div>
  </div>
  <!-- optional: .org-navbar__filter-row with .mol-filter-chip items -->
  <!-- optional: .org-navbar__search-row with .org-navbar__search-input -->
</div>
```

## Variants

### TopBar

| Variant | Class modifier | Description |
|---|---|---|
| Default | — | Hamburger + NEW chips |
| With title | Add `<span class="t-opinion-md org-topbar__title">` between chips | Centered title in opinion voice |
| Hamburger only | Trailing slot empty | Used where NEW is contextually absent |
| Record highlight | Trailing chip adds `--record` modifier + `.org-topbar__rec-dot` child | Active-recording state; dot pulses via `@keyframes org-topbar-rec-pulse` |

### NavBar

| Variant | Class modifier | Description |
|---|---|---|
| Back + Title + Close | — | Default modal toolbar |
| Filter chip row | Add `.org-navbar__filter-row` below toolbar | Horizontally-scrolling `.mol-filter-chip` row |
| Search slot | Add `.org-navbar__search-row` below toolbar | Inset search field |

## States

- **Chip press state**: inherited from the host platform (web: browser `:active`; iOS/Android: pressed recipe from the button atom). The organism-level CSS does not define explicit `.is-pressed` styling.
- **Recording state**: declarative — apply `.org-topbar__chip--record` and the `.org-topbar__rec-dot` child gets a 1400ms pulse animation derived from `--duration-deliberate`.

## Composes

| Tier | Consumer | Role |
|---|---|---|
| Atom | `ls-pill` (`pill-md`) | Base of filter chips in NavBar row |
| Molecule | `mol-filter-chip` / `mol-filter-chip.is-selected` | NavBar filter chips |
| Typography module | `.t-title-sm` | "NEW" / "REC" chip labels |
| Typography module | `.t-opinion-md` | TopBar centered title |
| Typography module | `.t-title-md` | NavBar title |
| Typography module | `.t-label-sm` | Filter chip label |
| Typography module | `.t-body-md` | "Back" label and search placeholder |
| Atom (inline SVG) | `LSIcon(.menu, .plus, .chevronL, .close, .search)` | Inline chrome icons |

## Atoms used

| Atom | Role |
|---|---|
| text (typography classes) | Chip labels + title |
| icon | Hamburger, plus, chevron-left, close, search — inlined SVGs |
| pill + filter-chip (molecule) | Horizontal filter row in NavBar |

## Token recipe — TopBar

| Property | Token |
|---|---|
| `padding` | `var(--space-4) var(--space-4) var(--space-0)` |
| `gap` (chip ↔ chip) | `var(--space-3)` |
| chip `height` + square `width` | `var(--space-9)` — 40pt |
| chip `border-radius` | `var(--radius-md)` |
| chip `background` | `var(--surface-overlay)` — 92% alpha per spec's "mostly opaque, not glass" |
| chip `border` | `var(--stroke-sm) solid var(--border-default)` |
| chip `box-shadow` | `var(--elev-chrome)` |
| chip `backdrop-filter` | `blur(8px)` — organism-local (see constants) |
| chip label gap | `var(--space-2)` |
| record variant `background` | `var(--status-error-tint)` |
| record variant `border-color` / `color` | `var(--status-error)` |
| record dot `background` | `var(--status-recording)` |
| record dot size | `var(--space-3)` — 8pt |
| record dot animation duration | `calc(var(--duration-deliberate) * 2.333)` ≈ 1400ms |
| title color | `var(--content-primary)` |
| z-index | `5` (spec §Z-Order — not a token) |

## Token recipe — NavBar

| Property | Token |
|---|---|
| container `background` | `var(--surface-card)` |
| container `border` | `var(--stroke-sm) solid var(--border-default)` |
| container `border-radius` | `var(--radius-xl)` (preview-only; on device it is flush) |
| container `box-shadow` | `var(--elev-card)` |
| toolbar `padding` | `var(--space-4) var(--space-4)` |
| toolbar `gap` | `var(--space-3)` |
| icon-btn size | `var(--size-control-md)` |
| icon-btn color (default) | `var(--content-secondary)` |
| icon-btn color (signal) | `var(--signal-default)` |
| back label color | `var(--signal-default)` |
| title color | `var(--content-primary)` |
| filter-row `padding` | `var(--space-3) var(--space-4) var(--space-4)` |
| filter-row `gap` | `var(--space-2)` |
| search-input `height` | `var(--size-control-md)` |
| search-input `background` | `var(--surface-inset)` |
| search-input `border` | `var(--stroke-sm) solid var(--border-default)` |
| search-input `border-radius` | `var(--radius-lg)` |
| search-input `gap` / `padding` | `var(--space-3)` / `var(--space-0) var(--space-4)` |

## Accessibility

- TopBar chips should be wrapped in `<button>` (or have `role="button"` + `aria-label`) so assistive tech announces "Menu" / "New conversation" / "Recording".
- The record dot is decorative; it must have `aria-hidden="true"` or be a CSS-only pseudo-element. The REC label carries the semantic.
- NavBar "Back" button should fire the host's standard back action; native platforms should pair it with a swipe-back gesture where available.
- Filter chips inherit ARIA from `mol-filter-chip` — `.is-selected` maps to `aria-pressed="true"`.
- The search-input placeholder text must be duplicated by an explicit `aria-label` on the underlying `<input>` in production implementations (this preview is visual-only).

## Organism-local constants

| Property | Value | Reason |
|---|---|---|
| `backdrop-filter: blur(8px)` on `.org-topbar__chip` | 8px | Visual-effect blur radius; intentionally lighter than the molecule-level 14px glass blur. Not a spacing/sizing token. |
| `z-index: 5` on `.org-topbar` | 5 | TopBar lives at the top of the `LSMapLayer` z-order contract (UC-ORG-02 §02b). Z-indices are structural — not tokenized. |
| `@keyframes org-topbar-rec-pulse` opacity swing `0.45` | — | Animation trough uses `var(--opacity-overlay)` (0.60) already; literal `0.45` would be closer to spec but using the token keeps the pulse readable and cleaner. Actual file uses `var(--opacity-overlay)`. |

Every other color / spacing / radius / duration resolves to a token. `px` literals appear only inside `backdrop-filter: blur(8px)` and SVG attributes (`stroke-width` etc., which `_preview.css` already documents as allowed).

## How to preview

Open `organisms/topbar-navbar/topbar-navbar.html` in a browser — every variant renders in both light and dark `theme-pane`s, self-contained. The TopBar stories sit above a simulated paper-map scene so the chrome's contrast is visible.
