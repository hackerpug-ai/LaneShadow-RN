# org-map-controls

**Use Case**: Map-View Redesign 2026-05-06
**Tier**: Organism
**Production Reference**: `react-native/components/map/map-controls.tsx`

---

## Purpose

Right-side vertical workbar that lives in the `org-map-layer__top-overlay` slot, **vertically centered** along the right edge of the map canvas (NOT top-anchored under the topbar). Provides interactive map controls — zoom, recenter, layers, save route, and mode-toggle — in glass containers consistent with `org-topbar` chrome aesthetic.

This organism was missing from the design system; production has carried it as a custom React Native component. The redesign brings parity so visual reviews can evaluate the right-side workbar against a reference.

---

## Composes

| Layer | Class | Role |
|---|---|---|
| atom | tokens | Surface, glass blur, border, signal copper, stroke widths, icon sizes |
| (no molecules) | — | Workbar is structurally simple — direct token composition |

The chip aesthetic intentionally mirrors `org-topbar__chip` (40pt square, blur(8px), `var(--surface-overlay)` background, hairline border). The two organisms share visual language so the perimeter chrome reads as one system.

---

## Slots

| Slot | When shown | Glyph | Production handler |
|---|---|---|---|
| Zoom cluster (`+` / `−` divided pair) | Always (mode = map) | plus, minus | `onZoomIn`, `onZoomOut` |
| Recenter | Always (mode = map) | crosshairs-gps | `onRecenter` |
| Layers / Reset | Always (mode = map) | layers (stacked diamonds) | `onClear` (named "clear" in JS but functions as a layers/reset toggle) |
| Save route | Conditional — when route is selected | bookmark | `onSaveRoute` (only shown when `hasRouteToSave`) |
| Mode toggle | Always | message (in map mode) / map (in chat mode) | `onToggleView` |

The mode-toggle ALWAYS lives at the bottom of the workbar in both modes so it occupies a consistent right-side slot per production behavior (see `react-native/components/map/map-controls.tsx` lines 152-153).

---

## Geometry

| Property | Value |
|---|---|
| Stack direction | Vertical |
| Alignment | `flex-end` (right-aligned horizontally) + vertically centered (`top: 50%; transform: translateY(-50%)`) |
| Gap between chips | `var(--space-2)` (4pt) |
| Chip width / height | `var(--space-9)` × `var(--space-9)` (40 × 40pt) |
| Zoom cluster | 40pt wide × ~80pt tall (40pt per button + 1px divider) |
| Border radius | `var(--radius-md)` (6pt) |
| Z-index | 2 (within `org-map-layer__top-overlay`) |
| Position in views | `position: absolute; top: 50%; right: var(--space-4); transform: translateY(-50%);` (vertically centered along the right edge of the map canvas) |

The right-side `var(--space-4)` (12pt) margin matches the existing topbar gutter. The 40pt chip width plus 12pt margin yields a 52pt-wide right-side strip that does NOT collide with the centered Context Capsule (which is constrained to `max-width: 340px` within a 390pt frame).

**Vertical centering rationale.** The workbar is centered along the height of the map canvas (`top: 50%; transform: translateY(-50%)`) rather than anchored under the topbar. This keeps the chips equidistant from the topbar (top chrome) and the chat-input / bottom sheet (bottom chrome), reads as "map chrome" rather than "topbar accessory," matches the production React Native `MapControls` placement, and brings every chip into comfortable thumb-reach on a one-handed phone hold.

---

## Token Recipe

| Element | Token |
|---|---|
| Chip background | `var(--surface-overlay)` |
| Chip border | `var(--border-default)` |
| Chip shadow | `var(--elev-chrome)` |
| Chip blur | `blur(8px)` |
| Icon stroke | `currentColor` (resolves to `var(--content-primary)`) |
| Icon stroke-width | `var(--stroke-md)` (1.5px) |
| Icon size | `var(--icon-md)` (18px) |
| Saved chip background | `var(--signal-default)` (copper) |
| Saved chip color | `var(--content-on-signal)` |
| Internal cluster divider | `var(--border-default)` at `var(--stroke-sm)` |

---

## States

| State | Description |
|---|---|
| `--map` (default) | All chips visible (zoom + recenter + layers + optional save + mode toggle) |
| `--chat` | Workbar collapses to a single mode-toggle chip showing the map glyph |
| Chip `:hover` | Background flips to `var(--surface-card)` (preview only — production uses pressed-state via Pressable) |
| Save chip `--saved` | Background flips to `var(--signal-default)`; bookmark icon fills with `var(--content-on-signal)` |

---

## Z-Order Within `org-map-layer`

```
z-5  org-topbar
z-4  org-leading-drawer (sessions only)
z-3  bottom-sheet
z-2  mol-context-capsule (top-center, below topbar)
z-2  org-map-controls    (vertical-center, right edge) ← THIS
z-1  scrim
z-0  map (LSMap)
```

Top-anchored Context Capsule + vertically-centered Map Controls coexist at z:2 because they occupy non-overlapping regions of the canvas (capsule near the top below the topbar; controls along the right midline).

---

## Accessibility

| Element | aria-label |
|---|---|
| Zoom cluster wrapper | `role="group" aria-label="Zoom controls"` |
| Zoom in button | `Zoom in` |
| Zoom out button | `Zoom out` |
| Recenter | `Recenter map` |
| Layers | `Toggle layers` |
| Save | `Save route` / `Saved route` (when `--saved`) |
| Mode toggle (map mode) | `Open chat` |
| Mode toggle (chat mode) | `Back to map` |

All chips are reachable via tab order between `org-topbar` chips and the bottom overlays.

---

## Production Mapping

| Design slot | Production handler in `map-controls.tsx` | Behavior |
|---|---|---|
| Zoom in | `onZoomIn` | Mapbox camera zoom +1 |
| Zoom out | `onZoomOut` | Mapbox camera zoom −1 |
| Recenter | `onRecenter` | Camera ease to user location |
| Layers | `onClear` | Toggle layer set (production semantic, not literally "clear") |
| Save route | `onSaveRoute` (conditional on `hasRouteToSave`; accent on `isSavedRoute`) | Toggle saved-routes membership |
| Mode toggle | `onToggleView` | Switch between map and chat surfaces |

---

## Quality Gates

- Zero hex literals in CSS — all colors via tokens
- Chip dimensions identical to `org-topbar__chip` (40pt square) so the perimeter chrome reads as one system
- Backdrop blur scale identical (8px) to topbar chip
- Icon stroke-width identical to topbar (`var(--stroke-md)`) so visual weight matches
- Save chip uses brand signal copper (`var(--signal-default)`) — no custom save-state color
- Chat-mode variant collapses cleanly to a single chip — no orphan empty containers
- Vertical stack does not exceed the available height in the top-overlay region (max 240pt = 5 chips × 40pt + 4 × 4pt gaps + 80pt zoom cluster). At 320pt available below the topbar in idle-screen, comfortable headroom.
