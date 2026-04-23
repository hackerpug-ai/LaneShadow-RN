# Pill Atom — LSPill

UC-ATM-06 · LaneShadow V2 Copper · Tier B

A non-interactive shape primitive that provides the pill geometry (radius-pill = 999px), three size tiers, and horizontal padding defaults. LSPill carries no color of its own — background, border, and text color are applied by the consuming context or molecule.

## atoms-used

- none (tokens only)

## Size Table

| Size | Token | Height | H-Padding (default) | Font class | Icon size |
|------|-------|--------|---------------------|------------|-----------|
| `sm` | `sizing.pill.sm` | 24px → `--space-7` | `--space-3` (8px) | `.t-body-sm` + `font-weight: 500` | 10px |
| `md` | `sizing.pill.md` | 32px → `--space-8` | `--space-4` (12px) | `.t-body-md` + `font-weight: 500` | 13px |
| `lg` | `sizing.pill.lg` | 40px → `--space-9` | `--space-5` (16px) | `.t-body-lg` + `font-weight: 500` | 15px |

Height note: `--space-7 = 24px`, `--space-8 = 32px`, `--space-9 = 40px` — those tokens map exactly to the three pill heights.

Icon gap (icon + label together): 5px — not yet a canonical space token; applied as `gap: 5px` directly on the flex container. A future `--space-icon-gap` token may alias this.

## Variant Table

| Variant | Class | Background | Border | Text |
|---------|-------|------------|--------|------|
| `filled` | `.pill-filled` | `--signal-whisper` | `1px solid --signal-default` | `--content-primary` |
| `outlined` | `.pill-outlined` | `--surface-card` | `1px solid --border-default` | `--content-primary` |
| `ghost` | `.pill-ghost` | `transparent` | `1px solid --border-subtle` | `--content-secondary` |

Additional consumer-applied variants (not scoped to this atom): solid copper fill (`--signal-default` bg + `--content-on-signal` text), ink fill, etc. Those are responsibilities of consuming molecules.

## Token Table

| Role | Token | Light value | Dark value |
|------|-------|-------------|------------|
| Radius | `--radius-pill` | `999px` | `999px` |
| Filled background | `--signal-whisper` | `#FCE8D4` | `#FCE8D4` (static brand) |
| Filled border | `--signal-default` | `--copper-500` | `--copper-500` |
| Outlined background | `--surface-card` | `--paper-50` | `--ink-700` |
| Outlined border | `--border-default` | `--paper-400` | rgba white 12% |
| Ghost background | `transparent` | — | — |
| Ghost border | `--border-subtle` | `--paper-300` | rgba white 7% |
| Text (filled / outlined) | `--content-primary` | `--ink-900` | `--ink-050` |
| Text (ghost) | `--content-secondary` | `--ink-400` | `--ink-100` |

## Anatomy

```
span.ls-pill.{sm|md|lg}.{pill-filled|pill-outlined|pill-ghost}
  span.pill-icon   ← (optional) SVG, inherits color
  [text content]
```

## AC Traceability

| AC | Criterion |
|----|-----------|
| AC-1 | `LSPill(size: md)` renders at exactly 32px height |
| AC-2 | All padding values resolve from space tokens, not raw px |
| AC-3 | Story family: sm / md / lg × filled / outlined / ghost |
| AC-4 | `--radius-pill` applied; literal `999px` never appears in component CSS |
| AC-5 | No default background — variant class supplies it |
| AC-6 | Icon gap = 5px between icon and label |

## Motion

LSPill is a static shape atom. No intrinsic animation. Press feedback (`scale 0.96`, `80ms`) is the responsibility of the consuming molecule.
