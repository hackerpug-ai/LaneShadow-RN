# toggle

LaneShadow V2 Copper · Atom · Authority: derived from uc-mol-01 list-row concept (extracted as atom)

## Purpose

`LSToggle` is a boolean switch control — a sliding thumb on a track that communicates on/off state at a glance. It appears as the trailing affordance in `LSListRow` (molecule) for settings rows such as notifications, location sharing, and ride-visibility toggles. The atom is self-contained: it owns the track, thumb, and transition; the consuming molecule owns the label and row layout.

## Anatomy (HTML snippet)

```html
<!-- Off state -->
<button class="ls-toggle" role="switch" aria-checked="false" aria-label="Notifications"></button>

<!-- On state -->
<button class="ls-toggle ls-toggle--on" role="switch" aria-checked="true" aria-label="Notifications"></button>

<!-- Disabled (off) -->
<button class="ls-toggle is-disabled" role="switch" aria-checked="false" aria-disabled="true" aria-label="Notifications" tabindex="-1"></button>

<!-- Disabled (on) -->
<button class="ls-toggle ls-toggle--on is-disabled" role="switch" aria-checked="true" aria-disabled="true" aria-label="Notifications" tabindex="-1"></button>
```

The element renders as a `<button>` with `role="switch"`. The `::after` pseudo-element draws the sliding thumb — no child elements required.

## Variants (off / on)

| Variant | Class | Track color | Thumb position |
|---------|-------|-------------|----------------|
| Off | `.ls-toggle` | `--border-default` | left: 3px (thumb at start) |
| On | `.ls-toggle.ls-toggle--on` | `--signal-default` | left: 22px (thumb at end) |

## States (default / hover / focus / pressed / disabled)

| State | Appearance | CSS mechanism |
|-------|------------|---------------|
| Default (off) | Neutral grey track | `.ls-toggle` base |
| Default (on) | Copper track | `.ls-toggle--on` |
| Hover | No visual change (mobile-first; desktop may add cursor:pointer) | `cursor: pointer` on base |
| Focus (keyboard) | `--border-focus` outline, `--stroke-lg` width, `--space-1` offset | `.ls-toggle:focus-visible` |
| Pressed | No dedicated pressed state — momentum of the thumb transition serves as feedback | n/a |
| Disabled | `--opacity-disabled` applied to the whole control, `pointer-events: none` | `.is-disabled` |

## Token Recipe

| Property | Token | Notes |
|----------|-------|-------|
| Track height | `--space-7` | 24px — aligns to 4px grid |
| Track radius | `--radius-pill` | Fully rounded ends |
| Track background (off) | `--border-default` | Neutral resting state |
| Track background (on) | `--signal-default` | Copper brand color |
| Track transition | `background var(--duration-standard) var(--ease-standard)` | Motion system |
| Focus outline color | `--border-focus` | Keyboard accessibility |
| Focus outline width | `--stroke-lg` | 2px stroke |
| Focus outline offset | `--space-1` | 4px clearance |
| Thumb background | `--content-on-signal` | White/light on copper |
| Thumb shadow | `--elev-card` | Elevation lifted from surface |
| Thumb transition | `left var(--duration-standard) var(--ease-standard)` | Slide motion |
| Disabled opacity | `--opacity-disabled` | System-wide disabled treatment |

## Geometry Constants

The following raw `px` values are component-specific geometry derived from the 24px track height and the required visual clearance. They are **not** system-wide spacing tokens — they describe the internal anatomy of this specific control.

| Constant | Value | Derivation |
|----------|-------|------------|
| Track width | `42px` | Empirically standard iOS-style toggle width; 1.75× the 24px height |
| Thumb diameter | `18px` | Track height (24px) minus 2× padding (3px each side) = 18px |
| Thumb inset from left (off) | `3px` (`--space-1` = 4px is unavailable here — 3px is geometric centering: (24-18)/2 = 3) | Centered within 24px track with 3px top/bottom/left margins |
| Thumb slide position (on) | `left: 22px` | Track width (42px) − thumb diameter (18px) − inset (2px visual balance) = 22px |

These four constants must remain in sync if the atom is resized. They are documented here rather than tokenized because they encode the geometry of this specific toggle anatomy, not an abstract design decision.

## Accessibility

- **Role**: `role="switch"` on the `<button>` element
- **State**: `aria-checked="true"` / `aria-checked="false"` toggled by the consuming component
- **Label**: `aria-label` must be provided by the consumer (e.g., `aria-label="Push notifications"`) when no visible label is adjacent; if a visible label is present, use `aria-labelledby` pointing to that label's `id`
- **Keyboard**: `Space` and `Enter` toggle the switch (native `<button>` behavior handles this)
- **Touch target**: The control is 42×24px intrinsically. Consumers must ensure a minimum 44×44px tappable area — wrap in a 44px min-height row (as `LSListRow` does) or add `padding` to the parent slot
- **Disabled**: Set `aria-disabled="true"` and `tabindex="-1"` when disabled; do not rely on CSS alone
- **Focus indicator**: `focus-visible` outline using `--border-focus` at `--stroke-lg` meets WCAG 2.4.11 (Focus Appearance)

## Notes

- **No text content**: This atom renders no text. Typographic module classes are not used and `font-*` properties do not appear in its CSS.
- **Geometry constants**: The 18px thumb, 3px inset, 22px slide-to offset, and 42px track width are anatomy-specific constants derived from the 24px track height. They are intentional raw `px` values, not missing tokens. See Geometry Constants table above.
- **`--content-on-signal` for thumb**: The thumb is always rendered against the track background (off = `--border-default`, on = `--signal-default`). Using `--content-on-signal` (which resolves to white/near-white) ensures contrast in both states because both track colors are dark enough to support it.
- **Composed by**: `LSListRow` (uc-mol-01) as its trailing affordance for settings-type rows. The toggle atom does not know about the row; the row composes the toggle by class.
- **No pressed/hover visual**: Per mobile-first design, hover and pressed states are not visually distinct at the atom level. The slide animation itself provides motion feedback on press. If desktop hover states are required, the consuming organism applies them.
