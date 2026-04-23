# LSModal

LaneShadow V2 Copper · Molecule · Authority: uc-mol-03-bottomsheet-toast-modal.html

## Purpose

Centered card dialog that blocks the underlying screen for confirmation, form input, and informational flows. Always paired with a full-screen scrim (`ls-scrim--blocking`) that captures tap-outside to dismiss (where appropriate). Used for destructive confirmation, route save flows, and success celebrations.

## Anatomy

```
.mol-modal-backdrop             ← position: relative display: flex container
  .ls-scrim                     ← full-area backdrop (composed from atom, z-index: 2)
  .mol-modal                    ← card surface (z-index: 3, above scrim)
    .mol-modal__icon            ← (optional) status icon circle
    .mol-modal__title           ← heading (t-title-md)
    .mol-modal__body            ← supporting prose (t-body-md)
    .mol-modal__form            ← (optional) ls-form-field stack
    .mol-modal__actions         ← ls-btn row (flex, gap: space-3)
```

## Variants

| Modifier | Layout | Icon | Actions |
|---|---|---|---|
| `--destructive` | Left-aligned | `icon--destructive` (error red) | ghost + destructive |
| `--centered` | Center-aligned | any icon | single or two |
| Informational | Centered | `icon--info` (info blue) | single primary |
| Form | Left-aligned | none | ghost + primary |
| Success | Centered | `icon--success` (success green) | single accept |

## States

- **Entering**: scale(0.94) opacity(0) → scale(1) opacity(1) over 320ms `chatOverlayEnter`
- **Visible**: static; scrim blocks scroll/tap on content behind
- **Dismissed**: reverse enter animation + scrim fade over 240ms `ease-standard`
- **Dark**: `.mode-dark` on backdrop; scrim uses `ls-scrim--medium` (0.50) for better depth

## Atoms Used

| Atom | Class | Role |
|---|---|---|
| LSScrim | `.ls-scrim`, `.ls-scrim--default / --medium`, `.ls-scrim--blocking` | Full-screen backdrop |
| LSButton | `.ls-btn--primary`, `.ls-btn--ghost`, `.ls-btn--destructive`, `.ls-btn--accept` | Action row |
| LSFormField + LSInput | `.ls-form-field`, `.ls-input` | Form modal variant |
| LSCard | `surface.card` token | Modal surface |

## Token Recipe

| Property | Token |
|---|---|
| Background | `var(--surface-card)` |
| Border | `var(--stroke-sm) solid var(--border-default)` |
| Border radius | `var(--radius-xl)` |
| Shadow | `var(--elev-overlay)` |
| Padding | `var(--space-7)` (24px) |
| Max width | 288px (mobile-first) |
| z-index | 3 (above `ls-scrim` at 2) |
| Title color | `var(--content-primary)` |
| Body color | `var(--content-secondary)` |
| Icon circle size | `var(--size-control-xl)` (56px) |
| Icon size | `var(--icon-lg)` (24px) |
| Destructive icon bg | `color-mix(status-error 12%, surface-card)` |
| Success icon bg | `color-mix(status-success 12%, surface-card)` |
| Info icon bg | `color-mix(status-info 12%, surface-card)` |
| Signal icon bg | `var(--signal-whisper)` |
| Action gap | `var(--space-3)` |
| Enter motion | `chatOverlayEnter` 320ms `cubic-bezier(0.22,1,0.36,1)` scale |
| Dismiss motion | 240ms `ease-standard` |

## Accessibility

- Root: `role="dialog"` + `aria-modal="true"` + `aria-labelledby="{title-id}"`
- Focus trap required: first focusable element receives focus on mount
- Focus returns to trigger element on dismiss
- Destructive action: confirmed with explicit button label ("Delete", not "OK")
- Scrim with `ls-scrim--blocking`: tap-outside should call `onDismiss` only for non-destructive flows; destructive confirms must require an explicit cancel/confirm
- ESC key: triggers dismiss for informational/form; ignored for destructive unless Cancel is focused

## Notes

- The backdrop wrapper requires `position: relative; overflow: hidden` — `.ls-scrim` uses `position: absolute; inset: 0`; the backdrop provides the stacking context
- `mol-modal` sets `z-index: 3` to sit above the scrim's `z-index: 2`; do not alter either value
- Motion parameters are referenced by recipe name only — never inline
- The form variant composes `.ls-form-field` and `.ls-input` directly; no field-specific overrides needed
- Max width 288px is intentional — modals on mobile must not feel like web dialogs
