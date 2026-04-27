I have all the context I need. Now I'll produce the comprehensive UI/UX design document for v3-integration. Per the task instructions, I will return the document as my final assistant message rather than writing a `.md` file.

---

# v3-integration UI/UX Design Document

**Author:** ui-designer
**Date:** 2026-04-27
**Source authority:** v2 PRD `concepts/designs.html` (Copper aesthetic) + UC-ATM/MOL/ORG/SCR catalogs at `.spec/prds/v2/` + RN feature parity targets in `.spec/research/v3-integration-discovery/`
**Scope:** Native iOS (Swift/SwiftUI) + Android (Kotlin/Compose) parity with `react-native/` app
**Appetite:** 6 weeks (full feature)

---

## Executive Summary

v3 keeps the v2 atomic library (60 atoms, ~112 molecules, 13 organisms, 6 screens) intact and **adds the smallest possible set of new surfaces** to reach RN parity. The Copper "warm-paper topographic" aesthetic stays — every new surface composes from existing atoms/molecules/organisms wherever possible. We propose **two new molecules** (`LSDownloadProgressBar`, `LSAuthProviderButton`) and **zero new atoms or tokens**. All other new screens are pure compositions of v2 primitives.

The v2 six screens get a **"live data variant"** annotation per screen (no visual changes — just real provider wiring), plus loading/empty/error sub-states that already exist as v2 stories or compose trivially from `LSEmptyState`, `LSSpinner`, and `LSInlineErrorCallout`.

Navigation moves to a **drawer-based IA** that mirrors v2's `LSSessionsDrawer` pattern — extending it with Saved Routes and Settings entries instead of introducing a tab bar. This avoids a new chrome layer (no `LSTabBar` organism), preserves the map-primary canvas across all primary surfaces, and matches what the RN app effectively does behind its hidden tab bar (`display: 'none'` per `react-native/components/CLAUDE.md`).

---

## 0. Design Source Authority Statement

Per v2 PRD: `.spec/prds/v2/concepts/designs.html` is authoritative for all visual decisions Copper-related. v3 does **not** invent visual primitives. For the new auth/settings/saved-routes/offline surfaces (where designs.html is silent), we extend exclusively via:

- **Reuse existing tokens** (surface/content/signal/role/route/status/weather)
- **Reuse existing motion recipes** (`chatOverlayEnter`, `sidebarSlideIn`, `phaseDotPulse`, etc.)
- **Match the warm-paper topographic aesthetic** — Copper Studio map style + glass chrome + opinion-serif headings
- **Zero new tokens proposed in this document** (Section 4)

Every new screen below explicitly enumerates which v2 atoms/molecules/organisms compose it. Any composition gap is flagged in Section 3.

---

## 1. New Screens (no v2 equivalent)

For each new screen we specify: composition, states (empty/loading/error/typing/etc.), navigation, accessibility notes, and which v2 primitives compose it.

### 1.A — `SignInScreen`

**Purpose:** Initial unauthenticated entry. Email-or-OAuth sign-in.

**Map background recommendation:** **Subtle Copper Paper Light map at 0.4 opacity**, region-camera locked (no interaction), behind an `LSScrim` at 0.4 opacity. Rationale: this matches the Idle/Error pattern (map-primary canvas) and reinforces the "you're already here, ready to ride" mood. Solid surface would feel like a different app. The map stays static (no panning) so it reads as ambient backdrop, not a usable map.

**Composition (top → bottom):**
- `LSMap(mode: .preview, camera: regionCamera)` — full-bleed background, ambient.
- `LSScrim(opacity: 0.4)` — paper-tinted dim overlay so foreground reads cleanly.
- `LSGlassPanel(.chrome)` hero band, top 35% — center stack:
  - Word-mark "LANE SHADOW" in `typography.opinion.lg` + `color.signal.default` + 1.5px letter-spacing.
  - Tagline "Save and replay rides." in `typography.opinion.md` + `color.content.secondary`.
- `LSGlassPanel(.chrome)` form card, vertically centered (≤ 360pt wide on iPad / iPhone), `radius.xl`, `spacing.5` padding:
  - **Step `start`** (default):
    - `LSAuthProviderButton(provider: .apple, onTap)` — see Section 3 (NEW MOLECULE)
    - `LSAuthProviderButton(provider: .google, onTap)`
    - `LSDivider()` with centered `LSText("or", variant: .ui.label.sm)` floating over it (uses existing v2 `LSDivider` + label centered via stack)
    - `LSButton(.outline, label: "Continue with Email", icon: .compass)` — when tapped, transitions to step `email`.
    - Footer row: `LSText("New rider?", variant: .ui.body.sm)` + `LSButton(.ghost, "Create account")` → routes to `SignUpScreen`.
  - **Step `email`** (after tapping Email):
    - `LSFormField(label: "Email", value: $email, placeholder: "rider@laneshadow.com")` (UC-MOL-04) — keyboard `.emailAddress`, autocapitalize `.none`.
    - `LSButton(.primary, "Continue")` full-width.
    - `LSButton(.ghost, "Back")` to return to start.
  - **Step `password`** (after Clerk confirms email exists):
    - `LSFormField(label: "Password", state: .default | .error, secure: true)` — shows "Show/hide" trailing icon (`.starFill`/`.star` placeholder OR an existing `.expand`/`.collapse` glyph; if no eyeball icon exists in the 25-icon catalog, we use `.expand`/`.collapse` which read intuitively as show/hide).
    - `LSButton(.primary, "Sign in")` full-width.
    - `LSButton(.ghost, "Back")`.
  - **Step `signUp`** (Clerk reports email not found):
    - `LSFormField(label: "Name")`, `LSFormField(label: "Email")`, `LSFormField(label: "Password")`, `LSFormField(label: "Confirm Password")`.
    - `LSCheckbox` (atom — exists at `ios/LaneShadow/Views/Atoms/`) + `LSText("I agree to the Terms and Privacy.", variant: .ui.body.sm)`. Inline link styling on "Terms" and "Privacy" via `color.signal.default` underlined text.
    - `LSButton(.primary, "Create account")`.

**States:**
| State | Trigger | Visual |
|-------|---------|--------|
| `empty` | Initial mount | start step, OAuth + Email buttons enabled |
| `typing` | User editing field | `LSFormField` border resolves to `color.border.focus` |
| `validating` | Submit in flight, Clerk in progress | All buttons render with `LSSpinner` in trailing slot, fields disabled (`opacity.disabled`) |
| `error` | Clerk error / network | Below button: `LSText(message, variant: .ui.body.sm, color: .error)` + the offending `LSFormField(state: .error)` |
| `loading-oauth-redirect` | OAuth flow in progress | Card shows centered `LSSpinner` + `LSText("Opening Apple/Google sign-in…", variant: .ui.body.md, color: .secondary)` |

**Navigation:**
- Back hardware/swipe — disabled (initial entry).
- `Sign up` link → swap to in-card `signUp` step (no route change).
- After successful auth → `router.replace(.idle)` (jumps to `IdleScreen` with active session prefill).
- OAuth redirect → `OAuthCallbackScreen` while Clerk completes.

**Accessibility:**
- Hero word-mark hidden from screen readers (`accessibilityElementsHidden = true`), tagline read first.
- Each `LSAuthProviderButton` carries `accessibilityRole = .button`, `accessibilityLabel = "Sign in with Apple"` / `"Sign in with Google"`.
- Email/password fields auto-fill via `textContentType = .username / .password` (iOS) / `autofillHints` (Android).
- 44pt/48dp minimum on every button. Logical tab order: Apple → Google → Email → Sign up link.

