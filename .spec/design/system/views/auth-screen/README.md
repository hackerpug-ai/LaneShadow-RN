# auth-screen (UC-SCR-07 — LaneShadow V2 Copper)

## Purpose

AuthScreen is the rider's first interaction with LaneShadow when no session is present —
sign-in or account creation, both behind a single email-first branching flow. The canvas
preserves the warm paper topography from `idle-screen` (visual continuity) but is veiled
behind a soft scrim so the centered auth card pulls focus. Three primary paths are
offered: **Apple**, **Google**, and **email**. The email path is smart: once an email is
entered and the backend resolves whether it's known, the form expands inline — a password
field for returning users (S02), or a display-name + create-password block with a copper
"Create your password" callout for new users (S03). No separate "register" screen is ever
shown; the same view handles both onboarding and re-auth.

The brand voice carries into the headline through Newsreader-italic copper accents:
"Saddle <em>up.</em>", "Welcome <em>back.</em>", "Set <em>up</em> shop." — each variant
swaps the headline to match the rider's state.

---

## Variants

| Variant ID | Description | Theme |
|------------|-------------|-------|
| S01 · Email Entry · Light | Default landing — Apple + Google buttons, "OR CONTINUE WITH EMAIL" divider, empty email field, "Continue" CTA | Light |
| S02 · Existing User · Sign in | Email recognized — green confirmation row replaces email field, password field with leading lock + trailing eye, "Forgot password?" link, "Sign in" CTA | Light |
| S03 · New User · Create Account | Email is new — copper acknowledgement row, sparkle-marked "Create your password" callout, display-name field, password field with helper, "Create account" CTA | Light |
| S04 · Default · Dark | All tokens re-resolve on warm-dark ink; Apple button inverts (paper-50 surface); Google G stays four-color | Dark |
| V01 · Invalid Email · Error | Email field in error state — red border + tinted background + inline error icon and message; CTA stays clickable | Light |
| V02 · Submitting · Loading | Form `aria-busy="true"`; social buttons + email field disabled; primary CTA label collapses to opacity 0 with copper-on-white spinner overlay | Light |

---

## Composes

| Layer | Class | Role in View |
|-------|-------|--------------|
| organism | `org-map-layer` | Canvas concept (paper + faint contours) — view inlines a simplified `view-auth-screen__bg` consistent with the slot contract |
| organism | `org-topbar` | Influence (back button only — view uses a single glass-chip back chevron in a view-local position rather than full topbar nav) |
| molecule | `mol-form-field` | Email + password + display-name form rows — composes label, input wrap, helper / error |
| molecule | `mol-form-field__input-wrap` | Icon adapter — leading mail / lock icon, trailing eye toggle |
| molecule | `mol-input-icon.leading` / `.trailing` | 16px icon slot at `--space-4` from the input edge |
| molecule | `mol-social-btn` | OAuth provider buttons (Apple, Google variants) — sits above the email divider |
| molecule | `mol-social-btn-stack` | Vertical column wrapper for the two providers |
| atom | `ls-btn` | Underlies social buttons + the primary "Continue / Sign in / Create account" CTA |
| atom | `ls-btn--primary` | Copper-filled primary CTA (full-width via view-local `.view-auth-screen__cta`) |
| atom | `ls-input` | Email and password text inputs (default / focused / error / disabled states) |
| atom | `ls-form-field` | Layout skeleton (flex-col, gap `--space-2`) underlying every `mol-form-field` |
| atom | `ls-divider.with-label` | "OR CONTINUE WITH EMAIL" centered separator between social and email paths |
| atom | `ls-spinner.sp-sm` | 16px copper-on-white spinner inside the loading-state CTA (V02) |
| atom | `ls-icon` (catalog) | `compass` (brand mark), `chevL` (back), `mail` (email leading), `lock` (password leading), `eye` (visibility toggle), `sparkle` (new-user callout) — see `atoms/icon/README.md` |
| typography | `.t-opinion-xl` | Headline ("Saddle up.", "Welcome back.", "Set up shop.") |
| typography | `.t-body-md` | Subhead beneath headline |
| typography | `.t-body-sm` | Helper / error text, footer legal, existing-row label, new-prompt body |
| typography | `.t-label-md` | Brand wordmark, form labels |
| typography | `.t-label-sm` | "Edit" / "Forgot password?" links |
| typography | `.t-instr-sm` | Status-bar clock, story ID labels |

