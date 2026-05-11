# LSBottomSheet

LaneShadow V2 Copper · Molecule · Authority: uc-mol-03-bottomsheet-toast-modal.html

## Purpose

Swipe-up modal sheet that overlays the map. Used for contextual actions (route filters, waypoint editing), detail drawers, and multi-step flows at three detent depths. The sheet never fully occludes the underlying map — a scrim dims content behind it while keeping spatial context.

## Anatomy

```
mol-bottom-sheet-context          ← position: relative overflow: hidden frame
  mol-bottom-sheet-context__map   ← live map slot behind scrim (inert)
  .ls-scrim                       ← backdrop dimmer (composed from atom)
  mol-bottom-sheet-context__anchor ← positions sheet at bottom; height = detent
    .mol-bottom-sheet             ← sheet surface (surface.overlay)
      .mol-bottom-sheet__handle-bar
        .mol-bottom-sheet__handle ← 36pt drag pill (border.subtle)
      .mol-bottom-sheet__header   ← (optional) title + close button row
      .mol-bottom-sheet__body     ← scrollable content
        .mol-bottom-sheet__option-row  ← list item (surface.inset)
        .mol-bottom-sheet__waypoint-dot ← origin / waypoint bullet
      .mol-bottom-sheet__footer   ← (optional) action row with ls-btn
      .mol-bottom-sheet__safe-area ← bottom safe-area placeholder
```

## Variants

| Modifier on anchor | Detent | Use case |
|---|---|---|
| (none) | Natural height ~25% | Peek / compact filter |
| `--mid` (height: 50%) | ~50% | Route options, multi-row controls |
| `--full` (height: 90%) | ~90% | Waypoints, full-screen drawer |

## States

- **Default (visible)**: sheet at anchor; scrim at `ls-scrim--default` (0.35 opacity)
- **Dark mode**: `.mode-dark` on context; `ls-scrim--medium` (0.50) recommended for legibility
- **Dismissed**: sheet translates `translateY(100%)` in 240ms `ease-standard`; scrim fades out simultaneously

## Atoms Used

| Atom | Class | Role |
|---|---|---|
| LSScrim | `.ls-scrim`, `.ls-scrim--default`, `.ls-scrim--medium`, `.ls-scrim--blocking`, `.ls-scrim--animated` | Backdrop dimmer behind sheet |
| LSButton | `.ls-btn`, `.ls-btn--primary`, `.ls-btn--ghost` | Footer actions |
| LSPanel / surface | `surface.overlay` token | Sheet body surface |
| LSDivider | `border-subtle` token inline | Separator before/after body |

## Token Recipe

| Property | Token |
|---|---|
| Sheet background | `var(--surface-overlay)` |
| Top radius | `var(--radius-xl)` |
| Border | `var(--stroke-sm) solid var(--border-default)` |
| Handle width | 36px (spec constant) |
| Handle height | `var(--space-2)` (4px) |
| Handle color | `var(--border-subtle)` |
| Body padding | `var(--space-5)` |
| Footer gap | `var(--space-3)` |
| Option row height | `var(--size-control-lg)` |
| Option row bg | `var(--surface-inset)` |
| Shadow | `var(--elev-overlay)` |
| Scrim | `var(--surface-scrim)` via `.ls-scrim` |
| Enter motion | `chatOverlayEnter` 320ms `cubic-bezier(0.22,1,0.36,1)` |
| Dismiss motion | 240ms `ease-standard` translateY(100%) |

## Accessibility

- Handle bar has implicit `role="separator"` — add `aria-label="Drag to resize"` at runtime
- Close button: `aria-label="Close"` required
- Sheet root: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing to `__title`
- Focus trap active while sheet is open; restore prior focus on dismiss
- Scrim with `ls-scrim--blocking` captures pointer; non-blocking scrim must not intercept touch

## Notes

- Motion parameters are referenced by name only (`chatOverlayEnter`, `chatOverlayDismiss`); never inline keyframe values
- `onDismiss` fires exactly once after the exit animation completes, not on gesture initiation
- Safe-area placeholder (`__safe-area`) maps to `env(safe-area-inset-bottom)` at runtime
- The anchor height percentage drives the visible detent; do not size the sheet element directly for detent control