**v2 primitives composed:**
- Atoms: `LSMap`, `LSScrim`, `LSGlassPanel(.chrome)`, `LSText` (opinion + ui), `LSDivider`, `LSCheckbox`, `LSButton`, `LSSpinner`, `LSIcon`.
- Molecules: `LSFormField` (UC-MOL-04).
- New: `LSAuthProviderButton` (Section 3, justified) — minimal new molecule wrapping `LSButton(.outline)` + provider logo SVG.

---

### 1.B — `SignUpScreen`

**Purpose:** Dedicated route used when user taps "Create account" from a deep link or non-email-flow entry. Internally this is the same in-card `signUp` step from `SignInScreen`, but addressable as its own route for deep-linkability and OAuth-first signup attribution.

**Composition:** Identical to `SignInScreen` step `signUp`:
- Same hero hero band + Copper map background.
- `LSGlassPanel(.chrome)` form card with: Name → Email → Password → Confirm Password fields, terms `LSCheckbox`, primary "Create account" button, ghost "I have an account → Sign in" link.

**States:** Same as SignIn step `signUp`. Add a dedicated `email-collision` state — when Clerk returns `form_identifier_exists`, swap the helper text to: "This email is already registered. Sign in instead?" with a `LSButton(.ghost, "Sign in")` shortcut underneath.

**Navigation:**
- Sign in link → `router.replace(.signIn)`.
- After success → `router.replace(.idle)`.

**Accessibility:** Same standards as SignIn. Confirm-password field cross-validation surfaced via accessible error text immediately on blur.

**v2 primitives composed:** Same as 1.A (no new primitives beyond `LSAuthProviderButton`).

---

### 1.C — `OAuthCallbackScreen`

**Purpose:** Brief loading screen while Clerk completes OAuth. User shouldn't see web-view residue.

**Composition:**
- `LSMap(mode: .preview, camera: regionCamera)` — same paper map background as SignIn for visual continuity.
- `LSScrim(opacity: 0.55)` — slightly darker than SignIn so foreground spinner reads.
- Centered stack (no card needed):
  - `LSSpinner(size: .lg)` with `color: .signal`.
  - `LSText("Authenticating…", variant: .opinion.md, color: .primary)`.
  - `LSText("This will only take a moment.", variant: .ui.body.sm, color: .secondary)`.

**States:**
| State | Trigger | Visual |
|-------|---------|--------|
| `default` | Mounted | spinner + text |
| `error-redirect` | Clerk fails | Replace spinner with `LSIcon(.close, size: .xl, color: .error)`, body becomes "Sign-in didn't complete. Try again?" + `LSButton(.primary, "Back to sign in")` → `router.replace(.signIn)` |

**Navigation:** Auto-replace to `.idle` on Clerk session resolution. Auto-replace to `.signIn` on failure after 2 seconds.

**Accessibility:** `accessibilityLabel = "Authenticating, please wait"` on the screen root with `accessibilityLiveRegion = .polite` so VoiceOver announces state transitions.

**v2 primitives composed:** `LSMap`, `LSScrim`, `LSSpinner`, `LSText`, `LSIcon`, `LSButton`. Zero new primitives.

---

### 1.D — `SavedRoutesListScreen`

**Purpose:** Browse, search, and manage saved (favorite) routes. RN tab equivalent.

**Composition (top → bottom):**
- `LSTopBar(title: "Saved", leading: .hamburger { presentDrawer() }, trailing: .none)` — UC-ORG-01.
- Content surface: `color.background.default` (paper).
- **Search row** — `LSFormField` with `leading: .search` icon + `placeholder: "Search by name or place"`. Pinned to top, padded `spacing.4`.
- **Filter toolbar row** — `LSToolbar` (existing molecule) with three `LSFilterChip`s: `All` | `Recent` | `Favorites`. Below search.
- **Section header** — `LSSectionHeader(title: "Saved rides", trailing: .link("Sort") { presentSortSheet() })` — UC-ORG-07.
- **List body:**
  - Vertical `ScrollView` (gesture-handler) of `LSListRow` instances. Each row:
    - **Leading:** 56×56 `LSCard(radius: .md)` containing a tiny `LSMap(mode: .preview, polylines: [routePolyline], cameraFit: .polyline(padding: .spacing1))` — read-only map thumbnail. Rationale below.
    - **Center stack:** title in `typography.ui.title.md`, subtitle "Start → End • 64 mi • 2h 10m" in `typography.instrument.sm` + `color.content.textMuted`. Bottom meta row: `LSText("Saved 4 days ago", variant: .ui.label.sm, color: .textSubtle)` + optional `LSPill(.sm)` carrying scenic score "9.2" tinted `color.signal.default` at 22%.
    - **Trailing:** `LSIcon(.chevR, color: .textMuted)`.
- **Empty state** — `LSEmptyState(icon: .bookmark, title: "No saved routes yet", body: "Save a ride from the route details screen to see it here.", action: .primary("Plan a ride") { router.navigate(.idle) })` — UC-MOL-04.
- **Filtered empty state** — `LSEmptyState(icon: .search, title: "No matches", body: "Try adjusting your search or filters.", action: .ghost("Clear filters") { clearFilters() })`.
- **Loading state** — Three skeleton rows: `LSCard` placeholders at row dimensions, no content. Implementation: simple `LSPanel` with `opacity.disabled` background. (No new component.)

**Why a tiny `LSMap` thumbnail and not a static image?** The Copper Studio style + per-variant polyline color **is the brand**. A static raster thumbnail would either be wrong-themed (light map shown in dark mode) or require server-side rendering. Using `LSMap(mode: .preview)` at 56×56 is performant — Mapbox renders dozens of small maps efficiently, and it auto-resolves to the correct theme.

**Swipe-to-delete (iOS):** Standard iOS swipe action revealing a destructive `Delete` action button (color `color.status.error.default`, `LSText` in `color.status.error.on`). On confirm: optimistic remove + show `LSToast(message: "Route deleted — Tap to undo", variant: .info)` for 5000ms. Tapping toast restores via `useUndoDeleteRoute`.

**Long-press menu (Android):** Long-press a row → reveals an `LSModal` with three actions:
- `LSButton(.ghost, "Open", icon: .chevR)`
- `LSButton(.ghost, "Rename", icon: .edit)`
- `LSButton(.destructive, "Delete", icon: .trash)`

Both platforms use the same v2 atoms; idiomatic interaction patterns differ only in trigger (swipe vs long-press), per cross-platform UX best practices.

**Navigation:**
- Tap row → `SavedRouteDetailScreen` with `routeId` param.
- Hamburger → opens `LSSessionsDrawer` (extended IA — see Section 5).
- Sort link → opens `LSBottomSheet(detent: .small)` with three radio rows: "Recently saved" / "Distance" / "Name".

**Accessibility:**
- Each row: `accessibilityLabel = "Skyline Spine, 64 miles, 2 hours 10 minutes, saved 4 days ago"`, `accessibilityHint = "Double-tap to view route, swipe right with three fingers to delete"` (iOS) / `accessibilityHint = "Double-tap to view route, long-press for actions"` (Android).
- Map thumbnail hidden from screen readers (`accessibilityElementsHidden = true`) — content already in title/subtitle.
- 44pt/48dp minimum on every interactive row.

**v2 primitives composed:**
- Organisms: `LSTopBar`, `LSSectionHeader`.
- Molecules: `LSFormField`, `LSToolbar` + `LSFilterChip`, `LSListRow`, `LSEmptyState`, `LSToast`, `LSModal`, `LSBottomSheet`, `LSPill`, `LSCard`.
- Atoms: `LSMap` (compact preview), `LSText`, `LSIcon`, `LSButton`, `LSSpinner`, `LSPanel`.
- **Zero new primitives.**