---

## Token Recipe

View-level properties applied via `.view-auth-screen*` selectors only:

| Property | Token | Notes |
|----------|-------|-------|
| Phone frame background | `var(--surface-primary)` | Paper-100 light / ink-800 dark |
| Phone frame border | `var(--border-default)` | 1px via `var(--stroke-sm)` |
| Phone frame corner radius | `var(--radius-xl)` | 16px — consistent with all other views |
| Phone frame shadow | `var(--elev-overlay)` | Drops the frame from the section background |
| Background canvas | `var(--map-paper)` | Same paper substrate as idle-screen |
| Contour SVG strokes | `var(--map-contour-faint)` | Lighter than idle to keep auth card forward |
| Background scrim | `var(--surface-overlay)` → `var(--surface-glass)` | Top-to-bottom gradient veil over the canvas |
| Back-button chip background | `var(--surface-glass)` | Frosted glass with `backdrop-filter: blur(8px)` |
| Back-button chip border | `var(--border-glass)` | Translucent edge |
| Brand-mark fill | `var(--signal-whisper)` | Pale copper square (40×40pt) housing the compass icon |
| Brand-mark border | `var(--signal-tint)` | Hairline copper edge |
| Brand-mark icon color | `var(--signal-default)` | Copper compass at `--icon-lg` |
| Headline italic accent | `var(--signal-default)` | "up." / "back." / "up shop." copper italic |
| Subhead color | `var(--content-secondary)` | With `font-style: italic` |
| Existing-user row bg | `color-mix(--status-success 8%, --surface-card)` | Green-tinted confirmation |
| Existing-user row border | `color-mix(--status-success 25%, transparent)` | Green hairline |
| Existing-user check color | `var(--status-success)` | Inline check svg + label color |
| New-user prompt bg | `var(--signal-whisper)` | Pale copper acknowledgement |
| New-user prompt border-left | `var(--stroke-lg) solid var(--signal-default)` | 2px copper accent stripe |
| Password eye-toggle color | `var(--content-tertiary)` | Idle; turns to `var(--status-error)` on error |
| Forgot-password link | `var(--signal-default)` | Copper, `--space-2` margin-top |
| Footer text color | `var(--content-tertiary)` | Plus underlined links at `var(--content-secondary)` |
| Loading-state spinner | overrides `--signal-tint` / `--signal-default` to white-on-copper via `color-mix(--content-on-signal …)` so it reads on the copper button surface |
| Home indicator bar (light) | `rgba(0,0,0,0.38)` | Phone chrome simulation — same exemption as idle-screen |
| Home indicator bar (dark) | `rgba(255,255,255,0.30)` | Same exemption |

---

## Responsive

| Breakpoint | Behavior |
|------------|----------|
| Default (≥ 900px) | Phone frame centered with `var(--space-9)` (40pt) horizontal padding; sections have generous vertical padding `var(--space-11)` |
| Tablet (< 900px) | Phone frame max-width scales to `min(390px, 80vw)`; section padding reduces to `var(--space-6)` |
| Mobile (≤ 375px) | Section padding collapses to `var(--space-4)`; phone frame spans full section inner width; caption header stacks vertically; story annotation text aligns center |

---

## Accessibility

| Element | Role / Landmark |
|---------|----------------|
| `<main>` | `role="main"` — wraps all story sections |
| Story `<section>` | `aria-label="S01 Email Entry Light"` etc. |
| Phone frame | `role="img"` `aria-label="AuthScreen phone preview — [variant]"` |
| Back button | `<button aria-label="Back">` |
| Brand mark | `aria-hidden="true"` (decorative) |
| Headline | `<h2>` — Newsreader opinion type |
| `<form>` | `role="form"` `aria-label="Sign in or create account"` (S01/S04/V01) / `"Sign in"` (S02) / `"Create account"` (S03) |
| Existing-user row | `role="status"` `aria-live="polite"` |
| Email field | `<input type="email" autocomplete="email">` with explicit `<label for>`; in error: `aria-invalid="true"` + `aria-describedby` to error message |
| Password field | `<input type="password" autocomplete="current-password|new-password">` |
| Eye toggle | `<button aria-label="Show password">` (toggles to `"Hide password"` when active) |
| Display-name field | `<input type="text" autocomplete="name">` |
| Primary CTA | `<button>` with descriptive `aria-label`; in loading: `aria-busy="true"` |
| Forgot-password link | `role="button" tabindex="0"` |
| Footer links | Plain `<a>` tags |
| Focus order | Back → Apple → Google → Email → (Password / Name / Password) → CTA → Footer links |

