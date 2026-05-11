# org-nav-message + org-inline-error — LSNavigatorMessage + LSInlineErrorCallout

**Authority:** [`uc-org-03-navigator-message-error-callout.html`](../../../../prds/v2/concepts/uc-org-03-navigator-message-error-callout.html) · [`07-uc-org.md §UC-ORG-03`](../../../../prds/v2/07-uc-org.md)

Two Navigator-specific callout organisms. Both use a top-border accent + opinion typography + compass chip + glass surface. They differ only in accent color and trailing content: NavigatorMessage carries copper signal + optional route attachments + pin/close actions; ErrorCallout carries warning amber + optional detail line + suggestion chips.

## Purpose

- **LSNavigatorMessage** — the branded AI callout used whenever the Navigator produces a response (with or without route attachments). Lives in `LSMapLayer.topOverlays`. Auto-dismisses after 5000ms unless `pinned`.
- **LSInlineErrorCallout** — the in-conversation recovery callout shown on `ErrorScreen`. Swaps the copper accent for a warning amber, adds an optional detail line, and surfaces `LSSuggestionChip` rows so the rider can recover without retyping.

## Anatomy — NavigatorMessage

```html
<div class="org-nav-message">
  <div class="org-nav-message__head">
    <span class="org-nav-message__compass">…compass svg…</span>
    <div class="org-nav-message__text">
      <div class="t-label-sm org-nav-message__label">The Navigator</div>
      <div class="t-body-md org-nav-message__body">…opinion body…</div>
    </div>
    <div class="org-nav-message__actions">
      <button class="org-nav-message__action [--active]">pin svg</button>
      <button class="org-nav-message__action">close svg</button>
    </div>
  </div>
  <!-- optional: attachments list -->
  <div class="org-nav-message__attachments">
    <div class="mol-route-attachment-card is-selected v-best">…</div>
    <div class="mol-route-attachment-card v-alt1">…</div>
    …
  </div>
  <!-- optional (when pinned): -->
  <div class="org-nav-message__pinned-bar">
    <span class="org-nav-message__pinned-dot"></span>
    <span class="t-label-sm">Pinned — will not auto-dismiss</span>
  </div>
</div>
```

## Anatomy — InlineErrorCallout

```html
<div class="org-inline-error">
  <div class="org-inline-error__head">
    <span class="org-inline-error__compass">…compass svg…</span>
    <div class="org-inline-error__text">
      <div class="t-label-sm org-inline-error__label">The Navigator</div>
      <div class="t-body-md org-inline-error__body">…error body…</div>
      <div class="t-body-sm org-inline-error__detail">…optional detail…</div>
    </div>
  </div>
  <!-- optional: suggestions row -->
  <div class="org-inline-error__suggestions">
    <button class="ls-pill pill-md mol-suggestion-chip is-primed">Try inland</button>
    <button class="ls-pill pill-md mol-suggestion-chip">End at Big Sur</button>
  </div>
</div>
```

## Variants

### NavigatorMessage

| Variant | Composition notes |
|---|---|
| Message only | head row + opinion body + pin/close actions |
| With one attachment | adds `org-nav-message__attachments` with one `.mol-route-attachment-card.is-selected` |
| With three attachments | three cards; first `is-selected`, alts use `v-alt1`/`v-alt2` variant stripes |
| Pinned | `.org-nav-message__action--active` on pin button + `.org-nav-message__pinned-bar` footer |
| Long body | same anatomy; container flexes vertically |

### InlineErrorCallout

| Variant | Composition notes |
|---|---|
| Error only | head row + body |
| With detail | adds `.org-inline-error__detail` after body |
| With suggestions | adds `.org-inline-error__suggestions` row of `.mol-suggestion-chip` buttons; primary chip uses `.is-primed` |
| Long body + long suggestions | head + body + detail + 3+ chips; row wraps |

## States

- **Pin action**: `.org-nav-message__action` + `.--active` modifier inverts icon fill and resolves color to `var(--signal-default)`.
- **Pinned banner**: conditionally rendered when `pinned = true`; contains a `.org-nav-message__pinned-dot` indicator.
- **Suggestion chip primed**: `.mol-suggestion-chip.is-primed` tints the chip amber (warning) via the molecule's own primed state.

## Composes

| Tier | Consumer | Role |
|---|---|---|
| Atom | `LSPill` (`.ls-pill.pill-md`) | Base of suggestion chips |
| Molecule | `LSRouteAttachmentCard` (`.mol-route-attachment-card`) | Attachment rows under NavMessage |
| Molecule | `LSSuggestionChip` (`.mol-suggestion-chip`) | Suggestion row under ErrorCallout |
| Typography module | `.t-label-sm` | "THE NAVIGATOR" label + pinned label + chip labels |
| Typography module | `.t-body-md` | Opinion body (via `font-family: var(--font-opinion)` override) |
| Typography module | `.t-body-sm` | Detail line (error callout) |
| Typography module | `.t-title-sm`, `.t-instr-sm` | Attachment title / metrics (inherited from `mol-rac__*`) |
| Atom (inline SVG) | `LSIcon(.compass, .bookmark, .close)` | Chip + action icons |

## Atoms / molecules used

