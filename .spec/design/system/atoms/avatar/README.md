# LSAvatar — Atom

**Family:** Display atoms (UC-ATM-04)
**Status:** Spec complete

## Description

A circular display primitive that shows rider identity. Supports three variants:
- **image** — photo fills the circle via `object-fit: cover`
- **initials** — one or two letters on a signal-whisper tinted background
- **placeholder** — gradient fill when no image or initials are provided

## Sizes

| Size | Token | Rendered diameter |
|------|-------|-------------------|
| xs | `--avatar-xs` | 20px |
| sm | `--avatar-sm` | 28px |
| md | `--avatar-md` | 36px |
| lg | `--avatar-lg` | 48px |
| xl | `--avatar-xl` | 64px |

## Tokens Consumed

| Token | Role |
|-------|------|
| `--avatar-xs/sm/md/lg/xl` | Diameter |
| `--surface-card` | Placeholder background |
| `--signal-whisper` | Initials background |
| `--signal-tint` | Initials border |
| `--border-subtle` | Default image border |
| `--content-primary` | Initials text color |
| `--radius-pill` | Circle rounding |
| `--font-ui` | Initials typeface |
| `--status-success` | Online indicator dot |
| `--surface-primary` | Dot separator ring |

## Variants

- **`.ls-avatar`** — base class (always present)
- **`.ls-avatar.initials-variant`** — signal-whisper bg, signal-tint border, initials child span
- **Size modifier:** `.xs` `.sm` `.md` `.lg` `.xl`

## Composition

Wrap with `.avatar-wrap.{size}` to attach a `.avatar-status-dot` online indicator.

## Quality Bar

- Zero hex in avatar CSS
- Zero raw px in sizing (all via `--avatar-*` tokens)
- Both themes rendered in preview
- Initials font-size proportional to size step
