# org-sessions-drawer — LSSessionsDrawer

**Authority:** [`uc-org-05-sessions-drawer.html`](../../../../prds/v2/concepts/uc-org-05-sessions-drawer.html) · [`07-uc-org.md §UC-ORG-05`](../../../../prds/v2/07-uc-org.md)

Left-anchored conversation-history drawer. 312pt wide (82% at 390pt phone). Sticky header with "Rides" title + NEW button, section-label row ("THIS WEEK" + count), then a scrollable list of session rows. The active session carries a copper left-stripe and a faint tinted background.

## Purpose

Sessions are organized as conversations, not as "saved routes." A route is the output; the session is the negotiation. Rider scanning past rides sees the opening prompt + navigator callout preview, not a route stat — because the conversation is what distinguishes one session from another.

## Anatomy

```html
<div class="org-sessions-drawer">
  <div class="org-sessions-drawer__header">
    <span class="t-opinion-lg org-sessions-drawer__title">Rides</span>
    <button class="ls-btn ls-btn--outline">
      <svg>…plus…</svg> NEW
    </button>
  </div>

  <div class="org-sessions-drawer__section-label-row">
    <span class="t-label-sm org-sessions-drawer__section-label">This Week</span>
    <span class="t-instr-xs org-sessions-drawer__section-count">5</span>
  </div>

  <div class="org-sessions-drawer__list">
    <div class="org-sessions-drawer__row org-sessions-drawer__row--active">
      <div class="org-sessions-drawer__row-title-row">
        <span class="t-title-sm org-sessions-drawer__row-title">Santa Cruz Loop</span>
        <span class="t-instr-xs org-sessions-drawer__row-when">Today</span>
      </div>
      <div class="t-body-sm org-sessions-drawer__row-preview">Take 1 south to Davenport…</div>
      <div class="org-sessions-drawer__row-meta">
        <span class="org-sessions-drawer__row-variant-dot org-sessions-drawer__row-variant-dot--best"></span>
        <span class="t-label-sm org-sessions-drawer__row-meta-chip org-sessions-drawer__row-meta-chip--primary">Active</span>
      </div>
    </div>
    …
  </div>
</div>

<!-- Alternate: empty state -->
<div class="org-sessions-drawer__empty">
  <div class="org-sessions-drawer__empty-icon">…clock svg…</div>
  <span class="t-body-sm org-sessions-drawer__empty-label">No rides yet. Tap NEW to start a conversation.</span>
</div>
```

## Variants

| Variant | Composition notes |
|---|---|
| Default | 5 sessions, one `__row--active` |
| Empty state | Replace `__list` with `__empty` (clock icon + prompt) |
| Long list (20) | List overflow scrolls; header + section-label stay sticky above (via `flex-shrink: 0`) |
| No active session | Remove `--active` modifier from all rows |
| Dark mode | All tokens re-resolve; copper stripe remains vivid |

## States

- **`.org-sessions-drawer__row--active`** — 3pt left stripe (`::before` pseudo-element in `--signal-default`) + `background: var(--signal-whisper)` tinted row. On dark, the tint uses `color-mix(surface-card 86%, signal-default)` for visibility against the ink surface.
- **Primary meta chip** — when active, `.org-sessions-drawer__row-meta-chip--primary` resolves to `var(--signal-default)`; otherwise default `var(--content-tertiary)`.

## Composes

| Tier | Consumer | Role |
|---|---|---|
| Atom | `.ls-btn` (`.ls-btn--outline`) | NEW trailing action in header |
| Atom (implicit) | `LSIcon(.plus, .clock)` | NEW chip icon + empty-state icon (inline SVG) |
| Organism (conceptual) | `LSSectionHeader` (UC-ORG-07) | The caps "THIS WEEK" section-label-row mirrors LSSectionHeader.caps — implemented inline here rather than nested so the drawer ships as a single rooted organism |
| Typography module | `.t-opinion-lg` | "Rides" drawer title |
| Typography module | `.t-title-sm` | Session row title (ellipsis-truncated) |
| Typography module | `.t-body-sm` | Session preview (italic Newsreader override) |
| Typography module | `.t-label-sm` | Section label + meta chips |
| Typography module | `.t-instr-xs` | Row "when" trailing label + section count |

## Atoms / molecules used

| Layer | Consumer |
|---|---|
| atom: button | NEW chip (outline) |
| atom: text | All labels and previews |
| atom: icon | Plus, clock (inline SVGs) |
| atom: divider (implicit) | Row separators via `border-bottom` on each `__row` |

