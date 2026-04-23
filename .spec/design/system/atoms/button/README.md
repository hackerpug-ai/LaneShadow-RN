# Button — LSButton Atom

**Use Case**: UC-ATM-02  
**Sprint**: Sprint 02 — Atoms / Foundation Primitives  
**Version**: 2.0.0  
**Authority**: `.spec/prds/v2/concepts/uc-atm-02-button.html`

---

## Atoms Used

| Dependency | Why |
|------------|-----|
| Tokens only | LSButton consumes semantic tokens directly. No other atom is composed inside it. |
| (icon atom) | Icon SVGs are inlined as `<span class="btn-icon"><svg>` — the standalone icon atom is not required at this layer. If the icon catalog is used as a source for SVG shapes, document it; it is not a runtime dependency. |

---

## Purpose

LSButton is the only interactive tap target for confirmed actions. It is atomic — no molecule wraps it. Six variants express semantic intent. Every variant is structurally identical: 44px height, 10px radius (`--radius-md`), 16px horizontal padding (`--space-4`), Geist 14px/600 label.

---

## Structural Constants

| Property | Value | Token |
|----------|-------|-------|
| Height | 44px | `--size-control-lg` |
| Min-width (touch) | 44px | `--size-touch-min` |
| H-padding | 16px | `--space-4` |
| Radius | 10px | `--radius-md` |
| Icon size | 16px | `--icon-sm` |
| Icon-label gap | 8px | `--space-3` |
| Label font | Geist 14/600 | `var(--font-ui)` / weight 600 |
| Transition | 100ms ease | `--duration-fast` + `--ease-standard` |

---

## Token Table

### Primary variant

| State | Background | Foreground | Border | Shadow |
|-------|------------|------------|--------|--------|
| default | `--action-primary` → `--copper-500` | `--content-on-signal` | none | copper 30% |
| hover | `--action-primary-hover` → `--copper-400` | `--content-on-signal` | none | copper 40% |
| pressed | `--action-primary-pressed` → `--copper-700` | `--content-on-signal` | none | copper 20% + translateY(1px) |
| disabled | `--action-primary-disabled` → `--paper-300` (light) / `--ink-500` (dark) | `--content-on-signal` @ 0.55 opacity | none | none |
| focus | `--action-primary` | `--content-on-signal` | ring 3px `--border-focus` @ 35% | copper 30% |

### Secondary variant

| State | Background | Foreground | Border |
|-------|------------|------------|--------|
| default | `--surface-inset` | `--content-primary` | `--border-default` 1px |
| hover | `--paper-300` | `--content-primary` | `--border-strong` 1px |
| pressed | `--paper-400` | `--content-primary` | `--border-strong` 1px + translateY(1px) |
| disabled | `--surface-inset` | `--content-subtle` | `--border-subtle` 1px @ 0.55 |
| focus | `--surface-inset` | `--content-primary` | `--border-focus` 1px + ring 3px copper 20% |

*Dark secondary uses `--ink-600` / `--ink-500` / `--ink-400` for default / hover / pressed fills.*

### Ghost variant

| State | Background | Foreground |
|-------|------------|------------|
| default | transparent | `--content-primary` |
| hover | `--surface-inset` | `--content-primary` |
| pressed | `--paper-300` | `--content-primary` + translateY(1px) |
| disabled | transparent | `--content-subtle` @ 0.55 |
| focus | transparent | `--content-primary` + ring 3px copper 20% |

*Dark ghost uses `--ink-600` hover, `--ink-500` pressed.*

### Accept variant

| State | Background | Foreground | Shadow |
|-------|------------|------------|--------|
| default | `--status-success` | `--content-on-signal` | green 25% |
| hover | `--status-success` darkened | `--content-on-signal` | green 35% |
| pressed | `--status-success` deep | `--content-on-signal` | none + translateY(1px) |
| disabled | `--status-success` tint | `--status-success` @ 0.50 | none @ 0.65 |
| focus | `--status-success` | `--content-on-signal` | ring 3px green 30% |

### Destructive variant

