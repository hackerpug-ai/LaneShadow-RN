# Input Atoms — LSTextField + LSTextArea

UC-ATM-03 · LaneShadow V2 Copper · Tier A

Single-line and multi-line text entry atoms. Both share identical structural tokens and expose the same four states.

## atoms-used

- `icon` — leading and trailing icon slots (sizing.icon.sm = `--icon-sm`)

## Variants

| Variant | Element | Min-height | Grows |
|---------|---------|-----------|-------|
| `text-field` | `<input type="text">` | `--size-control-lg` (48px) | No |
| `text-area` | `<textarea>` | `--size-control-lg` (48px) | Yes — vertically per row |

## States

| State | Class modifier | Description |
|-------|---------------|-------------|
| default | _(none)_ | Resting; surface.input background, border.default stroke |
| focused | `.focused` or `:focus` | Copper border + glow ring |
| error | `.error-state` | Error border + tinted background + red helper text |
| disabled | `.disabled` / `[disabled]` | Muted background + reduced opacity; not interactive |

## Token Table

| Role | Token | Light value | Dark value |
|------|-------|-------------|------------|
| Input background | `--surface-input` | `--paper-50` | `--ink-700` |
| Card background (focused) | `--surface-card` | `--paper-50` | `--ink-700` |
| Error background | `--status-error` tint | `--paper-50` via tint class | — |
| Disabled background | `--surface-inset` | `--paper-200` | `--ink-600` |
| Border (default) | `--border-default` | `--paper-400` | rgba white 12% |
| Border (focused) | `--border-focus` | `--copper-500` | `--copper-500` |
| Border (error) | `--status-error` | `--status-error-raw` | `--status-error-raw` |
| Border (disabled) | `--border-subtle` | `--paper-300` | rgba white 7% |
| Text (value) | `--content-primary` | `--ink-900` | `--ink-050` |
| Placeholder | `--content-subtle` | `--ink-200` | `--ink-300` |
| Label | `--content-primary` | `--ink-900` | `--ink-050` |
| Helper text | `--content-tertiary` | `--ink-300` | `--ink-200` |
| Helper text (error) | `--status-error` | `--status-error-raw` | `--status-error-raw` |
| Focus ring | `--border-focus` at 15% | copper-500 / 15% alpha | copper-500 / 15% alpha |
| Error ring | `--status-error` at 12% | error / 12% alpha | error / 12% alpha |
| Icon (default) | `--content-tertiary` | `--ink-300` | `--ink-200` |
| Icon (error state) | `--status-error` | `--status-error-raw` | `--status-error-raw` |

## Structural Tokens

| Property | Token | Value |
|----------|-------|-------|
| Height (text-field) | `--size-control-lg` | 48px |
| Min-height (text-area) | `--size-control-lg` | 48px |
| Horizontal padding | `--space-4` | 12px |
| All-around padding (textarea) | `--space-4` | 12px |
| Border radius | `--radius-md` | 6px |
| Icon size | `--icon-sm` | 16px |
| Icon inset from edge | `--space-4` | 12px |
| Padded side with icon | `--space-10` | 48px |
| Label font | `.t-title-sm` | Geist 12/600 |
| Input value font | `.t-body-lg` | Geist 14/400 |
| Helper text font | `.t-body-sm` | Geist 10.5/400 |
| Focus border + ring transition | `--duration-fast` | 120ms |
| Field stack gap | `--space-2` | 4px between label/input/helper |

## Icon Slots

Leading and trailing icon slots are positioned absolutely within `.input-wrap`:

- Leading: `12px` from left edge; input gains `padding-left: 40px`
- Trailing: `12px` from right edge; input gains `padding-right: 40px`
- Icon rendered at `--icon-sm` (16px), stroke-width 1.5px, `--content-tertiary` color
- In error state, trailing icon shifts to `--status-error`

## Anatomy

```
.ls-form-field
  label.field-label         ← .t-title-sm · --content-primary
  .input-wrap               ← position: relative
    span.input-icon.leading ← (optional) --icon-sm, --content-tertiary
    input.ls-input          ← text-field
    span.input-icon.trailing← (optional)
  div.field-helper          ← .t-body-sm · --content-tertiary / --status-error
```

For text-area, replace `input.ls-input` with `textarea.ls-textarea`.

## Modifier Classes

| Class | Effect |
|-------|--------|
| `.field-label.required` | Appends `*` in `--status-error` via `::after` |
| `.input-wrap.has-leading` | Shifts input `padding-left` to clear icon |
| `.input-wrap.has-trailing` | Shifts input `padding-right` to clear icon |
| `.input-wrap.has-error` | Makes trailing icon adopt error color |
| `.ls-input.focused` | Forces focused appearance (static preview use) |
| `.ls-input.error-state` | Forces error appearance |
| `.ls-input.disabled` | Forces disabled appearance |
| `.ls-textarea.*` | Same modifiers apply to text-area |

## Motion

- `border-color` and `box-shadow` transition: `--duration-fast` (`120ms`) ease
- TextArea height growth: instantaneous (no CSS height animation — mobile keyboard fight prevention)
