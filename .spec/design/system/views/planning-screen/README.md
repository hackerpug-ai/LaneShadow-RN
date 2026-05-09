# planning-screen (UC-SCR-02 — LaneShadow V2 Copper)

## Purpose

PlanningScreen is the inside of the Navigator's head — shown immediately after the rider sends a prompt and while the system is thinking. The canvas is a full-screen warm paper topographic map with a copper sketching polyline that draws and loops continuously (representing the Navigator's pen moving across the paper). The top overlay is a composed stack: `mol-context-capsule --planning` sits above the five-step `mol-phase-indicator`, so the capsule carries the italic phase line + copper pulse while the indicator exposes explicit pipeline progress. The chat input is locked at the bottom: the rider's filled prompt is visible but typing is disabled; the send button is replaced by a copper spinner. The only exit is back (triggering a cancel-confirm sheet). Transitioning to RouteResultsScreen (UC-SCR-03) or ErrorScreen (UC-SCR-06) happens when the planning pipeline completes.

---

## Variants

| Variant ID | Description | Theme |
|------------|-------------|-------|
| S01 · Scouting · Light | Phase 1 active (pulsing ring); stub sketch on map near start pin; phases 2–5 pending; chat locked with spinner | Light |
| S02 · Drawing · Light | Phase 1 done (check); phase 2 active; sketch extends further across map; title shifts to context-aware copy | Light |
| S03 · Weather · Light | Phases 1–2 done; phase 3 active; weather condition icons (clear + wind) float over dimmed sketch; title shifts | Light |
| S04 · Scoring · Dark | Phases 1–3 done; phase 4 active; three candidate polylines visible (best/alt1/alt2); dark theme | Dark |
| V01 · Slow Planning | Phase 2 active, &gt;4s stall; inline apology copy appears below steps in the phase indicator while the planning capsule remains visible above | Light |
| V02 · Cancel Prompt | Back gesture during thinking; phase card dims to 38%; scrim rises; cancel-confirm sheet presents | Light |
| V03 · Single Candidate | All 4 phases done; phase 5 active with warning-copper accent; over-constraint advisory block | Light |

---

## Composes

| Layer | Class | Role in View |
|-------|-------|--------------|
| organism | `org-map-layer` | Foundational canvas — z-order / slot contract (map / topBar / topOverlay / bottomOverlay) |
| organism | `org-map-layer__map` | Map slot — paper background + contour SVG + start pin dot |
| organism | `org-map-layer__top-bar` | TopBar slot — absolute z:5 across full width |
| organism | `org-map-layer__top-overlay` | Planning overlay stack slot — `mol-context-capsule --planning` above `mol-phase-indicator` |
| organism | `org-map-layer__bottom-overlay` | ChatInput anchor slot — locked/thinking state |
| organism | `org-topbar` | LSTopBar — hamburger chip + NEW chip (same as idle-screen) |
| organism | `org-topbar__chip` | Individual glass chips |
| organism | `org-topbar__chip--square` | Hamburger (40×40pt) |
| organism | `org-topbar__chip--with-label` | NEW pill (label + icon) |
| molecule | `mol-context-capsule mol-context-capsule--planning` | Primary top-overlay capsule — single italic phase line + copper pulse spinner |
| molecule | `mol-context-capsule__headline` | Capsule planning copy in Newsreader italic |
| molecule | `mol-context-capsule__spinner` | Copper pulse spinner paired to the planning phase line |
| molecule | `mol-phase-indicator` | LSPhaseIndicator — compass chip + italic title band + 5 labeled steps |
| molecule | `mol-phase-indicator__head` | Header row: compass chip + italic opinion header |
| molecule | `mol-phase-indicator__compass-chip` | Copper-tinted circular compass icon chip |
| molecule | `mol-phase-indicator__header` | Italic Newsreader title ("Let me think on that…" or context copy) |
| molecule | `mol-phase-indicator__steps` | Ordered list of 5 planning steps |
| molecule | `mol-phase-indicator__step` | Single step row (dot + label) |
| molecule | `mol-phase-indicator__step-label` | Step text; `state-active` / `state-done` modifier classes |
| atom | `ls-phase-dot` | Phase dot atom; `.active` pulses, `.done` shows check, `.pending` is hollow |
| molecule | `mol-chat-input` | LSChatInput — thinking state |
| molecule | `mol-chat-input__bar` | Input bar; `is-thinking` class disables controls and shows spinner |
| molecule | `mol-chat-input__leading-btn` | Leading ghost button (dimmed via `is-thinking` modifier) |
| molecule | `mol-chat-input__field` | Filled prompt text; `has-value` class applied |
| molecule | `mol-chat-input__spinner` | Copper spinner in trailing slot (shown by `is-thinking` on `__bar`) |
| atom | `ls-spinner` | Copper ring spinner atom composed inside `mol-chat-input__spinner` |
| typography | `.t-opinion-sm` | Phase indicator header (italic Newsreader) |
| typography | `.t-instr-sm` | Phase step labels (JetBrains Mono) |
| typography | `.t-label-md` | TopBar "NEW" chip label |
| typography | `.t-body-lg` | Chat input filled prompt text |

