# error-screen (UC-SCR-06 — LaneShadow V2 Copper)

## Purpose

ErrorScreen is the Navigator's humility surface. When the planner cannot produce a route that meets the rider's constraints — a segment was broken, an endpoint was unreachable, a network call timed out, a safety rule tripped — the screen does not blank out or modal-slam. It drops an inline callout where the Navigator message would normally sit, explains what went wrong in plain Newsreader-serif prose, and offers two suggestion chips the rider can tap to try an adjusted version of the same ask.

The distinction between this screen and an error toast is structural: toasts auto-dismiss; this callout stays. It uses the same LSGlassPanel callout chassis as UC-SCR-03's NavigatorMessage — same compass chip, same label row, same opinion-serif body — but swaps the top-stripe from signal-copper to `var(--status-warning)`, and tints the compass chip to match. Visual continuity is intentional: the Navigator is still speaking, just honestly.

The chat input remains fully active and primed with a recovery placeholder. The rider always has three doors out: (1) tap a suggestion chip, (2) rewrite the prompt in the input, or (3) tap the map to dismiss the callout and pan back to Idle.

---

## Variants

| Variant ID | Description | Theme |
|------------|-------------|-------|
| S01 · Default · Light | Broken-segment error; warn-stripe callout with compass + label + opinion-serif body + muted detail + two primary chips + tertiary "Rewrite the ask"; map shows attempted polyline with red broken-mark at failed gap | Light |
| S02 · Default · Dark | Dark-mode safety-gate error; top stripe and compass adopt `var(--wx-storm)` purple instead of warning-copper; suggestions shift to temporal recoveries ("midnight", "tomorrow") | Dark |
| S03 · Extended · Light | Impossible constraint; longer detail copy showing Navigator's reasoning across three attempts; three primary suggestion chips (constraint relaxations) + tertiary rewrite | Light |
| S04 · Recovered · Light | Suggestion chip tapped; callout fades to 55%; chat input field primed with adjusted prompt; trailing slot swaps to copper send button | Light |
| V01 · Offline | Network timeout; watermark wifi-off glyph; suggestions include retry CTA + two cached recent rides; chat input dims to `opacity: 0.7` | Light |
| V02 · Generic Failure | No recoverable suggestions available; callout body admits uncertainty plainly; no chip row rendered; chat input is the only recovery path | Light |

---

## Composes

| Layer | Class | Role in View |
|-------|-------|--------------|
| organism | `org-map-layer` | Foundational canvas — z-order / slot contract (map / topBar / topOverlay / bottomOverlay) |
| organism | `org-map-layer__top-bar` | TopBar slot — absolute z:5 across full width |
| organism | `org-map-layer__top-overlay` | Error callout slot — LSInlineErrorCallout anchored below topbar |
| organism | `org-map-layer__bottom-overlay` | ChatInput anchor slot — positioned at bottom of canvas |
| organism | `org-topbar` | LSTopBar — hamburger chip + NEW chip |
| organism | `org-topbar__chip` | Individual glass chips (circular hamburger, pill NEW) |
| organism | `org-topbar__chip--square` | Hamburger (40×40pt) |
| organism | `org-topbar__chip--with-label` | NEW pill (label + icon) |
| molecule | `mol-chat-input` | LSChatInput — bottom-anchored conversational stack |
| molecule | `mol-chat-input__bar` | Input bar (glass, 54pt height); `is-active` for send state (S04) |
| molecule | `mol-chat-input__leading-btn` | Leading ghost button (bicycle icon) |
| molecule | `mol-chat-input__field` | Placeholder / value text; `has-value` when filled (S04) |
| molecule | `mol-chat-input__filter-btn` | Trailing sliders ghost button (hidden when `is-active`) |
| atom | `ls-btn--chat-send` | Copper-filled send button (visible in S04 recovered state) |
| typography | `.t-label-sm` | "THE NAVIGATOR" callout label; suggestion chip text |
| typography | `.t-opinion-md` | Callout body (error explanation in Newsreader serif) |
| typography | `.t-body-sm` | Callout detail text (muted sans); caption body in preview |
| typography | `.t-body-lg` | Chat input field text |
| typography | `.t-instr-sm` | Story ID labels; broken-mark "!" character; status bar time |

---

## Token Recipe

View-level properties applied via `.view-error-screen*` selectors only:

| Property | Token | Notes |
|----------|-------|-------|
| Phone frame background | `var(--surface-primary)` | Matches map paper in light; ink-800 in dark |
| Phone frame border | `var(--border-default)` | 1px via `var(--stroke-sm)` |
| Phone frame corner radius | `var(--radius-xl)` | Consistent with all other views |
| Callout top stripe (default) | `var(--status-warning)` | 2px via `var(--stroke-md)` — warn-copper |
| Callout top stripe (storm gate) | `var(--wx-storm)` | Safety-gate S02 variant only |
| Callout border tint (default) | `color-mix(in srgb, var(--status-warning) 24%, transparent)` | Subtle perimeter echo of stripe |
| Compass chip background (default) | `color-mix(in srgb, var(--status-warning) 14%, var(--surface-card))` | Warm tint |
| Compass chip color (default) | `var(--status-warning)` | Warning amber |
| Compass chip background (storm) | `color-mix(in srgb, var(--wx-storm) 14%, var(--surface-card))` | Storm-purple tint |
| Compass chip color (storm) | `var(--wx-storm)` | Storm purple |
| Callout label color (default) | `var(--status-warning)` | "THE NAVIGATOR" uppercase label |
| Callout label color (storm) | `var(--wx-storm)` | Storm variant |
| Callout body color | `var(--content-primary)` | Opinion-serif headline text |
| Callout detail color | `var(--content-secondary)` | Muted sans detail text |
| Primary suggestion chip background | `color-mix(in srgb, var(--status-warning) 12%, var(--surface-card))` | Warm whisper |
| Primary suggestion chip border | `color-mix(in srgb, var(--status-warning) 40%, transparent)` | Subtle amber ring |
| Primary suggestion chip color | `var(--status-warning)` | Amber text |
| Storm suggestion chip background | `color-mix(in srgb, var(--wx-storm) 12%, var(--surface-card))` | Storm whisper |
| Storm suggestion chip color | `var(--wx-storm)` | Storm purple text |
| Tertiary suggestion chip background | `var(--surface-card)` | Plain glass |
| Tertiary suggestion chip color | `var(--content-primary)` | Neutral text |
| Sugg-row divider | `color-mix(in srgb, var(--status-warning) 22%, transparent)` | Dashed separator |
| Broken polyline stroke | `var(--status-error)` | SVG geometry |
| Broken mark ring | `var(--status-error)` | Circle outline at gap point |
| Offline glyph color | `var(--status-warning)` | Watermark at 0.25 opacity |
| Fading callout (S04) | `opacity: 0.55` | Transition-to-planning state |
| Offline chat dim (V01) | `opacity: 0.7` | Conveys unavailability |
| Map contour strokes | `var(--map-contour)` / `var(--map-contour-faint)` | Decorative SVG strokes |
| Home indicator bar | `rgba(0, 0, 0, 0.38)` light / `rgba(255, 255, 255, 0.30)` dark | Device chrome simulation — unavoidable raw value |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Default (≥ 900px) | Phone frame centered with `var(--space-9)` (40px) horizontal padding; sections have generous vertical padding `var(--space-11)` |
| Tablet (< 900px) | Phone frame max-width scales to `min(390px, 80vw)`; section padding reduces to `var(--space-6)` |
| Mobile (≤ 375px) | Section padding collapses to `var(--space-4)`; phone frame spans full section inner width; border-radius reduces to `var(--radius-lg)`; caption header stacks vertically |

---

## Accessibility

| Element | Role / Landmark |
|---------|----------------|
| `<main>` | `role="main"` — wraps all story sections |
| Story section | `<section>` with `aria-label="S01 Broken Segment Light"` etc. |
| Phone frame | `role="img"` `aria-label="ErrorScreen phone preview — [variant]"` |
| TopBar hamburger | `aria-label="Open sessions"` |
| TopBar NEW chip | `aria-label="Start new session"` |
| Error callout | `role="status"` `aria-label="Navigator error callout"` |
| Callout body | `<p>` inside callout — Newsreader opinion type |
| Suggestion chips | `role="button"` `aria-label="Suggestion: [label]"` inside `role="list"` |
| Chat input bar | `role="textbox"` `aria-placeholder="Try again, or let me know what to change…"` |
| Offline chat bar | `aria-disabled="true"` with disabled buttons |
| Send button (S04) | `aria-label="Send revised ride request"` |
| Compass chips | `aria-hidden="true"` — decorative icon |
| Focus order | TopBar chips → Error callout (read by screen reader) → Suggestion chips → Chat input bar |

---

## View-Local Constants

| Property | Value | Reason |
|----------|-------|--------|
| Phone frame `aspect-ratio` | `9 / 19.5` | Canonical iPhone preview proportions — not a spacing token |
| Phone frame `max-width` | `390px` | Canonical iPhone viewport width — not a spacing token |
| `backdrop-filter: blur(16px)` on callout glass | `16px` | Visual-effect blur radius — not a spacing token; consistent with navigator-callouts organism |
| `backdrop-filter: blur(8px)` on TopBar chips | `8px` | Lighter organism-level blur; matches `org-topbar` spec |
| Home indicator color (light) | `rgba(0, 0, 0, 0.38)` | Device chrome simulation — no semantic equivalent |
| Home indicator color (dark) | `rgba(255, 255, 255, 0.30)` | Device chrome simulation — same rationale |
| SVG `stroke-width` values | `0.7` / `0.9` / `2` / `2.5` on map/route SVG | SVG geometry — not CSS spacing tokens |
| Fading callout opacity | `0.55` | Transition-state visual — not a semantic token |
| Offline chat opacity | `0.7` | Dim-unavailable pattern — not a semantic token |
| `@media (max-width: 375px)` / `@media (max-width: 900px)` | Pixel literals in `@media` | Structural breakpoint constraints — allowed per spec |
