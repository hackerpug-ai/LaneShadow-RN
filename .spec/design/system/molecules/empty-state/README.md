# empty-state

LaneShadow V2 Copper · Molecule · Authority: uc-mol-04-formfield-tabitem-emptystate.html

## Purpose

LSEmptyState is a centered, vertically-stacked composition for zero-content situations. It communicates *why* a view is empty and offers a recovery path. Four semantic variants (search, first-time, error, success) share one layout and differ only in icon ring color.

## Anatomy

```
.mol-empty-state[.mol-empty-state--{variant}]   ← flex-col, centered, gap space-4
  .mol-empty-state__icon-slot  OR               ← 64×64 framed icon (default)
  .mol-empty-state__illustration                ← 80×80 richer graphic frame
    svg / img                                   ← icon-xl or illustration
  p.mol-empty-state__headline                   ← t-title-md
  p.mol-empty-state__body                       ← t-body-md
  [.mol-empty-state__actions]                   ← optional button row
    .ls-btn.ls-btn--*                           ← 1–2 action buttons
```

### Icon Slot vs Illustration

- **Icon slot** (`mol-empty-state__icon-slot`, 64×64): framed rounded square with a single stroke icon. Use when a symbol is sufficient — first-time, success, most search states.
- **Illustration** (`mol-empty-state__illustration`, 80×80): larger framed square with `border-radius-xl`; intended for richer vector or image content. Used in error states (the wifi-slash SVG) or future illustrated assets.

Both frames adapt their border and background color via semantic variant modifiers.

## Variants

| Variant class | Semantic intent | Icon ring color |
|---|---|---|
| (none / `.mol-empty-state--search`) | Search found nothing | `border-default` / `surface-inset` |
| `.mol-empty-state--first-time` | Onboarding; no data yet | `signal-tint` ring / `signal-whisper` fill |
| `.mol-empty-state--error` | Connection lost / sync failure | `status-error` tinted ring + fill |
| `.mol-empty-state--success` | All complete / up to date | `status-success` tinted ring + fill |

## States

LSEmptyState has no interactive states itself; its child `ls-btn` atoms carry their own hover/press/disabled states.

The molecule can appear inside:
- `mol-empty-card` wrapper (card shell, `elev-card` shadow) — for full-screen or modal zero-states
- A panel or surface directly — for inline/partial zero-states (reduced padding)

## Atoms Used

- `ls-btn` (UC-ATM-02) — primary / secondary / ghost / outline action buttons
- SVG inline icons — `icon-xl` (32px) stroke icons inside the slot

## Token Recipe

| Property | Token |
|---|---|
| Outer padding | `var(--space-9)` (40px) |
| Gap between anatomy layers | `var(--space-4)` (12px) |
| Margin-top above actions | `var(--space-1)` (2px) additional |
| Icon slot size | 64px (custom prop `--mol-empty-icon-slot-size`) |
| Illustration size | 80px (custom prop `--mol-empty-illustration-size`) |
| Icon slot border-radius | `var(--radius-lg)` |
| Illustration border-radius | `var(--radius-xl)` |
| Icon slot border | `var(--stroke-md)` solid `var(--border-default)` |
| Icon slot background | `var(--surface-inset)` |
| Icon color (default) | `var(--content-subtle)` |
| Icon color (first-time) | `var(--signal-default)` at `opacity-dim` |
| Icon color (error) | `var(--status-error)` at `opacity-dim` |
| Icon color (success) | `var(--status-success)` at `opacity-dim` |
| Error ring | `color-mix(status-error 30%, border-default)` |
| Success ring | `color-mix(status-success 30%, border-default)` |
| Headline color | `var(--content-primary)` |
| Body color | `var(--content-secondary)` |
| Headline max-width | 240px |
| Body max-width | 260px |
| Card border-radius | `var(--radius-lg)` |
| Card shadow | `var(--elev-card)` |

## Token Gaps

- `--mol-empty-icon-slot-size := 64px` — no token for this fixed icon frame size; declared as a local custom property.
- `--mol-empty-illustration-size := 80px` — same; local custom property.

## Accessibility

- Icon slot / illustration: `role="img"` with descriptive `aria-label` (not purely decorative when it is the primary communicator of state).
- Headline: use semantic `<p>` or `<h2>`/`<h3>` depending on document hierarchy; `t-title-md` is a presentation class only.
- Action buttons: use descriptive labels — "Clear Filters" is better than "Retry".
- Color alone does not distinguish error/success variants — the headline copy always names the state.
- When used as a live region (content appears after async fetch), wrap in `aria-live="polite"`.

## Notes

- `mol-empty-card` is a thin wrapper that adds card background, border, and shadow. The molecule itself is surface-agnostic — it works on any background.
- For inline/panel use (e.g., inside a list screen's content area), reduce padding via inline style (`style="padding: var(--space-7) var(--space-5)"`) rather than creating a modifier.
- The illustration SVG uses an inline `stroke` attribute referencing `var(--status-error)` — this is intentional. CSS variables do not penetrate SVG `stroke` attributes in all browsers when the SVG is inline; the var() fallback works in modern browsers and the reference is a semantic token, not a hex literal.
