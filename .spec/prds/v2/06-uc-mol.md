---
stability: FEATURE_SPEC
last_validated: 2026-04-20
prd_version: 2.0.0
functional_group: MOL
---

# Use Cases: Molecules (MOL)

Molecules compose atoms into small, reusable patterns. A molecule **must not** inline an atom's primitive (e.g., raw SwiftUI `Text`, raw Compose `Box` with a hard-coded color) — it always routes through the atom API. Every molecule ships paired iOS + Android implementations, with a story per variant.

| ID         | Title                                                              | Description |
|------------|--------------------------------------------------------------------|-------------|
| UC-MOL-01  | Card + ListRow molecules                                           | Reusable card-shaped content containers and list-row patterns. |
| UC-MOL-02  | Toolbar + NavHeader molecules                                      | Top-of-screen navigation chrome with leading / title / trailing slots. |
| UC-MOL-03  | BottomSheet + Toast + Modal molecules                              | Transient overlay molecules for contextual actions, feedback, and modal flows. |
| UC-MOL-04  | FormField + TabItem + EmptyState molecules                         | Composite patterns for forms, tabs, and empty-state layouts. |
| UC-MOL-05  | Pill semantics family (TagPill / FilterChip / SuggestionChip / WeatherBadge) | Four semantic molecules composing `LSPill` with content + interaction. |
| UC-MOL-06  | ChatInput molecule (`LSChatInput`)                                 | Bottom-anchored chat input row with collapse / send / filter affordances, optional location context bar, optional suggestion chip row. |
| UC-MOL-07  | Navigator molecules (PhaseIndicator / WeatherTimeline / InstrumentReadout) | Three Navigator-specific composite patterns. |
| UC-MOL-08  | LocationContextBar + RouteAttachmentCard molecules                 | Location + mode pills row; compact route card with variant stripe + scenic meter. |

---

## UC-MOL-01 — Card + ListRow molecules

Deliver `LSContentCard` (structured card wrapping `LSCard`: optional header slot, title row, subtitle row, metadata row, optional action footer) and `LSListRow` (horizontal row with leading content — icon or avatar — title + optional subtitle stack, trailing content — icon, chevron, toggle, or button). Minimum touch target for interactive `LSListRow`.

### Acceptance Criteria
- ☐ Developer can render `LSContentCard(title: "Route X", subtitle: "42 mi · 1h 12m") { actions }` on iOS and see `color.surface.card` + `radius.lg` + `elevation.2` + layout spacing from `spacing.*` tokens; title in `typography.ui.title.md`, subtitle in `typography.ui.body.md`.
- ☐ Developer can render the same on Android with identical resolved layout.
- ☐ Developer can render `LSListRow(leading: .avatar(...), title: "Name", subtitle: "Detail", trailing: .chevron)` on both platforms and see minimum height `sizing.touchTarget`, leading/title gap `spacing.3`, vertical padding `spacing.2`.
- ☐ Developer can tap an `LSListRow` with `onTap` and see the handler invoked exactly once; rows without `onTap` do not surface a pressed highlight.
- ☐ Developer can open "Molecules / ContentCard" and find stories for `With Image Header`, `Title Only`, `Title+Subtitle+Chips`, `With Actions`.
- ☐ Developer can open "Molecules / ListRow" and find stories for `Leading Icon`, `Leading Avatar`, `With Subtitle`, `With Toggle`, `With Chevron`, `With Trailing Button`.
- ☐ Tests assert the molecule uses atoms from UC-ATM-01 through UC-ATM-10 — raw `Text`/`Box` with literal colors fails via snapshot/style inspection.

---

## UC-MOL-02 — Toolbar + NavHeader molecules

Deliver `LSToolbar` (top bar for app screens) and `LSNavHeader` (screen-level header with optional large-title variant for iOS large-title behavior on scroll). Both expose leading / title / trailing slots; chrome colors from `color.surface.*` and content from `color.content.*`. Height `sizing.component.toolbarHeight`. Respect safe areas / window insets.

