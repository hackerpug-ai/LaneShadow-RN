# LSToast

LaneShadow V2 Copper · Molecule · Authority: uc-mol-03-bottomsheet-toast-modal.html

## Purpose

Transient banner notification that surfaces feedback, status, and ride context without blocking the screen. Auto-dismisses after 5000ms (`chatOverlayDismiss`). Stack position is bottom-center above the navigation bar (fixed portal — runtime concern). Users can dismiss early via the X button or an inline action.

## Anatomy

```
.mol-toast                      ← glass-overlay banner (surface.overlay, backdrop-filter)
  .mol-toast__icon              ← SVG status icon (18×18, stroke: currentColor)
  .mol-toast__live-dot          ← recording variant: animated pulse dot (no icon)
  .mol-toast__body              ← text region
    span.t-body-md              ← primary message
    span.t-body-sm              ← (optional) subtext / detail line
  .mol-toast__action            ← (optional) inline ghost pill button
  .mol-toast__dismiss           ← X close button (icon-only)
  .mol-toast__progress          ← auto-dismiss timer bar (position: absolute, bottom: 0)
```

## Variants

| Modifier | Status color | Background token | Progress color |
|---|---|---|---|
| `--default` | Neutral | `surface.overlay` | `border.strong` |
| `--info` | `status.info` | `status.info-tint` | `status.info` |
| `--success` | `status.success` | `status.success-tint` | `status.success` |
| `--warning` | `status.warning` | `status.warning-tint` | `status.warning` |
| `--error` | `status.error` | `status.error-tint` | `status.error` |
| `--recording` | `status.recording` | `10% recording + overlay` | `status.recording` (full-width, no countdown) |

## States

- **Entering**: translateY(full height) → translateY(0) over 320ms `chatOverlayEnter` spring
- **Visible**: progress bar animates 100% → 0% width over 5000ms linear (chatOverlayDismiss)
- **Dismissed (manual)**: translateY(100%) over 240ms `ease-accelerated`
- **Dismissed (auto)**: same exit animation triggered when progress reaches 0%
- **Recording**: no countdown; progress bar stays full-width until ride ends; `__live-dot` pulses at 1.2s

## Atoms Used

| Atom | Class | Role |
|---|---|---|
| LSGlassPanel (chrome) | `surface.overlay` + `backdrop-filter` | Toast surface |
| LSButton (ghost/pill) | `.ls-btn--ghost.ls-btn--pill` | Inline action |

## Token Recipe

| Property | Token |
|---|---|
| Background | `var(--surface-overlay)` + `backdrop-filter: blur(12px)` |
| Border | `var(--stroke-sm) solid var(--border-default)` |
| Border radius | `var(--radius-lg)` |
| Shadow | `var(--elev-overlay)` |
| Padding | `var(--space-4)` |
| Gap (items) | `var(--space-3)` |
| Icon size | `var(--icon-md)` (18px) |
| Max width | 340px |
| Progress height | `var(--space-1)` (2px) |
| Status info bg | `var(--status-info-tint)` |
| Status success bg | `var(--status-success-tint)` |
| Status warning bg | `var(--status-warning-tint)` |
| Status error bg | `var(--status-error-tint)` |
| Enter motion | `chatOverlayEnter` 320ms `cubic-bezier(0.22,1,0.36,1)` |
| Dismiss duration | 5000ms auto, 240ms manual |

## Accessibility

- Root: `role="status"` for info/success/default; `role="alert"` for error/warning
- Recording toast: `role="status"` + `aria-live="polite"`
- Dismiss button: `aria-label="Dismiss notification"` required
- Action button: descriptive `aria-label` (e.g., "Undo route deletion")
- Progress bar: `role="progressbar"` + `aria-valuenow` updated as timer counts down
- Do not auto-focus toasts — they must not interrupt the user's current task

## Notes

- Status tint tokens (`status-info-tint`, `status-success-tint`, etc.) are defined as `TOKEN_GAP` — they are light-palette values present in the concept file but absent from `tokens.css`. See escape at top of parent response.
- The `--recording` variant never auto-dismisses; it is tied to ride-end lifecycle, not the 5000ms timer
- Do not stack more than 3 toasts simultaneously; oldest dismisses first when queue overflows
- Motion parameters are referenced by recipe name; never inline duration/easing values
