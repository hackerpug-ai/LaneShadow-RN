# org-section-header — LSSectionHeader

**Authority:** [`uc-org-07-section-header.html`](../../../../prds/v2/concepts/uc-org-07-section-header.html) · [`07-uc-org.md §UC-ORG-07`](../../../../prds/v2/07-uc-org.md)

The simplest organism in the tier: an in-screen group title row with an optional trailing "See all" link. Used by `LSSessionsDrawer` (caps variant) and across catalog/discovery surfaces (title + see all).

## Purpose

Centralize the "named section" pattern so every screen that groups content under a title composes from the same row — no per-screen re-implementation.

## Anatomy

```html
<div class="org-section-header">
  <span class="t-title-md org-section-header__title">Nearby Routes</span>
  <a class="t-body-md org-section-header__see-all" href="#">
    See all
    <svg>…</svg>
  </a>
</div>
```

## Variants

| Variant | Class modifier | Title typography | Trailing |
|---|---|---|---|
| Title only | — | `.t-title-md` on title | none |
| Title + See all | — | `.t-title-md` on title | `.org-section-header__see-all` link |
| Caps label (drawer) | `org-section-header__title--caps` on title element | `.t-label-sm` + token color override | usually none |
| Inset · sm | `.org-section-header--inset-sm` on container | — | — |
| Inset · default | — | — | — |
| Inset · md | `.org-section-header--inset-md` on container | — | — |
| Inset · none (flush) | `.org-section-header--inset-none` on container | — | — |

## States

This organism has no interactive state on the container itself. The `.see-all` link inherits the default anchor press feedback from the browser (or the host platform's pressed styling). There is no hover/focus/active treatment defined beyond the atom-level defaults.

## Composes

| Tier | Consumer | Role |
|---|---|---|
| Typography module | `.t-title-md` | Default title (ui.title.md — 14pt Geist 600) |
| Typography module | `.t-label-sm` | Caps variant title (ui.label.sm — 8.5pt 600 0.14em uppercase) |
| Typography module | `.t-body-md` | "See all" link text (ui.body.md — 12pt Geist 400) |
| Atom (implicit) | `LSIcon(.chevronRight)` | Trailing chevron on See all link (inline SVG) |

> No molecules consumed. This is an atoms-only organism per the Composition table in `uc-org-07 §04`.

## Atoms used

| Atom | Role |
|---|---|
| text (typography classes) | `title` and `see-all` typography |
| icon | 12pt chevronRight SVG on the `see-all` link |

## Token recipe

| Property | Token |
|---|---|
| `padding` (default) | `var(--space-4) var(--space-5) var(--space-4) var(--space-4)` — 12/16/12/12pt |
| `padding-left` on `--inset-sm` | `var(--space-3)` — 8pt |
| `padding-left` on `--inset-md` | `var(--space-5)` — 16pt |
| `padding` on `--inset-none` | `var(--space-0)` left + right |
| `gap` (title ↔ trailing) | `var(--space-4)` — 12pt |
| `align-items` | `baseline` — text baselines align across the row |
| title color | `var(--content-primary)` |
| caps title color | `var(--content-tertiary)` — matches spec's `textSubtle` |
| see-all color | `var(--signal-default)` — copper link |
| see-all gap (text ↔ icon) | `var(--space-2)` — 4pt |
| see-all svg opacity | `var(--opacity-dim)` — 0.76 |

## Accessibility

- The container has `role="group"` semantics via HTML grouping — no explicit ARIA needed at the organism level.
- The "See all" link should be rendered as an `<a>` or `<button>` in consumers so it is keyboard-focusable and screen-reader-readable.
- Native platforms (SwiftUI, Compose) should provide an `accessibilityLabel` for the caps variant since the visual all-caps styling is CSS-only and the underlying text should still be announced naturally.

## Organism-local constants

| Property | Value | Reason |
|---|---|---|
| `align-items: baseline` | — | Ensures the Geist 600 title and JetBrains-like See all chevron sit on the same typographic baseline; not a tokenizable choice |

No other literals. Every color / spacing / radius resolves to a token.

## Vertical padding note

The spec calls for 14pt top / 10pt bottom. Our `--space-*` scale is strict 4pt grid (2/4/8/12/16/…), which has no 14 or 10 token. The organism uses `var(--space-4)` — 12pt — for both, which keeps the component on-grid at the cost of a 2pt asymmetry compared to the concept. If the tighter asymmetry becomes a perceptual issue, a future token addition (`--space-2h = 6pt`, `--space-3h = 10pt`, `--space-4h = 14pt`) would restore it without leaking literals.

## How to preview

Open `organisms/section-header/section-header.html` in a browser — every variant renders in both light and dark `theme-pane`s, self-contained. No build step.
