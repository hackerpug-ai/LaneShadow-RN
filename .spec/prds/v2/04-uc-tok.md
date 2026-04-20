---
stability: FEATURE_SPEC
last_validated: 2026-04-20
prd_version: 2.0.0
functional_group: TOK
---

# Use Cases: Foundation Tokens & Theme (TOK)

The TOK group establishes the single canonical source of design values for V2 Navigator. Everything downstream — every atom on every platform — resolves its appearance from outputs generated here. No downstream UC may introduce new primitive values.

| ID         | Title                                                           | Description |
|------------|-----------------------------------------------------------------|-------------|
| UC-TOK-01  | Typography families (opinion / ui / instrument)                 | Three role-based typography families: Newsreader serif opinion voice, Geist UI chrome, JetBrains Mono instrument readouts. |
| UC-TOK-02  | Color semantics (surface / signal / role / weather / route / status) | Full color token surface in light + dark: surface trio including glass + scrim + overlay; signal pair; role-based agent/user/system; weather palette; route-variant colors; status; content; border; action. |
| UC-TOK-03  | Spacing, sizing, stroke, radius, opacity, elevation tokens      | Numeric scales: spacing (4px base, 13 rungs), sizing (touch target, icon sizes, component heights), stroke (polyline/icon widths), radius (none → pill), opacity, elevation tiers (0–3 + **overlay**). |
| UC-TOK-04  | Motion recipes + primitive duration/easing                      | Eight named motion recipes (`chatOverlayEnter/Dismiss`, `sidebarSlideIn`, `sketchPolylineLoop`, `routeDrawOn`, `bestBadgeEnter`, `phaseDotPulse`, `mapTapDismiss`) plus the duration + easing primitives they reference. Gradient tokens retained. |
| UC-TOK-05  | Cross-platform token generation pipeline + icon catalog + Mapbox style URLs | Generates Swift / Kotlin / TypeScript outputs. Includes design-owned SVG icon catalog (25 icons, `icon.stroke.width` token), font asset registration (Newsreader, Geist, JetBrains Mono), and `map.style.{light,dark}` Mapbox Studio URLs. Drift-check in `lefthook` pre-commit. |

---

## UC-TOK-01 — Typography families (opinion / ui / instrument)

Establish three semantic typography families in `tokens/semantic/semantic.tokens.json`. Each family has an explicit **role** — not a generic size scale — so downstream components can refer to typography by what it says, not how big it is.

- **`typography.opinion.{md,lg,xl}`** — Newsreader serif, italic-capable, used for Navigator voice: greetings, opinionated headings, callout bodies (e.g., "Where are we riding today?", "Let me think on that…").
- **`typography.ui.{title,label,body}.{sm,md,lg}`** — Geist sans-serif, used for UI chrome (titles, button labels, list rows, paragraphs).
- **`typography.instrument.{sm,md,lg}`** — JetBrains Mono, used for numeric instrument readouts: distance, duration, climb, temperatures, scenic dots, phase-step labels, timestamps.

Each variant is a `TypographyStyle` composed of `family`, `weight`, `size`, `lineHeight`. iOS consumes via `NativeTheme.TypographyStyle`; Android consumes via Compose `TextStyle` extensions.

### Acceptance Criteria
- ☐ Developer can open `tokens/semantic/semantic.tokens.json` and find three top-level typography namespaces: `typography.opinion.*`, `typography.ui.*`, `typography.instrument.*`.
- ☐ Developer can inspect each variant and find `family`, `weight`, `size`, `lineHeight` — typed per the schema.
- ☐ Developer can confirm the three font families (Newsreader, Geist, JetBrains Mono) are declared as bundled assets registered for both platforms (see UC-TOK-05).
- ☐ Developer can render a sandbox "Typography swatch" story (delivered as part of UC-ATM-01) on iOS and see every variant across all three families render with the token-specified size and line height.
- ☐ Developer can render the same swatch on Android and see byte-identical values (within platform density rounding).
- ☐ Developer can validate typography tokens against the schema (`pnpm tokens:validate`) with zero errors.

