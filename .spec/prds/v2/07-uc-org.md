---
stability: FEATURE_SPEC
last_validated: 2026-04-20
prd_version: 2.0.0
functional_group: ORG
---

# Use Cases: Organisms (ORG)

Organisms embed feature-domain concepts (Navigator conversations, routes, sessions) into larger reusable compositions. They remain **data-agnostic** — every organism takes its data as props and never fetches it; data is supplied by mock providers in the sandbox stories.

| ID         | Title                                             | Description |
|------------|---------------------------------------------------|-------------|
| UC-ORG-01  | Navigation organisms (`LSTopBar` + `LSNavBar`)    | Top app-chrome: TopBar with hamburger + optional title + "NEW" chip; NavBar retained for modal-sheet contexts. |
| UC-ORG-02  | `LSMapLayer` organism                             | The map-primary canvas with scrim + overlay slots. Reused across all Navigator screens. |
| UC-ORG-03  | `LSNavigatorMessage` + `LSInlineErrorCallout`     | Branded AI callout with optional attached route cards; warn-stripe inline recovery callout. |
| UC-ORG-04  | `LSRouteSheet` organism                           | RouteDetails bottom sheet with best badge, instrument readout, weather timeline, action row. |
| UC-ORG-05  | `LSSessionsDrawer` organism                       | Left-anchored conversation-history drawer with grouped sessions + active-session stripe. |
| UC-ORG-06  | `LSRouteCard` domain organism                     | Full route-card organism consuming the multi-polyline `LSMap` contract. |
| UC-ORG-07  | `LSSectionHeader` organism                        | In-screen group header with title + optional "See all" link + optional inset. |

---

## UC-ORG-01 — Navigation organisms (`LSTopBar` + `LSNavBar`)

> **Design reference:** [`concepts/uc-org-01-topbar-navbar.html`](concepts/uc-org-01-topbar-navbar.html) — complete visual writeout showing rendered DOM examples of `LSTopBar` (default with hamburger+NEW chips, with centered title, record highlight variant) and `LSNavBar` (modal-sheet navigation bar). Use the visual examples to understand glass-panel chrome composition and translucent+blurred styling; do NOT copy the HTML wholesale. Extract slot layouts, chip composition, and token mappings into native organism implementations.

Deliver two top-chrome organisms consumed across the Navigator screens.

**`LSTopBar`** — the primary chrome used on Idle / Planning / RouteResults / RouteDetails / Error. Positioned at top of screen (respecting safe area / status bar). Slot API:

```
LSTopBar(
  leading: LeadingSlot = .hamburger { onMenuTap() },
  title: String? = nil,
  trailing: TrailingSlot = .newChip { onNewTap() }
)
```

- Hamburger slot: an `LSGlassPanel(.chrome)`-backed circular chip (40×40, `radius.md`) containing `LSIcon(.menu)`.
- Optional centered title in `typography.ui.title.md`.
- "NEW" chip slot: an `LSGlassPanel(.chrome)`-backed rounded chip containing `LSIcon(.plus)` + "NEW" label in `typography.ui.label.md`.

Every chip consumes `LSGlassPanel(.chrome)` so they visually match the design's translucent+blurred chrome.

**`LSNavBar`** — retained from v1 scope for modal-sheet contexts (used by `LSModalSheet` / full-screen modals that survive V2). Composes `LSToolbar` (UC-MOL-02) with optional filter-chip row + optional search slot. Kept narrow; does not appear on any Navigator screen.

### Acceptance Criteria
- ☐ Developer can render `LSTopBar(onMenuTap: { }, onNewTap: { })` on iOS and see a hamburger chip on the leading edge and a "NEW" chip on the trailing edge, both backed by `LSGlassPanel(.chrome)`; no title between.
- ☐ Developer can render the same on Android identically.
- ☐ Developer can render `LSTopBar(title: "Details", onMenuTap: { }, onNewTap: { })` and see a centered title between the chips.
- ☐ Developer can tap the hamburger and see `onMenuTap` fire once; tapping "NEW" fires `onNewTap` once.
- ☐ Developer can open "Organisms / TopBar" and find stories `Default`, `With Title`, `Hamburger Only (no NEW chip)`, `Record Highlight` (trailing chip swapped to a recording indicator from `color.status.recording`).
- ☐ Developer can render `LSNavBar(title: "Filter", leading: .back { }, trailing: .action(.close) { })` and see a standard toolbar-shaped nav bar used for modal sheets.
- ☐ Developer can toggle light/dark in any story and see colors re-resolve — the glass chrome tint + blur remain legible against `PaperMap` light + dark styles.