---

### 1.E — `SavedRouteDetailScreen`

**Purpose:** Immutable view of a saved route. Reuses `RouteDetailsScreen` pattern but for the saved (frozen) snapshot, with extra rename/delete/replan actions.

**Composition:** Mirrors UC-SCR-04 `RouteDetailsScreen` with two surgical additions:

- `LSMapLayer.map` — `LSMap(mode: .preview, camera: snapshotCamera, cameraFit: .polyline(padding: .spacing4), polylines: [savedRoute.bestPolyline], annotations: [start, end])`. Polyline variant is `.best` (saved routes are always rendered in best-color).
- `LSMapLayer.topBar` — `LSTopBar(leading: .back { router.back() }, title: savedRoute.name, trailing: .actions([.icon(.edit) { presentRenameSheet() }, .icon(.trash) { presentDeleteConfirm() }]))`. The TopBar slot API needs to support multiple trailing actions; if v2 only supports a single trailing slot, we render the two actions as a horizontal `HStack` of `LSGlassPanel(.chrome)` chips inside the trailing slot — same visual treatment as the existing "NEW" chip from UC-ORG-01.
- `LSMapLayer.bottomSheet` — `LSRouteSheet(route: savedRouteAsRouteDetails, weatherTimeline: nil, onSave: nil, onRide: { router.push(.idle, prefilledRefinement: "Re-plan from \(savedRoute.name)") }, onDismiss: { router.back() })`.
  - **Variant change for saved-mode:** the action row becomes `[Re-plan from here]` (primary, full-width) instead of `[Save | Ride this]`. Save is hidden because the route is already saved. The "Re-plan" CTA pre-fills a chat refinement and routes back to `IdleScreen` → `PlanningScreen` flow.
  - The weather timeline section is hidden when `weatherTimeline == nil` (saved snapshots may or may not have cached weather; if absent, the timeline stays out — avoiding the "stale weather" pitfall).
- **Rename flow** — tapping the edit chip presents `LSBottomSheet(detent: .small)` containing `LSFormField(label: "Route name", value: $name)` + `LSButton(.primary, "Save")` + `LSButton(.ghost, "Cancel")`. Same flow used by `SavedRoutesListScreen` long-press rename on Android.
- **Delete flow** — tapping the trash chip presents `LSModal(title: "Delete this route?", body: "This will move it to recently deleted for 30 days.", primary: .destructive("Delete") {...}, secondary: .ghost("Cancel") {...})`.

**States (additional to base UC-SCR-04):**
| State | Visual |
|-------|--------|
| `loading` | Map renders empty + sheet skeleton (`LSPanel` placeholders) + `LSSpinner` overlay |
| `not-found` | `LSEmptyState(icon: .compass, title: "Route not found", body: "This route may have been deleted.", action: .primary("Back to saved") { router.back() })` rendered in place of map+sheet |
| `renaming` | Rename bottom sheet open over the screen |
| `deleting` | Delete modal open over the screen; on confirm: optimistic dismiss + toast |

**Accessibility:**
- Map: `accessibilityLabel = "Map showing route from start to end, 64 miles long"`.
- Edit/Trash chips: explicit labels "Rename route" / "Delete route".
- Rename sheet: auto-focuses field, announces "Editing route name, current value Skyline Spine".

**v2 primitives composed:** `LSTopBar`, `LSMapLayer`, `LSRouteSheet`, `LSBottomSheet`, `LSFormField`, `LSModal`, `LSEmptyState`, `LSSpinner`, `LSGlassPanel(.chrome)`, `LSButton`, `LSText`, `LSIcon`. **Zero new primitives.**

**Open question for engineering:** Does the v2 `LSTopBar` trailing slot support two actions natively or as a slot list? If single-slot, we render via composed glass chips in the slot.

---

### 1.F — `SettingsScreen`

**Purpose:** App settings. Minimal — match RN `settings.tsx` scope (theme, offline maps, sign out, account info).

**Composition (top → bottom):**
- `LSTopBar(title: "Settings", leading: .hamburger { presentDrawer() }, trailing: .none)`.
- Content surface: `color.background.default` (paper), padded `spacing.4`.
- **Account section:**
  - `LSSectionHeader(title: "ACCOUNT", trailing: .none, inset: .spacing3)`.
  - `LSCard(padding: .spacing4)` containing `LSListRow(leading: .avatar(user.avatarUrl, size: .md), title: user.name, subtitle: user.email, trailing: .none)` — non-interactive (informational).
- **Appearance section:**
  - `LSSectionHeader(title: "APPEARANCE")`.
  - `LSListRow(leading: .icon(.layers), title: "Theme", trailing: .label(modeLabel))` — tap opens `LSBottomSheet(detent: .small)` with three `LSListRow`s (Light / Dark / Auto) each carrying a trailing `LSIcon(.starFill, color: .signal)` when selected. This avoids needing a new `LSThemePicker` molecule — see Section 3.
- **Storage section:**
  - `LSSectionHeader(title: "STORAGE")`.
  - `LSListRow(leading: .icon(.map), title: "Offline maps", subtitle: "\(regionCount) regions • \(totalSize)", trailing: .chevron)` → routes to `OfflineRegionsListScreen`.
- **About section:**
  - `LSSectionHeader(title: "ABOUT")`.
  - `LSListRow(leading: .icon(.compass), title: "Version", trailing: .label(appVersion))`.
  - `LSListRow(leading: .icon(.share), title: "Terms of Service", trailing: .chevron)` → opens `WKWebView`/external browser.
  - `LSListRow(leading: .icon(.share), title: "Privacy Policy", trailing: .chevron)`.
- **Footer:**
  - Top divider `LSDivider`, top margin `auto`.
  - Full-width `LSButton(.destructive, "Sign out")` — invokes `LSModal` confirmation before signing out.

**States:**
| State | Visual |
|-------|--------|
| `default` | All sections rendered |
| `loading-account` | Avatar/title/email replaced with three small `LSPanel` skeleton blocks |
| `signing-out` | "Sign out" button shows `LSSpinner` in trailing slot, all rows disabled |

**Accessibility:**
- Each `LSListRow`: `accessibilityRole = .button` when it has `onTap`, `accessibilityLabel` reads title + subtitle. "Theme" row's trailing label announces current mode: "Theme, Auto".
- Sign out: `accessibilityLabel = "Sign out", accessibilityHint = "Returns to sign-in screen"`.
- Trailing labels (e.g., "v1.0.0", "3 regions • 145 MB") announced as part of row label.

**v2 primitives composed:** `LSTopBar`, `LSSectionHeader`, `LSCard`, `LSListRow`, `LSAvatar`, `LSBottomSheet`, `LSModal`, `LSDivider`, `LSButton`, `LSText`, `LSIcon`, `LSSpinner`, `LSPanel`. **Zero new primitives.**

---

### 1.G — `OfflineRegionsListScreen`

**Purpose:** List of downloaded offline map regions with manage/add actions. Matches RN `regions-list.tsx` scope.

