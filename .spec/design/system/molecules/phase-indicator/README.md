# phase-indicator

LaneShadow V2 Copper · Navigator Molecule · Authority: uc-mol-07-navigator-molecules.html

## Purpose

`LSPhaseIndicator` surfaces the Navigator's internal planning pipeline as an animated vertical step list. It appears over the map while the AI agent works — translating invisible async computation into a visible, legible progress story.

**When it appears:** The moment the user submits a routing request. It mounts with a subtle slide-up entry and lives in the PlanningScreen chat overlay until `all-done` state is reached, then collapses to yield to route results.

**Why it matters (Navigator voice):** The Navigator is opinionated and transparent. Showing the planning pipeline — even briefly — establishes trust and sets pacing expectations. The copper pulse ring says "the system is working"; the italic Newsreader header says "here is what I'm thinking about."

## Anatomy

```html
<div class="mol-phase-indicator" role="status" aria-live="polite" aria-label="Route planning: Searching routes">
  <!-- compass chip + narrator header -->
  <div class="mol-phase-indicator__head">
    <div class="mol-phase-indicator__compass-chip">
      <!-- compass SVG icon -->
    </div>
    <p class="mol-phase-indicator__header t-opinion-sm">
      <em>Searching available roads…</em>
    </p>
  </div>

  <!-- step list -->
  <ol class="mol-phase-indicator__steps" aria-label="Planning steps">
    <li class="mol-phase-indicator__step">
      <span class="ls-phase-dot done" aria-hidden="true"></span>
      <span class="mol-phase-indicator__step-label t-instr-sm state-done">Understanding your request</span>
    </li>
    <li class="mol-phase-indicator__step">
      <span class="ls-phase-dot active" aria-hidden="true"></span>
      <span class="mol-phase-indicator__step-label t-instr-sm state-active" aria-current="step">Searching routes</span>
    </li>
    <li class="mol-phase-indicator__step">
      <span class="ls-phase-dot pending" aria-hidden="true"></span>
      <span class="mol-phase-indicator__step-label t-instr-sm state-pending">Checking conditions</span>
    </li>
  </ol>
</div>
```

## Variants

| Variant | Description |
|---|---|
| `just-started` | Step 1 active, all others pending |
| `1-done` | Step 1 done (strikethrough), step 2 active |
| `2-done` | Steps 1–2 done, step 3 active |
| `3-done` | Steps 1–3 done, step 4 active |
| `4-done` | Steps 1–4 done, step 5 active |
| `all-done` | All done — top border and chip switch to `status-success` green |
| `all-pending` | No active dot; used in route previews / skeleton states |

**Step counts:** The component supports 3, 4, or 5 steps. Step count is determined by the planning pipeline depth, not hardcoded.

## States

### LSPhaseDot states (per step)

| State | Dot appearance | Label style |
|---|---|---|
| `pending` | Hollow; `surface-card` fill, `border-strong` border | `content-tertiary` |
| `active` | Solid `signal-default` fill + `phaseDotPulse` ring animation | `content-primary`, weight 600 |
| `done` | Solid `status-success` fill with inline checkmark | `content-secondary`, `text-decoration: line-through` |

### Indicator-level states

| State | Top border | Chip icon / color |
|---|---|---|
| In-progress | `signal-default` (copper) | Compass icon, `signal-default` |
| `all-done` | `status-success` | Checkmark icon, `status-success` |

## Atoms Used

| Atom | Role |
|---|---|
| `ls-phase-dot` (UC-ATM-08) | Per-step state indicator with pulse animation |
| `.t-opinion-sm` (UC-ATM-01) | Italic Newsreader narrator header inside `<em>` |
| `.t-instr-sm` (UC-ATM-01) | Step label text — tabular mono, 10px |
| `.t-label-sm` (UC-ATM-01) | Section eyebrow if needed |

## Token Recipe