The two-step email-resolution flow is announced via the `role="status"` `aria-live="polite"`
existing-row block, so screen readers narrate the recognized email and the branch (sign-in
vs. create-account) without losing focus position on the inputs.

---

## View-Local Constants

| Property | Value | Reason |
|----------|-------|--------|
| Phone frame `aspect-ratio` | `9 / 19.5` | Canonical iPhone preview proportions — not a spacing token |
| Phone frame `max-width` | `390px` | Canonical iPhone viewport width — not a spacing token |
| Dynamic Island width / height | `112px` / `30px` | iPhone phone-chrome geometry (hardware artefact) |
| Home indicator color | `rgba(0,0,0,0.38)` light / `rgba(255,255,255,0.30)` dark | Device chrome simulation — no semantic equivalent (same exemption as every other view) |
| `backdrop-filter: blur(8px)` on back-chip | `8px` | Visual-effect blur radius — matches `org-topbar` chip blur (consistent with idle-screen) |
| `@media (max-width: 375px)` / `900px` | Pixel literals in `@media` | Responsive breakpoint widths — structural constraint |
| SVG `stroke-width: 0.5 / 0.7` on background contours | `0.5` / `0.7` | SVG attribute — exempt per audit (same precedent as idle/planning-screen) |

---

## Token Cascade

No new design tokens were required to ship `auth-screen`. All recipes resolve to existing
semantic tokens; the dim-paper canvas was achieved by gradient-mixing existing
`--surface-overlay` and `--surface-glass` tokens (no new `--surface-veil-soft` token needed).

The view did surface two cascade requests at the atom + molecule layer:

1. **Icon catalog grew from 31 → 34 glyphs** (`mail`, `lock`, `eye`). The new icons
   support the email-leading slot, password-leading slot, and password visibility toggle.
   They follow the existing 20×20 viewBox / 1.5px outline conventions and add zero brand
   color. See `atoms/icon/README.md` "Icon Catalog — 34 Glyphs".
2. **New molecule `mol-social-button`** (Apple + Google variants). Composes `ls-btn` and
   layers brand-correct chrome via `--ink-900` / `--paper-50` / `--surface-card` tokens.
   The four-color Google G mark uses brand-color SVG fill attributes (exempt per the
   audit's existing SVG-attribute carve-out — `stroke-width` literals on contour SVGs are
   already permitted in `idle-screen` / `planning-screen`). See
   `molecules/social-button/README.md`.

Both extensions are additive and required no changes to existing atom / molecule / organism
selectors.

---

## Quality Bar

- ✅ Zero hex literals in view `<style>` block (brand-color literals on the Google G appear
  only inside inline `<svg>` `fill` attributes, which are exempt per audit policy)
- ✅ Zero numeric `font-size` / `font-weight` / `line-height` / `letter-spacing` declarations —
  typography delegated to `.t-opinion-*`, `.t-title-*`, `.t-body-*`, `.t-label-*`, `.t-instr-*`
- ✅ Zero raw `px` in padding / margin / gap — all use `var(--space-*)` (incl. negative
  `calc(-1 * var(--space-*))` for the optical lift on the "Forgot password?" link)
- ✅ Every variant rendered as its own full-width stacked `<section>` — no `.two-up` panes
- ✅ Each view imports the canonical 7 stylesheets in this order:
  1. `../../typography/fonts.css`
  2. `../../tokens/tokens.css`
  3. `../../typography/type-modules.css`
  4. `../../atoms/_preview.css`
  5. `../../molecules/_atoms.css`
  6. `../../organisms/_molecules.css`
  7. `../_organisms.css`
- ✅ Real auth-flow content throughout — `elena@ridelaneshadow.com`, `jamie.miller@hey.com`,
  no lorem ipsum
- ✅ No `.ls-*`, `.mol-*`, or `.org-*` classes redefined in view `<style>` block — only
  view-local `.view-auth-screen*` selectors
- ✅ Dark variant (S04) uses `data-theme="dark"` on the story's root `<section>` — tokens flip
  via the existing `.mode-dark, [data-theme="dark"]` override in `tokens.css`
- ✅ All inputs carry `<label for>` + `id`; error state wires `aria-invalid` + `aria-describedby`