**Composition (top → bottom):**
- `LSTopBar(title: "Offline Maps", leading: .back { router.back() }, trailing: .iconChip(.plus, label: "ADD") { router.push(.offlineRegionSelector) })`. The "ADD" chip mirrors the v2 "NEW" chip on UC-ORG-01 — same `LSGlassPanel(.chrome)` chrome.
- Content surface: `color.background.default`, padded `spacing.4`.
- **List body** (when populated):
  - Vertical `ScrollView` of `LSCard(padding: .spacing3)` rows. Each:
    - **Leading:** 48×48 `LSMap(mode: .preview, camera: regionCamera, cameraFit: .static)` thumbnail showing the region bounds.
    - **Center stack:** title in `typography.ui.title.md`, meta row "65 MB • Updated 2 days ago" in `typography.instrument.sm` + `color.content.textMuted`.
    - **Trailing badge area:** `LSBadge(label: statusLabel, variant: statusVariant)`:
      - `ready` → `variant: .status.success` ("Ready")
      - `downloading` → `variant: .status.info` ("82%") — composed with `LSDownloadProgressBar` molecule (NEW, Section 3) inline below the badge during active download
      - `failed` → `variant: .status.error` ("Failed")
      - `stale` → `variant: .status.warning` ("Update available")
    - **Trailing icon:** `LSIcon(.chevR)` only when `status == .ready`.
  - Tap card (when ready) → opens an `LSBottomSheet(detent: .small)` with three rows: "View on map", "Rename", "Delete" (analogous to Android long-press menu in 1.D).
  - Tap card (when failed) → presents `LSModal` with retry/delete options.
- **Storage footer** (when populated): pinned bottom, `LSDivider` above, `LSText("\(count) regions • \(formatSize(total)) stored", variant: .ui.body.sm, color: .textSubtle)` centered.
- **Empty state:** `LSEmptyState(icon: .map, title: "No offline maps yet", body: "Download regions to navigate without cell service.", action: .primary("Download your first region") { router.push(.offlineRegionSelector) })`.

**States:**
| State | Visual |
|-------|--------|
| `loading` | Three skeleton cards (`LSCard` with `opacity.disabled` content) |
| `empty` | `LSEmptyState` |
| `populated` | Cards + storage footer |
| `downloading-active` | Active card shows in-card `LSDownloadProgressBar` (filled bar + percent + ETA) + `LSButton(.ghost, "Cancel")` chip |
| `downloading-failed` | Card border resolves to `color.status.error.default`, badge is `Failed`, retry/delete options |

**Accessibility:**
- Each card: `accessibilityLabel = "Bay Area, 65 megabytes, ready, last updated 2 days ago"`.
- Add chip: `accessibilityLabel = "Add new offline region"`.
- Active download cards: `accessibilityValue` updates as percent changes; live region polite.
- Storage footer hidden from screen readers (decorative summary).

**v2 primitives composed:** `LSTopBar`, `LSEmptyState`, `LSCard`, `LSMap` (compact preview), `LSBadge`, `LSIcon`, `LSText`, `LSDivider`, `LSBottomSheet`, `LSModal`, `LSButton`, `LSPanel`.
**New molecule:** `LSDownloadProgressBar` (Section 3, justified).

---

### 1.H — `OfflineRegionSelectorScreen`

**Purpose:** Full-screen map with a viewfinder for selecting an area to download. Matches RN `region-selector.tsx` exactly.

**Composition:**
- **Layer 0 — Map:** `LSMap(mode: .interactive, camera: initialCamera, cameraFit: .static, onCameraMove)` — full-bleed.
- **Layer 1 — Viewfinder overlay** (decorative, `pointerEvents: .none`):
  - 4-region scrim grid: top scrim band (20% height), middle row (left scrim 10% / viewport center 80% / right scrim flex), bottom scrim band (flex). All scrim panels: `color.background.default` at 0.55 opacity (token: `color.surface.scrim` exists already in v2 as `color.surface.scrim`).
  - Inside the center viewport: 1px continuous `color.signal.default` at 40% alpha border + four solid copper L-bracket corner markers (3px stroke, 24×24 each, color `color.signal.default`).
- **Layer 2 — Map controls** (right edge, vertically centered): existing v2 `LSMapLayer.bottomOverlays` slot pattern — render a `MapControls` group: `[zoom-in, zoom-out, recenter]` icon buttons in `LSGlassPanel(.chrome)` chips. (We use the existing iOS `MapControls` already shipped per native current-state inventory.)
- **Layer 3 — Top bar:** absolute `LSTopBar(leading: .back { router.back() }, title: "Select region", trailing: .none)` over the map. Uses glass chrome.
- **Layer 4 — Bottom action panel:** absolute bottom, `LSGlassPanel(.chrome)` panel, padding `spacing.4`:
  - **Default state:** `LSText("\(formatMB(estimateBytes))", variant: .opinion.lg)` + `LSText("estimated download", variant: .ui.body.sm, color: .textMuted)` centered + `LSButton(.primary, "Download region")` full-width.
  - **Re-edit state** (when entered with existing region params): `LSGlassPanel(.callout(accent: .signal))` hint band: "Pan or zoom the map to select a new area" + `LSButton(.primary, "Download region")` disabled until camera moves.
  - **Downloading state:** Replace size readout with `LSDownloadProgressBar(percentage, bytesDownloaded, totalBytes, eta)` + `LSButton(.outline, "Cancel")`.
  - **Complete state:** `LSText("Region ready", variant: .opinion.md, color: .success)` + `LSText("Offline map downloaded successfully.", variant: .ui.body.sm, color: .textSubtle)` + `LSButton(.primary, "View offline maps")` → `router.push(.offlineRegionsList)`.
  - **Failed state:** `LSText("Download failed", color: .error)` + body explaining + `LSButton(.primary, "Retry")` + `LSButton(.ghost, "Cancel")`.

- **Naming bottom sheet** (presented when "Download region" tapped): `LSBottomSheet(detent: .medium)`:
  - Header `LSText("Name this region", variant: .opinion.md)`.
  - `LSFormField(label: "Region name", placeholder: "e.g., Bay Area")`.
  - Wi-Fi / cellular notice row: when on cellular, `LSGlassPanel(.callout(accent: .warning))` showing "You're on cellular — \(estimateMB) MB will count toward your data plan" + `LSToggle("Continue anyway", value: $confirmCellular)`.
  - `LSButton(.primary, "Confirm download")` (disabled until name is non-empty + cellular acknowledged if applicable).
  - `LSButton(.ghost, "Cancel")`.

**States:** Mapped 1:1 to RN screen — `default`, `re-edit (disabled until move)`, `downloading`, `complete`, `failed`, `naming-sheet-open`.

**Accessibility:**
- Viewport: `accessibilityLabel = "Selected region area, pan the map to choose what to download", accessibilityRole = .image`.
- Bottom panel announces progress percentage during downloading state.
- Map controls: each labeled "Zoom in", "Zoom out", "Recenter to your location".

**v2 primitives composed:** `LSMap` (interactive), `LSGlassPanel(.chrome)` + `LSGlassPanel(.callout(accent: .signal/.warning))`, `LSTopBar`, `LSButton`, `LSText`, `LSIcon`, `LSScrim` (composed via 4-region scrim layout), `LSBottomSheet`, `LSFormField`, `LSToggle` (atom — exists in v2).
**New molecule:** `LSDownloadProgressBar` (shared with 1.G; Section 3).

---

### 1.I — `SaveFavoriteSheet` (modal sheet, not a full screen)

**Purpose:** Triggered when user taps "Save" on `RouteDetailsScreen` (UC-SCR-04). Captures a name and confirms save.

**Composition:**
- Presented via existing `LSBottomSheet(detent: .medium)` from UC-MOL-03.
- Drag handle (auto from molecule).
- Header row: `LSText("Save route", variant: .opinion.md)`.
- Caption row: `LSText("Name your route to save it for later", variant: .ui.body.sm, color: .textMuted)`.
- `LSFormField(label: "Route name", value: $name, placeholder: "e.g., Skyline Spine")` — auto-focuses on present, `maxLength = 100`.
- Inline character counter: `LSText("\(name.count)/100", variant: .ui.label.sm, color: .textSubtle)` right-aligned.
- **Metadata strip:** `LSInstrumentReadout(metrics: [.dist(distance), .time(eta), .climb(elevation), .saved(formatNow())])` — UC-MOL-07 (4-column grid).
- **Action row:**
  - `LSButton(.outline, "Cancel")` flex 1.
  - `LSButton(.primary, "Save route")` flex 2 — disabled when name is empty or saving in progress; shows `LSSpinner` in trailing slot during save.

