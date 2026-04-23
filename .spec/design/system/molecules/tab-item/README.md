# tab-item

LaneShadow V2 Copper · Molecule · Authority: uc-mol-04-formfield-tabitem-emptystate.html

## Purpose

LSTabItem is a single selectable cell inside a tab bar. It composes an icon (UC-ATM-10), a label, and an optional badge count. Three bar variants cover the full range of LaneShadow navigation contexts: the primary bottom-nav (underline), in-page filter (pill), and view-toggle (segmented).

## Anatomy

```
nav.mol-tab-bar.mol-tab-bar--{variant}   ← bar shell (flex row)
  button.mol-tab-item[--selected|--disabled]  ← one tab cell
    [.mol-tab-item__icon-slot]                ← only when badge is needed
      svg.mol-tab-item__icon                  ← 24×24 stroke icon
      [span.mol-tab-item__badge]              ← notification count
    svg.mol-tab-item__icon                    ← direct child when no badge
    span.mol-tab-item__label                  ← t-label-sm
```

### Variants

| Class | Use case | Selection indicator |
|---|---|---|
| `mol-tab-bar--underline` | Bottom navigation bar | 2px bar at top edge of selected cell |
| `mol-tab-bar--pill` | In-page section tabs | Rounded pill background on selected cell |
| `mol-tab-bar--segmented` | Filter / view toggle | Solid signal-whisper fill + inset ring |

## Variants

- **Underline**: default bottom nav; horizontal flex, 56px min-height, top border.
- **Pill**: horizontal flex row within each item; 48px min-height; rounded pill shell; card shadow on selected.
- **Segmented**: no gap; outer border; cells divided by 1px vertical rules; selected fills with `signal-whisper`.
- **Icon-only** (underline): label omitted, icon centered — used for compact bars.

## States

| State | Class modifier |
|---|---|
| Unselected | base `.mol-tab-item` |
| Selected | `.mol-tab-item--selected` |
| Disabled | `.mol-tab-item--disabled` |
| Focused (keyboard) | `:focus-visible` — 3px copper ring |

## Atoms Used

- `ls-icon` / SVG stroke icons (UC-ATM-10) — icon strokes inside each item
- `ls-badge-*` pattern (UC-ATM-07) — badge count pill (reproduced inline as `mol-tab-item__badge` for positioning independence)

## Token Recipe

| Property | Token |
|---|---|
| Bar min-height | `var(--size-control-xl)` (56px) |
| Item gap (icon → label) | `var(--space-1)` (2px) — underline; `var(--space-2)` (4px) — pill/seg |
| Icon size | `var(--icon-lg)` 24px — underline; `var(--icon-md)` 18px — pill/seg |
| Label role | `t-label-sm` (8.5px, 600, 0.14em uppercase) |
| Unselected color | `var(--content-tertiary)` |
| Selected color | `var(--signal-default)` |
| Disabled opacity | `var(--opacity-disabled)` |
| Underline indicator height | `var(--stroke-lg)` (2px) |
| Underline indicator width | 24px (local constant — no token; TOKEN_GAP noted) |
| Underline indicator color | `var(--signal-default)` |
| Underline bar border | `var(--stroke-sm)` solid `var(--border-default)` |
| Pill background (unselected) | `var(--surface-inset)` |
| Pill selected background | `var(--surface-card)` + `var(--elev-card)` |
| Segmented background | `var(--surface-inset)` |
| Segmented selected fill | `var(--signal-whisper)` |
| Segmented selected ring | `inset 0 0 0 stroke-sm var(--signal-tint)` |
| Badge background | `var(--status-error)` |
| Badge text color | `var(--content-on-signal)` |
| Badge border | `var(--stroke-md)` solid `var(--surface-primary)` |
| Focus ring | `color-mix(border-focus 30%)` 3px |

## Token Gaps

- `--size-tab-bar := 56px` — tab bar height uses `--size-control-xl`; no dedicated token.
- `--size-tab-indicator-w := 24px` — no token for indicator pill width; used as a magic constant (matches concept spec annotation).

## Accessibility

- Container `<nav>` with `role="tablist"` and `aria-label` describing the navigation level.
- Each `<button>` carries `role="tab"`, `aria-selected="true/false"`.
- Disabled items: `aria-disabled="true"`, not `aria-selected`.
- Badge: numeric span needs `aria-label="N new [item name]"` to avoid bare number being read.
- Keyboard: `→` / `←` arrow keys should move focus between tabs (requires JS in implementation; CSS `:focus-visible` provides the ring).
- Touch target: `min-height: var(--size-control-xl)` ensures 56px ≥ 44px minimum.

## Notes

- The underline indicator uses `::before` pseudo-element on the selected item — no additional DOM node required.
- Badge positioning uses `position: absolute` off `mol-tab-item__icon-slot` — wrapping the icon in the slot div is only required when a badge count is present.
- Pill and Segmented variants change `flex-direction` on items to `row`, putting icon and label side-by-side; labels are required (not optional) in these variants for legibility.