---

## UC-ORG-02 — `LSMapLayer` organism

> **Design reference:** [`concepts/uc-org-02-maplayer.html`](concepts/uc-org-02-maplayer.html) — complete visual writeout showing rendered DOM examples of the map-primary canvas with all overlay slots populated: scrim, top overlays, bottom overlays, leading drawer, bottom sheet, and top bar. Use the visual examples to understand z-order stacking, safe-area padding, and slot composition; do NOT copy the HTML wholesale. Extract z-order contract, slot API patterns, and token mappings into native organism implementations.

Deliver the map-primary canvas used by every Navigator screen. It solves positioning / z-index / safe-area / overlay stacking once so screens don't re-implement it.

Signature:

```
LSMapLayer(
  map: LSMap,                                 // the map atom with its camera + polylines + annotations
  scrim: ScrimSpec? = nil,                    // renders an LSScrim over the map when present
  topOverlays: [GlassOverlaySlot] = [],       // stacked top-aligned overlays (NavigatorMessage, PhaseIndicator, ErrorCallout, greeting)
  bottomOverlays: [GlassOverlaySlot] = [],    // bottom-aligned overlays (ChatInput)
  leadingDrawer: DrawerSpec? = nil,           // SessionsDrawer presentation
  bottomSheet: BottomSheetSpec? = nil,        // RouteSheet presentation
  topBar: LSTopBar? = nil                     // optional top chrome
)
```

Z-order bottom-to-top: map → scrim → top/bottom overlays (together) → sheet → drawer → top bar. Each overlay slot preserves its own safe-area padding so screens pass pre-assembled `LSNavigatorMessage` / `LSChatInput` / etc. without per-screen positioning.

### Acceptance Criteria
- ☐ Developer can render `LSMapLayer(map: LSMap(mode: .preview, camera: c), topBar: LSTopBar(onMenuTap:...))` on both platforms and see a full-screen map with the top bar overlaid correctly under the status bar.
- ☐ Developer can add a `topOverlays: [.init(id: "greeting", content: greetingOverlay)]` and see the overlay positioned below the top bar with correct safe-area padding.
- ☐ Developer can add a `bottomOverlays: [.init(id: "chat", content: LSChatInput(...))]` and see it anchored above the bottom safe-area.
- ☐ Developer can present `scrim: .init(opacity: 0.35)` and see an `LSScrim` appear above the map, below overlays.
- ☐ Developer can present `leadingDrawer: .init(content: LSSessionsDrawer(...), onDismiss: {})` and see the drawer slide in via `motion.recipe.sidebarSlideIn`, above the scrim.
- ☐ Developer can present `bottomSheet: .init(content: LSRouteSheet(...), detent: .medium)` and see the sheet anchor to the bottom above the chat overlay.
- ☐ Developer can open "Organisms / MapLayer" and find stories `Map Only`, `Map + TopBar`, `Map + Top Overlay`, `Map + Bottom Overlay`, `Map + Scrim + Drawer`, `Map + Sheet`, `Full Stack (every slot populated)`.
- ☐ iOS and Android tests verify the z-order contract and that each slot preserves safe-area / window-inset padding.

---

## UC-ORG-03 — `LSNavigatorMessage` + `LSInlineErrorCallout`

> **Design reference:** [`concepts/uc-org-03-navigator-message-error-callout.html`](concepts/uc-org-03-navigator-message-error-callout.html) — complete visual writeout showing rendered DOM examples of `LSNavigatorMessage` (with/without attachments, pinned/unpinned, signal-stripe callout) and `LSInlineErrorCallout` (warning-stripe with detail and suggestion chips). Use the visual examples to understand callout composition, attached route card stacking, and auto-dismiss behavior; do NOT copy the HTML wholesale. Extract callout layout patterns, motion references, and token mappings into native organism implementations.

Two Navigator-specific callout organisms.

**`LSNavigatorMessage`** — the branded "THE NAVIGATOR" overlay used by RouteResults and, implicitly, by any screen where the Navigator speaks with attached content. Signature:

```
LSNavigatorMessage(
  body: String,
  attachments: [RouteAttachment] = [],
  pinned: Bool = false,
  onPin: () -> Void = {},
  onDismiss: () -> Void = {}
)
```

