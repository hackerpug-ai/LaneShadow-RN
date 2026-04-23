# instrument-readout

LaneShadow V2 Copper · Navigator Molecule · Authority: uc-mol-07-navigator-molecules.html

## Purpose

`LSInstrumentReadout` lays out numeric ride metrics — distance, time, elevation gain, scenic score, speed, coordinates — in a tabular monospace grid. It is the canonical container for all numeric data in Navigator outputs.

**When it appears:** In RouteDetailsScreen as the primary stat block below the route title, and as an inline strip inside chat result cards. It may also appear as a large standalone "hero" readout for a single key metric (e.g. distance on the map overlay).

**Why it matters (Navigator voice):** Numbers are sacred to cyclists. Misaligned or inconsistently rendered metrics destroy trust. The tabular mono alignment, `border-right` cell separators (not gaps), and consistent label/value/unit hierarchy ensure every number lands with authority. The copper accent on scenic score signals the Navigator's editorial judgment.

## Anatomy

```html
<!-- Standard 4-metric block -->
<div class="mol-instrument-readout" aria-label="Route metrics">
  <div class="mol-instrument-readout__divider" role="separator" aria-hidden="true"></div>
  <div class="mol-instrument-readout__grid mol-instrument-readout__grid--4">
    <div class="mol-instrument-readout__cell">
      <span class="mol-instrument-readout__label t-label-sm">Dist</span>
      <span class="mol-instrument-readout__value t-instr-lg">64 mi</span>
    </div>
    <div class="mol-instrument-readout__cell">
      <span class="mol-instrument-readout__label t-label-sm">Time</span>
      <span class="mol-instrument-readout__value t-instr-lg">2h 10m</span>
    </div>
    <div class="mol-instrument-readout__cell">
      <span class="mol-instrument-readout__label t-label-sm">Climb</span>
      <div class="mol-instrument-readout__value t-instr-lg">
        2,400
        <span class="mol-instrument-readout__unit t-label-sm">ft gain</span>
      </div>
    </div>
    <div class="mol-instrument-readout__cell">
      <span class="mol-instrument-readout__label t-label-sm">Scenic</span>
      <span class="mol-instrument-readout__value t-instr-lg mol-instrument-readout__value--accent">9.2</span>
    </div>
  </div>
  <div class="mol-instrument-readout__divider" role="separator" aria-hidden="true"></div>
</div>
```

### Coordinates variant

```html
<div class="mol-instrument-readout__cell">
  <span class="mol-instrument-readout__label t-label-sm">Lat</span>
  <span class="mol-instrument-readout__value t-instr-md">40.7891° N</span>
</div>
<div class="mol-instrument-readout__cell">
  <span class="mol-instrument-readout__label t-label-sm">Lon</span>
  <span class="mol-instrument-readout__value t-instr-md">111.8771° W</span>
</div>
```

### Hero / standalone variant

```html
<div class="mol-instrument-readout mol-instrument-readout--hero">
  <span class="mol-instrument-readout__label t-label-lg">Distance</span>
  <span class="mol-instrument-readout__value t-instr-lg">64.2 mi</span>
  <span class="mol-instrument-readout__unit t-label-md">miles</span>
</div>
```

## Variants

| Variant | Modifier | Columns | Use case |
|---|---|---|---|
| 4-metric (default) | `--4` | 4 | Primary route card: dist / time / climb / scenic |
| 3-metric | `--3` | 3 | Compact card: dist / time / climb |
| 2-metric | `--2` | 2 | Inline in chat: dist / time |
| Coords | `--coords` | 2–4 | Lat/lon display, tighter mono values |
| Elevation pair | `--elev` | 2 | Elevation + gain/loss |
| Multi-row stat block | `--multi-row` | 4 + 4 | Activity stats: speed / cadence / hr / power |
| Hero standalone | `--hero` | 1 | Single metric overlaid on map |
| Inline meta | `--inline` | N | Embedded in list row, no dividers |

## States

| State | Description |
|---|---|
| Default | `content-primary` values, `content-tertiary` labels |
| Accent | `--accent` modifier on value: `signal-default` copper — used for scenic score, best route indicator |
| Loading | Values replaced with `mol-instrument-readout__skeleton` — animated shimmer block |
| Error / missing | Value shows `—` in `content-subtle` |

