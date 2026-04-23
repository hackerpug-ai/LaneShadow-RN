# LSSpinner — Atom

**Family:** Display atoms (UC-ATM-04)
**Status:** Spec complete

## Description

An indeterminate circular loading indicator. Animates indefinitely via CSS keyframes
at `--duration-deliberate` (600ms) with `--ease-linear`. Uses `--signal-default`
(copper) as the active arc color, `--signal-tint` as the track.

Must be **removed from the tree** (not hidden) when loading resolves — keeping an
invisible animated element wastes GPU resources.

Accessibility: set `aria-label="Loading"` or equivalent on the containing element,
not on the spinner itself.

## Sizes

| Size | Token | Diameter | Border width |
|------|-------|----------|-------------|
| sm | `--icon-sm` | 16px | `--stroke-md` (1.5px) |
| md | `--icon-lg` | 24px | `--stroke-md` (1.5px) |
| lg | `--icon-xl` | 32px | `--stroke-lg` (2px) |

## Tokens Consumed

| Token | Role |
|-------|------|
| `--icon-sm / --icon-lg / --icon-xl` | Diameter per size step |
| `--signal-default` | Active arc (top border) |
| `--signal-tint` | Track (remaining border) |
| `--stroke-md` | Border width sm/md |
| `--stroke-lg` | Border width lg |
| `--radius-pill` | Circle rounding |
| `--duration-deliberate` | Animation duration (600ms) |
| `--ease-linear` | Animation timing function |

## Animation

```css
@keyframes ls-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
animation: ls-spin var(--duration-deliberate) var(--ease-linear) infinite;
```

## Quality Bar

- Zero hex in spinner CSS
- Zero raw px in sizing (all via `--icon-*` tokens)
- Zero numeric duration or easing values (all via motion tokens)
- Both themes rendered in preview
- All three sizes shown in isolation and in loading card context