| Property | Token |
|---|---|
| Container background | `var(--surface-card)` |
| Container border | `var(--signal-tint)` |
| Container border-top (in-progress) | `var(--signal-default)` 2px |
| Container border-top (all-done) | `var(--status-success)` 2px |
| Container shadow | `var(--elev-overlay)` |
| Container border-radius | `var(--radius-xl)` |
| Container padding | `var(--space-4)` `var(--space-5)` |
| Compass chip bg | `var(--signal-whisper)` |
| Compass chip border | `var(--signal-tint)` |
| Compass chip color | `var(--signal-default)` |
| Compass chip size | `var(--size-control-sm)` |
| Compass chip radius | `var(--radius-pill)` |
| Step gap | `var(--space-3)` |
| Step dot-label gap | `var(--space-3)` |
| Label pending color | `var(--content-tertiary)` |
| Label active color | `var(--content-primary)` |
| Label done color | `var(--content-secondary)` |
| All-done chip bg | `color-mix(in srgb, var(--status-success) 10%, transparent)` |
| All-done chip border | `color-mix(in srgb, var(--status-success) 30%, transparent)` |
| All-done chip color | `var(--status-success)` |

## Accessibility

- Wrap the molecule in `role="status"` + `aria-live="polite"` so screen readers announce progress updates non-interruptively.
- Set `aria-label` to the current step name: `"Route planning: [step name]"` — update it as steps advance.
- Mark the active step label with `aria-current="step"`.
- All `ls-phase-dot` elements carry `aria-hidden="true"` — they are decorative; the label text carries the meaning.
- The step list uses `<ol>` to communicate ordered sequence.
- Pulse ring animation: users with `prefers-reduced-motion: reduce` should see the ring omitted entirely — wrap the animation declaration in a `@media (prefers-reduced-motion: no-preference)` guard.

## Animation Notes

### phaseDotPulse (active dot ring)
```css
@keyframes phaseDotPulse {
  0%   { transform: scale(0.8); opacity: 0.6; }
  50%  { transform: scale(1.6); opacity: 0.2; }
  100% { transform: scale(0.8); opacity: 0.6; }
}
/* Applied via ls-phase-dot.active::after */
animation: phaseDotPulse var(--duration-deliberate) ease-in-out infinite;
/* 600ms → concept specifies 900ms; use 900ms literal in production until --duration-* scale expands */
```

### phaseStepComplete (active → done transition)
```css
/* dot background cross-fade */
transition: background var(--duration-standard) var(--ease-standard);
/* label strikethrough appearance */
transition: color var(--duration-fast) var(--ease-standard),
            text-decoration var(--duration-fast) var(--ease-standard);
```

### chatOverlayEnter (molecule mount)
```css
/* On mount: */
transform: translateY(calc(-1 * var(--space-3)));
opacity: 0;
/* Animates to: */
transform: translateY(0);
opacity: 1;
transition: transform var(--duration-standard) var(--ease-decelerated),
            opacity   var(--duration-standard) var(--ease-decelerated);
```

### bestBadgeEnter (transition to all-done)
```css
/* Top border color swap */
transition: border-top-color var(--duration-standard) var(--ease-standard);
/* Chip icon cross-fade */
transition: background var(--duration-standard) var(--ease-standard),
            border-color var(--duration-standard) var(--ease-standard),
            color var(--duration-fast) var(--ease-standard);
```

## Notes

- `mol-phase-indicator` never redefines `.ls-phase-dot` pulse ring dimensions — those belong to the atom.
- Dark mode: pending dots get `surface-inset` fill + `border-default` (rgba) border. Active copper ring pops brilliantly on dark.
- Minimum width: `240px`; no maximum — expands to container.
- The italic Newsreader `<em>` header text is the Navigator's "thinking voice" — it must never be plain UI type.
- Step count between 3 and 5 is valid. Fewer than 3 is an anti-pattern; more than 5 will require scrolling on small screens.