| Atom / Molecule | Role |
|---|---|
| `.mol-route-attachment-card` (v-best/v-alt1/v-alt2, is-selected) | Attachment list under NavMessage |
| `.mol-suggestion-chip` (is-primed / default) | Suggestion row under ErrorCallout |
| `.ls-pill` (pill-md) | Base pill for suggestion chips |
| Inline SVG | Compass, bookmark, close icons |

## Token recipe — NavigatorMessage

| Property | Token |
|---|---|
| container `background` | `var(--surface-glass)` |
| container `border` | `var(--stroke-sm) solid var(--signal-tint)` |
| container `border-top` | `var(--stroke-lg) solid var(--signal-default)` |
| container `border-radius` | `var(--radius-lg)` |
| container `padding` | `var(--space-4)` |
| container `box-shadow` | `var(--elev-overlay)` |
| head `gap` | `var(--space-3)` |
| head `margin-bottom` | `var(--space-3)` |
| compass size | `var(--space-7)` — 24pt |
| compass `background` | `var(--signal-whisper)` |
| compass `border` | `var(--stroke-sm) solid var(--signal-tint)` |
| compass `color` | `var(--signal-default)` |
| body `font-family` | `var(--font-opinion)` |
| body `color` | `var(--content-primary)` |
| action size | `var(--space-7)` — 24pt |
| action default `color` | `var(--content-tertiary)` |
| action active `color` | `var(--signal-default)` |
| attachments `gap` | `var(--space-2)` |
| pinned-bar `color` | `var(--signal-default)` |
| pinned-bar `border-top` | `var(--stroke-sm) solid var(--signal-tint)` |
| pinned-dot size | `var(--space-2)` — 4pt |
| pinned-dot `background` | `var(--signal-default)` |

## Token recipe — InlineErrorCallout

| Property | Token |
|---|---|
| container `background` | `var(--surface-glass)` |
| container `border` | `var(--stroke-sm) solid var(--status-warning-tint)` |
| container `border-top` | `var(--stroke-lg) solid var(--status-warning)` |
| container `border-radius` | `var(--radius-lg)` |
| container `padding` | `var(--space-4)` |
| container `box-shadow` | `var(--elev-overlay)` |
| compass `background` | `var(--status-warning-tint)` |
| compass `border` | `var(--stroke-sm) solid var(--status-warning)` |
| compass `color` | `var(--status-warning)` |
| label `color` | `var(--status-warning)` |
| label pseudo-dot | `var(--space-2)` / `var(--status-warning)` |
| body `font-family` / `color` | `var(--font-opinion)` / `var(--content-primary)` |
| detail `color` | `var(--content-secondary)` |
| suggestions `border-top` | `var(--stroke-sm) dashed var(--status-warning-tint)` |

## Motion references

| Trigger | Recipe | Effect |
|---|---|---|
| Navigator produces a message | `chatOverlayEnter` | Slides down from `y:-20`, fades 0→1 (280ms spring) |
| 5000ms elapsed, `pinned:false` | `chatOverlayDismiss` | Fades 1→0, slides up (220ms ease-out). Skipped when pinned. |
| Rider taps map area | `mapTapDismiss` | Same as `chatOverlayDismiss` triggered on tap |

Both organisms share the same entrance/exit recipes. `ErrorCallout` has no auto-dismiss — the rider explicitly moves on.

## Accessibility

- Both organisms should be rendered with `role="status"` (or `role="alert"` for the error callout) so screen readers announce the content without requiring focus.
- The compass icon is decorative (`aria-hidden="true"`); the semantic is carried by the `.t-label-sm` "THE NAVIGATOR" label + the body text.
- Pin and close buttons need explicit `aria-label`s: "Pin message" / "Dismiss message". The active state (pinned) should toggle `aria-pressed="true"`.
- Suggestion chips are `<button>` elements with descriptive labels; `.is-primed` surfaces the recommended chip and should map to `aria-describedby` pointing to a "recommended" helper span if needed.

## Organism-local constants

| Property | Value | Reason |
|---|---|---|
| `backdrop-filter: blur(16px) saturate(1.2)` | — | Visual-effect blur radius (not a spacing token); matches molecule-level glass treatment. |
| `min-width: 0` on text containers | — | Enables text truncation inside flex children; structural, not stylistic. |
| Dashed border-top on suggestions row | `dashed` | A stylistic choice to soften the separator between primary error content and recovery chips — not tokenizable. |

Every color / spacing / radius / elevation resolves to a token.

## Relationship to `.ls-glass-panel--callout-*`

The system's `.ls-glass-panel--callout-signal` / `--callout-warning` variants render a *left* stripe accent, not a *top* border. The concept spec for UC-ORG-03 uses a top-border accent to match the on-map readout where content flows downward. Because the anatomy differs at the border level, these two organisms define their own container surface rather than composing `.ls-glass-panel`. They still consume the same tokens (`--surface-glass`, `--elev-overlay`, `--border-glass`-like semantic) so the visual family stays intact.

## How to preview

Open `organisms/navigator-callouts/navigator-callouts.html` in a browser — every story renders in both light and dark `theme-pane`s with a Mapbox-backed scene behind the callout, self-contained.
