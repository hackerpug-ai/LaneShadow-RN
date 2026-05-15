# idle-screen (UC-SCR-01 — LaneShadow V2 Copper)

## Purpose

IdleScreen is the dormant-Navigator home — the first thing a rider sees when opening LaneShadow with no active session. The canvas is a full-screen warm paper topographic map. A single Newsreader-serif opinion headline floats above the map ("Where are we riding *today?*") alongside a contextual label row showing day, temperature, and conditions. A bottom-anchored chat input with four suggestion chips and a location context bar invites the rider to begin a conversation. No polyline is drawn; no Navigator message is pinned; the rider owns the cursor. Transitioning to PlanningScreen (UC-SCR-02) happens only when the rider taps a suggestion, types into the input, or opens the filter sheet.

---

## Variants

| Variant ID | Description | Theme |
|------------|-------------|-------|
| S01 · Default · Light | Dormant map with favorites pinned; four suggestion chips; "Manual" location mode; greeting headline with italic "today" | Light |
| S02 · Typing · Send | Text entered (suggestion primed, send button revealed); filter icon swaps to copper send button | Light |
| S03 · Default · Dark | All tokens re-resolve on warm-dark ink substrate; greeting rewrites to "tonight" (Greeting.scope) | Dark |
| S04 · Filter Sheet | Sliders icon opens LSBottomSheet at .medium detent over scrimmed map; filter chips for Duration + Avoid | Light |
| V01 · No Location | GPS denied, no manual pin; location bar replaced by copper-framed "Tap to set start"; chat input dimmed | Light |
| V02 · First Ride | No saved favorites; no pins on map; onboarding-grade suggestion chips; greeting acknowledges fresh state | Light |
| V03 · Weather Advisory | WeatherSummary.severity ≥ advisory; warning-accented meta row; inline advisory card; short/dry suggestion chips | Light |

---

## Composes

| Layer | Class | Role in View |
|-------|-------|--------------|
| organism | `org-map-layer` | Foundational canvas — z-order / slot contract (map / topBar / topOverlay / bottomOverlay / bottomSheet) |
| organism | `org-map-layer__map` | Map slot — paper background + contour SVG + favorite pin dots |
| organism | `org-map-layer__top-bar` | TopBar slot — absolute z:5 across full width |
| organism | `org-map-layer__top-overlay` | Greeting overlay slot — label row + opinion-serif headline |
| organism | `org-map-layer__bottom-overlay` | ChatInput anchor slot — positioned bottom of canvas |
| organism | `org-map-layer__bottom-sheet` | Filter sheet slot — presented on sliders tap |
| organism | `org-topbar` | LSTopBar — hamburger chip + NEW chip |
| organism | `org-topbar__chip` | Individual glass chips (hamburger + plus NEW), all square 40×40pt |
| organism | `org-topbar__chip--square` | Hamburger and NEW chips (40×40pt, plus / hamburger SVG only — no label) |
| molecule | `mol-chat-input` | LSChatInput — full bottom-anchored conversational stack |
| molecule | `mol-chat-input__location-bar` | Row holding location pill + mode label |
| molecule | `mol-chat-input__location-pill` | "Near Santa Cruz, CA" frosted glass pill |
| molecule | `mol-chat-input__pin-dot` | Copper dot inside location pill |
| molecule | `mol-chat-input__mode-label` | "MANUAL" / "AUTO" / "NEEDED" trailing pill |
| molecule | `mol-chat-input__sugg-row` | Scrollable suggestion chip row |
| molecule | `mol-chat-input__sugg-chip` | Individual suggestion chip (glass, becomes `.is-active`-equivalent when primed) |
| molecule | `mol-chat-input__bar` | Input bar (glass, 54pt height); adds `is-active` for send state |
| molecule | `mol-chat-input__leading-btn` | Leading ghost button (voice/bicycle icon) |
| molecule | `mol-chat-input__field` | Placeholder / value text; `has-value` when filled |
| molecule | `mol-chat-input__filter-btn` | Trailing sliders ghost button (hidden when `is-active`) |
| molecule | `mol-suggestion-chip` | LSSuggestionChip — tappable primer; `is-primed` for activated state |
| molecule | `mol-location-context-bar` | LSLocationContextBar — ambient location + mode row (V03 weather variant) |
| molecule | `mol-lcb__location-pill` | Location pill within LSLocationContextBar |
| molecule | `mol-lcb__live-dot` | Pulsing live dot inside location pill |
| molecule | `mol-lcb__label` | Location text label |
| molecule | `mol-lcb__mode-chip` | Mode chip (MANUAL / AUTO); `is-manual` for copper tint |
| molecule | `mol-bottom-sheet` | LSBottomSheet — filter variant in S04 |
| molecule | `mol-filter-chip` | LSFilterChip — selectable filters inside filter sheet |
| atom | `ls-glass-panel` | Greeting overlay surface (view-local inline variant) |
| atom | `ls-pill` | Base pill primitive (composed by suggestion-chip and tag-pill molecules) |
| atom | `ls-btn--chat-send` | Copper-filled send button (visible when `is-active`) |
| typography | `.t-label-md` | (Greeting meta row uses `.t-label-sm` inside the status card — see status-card token recipe below.) |
| typography | `.t-opinion-xl` | Greeting headline ("Where are we riding today?") |
| typography | `.t-body-lg` | Chat input field text |
| typography | `.t-body-sm` | Story caption text in preview |
| typography | `.t-label-sm` | Mode label ("MANUAL", "AUTO") |
| typography | `.t-instr-sm` | Story ID labels in preview header band |

