---
stability: PRODUCT_CONTEXT
last_validated: 2026-04-20
prd_version: 2.0.0
---

# Native Design System V2 (Copper) — Navigator

## Product Description

LaneShadow V2 is an **opinionated conversational motorcycle navigator**. Riders describe the kind of ride they want in natural language ("scenic 2-hour ride, avoid highways"); an AI agent called **The Navigator** sketches roads, validates their connectivity, checks weather along the way, and returns three ranked route alternatives over a warm-paper topographic map. Every surface is map-primary; the chat input is pinned; there are no full-screen scrims during conversation.

V2 delivers this product as a ground-up, atomic, semantic-token-driven design system implemented natively in **iOS (Swift/SwiftUI)** and **Android (Kotlin/Compose)**. Every visible primitive — tokens, atoms, molecules, organisms, and screens — is rebuilt from the V2 "Copper" concepts at `.spec/prds/v2/concepts/designs.html`, delivered through two parallel native codebases maintained in tandem by AI agents (swift-implementer and kotlin-implementer) using a shared token pipeline and a shared sandbox harness.

This is **not** a refactor of the existing UI. It is a full replacement: legacy React Native UI and legacy native views are deleted, and the V2 Navigator system is the only UI layer going forward.

## Problem Statement

LaneShadow's current UI is a mixed-stack layer (React Native app in `react-native/`, partial native views under `ios/LaneShadow/Views/` and `android/app/...`), organized around a prior social-ride-app concept that has been retired. It is missing the Navigator product entirely, has no single semantic token source of truth, and suffers visual drift from the Copper concepts. Four concrete pains:

1. **Product-vs-UI mismatch.** The existing UI models a social feed/profile/settings product; the design-source-of-truth at `concepts/designs.html` models a conversational Navigator. Every legacy surface is off-product.
2. **Visual inconsistency across platforms.** Colors, spacing, typography, and motion differ subtly between iOS and Android because each surface hard-codes its own values rather than resolving from shared semantic tokens.
3. **AI-agent maintenance overhead.** There is no consistent component scaffolding pattern, so `swift-implementer` and `kotlin-implementer` regularly re-derive architecture per task — leading to divergence and rework.
4. **No in-context preview surface & coupled data+UI.** Designers and reviewers cannot visually exercise a single component in isolation across states and theme modes, and UI work is blocked on backend wiring even when the design question is purely visual.

## Solution Summary

A six-layer atomic system, delivered natively on both platforms behind a shared token pipeline and a shared sandbox browser. The system is sized and shaped for the Navigator screen roster (`idle`, `planning`, `route_results`, `route_details`, `session_history`, `error`).

### 1. Foundation Tokens (TOK)

A single canonical `semantic.tokens.json` (DTCG format) defining three **typography families** (Newsreader serif "opinion" voice; Geist UI chrome; JetBrains Mono instrument metrics), **role-based color semantics** (surface/content/signal/role agent-user-system/weather palette/route variant/status), **named motion recipes** (chat-overlay-enter/dismiss, sidebar-slide, phase-pulse, route-draw-on, sketch-loop, best-badge, map-tap-dismiss), spacing/radius/stroke scales, elevation tiers (including a dedicated `elevation.overlay`), opacity scale, and Mapbox Studio style URLs. Generated deterministically into Swift, Kotlin, and TypeScript; a sync-check in CI blocks drift.

### 2. Atoms (ATM)

The smallest typed UI primitives, reorganized for the Navigator:

- **Typography** (`LSText`) over three families.
- **Button**, **Inputs** (TextField, TextArea).
- **Surface trio**: `LSCard` (elevated), `LSPanel` (flat), **`LSGlassPanel`** (translucent + backdrop-blur, used by every overlay).
- **Pill atom** (`LSPill`) — the shape primitive behind all chip-shaped elements; Badge split out with `status.*` **and** `weather.*` variants.
- **PhaseDot** (pulsing 3-state dot), **Scrim** (map dimmer).
- **Design-owned SVG Icon catalog** (25 icons, 1.5px rounded stroke) replacing the prior SF-Symbols / Material-Icons mapping.
- **`LSMap`** — Mapbox-backed, delivered as a shared contract (UC-ATM-11, widened to multi-polyline with route-variant colors) plus per-platform implementations (iOS UC-ATM-12, Android UC-ATM-13). Studio styles are authored to render the design's warm-paper topographic aesthetic.

### 3. Molecules (MOL)

Compositions of atoms, shaped around the Navigator screens:

- **Pill semantics family**: `LSTagPill`, `LSFilterChip`, `LSSuggestionChip`, `LSWeatherBadge` — all composed from `LSPill`.
- **Navigator molecules**: `LSPhaseIndicator`, `LSWeatherTimeline`, `LSInstrumentReadout`.
- **Chat molecules**: `LSChatInput` (with location context bar, suggestion chip row, collapse/send/filter affordances), `LSLocationContextBar`, `LSRouteAttachmentCard`.
- **Shared patterns**: Card+ListRow, Toolbar+NavHeader, BottomSheet+Toast+Modal, FormField+TabItem+EmptyState retained as general primitives.

