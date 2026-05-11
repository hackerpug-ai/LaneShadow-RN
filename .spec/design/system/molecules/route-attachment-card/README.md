# route-attachment-card

LaneShadow V2 Copper · Molecule · Authority: uc-mol-08-location-route.html

---

## Purpose

LSRouteAttachmentCard is the Navigator's route result surface — used both in chat message threads and in the catalog route-list view. A **3px leading color stripe** encodes the route variant (`--route-best` copper / `--route-alt1` sage / `--route-alt2` slate) at a glance, even before the user reads the title. The card composes the best-badge, weather-badge, scenic-dots meter, difficulty pills, and an optional accept-action row.

A map thumbnail provides spatial orientation through the `ls-map` atom (UC-ATM-11/12) and the platform live map surface.

---

## Anatomy

```
┌─╎──────────────────────────────────────────────────────────┐
│ ╎  [Live map thumbnail]   [wx badge] │
│ ╎  ─────────────────────────────────────────────────────── │
│ ╎  [best badge?] [Title]                                    │
│ ╎  [via subtitle]                                           │
│ ╎  [distance] | [time] | [elevation] | [scenic dots]       │
│ ╎  [gravel pill] [climb pill] ...                           │
│ ╎  [♥ favorite flag row?]                                   │
│ ╎  [View Details ghost btn]  [Accept Route btn?]            │
└─╎──────────────────────────────────────────────────────────┘
 3px stripe: --route-best / --route-alt1 / --route-alt2
```

| Slot | Element | Notes |
|---|---|---|
| Root | `.mol-route-attachment-card` | position: relative; overflow: hidden |
| Leading stripe | `::before` pseudo | 2px wide (approx. `--space-1`); positioned left edge |
| Thumbnail | `.mol-rac__thumbnail` | 88px height (full) / 60px (compact); live map surface |
| Weather badge | `.mol-rac__weather` | Absolute top-right; wx-clear / wx-wind / wx-rain |
| Card body | `.mol-rac__body` | Column flex; gap `--space-2` |
| Head row | `.mol-rac__head` | flex-start; best-badge + title |
| Best badge | `.mol-rac__best-badge` | Star icon + "Best" label; signal.default fill |
| Title | `.mol-rac__title.t-title-md` | Wraps naturally; no ellipsis in full mode |
| Via subtitle | `.mol-rac__via.t-body-sm` | Secondary route path description |
| Metrics row | `.mol-rac__meta` | Distance + time + elevation + scenic dots |
| Metric value | `.mol-rac__metric.t-instr-sm` | Monospace; `font-feature-settings: "tnum" 1` |
| Metric separator | `.mol-rac__metric-sep` | 1px × 12px border-default vertical rule |
| Scenic dots | `.mol-rac__scenic` + `.mol-rac__scenic-dot[.is-filled]` | 5-dot meter; filled = signal.default |
| Pills | `.mol-rac__pills` + `.mol-rac__pill[.p-gravel/.p-paved/.p-climb]` | Surface type + grade |
| Favorite flag | `.mol-rac__flag` | Heart SVG + label; only rendered if `includesFavorite` |
| Accept action | `.mol-rac__action` | Ghost + accept button row; omit from DOM to hide |

---

## Variants

| Variant | Modifier | Description |
|---|---|---|
| Best · selected | `.v-best.is-selected` | Copper stripe; selected border + bg tint |
| Alt 1 | `.v-alt1` | Sage-green stripe (`--route-alt1`) |
| Alt 2 | `.v-alt2` | Slate stripe (`--route-alt2`) |
| With weather badge | `.mol-rac__weather.wx-clear/.wx-wind/.wx-rain` | Absolute top-right; color from wx palette |
| With difficulty pills | `.mol-rac__pill.p-gravel/.p-paved/.p-climb` | Surface type and grade tinted by route or signal palette |
| With best-badge | `.mol-rac__best-badge` present | Star + "Best" copper fill; only for `v-best` |
| With favorite flag | `.mol-rac__flag` row present | Heart icon + description in `--signal-default` |
| Accept visible | `.mol-rac__action` row present | Ghost "View Details" + primary "Accept Route" |
| Accept hidden | No `.mol-rac__action` | Tap-to-navigate card; no footer row |
| Compact | `.mol-route-attachment-card.is-compact` | 60px thumbnail; reduced padding; fewer metric rows |
| Full | (default) | 88px thumbnail; standard `--space-3/4/5` padding |
| Dark | `.mode-dark` on ancestor | All surface/content/border tokens auto-swap |

---

## States

| State | Visual change |
|---|---|
| Default | `--elev-card` shadow; `--border-default` border |
| Hover | `--elev-chrome` shadow; border shifts to `--border-strong` |
| Selected | `--signal-default` border; bg tinted with `color-mix(…92%, --signal-default)` |
| Selected + hover | Deeper copper shadow overlay |

---

## Atoms Used

