# LSPhaseDot — Atom

**Family:** Display atoms (UC-ATM-08)
**Status:** Spec complete
**Authority:** `.spec/prds/v2/concepts/uc-atm-08-phasedot.html`

## Description

A 10px circular status indicator that communicates position in the AI Navigator's
multi-step planning pipeline. Three states give the rider at-a-glance progress
feedback without requiring map eye-off: hollow (waiting), copper-filled with a
pulsing ring (in progress), green-filled (complete).

The atom is intentionally small — 10px is the minimum legible diameter on retina
iOS (3x) and Android XXXHDPI. The ring-pulse adds temporal rhythm. The animated
bounding box extends to 40px per side to accommodate the ring's max radius (15px
clearance each side), but this is visual-only — layout does not need to grow.

**atoms-used:** none (primitive atom)

## States

| State | Class | Fill | Border | Animation |
|-------|-------|------|--------|-----------|
| pending | `.ls-phase-dot.pending` | `--surface-card` | `1px solid --border-strong` | none |
| active | `.ls-phase-dot.active` | `--signal-default` | none | `phaseDotPulse` — 900ms ring pulse |
| done | `.ls-phase-dot.done` | `--status-success` | none | none |

## Token Table

| Token | Role |
|-------|------|
| `--signal-default` | Active state dot fill (copper) |
| `--status-success` | Done state dot fill (green) |
| `--surface-card` | Pending state hollow fill |
| `--border-strong` | Pending state border |
| `--border-default` | Connector line (pending/active steps, molecule scope) |
| `--signal-tint` | Connector line (done→active transition, molecule scope) |
| `--radius-pill` | Dot border-radius (50% / 999px) |
| `--duration-deliberate` | Not used directly — pulse is 900ms per motion.recipe |
| `--ease-standard` | Animation timing (ease-in-out per motion.recipe) |
| `--opacity-dim` | Not used directly — ring starts at 0.4 opacity |
| `--opacity-subtle` | Not used directly — ring ends at 0 opacity |
| `--stroke-sm` | Border width on pending state (1px) |
| `--stroke-md` | Ring border width (1.5px) |

## Animation Spec — `motion.recipe.phaseDotPulse`

| Property | Value | Notes |
|----------|-------|-------|
| Trigger | state == `.active` (on render) | Begins immediately; no delay |
| Element | `::after` pseudo-element | Concentric ring overlay |
| Starting state | `scale(0)` `opacity: 0.4` | Ring at dot center, 40% visible |
| Ending state | `scale(1.5)` `opacity: 0` | Ring at 15px radius from center, invisible |
| Duration | `900ms` | Per motion.recipe.phaseDotPulse |
| Easing | `ease-in-out` | Per motion.recipe.phaseDotPulse |
| Iteration | `infinite` | Continuous loop, no reversal |
| Ring inset | `-4px` (production) / `-16px` (50px scaled demo) | Positions ring outside dot edge |
| Ring border | `1.5px solid --signal-default` | Copper ring matches dot fill |
| Max ring radius | `15px` from dot center (at scale 1.5×) | Bounding box must be 40px min |

## Dimension Reference

| Property | Value | Token / Notes |
|----------|-------|---------------|
| Dot diameter | `10px` | Fixed; not responsive to font scale |
| Border (pending) | `1px` | `--stroke-sm` / `--border-strong` |
| Ring border | `1.5px` | `--stroke-md` / `--signal-default` |
| Ring max radius | `15px` | At `scale(1.5)` — 1.5× dot half-radius |
| Bounding box (active) | `40px × 40px` | 10px dot + 15px clearance per side |
| Demo scale | `50px` | Scaled 5× for inspection; same token usage |

## Composition

LSPhaseDot is composed into the **PhaseIndicator** molecule (UC-MOL-07) — five dots
in sequence with 1px connector lines and `instrument.sm` step labels below. Connector
color varies by step completion: `--status-success` for done→done, `--signal-tint`
for done→active, `--border-default` for active→pending, `--border-subtle` for
pending→pending.

## Usage

```html
<!-- Pending: hollow dot -->
<div class="ls-phase-dot pending"></div>

<!-- Active: copper fill + ring pulse (900ms loop) -->
<div class="ls-phase-dot active"></div>

<!-- Done: green fill + white checkmark -->
<div class="ls-phase-dot done"></div>
```

Parent containers showing the active state must allow at least 40px × 40px of
visible overflow for the ring animation. Set `overflow: visible` on any clipping
ancestor.

## Quality Bar

- Zero hex in component CSS
- Zero raw numeric font/spacing (all `--token` references)
- `@keyframes` defined in local style block; no external animation library
- Both themes rendered in preview
- Production size (10px) and scaled inspection size (50px) both shown
- PhaseIndicator composition (5-step row) shown in preview