---

## UC-TOK-02 — Color semantics (surface / signal / role / weather / route / status)

Establish the complete color token surface of V2 in DTCG `{$type: "color", $value: "#..."}` format. Tokens are grouped by semantic role (not palette role) so that consumers reference intent (e.g., `color.weather.rain.default`) rather than hue. Every token has both light and dark variants. The Copper palette drives `color.signal.*`; the warm-paper topographic aesthetic drives `color.surface.*`.

Namespaces:

- **`color.surface.{primary,card,overlay,glass,scrim}`** — `primary` is the base page; `card` is elevated; `overlay` is the sheet/drawer fill; `glass` is the translucent blurred chrome surface (consumed by `LSGlassPanel`); `scrim` is the map dimmer used under drawers.
- **`color.content.{primary,secondary,tertiary,subtle,error,onSignal}`** — text/icon colors.
- **`color.signal.{default,on}`** — the amber "best/active/brand" accent pair.
- **`color.role.{agent,user,system}.{default,on,accent}`** — for Navigator-vs-user styling in messaging surfaces.
- **`color.weather.{clear,rain,wind,storm,hot,cold}`** — six weather conditions. Each is a triplet: `{default,on,tint}` (solid fill, on-solid foreground, 12–20% tint for pill backgrounds).
- **`color.route.{best,alt1,alt2}`** — polyline stroke + `LSRouteAttachmentCard` left-stripe colors.
- **`color.status.{info,success,warning,error,recording}.{default,on}`** — retained; cleanly partitioned from weather.
- **`color.border.{default,subtle,strong,focus,error}`** — borders.
- **`color.action.{primary,secondary,ghost,accept,destructive,outline}.{default,pressed,disabled,focus}`** — button state × variant matrix.

### Acceptance Criteria
- ☐ Developer can open `tokens/semantic/semantic.tokens.json` and find color tokens grouped into the ten listed namespaces, each with `light` and `dark` variants.
- ☐ Developer can reference every color from `concepts/designs.html` in the token file — including the warm-paper neutrals (`#F8F7F6`, `#F2EFED`, `#EDE7E1`), the night-palette neutrals (`#221810`, `#2D2218`, `#362A1F`, `#3D3228`), signal amber (`#EE7C2B`, `#B85A2C`), and the six weather colors — assigned to a semantic role.
- ☐ Developer can load `semantic.tokens.json` against `tokens/semantic/semantic.tokens.schema.json` and validate with no errors.
- ☐ Developer can confirm every token includes an `$type: "color"` declaration and a `$value` matching `hexColor` from `~/Projects/native-theme/schema/common.schema.json`.
- ☐ Developer can read `color.weather.*` triplets and find they produce visually distinct pill backgrounds in both themes (tint values 12–20% mixed toward surface).
- ☐ Developer can read `color.role.agent.*` and find the Navigator-brand accent pair resolves to the Copper signal color (brand continuity).
- ☐ Developer can run `pnpm tokens:validate` with zero errors.

---

## UC-TOK-03 — Spacing, sizing, stroke, radius, opacity, elevation tokens

Define numeric scales. Spacing uses a 4px base with named rungs (`spacing.0` through `spacing.12` = 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64). Sizing covers minimum touch target (44px iOS / 48dp Android), icon sizes (xs/sm/md/lg/xl), and component heights (`buttonHeight`, `inputHeight`, `toolbarHeight`). Stroke covers polyline and icon stroke widths (`sizing.stroke.{sm,md,lg}` + `icon.stroke.width` = 1.5px). Radius covers `none`, `xs`, `sm`, `md`, `lg`, `xl`, `pill`. Opacity covers `disabled`, `overlay`, `focus`, `dim`, `veil`. Elevation covers `0` / `1` / `2` / `3` plus a dedicated `overlay` tier used by sheets, drawers, and glass callouts.