### Acceptance Criteria
- ☐ Developer can render `LSToolbar(leading: .back { }, title: "Details", trailing: .action(icon: .ellipsis) { })` on iOS and see `sizing.component.toolbarHeight`, `color.surface.primary` background, title centered in `typography.ui.title.md`, back icon at `sizing.icon.md`.
- ☐ Developer can render the same on Android identically.
- ☐ Developer can render `LSNavHeader(variant: .largeTitle, title: "Chat")` on iOS and see a large-title header in `typography.opinion.lg` that collapses to `typography.ui.title.md` behavior on scroll.
- ☐ Developer can render the same `LSNavHeader` on Android and see the large-title variant render the same typography hierarchy static at display-size.
- ☐ Developer can open stories inside the sandbox and verify safe-area respect on iOS, `WindowInsets` respect on Android.
- ☐ Developer can find stories for Toolbar `Back + Title + Action`, `Title Only`, `Title + Two Actions`, `No Back Button` and NavHeader `Default`, `Large Title`, `Large Title With Subtitle`.

---

## UC-MOL-03 — BottomSheet + Toast + Modal molecules

Deliver `LSBottomSheet` (bottom-anchored sheet with drag handle, token-driven surface, content slot; supports three detents `small` ≈25%, `medium` ≈50%, `large` ≈90%), `LSToast` (transient top/bottom message with `default / success / warning / error` variants from `color.status.*`, auto-dismissing after `motion.recipe.chatOverlayDismiss` timing), `LSModal` (center-anchored card dialog with title, body, optional two-button action row). All three use TOK motion recipes for enter/exit animations.

### Acceptance Criteria
- ☐ Developer can present `LSBottomSheet(detent: .medium) { content }` on iOS and see `color.surface.overlay` background, `radius.lg` top corners, 36pt-wide drag handle in `color.border.subtle`, enter animation referencing `motion.recipe.chatOverlayEnter` timing class.
- ☐ Developer can present the same on Android and see identical values.
- ☐ Developer can trigger `LSToast.show(message: "Saved", variant: .success)` and see `color.status.success` background, auto-dismiss, and enter/exit using the standard motion primitives.
- ☐ Developer can present `LSModal(title: "Delete ride?", body: "This cannot be undone.", primary: .destructive("Delete") { }, secondary: .ghost("Cancel") { })` and see a center-anchored card with title `typography.ui.title.md`, body `typography.ui.body.md`, buttons from UC-ATM-02.
- ☐ Developer can swipe down on `LSBottomSheet` on both platforms and see the sheet dismiss — `onDismiss` fires exactly once.
- ☐ Developer can open "Molecules / BottomSheet", "Molecules / Toast", "Molecules / Modal" families and find stories per variant.
- ☐ Developer can toggle theme mode in any overlay molecule and see correct dark-variant colors.

---

## UC-MOL-04 — FormField + TabItem + EmptyState molecules

Deliver `LSFormField` (label + input atom + helper/error text, vertically stacked with `spacing.2`), `LSTabItem` (single tab — icon + label + selected-state indicator), and `LSEmptyState` (centered composition with optional illustration slot, title, body, action button).

### Acceptance Criteria
- ☐ Developer can render `LSFormField(label: "Email", value: $email, placeholder: "you@example.com", error: emailError)` on iOS and see a stack with label in `typography.ui.label.md`, input from UC-ATM-03, error text in `typography.ui.body.sm` + `color.content.error` when `error != nil`.
- ☐ Developer can render the same on Android with identical styles.
- ☐ Developer can render `LSTabItem(icon: .home, label: "Home", selected: true)` on both platforms and see icon + label in `color.signal.default` when selected, `color.content.tertiary` otherwise — plus a selected-indicator bar in `color.signal.default`.
- ☐ Developer can render `LSEmptyState(icon: .inbox, title: "No rides yet", body: "Record your first ride to see it here.", action: .primary("Get Started") { })` and see a centered layout with title `typography.ui.title.md`, body `typography.ui.body.md`, icon `sizing.icon.xl`, button from UC-ATM-02.
- ☐ Developer can tap a button in `LSEmptyState` and see `action` invoked once.
- ☐ Developer can find stories covering default/focused/error, selected/unselected, and with/without illustration respectively.