---

## Status Card Content (required)

The header status-card (`.view-idle-screen__status-card .mol-context-capsule--idle`) renders **two stacked rows** in every variant. Both are required; an empty card is not a valid IdleScreen state.

| Row | Class | Content | Notes |
|-----|-------|---------|-------|
| Meta | `.mol-context-capsule__meta` (`.t-label-sm`) | `[Day · Temp · Conditions]` separated by `.mol-context-capsule__meta-dot` | Copper (`var(--signal-default)`) by default; warning tint via `--status-card--warning` modifier (V03) |
| Headline | `.mol-context-capsule__headline` (`.t-opinion-md`) | Newsreader italic emphasis word inside `<em>` | Italic word colored `var(--signal-default)`; full copy varies by variant (e.g. "today" / "tonight" / "starting" / "ask" / "prettiest") |

### Variant copy table

| Variant | Meta | Headline |
|---------|------|----------|
| S01 Default Light | Friday · 68°F · Clear | Where we riding *today?* |
| S02 Typing Send Light | Friday · 68°F · Clear | Where we riding *today?* |
| S03 Default Dark | Friday · 68°F · Clear | Where we riding *tonight?* |
| S04 Filter Sheet Light | Friday · 68°F · Clear | Refine the *ask* |
| V01 No Location | Friday · 68°F · Clear | Where are we *starting* from? |
| V02 First Ride | Friday · 68°F · Clear | First ride? *Ask* me. |
| V03 Weather Advisory | Friday · 68°F · Rain (warning) | Not the *prettiest* day. |

### Native parity requirement

iOS (`LSContextCapsule(state: .idle(headline:metaItems:), appearance: .chip)`) and Android (`LSContextCapsule(state = Idle(headline, metaItems), appearance = Chip)`) must populate the same headline + metaItems values in every story id under `templates.idle-screen.*`. The italic emphasis word in the headline must use `AttributedString` (iOS, `inlinePresentationIntent.emphasized`) or `AnnotatedString` (Android, `SpanStyle(fontStyle = Italic)`) so the renderer colors it as `signal.default`. Empty `metaItems` or plain-string headline is a parity violation and will be flagged by `pnpm design:review`.

---

## TopBar Chip Paradigm (required)

The header is exactly three slots, all square `40×40pt` glass chips on the same row:

```
[ hamburger ] [ status-card ] [ plus ]
   square       flexes 1fr       square
```

The hamburger and plus chips share dimensions, surface (`var(--surface-overlay)` + `blur(8px)` + `var(--elev-chrome)`), and SVG `stroke-width="1.6"`. The plus chip has **no text label** (a11y label only). This applies to design HTML, iOS `LSTopBar.newChip`, and Android `LSTopBar.NewChip` — keep all three in lockstep.

---

## Token Recipe

View-level properties applied via `.view-idle-screen*` selectors only:

| Property | Token | Notes |
|----------|-------|-------|
| Phone frame background | `var(--surface-primary)` | Matches map paper in light; ink-800 in dark |
| Phone frame border | `var(--border-default)` | 1px via `var(--stroke-sm)` |
| Phone frame corner radius | `var(--radius-xl)` | 16px — consistent with organisms |
| Section background | `var(--surface-primary)` | Page-level background |
| Caption band border | `var(--border-default)` | Bottom separator on header band |
| Caption section padding | `var(--space-9)` desktop / `var(--space-4)` mobile | Outer section chrome |
| Map contour strokes | `var(--map-contour)` / `var(--map-contour-faint)` | Decorative SVG strokes — no color literals |
| Favorite pin fill | `var(--signal-default)` | Copper dot |
| Favorite pin border | `var(--surface-card)` | White ring on pin |
| Greeting overlay headline `<em>` color | `var(--signal-default)` | Italic "today" / "tonight" copper tint |
| Greeting meta row color | `var(--signal-default)` | Copper label text |
| Status-card (header inline) background | `var(--surface-overlay)` | View-local re-skin so the middle status card matches `org-topbar__chip` surface — header reads as one chip family (menu · status · NEW) |
| Status-card (header inline) corner radius | `var(--radius-md)` | Matches chip radius (canonical capsule uses `--radius-lg` elsewhere) |
| Status-card (header inline) elevation | `var(--elev-chrome)` | Matches chip shadow (canonical capsule uses `--elev-overlay` elsewhere) |
| Status-card (header inline) backdrop blur | `blur(8px)` | Matches chip blur (canonical capsule uses `blur(14px) saturate(1.2)` elsewhere) |
| Status-card (header inline) height | `var(--space-9)` | 40pt — chip baseline so menu · status · NEW align on the same row |
| Advisory card background | `var(--wx-rain-tint)` | Rain-tint variant only |
| Advisory card accent border | `var(--wx-rain)` | Left 3px stripe |
| Home indicator bar | `rgba(0,0,0,0.38)` light / `rgba(255,255,255,0.30)` dark | Phone chrome — unavoidable raw value; documented below |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Default (≥ 900px) | Phone frame centered with `var(--space-9)` (40px) horizontal padding; sections have generous vertical padding `var(--space-11)` |
| Tablet (< 900px) | Phone frame max-width scales to `min(390px, 80vw)`; section padding reduces to `var(--space-6)` |
| Mobile (≤ 375px) | Section padding collapses to `var(--space-4)`; phone frame spans full section inner width; caption header stacks vertically; story annotation text aligns center |

---

## Accessibility

| Element | Role / Landmark |
|---------|----------------|
| `<main>` | `role="main"` — wraps all story sections |
| Story section | `<section>` with `aria-label="S01 Default Light"` etc. |
| Phone frame | `role="img"` `aria-label="IdleScreen phone preview — [variant]"` |
| TopBar hamburger | `aria-label="Open sessions"` |
| TopBar NEW chip | `aria-label="Start new session"` |
| Greeting headline | `<h2>` inside overlay — Newsreader opinion type |
| Chat input bar | `role="textbox"` `aria-placeholder="Plan a ride from Near Santa Cruz…"` |
| Suggestion chips | `role="button"` `aria-label="Suggest: [label]"` |
| Location pill | `aria-label="Current location: Near Santa Cruz, CA"` |
| Filter sheet | `role="dialog"` `aria-label="Refine the ask"` |
| Focus order | TopBar chips → Greeting (non-interactive) → Location pill → Suggestion chips → Chat input bar → Filter button |

---

## View-Local Constants

| Property | Value | Reason |
|----------|-------|--------|
| Phone frame `aspect-ratio` | `9 / 19.5` | Canonical iPhone preview proportions — not a spacing token |
| Phone frame `max-width` | `390px` | Canonical iPhone viewport width — not a spacing token |
| Phone frame `border-radius` | `var(--radius-xl)` | Intentionally uses token; no additional literal needed |
| `backdrop-filter: blur(16px)` on greeting overlay glass | `16px` | Visual-effect blur radius — not a spacing token; consistent with navigator-callouts organism |
| `backdrop-filter: blur(8px)` on TopBar chips | `8px` | Lighter organism-level blur; matches `org-topbar` spec |
| `backdrop-filter: blur(8px)` on header status-card (`view-idle-screen__header .mol-context-capsule`) | `8px` | Re-skin override so the middle capsule matches the surrounding `org-topbar__chip` blur instead of the canonical capsule's `blur(14px) saturate(1.2)` — header reads as one chip family |
| Home indicator color (light) | `rgba(0,0,0,0.38)` | Device chrome simulation — no semantic equivalent; raw value is intentional |
| Home indicator color (dark) | `rgba(255,255,255,0.30)` | Device chrome simulation — same rationale |
| SVG `stroke-width` values | `0.7` / `0.8` / `0.9` on contour SVG | SVG geometry — not CSS spacing tokens |
| Advisory card `border-left` width | `var(--stroke-lg)` (2px) | Uses token; no literal needed |
| `@media (max-width: 375px)` / `@media (max-width: 900px)` | Pixel literals in `@media` | Structural breakpoint constraints — allowed per spec |