### Acceptance Criteria
- ☐ Developer can find a `spacing` section with ≥13 rungs covering 0px to 64px on a 4px base.
- ☐ Developer can find a `sizing` section with `touchTarget`, `icon.{xs,sm,md,lg,xl}`, `component.{buttonHeight,inputHeight,toolbarHeight}`, `stroke.{sm,md,lg}`, and `icon.stroke.width` values.
- ☐ Developer can find a `radius` section with `none`, `xs`, `sm`, `md`, `lg`, `xl`, `pill`.
- ☐ Developer can find an `opacity` section with `disabled` (0.38), `overlay` (0.60), `focus` (0.12), `dim` (0.76), `veil` (0.95).
- ☐ Developer can find an `elevation` section with `0`, `1`, `2`, `3`, and **`overlay`** tiers. `overlay` is distinct from `2`/`3` and is the only tier consumed by `LSGlassPanel`, `LSBottomSheet`, `LSSessionsDrawer`.
- ☐ Developer can inspect every numeric token and find an `$type: "dimension"` declaration whose `$value` matches the `dimension` pattern in `~/Projects/native-theme/schema/common.schema.json`.
- ☐ Developer can confirm the minimum touch-target sizing meets platform guidance (iOS ≥ 44px, Android ≥ 48dp) and is resolved at generation time.
- ☐ Developer can run `pnpm tokens:validate` with zero errors.

---

## UC-TOK-04 — Motion recipes + primitive duration/easing

Motion is declared at **two levels**: primitives (durations + easings) and **recipes** (named composite motions the design source enumerates). Downstream components consume *recipes*, not primitives — this prevents drift and makes "which animation is this?" a grep-able question.

**Primitive durations**: `motion.duration.{instant,fast,standard,slow,deliberate}` = 0 / 120 / 240 / 400 / 600 ms. **Primitive easings**: `motion.easing.{standard,emphasized,decelerated,accelerated}` as cubic-bezier.

**Named recipes** (each is a typed object referencing primitives):

- `motion.recipe.chatOverlayEnter` — 300ms ease-out, `translateY -20→0, opacity 0→1`.
- `motion.recipe.chatOverlayDismiss` — 200ms linear, `opacity 1→0`, auto-trigger after 5000ms visible.
- `motion.recipe.sidebarSlideIn` — 250ms ease-out, `translateX -300→0`.
- `motion.recipe.sketchPolylineLoop` — 2000ms linear loop, `dashOffset` + 2px leading-dot pulse.
- `motion.recipe.routeDrawOn` — 1200ms ease-out, per-path `strokeDashoffset 0→1`, staggered 120ms between paths.
- `motion.recipe.bestBadgeEnter` — 300ms ease-out after 400ms delay, `translateY 4→0 + opacity 0→1`.
- `motion.recipe.phaseDotPulse` — 900ms ease-in-out loop, ring scale `0→1.5×`, opacity `0.4→0`.
- `motion.recipe.mapTapDismiss` — 150ms linear, overlays fade.

Gradient tokens retained (`gradient.copperWarm`, `gradient.copperNight`, `gradient.surfaceSweep`).

### Acceptance Criteria
- ☐ Developer can find a `motion.duration` section with `instant/fast/standard/slow/deliberate` rungs.
- ☐ Developer can find a `motion.easing` section with `standard/emphasized/decelerated/accelerated` cubic-bezier values.
- ☐ Developer can find a `motion.recipe.*` section with the eight recipes above; each recipe is a typed object with fields `duration`, `easing` (referencing primitives by token path), and a recipe-specific transform payload (e.g., `translateY: [start, end]`, `loop: true`, `delay: 400`, `stagger: 120`).
- ☐ Developer can open `tokens/semantic/semantic.tokens.schema.json` and confirm `motion.recipe` items validate against a shared schema that enforces the above shape.
- ☐ Developer can grep platform UI code after Sprint 2+ and confirm organisms reference recipes by name (`motion.recipe.phaseDotPulse`), not raw `duration.standard + easing.emphasized` pairs. An exception is permitted for atoms that *define* the animation primitive behavior under a recipe.
- ☐ Developer can find a `gradient` section with named Copper gradients expressed as arrays of color-token references plus stop positions.
- ☐ Developer can run `pnpm tokens:validate` with zero errors.