---

## Token recipe

| Property | Token | Notes |
|----------|-------|-------|
| Phase indicator surface | `var(--surface-card)` | Glass-adjacent; solid card for legibility over map |
| Phase indicator border | `var(--signal-tint)` sides / `var(--signal-default)` top | Copper accent-top convention |
| Phase indicator shadow | `var(--elev-overlay)` | Elevated over map |
| Phase indicator border-radius | `var(--radius-xl)` | 16pt pill-ish corners |
| Active phase dot color | `var(--signal-default)` | Copper ring pulse |
| Done phase dot color | `var(--status-success)` | Green check |
| Pending phase dot border | `var(--border-strong)` | Muted ring |
| Chat bar glass surface | `var(--surface-glass)` | Frosted bottom input |
| Chat bar border | `var(--border-glass)` | Translucent glass edge |
| Chat bar radius | `var(--radius-2xl)` | 18pt per chat-input spec |
| Spinner arc color | `var(--signal-default)` | Copper spinner arc |
| Spinner track color | `var(--border-default)` | Muted track ring |
| Sketch polyline stroke | `var(--route-best)` | Copper orange (same as `--signal-default`) |
| Route best / alt1 / alt2 | `var(--route-best)` / `var(--route-alt1)` / `var(--route-alt2)` | Scoring variant (S04) |
| Map paper | `var(--map-paper)` | Warm paper substrate |
| Map contour | `var(--map-contour)` / `var(--map-contour-faint)` | Topographic lines |
| Phase label active | `var(--content-primary)` | |
| Phase label done | `var(--content-secondary)` | Line-through |
| Phase label pending | `var(--content-tertiary)` | Muted |
| Sketch animation duration | `1400ms` (view-local constant — TOKEN_GAP emitted) | No `--duration-sketch-loop` token exists |
| Planning capsule spinner loop | `1400ms` | Matches the sketch loop cadence so the capsule pulse breathes with the map animation |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| > 375px (default) | Outer section padding `var(--space-9)` (40pt); phone frame `max-width: 390px`, `aspect-ratio: 9 / 19.5` |
| ≤ 375px | Outer padding collapses to `var(--space-4)` (12pt); phone frame spans section inner width, `border-radius: var(--radius-lg)` |

---

## Accessibility

- Phase indicator: `role="status"` + `aria-live="polite"` so screen readers announce step changes without interrupting.
- Active step: `aria-current="step"` on the active `__step-label`.
- Chat input bar: `aria-disabled="true"` + `aria-label="Navigator is thinking — input locked"` when `is-thinking`.
- Cancel confirm sheet (V02): `role="alertdialog"` + `aria-modal="true"`.
- Sketch polyline SVG: `aria-hidden="true"` (decorative animation).
- TopBar buttons retain `aria-label` per idle-screen convention.

---

## View-local constants

| Constant | Value | Reason |
|----------|-------|--------|
| Sketch animation duration | `1400ms` | `tokens.css` contains no `--duration-sketch-loop` token; used directly in `@keyframes view-planning-screen__sketch` |
| Head-dot breathe duration | `1400ms` | Same loop — leading dot breathe matches sketch loop |
| Sketch SVG `stroke-width` | `2.5` | SVG attribute (not padding/margin/gap) — exempted per spec |
| Map SVG `stroke-width` | `0.9` / `0.7` | SVG attribute — exempted |
| Map start pin `width` / `height` | `11px` | SVG-adjacent geometry (absolute-positioned pin dot) — exempted per spec's phone-chrome geometry allowance |
| Cancel sheet border-radius | `var(--radius-xl)` | Uses token |
| `stroke-dasharray` values | `5 8` / `8 12` | SVG dash-gap geometry (not padding/margin/gap) |