Composition:
- `LSGlassPanel(.callout(accent: .signal))` container.
- Header row: compass chip (`LSIcon(.compass, color: .signal)` inside a tinted `LSPill(size: .sm)` backed by `color.signal.default` at 22%) + "THE NAVIGATOR" label in `typography.ui.label.sm` + `color.signal.default` + body in `typography.opinion.md`.
- Action row (trailing of header): `LSIcon(.bookmarkFill / .bookmark)` wired to `onPin`, `LSIcon(.close)` wired to `onDismiss`.
- Attachments list (when non-empty): vertical stack of compact `LSRouteAttachmentCard`s with `spacing.2` between them; the first card is rendered with `selected: true`.
- Enter animation: `motion.recipe.chatOverlayEnter`. Auto-dismiss: when `pinned == false`, auto-dismisses via `motion.recipe.chatOverlayDismiss` timing (5000ms visible).

**`LSInlineErrorCallout`** — the in-conversation recovery callout used by ErrorScreen. Signature:

```
LSInlineErrorCallout(
  title: String = "THE NAVIGATOR",
  body: String,
  detail: String? = nil,
  suggestions: [SuggestionChip] = [],
  onSuggestionTap: (SuggestionChip) -> Void = { _ in }
)
```

Composition:
- `LSGlassPanel(.callout(accent: .warning))` container.
- Header row: compass chip + title label (`typography.ui.label.sm` in `color.signal.default`).
- Body in `typography.opinion.md` + optional `detail` in `typography.ui.body.sm` + `color.content.textMuted`.
- Suggestions footer (when non-empty): horizontal `LSSuggestionChip` row.

### Acceptance Criteria
- ☐ Developer can render `LSNavigatorMessage(body: "Take 280 south to 92…", attachments: [best, alt1, alt2], pinned: true)` on both platforms and see a `LSGlassPanel(.callout(accent: .signal))` with compass chip, label, body in Newsreader serif, three compact `LSRouteAttachmentCard`s (first selected), pin + close actions.
- ☐ Developer can render `LSNavigatorMessage(body: "...", pinned: false)` and see the auto-dismiss animation fire after 5000ms, driven by `motion.recipe.chatOverlayDismiss`.
- ☐ Developer can tap the pin icon and see `onPin` fire; tap the close icon and see `onDismiss` fire; when pinned, auto-dismiss does not fire.
- ☐ Developer can render `LSInlineErrorCallout(body: "Couldn't stitch that one together — the segment through Lucia looked broken.", detail: "Try a different end point, or let me route you inland via Carmel Valley Rd instead?", suggestions: [SuggestionChip("Try inland"), SuggestionChip("End at Big Sur")], onSuggestionTap: { })` on both platforms and see a `LSGlassPanel(.callout(accent: .warning))` with compass chip, title, body, detail, and two suggestion chips.
- ☐ Developer can tap a suggestion chip and see `onSuggestionTap(chip)` fire exactly once with the tapped chip.
- ☐ Developer can open "Organisms / NavigatorMessage" and find stories `Message Only`, `With One Attachment`, `With Three Attachments`, `Pinned (no auto-dismiss)`, `Long Body`, `Dark Mode`.
- ☐ Developer can open "Organisms / InlineErrorCallout" and find stories `Error Only`, `With Detail`, `With Suggestions`, `Long Body + Long Suggestions`, `Dark Mode`.
- ☐ iOS and Android tests verify both organisms compose only from MOL + ATM tiers — raw `VStack`/`Column` with literal colors fail inspection.

---

## UC-ORG-04 — `LSRouteSheet` organism

> **Design reference:** [`concepts/uc-org-04-route-sheet.html`](concepts/uc-org-04-route-sheet.html) — complete visual writeout showing rendered DOM examples of the route details bottom sheet with drag handle, best badge, opinion-serif title, instrument readout, weather timeline, and sticky action row (Save/Ride this). Use the visual examples to understand sheet composition and molecule delegation; do NOT copy the HTML wholesale. Extract sheet layout structure, detent sizing, and token mappings into native organism implementations.

Deliver the RouteDetails bottom sheet composed from the molecules defined in UC-MOL-07/08.

Signature:

```
LSRouteSheet(
  route: RouteDetails,
  weatherTimeline: [WeatherTimelineEntry],
  onSave: () -> Void,
  onRide: () -> Void,
  onDismiss: () -> Void
)
```