### 4. Organisms (ORG)

Feature-domain compositions:

- **`LSTopBar`** — hamburger + optional title + "NEW" chip; consumes `LSGlassPanel(.chrome)`.
- **`LSMapLayer`** — the shared map-primary canvas with scrim + overlay slots, reused across all six screens so positioning/z-index/safe-area is solved once.
- **`LSNavigatorMessage`** — branded "THE NAVIGATOR" callout with compass chip, opinion-serif body, optional attached route cards, pin/dismiss actions.
- **`LSInlineErrorCallout`** — warn-stripe recovery callout with suggestion-chip footer.
- **`LSRouteSheet`** — RouteDetails bottom sheet with best badge + instrument readout + weather timeline + action row.
- **`LSSessionsDrawer`** — left-anchored conversation-history drawer with grouped sessions and active-session stripe.
- **`LSRouteCard`** + **`LSSectionHeader`** retained for catalog/group rendering.

### 5. Screens (SCR)

Template-level compositions, one per Navigator screen in `concepts/designs.html`:

- **`IdleScreen`** — map + greeting overlay + chat input with suggestion chips (Navigator dormant).
- **`PlanningScreen`** — map with sketching polyline animation + phase indicator + thinking-state chat input.
- **`RouteResultsScreen`** — map with 3 alt polylines + Navigator message with 3 attached route cards + refine-prompt chat input.
- **`RouteDetailsScreen`** — map + route sheet (best badge, instrument readout, weather timeline, Save / Ride this).
- **`SessionsScreen`** — scrimmed map + sessions drawer.
- **`ErrorScreen`** — map + inline error callout + recovery chat input.

Every screen is rendered from a mock data provider in the sandbox — there is no live Convex wiring in V2 scope. Fixture shapes mirror `server/convex/` read types where they align; Navigator-specific entities (`Session`, `NavigatorMessage`, `RouteAttachment`, `WeatherSummary`, `WeatherTimelineEntry`, `PlanningPhase`, `SuggestionChip`, `LocationContext`) live in the PRD's Technical Requirements.

### 6. Sandbox Infrastructure (SBX)

The `native-sandbox` Story registry, organized per the Storywright tier pattern (`AtomStories.swift` / `MoleculeStories.swift` / `OrganismStories.swift` / `TemplateStories.swift` + Kotlin analogs). Includes light/dark/auto theme toggle, `argTypes` controls, mock data providers, a cross-platform parity manifest, and two cleanup passes:

- **Pre-Sprint-2 failed-port cleanup (UC-SBX-05)** — deletes the partial 1:1 RN-to-native port (Avatar / Badge / BottomSheetInput / Button and FIX-* iterations) from `ios/LaneShadow/Views/` and `android/.../ui/` before Sprint 2 lands new atoms. Runs in parallel with Sprint 1.
- **Terminal React Native shell retirement (UC-SBX-04)** — deletes the `react-native/` app shell and strips RN build-config references after every Navigator screen has passed its gate in Sprint 5.

## Why Native (and Not React Native)?

Unchanged from v1.x — V2 explicitly retires the RN layer. Reasons are architectural:

- **Two-agent parallelism.** With `swift-implementer` and `kotlin-implementer` authoring UI in tandem, native SwiftUI/Compose produces clearer per-platform code than an RN bridge, removes the bridge class as a failure mode, and lets each platform-specialist agent reason entirely within its idiom.
- **Shared semantic primitives, not shared runtime.** `native-theme` provides shared primitives (`ColorSet`, `TypographyStyle`, `parseColorString`) across Swift/Kotlin/TS — sufficient for token parity without forcing a shared UI runtime.
- **Sandbox parity is achievable natively.** `native-sandbox` is already implemented on both platforms.

## Why Mocked Data (and No Live Navigator Runtime)?

Every UC in V2 runs off **hard-coded fixture providers**, not live Convex or a live AI runtime. This is deliberate:

- **Decouples design iteration from backend + AI-agent work.** A screen can be reviewed for visual/structural correctness before any Convex query or Navigator-runtime endpoint exists.
- **Makes sandbox previews deterministic.** Stories render the same every time; visual-regression checks are stable.
- **Preserves integration-readiness.** Fixture shapes mirror `server/convex/` read types where they overlap (Route, User); swapping a fixture provider for a real subscription — or a mocked Navigator response for a real one — is a single point-of-substitution per screen.

Real data wiring (Convex queries/mutations, live subscriptions, offline sync) and the real Navigator runtime (LLM orchestration, weather APIs, Mapbox Directions, geocoding) are **out of scope** for V2 and will be scheduled as separate integration initiatives once the design system ships.
