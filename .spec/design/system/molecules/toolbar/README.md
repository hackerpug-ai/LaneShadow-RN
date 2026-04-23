# Toolbar

LaneShadow V2 Copper · Molecule · Authority: uc-mol-02-toolbar-navheader.html

## Purpose

LSToolbar is the universal top navigation bar for all screens. It provides a three-slot layout (leading / title / trailing) at a fixed height of 56px. Icon buttons composed from `ls-btn--icon-only` fill the leading and trailing slots; the title is centered between symmetric 44px minimum-width slot columns. No organism may stretch or compress the 56px height.

## Anatomy

```
┌─────────────────────────────────────────────────────────┐
│  [leading: 44px min]  [title — flex-1]  [trailing: 44px min] │  height: 56px
└─────────────────────────────────────────────────────────┘
```

| Element | Class | Role |
|---|---|---|
| Root bar | `.mol-toolbar` | Surface + elevation + border |
| Leading slot | `.mol-toolbar__leading` | Back button or empty spacer |
| Title area | `.mol-toolbar__title-area` | Centered title text |
| Title text | `.mol-toolbar__title` + `.t-title-md` | Screen title |
| Trailing slot | `.mol-toolbar__trailing` | 0–2 icon action buttons |
| Signal icon | `.mol-toolbar__icon--signal` | Copper-tinted icon (saved/active state) |
| Icon SVG | `.mol-toolbar__icon-svg` | 20×20 stroke icon |

## Variants

| Variant | Modifier | Description |
|---|---|---|
| Back + Title + Action | (default) | `leading` = back icon; `trailing` = overflow or single action |
| Title Only | (default, empty slots) | `leading` and `trailing` empty; title centers naturally |
| Title + Two Actions | (default) | `trailing` holds 2 icon buttons |
| No Back Button | `.mol-toolbar--no-back` | Leading absent; title left-aligns via `padding-left` |

## States

All interactive states live on the composed `ls-btn` atoms — not on `.mol-toolbar` itself.

| Class | Effect |
|---|---|
| `.is-hover` | `background: var(--surface-inset)` on icon button |
| `.is-pressed` | `background: var(--paper-300)` + `translateY(1px)` |
| `.is-disabled` | `opacity: var(--opacity-disabled)` + `pointer-events: none` |

## Atoms Used

- `ls-btn` + `ls-btn--ghost` + `ls-btn--icon-only` — all icon buttons

## Token Recipe

| Property | Token |
|---|---|
| Height | `--size-control-xl` (56px) |
| Background | `--surface-primary` |
| Bottom border | `--stroke-sm` solid `--border-subtle` |
| Box shadow | `--elev-chrome` |
| Leading / trailing min-width | `--size-touch-min` (44px) |
| Title typography | `.t-title-md` (Geist 14px 600) |
| Signal icon color | `--signal-default` |
| Horizontal padding | `--space-2` (4px) |

## Accessibility

- Each icon button must carry `aria-label` describing its action (not just icon name).
- Touch target is 44×44px minimum in all slots — enforced by `--size-touch-min`.
- Title area has implicit `aria-level` semantics when placed inside a `<nav>` or `<header>`.
- Disabled buttons carry the HTML `disabled` attribute in addition to `.is-disabled` class.

## Notes

- The `--no-back` modifier switches `justify-content` on the title area to `flex-start` and adds `--space-4` left padding to avoid colliding with the left edge.
- Slots are `min-width: var(--size-touch-min)` rather than a fixed width so multiple trailing buttons do not overflow.
- For screens that need a back-button label ("Back" text beside the chevron), add a `<span class="t-label-md">` sibling inside `.mol-toolbar__leading` and remove the `min-width` constraint from the leading slot — the title flex region absorbs the difference.
- Platform safe areas (iOS Dynamic Island 48pt, Android status bar 24pt) are handled by the parent screen organism, not by this molecule. The organism places `mol-toolbar` below the safe area bar.