---

## UC-MOL-05 — Pill semantics family (TagPill / FilterChip / SuggestionChip / WeatherBadge)

Deliver four semantic molecules composing `LSPill` (UC-ATM-06):

- **`LSTagPill(icon?: IconName, label: String, accent: AccentColor = .muted)`** — non-interactive info pill. Default background `color.surface.glass`, border `color.border.default`. Used for location context ("Near Santa Cruz, CA"), mode indicator ("MANUAL"), and generic metadata tags.
- **`LSFilterChip(label: String, selected: Bool, onToggle: () -> Void)`** — toggleable. Selected background `color.signal.default`; unselected background `color.surface.card` + `color.border.default` border.
- **`LSSuggestionChip(label: String, onTap: () -> Void)`** — single-tap primer. Background `color.surface.card`, border `color.border.default`, radius `radius.pill`, height 32pt.
- **`LSWeatherBadge(condition: WeatherCondition, label: String, size: PillSize = .md)`** — non-interactive. Background `color.weather.<condition>.tint`, foreground + border `color.weather.<condition>.default`, leading `LSIcon` (`.sun` / `.rain` / `.wind` / `.storm` / `.therm` for hot+cold).

### Acceptance Criteria
- ☐ Developer can render `LSTagPill(icon: .pin, label: "Near Santa Cruz, CA")` on both platforms and see a glass-surface pill with pin icon + label.
- ☐ Developer can render `LSFilterChip(label: "Scenic", selected: true, onToggle: { })` and see selected treatment from `color.signal.*`; unselected treatment from `color.surface.card`.
- ☐ Developer can render `LSSuggestionChip(label: "Twisty back roads") { }` and tap it — `onTap` fires exactly once.
- ☐ Developer can render `LSWeatherBadge(condition: .rain, label: "Rain 3pm")` on both platforms and see `color.weather.rain.tint` background, `color.weather.rain.default` foreground + border, leading `.rain` icon.
- ☐ Developer can render all six weather conditions × two sizes and see color + icon parity across iOS and Android.
- ☐ Developer can open "Molecules / Pill Semantics" and find stories per semantic × variant on both platforms.
- ☐ iOS and Android tests verify each semantic molecule internally composes from `LSPill` + `LSIcon` + `LSText`; raw pill-shape implementations fail inspection.

---

## UC-MOL-06 — ChatInput molecule (`LSChatInput`)

Deliver `LSChatInput` — the pinned chat input at the bottom of every Navigator screen that has one. Signature:

```
LSChatInput(
  value: Binding<String>,
  placeholder: String = "Plan a ride…",
  suggestions: [SuggestionChip]? = nil,
  locationBadge: LocationContext? = nil,
  isThinking: Bool = false,
  isEnabled: Bool = true,
  onSend: (String) -> Void,
  onCollapse: () -> Void,          // left icon — "reclaim the map"
  onFilter: () -> Void,             // right icon when value empty — open filter sheet
  onSuggestionTap: ((SuggestionChip) -> Void)? = nil
)
```

Composition (bottom → top, layered):
1. **Input bar** (`LSGlassPanel(.chrome)`, height `sizing.component.inputHeight`, radius `radius.xl`, horizontal padding `spacing.4` left / `spacing.2` right): leading `LSButton(.ghost, icon: .collapse)` → `LSTextField` → trailing button: `LSButton(.primary, icon: .send)` **when** `value.isNotEmpty`, else `LSButton(.ghost, icon: .sliders)` wired to `onFilter`.
2. **Suggestion chip row** (optional, above input bar with `spacing.2` gap): horizontal scrollable row of `LSSuggestionChip`s; tapping fills the input and fires `onSuggestionTap`.
3. **LocationContextBar** (optional, above suggestion chips with `spacing.2` gap): renders via UC-MOL-08.