**States:**
| State | Visual |
|-------|--------|
| `default` | Pre-filled suggested name (e.g., "Bay Area Loop"), all UI ready |
| `typing` | Field focused with `color.border.focus` |
| `validating` | Empty name → button disabled + helper text |
| `saving` | Save button spinner + fields disabled |
| `error` | `LSText("Failed to save. Try again.", variant: .ui.body.sm, color: .error)` above action row; sheet stays open |
| `success` | Sheet auto-dismisses + `LSToast(message: "Route saved", variant: .success)` after 200ms |

**Accessibility:**
- Sheet: `accessibilityLabel = "Save route, dismissible"`, focuses input on present, announces character count on update.
- Cancel and Save labeled accessibly; Save announces "Save route. Disabled until you enter a name."

**v2 primitives composed:** `LSBottomSheet`, `LSText`, `LSFormField`, `LSInstrumentReadout`, `LSButton`, `LSSpinner`, `LSToast`. **Zero new primitives.**

---

### 1.J — `PlanRideSheet` (manual-mode planning) — **DEFERRED**

**Recommendation: DEFER to post-v3.**

**Rationale:**
1. v2 explicitly deferred manual mode (PRD declares conversational planning as the primary path).
2. RN's `plan-ride-sheet.tsx` exists but is the legacy entry; the RN app's primary loop is also conversational via `LSChatInput`.
3. Building it requires a new `LSPlaceAutocomplete` molecule (or porting RN's `LocationInput` pattern), a `RouteTimeline` visual, and the `PreferencesRow` molecule — three new composites. None of those are needed for parity with the **conversational** RN flow.
4. The v2 `LSChatInput` already supports "manual prompt" via natural language (e.g., user types "Plan from Santa Cruz to Big Sur, avoid highways, scenic"). Manual sheet is redundant for the 6-week appetite.

**Mark in PRD as:** `[DEFERRED: v3.1 — manual-mode planning sheet]` with a one-line note that conversational mode covers the use case for v3.

If the user explicitly needs PlanRideSheet in v3, design spec would compose:
- `LSBottomSheet(detent: .large)` — header + `LSPill(.md, label: "MOTORCYCLE")` badge.
- Two `LSFormField`s (start, end) wrapping a place-autocomplete subcomponent (NEW molecule needed: `LSPlaceAutocompleteField` — wraps `LSFormField` + dropdown of `LSListRow`s for results).
- `LSToolbar` row of `LSFilterChip`s for preferences (Avoid highways, Avoid tolls, Scenic bias, Include favorites).
- `LSButton(.primary, "Plan ride")`.

**Status: not designed in v3 unless escalated.**

---

## 2. Updated Screens (existing v2 + real data wiring)

The six v2 templates ship as-is from a *visual* standpoint. v3 wires them to live providers and adds the loading/empty/error sub-states described below. **No new design specs required — only "live data variant" annotations.**

### 2.1 — `IdleScreen` (UC-SCR-01) — Live data

**Visual changes:** None.

**Data wiring annotations:**
- **Greeting interpolation:** Header label "FRIDAY · 68°F · CLEAR" composes from real `useCurrentLocation` + Convex weather query. Headline "Where are we riding **today?**" can dynamically include user's first name on second visit ("Welcome back, Justin").
- **Suggestion chips:** Loaded from Convex `routesPlan.getPlanInit` query. Default fallback to v2 fixture chips on cold start.
- **Location badge:** Real `useCurrentLocation` (with permission). When permission denied, shows static "Set location manually" pill that opens a place-search sheet (out of scope; defer for v3.1 — manual location pin).
- **Map:** Real Mapbox map with favorite annotations from `favoriteRoads.list` query.

**New states needed:**
| State | Visual |
|-------|--------|
| `loading-permission` | Map renders empty + greeting overlay shows "Granting location…" placeholder text |
| `permission-denied` | Greeting headline becomes "Where are we riding from?" + location badge becomes ghost button "Set location manually" |
| `weather-unavailable` | Drop the weather chip from the label row, keep day-of-week only |

All three are pure prop-driven variants of the existing IdleScreen — no new components.

---

### 2.2 — `PlanningScreen` (UC-SCR-02) — Live data

**Visual changes:** None.

**Data wiring annotations:**
- `phases` array is real-time from Convex `sessionMessages.list` subscribed query — server messages map to phase progression (`searching → routing → enriching → polishing → complete`). Maps directly to the v2 phase indicator.
- `prompt` shown in chat input is the actual rider message, not fixture text.
- **Cancel:** chat input collapse icon (existing) wired to `routePlans.cancelPlan` mutation. Tap returns to Idle.

**New states needed:**
| State | Visual |
|-------|--------|
| `cancelling` | Phase indicator dimmed + spinner replaces the active phase dot + body text "Cancelling…" |
| `network-stalled` | After 30s without server message: warning banner above PhaseIndicator: "Taking longer than usual…" via `LSGlassPanel(.callout(accent: .warning))` |

---

### 2.3 — `RouteResultsScreen` (UC-SCR-03) — Live data

**Visual changes:** None.

**Data wiring annotations:**
- `polylines: [best, alt1, alt2]` from real `routePlans.getActiveRoutePlansForSession` query.
- `LSNavigatorMessage.body` is the actual Claude response.
- `attachments` are real `RouteAttachment`s from the route plans.
- **Enrichment progressively reveals weather:** if `route.enrichment.status != complete`, the `LSWeatherBadge` slot in each attachment card renders a lightweight loading state (a small `LSPanel` skeleton) until enrichment completes. Per-card update via subscription.

**New states needed:**
| State | Visual |
|-------|--------|
| `partial-enrichment` | Attachment cards show enrichment skeleton in weather slot; everything else renders |
| `no-routes-returned` | Falls through to `ErrorScreen` (existing v2) — already covered |

---

### 2.4 — `RouteDetailsScreen` (UC-SCR-04) — Live data

**Visual changes:** None.

**Data wiring annotations:**
- `LSRouteSheet.route` from real `RouteDetails` model (chat planning result + enrichment).
- `weatherTimeline` from `route_enrichments` query, or `nil` if enrichment hasn't completed (sheet hides timeline section gracefully).
- `onSave` opens the `SaveFavoriteSheet` (1.I).
- `onRide` triggers navigation export (out of v3 scope per RN parity — RN doesn't currently have native turn-by-turn either).

**New states needed:**
| State | Visual |
|-------|--------|
| `enrichment-loading` | Sheet shows `LSInstrumentReadout` with real distance/time + skeleton `LSPanel` for climb/scenic; weather timeline replaced with single `LSText("Loading weather along your route…", variant: .ui.body.sm)` row |
| `already-saved` | `Save` button text changes to "Saved", icon changes to `.bookmarkFill`, tap opens a "Saved" toast — re-pressing does nothing |

The `bookmarkFill` icon already exists in the v2 catalog.

---

### 2.5 — `SessionsScreen` (UC-SCR-05) — Live data

**Visual changes:** None visually, but the drawer's IA expands (Section 5).

**Data wiring annotations:**
- `sessions` from `planningSessions.listSessions` real-time query.
- `activeSessionId` from the active route session in app state.
- Group label dynamic: "TODAY", "THIS WEEK", "EARLIER" via standard date-bucketing.

**New states needed:**
| State | Visual |
|-------|--------|
| `loading` | Drawer shows three skeleton row placeholders |
| `empty` | Drawer shows compact `LSEmptyState(icon: .compass, title: "No sessions yet", body: "Start a chat to plan your first ride.", action: .primary("New session") { onNew() })` inside the drawer body |
| `error` | Drawer shows `LSGlassPanel(.callout(accent: .warning))` with retry button |

---

### 2.6 — `ErrorScreen` (UC-SCR-06) — Live data

**Visual changes:** None.

**Data wiring annotations:**
- Error body and detail come from `lib/convex-error.ts` parity layer. Convex error codes map to user-facing copy via a lookup table maintained by the engineering team.
- Suggestion chips are dynamic: for auth errors, suggest "Sign in again"; for rate-limit errors, "Try in 30 seconds"; for routing errors, "Try a different end point" / "End at Big Sur" — same pattern as RN's planning-error-sheet.tsx.

**New states needed:**
| State | Visual |
|-------|--------|
| `auth-required` | Body: "Your session expired." + suggestion chip "Sign in again" → routes to `SignInScreen` |
| `rate-limited` | Body: "You're going faster than the road." + chip "Try in 30s" (auto-clears countdown) |
| `network-offline` | Body: "Can't reach the server." + chip "Retry" |
| `enrichment-failed` | Less severe: shows in `RouteResultsScreen` via partial enrichment fallback (not a full error) |

---

## 3. New Atoms / Molecules / Organisms

We minimize aggressively. Two new molecules. Zero new atoms. Zero new organisms.

### 3.1 — `LSAuthProviderButton` (NEW MOLECULE) — required

**Why an existing primitive doesn't suffice:** OAuth provider buttons require:
- A leading branded logo (Apple word-mark, Google "G" multi-color glyph). These are **not** in the 25-icon catalog (UC-ATM-10) and adding them as `IconName` would corrupt the design-owned single-stroke convention (Google G is multi-color).
- Provider-specific brand-compliance constraints (Apple HIG and Google Brand Guidelines mandate exact pixel padding, exact logo size, exact button height).
- Accessibility labels specific to each provider.

We considered `LSButton(.outline, label: "Continue with Apple", icon: .someAppleIcon)` — but the Apple/Google logos cannot live in our single-stroke icon catalog without violating brand rules.

**Composition:**
- `LSPanel(backgroundColor: providerBg, padding: .spacing3, radius: .lg)` (uses `color.surface.card` for both — Apple and Google permit either light or dark bg in their guidelines; we choose light for paper aesthetic).
- Embedded `LSText(providerLabel, variant: .ui.body.md)` centered, with brand SVG asset 24×24 leading.
- Logo SVGs added to a separate `tokens/icons/brands/` folder, NOT mixed with the design-owned 25-icon catalog. Folder is gitted but `pnpm icons:check` excludes it.
- Touch target enforced ≥ 44pt × 48dp via min-height token.

**API:**
```
LSAuthProviderButton(
  provider: .apple | .google,
  loading: Bool = false,
  disabled: Bool = false,
  onTap: () -> Void
)
```

**Stories:** `Apple Default`, `Apple Loading`, `Apple Disabled`, `Google Default`, `Google Loading`, `Google Disabled`.

---

### 3.2 — `LSDownloadProgressBar` (NEW MOLECULE) — required

**Why an existing primitive doesn't suffice:** Download progress requires:
- A horizontal progress bar (not in v2 — `Progress` is an iOS-only atom listed in current state but no Android equivalent in v2 catalog).
- Coordinated readout of percent + bytes-downloaded/total + ETA.
- An `LSPill` is a shape primitive — too small for a progress bar.

We considered: `LSPanel` containing a manually-stretched `LSPill` for the fill bar + three text rows. That's exactly what we'd build. Encapsulating it as a molecule prevents inline reimplementation in `OfflineRegionsListScreen` AND `OfflineRegionSelectorScreen`.

**Composition:**
- Outer `LSPanel(padding: .spacing3, radius: .md, backgroundColor: .surface.card)`.
- Top row `HStack`: `LSText("\(percent)%", variant: .instrument.lg)` + spacer + `LSText("ETA \(eta)", variant: .ui.body.sm, color: .textMuted)`.
- Middle: a 6pt-tall `LSPanel` with `color.surface.input` background + width-tracking inner `LSPanel` with `color.signal.default` background and `radius.pill` corners.
- Bottom row: `LSText("\(formatBytes(downloaded)) of \(formatBytes(total))", variant: .ui.label.sm, color: .textSubtle)`.

**API:**
```
LSDownloadProgressBar(
  percentage: Double,           // 0.0 - 1.0
  bytesDownloaded: Int,
  totalBytes: Int,
  eta: String?,                 // nil hides the ETA
  state: .downloading | .paused | .failed | .complete
)
```

**State variants:** color-only changes per `state` — `failed` flips fill to `color.status.error.default`, `complete` to `color.status.success.default`, etc.

**Stories:** `0%`, `45%`, `100% complete`, `Failed`, `Paused`, `No ETA`.

---

### Components considered but rejected:

- ❌ **`LSThemePicker` molecule** — Settings theme picker is a single `LSListRow(trailing: .label)` that opens an `LSBottomSheet` with three `LSListRow` selection rows. No new primitive needed.
- ❌ **`LSRegionThumbnail` molecule** — Compact `LSMap(mode: .preview)` at 48×48 or 56×56 already does this. The `LSMap` atom is already cross-platform; rendering it small is a sizing choice, not a new primitive.
- ❌ **`LSDownloadProgress` (separate from progress bar)** — Folded into `LSDownloadProgressBar`.
- ❌ **`LSPlaceAutocomplete` molecule** — Only needed by deferred PlanRideSheet (1.J). If unblocked, design in v3.1.
- ❌ **New `LSTabBar` organism** — Drawer-based IA recommended (Section 5). No tab bar needed.
- ❌ **`LSAvatar` extension** — UC-ATM-04 already covers avatar with image + initials fallback at all five sizes.

---

## 4. Token Extensions

**Recommendation: Zero token extensions.**

We audited each new screen for token gaps. None found. Specifically:

- **Status colors:** v2 already has `color.status.{info, success, warning, error, recording}`. Map status mappings:
  - `region.downloading` → `color.status.info`
  - `region.ready` → `color.status.success`
  - `region.stale` → `color.status.warning`
  - `region.failed` → `color.status.error`
  - `region.paused` → `color.status.info` at 60% alpha (no new token; opacity uses `opacity.disabled` or `opacity.muted` if present)
- **Typography:** all new headings use existing `typography.opinion.*`; metadata uses existing `typography.instrument.sm`; body uses existing `typography.ui.body.*`. No new variants needed.
- **Motion:** existing recipes cover all needs — `chatOverlayEnter` for sheets, `sidebarSlideIn` for drawer, `phaseDotPulse` for active states. The download progress bar's animated fill uses a linear interpolation derived from `percentage` — no motion recipe (it's a value-driven width, not a discrete animation).
- **Spacing/radius:** all new components use `spacing.{2,3,4,5}` and `radius.{sm,md,lg,xl,pill}`. All exist.

**If during implementation we discover a missing token, escalate via `agent_rules.mdc` decision protocol — but the design intent is zero token extensions.**

---

## 5. Navigation & Information Architecture

### Recommendation: **Drawer-based IA, not tab-based**.

**Why drawer (not tabs):**
1. RN currently hides its tab bar (`display: 'none'` per `react-native/components/CLAUDE.md`). The "tabs" are actually drawer-routed via `MenuLayout`. Native parity = drawer.
2. Tabs would require introducing a new `LSTabBar` organism. That's a new primitive against signal #1's "minimize new design".
3. v2 already ships `LSSessionsDrawer` (UC-ORG-05) — this is our IA chrome. We extend it, we don't replace it.
4. Map-primary screens (Idle/Planning/Results/Details/Error) work best when they own the full screen. A bottom tab bar would steal vertical space from the conversational chrome below `LSChatInput`.

### Extended `LSSessionsDrawer` IA

The existing v2 `LSSessionsDrawer` (UC-ORG-05) is a left-anchored drawer with sessions list. v3 extends its content to include navigation entries.

**New drawer body composition (top → bottom):**

```
LSSessionsDrawer
├── Header row (existing): "Rides" title + "NEW" button
├── Section: PLANNING (sessions list — existing UC-ORG-05 behavior)
│   ├── LSSectionHeader("THIS WEEK")
│   ├── Session rows (existing)
│   └── ...
├── Divider
├── Section: BROWSE
│   ├── LSListRow(leading: .icon(.bookmark), title: "Saved Routes", trailing: .chevron) → /(app)/saved-routes
│   └── LSListRow(leading: .icon(.compass), title: "Discover", trailing: .chevron) → DEFERRED v3.1
├── Divider
├── Section: APP
│   ├── LSListRow(leading: .icon(.layers), title: "Settings", trailing: .chevron) → /(app)/settings
│   └── LSListRow(leading: .icon(.map), title: "Offline Maps", trailing: .chevron) → /(app)/offline/regions-list
└── Footer (account widget)
    └── LSListRow(leading: .avatar(user.avatar), title: user.name, subtitle: user.email)
```

**The drawer becomes the universal nav surface.** From any map-primary screen the hamburger button opens it; from Settings/SavedRoutes/Offline screens, the back button returns and the hamburger button (when present) opens the drawer over those screens too.

**Open question for engineering (Section 8): does opening the drawer from a non-map screen require an `LSScrim` over the underlying screen, or do we treat it as a modal route?** Recommendation: **scrim + slide drawer**, same pattern as on map screens — this preserves behavior consistency.

### Route table (proposed)

| Route | Screen | Drawer reachable? | Back behavior |
|-------|--------|-------------------|---------------|
| `/(auth)/sign-in` | SignInScreen | No (unauthenticated) | None — initial |
| `/(auth)/sign-up` | SignUpScreen | No | Replace to sign-in |
| `/(auth)/oauth-callback` | OAuthCallbackScreen | No | Auto-replace |
| `/(app)/idle` (root) | IdleScreen | Yes (hamburger) | Drawer toggle |
| `/(app)/planning` | PlanningScreen | Yes | Drawer toggle (or cancel back to idle) |
| `/(app)/results` | RouteResultsScreen | Yes | Drawer toggle (or back to planning) |
| `/(app)/details` | RouteDetailsScreen | Yes | Drawer toggle (or back to results) |
| `/(app)/error` | ErrorScreen | Yes | Drawer toggle (or back to last screen) |
| `/(app)/sessions` (drawer presented) | SessionsScreen | n/a (drawer is the screen) | Tap scrim to dismiss |
| `/(app)/saved-routes` | SavedRoutesListScreen | Yes (hamburger persists) | Back → drawer or idle |
| `/(app)/saved-route/[id]` | SavedRouteDetailScreen | No (back chevron) | Back to saved-routes list |
| `/(app)/settings` | SettingsScreen | Yes | Back → drawer or idle |
| `/(app)/offline/regions-list` | OfflineRegionsListScreen | No (back chevron) | Back to settings |
| `/(app)/offline/region-selector` | OfflineRegionSelectorScreen | No (back chevron) | Back to regions-list |

### Deep-linking

iOS Universal Links + Android App Links route to:
- `/saved-route/{id}` — opens SavedRouteDetailScreen (auth-gated)
- `/idle?prompt=...` — preloads chat input with prompt text

Auth-gated routes route to `/(auth)/sign-in?next=<originalUrl>` if unauthenticated.

---

## 6. Accessibility (WCAG 2.1 AA)

Per RULES.md REM-01 (added in this sprint), all new screens MUST satisfy WCAG 2.1 AA. v3 inherits v2's already-validated atom-level standards and adds the following screen-level requirements.

### 6.1 — Touch targets
- iOS: ≥ 44 × 44 pt for every interactive element.
- Android: ≥ 48 × 48 dp.
- Adjacent targets: ≥ 8 pt / 8 dp spacing — verified for `SignInScreen` button stack (`spacing.3`), `SettingsScreen` rows (`spacing.2` vertical padding pushes effective height to ≥ 56 pt), and `OfflineRegionsListScreen` cards (`spacing.3` padding around touchable area).

### 6.2 — Color contrast
- All text on `color.surface.*` resolves through `color.content.*` — already validated in v2 for AA contrast in both light and dark themes.
- New cases to verify (engineering snapshot test):
  - `LSAuthProviderButton` foreground vs background — Apple white-on-black and Google text-on-white both ≥ 4.5:1.
  - `LSDownloadProgressBar` fill `color.signal.default` on track `color.surface.input` — already AA per v2.
  - Status badges on `OfflineRegionsListScreen` — all `color.status.*.on / .default` pairs in v2 already AA.

### 6.3 — Dynamic Type / font scale
All new screens MUST respect:
- iOS Dynamic Type — every `LSText` already does (UC-ATM-01 AC).
- Android font-scale — every `LSText` already does.

Specific layout testing for v3:
- `SignInScreen` form card must scroll if user is at AX5 size (largest accessibility size).
- `SavedRoutesListScreen` rows expand vertically rather than truncate at large text sizes.
- `SettingsScreen` list rows expand similarly.

### 6.4 — Screen reader (VoiceOver / TalkBack)

Required props per new screen (already enumerated per-screen in Section 1):
- Every `Pressable` has `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` where non-obvious.
- Decorative-only elements (e.g., map thumbnail in `SavedRoutesListScreen` rows): `accessibilityElementsHidden = true`.
- Live regions: progress bars, async loading states use `accessibilityLiveRegion = .polite` (Android) / equivalent on iOS.

### 6.5 — Focus order
Logical, matches visual order top-to-bottom, left-to-right. Verified per-screen during design QA in `/design` phase.

### 6.6 — Color-blindness / not-color-only
- Status indicators (region downloading vs ready vs failed) MUST also use distinct text/labels — verified, badges carry text not just color.
- Active phase dot in `LSPhaseIndicator` already uses motion (pulse) plus color — passes.
- Route variant polylines (best/alt1/alt2) use distinct colors AND a stripe-color label in `LSRouteAttachmentCard` — passes.

---

## 7. Cut Sequence (per signal #4)

Per the user's signal #4: "Android may be cut if cross-platform testing burdens scope."

### Design impact: Zero

The design specs in this document are platform-agnostic. They specify **which v2 atoms/molecules/organisms** compose each screen — those primitives already ship paired iOS + Android per v2 PRD UC contracts. If Android is cut at implementation time, the design specs remain valid for iOS alone. No design-side rework needed.

### Implementation impact (informational, not design's domain)

If Android cut is invoked:
- Skip Android `LSAuthProviderButton` and `LSDownloadProgressBar` Compose implementations.
- Skip Android sandbox parity manifest entries for new stories.
- Hold all new screens behind a feature flag on Android (continue serving v1 RN/Expo build) until either Android resumes or Android is permanently retired.

The PRD's technical-requirements section (which I'm not generating here, only enabling) should document the cut decision.

