# org-map-layer — LSMapLayer

**Authority:** [`uc-org-02-maplayer.html`](../../../../prds/v2/concepts/uc-org-02-maplayer.html) · [`07-uc-org.md §UC-ORG-02`](../../../../prds/v2/07-uc-org.md)

The foundational canvas organism used on every Navigator screen. LSMapLayer takes an `LSMap` atom and a set of named slots, then owns all z-order stacking, safe-area padding, and overlay positioning so screens never re-implement layout geometry.

## Purpose

One layout contract, seven slots, zero per-screen positioning logic. If one screen miscalculates a z-index, all screens suffer. With one organism, a single fix propagates everywhere.

## Slot API

```
LSMapLayer(
  map:            LSMap                 // required — base canvas, z-0
  scrim:          ScrimSpec?            // optional, z-1
  topOverlays:    [GlassOverlaySlot]    // z-2, top-aligned
  bottomOverlays: [GlassOverlaySlot]    // z-2, bottom-aligned
  bottomSheet:    BottomSheetSpec?      // z-3
  leadingDrawer:  DrawerSpec?           // z-4, left-anchored full-height
  topBar:         LSTopBar?             // z-5, always above
)
```

Each slot is optional. Screens pass only what they need; the organism sorts z-order correctly regardless.

## Z-order contract

| Level | Slot | Notes |
|---|---|---|
| 0 | `.org-map-layer__map` | Base layer. Full-bleed. Always rendered first. |
| 1 | `.org-map-layer__scrim` | Warm-black 0.35 opacity above map, below all overlays. |
| 2 | `.org-map-layer__top-overlay` / `.org-map-layer__bottom-overlay` | Same z-level. Safe-area padding positions them apart. |
| 3 | `.org-map-layer__bottom-sheet` | RouteSheet anchors to bottom, above overlays. |
| 4 | `.org-map-layer__leading-drawer` | SessionsDrawer covers scrim + overlays + sheet when open. |
| 5 | `.org-map-layer__top-bar` | LSTopBar always above everything. |

## Anatomy

```html
<div class="org-map-layer">
  <div class="org-map-layer__map">…LSMap atom content / SVG…</div>
  <div class="org-map-layer__scrim"></div>
  <div class="org-map-layer__top-overlay">   …LSNavigatorMessage…   </div>
  <div class="org-map-layer__bottom-overlay">…LSChatInput…          </div>
  <div class="org-map-layer__bottom-sheet">  …LSRouteSheet…         </div>
  <div class="org-map-layer__leading-drawer">…LSSessionsDrawer…     </div>
  <div class="org-map-layer__top-bar">       …LSTopBar…             </div>
</div>
```

## Stories

| # | Name | Slots populated |
|---|---|---|
| S.01 | Map only | map |
| S.02 | Map + TopBar | map + topBar |
| S.03 | Map + Top overlay | map + topBar + topOverlay (NavigatorMessage) |
| S.04 | Map + Bottom overlay | map + topBar + bottomOverlay (ChatInput) |
| S.05 | Map + Scrim + Drawer | map + scrim + leadingDrawer |
| S.06 | Map + Sheet | map + topBar + bottomSheet |
| S.07 | Full stack | every slot except drawer (drawer + sheet do not co-exist) |

Dark variants render the same slot set with `--surface-map`, `--surface-scrim`, and overlay tokens re-resolving.

## Composes

| Tier | Consumer | Role |
|---|---|---|
| Atom | `LSMap` | z-0 base canvas |
| Atom | `LSScrim` | z-1 dismiss overlay |
| Organism (slot) | `LSTopBar` (UC-ORG-01) | z-5 chrome |
| Organism (slot) | `LSNavigatorMessage` (UC-ORG-03) | z-2 top overlay |
| Organism (slot) | `LSRouteSheet` (UC-ORG-04) | z-3 bottom sheet |
| Organism (slot) | `LSSessionsDrawer` (UC-ORG-05) | z-4 leading drawer |
| Molecule (slot) | `LSChatInput` (UC-MOL-06) | z-2 bottom overlay |

