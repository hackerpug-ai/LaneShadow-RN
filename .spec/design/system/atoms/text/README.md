# text — Typography Atom (LSText)

**UC-ATM-01** | Copper V2 | Atoms tier

## Purpose

`LSText` is the single typed text primitive for the LaneShadow design system. Downstream code selects a variant class (e.g. `.t-opinion-xl`, `.t-title-md`, `.t-instr-lg`) rather than reaching for font-size, font-family, or letter-spacing directly. The atom resolves font family, size, weight, line-height, letter-spacing, and tabular-num feature flags from `typography/type-modules.css`.

Color is a separate semantic token from `--content-*`. No color literals appear on the atom itself.

- **atoms-used:** none — pure `.t-*` class + semantic color token

---

## Token Table

### Type Classes (`typography/type-modules.css`)

| Class | Family | Weight | Size | Line-height | Letter-spacing | Features |
|---|---|---|---|---|---|---|
| `.t-opinion-xl` | `--font-opinion` | 400 | 30px | 1.12 | -0.015em | italic-capable |
| `.t-opinion-lg` | `--font-opinion` | 400 | 22px | 1.18 | -0.01em | italic-capable |
| `.t-opinion-md` | `--font-opinion` | 400 | 17px | 1.32 | 0 | italic-capable |
| `.t-opinion-sm` | `--font-opinion` | 400 | 14px | 1.45 | 0 | italic-capable |
| `.t-title-lg` | `--font-ui` | 600 | 17px | 1.24 | -0.01em | — |
| `.t-title-md` | `--font-ui` | 600 | 14px | 1.28 | -0.005em | — |
| `.t-title-sm` | `--font-ui` | 600 | 12px | 1.28 | 0 | — |
| `.t-body-lg` | `--font-ui` | 400 | 14px | 1.48 | 0 | — |
| `.t-body-md` | `--font-ui` | 400 | 12px | 1.52 | 0 | — |
| `.t-body-sm` | `--font-ui` | 400 | 10.5px | 1.48 | 0 | — |
| `.t-label-lg` | `--font-ui` | 500 | 11px | 1.0 | 0.08em | uppercase |
| `.t-label-md` | `--font-ui` | 600 | 9.5px | 1.0 | 0.12em | uppercase |
| `.t-label-sm` | `--font-ui` | 600 | 8.5px | 1.0 | 0.14em | uppercase |
| `.t-instr-lg` | `--font-instrument` | 500 | 18px | 1.12 | -0.02em | tnum |
| `.t-instr-md` | `--font-instrument` | 500 | 13px | 1.20 | -0.01em | tnum |
| `.t-instr-sm` | `--font-instrument` | 500 | 10px | 1.20 | 0 | tnum |
| `.t-instr-xs` | `--font-instrument` | 500 | 8.5px | 1.0 | 0 | tnum |

### Font Family Tokens (`tokens/tokens.css`)

| Token | Value |
|---|---|
| `--font-opinion` | Newsreader, Georgia, Times New Roman, serif |
| `--font-ui` | Geist, -apple-system, BlinkMacSystemFont, Helvetica Neue, sans-serif |
| `--font-instrument` | JetBrains Mono, ui-monospace, SF Mono, Menlo, monospace |

### Content Color Tokens (`tokens/tokens.css`)

| Token | Light | Dark | When to use |
|---|---|---|---|
| `--content-primary` | `--ink-900` | `--ink-050` | Default body / title text |
| `--content-secondary` | `--ink-400` | `--ink-100` | Supporting / descriptive text |
| `--content-tertiary` | `--ink-300` | `--ink-200` | Metadata, timestamps, captions |
| `--content-subtle` | `--ink-200` | `--ink-300` | Placeholder, disabled text |
| `--content-on-signal` | `#FFFFFF` | `#FFFFFF` | Text on copper/signal fills |
| `--signal-default` | `--copper-500` | `--copper-500` | Highlighted / branded text |

---

## Variant Matrix

### Opinion (Newsreader — Navigator voice, display headings)

| Variant | Class | Italic | Typical use |
|---|---|---|---|
| XL | `.t-opinion-xl` | `em.opinion-ital` | Navigator opener question, hero moment |
| LG | `.t-opinion-lg` | `em.opinion-ital` | Route name / sheet title |
| MD | `.t-opinion-md` | `em.opinion-ital` | Navigator body suggestion |
| SM | `.t-opinion-sm` | `em.opinion-ital` | Ambient secondary voice |

### Title (Geist SemiBold — UI chrome headings)

| Variant | Class | Typical use |
|---|---|---|
| LG | `.t-title-lg` | Screen title, sheet heading |
| MD | `.t-title-md` | Card title, action label |
| SM | `.t-title-sm` | Section header, tab label |

### Body (Geist Regular — paragraph and list text)

| Variant | Class | Typical use |
|---|---|---|
| LG | `.t-body-lg` | Primary body copy, route description |
| MD | `.t-body-md` | Supporting description, metadata |
| SM | `.t-body-sm` | Caption, footnote |

### Label (Geist — all-caps eyebrow / chip text)

| Variant | Class | Typical use |
|---|---|---|
| LG | `.t-label-lg` | Section eyebrow, pill label |
| MD | `.t-label-md` | Badge text, data label |
| SM | `.t-label-sm` | Micro metadata, timestamp label |

### Instrument (JetBrains Mono — numeric readouts, coordinates)

| Variant | Class | Typical use |
|---|---|---|
| LG | `.t-instr-lg` | Distance / time hero number |
| MD | `.t-instr-md` | Elevation gain, secondary stat |
| SM | `.t-instr-sm` | Weather data, coordinate fragment |
| XS | `.t-instr-xs` | Column headers, unit labels |

---

## States

| State | Behaviour |
|---|---|
| **Default** | `.t-{role}-{size}` + content color token |
| **Italic** | `em.opinion-ital` inside opinion variants only; Geist and JetBrains Mono do not use italic |
| **Disabled** | Consumer applies `opacity: var(--opacity-disabled)` (0.38) to the parent container |
| **Truncated** | Consumer applies `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` or `-webkit-line-clamp` — not owned by the atom |

LSText has no interactive states. Motion is owned by composing organisms.

---

## Usage Rules

1. Never write `font-size`, `font-family`, `font-weight`, `line-height`, or `letter-spacing` inline — use a `.t-*` class.
2. Never write a hex color literal for text — use `var(--content-*)` or `var(--signal-*)`.
3. Italic is available on opinion variants only via `em.opinion-ital`.
4. Tabular number alignment (`tnum`) is built into all instrument variants.
5. Dynamic Type (iOS) / font-scale (Android) multiply every size proportionally — containing elements must not clip at larger scales.