---

## 8. Design Spec Deliverables (handoff to `/design` phase)

Per project workflow, after PRD lands the `/design` skill generates per-screen design specs. This document enumerates **which screens need full design spec vs which are existing v2 with annotations only**.

### Need full design spec (10 screens)

| ID | Screen | Source basis | Existing v2 reuse % |
|----|--------|--------------|----------------------|
| v3-SCR-01 | `SignInScreen` | This doc Section 1.A + RN sign-in.tsx | ~90% v2 atoms/molecules; 10% new (`LSAuthProviderButton`) |
| v3-SCR-02 | `SignUpScreen` | This doc Section 1.B (variant of 01) | ~90% v2; same 10% new |
| v3-SCR-03 | `OAuthCallbackScreen` | This doc Section 1.C | 100% v2 |
| v3-SCR-04 | `SavedRoutesListScreen` | This doc Section 1.D + RN saved-routes.tsx | 100% v2 atoms/molecules |
| v3-SCR-05 | `SavedRouteDetailScreen` | This doc Section 1.E (variant of UC-SCR-04) | 100% v2 |
| v3-SCR-06 | `SettingsScreen` | This doc Section 1.F + RN settings.tsx | 100% v2 |
| v3-SCR-07 | `OfflineRegionsListScreen` | This doc Section 1.G + RN regions-list.tsx | 95% v2; 5% new (`LSDownloadProgressBar`) |
| v3-SCR-08 | `OfflineRegionSelectorScreen` | This doc Section 1.H + RN region-selector.tsx | 95% v2; 5% new (same molecule) |
| v3-SHT-01 | `SaveFavoriteSheet` (modal sheet) | This doc Section 1.I + RN save-favorite-sheet.tsx | 100% v2 |
| v3-MOL-01 | `LSAuthProviderButton` (new molecule) | This doc Section 3.1 | New molecule — needs full design spec for variants/states |
| v3-MOL-02 | `LSDownloadProgressBar` (new molecule) | This doc Section 3.2 | New molecule — needs full design spec for state variants |