No molecules consumed — sessions-drawer is a large atoms-only organism (per the spec's §04 Composition table).

## Token recipe

| Property | Token |
|---|---|
| container `background` | `var(--surface-card)` |
| container `border-right` | `var(--stroke-sm) solid var(--border-default)` |
| container `box-shadow` | `var(--elev-overlay)` |
| header `padding` | `var(--space-6) var(--space-5) var(--space-4)` |
| header `border-bottom` | `var(--stroke-sm) solid var(--border-subtle)` |
| title `font-family` | `var(--font-opinion)` |
| title `color` | `var(--content-primary)` |
| section-label-row `padding` | `var(--space-4) var(--space-5) var(--space-2)` |
| section-label `color` | `var(--content-tertiary)` |
| section-count `color` | `var(--content-tertiary)` |
| row `padding` | `var(--space-3) var(--space-5) var(--space-3) var(--space-6)` — 20pt left reserves stripe space |
| row `border-bottom` | `var(--stroke-sm) solid var(--border-subtle)` |
| row `gap` (flex-col) | `var(--space-1)` |
| row active `background` | `var(--signal-whisper)` — dark mode auto-resolves to the translucent copper glow via the token's `.mode-dark` override |
| active stripe `width` | `var(--stroke-lg)` — 2pt |
| active stripe `background` | `var(--signal-default)` |
| title row `gap` | `var(--space-3)` |
| title `color` | `var(--content-primary)` |
| when `color` | `var(--content-tertiary)` |
| preview `font-family` / `font-style` / `color` | `var(--font-opinion)` / `italic` / `var(--content-secondary)` |
| meta `gap` | `var(--space-2)` |
| meta chip default `color` | `var(--content-tertiary)` |
| meta chip primary `color` | `var(--signal-default)` |
| variant dot | `var(--space-3) × var(--space-1)`, radius `var(--radius-xs)` |
| variant dot color | `var(--route-best)` / `var(--route-alt1)` / `var(--route-alt2)` |
| empty `padding` | `var(--space-8) var(--space-6)` |
| empty icon size | `var(--size-control-lg)` |
| empty icon `background` | `var(--surface-inset)` |
| empty icon `color` | `var(--content-tertiary)` |
| empty label `color` | `var(--content-tertiary)` |

## Motion references

| Trigger | Recipe | Effect |
|---|---|---|
| Hamburger tap | `sidebarSlideIn` | Drawer translates `x:-100%` → `x:0`; scrim fades 0 → 0.35 simultaneously (320ms spring) |
| Swipe left / scrim tap | `sidebarSlideIn` (reverse) | Drawer translates `x:0` → `x:-100%`; scrim fades to 0; `onDismiss` fires after animation completes |

Motion is owned by the presenting `LSMapLayer.leadingDrawer` slot; the organism does not carry its own animation CSS.

## Accessibility

- `role="navigation"` on the container (this drawer is the rider's way to navigate between sessions).
- Header should be a `<header>` element so assistive tech announces the region structure.
- Each session row should be rendered as a `<button>` (or have `role="button"` + keyboard handlers) so it is focusable and announced; the "Active" meta chip maps to `aria-current="page"`.
- NEW button needs `aria-label="Start a new conversation"` if the surrounding "NEW" text is the only label (abbreviation is dropped on screen readers).
- When the drawer is presented modally, focus should move to the NEW button on enter and return to the invoking control on dismiss.
- The empty-state icon is decorative; the label carries the semantic.

## Organism-local constants

| Property | Value | Reason |
|---|---|---|
| `82%` drawer width (on demo stage) | — | Preview-only scale. Canonical spec is 312pt on a 390pt iPhone viewport (= ~80%). Left as a percentage so the drawer adapts to screen width at runtime. |
| `-webkit-line-clamp: 1` on preview | — | Non-standard CSS required for single-line ellipsis truncation with `display: -webkit-box`. No token equivalent. |

Every other color / spacing / radius / elevation resolves to a token.

## Relationship to `LSSectionHeader` (UC-ORG-07)

The spec calls for the section-label row to be rendered as `LSSectionHeader(title: "THIS WEEK")` with the caps variant. We render it inline (`.org-sessions-drawer__section-label-row` with `.t-label-sm` text) rather than nesting another organism. The styling is token-equivalent; if `LSSectionHeader` evolves, the drawer should be audited to keep parity.

## How to preview

Open `organisms/sessions-drawer/sessions-drawer.html` in a browser — every story renders in both light and dark `theme-pane`s with the drawer anchored to the leading edge of a simulated map scene.
