# route-results-screen (UC-SCR-03 — LaneShadow V2 Copper)

## Purpose

RouteResultsScreen is the Navigator's recommendation surface. It presents three route polylines drawn on the live map — best (copper, solid 3.5px), alt1 (sage, dashed), alt2 (slate, dashed) — alongside a pinned NavigatorMessage that states the reasoning in Newsreader prose and attaches three compact route cards. The rider can accept a card (→ UC-SCR-04 RouteDetails), swap selection, refine via chat (→ UC-SCR-02 PlanningScreen), or discard entirely. The chat input stays present and switches its placeholder to a refine prompt, closing the planning loop.

## Variants

| ID | Name | Theme | Key behaviour |
|---|---|---|---|
| S01 | Default · Best Pre-selected | Light | Three polylines, message pinned, first card selected with copper stripe + Best badge |
| S02 | Alt1 Tapped · Sage Promoted | Light | Alt1 card selected; sage polyline solid-bold, copper route ghosted; compass chip re-tints to sage |
| S03 | Default · Dark | Dark | Ink live map; best route gets copper outer glow; all glass/chrome/card surfaces re-resolve on dark tokens |
| S04 | Refining | Light | Chat field active; warm scrim over map; routes dim to 40%; Navigator message auto-dismisses; three refine primers appear above input; send button live |
| V01 | Two Candidates | Light | Only two polylines + two cards; Navigator explains the missing third; chat primes constraint relaxation |
| V02 | Weather Divergent | Light | Three routes with per-card weather badges (clear/clear/rain); storm hatching on affected map quadrant; Navigator names time and direction of front |
| V03 | Message Dismissed | Light | Navigator message closed; three polylines remain; "Recall" chrome chip parks in message position; chat primes tap-to-pick |

## Composes

| Class | Source | Role in this view |
|---|---|---|
| `org-map-layer` | organisms/map-layer | Full-screen map canvas; provides `__top-bar`, `__top-overlay`, `__bottom-overlay` slots |
| `org-topbar` / `org-topbar__chip` | organisms/topbar | Hamburger + NEW chrome chips in top-bar slot |
| `org-navigator-callouts` (NavMessage variant) | organisms/navigator-callouts | Pinned glass panel with compass chip, "THE NAVIGATOR" label, opinion prose, pin + dismiss actions |
| `mol-route-attachment-card` | molecules/route-attachment-card | Compact route card: 3px leading stripe, Best badge, title, via, metrics row, scenic dots, wx badge |
| `mol-chat-input` | molecules/chat-input | Bottom-anchored glass input with placeholder swap; refine primer row above in S04 |
| `ls-badge-best` | atoms/badge | Copper-filled "★ Best" badge on first card |
| `ls-btn--chat-send` | atoms/button | Copper circular send button (S04 only) |

## Token recipe

| Property | Token |
|---|---|
| Best route polyline stroke | `var(--route-best)` |
| Alt1 route polyline stroke | `var(--route-alt1)` |
| Alt2 route polyline stroke | `var(--route-alt2)` |
| Navigator message top border | `var(--signal-default)` (2px) |
| Navigator message border | `var(--signal-tint)` (1px) |
| Navigator message glass | `var(--surface-glass)` + `backdrop-filter` |
| Best card selected tint | `color-mix(in srgb, var(--surface-card) 92%, var(--signal-default))` |
| Alt1 card selected tint | `color-mix(in srgb, var(--surface-card) 92%, var(--route-alt1))` |
| Best badge fill | `var(--signal-default)` |
| Recall chip + refine primer glass | `var(--surface-glass)` |
| Warm refine scrim | `rgba(34, 24, 16, 0.18)` (raw — no semantic token covers mid-weight warm veil) |
| Weather badge clear | `var(--wx-clear)` / `var(--wx-clear-tint)` |
| Weather badge wind | `var(--wx-wind)` / `var(--wx-wind-tint)` |
| Weather badge rain | `var(--wx-rain)` / `var(--wx-rain-tint)` |
| Phone border | `var(--stroke-sm) solid var(--border-default)` |
| Phone corners | `var(--radius-xl)` |

## Responsive

| Breakpoint | Behaviour |
|---|---|
| `> 900px` | Full `--space-11` / `--space-9` section padding; phone capped at 390px |
| `≤ 900px` | Section padding reduces to `--space-9` / `--space-6`; phone caps at `min(390px, 80vw)` |
| `≤ 375px` | Section padding collapses to `var(--space-4)`; phone goes full-width with `--radius-lg` corners; caption text-aligns centre |

## Accessibility

- Each phone frame has `role="img"` with descriptive `aria-label` per variant.
- Navigator message panel has `role="region"` with `aria-label`.
- Route cards have `role="button"` + `aria-pressed` to communicate selection state.
- Weather badges on alt2 in V02 include time context in the label (`☂ Rain 2pm`).
- Recall chip has `role="button"` + `aria-label`.
- Cursor blink element in S04 is `aria-hidden="true"`.
- Scenic-dots spans include `aria-label` with numeric rating (e.g., "Scenic rating: 5 out of 5").

## View-local constants

| Name | Value | Reason |
|---|---|---|
| `--route-best` stroke-width | `3.5px` | Literal SVG attribute; tokens have no stroke-width scale |
| `--route-alt1/alt2` stroke-width | `2.5px` | Same — SVG attribute |
| `--route-alt1/alt2` stroke-dasharray | `6 4` / `3 4` | SVG attribute; defines dash rhythm, not a system token |
| `.view-route-results-screen__rt-start` width/height | `14px` | Fixed marker diameter; not a spacing unit |
| `.view-route-results-screen__rt-end` width/height | `18px` | Fixed marker outer diameter |
| `.view-route-results-screen__rt-end::after` width/height | `6px` | Fixed inner dot diameter |
| `.view-route-results-screen__compass-chip` width/height | `26px` | Spec-prescribed 26pt circular target |
| Refine scrim background | `rgba(34, 24, 16, 0.18)` | No semantic token covers this warm mid-weight veil; TOKEN_GAP: --surface-refine-scrim := rgba(34,24,16,0.18) (mid-weight warm overlay for chat-active state) |
| Phone `aspect-ratio` | `9 / 19.5` | Device form-factor literal |
| Dynamic island width/height | `112px / 30px` | Device chrome literal |
| Home bar width | `120px` | Device chrome literal |
| `@media` breakpoint widths | `900px` / `375px` | Responsive layout boundaries |
