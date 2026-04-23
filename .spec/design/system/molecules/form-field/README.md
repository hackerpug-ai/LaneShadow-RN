# form-field

LaneShadow V2 Copper · Molecule · Authority: uc-mol-04-formfield-tabitem-emptystate.html

## Purpose

LSFormField wraps the `ls-input` / `ls-textarea` atoms (UC-ATM-03) with a structured label row, optional helper text, and an error-state row into a single reusable molecule. Every labeled input on any screen uses this molecule — it eliminates per-screen label/error re-implementation.

## Anatomy

```
.ls-form-field.mol-form-field          ← layout host (flex-col, gap space-2)
  .mol-form-field__label               ← field label (t-label-md)
    [.required-marker]                 ← asterisk if field is required
  [.mol-form-field__input-wrap]        ← only present when icon slots needed
    [.mol-input-icon.leading]          ← leading decorative/search icon
    .ls-input / .ls-textarea           ← UC-ATM-03 atom (unchanged)
    [.mol-input-icon.trailing]         ← trailing clear/reveal/error icon
  .mol-form-field__helper (optional)   ← helper text (t-body-sm)
  .mol-form-field__error  (optional)   ← error text + inline icon (t-body-sm)
```

### Composition Strategy

`.mol-form-field` IS `.ls-form-field` — both classes are applied to the same element. `ls-form-field` in `_atoms.css` owns all layout (`flex-direction: column; gap: var(--space-2); width: 100%`). The molecule class adds label semantics, helper/error slots, icon adapter, and the disabled-opacity modifier. No layout is duplicated.

The `mol-form-field__input-wrap` wrapper is optional: it only appears when leading or trailing icons are required. Without icons, `ls-input` / `ls-textarea` is a direct child of the form-field root.

## Variants

| Variant | Description |
|---|---|
| Default / placeholder | Empty field with placeholder text |
| Focused | Active focus ring (via `.focused` on `ls-input`) |
| Filled | Field with a value, no helper |
| With helper | Helper text below input |
| Error | Red border + inline error icon + error message |
| Disabled | Wrapper at 0.55 opacity, `pointer-events: none` |
| Required | Asterisk marker appended to label |
| With leading icon | Icon slot before input text |
| With trailing action | Clearable / toggle icon after input text |
| Textarea | Multi-line; `ls-textarea` atom replaces `ls-input` |
| Composition: form card | Two fields + submit in `mol-form-card` container |

## States

- **Default**: border-default, content-subtle placeholder
- **Focused**: border-focus (copper-500), 3px ring via `color-mix(border-focus 15%)`
- **Error**: status-error border + tint bg, error text in status-error
- **Disabled**: `mol-form-field--disabled` sets `opacity: 0.55; pointer-events: none` on the wrapper
- **Filled**: no visual change from default; value replaces placeholder

## Atoms Used

- `ls-input` (UC-ATM-03) — primary text input
- `ls-textarea` (UC-ATM-03) — multi-line variant
- `ls-btn` (UC-ATM-02) — submit action inside `mol-form-card`
- `ls-form-field` (from `_atoms.css`) — layout skeleton

## Token Recipe

| Property | Token |
|---|---|
| Field gap (label → input → helper) | `var(--space-2)` (4px) |
| Inter-field gap in form card | `var(--space-5)` (16px) |
| Card padding | `var(--space-6)` (20px) |
| Input height | `var(--size-control-lg)` (48px) |
| Label | `var(--content-primary)` · `t-label-md` |
| Helper text color | `var(--content-tertiary)` |
| Error text color | `var(--status-error)` |
| Required marker | `var(--status-error)` |
| Focus ring | `var(--border-focus)` · 3px `color-mix` at 15% |
| Error border | `var(--status-error)` |
| Error background tint | `color-mix(status-error 8%, surface-card)` |
| Input leading icon color | `var(--content-tertiary)` |
| Input trailing error icon | `var(--status-error)` |
| Disabled opacity | 0.55 (field-wrapper level) |
| Card border radius | `var(--radius-lg)` |
| Icon size (leading/trailing) | `var(--icon-sm)` (16px) |

## Token Gaps

- `--content-error` is not in `tokens.css`; `var(--status-error)` used directly per concept intent.
- `--opacity-disabled-field := 0.55` — tokens.css `--opacity-disabled` is 0.38 (per individual control Material spec). 0.55 used at wrapper level to keep label legible.

## Accessibility

- Label element (`<label for>`) must be wired to input `id` in implementation.
- Required marker `*` is `aria-hidden="true"` — use `aria-required="true"` on the input.
- Error text element must be referenced via `aria-describedby` on the input.
- Helper text should also be wired via `aria-describedby` when no error is present.
- Disabled fields: use native `disabled` attribute, not CSS-only.
- Focus ring: 3px at `border-focus` — meets WCAG 2.4.11 (enhanced focus visibility).

## Notes

- The `mol-form-field__input-wrap` + icon slots mirror `_atoms.css` `.input-wrap` pattern but are namespaced to `.mol-*` to avoid class collision. If the atom is promoted to include icon slots natively, this wrapper can be removed.
- `mol-form-card` is a composition helper (card + spacing + optional title) — not a standalone molecule. Treat it as a layout shorthand for account/settings screens.