LSMapLayer composes organisms inside organisms — which is allowed at this foundational tier because each inner organism stays independently testable while MapLayer's sole concern is the slot geometry.

## Atoms / molecules used directly

The organism itself consumes only `LSMap` + `LSScrim`. Everything else is slot content passed in by the caller. The preview file uses *mini* stand-ins (prefixed `.ml-demo-*`) to illustrate what each slot looks like; those are preview-local and NOT part of the organism API.

## Token recipe

| Property | Token |
|---|---|
| container `background` | `var(--surface-map)` |
| container `border` | `var(--stroke-sm) solid var(--border-default)` |
| container `border-radius` | `var(--radius-xl)` (preview only — full-bleed on device) |
| container `box-shadow` | `var(--elev-card)` (preview only) |
| map contour grid | `var(--map-contour-faint)`, spacing `var(--space-8)` |
| scrim `background` | `var(--surface-scrim)` |
| top-overlay `top` | `var(--space-10)` — 48pt below top-bar |
| top-overlay `left` / `right` | `var(--space-4)` — 12pt |
| bottom-overlay `bottom` | `var(--space-5)` — 16pt above bottom safe area |
| bottom-overlay `left` / `right` | `var(--space-4)` |
| drawer `width` | `82%` (content-adaptive; canonical 312pt at 390pt viewport) |

## Motion references

| Trigger | Recipe | Effect |
|---|---|---|
| `leadingDrawer` populated | `sidebarSlideIn` | Drawer translates from `x:-100%` to `x:0`; scrim fades in simultaneously |
| `topOverlay` populated | `chatOverlayEnter` | NavigatorMessage slides down + fades in |
| Tap outside drawer/overlay | `mapTapDismiss` | Drawer slides out, scrim fades, overlays dismiss |

Motion recipes are defined in the tokens/motion layer. LSMapLayer references them by name; the organism CSS does not carry animation definitions.

## Accessibility

- `isolation: isolate` creates a clean stacking context; child slots cannot escape the layer.
- Tap-through behavior: scrim and overlay slots use `pointer-events: none` unless explicitly interactive; topBar, sheet, drawer are tappable.
- Screen readers should announce the topmost populated layer first (drawer > sheet > overlays > topBar > map) — native implementations handle this via accessibility-layer ordering; this preview does not pin focus.
- The `leadingDrawer` slot should trap keyboard focus when open and return it to the invoking control on dismiss.

## Organism-local constants

| Property | Value | Reason |
|---|---|---|
| `z-index: 0..5` on slot classes | 0/1/2/3/4/5 | Structural z-order contract — the purpose of this organism. Not tokenizable. |
| `isolation: isolate` | — | Creates the stacking context so child z-indices are scoped. Not a token. |
| `aspect-ratio: 9 / 17` | — | Preview-only phone-ish proportions. Not tokenizable; adapts to full-screen at runtime. |
| `82%` drawer width | — | Content-adaptive percentage. Spec canonical is `312pt`, which at the 390pt iPhone viewport equals ~80%. Left as a percentage so the drawer scales with screen width at runtime. |
| Map contour grid `1px` lines | — | `linear-gradient(var(--map-contour-faint) 1px, transparent 1px)` — 1px is a structural SVG-style geometry literal allowed by the audit rules. |

Every color / spacing / radius / elevation resolves to a token.

## Dark-mode contrast notes

**`--signal-whisper` on dark surfaces:** The default light-theme `--signal-whisper` is `--copper-100` (`#FCE8D4`), which is unreadable behind `--content-primary` (`--ink-050`, `#F2EEE8`) in dark mode. The dark theme overrides `--signal-whisper` to `rgba(238, 124, 43, 0.12)` — a semi-transparent copper glow that stays visible on dark card surfaces while keeping light text readable.

Any component using `--signal-whisper` as a highlight/select background (drawer rows, pill selected states, tab active indicators) gets this fix for free via the token override. If a future component adds a custom highlight color instead of `--signal-whisper`, it must provide its own dark-mode override that maintains at least 4.5:1 contrast against `--content-primary`.

## How to preview

Open `organisms/map-layer/map-layer.html` in a browser — every story renders in both light and dark `theme-pane`s, self-contained.