`isThinking` replaces the trailing send button with an `LSSpinner` and disables input submission until cleared.

### Acceptance Criteria
- ☐ iOS developer can render `LSChatInput(value: $text, placeholder: "Plan a ride…", onSend: { }, onCollapse: { }, onFilter: { })` and see a single `LSGlassPanel(.chrome)` bar at height `sizing.component.inputHeight`, `radius.xl`, with collapse icon + text field + `sliders` icon trailing when `value` is empty.
- ☐ Android developer can render `LSChatInput(value = text, onValueChange = { text = it }, onSend = { }, onCollapse = { }, onFilter = { })` and see identical composition.
- ☐ Developer can type text into either platform's input and see the trailing `sliders` icon swap to the primary `send` button (`color.signal.default` background).
- ☐ Developer can tap `send` and see `onSend(value)` fire with the current text; input clears and returns to placeholder.
- ☐ Developer can tap the leading `collapse` icon and see `onCollapse` fire exactly once per tap — the callback is semantically "reclaim the map" (used by overlay screens that lift a sheet; parent decides the exact behavior).
- ☐ Developer can pass `suggestions: [...]` and see a horizontal scrollable `LSSuggestionChip` row appear above the input bar; tapping a chip fires `onSuggestionTap(chip)`.
- ☐ Developer can pass `locationBadge: LocationContext(label: "Near Santa Cruz, CA", mode: .manual)` and see an `LSLocationContextBar` (UC-MOL-08) row above the suggestion chips.
- ☐ Developer can pass `isThinking: true` and see the send/filter trailing slot swap to `LSSpinner`; text input is disabled.
- ☐ Developer can pass `isEnabled: false` and see both buttons render with `opacity.disabled` applied; no callbacks fire on tap.
- ☐ Developer can open "Molecules / ChatInput" and find stories for `Default (empty, with suggestions + location)`, `With Text (send shown)`, `Thinking (spinner)`, `Disabled`, `Refining Prompt (long placeholder)`.
- ☐ iOS and Android tests verify the molecule composes only from ATM-tier atoms; raw `HStack`/`Row` with literal colors fail inspection.

---

## UC-MOL-07 — Navigator molecules (PhaseIndicator / WeatherTimeline / InstrumentReadout)

Three Navigator-specific molecules that embed domain structure once so organisms don't re-implement it.

- **`LSPhaseIndicator(phases: [PlanningPhase], header: String = "Let me think on that…")`** — vertical stack: a leading row with a compass chip (`LSIcon(.compass, color: .signal)` inside an `LSPill(size: .sm)` backed by `color.signal.default` tinted at 22%) + header in `typography.opinion.md`; followed by a vertical list of steps, each a `LSPhaseDot(state:)` + step label in `typography.instrument.sm` (mono) + `color.content.{text|textSubtle}` by state.
- **`LSWeatherTimeline(entries: [WeatherTimelineEntry], from: String, to: String)`** — horizontal 6-cell grid (expandable). Each cell has the hour label (`typography.ui.label.sm`), weather `LSIcon`, and temperature in `typography.instrument.sm`, with cell background tinted from `color.weather.<condition>.tint` and border from `color.weather.<condition>.default` at 33% alpha. A header row above renders "Weather along the way" (`typography.ui.label.md`) + the time span (`typography.ui.label.sm`).
- **`LSInstrumentReadout(metrics: [InstrumentMetric])`** — 4-column grid (or N-column if `metrics.count != 4`) separated by top/bottom `LSDivider`s. Each cell: label in `typography.ui.label.sm` + value in `typography.instrument.lg`. Designed for DIST / TIME / CLIMB / SCENIC readouts.