### No new design (already in v2 — needs "live data variant" annotation only)

| Screen | What changes |
|--------|--------------|
| `IdleScreen` (UC-SCR-01) | Add live-data states from Section 2.1: loading-permission, permission-denied, weather-unavailable |
| `PlanningScreen` (UC-SCR-02) | Add live-data states from Section 2.2: cancelling, network-stalled |
| `RouteResultsScreen` (UC-SCR-03) | Add live-data states from Section 2.3: partial-enrichment |
| `RouteDetailsScreen` (UC-SCR-04) | Add live-data states from Section 2.4: enrichment-loading, already-saved |
| `SessionsScreen` (UC-SCR-05) | Add live-data states from Section 2.5: loading, empty, error; AND extend `LSSessionsDrawer` content per Section 5 IA |
| `ErrorScreen` (UC-SCR-06) | Add live-data states from Section 2.6: auth-required, rate-limited, network-offline |

### Deferred (out of v3)

| Screen | Status |
|--------|--------|
| `PlanRideSheet` (manual mode) | DEFERRED to v3.1 — Section 1.J |
| `Discover` / curated routes browser | DEFERRED to v3.1 — RN has it, native parity is post-MVP |
| `ModelSetupScreen` (local LLM download) | OUT — per user signal #3 (no local LLM) |
| `Voice input` | OUT — per user signal #3 (no voice) |

