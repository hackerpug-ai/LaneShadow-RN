# Design-Fidelity Remediation Summary
**Generated**: 2026-04-27
**Source**: 5 parallel frontend-designer reviews against `.spec/design/system/views/` and `.spec/design/system/organisms/`
**Per-component reports**: `01-views-idle-planning.md` · `02-views-route.md` · `03-views-sessions-error.md` · `04-organisms-chrome.md` · `05-organisms-content.md`

---

## What we asked

> "Make our real app look as designed."

Five frontend-designer agents reviewed the 6 V2 native views + 7 V2 organisms against the authoritative HTML/PNG/README design system at `.spec/design/system/`. Each gap is documented with: severity (HIGH/MED/LOW), designed reference (file + line), iOS file + line, Android file + line, observation, remediation, and effort estimate per platform.

## What we found

**Total gaps catalogued: ~97** across 13 components (6 views + 7 organisms × 2 platforms = 13 native trees of work).

| Category | HIGH | MED | LOW | Total |
|----------|------|-----|-----|-------|
| Idle + Planning views | 4 + 4 | 6 + 5 | 3 + 2 | 24 |
| RouteResults + RouteDetails views | 3 + 3 | 4 + 3 | 2 + 2 | 17 |
| Sessions + Error views | 4 + 4 | 4 + 4 | 2 + 1 | 19 |
| Chrome organisms (map-layer, topbar-navbar, sessions-drawer) | 6 | 7 | 5 | 18 |
| Content organisms (callouts, route-sheet, route-card, section-header) | 8 | 9 | 3 | 20 |
| **Totals** | **36** | **42** | **20** | **98** |

## Recurring themes

Patterns that explain "the views look distorted":

### 1. iOS typography — `heading.md` used where `opinion.md`/`opinion.xl`/`opinion.lg` is required
The Newsreader serif "Navigator voice" is replaced with Geist UI sans across multiple components. Visible on:
- Idle screen greeting headline (`opinion.xl`)
- Sessions drawer "Rides" title (`opinion.lg`)
- Error callout body (`opinion.md`)
- Navigator message body (`opinion.md`)
- TopBar centered title (`opinion.md`)
- Section-header caps variant (`label.sm`, currently `title.md`)

This single category contributes to the "feels generic / not-on-brand" perception across nearly every screen.

### 2. iOS map slot — LinearGradient placeholder instead of paper topographic substrate
Idle, Planning, and Error screens render the map slot as a `LinearGradient(colors: [surface.default, background.default])` plus `Text("Map Layer")`. The design specifies `var(--map-paper)` warm cream substrate + SVG contour layer + favorite pin overlays. This is the most visible distortion on iOS.

### 3. Sessions drawer wraps in `LSGlassPanel.chrome` (both platforms)
The container is glass-blurred, allowing map content to bleed through and making session text hard to read. Design specifies a solid `var(--surface-card)` background with `var(--elev-overlay)` shadow.

### 4. iOS RouteCard inner padding + double clip on map preview
`LSCard(padding: .spacing4)` insets the map from the card edges and a second `clipShape(RoundedRectangle)` produces visible corner artifacts. Design specifies edge-to-edge map with the card's outer radius doing all the clipping.

### 5. Motion recipe wiring incorrect
- Sketch polyline loop runs at 600ms instead of 1400ms (>2× too fast)
- Breathing head dot at 400ms iOS / missing on Android
- `bestBadgeEnter` unimplemented on both platforms
- Drawer slide uses tween instead of spring on Android
- Record dot pulse stubbed on both platforms

### 6. Sandbox story coverage asymmetric
- iOS exposes 1 story for: Idle, RouteResults, Sessions, Error views (vs 7/7/5/6 designed)
- Android `AppStories.all = emptyList()` for ALL 4 content organisms (navigator-callouts, route-sheet, route-card, section-header)
- Snapshot regression cannot detect bugs in 50%+ of designed states

### 7. Token-correctness errors compound across components
- Active-row stripe width hardcoded at 3pt instead of `--stroke-lg` (2pt)
- Active-row background uses raw alpha instead of `--signal-whisper` semantic token (breaks dark mode)
- Hardcoded `40.dp` chip heights instead of token references
- Hit targets <44pt on hamburger button (accessibility)
- Android pinned-dot at 12% alpha (nearly invisible)
- Drawer trailing shadow missing on Android entirely