### Acceptance Criteria
- ☐ Developer can render `LSPhaseIndicator(phases: mockPhases)` on both platforms and see a compass chip + header + 5-step list with `LSPhaseDot` per step; active step shows the `motion.recipe.phaseDotPulse` ring pulse; labels in mono type.
- ☐ Developer can render `LSWeatherTimeline(entries: [6 entries across 6 hours], from: "9 AM", to: "2 PM")` and see 6 cells with per-condition tinted backgrounds, weather icons, and temperatures in mono.
- ☐ Developer can render `LSInstrumentReadout(metrics: [.dist("64 mi"), .time("2h 10m"), .climb("2,400ft"), .scenic("9.2")])` and see a 4-column grid with top/bottom dividers, labels on top, values in mono below.
- ☐ Developer can open "Molecules / PhaseIndicator" / "Molecules / WeatherTimeline" / "Molecules / InstrumentReadout" and find stories per variant (e.g., `Default`, `All Done`, `All Pending`; `6 Hours`, `Mixed Weather`, `All Clear`; `4 Metrics`, `3 Metrics`, `Long Values`).
- ☐ iOS and Android tests verify each molecule composes only from atoms — raw typography/layout primitives with literal colors fail inspection.

---

## UC-MOL-08 — LocationContextBar + RouteAttachmentCard molecules

Two molecules used by the Navigator screens.

- **`LSLocationContextBar(location: String, mode: LocationMode, onModeChange: () -> Void)`** — a horizontal row with two `LSTagPill`s: a leading location pill (`LSIcon(.pin, color: .signal)` + location label in `typography.ui.label.sm` + `color.content.textMuted`) and a trailing mode pill ("AUTO" / "MANUAL" text). Tapping the mode pill fires `onModeChange`. Row has `space-between` alignment with horizontal padding `spacing.2`.

- **`LSRouteAttachmentCard(route: RouteAttachment, selected: Bool = false, compact: Bool = false, onTap: (() -> Void)? = nil)`** — a compact-to-medium card composition used inside `LSNavigatorMessage` and catalog views.
  - Container: `color.surface.card`, `radius.md`, border `color.border.default` (or `color.signal.default` when `selected`), **3px leading stripe** in `color.route.<variant>`.
  - Content: optional `LSBestBadge` (when `route.isBest && !compact`), title row (`typography.ui.title.md`) + via subtitle (`typography.ui.body.sm`, `color.content.textMuted`), optional `LSWeatherBadge` right-aligned when `!compact`.
  - Metrics row: `typography.instrument.sm` with distance, duration, scenic dots (5 filled/hollow dots from `color.signal.default`/`color.border.strong`) + "SCENIC" label in `typography.ui.label.sm`.
  - Optional `heartFill` icon + "INCLUDES SUNSET CLIMB" style label when `route.includesFavorite`.

### Acceptance Criteria
- ☐ Developer can render `LSLocationContextBar(location: "Near Santa Cruz, CA", mode: .manual, onModeChange: { })` on both platforms and see two `LSTagPill`s with space-between layout; the leading pill has a signal-colored pin icon.
- ☐ Developer can tap the mode pill and see `onModeChange` fire exactly once.
- ☐ Developer can render `LSRouteAttachmentCard(route: bestRouteMock, selected: true, compact: false)` and see:
  - `color.surface.card` + `radius.md` + `color.signal.default` border + 3px leading stripe in `color.route.best`
  - `LSBestBadge` at top, title + via text, weather `LSWeatherBadge` right-aligned
  - Metrics row with mono distance/duration + 5-dot scenic meter
- ☐ Developer can render `LSRouteAttachmentCard(route: alt1Route, compact: true)` and see the compact form (no `LSBestBadge`, no weather badge, tighter padding `10px 12px`).
- ☐ Developer can render variants for `best`, `alt1`, `alt2` and see the leading stripe resolve to `color.route.best`, `.alt1`, `.alt2` respectively.
- ☐ Developer can tap a card with `onTap` set and see the callback fire once.
- ☐ Developer can open "Molecules / LocationContextBar" and "Molecules / RouteAttachmentCard" families with stories `Default (auto)`, `Manual Mode`, `Long Location Label` and `Best Selected`, `Best Compact`, `Alt1`, `Alt2`, `With Favorite Flag`, `Long Title (overflow)`.
- ☐ iOS and Android tests verify both molecules compose only from atoms.