| State | Background | Foreground | Shadow |
|-------|------------|------------|--------|
| default | `--status-error` | `--content-on-signal` | red 25% |
| hover | `--status-error` darkened | `--content-on-signal` | red 35% |
| pressed | `--status-error` deep | `--content-on-signal` | none + translateY(1px) |
| disabled | `--status-error` tint | `--status-error` @ 0.50 | none @ 0.65 |
| focus | `--status-error` | `--content-on-signal` | ring 3px red 30% |

### Outline variant

| State | Background | Foreground | Border |
|-------|------------|------------|--------|
| default | transparent | `--content-primary` | `--border-default` 1.5px |
| hover | `--surface-inset` | `--content-primary` | `--border-strong` 1.5px |
| pressed | `--paper-300` | `--content-primary` | `--border-strong` 1.5px + translateY(1px) |
| disabled | transparent | `--content-subtle` | `--border-subtle` 1.5px @ 0.55 |
| focus | transparent | `--content-primary` | `--border-focus` 1.5px + ring 3px copper 20% |

---

## Full Variant × State Matrix

|  | default | hover | pressed | disabled | focus |
|--|---------|-------|---------|----------|-------|
| **primary** | copper-500 fill | copper-400 fill | copper-700 fill + Y+1px | paper-300 fill / 0.65 | copper-500 + 3px ring |
| **secondary** | inset fill + border | paper-300 fill | paper-400 fill + Y+1px | inset / 0.55 | inset + copper border + ring |
| **ghost** | transparent | inset fill | paper-300 + Y+1px | transparent / 0.55 | transparent + ring |
| **accept** | success fill | success dark | success deep + Y+1px | success tint / 0.65 | success + 3px ring |
| **destructive** | error fill | error dark | error deep + Y+1px | error tint / 0.65 | error + 3px ring |
| **outline** | transparent + 1.5px border | inset fill | paper-300 + Y+1px | transparent / 0.55 | copper border + ring |

---

## Size Variants

The spec defines one structural height for all button contexts. Sub-size and special variants:

| Variant / Context | Height | H-Padding | Radius | Font | Icon |
|-------------------|--------|-----------|--------|------|------|
| Standard (all 6 variants) | `--size-control-lg` (44px) | `--space-4` (16px) | `--radius-md` (10px) | 14px/600 | `--icon-sm` (16px) |
| Icon-only (any variant) | `--size-control-lg` (44px) | 0 | `--radius-md` or `--radius-pill` | — | `--icon-sm` (16px) |
| Pill-chip (NEW chip, TopBar) | 32px (pill.md) | `--space-4` (12px) | `--radius-pill` (999px) | 12px/600 | 14px |
| Chat send (special) | 42px | 0 | `--radius-pill` (50%) | — | 18px |

---

## Icon Placement

| Placement | Layout |
|-----------|--------|
| Leading icon | `<span class="btn-icon">` before `<span class="btn-label">`, gap `--space-3` |
| Trailing icon | `<span class="btn-label">` before `<span class="btn-icon">`, gap `--space-3` |
| Icon-only | Single `<span class="btn-icon">`, width = height = `--size-touch-min`, no label |

---

## Loading State

- Label opacity collapses to 0 (layout unchanged, no width shift)
- 16px border-based spinner in foreground color appears absolutely positioned
- Spinner: 2px border ring, top quarter colored, 700ms linear infinite rotation
- Light-on-dark variants use white spinner ring; surface-fill variants use `--content-primary` ring

---

## Motion

| Transition | Duration | Easing |
|-----------|----------|--------|
| background, box-shadow, border-color, opacity | `--duration-fast` (120ms) | `--ease-standard` |
| translateY (pressed) | `--duration-fast` (120ms) | `--ease-standard` |
| Spinner rotation | 700ms | linear infinite |

---

## Accessibility

- All states meet 44×44px minimum touch target (iOS) and 48×48dp (Android)
- Disabled: `pointer-events: none`, opacity 0.55–0.65, remains in layout (not hidden)
- Focus ring: 3px solid ring in variant primary color at 20–35% opacity, visible on both themes
- Loading: button width unchanged, label hidden (opacity 0, not display:none)
