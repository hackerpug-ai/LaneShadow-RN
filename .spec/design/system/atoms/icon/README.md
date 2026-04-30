# Icon — LSIcon Atom

**Use Case**: UC-ATM-10
**Sprint**: Sprint 02 — Atoms / Foundation Primitives
**Version**: 2.0.0
**Authority**: `.spec/prds/v2/concepts/uc-atm-10-icon.html`

---

## Atoms Used

| Dependency | Why |
|------------|-----|
| Tokens only | LSIcon consumes only sizing, stroke, and content tokens. No other atom is composed inside it. |

---

## Purpose

LSIcon is the sole icon primitive for LaneShadow V2. All 31 glyphs are design-owned SVGs — no platform system icons (SF Symbols, Material Icons) are permitted anywhere in the codebase. Each icon resolves its color through `currentColor` (inheriting from a `--content-*` or `--signal-*` token on the parent), its size through `--icon-*` tokens, and its stroke width from `--stroke-md`.

Icons are bundled at build time: iOS emits Asset.xcassets or SwiftUI Shape conversions; Android emits Compose ImageVector resources. The `pnpm icons:check` script enforces that every basename matches an IconName enum value exactly.

---

## Structural Constants

| Property | Value | Token |
|----------|-------|-------|
| Stroke width | 1.5px | `--stroke-md` |
| Linecap | round | SVG attribute |
| Linejoin | round | SVG attribute |
| Fill | none | SVG attribute (outline glyphs) |
| ViewBox | 0 0 20 20 | All glyphs drawn on a 20×20 grid |
| Color | currentColor | Inherited from parent via `--content-*` or `--signal-*` |

> Note: The concept spec (UC-ATM-10) uses a 20×20 viewBox and defines `icon.md = 20px`. The canonical `tokens.css` maps `--icon-md: 18px`. The CSS rendering size is driven by the `--icon-*` tokens; the viewBox is internal to the glyph and does not need to match the rendered pixel size.

---

## Size Token Table

| Token | px value | iOS | Android | Typical use |
|-------|----------|-----|---------|-------------|
| `--icon-xs` | 12px | 12.pt | 12.dp | Badge leading icon, tiny decorative |
| `--icon-sm` | 16px | 16.pt | 16.dp | Inline button icon, chip leading icon |
| `--icon-md` | 18px | 18.pt | 18.dp | Default context, nav actions |
| `--icon-lg` | 24px | 24.pt | 24.dp | Phase card header, prominent actions |
| `--icon-xl` | 32px | 32.pt | 32.dp | Empty state illustration, onboarding |

---

## Stroke Token Table

| Token | Value | Use |
|-------|-------|-----|
| `--stroke-md` | 1.5px | All outline glyphs — enforced at type-level |

---

## Color Roles

Icons always inherit color via `currentColor`. Set color on the wrapping element using semantic tokens:

| Token | Role |
|-------|------|
| `--content-primary` | Default icon color (most contexts) |
| `--content-secondary` | Subdued / decorative icons |
| `--content-tertiary` | Faint / disabled-adjacent |
| `--signal-default` | Brand accent (compass, pin, sparkle in key UI) |
| `--status-error` | Destructive / alert state |
| `--status-success` | Confirmed / positive state |

---

## Icon Catalog — 34 Glyphs

