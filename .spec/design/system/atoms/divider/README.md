# LSDivider — Atom

**Family:** Display atoms (UC-ATM-04)
**Status:** Spec complete

## Description

A purely decorative structural separator. Renders as a 1px `border.subtle` hairline.
Display-only — no interaction, no focus, no press states.

Accessibility: mark as `role="separator"` so screen readers identify it as structural,
not focusable content.

## Variants

| Variant | Class | Description |
|---------|-------|-------------|
| Plain | `.ls-divider` | Full-width 1px horizontal rule |
| With label (centered) | `.ls-divider.with-label` | Lines flank a centered text label |
| With label (left-aligned) | `.ls-divider.with-label.label-left` | Label at left, rule extends right only |

## Tokens Consumed

| Token | Role |
|-------|------|
| `--border-subtle` | Hairline color |
| `--content-tertiary` | Label text color |
| `--font-ui` | Label typeface |
| `--space-4` | Gap between label and lines |

## Label Typography

Labels use `.t-label-md` style: `--font-ui` / 600 / 9.5px / 0.12em tracking / uppercase.

## Quality Bar

- Zero hex in divider CSS
- Zero raw px in spacing (all via `--space-*` tokens)
- Both themes rendered in preview
- Plain, centered-label, and left-label variants all shown