Composition (top → bottom):
- Drag handle (36pt-wide in `color.border.strong`).
- Header row: leading stack — `LSBestBadge` (when `route.isBest`) + title in `typography.opinion.lg` + subtitle in `typography.ui.body.md` + `color.content.textMuted`.
- `LSInstrumentReadout(metrics: [.dist, .time, .climb, .scenic])` with top/bottom dividers.
- `LSWeatherTimeline(entries: weatherTimeline, from: ..., to: ...)` with "Weather along the way" header.
- Action row (sticky bottom): `LSButton(.outline, label: "Save", icon: .bookmark)` at flex 1 + `LSButton(.primary, label: "Ride this", icon: .chevR)` at flex 2.

Presented via `LSBottomSheet` (UC-MOL-03) with `.large` detent by default. Enter animation uses the bottom-sheet standard motion.

### Acceptance Criteria
- ☐ Developer can present `LSRouteSheet(route: bestRouteDetails, weatherTimeline: sixHourTimeline, onSave:, onRide:, onDismiss:)` on iOS and see drag handle + best badge + title "The Skyline Spine" in `typography.opinion.lg` + via subtitle + 4-column instrument readout + weather timeline + sticky action row with `Save` (outline) and `Ride this` (primary).
- ☐ Developer can present the same on Android identically.
- ☐ Developer can tap `Save` and see `onSave` fire once; tap `Ride this` and see `onRide` fire once; drag-down dismisses the sheet and fires `onDismiss` once.
- ☐ Developer can open "Organisms / RouteSheet" and find stories `Best Route`, `Alt Route (no Best badge)`, `Long Title + Via`, `Mixed Weather Timeline (clear + rain + wind)`, `Dark Mode`.
- ☐ iOS and Android tests verify the organism composes only from MOL + ATM tiers; the weather timeline and instrument readout are NOT re-implemented inline.

---

## UC-ORG-05 — `LSSessionsDrawer` organism

> **Design reference:** [`concepts/uc-org-05-sessions-drawer.html`](concepts/uc-org-05-sessions-drawer.html) — complete visual writeout showing rendered DOM examples of the left-anchored sessions drawer with grouped session rows, active-session stripe highlighting, sticky header with NEW button, and scroll behavior. Use the visual examples to understand drawer composition and session row styling; do NOT copy the HTML wholesale. Extract drawer width, row layout, active-state styling, and token mappings into native organism implementations.

Deliver the left-anchored conversation-history drawer shown on SessionsScreen.

Signature:

```
LSSessionsDrawer(
  sessions: [Session],
  activeSessionId: String?,
  groupLabel: String = "THIS WEEK",            // optional section header
  onSelect: (Session.Id) -> Void,
  onNew: () -> Void,
  onDismiss: () -> Void
)
```

Composition (top → bottom):
- `LSGlassPanel(.chrome)` container, 312pt wide, full-height, with a 1px trailing border in `color.border.default` and `elevation.overlay`.
- Header row (`spacing.4` padding): title "Rides" in `typography.ui.title.lg` + trailing `LSButton(.outline, icon: .plus, label: "NEW")` wired to `onNew`.
- Section label row: `LSSectionHeader(title: groupLabel)` in `typography.ui.label.sm` + `color.content.textSubtle` (inset by `spacing.4`).
- Session rows (scrollable list): each row renders a custom list item with:
  - Left active-state stripe (3px, `color.signal.default` when `session.id == activeSessionId`, else transparent).
  - Row background `color.signal.default` at 5% alpha when active, else transparent.
  - Title (truncated) in `typography.ui.label.lg` + trailing "when" label in `typography.instrument.sm` + `color.content.textMuted`.
  - Preview line in `typography.ui.body.sm` + `color.content.textMuted`, truncated.
  - Meta footer line in `typography.ui.label.sm` + `color.signal.default` (active) or `color.content.textSubtle` (inactive).
  - Bottom divider: `color.border.subtle`.

Presentation: lives inside `LSMapLayer.leadingDrawer` slot so positioning + scrim + dismiss are owned by `LSMapLayer`. Enter animation: `motion.recipe.sidebarSlideIn`.

