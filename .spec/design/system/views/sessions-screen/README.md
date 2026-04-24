# sessions-screen (UC-SCR-05 — LaneShadow V2 Copper)

## Purpose

SessionsScreen is the conversation-history surface of LaneShadow V2. A left-anchored drawer slides over a scrimmed paper map, presenting all of a rider's ride sessions grouped by recency (Tonight, This Week, Last Week). The active session — the one whose context is loaded behind the drawer — carries a copper left-edge stripe and a tinted row background, making it instantly identifiable. Every other row is a single tap back to the full conversation that produced it: its route, Navigator message, and phase history. The screen is intentionally a drawer (never a bottom-modal or center-sheet) so the map behind it stays partially visible, keeping the rider spatially oriented while they pick.

The scrim uses `--surface-scrim` (rgba warm-black at 0.35 opacity in light, 0.50 in dark) — intentionally lighter than a full modal so the backdrop map remains legible. The drawer carries its own status-bar chrome and owns the full Rides header; there is no `org-topbar` in this screen.

---

## Variants

| Variant ID | Description | Theme |
|------------|-------------|-------|
| S01 · Default · Light | 5 sessions, Santa Cruz loop active with copper stripe; THIS WEEK section label; drawer at 82% width | Light |
| S02 · Default · Dark | Warm-ink drawer; TONIGHT group for active session (Coast after dark); THIS WEEK for 4 earlier rides; tokens re-resolve on dark substrate | Dark |
| S03 · Empty · Light | Zero sessions; dashed compass icon in copper-whisper circle; opinion-serif "No rides yet"; italic onboarding prose; primary "Plan a ride" CTA | Light |
| S04 · Scrolled · Light | List scrolled past THIS WEEK group; LAST WEEK sticky label in view; 6 sessions from Tunitas creek sprint through Calero dam climb | Light |
| S05 · New Confirm · Light | NEW tapped while active session exists; confirmation dialog centered over dimmed drawer; Cancel + Start new action row | Light |

---

## Composes

| Layer | Class | Role in View |
|-------|-------|--------------|
| organism | `org-map-layer` | Foundational canvas — z-order / slot contract (map / scrim / leadingDrawer) |
| organism | `org-map-layer__scrim` | Scrim slot — `--surface-scrim` background, `opacity: var(--opacity-focus)` delegated to the token value; z-index 12 |
| organism | `org-sessions-drawer` | LSSessionsDrawer — left-anchored drawer with own chrome; 82% viewport width (312pt at 390pt canonical) |
| atom | `ls-scrim` | LSScrim — warm-black translucent overlay behind drawer |
| typography | `.t-opinion-md` | Drawer title "Rides" |
| typography | `.t-title-sm` | Session row title |
| typography | `.t-body-sm` | Session preview italic excerpt; confirm dialog body |
| typography | `.t-label-sm` | Section labels (THIS WEEK, TONIGHT, LAST WEEK); route meta chips; NEW chip label |
| typography | `.t-instr-sm` | Status bar time; session timestamp; route distance/meta |
| typography | `.t-opinion-md` | Empty state headline; confirm dialog headline |

---

## Token Recipe

View-level properties applied via `.view-sessions-screen*` selectors only:

| Property | Token | Notes |
|----------|-------|-------|
| Phone frame background | `var(--surface-primary)` | Matches map paper in light; ink-800 in dark |
| Phone frame border | `var(--border-default)` | 1px via `var(--stroke-sm)` |
| Phone frame corner radius | `var(--radius-xl)` | Consistent with other screen views |
| Map backdrop | `var(--map-paper)` | Warm paper in light; overridden to `var(--ink-900)` in dark |
| Map contour strokes | `var(--map-contour-faint)` | Non-interactive backdrop — faint only |
| Scrim background | `var(--surface-scrim)` | Pre-baked rgba 0.35 warm-black in light; 0.50 in dark |
| Drawer background | `var(--surface-card)` | Slightly elevated from surface-primary |
| Drawer border-right | `var(--border-default)` | 1px separation from scrimmed map |
| Drawer shadow | `2px 0 16px rgba(34, 24, 16, 0.14)` | TOKEN_GAP: --elev-drawer not in tokens.css; value from concept |
| Drawer section padding | `var(--space-5)` horizontal, `var(--space-4)` vertical | All spacing via space scale |
| Active row stripe | `var(--signal-default)` | Left edge, 2px via `var(--stroke-lg)` |
| Active row background | `color-mix(in srgb, var(--surface-card) 94%, var(--signal-default))` | Copper tint without a separate token |
| Active meta chip color | `var(--signal-default)` | Route chip + "Active" label |
| Route variant dot — best | `var(--route-best)` | Copper / same as signal-default |
| Route variant dot — alt1 | `var(--route-alt1)` | Teal |
| Route variant dot — alt2 | `var(--route-alt2)` | Slate |
| NEW chip border/color | `var(--signal-default)` | Outline variant |
| Empty state icon ring | `var(--signal-whisper)` bg + `var(--signal-tint)` dashed border | Copper-whisper circle |
| Empty state CTA | `var(--action-primary)` bg + `var(--content-on-signal)` text | Primary button |
| Resume banner bg | `var(--signal-whisper)` | No-active-session variant (V02 in concept) |
| Confirm dialog bg | `var(--surface-card)` | Centered modal on confirm-backdrop scrim |
| Section label color | `var(--content-tertiary)` | ALL-CAPS uppercase via `.t-label-sm` |
| Session count color | `var(--content-tertiary)` | Trailing digit |
| Session title color | `var(--content-primary)` | `.t-title-sm` |
| Session preview color | `var(--content-secondary)` | Italic excerpt |
| Session timestamp color | `var(--content-tertiary)` | Monospace `.t-instr-sm` |
| Home indicator (light) | `rgba(0, 0, 0, 0.38)` | Standard iOS chrome |
| Home indicator (dark) | `rgba(255, 255, 255, 0.30)` | Standard iOS dark chrome |
| Section padding (desktop) | `var(--space-11)` top/bottom, `var(--space-9)` left/right | Story card outer chrome |
| Section padding (mobile ≤375px) | `var(--space-8)` top/bottom, `var(--space-4)` left/right | Collapsed per spec |

---

## Token Gaps

| Gap | Fallback Used | Reason |
|-----|---------------|--------|
| `--elev-drawer` | `2px 0 16px rgba(34, 24, 16, 0.14)` (light) / `2px 0 16px rgba(0, 0, 0, 0.60)` (dark) | Token referenced in concept CSS and org-sessions-drawer spec but not yet defined in tokens.css |

---

## Acceptance Criteria Cross-Reference

| AC from §UC-SCR-05 | Covered by Variant |
|--------------------|--------------------|
| Dimmed map behind `LSScrim` at 0.35 | S01–S05 all: `--surface-scrim` applied |
| `LSSessionsDrawer` sliding from left, "Rides" header + "NEW" + "THIS WEEK" + 5 rows; Santa Cruz loop active | S01 |
| Light/dark re-renders scrim, drawer chrome, active stripe, row bg | S01 (light) + S02 (dark) |
| Empty: no sessions, onboarding copy, Plan a ride CTA | S03 |
| Scroll: header + NEW + section label remain sticky; LAST WEEK group visible | S04 |
| NEW tapped with active session: confirm dialog | S05 |