| Atom | Usage in this molecule |
|---|---|
| `ls-badge-best` | Modeled as `.mol-rac__best-badge`; same token recipe (signal.default fill, white text, star icon) |
| `ls-badge-weather` | Modeled as `.mol-rac__weather`; same wx-* color palette and border-tint convention |
| `ls-pill` | Structural basis for `.mol-rac__pill` difficulty chips |
| `ls-btn--accept` / `ls-btn--ghost` | Composed unchanged in `.mol-rac__action` row |
| `ls-map` (UC-ATM-11/12) | Thumbnail slot owner across production and design artifacts |

---

## Token Recipe

| Property | Token |
|---|---|
| Card bg | `--surface-card` |
| Card border | `--border-default` (`--stroke-sm`) |
| Card radius | `--radius-lg` |
| Card padding (full) | `--space-3` top/bottom, `--space-4` right, `--space-5` left |
| Card padding (compact) | `--space-2` top/bottom, `--space-4` right, `--space-5` left |
| Card shadow | `--elev-card` → hover: `--elev-chrome` |
| Selected border | `--signal-default` |
| Selected bg tint | `color-mix(in srgb, --surface-card 92%, --signal-default)` |
| Body gap | `--space-2` |
| Leading stripe width | `--space-1` (2px) |
| Stripe — best | `--route-best` |
| Stripe — alt1 | `--route-alt1` |
| Stripe — alt2 | `--route-alt2` |
| Thumbnail height (full) | `88px` |
| Thumbnail height (compact) | `60px` |
| Thumbnail bg | `--map-paper` |
| Thumbnail border | `--border-subtle` (`--stroke-sm`) |
| Best-badge bg | `--signal-default` |
| Best-badge shadow | `color-mix(in srgb, --signal-default 40%, transparent)` |
| Title color | `--content-primary` |
| Via color | `--content-secondary` |
| Metric color | `--content-primary` (monospace) |
| Metric sep | `--border-default` |
| Scenic dot filled | `--signal-default` |
| Scenic dot empty | `--border-strong` |
| Scenic label | `--content-tertiary` |
| Flag icon fill | `--signal-default` |
| Flag label | `--signal-default` |
| Pill border (default) | `--border-default` |
| Pill bg (default) | `--surface-inset` |
| Pill gravel tint | `color-mix(in srgb, --route-alt1 35%, transparent)` border / 8% bg |
| Pill paved tint | `color-mix(in srgb, --route-alt2 35%, transparent)` border / 8% bg |
| Pill climb | `--signal-tint` / `--signal-whisper` |
| Weather wx-clear | `--wx-clear-tint` bg, `--wx-clear` text |
| Weather wx-wind | `--wx-wind-tint` bg, `--wx-wind` text |
| Weather wx-rain | `--wx-rain-tint` bg, `--wx-rain` text |
| Typography — title | `.t-title-md` |
| Typography — via | `.t-body-sm` |
| Typography — metrics | `.t-instr-sm` |
| Typography — badges | `.t-label-sm` |
| Typography — pills | `.t-label-sm` |
| Typography — scenic label | `.t-label-sm` |
| Typography — flag label | `.t-label-sm` |
| Typography — action buttons | `.t-label-md` (accept), `.t-body-sm` (ghost) |

---

## Accessibility

- Card has `role="article"` or `role="button"` (if tap-to-navigate); add `aria-label="[Route name] — [distance], [time]"` in native implementation
- Accept button: `aria-label="Accept [route name] as your route"`
- Best badge: `aria-label="Recommended route"` (decorative star icon hidden from screen readers)
- Weather badge: `aria-label="Weather: Clear"` / "Windy" / "Rainy"
- Favorite flag: `aria-label="Includes [segment name]"`
- Scenic dots: `aria-label="Scenic rating: 5 out of 5"` via `aria-valuemin/max/now`
- Color-only variant encoding (best/alt1/alt2 stripe) is supplemented by title position and badge — not color alone
- Minimum touch target on accept button: `--size-touch-min` (44px)

---

## Notes

- Map thumbnail: `.mol-rac__thumbnail` is owned by the `ls-map` atom (UC-ATM-11 iOS / UC-ATM-12 Android) and must render as a live map surface.
- Polyline `stroke` must always use `var(--route-best)`, `var(--route-alt1)`, or `var(--route-alt2)` — never raw hex.
- The card `max-width: 340px` constraint keeps the layout coherent in the Navigator chat column. In a full-bleed list view, remove the max-width constraint.
- The leading stripe uses `::before` positioned absolute so it does not affect flex layout. Left padding `--space-5` (16px) provides clearance.
- The compact variant omits the `via` subtitle row in addition to reducing padding and thumbnail height — implement as `isCompact` prop toggling the `.is-compact` class and conditionally rendering the subtitle.
- Weather badge absolute positioning requires the card root `position: relative; overflow: hidden`.
- In React Native: the map thumbnail renders `<LSMap live />`. The accept action renders conditionally based on `showAcceptAction` prop.
