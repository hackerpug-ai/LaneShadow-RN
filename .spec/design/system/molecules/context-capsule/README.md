# mol-context-capsule

**Use Case**: Map-View Redesign 2026-05-06 (introduces Container Principle)
**Tier**: Molecule (composes atoms · used by views in `org-map-layer__top-overlay` slot)
**Replaces**: `view-idle-screen__greeting` (legacy floating headline) · `view-idle-screen__advisory` (weather card) · top-overlay portion of UC-MOL-07 LSPhaseIndicator

---

## Purpose

A single evolving glass container that owns the `org-map-layer__top-overlay` slot across every map view. Its purpose is to:

1. **Speak the Navigator's voice.** Newsreader serif + italic copper scope-word + first-name interpolation establish the conversational, authored brand voice (PRD UC-SCR-01 §01: *"A map that listens — not a form that asks"*).
2. **Carry contextual information.** Time of day, weather, route metrics — whatever the current state requires, in the same visual slot.
3. **Honor the Container Principle.** All non-map text on the canvas lives in a glass container; this molecule is the canonical implementation of that rule.

The capsule is the answer to two competing requirements:

- The PRD's headline-as-thesis (the greeting establishes that Navigator is conversational and present)
- The user observation that the legacy `t-opinion-xl` floating headline was *too aggressive*, dominating the upper third of the map and washing out where it crossed map content

The capsule preserves the voice at calmer typography (`t-opinion-md`, ~17px) and pins it inside a glass surface so it reads as chrome rather than typography-against-map.

---

## States

| Variant | Used by | Headline | Meta row |
|---|---|---|---|
| `--idle` | idle-screen | `Where are we riding {today\|tonight}, {firstName}?` (italic em on scope-word) | `{Day} · {Temp} · {Condition}` |
| `--idle` (no location) | idle-screen V01 | `Where are we starting from?` (italic em on "starting") | `{Day} · {Temp} · {Condition}` |
| `--idle` (first ride) | idle-screen V02 | `First ride? Ask me anything.` (italic em on "Ask") | `{Day} · {Temp} · {Condition}` |
| `--idle --warning` | idle-screen V03 | `Not the prettiest day for it.` (italic em on "prettiest") | Tinted `--status-warning`; e.g. `Friday · 52°F · Rain · 0.4″` |
| `--planning` | planning-screen | `{Sketching|Asking|Refining|…}` italic single line + copper pulse spinner | (none) |
| `--route` | route-results-screen, route-details-screen | Route name in italic em (Newsreader) | `{distance} · {duration} · arr {ETA}` (JetBrains Mono, content-tertiary) |
| `--route --saved` | route-details-screen (favorited) | Route name | Metrics + copper hairline border |
| (hidden) | sessions-screen, error-screen, auth-screen | — | — |

States are mutually exclusive base classes; `--warning` and `--saved` are additive modifiers.

---

## Atoms / Molecules Used

| Dependency | Why |
|---|---|
| Tokens only | Surface, glass blur, border, content colors, signal copper, status-warning, font families, spacing — all token-driven |
| `.t-opinion-md`, `.t-opinion-sm` | Headline typography (Newsreader) |
| `.t-label-sm` | Meta row typography (Geist or instrument depending on state) |
| `--font-instrument` | JetBrains Mono override on `--route` meta row for metric readability |

No nested molecules. The capsule is structurally simple by design.

---

## Geometry

| Property | Value | Reason |
|---|---|---|
| Container background | `var(--surface-glass)` | Frosted glass; flips per theme |
| Backdrop filter | `blur(14px) saturate(1.2)` | Matches LSChatInput / Navigator-message blur scale |
| Border | `var(--stroke-sm) solid var(--border-default)` | Hairline definition |
| Border radius | `var(--radius-lg)` (10px) | Softer than 16px hero cards; harmonizes with chat-input pills |
| Padding | `var(--space-3) var(--space-4)` (8 × 12pt) | Compact chrome |
| Min/max width | 220–340pt | Fits within 390pt phone frame with `var(--space-4)` margins each side |
| Shadow | `var(--elev-overlay)` | Same elevation tier as topbar chrome |

---

## Token Recipe

| Element | Token |
|---|---|
| Glass background | `var(--surface-glass)` |
| Border | `var(--border-default)` |
| Headline color | `var(--content-primary)` |
| Italic em color (idle/planning) | `var(--signal-default)` (copper) |
| Italic em color (route) | `var(--content-primary)` (route names stay in primary, not signal) |
| Meta row color (default) | `var(--content-secondary)` |
| Meta row color (route state) | `var(--content-tertiary)` (demoted) |
| Meta row color (warning state) | `var(--status-warning)` |
| Meta-dot fill | `currentColor` at opacity 0.45 |
| Spinner fill | `var(--signal-default)` |
| Saved hairline | `var(--signal-default)` |

---

## Z-Order

The capsule lives at the top of `org-map-layer__top-overlay` (z-index 2) just below the topbar. It does not intersect the **vertically-centered** `org-map-controls` workbar because the workbar sits along the right midline of the canvas while the capsule is anchored near the top — they occupy non-overlapping vertical regions. Capsule is centered with `min-width: 220px; max-width: 340px;` — at 390pt phone width with `var(--space-4)` × 2 = 24pt side margins and a 40pt-wide right-side controls strip, there is comfortable horizontal clearance even if both rendered at the same vertical band.

---

## Accessibility

| Element | Role / Landmark |
|---|---|
| `.mol-context-capsule` | Container — no ARIA role; non-interactive presentation |
| `.mol-context-capsule__headline` | Use `<h2>` when this is the page's primary heading (idle-screen) |
| `.mol-context-capsule__spinner` | `aria-hidden="true"` (decorative) |
| Focus order | Capsule is non-interactive — skipped in focus traversal |

---

## Production Mapping

| State | iOS source | Android source |
|---|---|---|
| `--idle` greeting | `IdleViewModel.greetingDisplayName` + `greetingScope` (Tasks #1224, #1228) | `IdleViewModel` parity (Task #1228) |
| `--idle` meta row | `IdleViewModel.metaRow` (`{Day} · {Temp} · {Condition}`) | parity |
| `--idle --warning` | `IdleViewModel.weatherAdvisory` severity ≥ advisory | parity |
| `--planning` headline | TBD planning-screen view-model |
| `--route` headline | `Route.displayName` (italic) | parity |
| `--route` meta | `Route.distance` / `Route.duration` / `Route.eta` formatted by view-model | parity |

---

## Quality Gates

- Zero hex literals in CSS — all colors via tokens
- Zero numeric font-size / weight / line-height — typography delegated to `.t-opinion-md`, `.t-opinion-sm`, `.t-label-sm`
- Min/max width fits within 390pt phone frame with side gutters
- Glass effect renders cleanly over the new MapboxPaperTile (water + parks + streets + labels do not bleed through legibly — backdrop blur + 72% surface opacity validated)
- Copper italic em on idle/planning; primary italic em on route — never both
- Hidden in error-screen / auth-screen / sessions-screen (those views own their own primary message via existing organisms)