### 8. Missing variants and edge states
- All 6 idle-screen designed variants beyond default (S02–V03)
- All 3 planning-screen edge states (V01 slow-planning, V02 cancel-confirm, V03 single-candidate warning)
- RouteResults: alt-selection (S02), refining (S04), recall chip (V03), dark mode (S03), weather divergent (V02)
- RouteDetails: dark (S03), medium-detent (S04), dismissing (S05), saved-state (V01)
- Sessions: dark (S02), confirm dialog (S05), date-grouping (TONIGHT/LAST WEEK/EARLIER)
- Error: dark/storm-gate, recovered (S04), offline (V01), wrap-layout for chips

### 9. Android-specific build blockers
- `LSSessionsDrawer.kt` references undeclared `Session` data class (will not compile as written)
- Android `RouteDetailsScreen.kt` passes `emptyList()` for polyline coordinates (blank map)

### 10. Filter-chip and search-slot variants missing on `LSNavBar` (both platforms)
`LSNavBar` only supports back+title+close. Filter chip rows and search slots are unavailable, forcing future screens to compose chrome ad-hoc.

## Effort rollup

By platform (rough, S=2h, M=8h, L=24h):

| Platform | HIGH | MED | LOW | Total est |
|----------|------|-----|-----|-----------|
| iOS | ~120h | ~70h | ~16h | **~206h (5 weeks @ 40h)** |
| Android | ~80h | ~60h | ~14h | **~154h (4 weeks @ 40h)** |
| Shared (token additions, design specs) | ~16h | ~16h | — | **~32h (1 week)** |

**If the v3-integration cut rule fires (Android dropped):** total drops to ~206h iOS + 32h shared = **~6 weeks of one-implementer work**, parallelizable with V3 integration sprints.

## How this fits the v3-integration PRD

These remediations are **upstream of V3 integration**: every CHAT/ROUTE/SESS/MAP/APP UC depends on a visually correct V2 design system. If the iOS greeting headline is the wrong font, wiring it to a real `users.getCurrentUser` query doesn't fix anything — it still looks distorted.

Recommended scoping:

1. **Add a 7th functional group `FID` (Design Fidelity)** to the v3-integration PRD with 8 use cases covering the remediation themes above.
2. **Run FID work as Phase 0** in week 1, in parallel with the existing AUTH/Convex foundation work (different files; no merge conflicts).
3. **Escalate HIGH-severity items as week-1 must-do** — typography, map slot, glass-panel-on-drawer, build blockers (Android `Session` class, `RouteDetailsScreen` empty coordinates).
4. **Defer LOW-severity items to v3.1** if appetite tightens — separator dots, see-all link size, body collocation, etc.

A new sprint plan can sequence FID work as:
- **Week 1**: Build blockers + typography fixes (FID-01 through FID-04) + Android `Session` decl
- **Week 2**: Map slot + glass-panel container + token corrections (FID-05 through FID-07)
- **Week 3-6**: Variant + story coverage (FID-08), parallel with CHAT/ROUTE/SESS V3 work

## Cut authority impact (HUMAN SIGNAL #4)

Per the existing PRD cut authority: if Android cross-platform testing burdens scope, FID Android-side tasks are first to drop after the existing V3 cut layers. The 9 build blockers and component-build gaps on Android (`Session` class, `RouteDetailsScreen` empty coords, `AppStories.all = emptyList()` × 4 organisms, route-card difficulty pills, route-sheet timeRange) are tagged below in `12-uc-fid.md` with explicit `[ANDROID-CUT-CANDIDATE]` markers.

## What's intentionally NOT in scope

Per HUMAN SIGNAL #3 (no new functionality outside RN parity):
- New atoms or molecules beyond the 2 already approved (`LSDownloadProgressBar`, `LSAuthProviderButton`)
- Token additions beyond the 2 already noted as TOKEN_GAP in design specs (`--surface-scrim-soft`, `--elev-drawer`, `--space-hairline` already added)
- Visual design exploration (Copper concepts.html remains authoritative)
- Per-component variant proliferation beyond what designs.html and the README catalogue specifies