## Atoms Used

| Atom | Role |
|---|---|
| `.t-instr-lg` (UC-ATM-01) | Primary numeric value — 18px tabular mono |
| `.t-instr-md` (UC-ATM-01) | Secondary value — 13px, used for coords / inline |
| `.t-instr-sm` (UC-ATM-01) | Compact inline value — 10px |
| `.t-label-sm` (UC-ATM-01) | Cell label + unit sub-text |
| `.t-label-lg` (UC-ATM-01) | Hero variant label |
| `ls-divider` (UC-ATM-04) | Top and bottom separator lines |

## Token Recipe

| Property | Token |
|---|---|
| Container background | `var(--surface-card)` |
| Container border-radius | `var(--radius-lg)` |
| Container shadow | `var(--elev-card)` |
| Container overflow | `hidden` |
| Cell padding | `var(--space-2)` `var(--space-4)` |
| Cell border-right | `var(--stroke-sm) solid var(--border-subtle)` |
| Cell border-right (last) | `none` |
| Grid padding | `var(--space-3)` `0` |
| Divider color | `var(--border-subtle)` |
| Divider height | `var(--stroke-sm)` |
| Label color | `var(--content-tertiary)` |
| Value color | `var(--content-primary)` |
| Value accent color | `var(--signal-default)` |
| Unit color | `var(--content-tertiary)` |
| Unit margin-top | `var(--space-1)` |

## Accessibility

- Container carries `aria-label="Route metrics"` or a contextually specific label.
- Each `mol-instrument-readout__cell` carries `aria-label` combining label + value + unit: `"Distance: 64 miles"`, `"Climb: 2,400 feet gain"`, `"Scenic score: 9.2"`.
- Dividers carry `role="separator"` + `aria-hidden="true"`.
- Tabular numeral alignment (`font-feature-settings: "tnum" 1`) is baked into `.t-instr-*` — never override it.
- Coordinate values must include cardinal direction in the accessible name: `"Latitude: 40.7891 degrees North"`.
- Hero variant: wrap in `aria-live="polite"` if the value updates during an active ride session.

## Animation Notes

### instrumentCellEnter (staggered mount)
```css
/* Cells start hidden: */
.mol-instrument-readout__cell {
  opacity: 0;
  transform: translateY(var(--space-2));
}
/* Each cell reveals with 30ms stagger: */
/* animation: cellEnter var(--duration-fast) var(--ease-decelerated) forwards */
/* delay: (nth-child - 1) * 30ms */
@keyframes cellEnter {
  to { opacity: 1; transform: translateY(0); }
}
```

### Value tick (live ride session)
```css
/* When value updates, the number "ticks" — brief scale pulse: */
@keyframes instrTick {
  0%   { opacity: 1; }
  40%  { opacity: 0.4; }
  100% { opacity: 1; }
}
/* transition: opacity var(--duration-fast) var(--ease-standard) */
```

### Loading skeleton
```css
.mol-instrument-readout__skeleton {
  height: 18px;      /* matches t-instr-lg line height */
  width: 60%;
  border-radius: var(--radius-xs);
  background: linear-gradient(
    90deg,
    var(--surface-inset) 0%,
    var(--border-default) 50%,
    var(--surface-inset) 100%
  );
  background-size: 200% 100%;
  animation: shimmer var(--duration-deliberate) var(--ease-linear) infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Notes

- `mol-instrument-readout` never redefines `.ls-divider` — it only places `mol-instrument-readout__divider` divs that reference the atom class.
- Cell separators use `border-right` (not grid gap) to create a continuous value band — values in adjacent cells appear to sit on the same baseline.
- `.t-instr-*` classes already set `font-feature-settings: "tnum" 1` — do not re-declare it in molecule styles.
- The scenic score accent (`--accent`) is the only value that deviates from `content-primary`; no other metric should use copper unless it represents the Navigator's editorial recommendation.
- `mol-instrument-readout--hero` variant omits dividers and uses generous padding for map overlay contexts.
- `mol-instrument-readout--inline` variant omits background, border-radius, and shadow — it renders as a transparent strip inside a parent card.
