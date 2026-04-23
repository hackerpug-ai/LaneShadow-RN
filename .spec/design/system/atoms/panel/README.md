# LSPanel — Surface Atom

Flat inset container. Groups content within a card or screen zone without adding another visual layer.

## Token Contract

| Property    | Token                 | Resolved (light)  | Resolved (dark)   |
|-------------|----------------------|-------------------|-------------------|
| background  | `--surface-inset`    | `--paper-200`     | `--ink-600`       |
| border      | `--border-subtle`    | `--paper-300`     | rgba(242,238,232,0.07) |
| shadow      | none                 | —                 | —                 |
| radius      | `--radius-md`        | 6px               | 6px               |
| padding     | `--space-4`          | 12px              | 12px              |

## Variants

LSPanel has a single visual variant — padding is fixed. Nesting position (inside LSCard vs standalone) does not change the atom's appearance.

## Acceptance Criteria

- AC-1: Background resolves via `--surface-inset` — no raw hex
- AC-2: Border resolves via `--border-subtle` — no raw hex
- AC-3: No box-shadow — flat by spec
- AC-4: Radius resolves via `--radius-md`
- AC-5: Padding resolves via `--space-4`
- AC-6: Both light and dark themes rendered and correct
- AC-7: Zero inline styles in production markup

## Use-Sites (downstream)

- Settings panels (label + text area groupings)
- Info blocks inside route cards
- Nested detail sections within LSCard
- Form input groupings in onboarding sheets
