# chat-input

LaneShadow V2 Copper · Molecule · Authority: uc-mol-06-chatinput.html

## Purpose

`LSChatInput` is the Navigator's primary interaction surface — a bottom-anchored conversational input row pinned `12pt` from the device bottom and `12pt` from each side. It layers three stacks from bottom to top: the **input bar** (always present), an optional **suggestion chip row**, and an optional **location context bar**. The input bar is backed by glass-panel chrome at 54pt height with `radius-xl` (18pt). Leading contains a 36pt ghost collapse/attachment button; trailing switches between a 42pt ghost filter button (empty state) and a 42pt copper primary send button (text present). A spinner replaces the trailing slot during agent thinking.

## Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│  [location context bar — optional]                               │
│    ┌──────────────────────────────────────┐                      │
│    │ [pin dot]  Near Sugar House, UT       │   [AUTO]            │
│    └──────────────────────────────────────┘                      │
├──────────────────────────────────────────────────────────────────┤
│  [suggestion chip row — optional, horizontally scrollable]       │
│    [Twisty back roads]  [Avoid highway]  [Scenic route]  ...     │
├──────────────────────────────────────────────────────────────────┤
│  [input bar — always present]              height: 54pt          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ [chat-btn 36pt ghost] │ [text field — flex-1] │ [btn 42pt] │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ^  collapse / attach                           ^ filter OR send  │
└──────────────────────────────────────────────────────────────────┘
```

| Element | Class | Role |
|---|---|---|
| Stack root | `.mol-chat-input` | Flex column wrapping all three layers |
| Location bar | `.mol-chat-input__location-bar` | Optional top row: location pill + mode label |
| Location pill | `.mol-chat-input__location-pill` | Glass pill with pin dot + place name |
| Pin dot | `.mol-chat-input__pin-dot` | 6pt copper dot |
| Mode label | `.mol-chat-input__mode-label` | Uppercase label pill (AUTO / MANUAL) |
| Suggestion row | `.mol-chat-input__sugg-row` | Horizontally scrollable chip strip |
| Suggestion chip | `.mol-chat-input__sugg-chip` | Single tappable glass chip |
| Input bar | `.mol-chat-input__bar` | 54pt glass pill row |
| Leading button | `.mol-chat-input__leading-btn` | 36pt ghost icon button (collapse/attach) |
| Text field | `.mol-chat-input__field` | Flex-1 text display area |
| Trailing filter | `.mol-chat-input__filter-btn` | 42pt ghost icon button (empty state) |
| Trailing send | `ls-btn ls-btn--chat-send` | 42pt copper send button (active state) |
| Trailing spinner | `.mol-chat-input__spinner` | 42pt thinking indicator (thinking state) |

## Variants

| Variant | Class modifier | Description |
|---|---|---|
| Idle (empty) | (default) | Empty field, placeholder visible, filter button trailing |
| Typing | `.is-active` on `__bar` | Non-empty field, send button replaces filter |
| Thinking | `.is-thinking` on `__bar` | Spinner replaces trailing, leading dimmed, field italic |
| Disabled | `.is-disabled` on `.mol-chat-input` | Full stack at `opacity-disabled`, no interaction |
| Refining | `.is-active` on `__bar`, long value | Overflow ellipsis in field, send shown |
| With suggestions | (default) | `__sugg-row` present above bar |
| With location | (default) | `__location-bar` present above suggestions |
| Bar only | (no sugg/location children) | Minimal — bar rendered alone |

## States

| State class | Applied to | Effect |
|---|---|---|
| `.is-active` | `.mol-chat-input__bar` | Swaps `__filter-btn` for `ls-btn--chat-send` |
| `.is-thinking` | `.mol-chat-input__bar` | Shows `__spinner`, hides both trailing buttons, dims leading |
| `.is-disabled` | `.mol-chat-input` | `opacity: var(--opacity-disabled); pointer-events: none` |
| `.is-focused` on `__bar` | `.mol-chat-input__bar` | `border-color: var(--border-focus)` ring |
| `has-value` on `__field` | `.mol-chat-input__field` | `color: var(--content-primary); font-weight: 500` |

## Atoms Used

| Atom | Class | Usage |
|---|---|---|
| Button — chat-send | `ls-btn ls-btn--chat-send` | 42pt copper send button (active trailing) |
| Button — ghost | `ls-btn ls-btn--ghost ls-btn--icon-only` | Leading 36pt and trailing 42pt ghost icon buttons |
| Glass panel chrome | visual basis via `--surface-glass` + `backdrop-filter` | Input bar background, pills, chips |

## Token Recipe

| Property | Token |
|---|---|
| Stack gap | `--space-3` (8px) |
| Bar height | `56px` (54pt — no sizing token at 54; uses literal height constrained by spec) |
| Bar background | `--surface-glass` |
| Bar border | `var(--stroke-sm)` solid light: `rgba(255,255,255,0.55)` / dark: `var(--border-default)` |
| Bar border-radius | `--radius-xl` (16px closest; spec calls for 18pt — see Notes) |
| Bar shadow | `--elev-chrome` |
| Bar padding | `0 var(--space-2) 0 var(--space-5)` (right 6px / left 14px per spec) |
| Bar gap | `--space-3` (8px) |
| Leading button size | `--size-control-md` (36px) |
| Trailing button size | `--size-control-lg` (48px — outer touch target; inner 42px per spec) |
| Field text | `.t-body-md` (12px Geist 400) |
| Field placeholder color | `--content-tertiary` |
| Field active color | `--content-primary` |
| Pill/chip background | `--surface-glass` |
| Pill/chip radius | `--radius-pill` |
| Pin dot size | `var(--space-2)` × `var(--space-2)` (4px) + `var(--space-1)` supplement → 6pt per spec |
| Pin dot color | `--signal-default` |
| Suggestion chip padding | `var(--space-3) var(--space-4)` |
| Suggestion chip text | `.t-body-sm` (10.5px Geist 500) |
| Spinner arc color | `--signal-default` |
| Spinner track color | `--border-default` |
| Disabled opacity | `--opacity-disabled` (0.38) |
| Motion duration | `--duration-fast` (120ms) |
| Motion easing | `--ease-standard` |

## Accessibility

- The input bar must render as `<div role="textbox" aria-multiline="false" aria-label="Chat input">` when used as a display-only component, or as a native `<input type="text">` / `<textarea>` in an interactive context.
- Leading button: `aria-label="Collapse chat"` (or `"Add attachment"` depending on context).
- Filter button: `aria-label="Filter rides"`.
- Send button: `aria-label="Send message"` — disabled (`aria-disabled="true"`) in idle state.
- Suggestion chips: each chip is `role="button"` with `aria-label` matching chip text.
- Location pill: `aria-label="Current location: {place name}"`.
- When the thinking state is active, an `aria-live="polite"` region announces "Planning your ride…" to screen readers.
- **Keyboard — input context:**
  - `Enter` → submit (send). `Shift+Enter` → new line (multi-line mode).
  - `Escape` → blur field, collapse suggestion row.
  - `Tab` → focus cycles: field → filter/send button → leading button → next element.
  - When keyboard raises on iOS/Android, the bar scrolls with the keyboard (see Safe Area section).
- Focus ring on `__bar`: `border-color: var(--border-focus)` + `box-shadow: 0 0 0 3px color-mix(in srgb, var(--border-focus) 20%, transparent)`.

## Safe Area & Keyboard Avoidance Notes

Per global memory (keyboard avoidance pattern): **all inputs must be wrapped in a bottom sheet with `KeyboardAvoidingInput`**.

- In the React Native implementation, `LSChatInput` must live inside a `<KeyboardAvoidingView behavior="padding">` (iOS) or `behavior="height"` (Android), with `keyboardVerticalOffset` accounting for the safe area inset.
- The bottom anchor `12pt` gap is measured from the **safe area bottom edge** (Dynamic Island / home indicator zone), not from the physical screen bottom.
- On iOS, add `paddingBottom: insets.bottom` from `useSafeAreaInsets()` to the stack root.
- On Android, the `WindowInsetsCompat.Type.ime()` listener drives bottom padding dynamically.
- The HTML preview uses `.mol-chat-input-preview-frame` to simulate this anchoring — this class is **demo-only** and must not be used in production layout.

## Notes

- **`.mol-chat-input-preview-frame`** is a demo scaffold helper defined in `<style>` inside `chat-input.html`. It renders a fixed-height container with `surface-primary` background to simulate the anchored phone viewport. It is not part of the molecule's public API and must not appear in production markup.
- The spec calls for 18pt border-radius on the input bar. The token system's nearest value is `--radius-xl` (16px). The molecule CSS sets `border-radius: 18px` as a one-off literal consistent with the concept; this should be reconciled with the token system if a `--radius-2xl` token is added. **TOKEN_GAP: `--radius-2xl` (18px) is not yet defined in tokens.css.**
- The trailing slot swap (filter ↔ send ↔ spinner) is driven by presence/absence of CSS classes: no JavaScript required for the preview. In React Native, these are conditional renders.
- Suggestion chips use `scrollbar-width: none` / `::-webkit-scrollbar { display: none }` for a native-feel horizontal scroll strip.
- The backdrop-filter on glass elements degrades gracefully: browsers that do not support it fall back to `--surface-overlay` (opaque).
- Dark mode is activated by adding `.mode-dark` to `<html>` or `<body>`. The molecule's glass elements automatically shift to the dark `--surface-glass` token.
- The location context bar and suggestion row are optional children — their absence does not break the layout. The input bar must always be present.