---

## UC-TOK-05 — Cross-platform token generation pipeline + icon catalog + Mapbox style URLs

A deterministic pipeline converts `semantic.tokens.json` plus the SVG icon catalog and font assets into three platform outputs:

1. **Swift**: `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift` — color / typography / spacing / radius / motion-recipe constants backed by `NativeTheme.ColorSet` + `parseColorString`. Icons emitted as a generated `LSIcon.Name` enum + bundled `Asset.xcassets` SVG assets (or native `Shape` wrappers as determined by the iOS implementer in Sprint 2).
2. **Kotlin**: `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt` — Compose `MaterialTheme` extensions. Icons emitted as generated `ImageVector` constants (or bundled SVG via Compose `Image` painter — implementer's choice in Sprint 2).
3. **TypeScript**: `tokens/platforms/typescript/src/generated/tokens.ts` — generated TS exports (sync-gate target; no runtime consumer in V2).

The pipeline additionally:

- Bundles three font families (Newsreader, Geist, JetBrains Mono) into `ios/LaneShadow/Resources/Fonts/` and `android/app/src/main/assets/fonts/`, registered in `Info.plist` / Android `Resources` respectively.
- Emits `map.style.light` and `map.style.dark` as DTCG `$type: "string"` tokens carrying Mapbox Studio `mapbox://styles/laneshadow/<id>` URLs — consumed by the `LSMap` atom's style loader.
- Emits a typed `IconName` enum derived from the SVG catalog at `tokens/icons/*.svg`.

A drift-check runs in `lefthook` pre-commit and fails if any generated file differs from what the current `semantic.tokens.json` + icon catalog + font manifest would produce. A dedicated `pnpm icons:check` target verifies the SVG filename set matches the `IconName` enum on both platforms.

### Acceptance Criteria
- ☐ Developer can run `pnpm tokens:generate` and the script writes the three platform outputs with content derived entirely from `semantic.tokens.json` + `tokens/icons/*.svg` + the font manifest.
- ☐ Developer can import `LaneShadowTheme` in Swift and read any of the following without a literal: `LaneShadowTheme.color.surface.glass.light`, `LaneShadowTheme.typography.opinion.xl`, `LaneShadowTheme.motion.recipe.phaseDotPulse`, `LaneShadowTheme.icon.name.compass`.
- ☐ Developer can import `LaneShadowTheme` in Kotlin and read the analogous values from a `@Composable`.
- ☐ Developer can run `pnpm tokens:sync-check` and the script exits 0 when generated outputs match the source; exits non-zero when any of color / typography / motion / icon / font outputs have drifted.
- ☐ Developer can run `pnpm icons:check` and see the SVG file list, iOS `IconName` enum, and Android `IconName` enum compared set-wise; the script exits non-zero on any mismatch.
- ☐ Developer can stage a change to any `tokens/semantic/**`, `tokens/icons/**`, `tokens/fonts/**`, or `tokens/platforms/**` file and the `lefthook` pre-commit hook runs `pnpm tokens:validate`, `pnpm tokens:sync-check`, and `pnpm icons:check` before allowing the commit.
- ☐ Developer can read the generated Swift/Kotlin files and find a banner comment stating they are generated and the exact input hash used.
- ☐ Developer can find `map.style.light` and `map.style.dark` in `semantic.tokens.json` with `$type: "string"` and `$value` matching `^mapbox://styles/laneshadow/[a-z0-9]+$`.
