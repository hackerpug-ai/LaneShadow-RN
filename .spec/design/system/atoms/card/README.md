# LSCard — Surface Atom

Single-purpose elevation container. Lifts content above the page canvas with a subtle shadow.

## Token Contract

| Property    | Token                 | Resolved (light)  | Resolved (dark)   |
|-------------|----------------------|-------------------|-------------------|
| background  | `--surface-card`     | `--paper-50`      | `--ink-700`       |
| border      | `--border-default`   | `--paper-400`     | rgba(242,238,232,0.12) |
| shadow      | `--elev-card`        | 0 2px 6px warm    | 0 2px 6px black   |
| radius      | `--radius-lg`        | 10px              | 10px              |
| padding-sm  | `--space-4`          | 12px              | 12px              |
| padding-md  | `--space-5`          | 16px (default)    | 16px              |
| padding-lg  | `--space-7`          | 24px              | 24px              |

## Variants

| Class              | Padding token  | Use-site                     |
|--------------------|----------------|------------------------------|
| `.ls-card`         | `--space-5`    | Default — route cards, tiles |
| `.ls-card--sm`     | `--space-4`    | Compact cards, list rows     |
| `.ls-card--lg`     | `--space-7`    | Detail cards, hero surfaces  |

## Acceptance Criteria

- AC-1: Background resolves via `--surface-card` — no raw hex
- AC-2: Border resolves via `--border-default` — no raw hex
- AC-3: Shadow resolves via `--elev-card`
- AC-4: Radius resolves via `--radius-lg`
- AC-5: Padding variants use `--space-4`, `--space-5`, `--space-7`
- AC-6: Both light and dark themes rendered and correct
- AC-7: Zero inline styles in production markup

## Use-Sites (downstream)

- Route card mini-layout
- Session tile in feed
- Chat message card
- Any content that must float above `--surface-primary`
