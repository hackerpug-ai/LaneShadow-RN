# suggestion-chip

LaneShadow V2 Copper · Molecule · Authority: uc-mol-05-pill-family.html

## Purpose

`LSSuggestionChip` is a single-tap primer composing `ls-pill` (UC-ATM-06). It presents a pre-formed suggestion that completes or seeds a query with one tap — "Twisty back roads", "Avoid highway", "Scenic coastal route". It is always `md` (32px) per spec. After tapping, it enters the `.is-primed` state (copper tint background) to signal the suggestion was applied; it does not toggle back like a filter chip. It may carry a leading `ls-icon` and an optional trailing chevron.

## Anatomy (HTML snippet)

```html
<!-- Default — text only -->
<button class="ls-pill md mol-suggestion-chip" type="button">
  <span class="t-label-md mol-suggestion-chip__label">Twisty back roads</span>
</button>

<!-- With leading icon -->
<button class="ls-pill md mol-suggestion-chip" type="button">
  <svg class="mol-suggestion-chip__icon" aria-hidden="true" …></svg>
  <span class="t-label-md mol-suggestion-chip__label">Scenic coastal route</span>
</button>

<!-- With trailing chevron -->
<button class="ls-pill md mol-suggestion-chip" type="button">
  <span class="t-label-md mol-suggestion-chip__label">More options</span>
  <svg class="mol-suggestion-chip__chevron" aria-hidden="true" …></svg>
</button>

<!-- Primed (post-tap applied state) -->
<button class="ls-pill md mol-suggestion-chip is-primed" type="button" aria-pressed="true">
  <svg class="mol-suggestion-chip__icon" aria-hidden="true" …></svg>
  <span class="t-label-md mol-suggestion-chip__label">Twisty back roads</span>
</button>

<!-- Disabled -->
<button class="ls-pill md mol-suggestion-chip is-disabled" type="button" disabled aria-disabled="true">
  <span class="t-label-md mol-suggestion-chip__label">Suggest Route</span>
</button>
```

## Variants

| Variant | Modifier class | Notes |
|---|---|---|
| Text only | — | Minimal; glass surface |
| With leading icon | — | `mol-suggestion-chip__icon` in slot before label |
| With trailing chevron | — | `mol-suggestion-chip__chevron` after label; implies drill-down |
| Primed | `is-primed` | Post-tap copper whisper tint; `aria-pressed="true"` |
| Disabled | `is-disabled` | Unavailable suggestion |

## States

| State | Class | Visual |
|---|---|---|
| Default | — | `surface-glass` bg, white border (light) / `border-default` (dark), `content-primary` text |
| Hover | `is-hover` | Border strengthens to `border-strong`; bg slightly opaque |
| Pressed | `is-pressed` | `surface-inset` fill momentarily |
| Primed | `is-primed` | `signal-whisper` bg, `signal-tint` border, `signal-default` text |
| Primed Hover | `is-primed is-hover` | `signal-tint` bg deepens |
| Disabled | `is-disabled` | `opacity-disabled`, `pointer-events: none` |

## Atoms Used

| Atom | Role | Class |
|---|---|---|
| LSPill | Shape primitive — border-radius, height `md`=32px, padding, gap | `ls-pill md` |

## Token Recipe

| Property | Token |
|---|---|
| Background (default) | `var(--surface-glass)` |
| Border (default, light) | `rgba(255, 255, 255, 0.55)` |
| Border (default, dark) | `var(--border-default)` |
| Text (default) | `var(--content-primary)` |
| Backdrop | `blur(14px) saturate(1.2)` |
| Background (primed) | `var(--signal-whisper)` |
| Border (primed) | `var(--signal-tint)` |
| Text (primed) | `var(--signal-default)` |
| Icon color | `var(--signal-default)` |
| Chevron color | `var(--content-tertiary)` |
| Transition | `background var(--duration-fast) var(--ease-standard)` |
| Typography (label) | `.t-label-md` (9.5px, 600 wt, uppercase) |

## Accessibility

- Use `<button type="button">` — this is an interactive control.
- When primed, set `aria-pressed="true"` to communicate applied state to screen readers.
- `aria-disabled="true"` plus `disabled` attribute for the disabled state.
- Leading icon must be `aria-hidden="true"` — the label text is the accessible name.
- Trailing chevron `aria-hidden="true"` — it is decorative directional affordance.

## Notes

- `mol-suggestion-chip` is fixed at `md` (32px). Do not use `sm` or `lg` variants — the spec prescribes `md` as the single size for this molecule.
- The glass treatment degrades gracefully: without `backdrop-filter` support, `surface-glass` shows at full opacity.
- `is-primed` is a one-way applied state, not a toggle. To "un-prime," the organism must clear the class programmatically (e.g., on sheet dismiss or new session).
- `mol-suggestion-chip` never redefines radius, height, or padding — those are owned by `ls-pill`.
