# filter-chip

LaneShadow V2 Copper · Molecule · Authority: uc-mol-05-pill-family.html

## Purpose

`LSFilterChip` is a toggleable filter control composing `ls-pill` (UC-ATM-06). It allows users to apply or remove a single query constraint — terrain type, route preference, ride characteristic — with a single tap. It communicates selection state through a copper fill and an optional leading checkmark icon. Organisms driving filter bars and search sheets use this molecule exclusively; they never construct toggle pills inline.

## Anatomy (HTML snippet)

```html
<!-- Unselected -->
<button class="ls-pill md mol-filter-chip" type="button" aria-pressed="false">
  <span class="t-label-md mol-filter-chip__label">Scenic</span>
</button>

<!-- Selected (with leading check) -->
<button class="ls-pill md mol-filter-chip is-selected" type="button" aria-pressed="true">
  <svg class="mol-filter-chip__check" aria-hidden="true" width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path d="M2 6l3.5 3.5L10 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <span class="t-label-md mol-filter-chip__label">Scenic</span>
</button>

<!-- With trailing close (removable filter) -->
<button class="ls-pill md mol-filter-chip is-selected mol-filter-chip--removable" type="button" aria-pressed="true">
  <svg class="mol-filter-chip__check" aria-hidden="true" …></svg>
  <span class="t-label-md mol-filter-chip__label">Scenic</span>
  <svg class="mol-filter-chip__close" aria-label="Remove Scenic filter" …></svg>
</button>

<!-- With count badge -->
<button class="ls-pill md mol-filter-chip is-selected" type="button" aria-pressed="true">
  <span class="t-label-md mol-filter-chip__label">Gravel</span>
  <span class="mol-filter-chip__count t-instr-xs">3</span>
</button>
```

## Variants

| Variant | Modifier class | Notes |
|---|---|---|
| Default unselected | — | `surface-card` bg, `content-secondary` text |
| Selected | `is-selected` | Copper fill, white text, leading check revealed |
| Removable | `mol-filter-chip--removable` | Adds trailing close ×; only meaningful when `is-selected` |
| With count | — | Count badge `mol-filter-chip__count` appended inside label area |
| Disabled | `is-disabled` | Unselectable, `opacity-disabled`, `pointer-events: none` |

## States

| State | Class | Visual |
|---|---|---|
| Default | — | `surface-card` bg, `border-default`, `content-secondary` text |
| Hover | `is-hover` | `surface-inset` bg, `border-strong` |
| Pressed | `is-pressed` | Slightly darker bg, subtle scale |
| Selected | `is-selected` | `signal-default` fill, `content-on-signal` text |
| Selected + Hover | `is-selected is-hover` | `signal-hover` fill |
| Selected + Pressed | `is-selected is-pressed` | `signal-pressed` fill |
| Disabled | `is-disabled` | `opacity-disabled`, pointer events off |

## Atoms Used

| Atom | Role | Class |
|---|---|---|
| LSPill | Shape primitive — border-radius, height, padding, gap | `ls-pill sm/md/lg` |

## Token Recipe

| Property | Token |
|---|---|
| Background (unselected) | `var(--surface-card)` |
| Border (unselected) | `var(--border-default)` |
| Text (unselected) | `var(--content-secondary)` |
| Background (selected) | `var(--signal-default)` |
| Background (selected hover) | `var(--signal-hover)` |
| Background (selected pressed) | `var(--signal-pressed)` |
| Border (selected) | `var(--signal-default)` |
| Text (selected) | `var(--content-on-signal)` |
| Background (hover, unselected) | `var(--surface-inset)` |
| Transition | `background var(--duration-fast) var(--ease-standard)` |
| Typography (label) | `.t-label-md` (9.5px, 600 wt, 0.12em tracking, uppercase) |
| Typography (count) | `.t-instr-xs` (8.5px, 500 wt, tabular nums) |

## Accessibility

- Use `<button type="button">` so keyboard users can toggle.
- Set `aria-pressed="true"` when selected, `aria-pressed="false"` when not.
- The close icon in the removable variant must carry its own accessible label (`aria-label="Remove {label} filter"`), not rely on `aria-hidden`.
- Filter chips in a bar should be grouped in a `role="group"` with an `aria-label` describing the filter category.

## Notes

- `is-selected` class drives all selected visuals; there is no separate `selected` attribute convention.
- The leading check (`mol-filter-chip__check`) is in the DOM in both states but hidden via `display: none` when unselected. Toggle via the `is-selected` class, not JS DOM manipulation.
- `mol-filter-chip` never redefines radius, height, or gap — those are owned by `ls-pill`.
