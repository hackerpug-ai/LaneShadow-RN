# social-button

LaneShadow V2 Copper · Molecule · Authority: uc-mol-09-social-button.html (auth-flow extension introduced for UC-SCR-07 AuthScreen)

## Purpose

LSSocialButton wraps the canonical `ls-btn` atom (UC-ATM-02) with provider-specific brand
chrome — surface, label color, hairline border — and a brand-correct mark slot. It is the
only component permitted to render OAuth provider login affordances, so brand fidelity is
enforced in one place. Two variants ship at MVP: **Apple** and **Google**.

## Anatomy

```
button.ls-btn.mol-social-btn.mol-social-btn--{provider}
  span.mol-social-btn__mark           ← 18px brand-mark slot (inline SVG; replaces .btn-icon)
    svg                               ← brand-correct provider glyph
  span.mol-social-btn__label          ← Geist 14/600 — inherited from .ls-btn
```

The molecule lives on the same element as `.ls-btn`; the molecule classes do not redefine
height, padding, radius, font-family, font-weight, or transitions — those flow from the
atom. Only background, color, and border are overridden by the variant.

The optional `.mol-social-btn-stack` wrapper composes a vertical column of providers with
`--space-3` (8px) gaps; this is what `auth-screen` uses.

## Variants

| Variant | Class | Surface (light) | Surface (dark) | Label | Border | Mark |
|---|---|---|---|---|---|---|
| Apple | `--apple` | `var(--ink-900)` | `var(--paper-50)` | `var(--paper-50)` / `var(--ink-900)` | matches surface | wordmark glyph in `currentColor` |
| Google | `--google` | `var(--surface-card)` | `var(--surface-card)` (ink-700) | `var(--content-primary)` | `var(--border-default)` 1px | four-color "G" via SVG fills |

Apple inverts on dark per Apple HIG (the system always picks the higher-contrast surface).
Google keeps a card surface and adds a 1px hairline border so the white mark area reads
distinctly on both themes.

## States

| State | Class | Behavior |
|---|---|---|
| default | _(none)_ | Resting; surface as documented above |
| hover | `.is-hover` | Apple → ink-800 / paper-100; Google → surface-inset / ink-600 |
| pressed | `.is-pressed` | Apple → ink-700 / paper-200; Google → paper-300 / ink-500; +1px translateY |
| focused | `.is-focused` | Adds 3px border-focus glow ring (copper at 20–35% mix) |
| disabled | `.is-disabled` / `[disabled]` | Apple opacity `--opacity-disabled` (0.38); Google opacity 0.55 to keep label legible |

All states inherit the atom's `--duration-fast` × `--ease-standard` transition.

## Atoms Used

| Atom | Class | Role |
|---|---|---|
| LSButton | `.ls-btn` (UC-ATM-02) | Underlying button — provides height, padding, radius, font, motion |

The molecule does not consume the `ls-icon` atom — brand marks are inline `<svg>` because
they require brand-correct stroke/fill semantics that the `ls-icon` system (1.5px outline,
`currentColor` only) cannot express for multi-color marks.

## Token Recipe

| Property | Token |
|---|---|
| Width | `100%` (full-width column) |
| Mark slot size | `var(--icon-md)` (18px) |
| Mark/label gap | `var(--space-3)` (8px) — inherits `.ls-btn` `gap` |
| Stack gap (`mol-social-btn-stack`) | `var(--space-3)` (8px) |
| Apple surface (light) | `var(--ink-900)` |
| Apple surface (dark) | `var(--paper-50)` |
| Apple label | `var(--paper-50)` (light) / `var(--ink-900)` (dark) |
| Google surface | `var(--surface-card)` |
| Google label | `var(--content-primary)` |
| Google border | `var(--stroke-sm) solid var(--border-default)` |
| Disabled opacity (Apple) | `var(--opacity-disabled)` (0.38) |
| Disabled opacity (Google) | `0.55` (matches secondary/outline button molecule policy) |
| Focus ring | `var(--border-focus)` 3px @ 20–35% mix |

## Brand-color exemption

The Google "G" mark contains four brand-mandated color literals (`#4285F4`, `#34A853`,
`#FBBC05`, `#EA4335`) inside its inline SVG `fill` attributes. These are SVG attributes,
not CSS spacing or typography literals, and are explicitly exempt under the system audit
policy that already permits `stroke-width: 0.7 / 0.9` SVG geometry exceptions in the
planning-screen view. The molecule's CSS `<style>` block contains zero hex literals.

The Apple wordmark glyph paints with `currentColor` and so carries no brand-color literal —
its color flows from the variant's `color` property (`var(--paper-50)` / `var(--ink-900)`).

## Variant fidelity notes

- **Apple HIG**: "Sign in with Apple" must use one of three prescribed color combos
  (black-on-white, white-on-black, or outline-only). We render black-on-white (light) and
  white-on-black (dark) — the most common pairing.
- **Google brand guidelines**: The four-color G mark must appear on a white-equivalent
  surface with a 1px border. Our `--surface-card` token resolves to `--paper-50` (light)
  and `--ink-700` (dark); the G mark is locked at four-color regardless of theme so brand
  recognition holds across modes.

## Accessibility

- Root: `<button type="button">` with `aria-label="Continue with {Provider}"`
- Mark slot: `aria-hidden="true"` — decorative; the label carries the affordance
- Focus ring: 3px `--border-focus` mix — meets WCAG 2.4.11 enhanced focus visibility
- Disabled: native `disabled` attribute; CSS `pointer-events: none` and reduced opacity
- Touch target: ≥ 44×44pt (iOS) / 48×48dp (Android) inherited from `.ls-btn` height

## Composition Strategy

The molecule layers brand chrome onto the atom; it never redefines the atom's structural
contract. This means the auth-screen view can mix social buttons with the standard
`.ls-btn--primary` ("Continue with email") and `.ls-btn--ghost` ("Use a different email")
in the same vertical stack and they all share height, radius, motion, and focus behavior.

## Usage in views

| View | Usage |
|---|---|
| `auth-screen` (UC-SCR-07) | Vertical stack of Apple + Google above the divider, "Continue with email" `ls-btn--primary` below |

## Quality Bar

- ✅ Zero hex literals in molecule `<style>` block (brand colors live only inside inline SVG)
- ✅ Zero numeric `font-size` / `font-weight` / `font-family` declarations — typography flows from `.ls-btn`
- ✅ Zero raw px in padding / margin / gap / border-radius — all use `var(--space-*)`, `var(--radius-*)`, `var(--stroke-*)`
- ✅ Both light and dark themes rendered via stacked `.two-up` panes
- ✅ Self-contained HTML — links only `../../typography/fonts.css`, `../../tokens/tokens.css`, `../../typography/type-modules.css`, `../../atoms/_preview.css`, `../_atoms.css`
- ✅ Real auth-flow content throughout — no lorem ipsum
- ✅ No `.ls-btn` atom selectors redefined