### Acceptance Criteria
- ☐ Developer can render `LSSessionsDrawer(sessions: fiveMockSessions, activeSessionId: "santa-cruz-loop", onSelect:, onNew:, onDismiss:)` on both platforms and see a 312-wide left drawer with "Rides" header + NEW button + "THIS WEEK" section label + 5 session rows, with the active session visually highlighted (stripe + tinted background).
- ☐ Developer can tap a session row and see `onSelect(session.id)` fire once.
- ☐ Developer can tap the NEW button and see `onNew` fire once.
- ☐ Developer can scroll the session list and see the header / NEW / section label remain in place (sticky) while rows scroll underneath.
- ☐ Developer can open "Organisms / SessionsDrawer" and find stories `Default (5 sessions, 1 active)`, `Empty State (no sessions)`, `Long List (20 sessions, scrollable)`, `No Active Session`, `Dark Mode`.
- ☐ iOS and Android tests verify the organism composes only from MOL + ATM tiers; no raw `VStack`/`Column` with literal colors.

---

## UC-ORG-06 — `LSRouteCard` domain organism

> **Design reference:** [`concepts/uc-org-06-route-card.html`](concepts/uc-org-06-route-card.html) — complete visual writeout showing rendered DOM examples of the full route card organism with map preview, polyline rendering, title/subtitle rows, difficulty tags, and saved-state accent. Use the visual examples to understand the full card composition with embedded map; do NOT copy the HTML wholesale. Extract card layout, map preview sizing, and token mappings into native organism implementations.

Deliver a full route-card organism used in catalog views and as a referenceable domain composition. Unlike `LSRouteAttachmentCard` (compact, UC-MOL-08), `LSRouteCard` is the full card:

- `LSCard` wrapper.
- Map preview slot: `LSMap(mode: .preview, polylines: [PolylineData(coordinates: route.polyline, variant: route.variant)], cameraFit: .polyline(padding: .spacing3))` with start/end annotations — consumes UC-ATM-11 multi-polyline contract.
- Title row (`typography.ui.title.md`) + subtitle row (distance + estimated time in `typography.instrument.sm`).
- Difficulty `LSChip` / `LSTagPill` row + optional "saved" state via `LSIcon(.heartFill)` accent.

### Acceptance Criteria
- ☐ Developer can render `LSRouteCard(route: mockRoute1)` on both platforms and see a composition: `LSCard` wrapper + `LSMap(mode: .preview)` with the route polyline rendered (Copper Studio style, auto-framed with `.polyline(padding: .spacing3)`) + title/subtitle + difficulty tag + optional saved-state icon.
- ☐ Developer can render the card with `route.variant = .alt1` and see the polyline stroke resolve to `color.route.alt1`.
- ☐ Developer can open "Organisms / RouteCard" and find stories `Default`, `Saved`, `Alt Variant`, `Long Title (overflow)`, `Missing Optional Data`, `Dark Mode`.
- ☐ Developer can verify the organism renders from a typed prop data model that mirrors the `routes` read type in `convex/schema.ts` (checked by a type-level test per platform).
- ☐ Developer can confirm no organism reaches out to Convex / networking / disk I/O.

---

## UC-ORG-07 — `LSSectionHeader` organism

> **Design reference:** [`concepts/uc-org-07-section-header.html`](concepts/uc-org-07-section-header.html) — complete visual writeout showing rendered DOM examples of section headers with title only, title + "See all" link, caps-label style, and custom inset variants. Use the visual examples to understand section header layout and trailing link styling; do NOT copy the HTML wholesale. Extract title/spacing patterns and token mappings into native organism implementations.

Deliver `LSSectionHeader` for in-screen group titles (used by `LSSessionsDrawer` and catalog views).

Signature: `LSSectionHeader(title: String, trailing: TrailingSlot = .none, inset: SpacingToken? = .spacing3)`.
Trailing slot supports `.none` or `.link(label: String, onTap: () -> Void)`.

### Acceptance Criteria
- ☐ Developer can render `LSSectionHeader(title: "Nearby Routes", trailing: .link("See all") { })` on both platforms and see title in `typography.ui.title.md` on the leading edge + `color.signal.default`-tinted "See all" link on the trailing edge + `spacing.3` leading inset.
- ☐ Developer can render `LSSectionHeader(title: "THIS WEEK")` and see a caps-style label with no trailing slot, inset `spacing.3`.
- ☐ Developer can tap the "See all" link and see the handler invoked exactly once.
- ☐ Developer can open "Organisms / SectionHeader" and find stories `Title Only`, `Title + See All`, `Caps Label (no See All)`, `Custom Inset`, `Dark Mode`.
- ☐ iOS and Android tests verify the organism composes only from atoms.