| Name | Type | Typical use |
|------|------|-------------|
| `send` | outline | ChatInput send action |
| `expand` | outline | Sheet / card expand |
| `collapse` | outline | Sheet / card collapse |
| `menu` | outline | Navigation hamburger |
| `plus` | outline | Create / add action |
| `close` | outline | Dismiss / clear |
| `sliders` | outline | Filters / preferences |
| `bookmark` | outline | Save ride (inactive) |
| `bookmarkFill` | fill | Save ride (active) |
| `star` | outline | Rating / best (inactive) |
| `starFill` | fill | Rating / best (active) |
| `pin` | outline | Waypoint / location |
| `clock` | outline | Time / duration |
| `sun` | outline | Weather: clear / hot |
| `rain` | outline | Weather: rain |
| `wind` | outline | Weather: wind |
| `storm` | outline | Weather: thunderstorm |
| `therm` | outline | Weather: temperature |
| `route` | outline | Route card / navigation |
| `map` | outline | Map view toggle |
| `layers` | outline | Map layers selector |
| `share` | outline | Share ride / route |
| `heart` | outline | Like / favorite (inactive) |
| `heartFill` | fill | Like / favorite (active) |
| `sparkle` | outline | AI / Navigator indicator |
| `compass` | outline | Navigator persona / heading |
| `edit` | outline | Edit ride / annotation |
| `trash` | outline | Delete / remove |
| `bike` | outline | Ride / bicycle context |
| `chevR` | outline | Navigate right / disclosure |
| `chevL` | outline | Navigate left / back |
| `mail` | outline | Email field leading icon (auth, contact, notifications) |
| `lock` | outline | Password field leading icon (auth, secure settings) |
| `eye` | outline | Password visibility toggle / preview-show indicator |

Fill variants (`bookmarkFill`, `starFill`, `heartFill`) use `fill: currentColor; stroke: none;`. All other glyphs use `fill: none; stroke: currentColor`.

The `mail`, `lock`, and `eye` glyphs were added during Sprint 06 (auth-screen view, UC-SCR-07) — they support the AuthScreen email/password fields and visibility toggle. They follow the same 20×20 viewBox and 1.5px stroke conventions as the original 31 glyphs and are pure outline (no fill variant).

---

## Forbidden Patterns

The `pnpm icons:check` script and CI grep reject these on every push:

| Pattern | Reason |
|---------|--------|
| `UIImage(systemName:)` | SF Symbols API on iOS |
| `Image(systemName:)` | SwiftUI SF Symbols shorthand |
| `Icons.Filled.*` | Material Icons filled family |
| `Icons.Outlined.*` | Material Icons outlined family |
| `Icons.Rounded.*` | Material Icons rounded family |
| `Icons.Sharp.*` | Material Icons sharp family |
| `Icons.TwoTone.*` | Material Icons two-tone family |
| `MaterialIcon` | Any Material import alias |
| `systemImage:` | SwiftUI Label(systemImage:) |

---

## Motion (from parent context)

Icons themselves carry no animation. Interactive parents may apply:

| Transition | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Scale 0.92× | `--duration-fast` (120ms) | `--ease-decelerated` | Press / tap |
| Color secondary → primary | 150ms | `--ease-standard` | Hover (web / Mac Catalyst) |
| bookmark ↔ bookmarkFill cross-fade + spring | 180ms | spring bounce | Favorite toggle |

---

## Acceptance Criteria

- **AC-01** — `tokens/icons/` contains exactly 34 named SVG files; basenames match `IconName` enum (enforced by `pnpm icons:check`). The catalog grew from 31 → 34 with the addition of `mail`, `lock`, `eye` for auth-screen support.
- **AC-02** — `LSIcon(name: .compass, size: .md)` renders at `--icon-md` with 1.5px rounded stroke; color `.signal` resolves to `--signal-default`.
- **AC-03** — Android renders identical glyph per parity manifest — visual diff tolerance ≤ 2px at 2× density.
- **AC-04** — Post-Sprint-2 grep: zero references to `UIImage(systemName:)` / `Image(systemName:)` / `Icons.Filled.*` / `Icons.Outlined.*` anywhere in the codebase.
- **AC-05** — "Atoms / Icon" sandbox story renders every name × size (5 sizes × 34 glyphs = 170 cells) in a swatch grid on both platforms.
- **AC-06** — iOS XCTest and Android JUnit verify `LSIcon` rejects raw color inputs at type-check and that stroke width resolves from `--stroke-md`.
