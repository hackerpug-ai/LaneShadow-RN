# org-route-sheet — LSRouteSheet

**Authority:** [`uc-org-04-route-sheet.html`](../../../../prds/v2/concepts/uc-org-04-route-sheet.html) · [`07-uc-org.md §UC-ORG-04`](../../../../prds/v2/07-uc-org.md)

The RouteDetails bottom sheet. LSBottomSheet shell (drag handle + rounded top corners + elevation) wrapping a composition: best badge + scenic tag + opinion title + via subtitle + 4-col instrument readout + 6-cell weather timeline + sticky action row (Save / Ride this).

## Purpose

The rider's final decision surface. All metrics the rider needs to commit — distance, time, climb, scenic score, weather along the way — plus the two actions that move them forward: save (bookmark) or ride (commit).

## Anatomy

```html
<div class="mol-bottom-sheet">
  <div class="mol-bottom-sheet__handle-bar">
    <div class="mol-bottom-sheet__handle"></div>
  </div>
  <div class="org-route-sheet">
    <div class="org-route-sheet__head">
      <div class="org-route-sheet__badge-row">
        <span class="ls-badge-best">…</span>
        <span class="t-label-sm org-route-sheet__scenic">…scenic dots + label…</span>
      </div>
      <div class="t-opinion-lg org-route-sheet__title">…</div>
      <div class="t-body-sm org-route-sheet__via">…</div>
    </div>

    <!-- UC-MOL-07 — dist / time / climb / scenic -->
    <div class="mol-instrument-readout">…grid--4…</div>

    <!-- UC-MOL-07 — optional 6-cell weather strip -->
    <div class="mol-weather-timeline">…cells--24h…</div>

    <div class="org-route-sheet__actions">
      <button class="ls-btn ls-btn--outline">Save</button>
      <button class="ls-btn ls-btn--primary">Ride this</button>
    </div>
  </div>
</div>
```

The sheet shell comes from `.mol-bottom-sheet` (UC-MOL-03). The organism adds layout glue for the route-specific content.

## Variants

| Variant | Composition notes |
|---|---|
| Best route | `.ls-badge-best` + full scenic dot strip (5 dots, 3 filled) + all sections |
| Alt route | No `ls-badge-best`; scenic tag shows "Moderate scenic" with 2 filled dots; optional polyline `v-alt1` on the map behind |
| Long title + via | Title wraps to 2 lines; weather section can be omitted for brevity |
| Mixed weather | Weather timeline shows clear + wind + rain cells — demonstrates `.mol-wx--*` tints |
| Dark mode | All tokens re-resolve; best-badge copper remains vivid |

## States

- **Detent `.medium` / `.large`** — the sheet shell (`.mol-bottom-sheet`) handles detent height via the outer presentation container. Our preview renders the sheet at full content height (~`.large`).
- **Drag-to-dismiss** — the handle bar is the gesture affordance; dismiss animation is `mapTapDismiss` via the presenting `LSMapLayer`.
- **Action pressed states** — inherited from `.ls-btn` atom; no organism-level overrides.

## Composes

| Tier | Consumer | Role |
|---|---|---|
| Atom | `ls-btn` (`.ls-btn--outline`, `.ls-btn--primary`) | Save + Ride this action row |
| Atom | `ls-badge-best` | Copper "Best Route" badge |
| Molecule | `mol-bottom-sheet` (+ `__handle-bar`, `__handle`) | Sheet shell: surface, corners, elevation, drag handle |
| Molecule | `mol-instrument-readout` (+ `__grid--4`, `__cell`, `__label`, `__value`, `__unit`, `__divider`) | 4-col metric grid (dist / time / climb / scenic) |
| Molecule | `mol-weather-timeline` (+ `__header`, `__title`, `__range`, `__cells--24h`, `__cell`, `__hour`, `__icon`, `__temp`) with `.mol-wx--{clear,rain,wind,storm,hot,cold}` tints | 6-cell per-hour forecast |
| Typography module | `.t-opinion-lg` | Route title |
| Typography module | `.t-body-sm` | Via subtitle + action icon labels |
| Typography module | `.t-label-sm` | Best-Route badge text, scenic tag text, readout labels, weather timeline labels |
| Typography module | `.t-instr-md` | Instrument-readout values (distance, time, climb, scenic score) |
| Typography module | `.t-instr-sm` | Weather-timeline temperatures and range |

## Atoms / molecules used (matrix)

| Layer | Consumer |
|---|---|
| atom: button | Save (outline) + Ride this (primary) |
| atom: badge-best | Best route pill |
| atom: text (typography classes) | All labels + titles |
| molecule: bottom-sheet | Sheet shell |
| molecule: instrument-readout | 4-col metric grid |
| molecule: weather-timeline | 6-cell forecast |

## Token recipe

| Property | Token |
|---|---|
| org container `padding` | `var(--space-0) var(--space-5) var(--space-5)` — no top padding (handle bar owns it) |
| org container `gap` | `var(--space-3)` |
| head `gap` | `var(--space-1)` |
| badge-row `gap` | `var(--space-3)` |
| scenic dot size | `var(--space-2)` — 4pt |
| scenic dot default `background` | `var(--border-strong)` |
| scenic dot filled `background` | `var(--signal-default)` |
| title `font-family` | `var(--font-opinion)` |
| title `color` | `var(--content-primary)` |
| via `color` | `var(--content-secondary)` |
| actions `gap` | `var(--space-3)` |
| actions `margin-top` | `var(--space-2)` |
| Save flex | `1` (organism rule) |
| Ride flex | `2` (organism rule — gives the committed action more weight) |

## Motion references

| Trigger | Recipe | Effect |
|---|---|---|
| Sheet presented (.large) | `routeDrawOn` | Sheet slides up from bottom; polyline draws on the map simultaneously |
| Drag-down or map tap | `mapTapDismiss` | Sheet slides back down; `onDismiss` fires once |
| Best badge appears with sheet | `bestBadgeEnter` | Badge scales 0.8 → 1.0 + fades in 200ms after sheet settles |

Motion recipes are defined at the tokens/motion layer. The organism references them by name; the CSS does not carry animation definitions.

## Accessibility

- Sheet should have `role="dialog"` + `aria-modal="true"` when presented. The handle bar itself is purely visual — dismissal is keyboard-accessible via Esc.
- The action row buttons must have explicit text labels ("Save", "Ride this"); icons are decorative.
- Instrument values must be announced as "47 miles" not "47 mi" — native implementations should provide an `accessibilityLabel` override that expands the unit abbreviation.
- Weather cells should be labelled in the form "9 AM, clear, 62 degrees" so screen readers announce the full state per cell.

## Organism-local constants

| Property | Value | Reason |
|---|---|---|
| Save `flex: 1` / Ride `flex: 2` | — | Organism-level ratio — the committed action is twice the width of the secondary. A deliberate UX decision, not a tokenizable value. |

Every color / spacing / radius / elevation resolves to a token. The organism adds layout glue and semantic ratios but does not introduce literals.

## How to preview

Open `organisms/route-sheet/route-sheet.html` in a browser — every story renders in both light and dark `theme-pane`s with the sheet anchored to the bottom of a simulated map stage.