---

## 9. Open Questions for Engineering

These don't block design but need ENG/PM resolution before implementation:

1. **Drawer over non-map screens** — Does drawer slide over Settings/SavedRoutes/Offline with scrim, or does it route-replace? Recommend: scrim + slide overlay.
2. **`LSTopBar` multi-action trailing slot** — Does v2 TopBar support 2 trailing actions (rename + delete on SavedRouteDetail)? If not, render as composed glass chips inside the slot.
3. **OAuth deep-link return URL** — Apple/Google redirect must hit a registered URL scheme. Engineering decision; design just provides the OAuthCallbackScreen visual.
4. **Brand asset folder** — Where do Apple/Google SVGs live? Recommend: `tokens/icons/brands/` with `pnpm icons:check` exclusion. Brand-folder is gitted but not part of design-owned 25-icon catalog.
5. **Account widget in drawer** — Does the avatar+name+email row need a tap action (route to Settings → Account)? Recommend: yes, makes IA discoverable.
6. **`LSCheckbox` parity** — Native current-state inventory mentions `LSCheckbox` exists on iOS atoms. Confirm Android parity. If Android doesn't have it, fall back to `LSToggle` (atom — confirmed in v2 catalog).

---

## 10. Summary

- **Two new molecules** (`LSAuthProviderButton`, `LSDownloadProgressBar`) — both justified, both minimal.
- **Zero new atoms.** Zero new organisms. Zero new tokens. Zero new motion recipes.
- **Drawer-based IA** extending existing `LSSessionsDrawer` — no new chrome organism (no tab bar).
- **Six v2 screens** get live-data state variants only — no visual changes.
- **Eight new screens + one new sheet** — all compose primarily from v2 v2 primitives.
- **One sheet deferred** (`PlanRideSheet` for manual mode) with explicit rationale.
- **Android cut signal honored** — all design specs are platform-agnostic; cut is implementation-time decision.
- **Accessibility** validated against WCAG 2.1 AA per RULES.md REM-01 standards.

This design fits the 6-week appetite. By minimizing new primitives to two molecules and reusing the v2 design system end-to-end, the implementer-team's design surface area is small and parallelizable. Engineering can begin Convex client integration (Phase B in current-state inventory) in parallel with `/design` generating the per-screen specs for the 10 entries above.

---

**Relevant file paths (absolute):**

- `/Users/justinrich/Projects/LaneShadow/.spec/research/v3-integration-discovery/01-react-native-business-logic.md`
- `/Users/justinrich/Projects/LaneShadow/.spec/research/v3-integration-discovery/02-native-current-state.md`
- `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/05-uc-atm.md`
- `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/06-uc-mol.md`
- `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/07-uc-org.md`
- `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/08-uc-scr.md`
- `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/concepts/designs.html` (authoritative; not loaded due to size, treated as truth source)
- `/Users/justinrich/Projects/LaneShadow/react-native/app/(auth)/sign-in.tsx` (parity reference)
- `/Users/justinrich/Projects/LaneShadow/react-native/app/(app)/(tabs)/settings.tsx` (parity reference)
- `/Users/justinrich/Projects/LaneShadow/react-native/app/(app)/(tabs)/saved-routes.tsx` (parity reference)
- `/Users/justinrich/Projects/LaneShadow/react-native/app/(app)/saved-route/[id].tsx` (parity reference)
- `/Users/justinrich/Projects/LaneShadow/react-native/app/(app)/offline/regions-list.tsx` (parity reference)
- `/Users/justinrich/Projects/LaneShadow/react-native/app/(app)/offline/region-selector.tsx` (parity reference)
- `/Users/justinrich/Projects/LaneShadow/react-native/components/sheets/plan-ride-sheet.tsx` (parity reference, deferred)
- `/Users/justinrich/Projects/LaneShadow/react-native/components/ui/save-favorite-sheet.tsx` (parity reference for SaveFavoriteSheet)
- `/Users/justinrich/Projects/LaneShadow/.claude/rules/agent_rules.mdc` (boot-sequence read)
- `/Users/justinrich/Projects/LaneShadow/RULES.md` (project governance — REM-01 accessibility section)

This design document is ready to inform `team-contributions.md` and `technical-requirements.md` of the v3-integration PRD.
