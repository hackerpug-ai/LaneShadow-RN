# list-row

LaneShadow V2 Copper · Molecule · Authority: uc-mol-01-card-listrow.html

## Purpose

`LSListRow` composes `ls-avatar` (UC-ATM-04), `ls-icon` (UC-ATM-10), and optionally `ls-toggle` (atom pending) or `ls-btn` (UC-ATM-02) into a horizontal interactive row that meets the 44px minimum touch target. It is the primitive for every settings list, member roster, recent-routes list, and notification row in the app. The `mol-list-group` wrapper bundles rows inside a card surface with proper border separation.

## Anatomy (HTML snippet)

```html
<div class="mol-list-group">

  <div class="mol-list-row">

    <!-- Slot: leading (icon container OR ls-avatar) -->
    <div class="mol-list-row__leading">
      <div class="mol-list-row__icon-container">
        <svg …>…</svg>
      </div>
    </div>

    <!-- Slot: content -->
    <div class="mol-list-row__content">
      <span class="mol-list-row__title t-body-md">Notifications</span>
      <span class="mol-list-row__subtitle t-label-sm">Ride alerts and mentions</span>
    </div>

    <!-- Slot: trailing (chevron, toggle, button, or label) -->
    <div class="mol-list-row__trailing">
      <svg class="mol-list-row__chevron" …>…</svg>
    </div>

  </div>

</div>
```

## Variants

| Variant | Leading | Trailing |
|---|---|---|
| Leading Icon | `mol-list-row__icon-container` with inline SVG | Chevron SVG |
| Leading Avatar | `ls-avatar` (xs/sm/md) | Chevron SVG or `ls-btn--outline ls-btn--pill` |
| With Toggle (on) | Icon container | `ls-toggle ls-toggle--on` |
| With Toggle (off) | Icon container | `ls-toggle` |
| Non-interactive | Icon container | Static `mol-list-row__trailing-label` |
| Disabled | Any leading | Any trailing, row at `opacity-disabled` |
| Grouped list-in-card | `ls-avatar--xs` | Chevron SVG, inside `ls-card` |

## States

| State | Class | Effect |
|---|---|---|
| Default | — | `surface-card` background, pointer cursor |
| Hover | `.is-hover` | `surface-inset` background |
| Pressed | `.is-pressed` | `surface-inset` background |
| Focused | `.is-focused` | `stroke-md` focus ring at `border-focus` |
| Disabled | `.is-disabled` | `opacity-disabled` (0.38), `pointer-events: none` |
| Non-interactive | `.mol-list-row--non-interactive` | Default cursor, no hover background change |

## Atoms Used

| Atom | Role | Class |
|---|---|---|
| LSAvatar | Leading user/route avatar | `ls-avatar` (xs/sm/md via inline size) |
| LSIcon (inline SVG) | Leading icon in tinted container | Inline SVG inside `mol-list-row__icon-container` |
| LSToggle (pending) | Trailing toggle control | `ls-toggle` / `ls-toggle--on` |
| LSButton (outline, pill) | Trailing CTA (e.g. Follow) | `ls-btn ls-btn--outline ls-btn--pill` |
| LSCard | Group surface wrapper | `ls-card` |

## Token Recipe

| Property | Token |
|---|---|
| Row min-height | `--size-touch-min` (44px) |
| Row padding (vertical) | `--space-2` (4px) |
| Row padding (horizontal) | `--space-4` (12px) |
| Row gap | `--space-3` (8px) |
| Row background default | `--surface-card` |
| Row background hover/pressed | `--surface-inset` |
| Row transition duration | `--duration-fast` |
| Row transition easing | `--ease-standard` |
| Row separator | `--stroke-sm` + `--border-subtle` |
| Focus ring | `--stroke-md` + `--border-focus` |
| Disabled opacity | `--opacity-disabled` |
| Icon container size | `--space-8` × `--space-8` (32px) |
| Icon container radius | `--radius-sm` |
| Icon container background | `--surface-inset` |
| Icon container border | `--stroke-sm` + `--border-default` |
| Icon color | `--content-secondary` |
| Title color | `--content-primary` |
| Subtitle color | `--content-secondary` |
| Trailing color | `--content-tertiary` |
| Trailing label color | `--content-subtle` |
| Chevron color | `--content-subtle` |
| Group border | `--stroke-sm` + `--border-default` |
| Group radius | `--radius-lg` |
| Group shadow | `--elev-card` |
| Group header padding | `--space-4` + `--space-3` |
| Group header border | `--stroke-sm` + `--border-subtle` |
| Group header text | `--content-tertiary` |

## Accessibility

- Each `.mol-list-row` should be a `<button>` or have `role="button"` and `tabindex="0"` when interactive.
- Non-interactive rows should have `aria-disabled="true"` or be a `<div>` without role.
- The `ls-toggle` trailing control needs `role="switch"`, `aria-checked`, and an `aria-label` in production.
- Truncated title/subtitle use `text-overflow: ellipsis` — provide a `title` attribute or `aria-label` on the row for screen readers when text is clipped.
- Focus ring uses `--border-focus` (copper 500) which meets 3:1 contrast against both `--surface-card` and `--surface-inset`.
- Minimum tap area is 44px (`--size-touch-min`) as required by WCAG 2.5.5.

## Notes

- `ls-avatar` sizing is applied via inline `width`/`height` referencing `--avatar-xs/sm/md` rather than `.ls-avatar--xs` etc. because the avatar atom size modifiers use fixed px — keeping tokens consistent in molecule markup. If the avatar atom gains proper token-driven size classes, those should be used instead.
- The `mol-list-group__header` is a molecule-local slot; it is not the `ls-card` header slot from UC-ATM-05.
- `ls-toggle` styles currently live in the concept file and the `_atoms.css` bundle (partially). The atom needs to be formally extracted. See NEW_ATOM_REQUEST below.
- Row separator via adjacent sibling selector (`.mol-list-row + .mol-list-row`) means the first row never gets a top border — correct behavior inside a group.
